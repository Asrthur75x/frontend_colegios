import { getSession, hasPermission, SESSION_EVENT } from '../../lib/auth/session';
import { startHorario, getHorarioProgress, generationAssignments } from '../../services/horarios';

const GENERATION_STEPS = [
    { id: 'init', label: 'Preparando la generación…' },
    { id: 'validating', label: 'Leyendo los datos del colegio…' },
    { id: 'modeling', label: 'Construyendo el horario…' },
    { id: 'solving', label: 'Buscando una solución…' },
    { id: 'done', label: 'Guardando el resultado…' },
];
const LOADING_MESSAGES = GENERATION_STEPS.map(step => step.label);
const POLL_MS = 3000;
const PREFIX = 'horarix.generation.v2:';
const blank = () => ({ status: null, taskId: null, loadingStep: 0, progressStep: 'init', progressPercent: 0,
    progressMessage: LOADING_MESSAGES[0], errorMsg: null, asignaciones: null, canResume: false, startedAt: 0 });
const makeRoot = () => ({ scope: null, state: blank(), listeners: new Set(), running: false, token: 0 });
const serverRoot = makeRoot();

function sessionScope() {
    const session = getSession();
    return session ? JSON.stringify([session.user.schema_name, session.user.id]) : null;
}

function getRoot() {
    if (typeof window === 'undefined') return serverRoot;
    if (!window.__horarix_generation_v2) {
        window.__horarix_generation_v2 = makeRoot();
        window.addEventListener(SESSION_EVENT, () => {
            const root = getRoot();
            notify(root);
            resume(root);
        });
    }
    const root = window.__horarix_generation_v2;
    const scope = sessionScope();
    if (root.scope !== scope) {
        root.token += 1;
        root.running = false;
        root.scope = scope;
        root.state = blank();
        if (scope) {
            try {
                const saved = JSON.parse(window.sessionStorage.getItem(PREFIX + scope) || 'null');
                if (saved && typeof saved.taskId === 'string') root.state = { ...blank(), ...saved };
            } catch { /* A corrupt or unavailable cache must not block the page. */ }
        }
    }
    return root;
}

function notify(root) {
    if (root !== getRoot()) return;
    try {
        if (root.scope) window.sessionStorage.setItem(PREFIX + root.scope, JSON.stringify(root.state));
    } catch { /* Persistence is optional. */ }
    root.listeners.forEach(listener => {
        try { listener({ ...root.state }); } catch (error) { console.error(error); }
    });
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function emitDone(success) {
    window.dispatchEvent(new CustomEvent('edusync_generacion_done', { detail: { success } }));
    if (success) window.dispatchEvent(new Event('horarix_data_updated'));
}

async function follow(root) {
    if (root.running || !root.state.taskId || !hasPermission('horarios:horario:view')) return;
    root.running = true;
    const token = root.token;
    const scope = root.scope;
    const current = () => token === root.token && scope === sessionScope();
    let failures = 0;
    try {
        while (current()) {
            if (Date.now() - root.state.startedAt > 30 * 60_000) {
                throw Object.assign(new Error('Se agotó el tiempo de seguimiento. Puedes reanudar la consulta de esta tarea.'), { resumable: true });
            }
            let progress;
            try {
                progress = await getHorarioProgress(root.state.taskId);
                failures = 0;
            } catch (error) {
                if (!current()) return;
                if (error.status === 429) {
                    root.state.progressMessage = 'Límite temporal de consultas. El seguimiento se reanudará automáticamente.';
                    notify(root);
                    await wait(Math.max(POLL_MS, (error.retryAfter || 60) * 1000));
                    continue;
                }
                if ((!error.status || error.status >= 500) && ++failures < 5) {
                    root.state.progressMessage = 'No se pudo consultar el progreso. Reintentando…';
                    notify(root);
                    await wait(POLL_MS * failures);
                    continue;
                }
                error.resumable = !error.status || error.status >= 500;
                throw error;
            }
            if (!current()) return;
            if (progress.status === 'done') {
                root.state.asignaciones = generationAssignments(progress.resultado);
                Object.assign(root.state, { status: 'success', progressPercent: 100, loadingStep: 4,
                    progressStep: 'done', progressMessage: 'Horario generado.', canResume: false });
                notify(root);
                emitDone(true);
                return;
            }
            if (progress.status === 'error') throw new Error(progress.message || 'El motor no pudo generar el horario.');
            if (progress.status === 'not_found') throw new Error('La tarea no existe o expiró. Vuelve a iniciar la generación.');
            if (!['starting', 'running'].includes(progress.status)) throw new Error('El servidor devolvió un estado de generación desconocido.');
            const step = ({ extracting: 1, preprocessing: 2, modeling: 2, solving: 3, metrics: 3, saving: 4 })[progress.step] ?? 0;
            Object.assign(root.state, { loadingStep: step, progressStep: GENERATION_STEPS[step].id,
                progressPercent: Math.max(0, Math.min(100, Number(progress.percent) || 0)),
                progressMessage: progress.message || LOADING_MESSAGES[step] });
            notify(root);
            await wait(POLL_MS);
        }
    } catch (error) {
        if (!current()) return;
        Object.assign(root.state, { status: 'error', errorMsg: error.message, canResume: Boolean(error.resumable) });
        notify(root);
        emitDone(false);
    } finally {
        if (token === root.token) root.running = false;
    }
}

function resume(root) {
    if (root.state.status === 'generating' && root.state.taskId) void follow(root);
}

export function subscribe(listener) {
    const root = getRoot();
    root.listeners.add(listener);
    listener({ ...root.state });
    resume(root);
    return () => root.listeners.delete(listener);
}

export function isGenerating() { return getRoot().state.status === 'generating'; }
export function getGeneracionState() { return { ...getRoot().state }; }
export function clearResult() {
    const root = getRoot();
    if (root.state.status === 'generating') return;
    root.token += 1;
    root.running = false;
    root.state = blank();
    notify(root);
}

export async function startGeneracion() {
    const root = getRoot();
    if (root.running) return;
    if (!hasPermission('horarios:horario:add') || !hasPermission('horarios:horario:view')) {
        root.state.status = 'error';
        root.state.errorMsg = 'No tienes permiso para generar y consultar horarios.';
        notify(root);
        return;
    }
    if (root.state.taskId && (root.state.status === 'generating' || root.state.canResume)) {
        Object.assign(root.state, { status: 'generating', errorMsg: null, startedAt: Date.now() });
        notify(root);
        await follow(root);
        return;
    }
    root.token += 1;
    const token = root.token;
    const scope = root.scope;
    root.running = true;
    root.state = { ...blank(), status: 'generating', startedAt: Date.now() };
    notify(root);
    try {
        const result = await startHorario();
        if (scope !== sessionScope() || token !== root.token) return;
        if (!result.task_id) throw new Error('El servidor no devolvió el identificador de la tarea.');
        root.state.taskId = result.task_id;
        notify(root);
    } catch (error) {
        if (scope !== sessionScope() || token !== root.token) return;
        Object.assign(root.state, { status: 'error', errorMsg: error.message });
        notify(root);
        emitDone(false);
    } finally {
        if (token === root.token) root.running = false;
    }
    if (token === root.token && scope === sessionScope() && root.state.taskId) await follow(root);
}

export { LOADING_MESSAGES, GENERATION_STEPS };

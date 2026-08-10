/**
 * Estado global de generación de horarios.
 * Persiste en `window` para que sobreviva al desmontaje de componentes React
 * cuando el usuario navega entre páginas de Astro.
 */

const API_BASE = 'http://localhost:8000/api';

const GENERATION_STEPS = [
    { id: 'init', label: 'Preparando el espacio de trabajo...' },
    { id: 'validating', label: 'Revisando cursos, profesores y aulas...' },
    { id: 'modeling', label: 'Armando el rompecabezas...' },
    { id: 'solving', label: 'Buscando las mejores combinaciones...' },
    { id: 'done', label: '¡Casi listo! Finalizando detalles...' }
];
const LOADING_MESSAGES = GENERATION_STEPS.map(step => step.label);
const STEP_VISIBLE_TIME = 600;
const FINAL_STEP_VISIBLE_TIME = 800;

const _defaultState = {
    status: null,
    loadingStep: 0,
    progressStep: 'init',
    progressPercent: 0,
    progressMessage: GENERATION_STEPS[0].label,
    errorMsg: null,
    asignaciones: null,
    intervalId: null,
    listeners: new Set(),
};

function getState() {
    if (typeof window === 'undefined') return _defaultState;
    if (!window.__edusync_generacion) {
        let stored = null;
        try {
            const item = sessionStorage.getItem('__edusync_generacion');
            if (item) stored = JSON.parse(item);
        } catch (e) { console.error(e); }

        window.__edusync_generacion = stored ? { ...stored, intervalId: null, listeners: new Set() } : {
            status: null,        // null | 'generating' | 'success' | 'error'
            loadingStep: 0,
            progressStep: 'init',
            progressPercent: 0,
            progressMessage: GENERATION_STEPS[0].label,
            errorMsg: null,
            asignaciones: null,
            intervalId: null,
            listeners: new Set(),
        };
    }
    return window.__edusync_generacion;
}

function notify() {
    const state = getState();
    try {
        const toStore = { ...state };
        delete toStore.listeners;
        delete toStore.intervalId;
        sessionStorage.setItem('__edusync_generacion', JSON.stringify(toStore));
    } catch (e) { console.error(e); }

    state.listeners.forEach(fn => {
        try { fn({ ...state }); } catch (e) { console.error(e); }
    });
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const waitForPaint = () => new Promise(resolve => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
        resolve();
        return;
    }

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
    });
});

async function revealStepsUntil(state, targetIndex, targetPercent, visibleTime = STEP_VISIBLE_TIME) {
    const safeTarget = Math.max(0, Math.min(GENERATION_STEPS.length - 1, targetIndex));
    
    // Si estamos atrasados en la secuencia de textos, avanzamos uno por uno
    while (state.loadingStep < safeTarget) {
        state.loadingStep += 1;
        const visibleStep = GENERATION_STEPS[state.loadingStep];
        state.progressStep = visibleStep.id;
        state.progressMessage = visibleStep.label;
        
        // Asignar un porcentaje falso progresivo mientras alcanza el objetivo real
        // para que se vea como una secuencia suave
        const fakePercent = Math.min(targetPercent, (state.loadingStep / (GENERATION_STEPS.length - 1)) * 100);
        state.progressPercent = Math.max(state.progressPercent, Math.floor(fakePercent));
        
        notify();
        await waitForPaint();
        await wait(visibleTime);
    }
    
    // Al final, actualizamos al porcentaje real
    state.progressPercent = Math.max(0, Math.min(100, targetPercent));
    notify();
}

/** Suscribirse a cambios de estado. Devuelve función para desuscribirse. */
export function subscribe(listener) {
    const state = getState();
    state.listeners.add(listener);
    // Notificar inmediatamente con estado actual
    listener({ ...state });
    return () => state.listeners.delete(listener);
}

/** ¿Está generando ahora mismo? */
export function isGenerating() {
    return getState().status === 'generating';
}

/** Obtener estado actual sin suscribirse */
export function getGeneracionState() {
    return { ...getState() };
}

/** Limpiar el resultado (cuando el usuario ya vio la notificación o entró a horarios) */
export function clearResult() {
    const state = getState();
    state.status = null;
    state.loadingStep = 0;
    state.progressStep = 'init';
    state.progressPercent = 0;
    state.progressMessage = GENERATION_STEPS[0].label;
    state.errorMsg = null;
    state.asignaciones = null;
    notify();
}

/** Iniciar la generación de horarios */
export async function startGeneracion() {
    const state = getState();

    // Si ya está generando, no hacer nada
    if (state.status === 'generating') return;

    state.status = 'generating';
    state.loadingStep = 0;
    state.progressStep = 'init';
    state.progressPercent = 0;
    state.progressMessage = GENERATION_STEPS[0].label;
    state.errorMsg = null;
    state.asignaciones = null;
    notify();

    try {
        let data = null;
        const startRes = await fetch(`${API_BASE}/generar-horario/start`, { method: 'POST' });

        if (startRes.ok) {
            const startData = await startRes.json();
            if (!startData.task_id) throw new Error('El servidor no devolvió el identificador de la generación.');

            let intentos = 0;
            while (intentos < 1800) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const progressRes = await fetch(`${API_BASE}/horario-progress/${startData.task_id}`);
                if (!progressRes.ok) throw new Error('No se pudo consultar el progreso de la generación.');

                const progress = await progressRes.json();
                if (progress.status === 'starting' || progress.status === 'running') {
                    const percent = Number(progress.percent) || 0;
                    
                    let mappedId = progress.step || 'init';
                    if (mappedId === 'extracting') mappedId = 'validating';
                    if (mappedId === 'preprocessing') mappedId = 'modeling';
                    if (mappedId === 'metrics') mappedId = 'solving';
                    if (mappedId === 'saving') mappedId = 'done';
                    
                    const reportedIndex = GENERATION_STEPS.findIndex(step => step.id === mappedId);
                    
                    if (reportedIndex >= 0) {
                        await revealStepsUntil(state, reportedIndex, percent);
                    } else {
                        state.progressPercent = Math.max(0, Math.min(100, percent));
                        notify();
                    }
                    
                    state.progressStep = mappedId;
                    state.progressMessage = GENERATION_STEPS[state.loadingStep]?.label;
                    notify();
                } else if (progress.status === 'done') {
                    data = { status: 'success', resultado: progress.resultado };
                    break;
                } else if (progress.status === 'error') {
                    data = {
                        status: 'error',
                        errores: Array.isArray(progress.errors)
                            ? progress.errors
                            : [progress.message || 'El motor no pudo generar el horario.']
                    };
                    break;
                } else if (progress.status === 'not_found') {
                    throw new Error('La tarea de generación ya no está disponible en el servidor.');
                }
                intentos++;
            }

            if (!data) throw new Error('La generación superó el tiempo máximo de espera.');
        } else if (startRes.status === 404 || startRes.status === 405) {
            // Compatibilidad con versiones anteriores del backend.
            const legacyRes = await fetch(`${API_BASE}/generar-horario`, { method: 'POST' });
            if (!legacyRes.ok) throw new Error(`El servidor respondió con estado ${legacyRes.status}.`);
            data = await legacyRes.json();
        } else {
            let detail = '';
            try {
                const body = await startRes.json();
                detail = body?.detail || body?.message || '';
            } catch {
                // La respuesta puede no contener JSON.
            }
            throw new Error(detail || `No se pudo iniciar la generación (${startRes.status}).`);
        }

        if (data.status === 'error' || data.errores) {
            state.errorMsg = Array.isArray(data.errores)
                ? data.errores
                : [data.errores || 'Error desconocido al generar el horario.'];
            state.status = 'error';
            notify();
            window.dispatchEvent(new CustomEvent('edusync_generacion_done', { detail: { success: false, error: 'Validación fallida' } }));
            return;
        }

        const asignaciones = data.resultado?.asignaciones || data.asignaciones;
        if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
            const estado = data.resultado?.estado;
            throw new Error(estado
                ? `El motor terminó con estado ${estado}, pero no generó asignaciones.`
                : 'La respuesta del servidor no contiene asignaciones.');
        }

        // El motor ya terminó: cerrar los estados finales sin añadir una espera artificial exagerada.
        await revealStepsUntil(state, LOADING_MESSAGES.length - 1, 100, FINAL_STEP_VISIBLE_TIME);
        state.progressStep = 'done';
        state.progressPercent = 100;
        state.progressMessage = GENERATION_STEPS[GENERATION_STEPS.length - 1].label;
        state.asignaciones = asignaciones;
        state.status = 'success';
        notify();
        window.dispatchEvent(new CustomEvent('edusync_generacion_done', { detail: { success: true } }));
    } catch (error) {
        clearInterval(state.intervalId);
        state.intervalId = null;
        state.errorMsg = `Hubo un error de conexión o validación: ${error.message}`;
        state.status = 'error';
        notify();
        window.dispatchEvent(new CustomEvent('edusync_generacion_done', { detail: { success: false, error: state.errorMsg } }));
    }
}

export { LOADING_MESSAGES, GENERATION_STEPS };

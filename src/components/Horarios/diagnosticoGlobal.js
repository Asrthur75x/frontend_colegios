/**
 * Estado global de diagnóstico de conflictos.
 * Persiste en `window` para sobrevivir al desmontaje de componentes React
 * cuando el usuario navega entre páginas de Astro.
 *
 * Sigue el mismo patrón que generacionGlobal.js.
 */

const API_BASE = 'http://localhost:8000/api';

const DIAGNOSTICO_STEPS = [
    { id: 'init', label: 'Iniciando el análisis...' },
    { id: 'extracting', label: 'Leyendo la información del colegio...' },
    { id: 'validating', label: 'Revisando que todo esté correcto...' },
    { id: 'preprocessing', label: 'Preparando el análisis...' },
    { id: 'building', label: 'Analizando posibles combinaciones...' },
    { id: 'solving', label: 'Buscando dónde están los conflictos...' },
    { id: 'analyzing', label: 'Identificando las causas...' },
    { id: 'packaging', label: 'Organizando los resultados...' },
    { id: 'done', label: '¡Análisis completado!' },
];
const DIAGNOSTICO_MESSAGES = DIAGNOSTICO_STEPS.map(step => step.label);

function getState() {
    if (typeof window === 'undefined') return _createDefault();
    if (!window.__edusync_diagnostico) {
        let stored = null;
        try {
            const item = sessionStorage.getItem('__edusync_diagnostico');
            if (item) stored = JSON.parse(item);
        } catch (e) { console.error(e); }

        window.__edusync_diagnostico = stored ? { ...stored, listeners: new Set() } : _createDefault();
    }
    return window.__edusync_diagnostico;
}

function _createDefault() {
    return {
        status: null,       // null | 'analyzing' | 'done' | 'error'
        percent: 0,
        message: DIAGNOSTICO_STEPS[0].label,
        stepId: 'init',
        stepIndex: 0,
        targetStepIndex: 0,
        targetPercent: 0,
        resultado: null,
        errorMsg: null,
        listeners: new Set(),
        animating: false,
    };
}

function notify() {
    const state = getState();
    try {
        const toStore = { ...state };
        delete toStore.listeners;
        sessionStorage.setItem('__edusync_diagnostico', JSON.stringify(toStore));
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

/** Avanza visualmente paso a paso para que no salgan de golpe, sincronizando la barra */
async function processAnimations(state) {
    if (state.animating) return;
    state.animating = true;
    
    const STEP_PERCENTS = [2, 10, 20, 30, 45, 65, 90, 95, 100];
    const visibleTime = 3000; // 3 segundos por paso para que no se sienta tan pegado

    while (state.status === 'analyzing' && state.stepIndex < state.targetStepIndex) {
        state.stepIndex += 1;
        const visibleStep = DIAGNOSTICO_STEPS[state.stepIndex];
        state.stepId = visibleStep.id;
        state.message = visibleStep.label;
        state.percent = STEP_PERCENTS[state.stepIndex];
        
        notify();
        await waitForPaint();
        await wait(visibleTime);
    }

    if (state.status === 'analyzing') {
        state.percent = Math.max(state.percent, state.targetPercent);
        notify();
    }
    
    state.animating = false;
}

/** Suscribirse a cambios de estado. Devuelve función para desuscribirse. */
export function subscribe(listener) {
    const state = getState();
    state.listeners.add(listener);
    listener({ ...state });
    return () => state.listeners.delete(listener);
}

/** ¿Está ejecutando diagnóstico ahora mismo? */
export function isDiagnosticando() {
    return getState().status === 'analyzing';
}

/** Obtener estado actual sin suscribirse */
export function getDiagnosticoState() {
    return { ...getState() };
}

/** Limpiar resultado */
export function clearDiagnostico() {
    const state = getState();
    state.status = null;
    state.percent = 0;
    state.message = DIAGNOSTICO_STEPS[0].label;
    state.stepId = 'init';
    state.stepIndex = 0;
    state.targetStepIndex = 0;
    state.targetPercent = 0;
    state.resultado = null;
    state.errorMsg = null;
    state.animating = false;
    notify();
}

/**
 * Mapea el step y percent que llegan del backend
 * a un stepIndex y mensaje amigable para la UI.
 */
function _mapBackendProgress(step, percent) {
    // El backend envía steps como: extracting, validating, preprocessing, diagnosing
    // Dentro de "diagnosing" usa el percent para diferenciar fases
    const stepMap = {
        'init': 0,
        'extracting': 1,
        'validating': 2,
        'preprocessing': 3,
    };

    if (step in stepMap) {
        return { stepIndex: stepMap[step], percent };
    }

    // "diagnosing" — mapear percent a sub-fases
    if (step === 'diagnosing') {
        if (percent <= 45) return { stepIndex: 4, percent };       // building / analizando combinaciones
        if (percent <= 65) return { stepIndex: 5, percent };       // solving / buscando conflictos
        if (percent <= 90) return { stepIndex: 6, percent };       // analyzing / identificando causas
        return { stepIndex: 7, percent };                          // packaging / organizando resultados
    }

    if (step === 'done') {
        return { stepIndex: DIAGNOSTICO_STEPS.length - 1, percent: 100 };
    }

    return { stepIndex: 0, percent };
}

/** Iniciar el diagnóstico de conflictos */
export async function startDiagnostico() {
    const state = getState();
    if (state.status === 'analyzing') return;

    state.status = 'analyzing';
    state.percent = 0;
    state.message = DIAGNOSTICO_STEPS[0].label;
    state.stepId = 'init';
    state.stepIndex = 0;
    state.targetStepIndex = 0;
    state.targetPercent = 0;
    state.resultado = null;
    state.errorMsg = null;
    state.animating = false;
    notify();

    try {
        const startRes = await fetch(`${API_BASE}/diagnostico/start`, { method: 'POST' });
        if (!startRes.ok) {
            throw new Error(`No se pudo iniciar el análisis (${startRes.status}).`);
        }

        const startData = await startRes.json();
        if (!startData.task_id) {
            throw new Error('El servidor no devolvió el identificador del análisis.');
        }

        let intentos = 0;
        while (intentos < 600) { // max ~10 min
            await new Promise(resolve => setTimeout(resolve, 1000));

            const progressRes = await fetch(`${API_BASE}/diagnostico/${startData.task_id}`);
            if (!progressRes.ok) {
                throw new Error('No se pudo consultar el progreso del análisis.');
            }

            const progress = await progressRes.json();

            if (progress.status === 'starting' || progress.status === 'running') {
                const backendPercent = Number(progress.percent) || 0;
                const backendStep = progress.step || 'init';
                const mapped = _mapBackendProgress(backendStep, backendPercent);

                if (mapped.stepIndex > state.targetStepIndex) {
                    state.targetStepIndex = Math.min(DIAGNOSTICO_STEPS.length - 2, mapped.stepIndex);
                    state.targetPercent = mapped.percent;
                    processAnimations(state);
                } else if (!state.animating) {
                    state.percent = Math.max(state.percent, mapped.percent);
                    notify();
                }

            } else if (progress.status === 'done') {
                // Forzar al último paso y mostrar resultado inmediatamente
                state.targetStepIndex = DIAGNOSTICO_STEPS.length - 1;
                state.stepIndex = DIAGNOSTICO_STEPS.length - 1;
                state.stepId = 'done';
                state.message = DIAGNOSTICO_STEPS[DIAGNOSTICO_STEPS.length - 1].label;
                state.percent = 100;
                state.resultado = progress.resultado || null;
                state.status = 'done';
                notify();
                window.dispatchEvent(new CustomEvent('edusync_diagnostico_done', {
                    detail: { success: true }
                }));
                return;

            } else if (progress.status === 'error') {
                const errors = progress.errors;
                if (Array.isArray(errors) && errors.length > 0) {
                    state.errorMsg = errors;
                } else {
                    state.errorMsg = progress.message || 'No se pudo completar el análisis.';
                }
                state.status = 'error';
                notify();
                window.dispatchEvent(new CustomEvent('edusync_diagnostico_done', {
                    detail: { success: false }
                }));
                return;

            } else if (progress.status === 'not_found') {
                throw new Error('La tarea de análisis ya no está disponible.');
            }

            intentos++;
        }

        throw new Error('El análisis superó el tiempo máximo de espera.');

    } catch (error) {
        state.errorMsg = `Hubo un problema al analizar: ${error.message}`;
        state.status = 'error';
        notify();
        window.dispatchEvent(new CustomEvent('edusync_diagnostico_done', {
            detail: { success: false, error: state.errorMsg }
        }));
    }
}

export { DIAGNOSTICO_STEPS, DIAGNOSTICO_MESSAGES };

/**
 * Estado global de generación de horarios.
 * Persiste en `window` para que sobreviva al desmontaje de componentes React
 * cuando el usuario navega entre páginas de Astro.
 */

const API_BASE = 'http://localhost:8000/api';

const LOADING_MESSAGES = [
    "Evaluando disponibilidad de profesores...",
    "Asignando carga académica...",
    "Evitando cruces de horarios...",
    "Estructurando bloques de clase...",
    "Afinando los últimos detalles...",
    "¡Horarios generados con éxito!"
];

const _defaultState = {
    status: null,
    loadingStep: 0,
    errorMsg: null,
    asignaciones: null,
    intervalId: null,
    listeners: new Set(),
};

function getState() {
    if (typeof window === 'undefined') return _defaultState;
    if (!window.__horarix_generacion) {
        window.__horarix_generacion = {
            status: null,        // null | 'generating' | 'success' | 'error'
            loadingStep: 0,
            errorMsg: null,
            asignaciones: null,
            intervalId: null,
            listeners: new Set(),
        };
    }
    return window.__horarix_generacion;
}

function notify() {
    const state = getState();
    state.listeners.forEach(fn => {
        try { fn({ ...state }); } catch (e) { console.error(e); }
    });
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
    state.errorMsg = null;
    state.asignaciones = null;
    notify();

    // Avanzar pasos de loading cada 12 segundos
    state.intervalId = setInterval(() => {
        if (state.loadingStep < LOADING_MESSAGES.length - 2) {
            state.loadingStep++;
            notify();
        }
    }, 12000);

    try {
        const res = await fetch(`${API_BASE}/generar-horario`, { method: 'POST' });
        const data = await res.json();

        clearInterval(state.intervalId);
        state.intervalId = null;

        if (data.status === 'error' || data.errores) {
            if (data.errores && Array.isArray(data.errores)) {
                state.errorMsg = data.errores;
            } else {
                state.errorMsg = ["Error desconocido al generar el horario."];
            }
            state.status = 'error';
            notify();
            // Disparar evento global para que el toast lo muestre
            window.dispatchEvent(new CustomEvent('horarix_generacion_done', { detail: { success: false, error: "Validación fallida" } }));
            return;
        }

        let asignaciones = null;
        if (data.status === 'success' && data.resultado && data.resultado.asignaciones) {
            asignaciones = data.resultado.asignaciones;
        } else if (data.asignaciones) {
            asignaciones = data.asignaciones;
        } else {
            throw new Error("Respuesta inválida del servidor");
        }

        state.loadingStep = LOADING_MESSAGES.length - 1;
        state.asignaciones = asignaciones;
        state.status = 'success';
        notify();
        window.dispatchEvent(new CustomEvent('horarix_generacion_done', { detail: { success: true } }));
    } catch (error) {
        clearInterval(state.intervalId);
        state.intervalId = null;
        state.errorMsg = `Hubo un error de conexión o validación: ${error.message}`;
        state.status = 'error';
        notify();
        window.dispatchEvent(new CustomEvent('horarix_generacion_done', { detail: { success: false, error: state.errorMsg } }));
    }
}

export { LOADING_MESSAGES };

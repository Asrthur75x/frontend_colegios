/**
 * Estado global de diagnóstico de conflictos.
 * Persiste en `window` para sobrevivir al desmontaje de componentes React
 * cuando el usuario navega entre páginas de Astro.
 *
 * TODO el progreso y los resultados se muestran mediante notificaciones Sileo,
 * ya no hay página/pantalla separada de diagnóstico.
 */
import React from 'react';
import { sileo } from 'sileo';

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

/* ── Estado global en window ──────────────────────────────────── */

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
        resultado: null,
        errorMsg: null,
        listeners: new Set(),
        _sileoToastId: null, // ID del toast de progreso activo
    };
}

function notify() {
    const state = getState();
    try {
        const toStore = { ...state };
        delete toStore.listeners;
        delete toStore._sileoToastId;
        sessionStorage.setItem('__edusync_diagnostico', JSON.stringify(toStore));
    } catch (e) { console.error(e); }

    state.listeners.forEach(fn => {
        try { fn({ ...state }); } catch (e) { console.error(e); }
    });
}

/* ── Suscripciones ────────────────────────────────────────────── */

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
    state.resultado = null;
    state.errorMsg = null;
    // Limpiar toast si hay uno activo
    if (state._sileoToastId) {
        sileo.dismiss(state._sileoToastId);
        state._sileoToastId = null;
    }
    notify();
}

/* ── Mapeo de progreso backend → UI ───────────────────────────── */
function _mapBackendProgress(step, percent) {
    const stepMap = {
        'init': 0,
        'extracting': 1,
        'validating': 2,
        'preprocessing': 3,
    };

    if (step in stepMap) {
        return { stepIndex: stepMap[step], percent };
    }

    if (step === 'diagnosing') {
        if (percent <= 45) return { stepIndex: 4, percent };
        if (percent <= 65) return { stepIndex: 5, percent };
        if (percent <= 90) return { stepIndex: 6, percent };
        return { stepIndex: 7, percent };
    }

    if (step === 'done') {
        return { stepIndex: DIAGNOSTICO_STEPS.length - 1, percent: 100 };
    }

    return { stepIndex: 0, percent };
}

/* ── Carrusel de resultados ───────────────────────────────────── */

/**
 * CAUSA_LABELS: traducciones amigables para cada tipo de causa.
 */
const CAUSA_LABELS = {
    competencia_slots: 'Comparten los mismos horarios',
    traslado_intersedes: 'Tiempo de traslado entre sedes',
    reserva_bloqueo: 'Bloqueado por reservas',
    tope_categoria: 'Límite de horas por área',
    indeterminado: 'Combinación de factores',
};

/**
 * Dispara toasts secuenciales (carrusel) con los conflictos/resultados.
 * Muestra: resumen → cada profesor afectado con sus causas
 */
function _dispararCarruselResultados(resultado) {
    if (!resultado) return;

    const { estado, total_profesores_afectados, cuellos_de_botella, mensaje } = resultado;

    // ── Sin conflictos ──
    if (estado === 'sin_conflictos') {
        setTimeout(() => {
            sileo.success({
                title: 'Resultado de Análisis',
                description: '✅ Sin conflictos detectados. Intenta generar nuevamente.',
                duration: null,
            });
        }, 1200);
        return;
    }

    // ── Solver falló ──
    if (estado === 'solver_fallo') {
        setTimeout(() => {
            sileo.warning({
                title: 'Resultado de Análisis',
                description: '⚠️ No se pudo completar: demasiadas restricciones cruzadas.',
                duration: null,
            });
        }, 1200);
        return;
    }

    // ── Conflictos detectados ──
    if (estado === 'conflictos_detectados' && cuellos_de_botella && cuellos_de_botella.length > 0) {
        // Toast resumen principal
        setTimeout(() => {
            sileo.warning({
                title: 'Resultado de Análisis',
                description: `Se detectaron conflictos en horarios de ${total_profesores_afectados} profesor(es). Revisa los detalles.`,
                duration: null,
            });
        }, 1200);

        // Toast por cada profesor (máximo 6 para no saturar)
        const profes = cuellos_de_botella.slice(0, 6);
        profes.forEach((prof, i) => {
            setTimeout(() => {
                const nombre = prof.profesor_nombre || prof.profesor_id;
                const deficit = prof.deficit || 0;
                
                sileo.action({
                    title: 'Resultado de Análisis',
                    description: `👤 ${nombre} — faltan ${deficit}h (Ver detalle)`,
                    duration: null,
                    button: {
                        title: 'Ver detalle',
                        onClick: () => {
                            window.location.href = '/horarios/diagnostico';
                        },
                    },
                });
            }, 2800 + i * 3000);
        });

        return;
    }

    // Fallback
    setTimeout(() => {
        sileo.info({
            title: 'Resultado de Análisis',
            description: mensaje || 'Revisa los resultados del diagnóstico.',
            duration: null,
        });
    }, 1200);
}

/* ── Flujo principal ──────────────────────────────────────────── */

/** Iniciar el diagnóstico de conflictos */
export function startDiagnostico() {
    const state = getState();
    if (state.status === 'analyzing') return;

    state.status = 'analyzing';
    state.resultado = null;
    state.errorMsg = null;
    notify();

    // Promesa que maneja todo el proceso (iniciar + polling)
    const diagnosisPromise = (async () => {
        const startRes = await fetch(`${API_BASE}/diagnostico/start`, { method: 'POST' });
        if (!startRes.ok) {
            throw new Error(`No se pudo iniciar el análisis (${startRes.status}).`);
        }

        const startData = await startRes.json();
        if (!startData.task_id) {
            throw new Error('El servidor no devolvió el identificador.');
        }

        let intentos = 0;
        while (intentos < 600) { // max ~10 min
            await new Promise(resolve => setTimeout(resolve, 1000));

            const progressRes = await fetch(`${API_BASE}/diagnostico/${startData.task_id}`);
            if (!progressRes.ok) {
                throw new Error('No se pudo consultar el progreso.');
            }

            const progress = await progressRes.json();

            if (progress.status === 'starting' || progress.status === 'running') {
                const backendPercent = Number(progress.percent) || 0;
                const backendStep = progress.step || 'init';
                const mapped = _mapBackendProgress(backendStep, backendPercent);

                let targetStep = Math.max(state.stepIndex, mapped.stepIndex);
                let targetPercent = Math.max(state.percent, mapped.percent);

                // 1. Si estamos atrasados en pasos, avanzamos solo 1 paso a la vez
                // Esto da tiempo para que el usuario lea qué está pasando (aprox 1 segundo por paso)
                if (state.stepIndex < targetStep) {
                    state.stepIndex += 1;
                    state.stepId = DIAGNOSTICO_STEPS[state.stepIndex]?.id || 'init';
                    state.message = DIAGNOSTICO_STEPS[state.stepIndex]?.label || 'Analizando...';
                    state.percent = Math.max(state.percent, state.stepIndex * 12);
                } 
                // 2. Si ya estamos en el paso correcto pero atrasados en porcentaje, nos acercamos
                else if (state.percent < targetPercent) {
                    // Subimos rápido pero visible (hasta 15% por segundo)
                    state.percent = Math.min(targetPercent, state.percent + 15);
                } 
                // 3. Si el backend está "trabado" (ej. en 60% analizando IA), seguimos avanzando lentamente (fake progress)
                else if (state.percent >= targetPercent && state.percent < 95) {
                    // Sumamos 1% por segundo para que no se congele visualmente
                    state.percent += 1;
                }

                notify();
                
                // Actualizar el DOM directamente para la fluidez
                const textEl = document.getElementById('diag-progress-text');
                const textPercentEl = document.getElementById('diag-progress-percent');
                const fillEl = document.getElementById('diag-progress-fill');
                
                if (textEl) textEl.innerText = state.message;
                if (textPercentEl) textPercentEl.innerText = `${state.percent}%`;
                if (fillEl) fillEl.style.width = `${state.percent}%`;

            } else if (progress.status === 'done') {
                state.resultado = progress.resultado || null;
                state.status = 'done';
                state.percent = 100;
                notify();
                window.dispatchEvent(new CustomEvent('edusync_diagnostico_done', { detail: { success: true } }));
                return progress.resultado;
            } else if (progress.status === 'error') {
                const errors = progress.errors;
                const msg = Array.isArray(errors) && errors.length > 0 ? errors[0] : (progress.message || 'No se pudo completar.');
                throw new Error(msg);
            } else if (progress.status === 'not_found') {
                throw new Error('La tarea de análisis ya no está disponible.');
            }

            intentos++;
        }

        throw new Error('El análisis superó el tiempo máximo de espera.');
    })();

    console.log("Iniciando startDiagnostico...");
    try {
        // Usar sileo.promise para un estado de carga estable y elegante (con spinner)
        sileo.promise(diagnosisPromise, {
            loading: {
                // Sileo oculta la description cuando el state es "loading", 
                // así que ponemos la barra de progreso dentro del title!
                title: (
                    <div className="flex flex-col gap-2 mt-1 w-full min-w-[220px]">
                        <div className="flex justify-between items-center text-[13.5px] leading-none mb-1">
                            <span id="diag-progress-text" className="text-slate-700 font-bold capitalize">Iniciando análisis...</span>
                            <span id="diag-progress-percent" className="text-brand-primary font-bold bg-blue-50 px-2 py-0.5 rounded-md">0%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div 
                                id="diag-progress-fill"
                                className="h-full bg-brand-primary rounded-full transition-all duration-300 ease-out"
                                style={{ width: '0%' }}
                            />
                        </div>
                    </div>
                ),
            },
            success: (resultado) => {
                console.log("Análisis completado", resultado);
                // Disparar el carrusel con los resultados cuando termina el loader
                _dispararCarruselResultados(resultado);
                return {
                    title: '¡Análisis completado!',
                    description: 'Revisa los detalles a continuación.',
                };
            },
            error: (error) => {
                console.error("Error en diagnosisPromise:", error);
                state.errorMsg = error.message;
                state.status = 'error';
                notify();
                window.dispatchEvent(new CustomEvent('edusync_diagnostico_done', { detail: { success: false, error: error.message } }));
                return {
                    title: 'Error en el análisis',
                    description: error.message,
                };
            }
        });
        console.log("sileo.promise invocado correctamente.");
    } catch (err) {
        console.error("Error al invocar sileo.promise:", err);
        sileo.error({ title: "Error fatal", description: String(err) });
    }
}

export { DIAGNOSTICO_STEPS, DIAGNOSTICO_MESSAGES };

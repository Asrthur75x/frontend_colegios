import React, { useEffect, useState, useRef } from 'react';
import { subscribe, getGeneracionState, clearResult, LOADING_MESSAGES } from './generacionGlobal.js';
import { sileo } from 'sileo';

const GeneracionProgressInner = () => {
    const [state, setState] = useState(null);

    useEffect(() => {
        return subscribe(setState);
    }, []);

    if (!state) return null;
    
    const currentMsg = state.progressMessage || LOADING_MESSAGES[state.loadingStep] || LOADING_MESSAGES[0];
    const progress = Number(state.progressPercent) || 0;

    return (
        <div className="flex flex-col gap-1.5 mt-1 w-full min-w-[260px]">
            <div className="flex justify-between items-center text-[12.5px] leading-none mb-1">
                <span className="text-slate-600 font-medium">Progreso general</span>
                <span className="text-brand-primary font-bold bg-blue-50 px-2 py-0.5 rounded-md">{progress}%</span>
            </div>
            <p className="text-[11.5px] text-slate-500 m-0">{currentMsg}</p>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner mt-1">
                <div
                    className="h-full bg-brand-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-[10.5px] text-slate-400 mt-1 m-0">Puedes seguir navegando libremente.</p>
        </div>
    );
};

export default function GeneracionSileoListener() {
    const loadingToastIdRef = useRef(null);
    const resultToastIdRef = useRef(null);
    const [currentPath, setCurrentPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');

    useEffect(() => {
        const handlePathChange = () => {
            setCurrentPath(window.location.pathname);
        };
        document.addEventListener('astro:page-load', handlePathChange);
        window.addEventListener('popstate', handlePathChange);
        return () => {
            document.removeEventListener('astro:page-load', handlePathChange);
            window.removeEventListener('popstate', handlePathChange);
        };
    }, []);

    useEffect(() => {
        const checkState = (genState) => {
            const isHorarios = currentPath === '/horarios';

            // Si estamos en la página de generación, cerrar todos los toasts y limpiar el estado
            if (isHorarios) {
                if (loadingToastIdRef.current) {
                    sileo.dismiss(loadingToastIdRef.current);
                    loadingToastIdRef.current = null;
                }
                if (resultToastIdRef.current) {
                    sileo.dismiss(resultToastIdRef.current);
                    resultToastIdRef.current = null;
                }
                // HorariosManager se encargará de llamar a clearResult() cuando sea necesario.
                return;
            }

            // Si el estado está vacío/limpio, cerramos el toast de CARGA, pero dejamos el de RESULTADO intacto
            if (!genState || genState.status === null || genState.status === 'ready' || genState.status === 'empty') {
                if (loadingToastIdRef.current) {
                    sileo.dismiss(loadingToastIdRef.current);
                    loadingToastIdRef.current = null;
                }
                return;
            }

            if (genState.status === 'generating') {
                if (!loadingToastIdRef.current) {
                    loadingToastIdRef.current = sileo.info({
                        id: 'horarios-loading',
                        title: 'Generando horarios...',
                        description: <GeneracionProgressInner />,
                        duration: null // keeps it open indefinitely
                    });
                }
            } else if (genState.status === 'success') {
                if (loadingToastIdRef.current) {
                    sileo.dismiss(loadingToastIdRef.current);
                    loadingToastIdRef.current = null;
                }
                
                // Si el toast de éxito ya está mostrándose, no lo recreemos para evitar que se cierre
                if (resultToastIdRef.current) {
                    return;
                }
                
                // Añadir un pequeño retraso para evitar conflicto de animaciones en Sileo
                setTimeout(() => {
                    if (resultToastIdRef.current) return;
                    resultToastIdRef.current = sileo.success({
                        id: 'horarios-success',
                        title: 'Horarios generados',
                        description: 'El proceso ha finalizado correctamente.',
                        duration: null,
                        styles: {
                            button: '!bg-[#2F5BFF] hover:!bg-blue-700 !text-white'
                        },
                        button: {
                            title: 'Ver resultados',
                            onClick: () => { 
                                if (resultToastIdRef.current) sileo.dismiss(resultToastIdRef.current);
                                resultToastIdRef.current = null;
                                clearResult();
                                window.location.href = '/horarios'; 
                            }
                        },
                        onDismiss: () => {
                            clearResult();
                        }
                    });
                }, 300);
            } else if (genState.status === 'error') {
                if (loadingToastIdRef.current) {
                    sileo.dismiss(loadingToastIdRef.current);
                    loadingToastIdRef.current = null;
                }
                
                // Si el toast de error ya está mostrándose, no lo recreemos
                if (resultToastIdRef.current) {
                    return;
                }
                
                const errMsg = Array.isArray(genState.errorMsg) ? "Se encontraron conflictos físicos o curriculares en la validación." : genState.errorMsg;
                
                setTimeout(() => {
                    if (resultToastIdRef.current) return;
                    resultToastIdRef.current = sileo.error({
                        id: 'horarios-error',
                        title: 'Error de generación',
                        description: errMsg,
                        duration: null,
                        styles: {
                            button: '!bg-[#2F5BFF] hover:!bg-blue-700 !text-white'
                        },
                        button: {
                            title: 'Verificar error',
                            onClick: () => { 
                                if (resultToastIdRef.current) sileo.dismiss(resultToastIdRef.current);
                                resultToastIdRef.current = null;
                                clearResult();
                                window.location.href = '/horarios'; 
                            }
                        },
                        onDismiss: () => {
                            clearResult();
                        }
                    });
                }, 300);
            }
        };

        const unsub = subscribe(checkState);
        checkState(getGeneracionState());
        return () => {
            unsub();
            // No hacemos dismiss acá al desmontar el efecto, sino se perdería el toast al cambiar de ruta
        };
    }, [currentPath]);

    return <div style={{ display: 'none' }} data-persist="generacion-sileo-listener"></div>;
}

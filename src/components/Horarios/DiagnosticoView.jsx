import React, { useState, useEffect } from 'react';
import { subscribe as subscribeDiag, getDiagnosticoState, clearDiagnostico, startDiagnostico } from './diagnosticoGlobal';
import DiagnosticoResultados from './DiagnosticoResultados';

/**
 * Vista simplificada de diagnóstico.
 * La carga y el progreso ahora se muestran vía notificaciones Sileo.
 * Esta página solo muestra los RESULTADOS cuando ya están listos,
 * o un estado mínimo si el usuario navega directamente aquí.
 */
export default function DiagnosticoView() {
    const [diagState, setDiagState] = useState(() => {
        if (typeof window === 'undefined') return null;
        const ds = getDiagnosticoState();
        return ds.status || null;
    });
    const [diagResult, setDiagResult] = useState(() => {
        if (typeof window === 'undefined') return null;
        const ds = getDiagnosticoState();
        return ds.status === 'done' ? ds.resultado : null;
    });
    const [diagError, setDiagError] = useState(() => {
        if (typeof window === 'undefined') return null;
        const ds = getDiagnosticoState();
        return ds.status === 'error' ? ds.errorMsg : null;
    });

    useEffect(() => {
        const unsub = subscribeDiag((ds) => {
            setDiagState(ds.status);
            if (ds.status === 'done') {
                setDiagResult(ds.resultado);
            } else if (ds.status === 'error') {
                setDiagError(ds.errorMsg);
            } else if (ds.status === null) {
                setDiagResult(null);
                setDiagError(null);
            }
        });

        // Auto-start si se navega aquí directamente y no hay estado
        const currentState = getDiagnosticoState();
        if (!currentState.status) {
            startDiagnostico();
        }

        return unsub;
    }, []);

    const handleVolverAGenerar = () => {
        clearDiagnostico();
        import('./generacionGlobal').then(m => m.clearResult());
        window.location.href = '/horarios';
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pt-8 pb-20">
            <div className="max-w-6xl mx-auto px-4 md:px-8">

                {/* Header — Solo visible cuando hay resultados o error */}
                {(diagState === 'done' || diagState === 'error') && (
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-[28px] font-black text-slate-800 tracking-tight leading-none mb-2">
                                Análisis de Conflictos
                            </h1>
                            <p className="text-slate-500 text-[15px] font-medium m-0">
                                Descubre por qué no se pudo completar el horario y qué ajustes necesitas hacer.
                            </p>
                        </div>
                        <button
                            onClick={handleVolverAGenerar}
                            className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold text-[14px] rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Volver a generar horario</span>
                        </button>
                    </div>
                )}


                {/* Estado: Error */}
                {diagState === 'error' && diagError && (
                    <div className="w-full max-w-2xl mx-auto bg-red-50 rounded-2xl border border-red-200 p-8 text-center animate-fade-in-up mt-10">
                        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-[20px] font-bold text-red-700 mb-2">Ocurrió un error en el análisis</h3>
                        <p className="text-[15px] text-red-600/80 font-medium m-0 mb-6 max-w-md mx-auto">
                            {Array.isArray(diagError) ? diagError.join('. ') : diagError}
                        </p>
                        <button
                            onClick={() => {
                                clearDiagnostico();
                                startDiagnostico();
                            }}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[14px] rounded-xl transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Reintentar análisis</span>
                        </button>
                    </div>
                )}

                {/* Estado: Resultados listos */}
                {diagState === 'done' && diagResult && (
                    <div className="w-full flex flex-col animate-fade-in">
                        <DiagnosticoResultados resultado={diagResult} />
                    </div>
                )}
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { subscribe as subscribeDiag, getDiagnosticoState, clearDiagnostico, startDiagnostico, DIAGNOSTICO_MESSAGES } from './diagnosticoGlobal';
import DiagnosticoResultados from './DiagnosticoResultados';

export default function DiagnosticoView() {
    const [diagState, setDiagState] = useState(() => {
        if (typeof window === 'undefined') return null;
        const ds = getDiagnosticoState();
        return ds.status === 'done' || ds.status === 'error' || ds.status === 'analyzing' ? ds.status : null;
    });
    const [diagResult, setDiagResult] = useState(() => {
        if (typeof window === 'undefined') return null;
        const ds = getDiagnosticoState();
        return ds.status === 'done' ? ds.resultado : null;
    });
    const [diagPercent, setDiagPercent] = useState(0);
    const [diagMessage, setDiagMessage] = useState('');
    const [diagStepIndex, setDiagStepIndex] = useState(0);
    const [diagError, setDiagError] = useState(() => {
        if (typeof window === 'undefined') return null;
        const ds = getDiagnosticoState();
        return ds.status === 'error' ? ds.errorMsg : null;
    });

    useEffect(() => {
        const unsub = subscribeDiag((ds) => {
            if (ds.status === 'analyzing') {
                setDiagState('analyzing');
                setDiagPercent(ds.percent);
                setDiagMessage(ds.message);
                setDiagStepIndex(ds.stepIndex);
            } else if (ds.status === 'done') {
                setDiagState('done');
                setDiagResult(ds.resultado);
                setDiagPercent(100);
                setDiagMessage(DIAGNOSTICO_MESSAGES[DIAGNOSTICO_MESSAGES.length - 1]);
            } else if (ds.status === 'error') {
                setDiagState('error');
                setDiagError(ds.errorMsg);
            } else if (ds.status === null) {
                setDiagState(null);
                setDiagResult(null);
                setDiagError(null);
            }
        });

        // Auto-start diagnostic if it hasn't started yet and there's no result
        const currentState = getDiagnosticoState();
        if (!currentState.status) {
            startDiagnostico();
        }

        return unsub;
    }, []);

    const handleVolverAGenerar = () => {
        // Limpiamos el diagnóstico para que empiece de cero la próxima vez
        clearDiagnostico();
        // Limpiamos también el error de generación (opcional, pero ayuda a resetear la pantalla principal)
        import('./generacionGlobal').then(m => m.clearResult());
        window.location.href = '/horarios';
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pt-8 pb-20">
            <div className="max-w-6xl mx-auto px-4 md:px-8">

                {/* Header Actions - Oculto durante la carga inicial y análisis */}
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
                        {/* Botón Volver a generar */}
                        {(diagState === 'done' || diagState === 'error') && (
                            <button
                                onClick={handleVolverAGenerar}
                                className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white font-bold text-[14px] rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Volver a generar horario</span>
                            </button>
                        )}
                    </div>
                )}

                <div className="w-full flex flex-col items-center">
                    {/* Barra de progreso del diagnóstico */}
                    {diagState === 'analyzing' && (
                        <div className="w-full flex flex-col items-center justify-center min-h-[60vh] mt-4">
                            <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-100 p-8 animate-fade-in-up" style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)' }}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="relative w-10 h-10 shrink-0">
                                        <div className="absolute inset-0 border-[3.5px] border-slate-100 rounded-full" />
                                        <div className="absolute inset-0 border-[3.5px] border-brand-primary rounded-full border-t-transparent" style={{ animation: 'spin 0.8s linear infinite' }} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[16px] font-bold text-slate-800 m-0">Analizando los conflictos...</p>
                                        <p className="text-[14px] text-slate-500 m-0 mt-1">{diagMessage}</p>
                                    </div>
                                    <span className="text-[16px] font-black text-brand-primary">{diagPercent}%</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-8">
                                    <div
                                        className="h-full bg-brand-primary rounded-full"
                                        style={{ width: `${diagPercent}%`, transition: 'width 0.6s ease' }}
                                    />
                                </div>
                                {/* Steps sin space-y que da problemas de margenes en elementos ocultos */}
                                <div className="w-full mt-2">
                                    {DIAGNOSTICO_MESSAGES.slice(0, -1).map((msg, i) => (
                                        <div key={i} className={`flex items-center gap-3 transition-all duration-500 overflow-hidden ${i <= diagStepIndex ? 'opacity-100 max-h-12 mt-2.5' : 'opacity-0 max-h-0 m-0'}`}>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${i < diagStepIndex ? 'bg-emerald-100 text-emerald-500' : 'bg-brand-primary/10 text-brand-primary'}`}>
                                                {i < diagStepIndex
                                                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    : <div className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                                                }
                                            </div>
                                            <span className={`text-[13.5px] font-bold ${i < diagStepIndex ? 'text-slate-400' : 'text-slate-700'}`}>{msg}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error del diagnóstico */}
                    {diagState === 'error' && diagError && (
                        <div className="w-full max-w-2xl bg-red-50 rounded-2xl border border-red-200 p-8 text-center animate-fade-in-up mt-10">
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

                    {/* Resultados del diagnóstico */}
                    {diagState === 'done' && diagResult && (
                        <div className="w-full flex flex-col animate-fade-in">
                            <DiagnosticoResultados resultado={diagResult} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

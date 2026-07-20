import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function IAReportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [snapshotId, setSnapshotId] = useState(null);
    const [loadingSnapshot, setLoadingSnapshot] = useState(true);

    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // Fetch active snapshot when opening
    useEffect(() => {
        if (isOpen && !snapshotId) {
            fetchActiveSnapshot();
        }
    }, [isOpen]);

    const fetchActiveSnapshot = async () => {
        setLoadingSnapshot(true);
        setErrorMsg(null);
        try {
            const res = await fetch(`${API_BASE}/horario-snapshots`);
            if (!res.ok) throw new Error("Error al obtener snapshots");
            const data = await res.json();
            const active = data.find(s => s.is_active);
            if (active) {
                setSnapshotId(active.id_snapshot);
                checkExistingReport(active.id_snapshot);
            } else {
                setLoadingSnapshot(false);
                setErrorMsg("No hay ningún horario activo para analizar.");
            }
        } catch (err) {
            setLoadingSnapshot(false);
            setErrorMsg("No se pudo conectar con el servidor para buscar horarios.");
        }
    };

    const checkExistingReport = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/reportes/${id}`);
            if (res.ok) {
                const data = await res.json();
                setReportData(transformReportData(data));
            }
        } catch (err) {
            console.error("No hay reporte existente o falló la conexión");
        }
        setLoadingSnapshot(false);
    };

    const transformReportData = (data) => {
        if (!data) return null;
        if (data.calificacion_global !== undefined) return data; // Ya formateado
        
        return {
            calificacion_global: data.metricas_interpretadas?.puntuacion,
            resumen: data.resumen_ejecutivo,
            puntos_fuertes: data.metricas_interpretadas?.areas_fuertes || [],
            anomalias: (data.alertas || []).map(a => a.mensaje),
            recomendaciones: (data.sugerencias_optimizacion || []).map(s => s.accion)
        };
    };

    const handleGenerarReporte = async () => {
        if (!snapshotId) return;
        setGenerating(true);
        setErrorMsg(null);
        try {
            const res = await fetch(`${API_BASE}/reportes/generar/${snapshotId}`, {
                method: 'POST'
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Error al generar el reporte con IA");
            }
            setReportData(transformReportData(data.reporte));
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setGenerating(false);
        }
    };

    // UI Helpers
    const renderScore = (score) => {
        let colorClass = "text-emerald-500";
        if (score < 60) colorClass = "text-red-500";
        else if (score < 80) colorClass = "text-amber-500";

        return (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className={`text-4xl font-black ${colorClass}`}>{score}/100</span>
                <span className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Calificación IA</span>
            </div>
        );
    };

    return (
        <>
            {/* Botón Flotante */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--color-brand-primary)] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:opacity-90 transition-all z-40 group border-2 border-white/20 cursor-pointer"
                title="Analizar con IA"
            >
                {/* Efecto de pulso detrás */}
                <div className="absolute inset-0 rounded-full border border-[var(--color-brand-primary)] opacity-0 group-hover:animate-ping"></div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                </svg>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Contenido del Modal */}
                    <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[var(--color-brand-primary)] text-white rounded-xl flex items-center justify-center shadow-sm">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Asistente IA</h2>
                                    <p className="text-sm text-slate-500 font-medium">Revisión de Horarios</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                            >
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            {loadingSnapshot ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="w-12 h-12 border-4 border-slate-100 border-t-[var(--color-brand-primary)] rounded-full animate-spin mb-4"></div>
                                    <p className="text-slate-500 font-medium">Conectando con el horario...</p>
                                </div>
                            ) : errorMsg ? (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    <p className="text-sm font-medium pt-0.5">{errorMsg}</p>
                                </div>
                            ) : !reportData ? (
                                <div className="text-center py-10">
                                    <div className="w-20 h-20 bg-slate-50 text-[var(--color-brand-primary)] rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">Aún no revisado</h3>
                                    <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm">
                                        La Inteligencia Artificial revisará este horario para encontrar detalles a mejorar y darte sugerencias útiles.
                                    </p>

                                    <button
                                        onClick={handleGenerarReporte}
                                        disabled={generating}
                                        className="bg-[var(--color-brand-primary)] text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto cursor-pointer"
                                    >
                                        {generating ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Pensando...
                                            </>
                                        ) : (
                                            <>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /></svg>
                                                Revisar Horario
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Score Card */}
                                    {reportData.calificacion_global !== undefined && renderScore(reportData.calificacion_global)}

                                    {/* Resumen */}
                                    {reportData.resumen && (
                                        <div>
                                            <p className="text-slate-600 leading-relaxed text-[15px]">{reportData.resumen}</p>
                                        </div>
                                    )}

                                    {/* Puntos Fuertes */}
                                    {reportData.puntos_fuertes && reportData.puntos_fuertes.length > 0 && (
                                        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
                                            <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-3">
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                Puntos Fuertes
                                            </h3>
                                            <ul className="space-y-2">
                                                {reportData.puntos_fuertes.map((pf, i) => (
                                                    <li key={i} className="text-emerald-700 text-sm flex items-start gap-2">
                                                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                        <span className="leading-relaxed">{pf}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Anomalías */}
                                    {reportData.anomalias && reportData.anomalias.length > 0 && (
                                        <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
                                            <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-3">
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                Cosas a Mejorar
                                            </h3>
                                            <ul className="space-y-2">
                                                {reportData.anomalias.map((an, i) => (
                                                    <li key={i} className="text-amber-700 text-sm flex items-start gap-2">
                                                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                        <span className="leading-relaxed">{an}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Recomendaciones */}
                                    {reportData.recomendaciones && reportData.recomendaciones.length > 0 && (
                                        <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                                            <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-3">
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" /></svg>
                                                Sugerencias
                                            </h3>
                                            <ul className="space-y-2">
                                                {reportData.recomendaciones.map((rec, i) => (
                                                    <li key={i} className="text-blue-700 text-sm flex items-start gap-2">
                                                        <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                                        <span className="leading-relaxed">{rec}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

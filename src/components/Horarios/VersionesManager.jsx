import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000/api';

export default function VersionesManager() {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAction, setLoadingAction] = useState(null); // id of snapshot being acted on
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmLoad, setConfirmLoad] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchSnapshots = async () => {
        try {
            const res = await fetch(`${API}/horario-snapshots`);
            if (res.ok) {
                const data = await res.json();
                setSnapshots(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { fetchSnapshots(); }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleLoad = async (id) => {
        setLoadingAction(id);
        try {
            const res = await fetch(`${API}/horario-snapshots/${id}/load`, { method: 'POST' });
            if (res.ok) {
                showToast('Versión restaurada correctamente');
                await fetchSnapshots();
            } else {
                showToast('Error al restaurar la versión', 'error');
            }
        } catch (e) { showToast('Error de conexión', 'error'); }
        setLoadingAction(null);
        setConfirmLoad(null);
    };

    const handleDelete = async (id) => {
        setLoadingAction(id);
        try {
            const res = await fetch(`${API}/horario-snapshots/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Versión eliminada');
                await fetchSnapshots();
            } else {
                const d = await res.json().catch(() => ({}));
                showToast(d.detail || 'No se pudo eliminar', 'error');
            }
        } catch (e) { showToast('Error de conexión', 'error'); }
        setLoadingAction(null);
        setConfirmDelete(null);
    };

    const handleUpdate = async (id) => {
        setLoadingAction(id);
        try {
            const res = await fetch(`${API}/horario-snapshots/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: editName, descripcion: editDesc || null })
            });
            if (res.ok) {
                showToast('Nombre actualizado');
                await fetchSnapshots();
            } else {
                showToast('Error al actualizar', 'error');
            }
        } catch (e) { showToast('Error de conexión', 'error'); }
        setLoadingAction(null);
        setEditingId(null);
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} — ${hours}:${mins}`;
    };

    const formatDuration = (secs) => {
        if (!secs) return '—';
        const m = Math.floor(secs / 60);
        const s = Math.round(secs % 60);
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const timeAgo = (dateStr) => {
        const now = new Date();
        const d = new Date(dateStr);
        const diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'Hace un momento';
        if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
        const days = Math.floor(diff / 86400);
        if (days === 1) return 'Ayer';
        return `Hace ${days} días`;
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Toast */}
            {toast && (
                <div
                    className="fixed top-24 right-8 z-[200] px-5 py-3 rounded-2xl shadow-lg border text-[14px] font-bold flex items-center gap-2.5 animate-in"
                    style={{
                        backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
                        borderColor: toast.type === 'error' ? '#fca5a5' : '#86efac',
                        color: toast.type === 'error' ? '#dc2626' : '#16a34a',
                        animation: 'slideInRight 0.3s ease-out'
                    }}
                >
                    {toast.type === 'error' ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                    )}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Versiones y Respaldos</h1>
                    <p className="text-slate-500 text-[14px] mt-1 font-medium">Historial de horarios generados. Restaura o elimina versiones anteriores.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] px-4 py-2 rounded-xl text-[13px] font-bold border border-[var(--color-brand-primary)]/20">
                        {snapshots.length} versión{snapshots.length !== 1 ? 'es' : ''} guardada{snapshots.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
                        <p className="text-slate-400 text-sm font-medium">Cargando versiones...</p>
                    </div>
                </div>
            ) : snapshots.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
                            </svg>
                        </div>
                        <h3 className="text-slate-700 font-bold text-lg">No hay versiones aún</h3>
                        <p className="text-slate-400 text-sm">Cuando generes un horario, cada resultado del motor se guardará automáticamente como una versión que podrás restaurar.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
                    {snapshots.map((snap, index) => {
                        const isActive = snap.is_active;
                        const isEditing = editingId === snap.id_snapshot;

                        return (
                            <div
                                key={snap.id_snapshot}
                                className={`group rounded-2xl border transition-all duration-200 ${isActive
                                    ? 'bg-[var(--color-brand-primary)]/5 border-[var(--color-brand-primary)]/30 shadow-[0_0_20px_rgba(47, 91, 255,0.08)]'
                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)]'
                                    }`}
                            >
                                <div className="p-5 flex items-start gap-5">
                                    {/* Timeline indicator */}
                                    <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                                        <div className={`w-4 h-4 rounded-full border-[3px] flex-shrink-0 ${isActive
                                            ? 'border-[var(--color-brand-primary)] bg-white shadow-[0_0_8px_rgba(47, 91, 255,0.4)]'
                                            : 'border-slate-300 bg-white'
                                            }`}></div>
                                        {index < snapshots.length - 1 && (
                                            <div className="w-0.5 h-8 bg-slate-200 rounded-full"></div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            {isActive && (
                                                <span className="bg-[var(--color-brand-primary)] text-white text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                                                    Activa
                                                </span>
                                            )}
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${snap.estado === 'OPTIMAL'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : snap.estado === 'FEASIBLE'
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                {snap.estado === 'OPTIMAL' ? 'Óptima' : snap.estado === 'FEASIBLE' ? 'Factible' : snap.estado}
                                            </span>
                                            {snap.es_editada && (
                                                <span className="bg-orange-50 text-orange-500 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-orange-100">
                                                    Editada
                                                </span>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div className="flex flex-col gap-2 mt-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 transition-all"
                                                    placeholder="Nombre de la versión"
                                                />
                                                <input
                                                    type="text"
                                                    value={editDesc}
                                                    onChange={(e) => setEditDesc(e.target.value)}
                                                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 transition-all"
                                                    placeholder="Descripción (opcional)"
                                                />
                                                <div className="flex gap-2 mt-1">
                                                    <button
                                                        onClick={() => handleUpdate(snap.id_snapshot)}
                                                        className="px-4 py-2 bg-[var(--color-brand-primary)] text-white text-[12px] font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="px-4 py-2 bg-slate-100 text-slate-600 text-[12px] font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-slate-800 font-black text-[16px] tracking-tight truncate">
                                                    {snap.nombre}
                                                </h3>
                                                {snap.descripcion && (
                                                    <p className="text-slate-400 text-[13px] mt-0.5 truncate">{snap.descripcion}</p>
                                                )}
                                            </>
                                        )}

                                        {/* Stats row */}
                                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-semibold">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                                                {formatDate(snap.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-semibold">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                                {formatDuration(snap.tiempo_segundos)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-semibold">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                                                {snap.asignaciones_count} asignaciones
                                            </div>
                                            <span className="text-slate-300 text-[11px] font-medium ml-auto">
                                                {timeAgo(snap.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                                        {/* Edit name */}
                                        {!isEditing && (
                                            <button
                                                onClick={() => { setEditingId(snap.id_snapshot); setEditName(snap.nombre); setEditDesc(snap.descripcion || ''); }}
                                                className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer border border-slate-200"
                                                title="Renombrar"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                Editar
                                            </button>
                                        )}

                                        {/* Load / Restore */}
                                        {!isActive && (
                                            <button
                                                onClick={() => setConfirmLoad(snap.id_snapshot)}
                                                className="h-9 px-3.5 rounded-xl flex items-center gap-1.5 text-[12px] font-bold bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 border border-[var(--color-brand-primary)]/15 transition-all cursor-pointer"
                                                title="Restaurar como activa"
                                            >
                                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                                                Restaurar
                                            </button>
                                        )}

                                        {/* Delete */}
                                        {!isActive && (
                                            <button
                                                onClick={() => setConfirmDelete(snap.id_snapshot)}
                                                className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[12px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer border border-rose-100"
                                                title="Eliminar"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ MODAL: Restaurar Versión ═══ */}
            {confirmLoad && (() => {
                const snap = snapshots.find(s => s.id_snapshot === confirmLoad);
                if (!snap) return null;
                return (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmLoad(null)}></div>
                        <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md mx-4 overflow-hidden" style={{ animation: 'scaleIn 0.25s ease-out' }}>
                            {/* Header */}
                            <div className="p-6 pb-4 text-center">
                                <div className="w-14 h-14 bg-[var(--color-brand-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg width="28" height="28" fill="none" stroke="var(--color-brand-primary)" strokeWidth="2" strokeLinecap="round">
                                        <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                    </svg>
                                </div>
                                <h3 className="text-slate-800 font-black text-xl tracking-tight">Restaurar Versión</h3>
                                <p className="text-slate-500 text-[14px] mt-2 leading-relaxed">
                                    ¿Estás seguro de que deseas restaurar <strong className="text-slate-700">{snap.nombre}</strong> como el horario activo?
                                </p>
                            </div>

                            {/* Info Card */}
                            <div className="mx-6 mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                <div className="flex items-start gap-3">
                                    <svg width="20" height="20" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                    <div>
                                        <p className="text-amber-800 text-[13px] font-bold">El horario actual será reemplazado</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 p-6 pt-0">
                                <button
                                    onClick={() => setConfirmLoad(null)}
                                    className="flex-1 py-3 rounded-xl text-[14px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleLoad(snap.id_snapshot)}
                                    disabled={loadingAction === snap.id_snapshot}
                                    className="flex-1 py-3 rounded-xl text-[14px] font-bold text-white bg-[var(--color-brand-primary)] hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loadingAction === snap.id_snapshot ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Restaurando...</>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                                            Restaurar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ═══ MODAL: Eliminar Versión ═══ */}
            {confirmDelete && (() => {
                const snap = snapshots.find(s => s.id_snapshot === confirmDelete);
                if (!snap) return null;
                return (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}></div>
                        <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md mx-4 overflow-hidden" style={{ animation: 'scaleIn 0.25s ease-out' }}>
                            {/* Header */}
                            <div className="p-6 pb-4 text-center">
                                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg width="28" height="28" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                                    </svg>
                                </div>
                                <h3 className="text-slate-800 font-black text-xl tracking-tight">Eliminar Versión</h3>
                                <p className="text-slate-500 text-[14px] mt-2 leading-relaxed">
                                    ¿Estás seguro de que deseas eliminar <strong className="text-slate-700">{snap.nombre}</strong>?
                                </p>
                            </div>

                            {/* Warning */}
                            <div className="mx-6 mb-5 bg-red-50 border border-red-200 rounded-2xl p-4">
                                <div className="flex items-start gap-3">
                                    <svg width="20" height="20" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    <div>
                                        <p className="text-red-700 text-[13px] font-bold">Esta acción es irreversible</p>
                                        <p className="text-red-500 text-[12px] mt-0.5">Una vez eliminada, no podrás recuperar esta versión del horario.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 p-6 pt-0">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 py-3 rounded-xl text-[14px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDelete(snap.id_snapshot)}
                                    disabled={loadingAction === snap.id_snapshot}
                                    className="flex-1 py-3 rounded-xl text-[14px] font-bold text-white bg-red-500 hover:bg-red-600 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loadingAction === snap.id_snapshot ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Eliminando...</>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                            Eliminar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

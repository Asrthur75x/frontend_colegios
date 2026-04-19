import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function AreasManager() {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const [nuevaArea, setNuevaArea] = useState({
        nombre_area: '',
        max_horas_dia: ''
    });

    // ── Cargar áreas del backend al montar ──
    const fetchAreas = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/areas`);
            if (!res.ok) throw new Error('Error al obtener las áreas');
            const data = await res.json();
            setAreas(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    // ── Abrir modal para nueva área ──
    const abrirModalNueva = () => {
        setIsEditing(false);
        setEditId(null);
        setNuevaArea({ nombre_area: '', max_horas_dia: '' });
        setIsModalOpen(true);
    };

    // ── Abrir modal para edición ──
    const abrirModalEdicion = (area) => {
        setIsEditing(true);
        setEditId(area.id_area);
        setNuevaArea({
            nombre_area: area.nombre_area,
            max_horas_dia: area.max_horas_dia || 4
        });
        setIsModalOpen(true);
    };

    // ── Eliminar (solo local por ahora, no hay DELETE endpoint) ──
    const eliminarArea = (id) => {
        const confirmacion = window.confirm("¿Seguro que deseas eliminar esta área?");
        if (confirmacion) {
            setAreas(areas.filter(a => a.id_area !== id));
        }
    };

    // ── Guardar área (POST al backend) ──
    const handleGuardar = async (e) => {
        e.preventDefault();
        setGuardando(true);

        try {
            if (isEditing) {
                // Edición local (no hay PUT endpoint aún)
                setAreas(areas.map(a => a.id_area === editId
                    ? { ...a, nombre_area: nuevaArea.nombre_area, max_horas_dia: parseInt(nuevaArea.max_horas_dia) }
                    : a
                ));
            } else {
                // Crear nueva área via POST
                const res = await fetch(`${API_BASE}/areas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre_area: nuevaArea.nombre_area,
                        max_horas_dia: parseInt(nuevaArea.max_horas_dia)
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Error al crear el área');
                }

                // Recargar lista desde el backend para obtener el id real
                await fetchAreas();
            }

            setIsModalOpen(false);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-fade-in relative">

            {/* Header y Acción Principal */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">Áreas Académicas</h1>
                    <p className="text-[#64748B] mt-2 text-sm max-w-xl">
                        Registra y gestiona los departamentos y sus restricciones diarias de horario.
                    </p>
                </div>
                <button
                    onClick={abrirModalNueva}
                    className="cursor-pointer bg-[#1A5AD7] hover:bg-[#1A5AD7]/90 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    Nueva Área
                </button>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Card 1 */}
                <div className="p-6 rounded-[24px] bg-[#1A5AD7] text-white shadow-[0_10px_20px_-8px_rgba(26,90,215,0.4)] relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-[0.07] rounded-full"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-start gap-4">
                            <div className="text-white opacity-90 mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Departamentos</h3>
                                <p className="text-blue-100 text-xs mt-1.5 opacity-80 max-w-[140px] leading-relaxed">Áreas registradas en la institución</p>
                            </div>
                        </div>
                        <div className="bg-white text-[#1A5AD7] flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded-2xl shadow-sm">
                            <span className="font-black text-xl leading-none">{areas.length}</span>
                        </div>
                    </div>
                    <div className="mt-8 flex items-center text-xs font-semibold text-blue-100 opacity-80 uppercase tracking-widest">
                        <span>Total Activos</span>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="p-6 rounded-[24px] bg-[#1e40af] text-white shadow-[0_10px_20px_-8px_rgba(30,64,175,0.4)] relative overflow-hidden">
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-[0.07] rounded-full"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-start gap-4">
                            <div className="text-white opacity-90 mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Carga Diaria</h3>
                                <p className="text-blue-100 text-xs mt-1.5 opacity-80 max-w-[140px] leading-relaxed">Máxima suma de horas por día</p>
                            </div>
                        </div>
                        <div className="bg-white text-[#1e40af] flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded-2xl shadow-sm">
                            <span className="font-black text-xl leading-none">{areas.reduce((acc, curr) => acc + (curr.max_horas_dia || 0), 0)}</span>
                        </div>
                    </div>
                    <div className="mt-8 flex items-center text-xs font-semibold text-blue-100 opacity-80 uppercase tracking-widest">
                        <span>Horas configuradas</span>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="p-6 rounded-[24px] bg-[#3b82f6] text-white shadow-[0_10px_20px_-8px_rgba(59,130,246,0.4)] relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white opacity-[0.07] rounded-full"></div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-start gap-4">
                            <div className="text-white opacity-90 mt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">Última Área</h3>
                                <p className="text-blue-100 text-xs mt-1.5 opacity-80 max-w-[140px] leading-relaxed truncate pr-2" title={areas.length > 0 ? areas[areas.length - 1].nombre_area : "N/A"}>
                                    {areas.length > 0 ? areas[areas.length - 1].nombre_area : "Sin áreas registradas"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex items-center text-xs font-semibold text-blue-100 opacity-80 uppercase tracking-widest">
                        <span>Registro Reciente</span>
                    </div>
                </div>
            </div>

            {/* Banner de Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    <p className="text-sm font-medium">No se pudo conectar al servidor: {error}</p>
                    <button onClick={fetchAreas} className="ml-auto text-xs font-bold text-red-600 hover:underline">Reintentar</button>
                </div>
            )}

            {/* Estado de Carga */}
            {loading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#1A5AD7]/30 border-t-[#1A5AD7] rounded-full animate-spin"></div>
                </div>
            )}

            {/* Lista de Áreas */}
            {!loading && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative z-10">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-[#111827]">Directorio de Áreas</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1A5AD7]/5 text-[#1A5AD7] text-[10px] tracking-widest uppercase border-y border-[#1A5AD7]/10">
                                    <th className="px-6 py-4 font-extrabold">ID</th>
                                    <th className="px-6 py-4 font-extrabold w-1/2">Nombre del Área</th>
                                    <th className="px-6 py-4 font-extrabold text-center">Máxima Carga (Día)</th>
                                    <th className="px-6 py-4 font-extrabold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {areas.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-[#64748B] font-medium">Ninguna área registrada todavía.</td>
                                    </tr>
                                )}
                                {areas.map((area) => (
                                    <tr key={area.id_area} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="inline-block bg-[#1A5AD7]/10 text-[#1A5AD7] text-[11px] px-3 py-1.5 rounded-lg font-bold tracking-widest uppercase border border-[#1A5AD7]/20">
                                                {area.id_area}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[15px] font-bold text-[#111827]">{area.nombre_area}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-md">
                                                {area.max_horas_dia} hrs
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => abrirModalEdicion(area)}
                                                    className="text-[#64748B] hover:text-[#1A5AD7] p-2.5 hover:bg-[#1A5AD7]/10 rounded-xl transition-colors"
                                                    title="Editar"
                                                >
                                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => eliminarArea(area.id_area)}
                                                    className="text-[#64748B] hover:text-red-600 p-2.5 hover:bg-red-50 rounded-xl transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Flotante de Formulario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
                    <div
                        className=" bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">{isEditing ? 'Editar Área' : 'Nueva Área'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-red-500 transition-colors bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} className="p-8 space-y-6">

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Nombre del Área</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej. Ciencias Exactas"
                                    value={nuevaArea.nombre_area}
                                    onChange={(e) => setNuevaArea({ ...nuevaArea, nombre_area: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1A5AD7] focus:ring-4 focus:ring-[#1A5AD7]/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Límite Diario de Horas</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    max="12"
                                    placeholder="Ingresa las horas por día"
                                    value={nuevaArea.max_horas_dia}
                                    onChange={(e) => setNuevaArea({ ...nuevaArea, max_horas_dia: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1A5AD7] focus:ring-4 focus:ring-[#1A5AD7]/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="cursor-pointer flex-1 py-3 text-sm font-bold text-[#64748B] hover:text-[#111827] bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-sm rounded-xl transition-all flex items-center justify-center gap-2">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="cursor-pointer flex-1 py-3 px-4 bg-[#1A5AD7] hover:bg-[#1A5AD7]/90 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {guardando ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            {isEditing ? 'Guardar Cambios' : 'Añadir Registro'}
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

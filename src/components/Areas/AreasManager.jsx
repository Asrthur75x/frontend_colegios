import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

// --- Componente Tarjeta Carpeta (Folder Card) ---
const AreaFolderCard = ({ area, onEdit, onDelete }) => {
    return (
        <div className="relative w-full h-[200px] group animate-fade-in" onClick={() => onEdit(area)}>
            {/* Back Paper */}
            <div className="absolute top-4 left-5 right-5 h-[120px] bg-white rounded-t-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 p-5 transition-transform duration-500 group-hover:-translate-y-6 flex justify-between items-start z-0">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">ID Registro</span>
                    <span className="text-sm font-bold text-slate-500">#{area.id_area}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 transition-opacity duration-300 relative z-30">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(area); }} className="cursor-pointer p-2 bg-slate-50 hover:bg-hx-purple/10 text-slate-400 hover:text-hx-purple rounded-xl transition-colors"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(area.id_area); }} className="cursor-pointer p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>

            {/* Folder Tab */}
            <div className="absolute bottom-[110px] left-0 w-[55%] h-[28px] bg-hx-blue rounded-t-[16px] z-10">
                {/* Inverse curve (using exact hex of hx-blue #51B4E8) */}
                <div className="absolute -right-5 bottom-0 w-5 h-5 bg-transparent rounded-bl-[12px] shadow-[-10px_10px_0_0_#51B4E8]"></div>
            </div>

            {/* Folder Front Body */}
            <div className="absolute bottom-0 left-0 right-0 h-[110px] bg-hx-blue rounded-b-[24px] rounded-tr-[24px] z-20 p-6 flex flex-col justify-end shadow-sm group-hover:shadow-[0_15px_30px_-10px_rgba(81,180,232,0.6)] transition-shadow duration-300">
                <h3 className="text-xl font-black text-white truncate leading-tight">
                    {area.nombre}
                </h3>
                <div className="flex justify-between items-end mt-2">
                    <p className="text-sm font-bold text-white/80">
                        {area.max_horas_dia} hrs max por día
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function AreasManager() {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const [nuevaArea, setNuevaArea] = useState({
        nombre: '',
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
        setNuevaArea({ nombre: '', max_horas_dia: '' });
        setIsModalOpen(true);
    };

    // ── Abrir modal para edición ──
    const abrirModalEdicion = (area) => {
        setIsEditing(true);
        setEditId(area.id_area);
        setNuevaArea({
            nombre: area.nombre,
            max_horas_dia: area.max_horas_dia || 4
        });
        setIsModalOpen(true);
    };

    // ── Eliminar (DELETE endpoint) ──
    const eliminarArea = async (id) => {
        const confirmacion = window.confirm("¿Seguro que deseas eliminar esta área?");
        if (confirmacion) {
            try {
                const res = await fetch(`${API_BASE}/areas/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Error al eliminar');
                setAreas(areas.filter(a => a.id_area !== id));
                window.dispatchEvent(new Event('horarix_data_updated'));
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    // ── Guardar área (POST al backend) ──
    const handleGuardar = async (e) => {
        e.preventDefault();
        setGuardando(true);

        try {
            if (isEditing) {
                // Edición (PUT endpoint)
                const res = await fetch(`${API_BASE}/areas/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nuevaArea.nombre,
                        max_horas_dia: parseInt(nuevaArea.max_horas_dia)
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Error al actualizar el área');
                }
                await fetchAreas();
            } else {
                // Crear nueva área via POST
                const res = await fetch(`${API_BASE}/areas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nuevaArea.nombre,
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

            window.dispatchEvent(new Event('horarix_data_updated'));
            setIsModalOpen(false);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-fade-in relative">

            {/* Cabecera Superior (Banner + Espacio Derecho) */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Banner Principal (Izquierda) */}
                <div className="md:w-2/3 bg-gradient-to-r from-hx-blue via-sky-400 to-sky-300 rounded-[24px] p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px]">
                    {/* Formas abstractas decorativas */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
                    <div className="absolute bottom-0 right-32 w-32 h-32 bg-hx-blue/40 rounded-full blur-xl translate-y-1/4"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="max-w-md">
                            <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight drop-shadow-sm text-white">
                                Gestión de Áreas
                            </h2>
                            <p className="text-white/90 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Configura los departamentos educativos y establece sus restricciones diarias de horario para la institución.
                            </p>

                            <button
                                onClick={abrirModalNueva}
                                className="bg-white text-hx-blue hover:bg-slate-50 font-extrabold py-2.5 px-6 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm w-max">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                Añadir Nueva Área
                            </button>
                        </div>

                        {/* Logo decorativo estilo la imagen */}
                        <div className="hidden sm:flex text-white/90 opacity-80 pt-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12A10 10 0 0 1 12 2v20a10 10 0 0 1-10-10z"></path>
                                <path d="M12 2a10 10 0 0 1 10 10h-20"></path>
                                <path d="M12 22a10 10 0 0 1-10-10h20"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Espacio Derecho Reservado */}
                <div className="md:w-1/3 bg-white border-2 border-slate-200 border-dashed rounded-[24px] flex flex-col items-center justify-center p-8 min-h-[180px]">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    </div>
                    <p className="text-slate-400 font-extrabold text-sm">Espacio Reservado</p>
                    <p className="text-slate-400/70 text-xs mt-1 text-center font-medium max-w-[160px]">
                        Aquí irá el contenido que decidas llenar próximamente.
                    </p>
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
                    <div className="w-8 h-8 border-4 border-hx-purple/30 border-t-hx-purple rounded-full animate-spin"></div>
                </div>
            )}

            {/* Grid de Áreas (Carpetas) */}
            {!loading && (
                <div className="pt-4">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-[#111827]">Carpetas de Áreas ({areas.length})</h2>
                    </div>

                    {areas.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[32px] p-16 text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800">No hay áreas registradas</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Comienza creando tu primera área académica usando el botón en la cabecera superior.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                            {areas.map(area => (
                                <AreaFolderCard key={area.id_area} area={area} onEdit={abrirModalEdicion} onDelete={eliminarArea} />
                            ))}
                        </div>
                    )}
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
                                    value={nuevaArea.nombre}
                                    onChange={(e) => setNuevaArea({ ...nuevaArea, nombre: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-hx-purple focus:ring-4 focus:ring-hx-purple/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300"
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
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-hx-purple focus:ring-4 focus:ring-hx-purple/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300"
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
                                    className="cursor-pointer flex-1 py-3 px-4 bg-hx-purple hover:bg-hx-purple/90 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
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

import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

// --- Colores Dinámicos para las Carpetas ---
const FOLDER_COLORS = [
    { bg: '#8b5cf6', shadow: 'rgba(139,92,246,0.5)' }, // Violet
    { bg: '#3b82f6', shadow: 'rgba(59,130,246,0.5)' }, // Blue
    { bg: '#10b981', shadow: 'rgba(16,185,129,0.5)' }, // Emerald
    { bg: '#f43f5e', shadow: 'rgba(244,63,94,0.5)' }, // Rose
    { bg: '#f59e0b', shadow: 'rgba(245,158,11,0.5)' }, // Amber
    { bg: '#06b6d4', shadow: 'rgba(6,182,212,0.5)' }, // Cyan
    { bg: '#ec4899', shadow: 'rgba(236,72,153,0.5)' }, // Pink
    { bg: '#14b8a6', shadow: 'rgba(20,184,166,0.5)' }, // Teal
];

// --- Componente Tarjeta Carpeta (Folder Card) ---
const AreaFolderCard = ({ area, onEdit, onDelete, index }) => {
    // Determinar color en base al índice o ID
    const colorIdx = (index !== undefined ? index : (area.id_area || 0)) % FOLDER_COLORS.length;
    const color = FOLDER_COLORS[colorIdx];

    return (
        <div
            className="relative w-full h-[200px] group animate-fade-in"
            onClick={() => onEdit(area)}
            style={{
                '--folder-bg': color.bg,
                '--folder-shadow': color.shadow
            }}
        >
            {/* Back Paper */}
            <div className="absolute top-4 left-5 right-5 h-[120px] bg-white rounded-t-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 p-5 transition-transform duration-500 group-hover:-translate-y-6 flex justify-between items-start z-0">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">ID Registro</span>
                    <span className="text-sm font-bold text-slate-500">#{area.id_area}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 transition-opacity duration-300 relative z-30">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(area); }} className="cursor-pointer p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(area); }} className="cursor-pointer p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>

            {/* Folder Tab */}
            <div className="absolute bottom-[110px] left-0 w-[55%] h-[28px] rounded-t-[16px] z-10 bg-[var(--folder-bg)] transition-colors duration-300">
                {/* Inverse curve */}
                <div className="absolute -right-5 bottom-0 w-5 h-5 bg-transparent rounded-bl-[12px] shadow-[-10px_10px_0_0_var(--folder-bg)] transition-shadow duration-300"></div>
            </div>

            {/* Folder Front Body */}
            <div className="absolute bottom-0 left-0 right-0 h-[110px] rounded-b-[24px] rounded-tr-[24px] z-20 p-6 flex flex-col justify-end shadow-sm group-hover:shadow-[0_15px_30px_-10px_var(--folder-shadow)] transition-all duration-300 bg-[var(--folder-bg)]">
                <h3 className="text-xl font-black text-white truncate leading-tight drop-shadow-sm">
                    {area.nombre}
                </h3>
                <div className="flex justify-between items-end mt-2">
                    <p className="text-sm font-bold text-white/90 drop-shadow-sm">
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
    const [formErrors, setFormErrors] = useState({});

    // Estado para modal de eliminar
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [areaToDelete, setAreaToDelete] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    const [nuevaArea, setNuevaArea] = useState({
        nombre: '',
        max_horas_dia: ''
    });

    const [searchTerm, setSearchTerm] = useState('');

    const filteredAreas = areas.filter(area =>
        area.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        setFormErrors({});
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
        setFormErrors({});
        setIsModalOpen(true);
    };

    // ── Preparar Eliminación (Abrir Modal) ──
    const eliminarArea = (area) => {
        setAreaToDelete(area);
        setIsDeleteModalOpen(true);
    };

    // ── Ejecutar Eliminación (DELETE endpoint) ──
    const confirmarEliminacion = async () => {
        if (!areaToDelete) return;
        setEliminando(true);
        try {
            const res = await fetch(`${API_BASE}/areas/${areaToDelete.id_area}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
            setAreas(areas.filter(a => a.id_area !== areaToDelete.id_area));
            window.dispatchEvent(new Event('horarix_data_updated'));
            setIsDeleteModalOpen(false);
            setAreaToDelete(null);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setEliminando(false);
        }
    };

    // ── Guardar área (POST al backend) ──
    const handleGuardar = async (e) => {
        e.preventDefault();

        // Validaciones visuales
        const errors = {};
        if (!nuevaArea.nombre || nuevaArea.nombre.trim() === '') {
            errors.nombre = "El nombre del área es obligatorio.";
        }
        if (!nuevaArea.max_horas_dia || isNaN(nuevaArea.max_horas_dia) || parseInt(nuevaArea.max_horas_dia) < 1) {
            errors.max_horas_dia = "Debes ingresar un número válido mayor a 0.";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setFormErrors({});
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
                <div className="md:w-2/3 bg-[var(--color-hx-purple)]/10 rounded-[24px] p-8 shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px] border border-[var(--color-hx-purple)]/70">
                    {/* Formas abstractas decorativas */}


                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                        <div className="max-w-md">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                                Gestión de Áreas
                            </h2>
                            <p className="text-slate-500 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Crea las áreas de tu colegio y define cuántas horas de clase tendrán al día como máximo.
                            </p>

                            <button
                                onClick={abrirModalNueva}
                                className="bg-hx-purple text-white hover:bg-hx-purple/80 font-extrabold py-2.5 px-6 rounded-xl shadow-[0_4px_12px_rgba(121,14,236,0.3)] hover:shadow-[0_6px_16px_rgba(121,14,236,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm w-max cursor-pointer">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                Añadir Nueva Área
                            </button>
                        </div>

                        {/* Imagen Ilustrativa a la derecha (movida más a la izquierda) */}
                        <div className="hidden sm:flex relative w-32 h-32 md:w-45 md:h-45 flex-shrink-0 items-center justify-center -mt-2 md:mr-16">
                            {/* Brillo suave de fondo para resaltar */}
                            <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl"></div>
                            <img
                                src="/areas.svg"
                                alt="Ilustración"
                                className="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)] hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Panel de Información (Derecha) */}
                <div className="md:w-1/3 bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] flex flex-col p-6 min-h-[180px] relative overflow-hidden">
                    {/* Indicador superior */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">Total Áreas</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{areas.length}</h3>
                                <span className="text-slate-400 text-sm font-bold">registradas</span>
                            </div>

                        </div>
                        <div className="w-12 h-12 rounded-[14px] bg-hx-purple/10 text-hx-purple flex items-center justify-center border border-hx-purple/20 shadow-sm">
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                    </div>

                    {/* Tip Práctico */}
                    <div className="mt-auto bg-amber-50 rounded-xl p-3.5 border border-amber-100/60 flex gap-3 items-start">
                        <div className="text-amber-500 bg-white p-1 rounded-lg shadow-sm border border-amber-100 mt-0.5 flex-shrink-0">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        </div>
                        <div>
                            <p className="text-amber-800 text-[12px] font-bold mb-0.5">Un buen tip</p>
                            <p className="text-amber-700/80 text-[11px] font-medium leading-relaxed">
                                Limitar las horas sirve para que los alumnos no tengan "solo matemáticas" el mismo día. ¡Mantiene las clases variadas!
                            </p>
                        </div>
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
                    <div className="w-8 h-8 border-4 border-hx-purple/30 border-t-hx-purple rounded-full animate-spin"></div>
                </div>
            )}

            {/* Grid de Áreas (Carpetas) */}
            {!loading && (
                <div className="pt-4">
                    {/* Toolbar en una sola línea */}
                    <div className="flex items-center justify-between mb-8 bg-white py-2 px-4 rounded-[20px] border border-slate-100 shadow-sm h-16 w-full overflow-hidden gap-4">
                        {/* Izquierda: Título */}
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <div className="w-10 h-10 bg-hx-purple/10 rounded-xl flex items-center justify-center text-hx-purple">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <h2 className="text-[20px] font-black text-slate-800 tracking-tight whitespace-nowrap">Áreas</h2>
                        </div>

                        {/* Derecha: Buscador Pill */}
                        <div className="w-full max-w-md">
                            <div className="relative group flex items-center bg-white rounded-full p-1.5 border-2 border-slate-200 focus-within:border-hx-purple transition-all h-12 w-full">
                                <input
                                    type="text"
                                    placeholder="Buscar área por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent pl-6 pr-3 py-1 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full w-full"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="mr-2 text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50 flex-shrink-0">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                )}
                                <div className="w-9 h-9 rounded-full bg-hx-purple flex items-center justify-center text-white flex-shrink-0 shadow-sm mr-0.5">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {areas.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[32px] p-16 text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800">No hay áreas registradas</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Comienza creando tu primera área académica usando el botón en la cabecera superior.</p>
                        </div>
                    ) : filteredAreas.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[32px] p-16 text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800">No se encontraron áreas</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">No hay ningún resultado que coincida con tu búsqueda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                            {filteredAreas.map((area, index) => (
                                <AreaFolderCard key={area.id_area} area={area} index={index} onEdit={abrirModalEdicion} onDelete={eliminarArea} />
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

                        <form onSubmit={handleGuardar} className="p-8 space-y-6" noValidate>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Nombre del Área</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej. Ciencias Exactas"
                                    value={nuevaArea.nombre}
                                    onChange={(e) => {
                                        setNuevaArea({ ...nuevaArea, nombre: e.target.value });
                                        if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: null });
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.nombre ? 'border-red-500 focus:ring-red-500/10 bg-red-50/30' : 'border-slate-200 focus:border-hx-purple focus:ring-hx-purple/10'} focus:ring-4 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-400`}
                                />
                                {formErrors.nombre && (
                                    <p className="text-red-500 text-[11px] font-bold mt-1 animate-fade-in">{formErrors.nombre}</p>
                                )}
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
                                    onChange={(e) => {
                                        setNuevaArea({ ...nuevaArea, max_horas_dia: e.target.value });
                                        if (formErrors.max_horas_dia) setFormErrors({ ...formErrors, max_horas_dia: null });
                                    }}
                                    className={`w-full px-4 py-3 rounded-xl border ${formErrors.max_horas_dia ? 'border-red-500 focus:ring-red-500/10 bg-red-50/30' : 'border-slate-200 focus:border-hx-purple focus:ring-hx-purple/10'} focus:ring-4 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-400`}
                                />
                                {formErrors.max_horas_dia && (
                                    <p className="text-red-500 text-[11px] font-bold mt-1 animate-fade-in">{formErrors.max_horas_dia}</p>
                                )}
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

            {/* Modal Confirmación de Eliminar */}
            {isDeleteModalOpen && areaToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-[340px] overflow-hidden transform animate-slide-up p-8 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icono de advertencia */}
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#f43f5e" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h2 className="text-[20px] font-extrabold text-slate-800 mb-2">Eliminar Área</h2>
                        <p className="text-slate-500 text-[14px] font-medium mb-8 leading-relaxed">
                            Estás a punto de eliminar el área <strong className="text-slate-700">"{areaToDelete.nombre}"</strong>. ¿Estás seguro?
                        </p>

                        <div className="flex items-center gap-3 w-full">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setAreaToDelete(null);
                                }}
                                disabled={eliminando}
                                className="cursor-pointer flex-1 py-3 text-[13px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all disabled:opacity-50"
                            >
                                No, Conservarla
                            </button>
                            <button
                                type="button"
                                onClick={confirmarEliminacion}
                                disabled={eliminando}
                                className="cursor-pointer flex-1 py-3 bg-[#f43f5e] hover:bg-[#e11d48] text-white text-[13px] font-bold rounded-full shadow-[0_4px_12px_rgba(244,63,94,0.3)] hover:shadow-[0_6px_16px_rgba(244,63,94,0.4)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {eliminando ? 'Eliminando...' : 'Sí, ¡Eliminar!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

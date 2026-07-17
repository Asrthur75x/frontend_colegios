import React, { useState, useEffect } from 'react';
import ModuleSidebar from '../Shared/ModuleSidebar';

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

// --- Componente Tarjeta Carpeta (Ticket Style) ---
const AreaFolderCard = ({ area, onEdit, onDelete, index }) => {
    // Determinar color en base al índice o ID
    const colorIdx = (index !== undefined ? index : (area.id_area || 0)) % FOLDER_COLORS.length;
    const color = FOLDER_COLORS[colorIdx];

    return (
        <div
            className="relative w-full rounded-[20px] shadow-sm border border-slate-100 overflow-hidden flex flex-col bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
            onClick={() => onEdit(area)}
        >
            {/* Top part (Solid color, decorative) */}
            <div
                className="h-8 w-full"
                style={{ backgroundColor: color.bg }}
            ></div>

            {/* Bottom part (White bg) */}
            <div className="px-6 py-5 flex flex-col relative z-0 bg-white rounded-t-[20px] -mt-4">

                {/* Title */}
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Área Académica
                </span>
                <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 truncate">
                    {area.nombre}
                </h3>

                {/* Separator with cutouts */}
                <div className="relative py-4 z-10">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-dashed border-slate-200"></div>
                    </div>
                    {/* Cutouts (Colored same as body background #f8fafc) */}
                    <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#f8fafc] rounded-full border border-slate-100"></div>
                    <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#f8fafc] rounded-full border border-slate-100"></div>
                </div>

                {/* Footer (Hours + Buttons) */}
                <div className="flex justify-between items-center">
                    {/* Hours */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Límite Diario</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-800 leading-none">{area.max_horas_dia}</span>
                            <span className="text-[11px] font-bold text-slate-500">horas</span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(area); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 border border-red-200 text-red-600 text-[12px] font-bold rounded-full transition-colors shadow-sm cursor-pointer"
                        >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Borrar
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(area); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]  text-[var(--color-brand-primary)] text-[12px] font-bold rounded-full transition-colors shadow-sm cursor-pointer"
                        >
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Editar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function AreasManager() {
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentView, setCurrentView] = useState('list'); // 'list' o 'form'
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

    const volverALista = (push = true) => {
        setCurrentView('list');
        if (push) window.history.pushState(null, '', window.location.pathname + window.location.search);
    };

    // ── Abrir modal para nueva área ──
    const abrirModalNueva = (push = true) => {
        setIsEditing(false);
        setEditId(null);
        setNuevaArea({ nombre: '', max_horas_dia: '' });
        setFormErrors({});
        setCurrentView('form');
        if (push) window.history.pushState(null, '', '#new');
    };

    // ── Abrir modal para edición ──
    const abrirModalEdicion = (area, push = true) => {
        setIsEditing(true);
        setEditId(area.id_area);
        setNuevaArea({
            nombre: area.nombre,
            max_horas_dia: area.max_horas_dia || 4
        });
        setFormErrors({});
        setCurrentView('form');
        if (push) window.history.pushState(null, '', `#edit-${area.id_area}`);
    };

    // ── Cargar áreas del backend al montar ──
    const fetchAreas = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/areas`);
            if (!res.ok) throw new Error('Error al obtener las áreas');
            const data = await res.json();
            setAreas(data);
            setError(null);

            // Sincronizar hash de la URL con la vista actual
            const hash = window.location.hash;
            if (hash === '#new') {
                abrirModalNueva(false);
            } else if (hash.startsWith('#edit-')) {
                const id = hash.replace('#edit-', '');
                const area = data.find(a => a.id_area.toString() === id);
                if (area) {
                    abrirModalEdicion(area, false);
                } else {
                    volverALista(false);
                }
            } else {
                volverALista(false);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    // Escuchar cambios en el historial (botones Atrás/Adelante del navegador)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash === '#new') {
                abrirModalNueva(false);
            } else if (hash.startsWith('#edit-')) {
                const id = hash.replace('#edit-', '');
                const area = areas.find(a => a.id_area.toString() === id);
                if (area) {
                    abrirModalEdicion(area, false);
                } else {
                    volverALista(false);
                }
            } else {
                volverALista(false);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [areas]);

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
            window.dispatchEvent(new Event('edusync_data_updated'));
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

            window.dispatchEvent(new Event('edusync_data_updated'));
            volverALista();
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="w-full animate-fade-in relative">
            <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-144px)]">

                {/* ===== LEFT SIDEBAR (1/4) ===== */}
                <ModuleSidebar
                    title="Gestión de Áreas"
                    description="Crea las áreas académicas de tu institución y define cuántas horas de clase tendrán al día como máximo."
                    onAddClick={abrirModalNueva}
                    addButtonText="Añadir Nueva Área"
                    svgImage="/areas.svg"
                    tipText="Limitar las horas sirve para que los alumnos no tengan &quot;solo matemáticas&quot; el mismo día. ¡Mantiene las clases variadas!"
                />

                {/* ===== RIGHT CONTENT (3/4) ===== */}
                <main className="md:w-3/4 flex flex-col gap-5">
                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            <p className="text-sm font-medium">No se pudo conectar al servidor: {error}</p>
                            <button onClick={fetchAreas} className="ml-auto text-xs font-bold text-red-600 hover:underline cursor-pointer">Reintentar</button>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-[var(--color-brand-primary)]/30 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Content Views */}
                    {!loading && (
                        <>
                            {currentView === 'list' ? (
                                // --- VISTA LISTA ---
                                <>
                                    {/* Title */}
                                    <div className=" px-2 flex">
                                        <h2 className="text-slate-800 text-[20px] font-black">Total  areas: {areas.length} registradas</h2>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="flex items-center bg-white rounded-[16px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-2 h-14 gap-3">
                                        <div className="relative flex items-center flex-1 bg-slate-50 rounded-xl h-full px-4">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                            <input
                                                type="text"
                                                placeholder="Buscar área por nombre..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="flex-1 bg-transparent pl-3 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full"
                                            />
                                            {searchTerm && (
                                                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 flex-shrink-0 cursor-pointer">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-[12px] font-bold text-slate-400 px-3 flex-shrink-0 whitespace-nowrap">{filteredAreas.length} de {areas.length}</span>
                                    </div>

                                    {/* Grid */}
                                    {areas.length === 0 ? (
                                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[24px] p-16 text-center flex-1 flex flex-col items-center justify-center animate-fade-in">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800">No hay áreas registradas</h3>
                                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">Comienza creando tu primera área académica usando el botón de la izquierda.</p>
                                        </div>
                                    ) : filteredAreas.length === 0 ? (
                                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[24px] p-16 text-center flex-1 flex flex-col items-center justify-center animate-fade-in">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800">No se encontraron áreas</h3>
                                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">No hay ningún resultado que coincida con tu búsqueda.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10 animate-fade-in">
                                            {filteredAreas.map((area, index) => (
                                                <AreaFolderCard key={area.id_area} area={area} index={index} onEdit={abrirModalEdicion} onDelete={eliminarArea} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                // --- VISTA FORMULARIO ---
                                <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8 animate-fade-in">
                                    <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                {isEditing ? (
                                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500 stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                ) : (
                                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500 stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                )}
                                            </div>
                                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{isEditing ? 'Editar Área Académica' : 'Registrar Nueva Área'}</h2>
                                        </div>
                                        <button
                                            onClick={() => volverALista()}
                                            className="cursor-pointer text-[var(--color-brand-primary)] hover:text-[var(--color-brand-dark)] transition-colors flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                            Volver
                                        </button>
                                    </div>

                                    <form onSubmit={handleGuardar} className="space-y-8 max-w-4xl" noValidate>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Nombre del Área */}
                                            <div className="space-y-2">
                                                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre del Área</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`${formErrors.nombre ? 'text-red-400' : 'text-slate-400'} stroke-2`}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                                    </div>
                                                    <input
                                                        required
                                                        type="text"
                                                        placeholder="Ej. Ciencias Exactas"
                                                        value={nuevaArea.nombre}
                                                        onChange={(e) => {
                                                            setNuevaArea({ ...nuevaArea, nombre: e.target.value });
                                                            if (formErrors.nombre) setFormErrors({ ...formErrors, nombre: null });
                                                        }}
                                                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${formErrors.nombre ? 'border-red-500 focus:ring-red-500/10 bg-red-50/30' : 'border-slate-200 focus:border-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]/10'} focus:ring-4 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400`}
                                                    />
                                                </div>
                                                {formErrors.nombre && (
                                                    <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1 animate-fade-in">{formErrors.nombre}</p>
                                                )}
                                            </div>

                                            {/* Límite de Horas */}
                                            <div className="space-y-2">
                                                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider ml-1">Límite Diario (Horas)</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`${formErrors.max_horas_dia ? 'text-red-400' : 'text-slate-400'} stroke-2`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                    <input
                                                        required
                                                        type="number"
                                                        min="1"
                                                        max="12"
                                                        placeholder="Máx. horas por día"
                                                        value={nuevaArea.max_horas_dia}
                                                        onChange={(e) => {
                                                            setNuevaArea({ ...nuevaArea, max_horas_dia: e.target.value });
                                                            if (formErrors.max_horas_dia) setFormErrors({ ...formErrors, max_horas_dia: null });
                                                        }}
                                                        className={`w-full pl-11 pr-4 py-3.5 rounded-xl border ${formErrors.max_horas_dia ? 'border-red-500 focus:ring-red-500/10 bg-red-50/30' : 'border-slate-200 focus:border-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]/10'} focus:ring-4 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400`}
                                                    />
                                                </div>
                                                {formErrors.max_horas_dia && (
                                                    <p className="text-red-500 text-[11px] font-bold mt-1.5 ml-1 animate-fade-in">{formErrors.max_horas_dia}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                                            <button
                                                type="button"
                                                onClick={() => volverALista()}
                                                className="cursor-pointer py-3.5 px-6 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={guardando}
                                                className="cursor-pointer py-3.5 px-8 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)] text-white text-sm font-bold rounded-xl shadow-md shadow-[var(--color-brand-primary)]/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
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
                            )}
                        </>
                    )}
                </main>
            </div>

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

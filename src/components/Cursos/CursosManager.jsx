import React, { useState, useEffect } from 'react';
import ModuleSidebar from '../Shared/ModuleSidebar';

const API_BASE = 'http://localhost:8000/api';

// --- Componente Tarjeta Libro (Book Card) ---
const CursoBookCard = ({ curso, area, onEdit, onDelete, index }) => {
    // Paleta de colores con valores hex directos (evita el bug de purge de Tailwind JIT)
    const colors = [
        { bg: '#1e293b', spine: '#0f172a', text: '#f1f5f9', bmBg: '#fbbf24' }, // Slate oscuro
        { bg: '#a855f7', spine: '#9333ea', text: '#ffffff', bmBg: '#fde68a' }, // Morado
        { bg: '#f43f5e', spine: '#e11d48', text: '#ffffff', bmBg: '#fef08a' }, // Rosa/Rojo
        { bg: '#10b981', spine: '#059669', text: '#ffffff', bmBg: '#fbbf24' }, // Esmeralda
        { bg: '#3b82f6', spine: '#2563eb', text: '#ffffff', bmBg: '#fde68a' }, // Azul
        { bg: '#f59e0b', spine: '#d97706', text: '#1c1917', bmBg: '#fda4af' }, // Ámbar
        { bg: '#06b6d4', spine: '#0891b2', text: '#ffffff', bmBg: '#fde68a' }, // Cyan
        { bg: '#ec4899', spine: '#db2777', text: '#ffffff', bmBg: '#fef9c3' }, // Rosa fucsia
        { bg: '#8b5cf6', spine: '#7c3aed', text: '#ffffff', bmBg: '#fbbf24' }, // Violeta
        { bg: '#14b8a6', spine: '#0d9488', text: '#ffffff', bmBg: '#fde68a' }, // Teal
        { bg: '#ef4444', spine: '#dc2626', text: '#ffffff', bmBg: '#fef08a' }, // Rojo vivo
        { bg: '#6366f1', spine: '#4f46e5', text: '#ffffff', bmBg: '#fda4af' }, // Índigo
    ];
    const c = colors[index % colors.length];

    return (
        <div className="w-full flex justify-center animate-fade-in" style={{ perspective: '1000px' }}>
            {/* Wrapper interno: libro + botones en fila */}
            <div className="group relative flex items-start gap-2">

                {/* Contenedor del Libro */}
                <div
                    className="relative w-[160px] md:w-[180px] h-[240px] md:h-[260px] rounded-r-xl rounded-l-md transition-all duration-500 group-hover:-translate-y-4 group-hover:shadow-[15px_20px_25px_rgba(0,0,0,0.25)] cursor-pointer flex-shrink-0"
                    style={{
                        backgroundColor: c.bg,
                        boxShadow: '10px 10px 15px rgba(0,0,0,0.2)',
                        transformStyle: 'preserve-3d',
                    }}
                    onClick={() => onEdit(curso)}
                >
                    {/* Lomo del libro */}
                    <div
                        className="absolute left-0 top-0 bottom-0 w-6 rounded-l-md z-20"
                        style={{ backgroundColor: c.spine, boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.2)' }}
                    >
                        <div className="absolute top-4 bottom-4 left-2 w-0.5 bg-white/10 rounded-full"></div>
                    </div>

                    {/* Detalles de la portada */}
                    <div className="absolute inset-0 ml-6 p-4 md:p-5 flex flex-col items-center text-center z-20">
                        <div
                            className="text-[9px] font-bold uppercase tracking-[0.15em] mt-1 md:mt-2 line-clamp-2"
                            style={{ color: c.text, opacity: 0.8 }}
                        >
                            {area ? area.nombre_area || area.nombre : 'Sin Área'}
                        </div>

                        <div className="flex-1 flex items-center justify-center w-full">
                            <h3
                                className="text-[17px] md:text-xl font-black leading-snug drop-shadow-md px-1"
                                style={{ color: c.text }}
                            >
                                {curso.nombre_curso}
                            </h3>
                        </div>

                        {curso.requiere_espacio_unico && (
                            <div className="text-[8px] font-black uppercase tracking-widest mb-1.5 opacity-90" style={{ color: c.text }}>
                                ESPACIO ÚNICO
                            </div>
                        )}

                        <div
                            className="text-[10px] font-bold mb-2 md:mb-3 border-t border-white/20 pt-2 w-1/2"
                            style={{ color: c.text, opacity: 0.6 }}
                        >
                            ID: {curso.id_curso}
                        </div>
                    </div>

                    {/* Marcador (Bookmark) */}
                    <div
                        className="absolute -bottom-4 right-6 w-8 h-10 z-10 transition-all duration-300 group-hover:h-14 group-hover:-bottom-8 drop-shadow-md"
                        style={{ backgroundColor: c.bmBg }}
                    >
                        <div
                            className="absolute -bottom-3 left-0 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[12px] border-b-transparent"
                            style={{ borderLeftColor: c.bmBg, borderRightColor: c.bmBg }}
                        ></div>
                    </div>

                    {/* Páginas (Bordes de hojas) */}
                    <div className="absolute top-1 bottom-1 right-[-4px] w-1 bg-white rounded-r-sm z-0" style={{ boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.1)' }}></div>
                    <div className="absolute top-2 bottom-2 right-[-6px] w-1 bg-slate-100 rounded-r-sm z-0"></div>

                    {/* Brillo de portada */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 rounded-r-xl rounded-l-md pointer-events-none z-30"></div>
                </div>

                {/* Acciones — siempre visibles a la derecha del libro */}
                <div className="flex flex-col gap-2 pt-2 flex-shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(curso); }}
                        title="Editar"
                        className="p-2.5 bg-white text-brand-primary rounded-full shadow-lg hover:bg-[var(--color-brand-light)] hover:scale-110 transition-all cursor-pointer"
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(curso); }}
                        title="Eliminar"
                        className="p-2.5 bg-white text-red-500 rounded-full shadow-lg hover:bg-red-50 hover:scale-110 transition-all cursor-pointer"
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default function CursosManager() {
    const [cursos, setCursos] = useState([]);
    const [currentView, setCurrentView] = useState('list');
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArea, setSelectedArea] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [guardando, setGuardando] = useState(false);

    // Modal de confirmación de eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [cursoToDelete, setCursoToDelete] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    // Adaptado al SQLModel: id_curso, nombre_curso y id_area
    const [nuevoCurso, setNuevoCurso] = useState({ nombre_curso: '', id_area: '' });
    const [cursosNuevos, setCursosNuevos] = useState([]);
    const [inputCursoVirtual, setInputCursoVirtual] = useState('');

    // ── Cargar cursos y áreas del backend al montar ──
    const fetchDatos = async (signal) => {
        try {
            setLoading(true);
            const [resCursos, resAreas] = await Promise.all([
                fetch(`${API_BASE}/cursos`, { signal }).catch((e) => {
                    if (e.name === 'AbortError') throw e;
                    return { ok: false, json: async () => [] };
                }),
                fetch(`${API_BASE}/areas`, { signal }).catch((e) => {
                    if (e.name === 'AbortError') throw e;
                    return { ok: false, json: async () => [] };
                }),
            ]);

            if (resCursos.ok) {
                const dataCursos = await resCursos.json();
                setCursos(dataCursos);

                const hash = window.location.hash;
                if (hash === '#new') {
                    abrirModalNueva(false);
                } else if (hash.startsWith('#edit-')) {
                    const id = hash.replace('#edit-', '');
                    const curso = dataCursos.find(c => c.id_curso.toString() === id);
                    if (curso) {
                        abrirModalEdicion(curso, false);
                    } else {
                        volverALista(false);
                    }
                } else {
                    volverALista(false);
                }
            } else setCursos([]);

            if (resAreas.ok) {
                const dataAreas = await resAreas.json();
                setAreas(dataAreas);
            } else setAreas([]);

            setError(null);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('No se pudo obtener datos del backend.', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchDatos(controller.signal);
        return () => controller.abort();
    }, []);

    const volverALista = (push = true) => {
        setCurrentView('list');
        if (push) window.history.pushState(null, '', window.location.pathname + window.location.search);
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash === '#new') {
                abrirModalNueva(false);
            } else if (hash.startsWith('#edit-')) {
                const id = hash.replace('#edit-', '');
                const curso = cursos.find(c => c.id_curso.toString() === id);
                if (curso) {
                    abrirModalEdicion(curso, false);
                } else {
                    volverALista(false);
                }
            } else {
                volverALista(false);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [cursos]);



    // ── Abrir modal para nuevo curso ──
    const abrirModalNueva = (push = true) => {
        setIsEditing(false);
        setEditId(null);
        setNuevoCurso({ nombre_curso: '', id_area: '' });
        setCursosNuevos([]);
        setInputCursoVirtual('');
        setCurrentView('form');
        if (push) window.history.pushState(null, '', '#new');
    };

    // ── Abrir modal para edición ──
    const abrirModalEdicion = (curso, push = true) => {
        setIsEditing(true);
        setEditId(curso.id_curso);
        setNuevoCurso({
            nombre_curso: curso.nombre_curso || '',
            id_area: curso.id_area || '',
            requiere_espacio_unico: curso.requiere_espacio_unico || false
        });
        setCurrentView('form');
        if (push) window.history.pushState(null, '', `#edit-${curso.id_curso}`);
    };

    // ── Preparar Eliminación (Abrir Modal) ──
    const eliminarCurso = (curso) => {
        setCursoToDelete(curso);
        setIsDeleteModalOpen(true);
    };

    // ── Ejecutar Eliminación (DELETE endpoint) ──
    const confirmarEliminacion = async () => {
        if (!cursoToDelete) return;
        setEliminando(true);
        try {
            await fetch(`${API_BASE}/cursos/${cursoToDelete.id_curso}`, { method: 'DELETE' });
            setCursos(cursos.filter(c => c.id_curso !== cursoToDelete.id_curso));
            window.dispatchEvent(new CustomEvent('edusync_data_updated'));
            setIsDeleteModalOpen(false);
            setCursoToDelete(null);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        } finally {
            setEliminando(false);
        }
    };

    // ── Manejo de múltiples cursos ──
    const handleAddCursoToList = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = inputCursoVirtual.trim();
            if (val && !cursosNuevos.some(c => c.nombre === val)) {
                setCursosNuevos([...cursosNuevos, { nombre: val, requiere_espacio_unico: false }]);
                setInputCursoVirtual('');
            }
        }
    };

    const removeCursoFromList = (cursoToRemove) => {
        setCursosNuevos(cursosNuevos.filter(c => c.nombre !== cursoToRemove));
    };

    const toggleEspacioUnicoCurso = (nombre) => {
        setCursosNuevos(cursosNuevos.map(c =>
            c.nombre === nombre ? { ...c, requiere_espacio_unico: !c.requiere_espacio_unico } : c
        ));
    };

    // ── Guardar curso(s) ──
    const handleGuardar = async (e) => {
        e.preventDefault();
        setGuardando(true);

        try {
            if (isEditing) {
                const payload = {
                    nombre_curso: nuevoCurso.nombre_curso,
                    id_area: nuevoCurso.id_area ? parseInt(nuevoCurso.id_area) : null,
                    requiere_espacio_unico: nuevoCurso.requiere_espacio_unico || false
                };

                // Optimistic Update
                setCursos(cursos.map(c => c.id_curso === editId ? { ...c, ...payload } : c));

                // API Call for update
                await fetch(`${API_BASE}/cursos/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                window.dispatchEvent(new CustomEvent('edusync_data_updated'));
            } else {
                let listToSave = [...cursosNuevos];

                if (listToSave.length === 0) {
                    alert("Por favor, ingresa al menos un curso.");
                    setGuardando(false);
                    return;
                }

                // Batch creation (Simulado optimista o real)
                const nuevosCreados = listToSave.map((item, i) => ({
                    id_curso: Math.floor(Math.random() * 10000) + i,
                    nombre_curso: item.nombre,
                    id_area: nuevoCurso.id_area ? parseInt(nuevoCurso.id_area) : null
                }));

                // Promise.all para enviar cada curso al backend
                await Promise.all(listToSave.map(async (item) => {
                    const payload = {
                        nombre_curso: item.nombre,
                        id_area: nuevoCurso.id_area ? parseInt(nuevoCurso.id_area) : null,
                        requiere_espacio_unico: item.requiere_espacio_unico || false
                    };
                    try {
                        await fetch(`${API_BASE}/cursos`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                    } catch (e) {
                        // Ignorar errores por ahora, se mostrarán en UI
                    }
                }));

                // Recargar para sincronizar IDs reales
                await fetchDatos();
                window.dispatchEvent(new CustomEvent('edusync_data_updated'));
            }

            volverALista();
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    // --- Métricas para el panel derecho ---
    const totalCursos = cursos.length;
    const cursosSinArea = cursos.filter(c => !c.id_area).length;
    const cursosEspacioUnico = cursos.filter(c => c.requiere_espacio_unico).length;

    let maxAreaName = 'Ninguna';
    let maxAreaCount = 0;

    if (cursos.length > 0 && areas.length > 0) {
        const counts = {};
        cursos.forEach(c => {
            if (c.id_area) counts[c.id_area] = (counts[c.id_area] || 0) + 1;
        });

        let maxId = null;
        for (const [id, count] of Object.entries(counts)) {
            if (count > maxAreaCount) {
                maxAreaCount = count;
                maxId = id;
            }
        }

        if (maxId) {
            const area = areas.find(a => String(a.id_area) === String(maxId));
            if (area) {
                maxAreaName = area.nombre_area || area.nombre || 'Desconocida';
            }
        }
    }

    const cursosConArea = totalCursos - cursosSinArea;
    const porcentajeAsignados = totalCursos > 0 ? Math.round((cursosConArea / totalCursos) * 100) : 0;
    const areasUsadas = new Set(cursos.filter(c => c.id_area).map(c => c.id_area)).size;

    const cursosFiltrados = cursos.filter(c => {
        const matchesSearch = c.nombre_curso?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArea = selectedArea ? c.id_area?.toString() === selectedArea.toString() : true;
        return matchesSearch && matchesArea;
    });


    return (
        <div className="w-full animate-fade-in relative">
            <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-144px)]">
                {/* ===== LEFT SIDEBAR (1/4) ===== */}
                <ModuleSidebar
                    title="Directorio de Cursos"
                    description="Añade los cursos que se dictarán en tu colegio y conéctalas con el área a la que pertenecen."
                    onAddClick={abrirModalNueva}
                    addButtonText="Añadir Nuevos Cursos"
                    svgImage="/cursos.svg"
                    tipText={currentView === 'form' ? "El botón 'Único' indica que un curso requiere un laboratorio, taller o aula exclusiva para dictarse." : undefined}
                    stats={currentView === 'list' ? [
                        { label: 'Mayor Área', value: maxAreaCount > 0 ? maxAreaName : 'Ninguna', subtext: maxAreaCount > 0 ? `${maxAreaCount} cursos` : '0 cursos' },
                        { label: 'Espacio Único', value: cursosEspacioUnico, subtext: 'cursos' }
                    ] : undefined}
                />

                {/* ===== RIGHT CONTENT (3/4) ===== */}
                <main className="md:w-3/4 flex flex-col gap-5">
                    {/* Error */}
                    {error && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl flex items-center gap-3">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            <p className="text-sm font-medium">Usando datos locales por ahora debido a error de conectividad.</p>
                        </div>
                    )}

                    {/* Estado de Carga */}
                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
                        </div>
                    )}

                    {!loading && (
                        <>
                            {currentView === 'list' ? (
                                <>
                                    {/* Title */}
                                    <div className="px-2 flex">
                                        <h2 className="text-slate-800 text-[20px] font-black">Total cursos: {totalCursos} registrados</h2>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="flex flex-col sm:flex-row items-center bg-white rounded-[16px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-2 sm:h-14 gap-3">
                                        <div className="relative flex items-center flex-1 bg-slate-50 rounded-xl h-10 sm:h-full px-4 w-full">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                            <input
                                                type="text"
                                                placeholder="Buscar curso por nombre..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="flex-1 bg-transparent pl-3 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full w-full"
                                            />
                                            {searchTerm && (
                                                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 flex-shrink-0 cursor-pointer">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-[12px] font-bold text-slate-400 px-3 flex-shrink-0 whitespace-nowrap hidden sm:block">
                                            {cursosFiltrados.length} de {totalCursos}
                                        </span>
                                    </div>

                                    {/* Area Pills Filter */}
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar w-full">
                                        <button
                                            onClick={() => setSelectedArea('')}
                                            className={`cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${selectedArea === '' ? 'bg-[var(--color-brand-primary)]  text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Todas las áreas
                                        </button>
                                        {areas.map(a => {
                                            const id = a.id_area || a.id;
                                            const isSelected = selectedArea.toString() === id.toString();
                                            return (
                                                <button
                                                    key={id}
                                                    onClick={() => setSelectedArea(id)}
                                                    className={`cursor-pointer whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${isSelected ? 'bg-[var(--color-brand-primary)] text-white shadow-md shadow-indigo-500/30 border border-transparent' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                                                >
                                                    {a.nombre_area || a.nombre}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {cursosFiltrados.length === 0 ? (
                                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[32px] p-16 text-center">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                <svg width="32" height="32" fill="none" stroke="#cbd5e1" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800">No se encontraron cursos</h3>
                                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                                                {searchTerm ? 'Prueba buscando con otros términos o limpia el filtro.' : 'Comienza creando tu primer curso usando el botón en la cabecera superior.'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-x-12 gap-y-24 px-6 pt-6 pb-16">
                                            {cursosFiltrados.map((curso, index) => {
                                                const localId = curso.id_curso || curso.nombre_curso || `ID-${index}`;
                                                const areaEncontrada = areas.find(a => (a.id_area || a.id) === curso.id_area);
                                                // Buscar el índice original para que el color del libro no cambie al filtrar
                                                const originalIndex = cursos.findIndex(c => c === curso);
                                                return (
                                                    <CursoBookCard
                                                        key={localId}
                                                        curso={curso}
                                                        area={areaEncontrada}
                                                        index={originalIndex !== -1 ? originalIndex : index}
                                                        onEdit={abrirModalEdicion}
                                                        onDelete={eliminarCurso}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8 animate-fade-in flex flex-col min-h-[500px]">
                                    <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                                {isEditing ? (
                                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500 stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                ) : (
                                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500 stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                )}
                                            </div>
                                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{isEditing ? 'Editar Curso' : 'Añadir Cursos por Área'}</h2>
                                        </div>
                                        <button
                                            onClick={() => volverALista()}
                                            className="cursor-pointer text-[var(--color-brand-primary)] hover:text-[var(--color-brand-dark)] transition-colors flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                            Volver
                                        </button>
                                    </div>

                                    <div className="flex-1 flex flex-col items-center">
                                        <form id="cursoForm" onSubmit={handleGuardar} className="w-full max-w-4xl flex flex-col gap-8">
                                            
                                            {/* Sección 1: Selección de Área */}
                                            <div className="space-y-3">
                                                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                                    {isEditing ? "Área Académica Seleccionada" : "1. Selecciona el Área"}
                                                </label>
                                                
                                                {areas.length === 0 ? (
                                                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 font-medium flex items-center gap-3 shadow-sm">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                        No hay áreas registradas.
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                                                        {areas.map(area => {
                                                            const isSelected = nuevoCurso.id_area == area.id_area;
                                                            return (
                                                                <button
                                                                    key={area.id_area}
                                                                    type="button"
                                                                    onClick={() => setNuevoCurso({ ...nuevoCurso, id_area: area.id_area })}
                                                                    className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-light)] shadow-sm' : 'border-slate-100 hover:border-[var(--color-brand-primary)]/40 hover:bg-slate-50 bg-white'}`}
                                                                >
                                                                    <span className={`text-[13px] font-extrabold truncate pr-2 ${isSelected ? 'text-[var(--color-brand-primary)]' : 'text-slate-600'}`}>
                                                                        {area.nombre || area.nombre_area}
                                                                    </span>
                                                                    {isSelected ? (
                                                                        <div className="w-4 h-4 rounded-full bg-[var(--color-brand-primary)] flex items-center justify-center flex-shrink-0 shadow-sm">
                                                                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0"></div>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="border-t border-slate-100 w-full"></div>

                                            {/* Sección 2: Detalles del Curso */}
                                            <div className={`space-y-3 transition-opacity duration-300 ${nuevoCurso.id_area ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                                    {isEditing ? "Detalles del Curso" : "2. Añade los Cursos"}
                                                </label>

                                                {isEditing ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                                            </div>
                                                            <input
                                                                required
                                                                type="text"
                                                                placeholder="Ej. Matemática Básica I"
                                                                value={nuevoCurso.nombre_curso}
                                                                onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre_curso: e.target.value })}
                                                                className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-100 focus:border-[var(--color-brand-primary)] rounded-xl outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
                                                            />
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => setNuevoCurso({ ...nuevoCurso, requiere_espacio_unico: !nuevoCurso.requiere_espacio_unico })}
                                                            className={`w-full px-4 py-2.5 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${nuevoCurso.requiere_espacio_unico
                                                                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-light)] shadow-sm'
                                                                : 'border-slate-100 bg-white hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${nuevoCurso.requiere_espacio_unico ? 'bg-[var(--color-brand-primary)] text-white shadow-md' : 'bg-slate-100 text-slate-400 shadow-sm'
                                                                    }`}>
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                                                                </div>
                                                                <div className="text-left">
                                                                    <span className={`text-sm font-extrabold block ${nuevoCurso.requiere_espacio_unico ? 'text-[var(--color-brand-primary)]' : 'text-slate-700'}`}>Requiere Espacio Único</span>
                                                                    <span className="text-[11px] text-slate-500 font-bold">Laboratorio o taller exclusivo</span>
                                                                </div>
                                                            </div>
                                                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${nuevoCurso.requiere_espacio_unico ? 'bg-[var(--color-brand-primary)]' : 'bg-slate-200'}`}>
                                                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${nuevoCurso.requiere_espacio_unico ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                            </div>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div className="flex flex-col sm:flex-row gap-3">
                                                            <div className="relative group flex-1">
                                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[var(--color-brand-primary)] transition-colors">
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Ej. Matemática Básica I"
                                                                    value={inputCursoVirtual}
                                                                    onChange={(e) => setInputCursoVirtual(e.target.value)}
                                                                    onKeyDown={handleAddCursoToList}
                                                                    className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-100 focus:border-[var(--color-brand-primary)] rounded-xl outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-400 shadow-sm"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const val = inputCursoVirtual.trim();
                                                                    if (val && !cursosNuevos.some(c => c.nombre === val)) {
                                                                        setCursosNuevos([...cursosNuevos, { nombre: val, requiere_espacio_unico: false }]);
                                                                        setInputCursoVirtual('');
                                                                    }
                                                                }}
                                                                disabled={!inputCursoVirtual.trim()}
                                                                className="px-6 py-3.5 bg-[var(--color-brand-primary)] text-white font-extrabold text-[13px] rounded-xl hover:bg-[#3424c2] shadow-[0_4px_12px_rgba(47,91,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                                Agregar
                                                            </button>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-bold ml-2 flex items-center gap-1.5">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
                                                            Presiona <strong>Enter</strong> o haz clic en Agregar para añadir el curso a la lista de abajo.
                                                        </p>

                                                        {cursosNuevos.length > 0 && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-slate-100 max-h-[220px] overflow-y-auto custom-scrollbar">
                                                                {cursosNuevos.map(c => (
                                                                    <div key={c.nombre} className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-[14px] border border-slate-200 transition-all animate-fade-in hover:border-slate-300 hover:shadow-sm bg-white ${c.requiere_espacio_unico ? 'ring-2 ring-[var(--color-brand-primary)]/20' : ''}`}>
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${c.requiere_espacio_unico ? 'bg-[var(--color-brand-light)] text-[var(--color-brand-primary)]' : 'bg-slate-100 text-slate-400'}`}>
                                                                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                                                            </div>
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className="text-[13px] font-extrabold text-slate-800 truncate leading-tight">{c.nombre}</span>
                                                                                <span className="text-[10px] font-bold text-slate-400 mt-0.5">Curso añadido</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleEspacioUnicoCurso(c.nombre)}
                                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 ${
                                                                                    c.requiere_espacio_unico 
                                                                                        ? 'bg-[var(--color-brand-primary)] text-white shadow-[var(--color-brand-primary)]/20 hover:bg-[var(--color-brand-dark)] border border-transparent' 
                                                                                        : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                                                                }`}
                                                                                title="Alternar espacio único"
                                                                            >
                                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                                    {c.requiere_espacio_unico ? (
                                                                                        <path d="M20 6L9 17l-5-5" />
                                                                                    ) : (
                                                                                        <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></>
                                                                                    )}
                                                                                </svg>
                                                                                <span className="text-[10px] font-black uppercase tracking-wider">{c.requiere_espacio_unico ? 'Activado' : 'Único'}</span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeCursoFromList(c.nombre)}
                                                                                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all cursor-pointer flex-shrink-0 shadow-sm active:scale-95">
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Botones Footer (Igual a AreasManager) */}
                                            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100 mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => volverALista()}
                                                    className="cursor-pointer py-3.5 px-6 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={guardando || !nuevoCurso.id_area || (!isEditing && (cursosNuevos.length === 0 && inputCursoVirtual.trim() === '')) || (isEditing && !nuevoCurso.nombre_curso)}
                                                    className="cursor-pointer py-3.5 px-8 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)] text-white text-sm font-bold rounded-xl shadow-md shadow-[var(--color-brand-primary)]/20 hover:shadow-lg hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {guardando ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            Guardando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            {isEditing ? 'Guardar Cambios' : `Guardar ${cursosNuevos.length || 1} Curso(s)`}
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>


                {/* Modal Confirmación de Eliminar */}
                {isDeleteModalOpen && cursoToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
                        <div
                            className="bg-white rounded-[24px] shadow-2xl w-full max-w-[340px] overflow-hidden transform animate-slide-up p-8 text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Icono de advertencia */}
                            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#f43f5e" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <h2 className="text-[20px] font-extrabold text-slate-800 mb-2">Eliminar Curso</h2>
                            <p className="text-slate-500 text-[14px] font-medium mb-8 leading-relaxed">
                                Estás a punto de eliminar el curso <strong className="text-slate-700">"{cursoToDelete.nombre_curso}"</strong>. ¿Estás seguro?
                            </p>

                            <div className="flex items-center gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setCursoToDelete(null);
                                    }}
                                    disabled={eliminando}
                                    className="cursor-pointer flex-1 py-3 text-[13px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-all disabled:opacity-50"
                                >
                                    No, Conservarlo
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
        </div>
    );
}

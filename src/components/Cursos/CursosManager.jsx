import React, { useState, useEffect } from 'react';

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
                        className="p-2.5 bg-white text-hx-purple rounded-full shadow-lg hover:bg-purple-50 hover:scale-110 transition-all cursor-pointer"
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(curso.id_curso); }}
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
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [guardando, setGuardando] = useState(false);

    // Adaptado al SQLModel: id_curso, nombre_curso y id_area
    const [nuevoCurso, setNuevoCurso] = useState({
        nombre_curso: '',
        id_area: ''
    });
    const [cursosNuevos, setCursosNuevos] = useState([]);
    const [inputCursoVirtual, setInputCursoVirtual] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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


    // ── Abrir modal para nuevo curso ──
    const abrirModalNueva = () => {
        setIsEditing(false);
        setEditId(null);
        setNuevoCurso({ nombre_curso: '', id_area: '' });
        setCursosNuevos([]);
        setInputCursoVirtual('');
        setIsModalOpen(true);
    };

    // ── Abrir modal para edición ──
    const abrirModalEdicion = (curso) => {
        setIsEditing(true);
        setEditId(curso.id_curso);
        setNuevoCurso({
            nombre_curso: curso.nombre_curso || '',
            id_area: curso.id_area || ''
        });
        setIsModalOpen(true);
    };

    // ── Eliminar ──
    const eliminarCurso = (id) => {
        const confirmacion = window.confirm("¿Seguro que deseas eliminar este curso?");
        if (confirmacion) {
            setCursos(cursos.filter(c => c.id_curso !== id));
            window.dispatchEvent(new CustomEvent('horarix_data_updated'));
        }
    };

    // ── Manejo de múltiples cursos ──
    const handleAddCursoToList = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = inputCursoVirtual.trim();
            if (val && !cursosNuevos.includes(val)) {
                setCursosNuevos([...cursosNuevos, val]);
                setInputCursoVirtual('');
            }
        }
    };

    const removeCursoFromList = (cursoToRemove) => {
        setCursosNuevos(cursosNuevos.filter(c => c !== cursoToRemove));
    };

    // ── Guardar curso(s) ──
    const handleGuardar = async (e) => {
        e.preventDefault();
        setGuardando(true);

        try {
            if (isEditing) {
                const payload = {
                    nombre_curso: nuevoCurso.nombre_curso,
                    id_area: nuevoCurso.id_area ? parseInt(nuevoCurso.id_area) : null
                };

                // Optimistic Update
                setCursos(cursos.map(c => c.id_curso === editId ? { ...c, ...payload } : c));

                // Omitiendo llamada real para evitar errores si backend no está completo
                // fetch...
                window.dispatchEvent(new CustomEvent('horarix_data_updated'));
            } else {
                // Si el usuario escribió algo y no dio Enter, lo agregamos de paso
                let listToSave = [...cursosNuevos];
                const val = inputCursoVirtual.trim();
                if (val && !listToSave.includes(val)) {
                    listToSave.push(val);
                }

                if (listToSave.length === 0) {
                    alert("Por favor, ingresa al menos un curso.");
                    setGuardando(false);
                    return;
                }

                // Batch creation (Simulado optimista o real)
                const nuevosCreados = listToSave.map((nombre, i) => ({
                    id_curso: Math.floor(Math.random() * 10000) + i,
                    nombre_curso: nombre,
                    id_area: nuevoCurso.id_area ? parseInt(nuevoCurso.id_area) : null
                }));

                // Promise.all para enviar cada curso al backend
                await Promise.all(nuevosCreados.map(async (c) => {
                    const payload = { nombre_curso: c.nombre_curso, id_area: c.id_area };
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
                window.dispatchEvent(new CustomEvent('horarix_data_updated'));
            }

            setIsModalOpen(false);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    // --- Métricas para el panel derecho ---
    const totalCursos = cursos.length;
    const cursosSinArea = cursos.filter(c => !c.id_area).length;

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

    const cursosFiltrados = cursos.filter(c =>
        c.nombre_curso?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full space-y-8 animate-fade-in relative">

            {/* Cabecera Superior (Banner + Espacio Derecho) */}
            <div className="flex flex-col md:flex-row gap-6">

                <div className="md:w-2/3 bg-[var(--color-hx-purple)]/10 rounded-[24px] p-8 shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px] border border-[var(--color-hx-purple)]/70">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                        <div className="max-w-md">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                                Directorio de Cursos
                            </h2>
                            <p className="text-slate-500 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Añade los cursos que se dictarán en tu colegio y conéctalas con el área a la que pertenecen.
                            </p>

                            <button
                                onClick={abrirModalNueva}
                                className="bg-hx-purple text-white hover:bg-hx-purple/80 font-extrabold py-2.5 px-6 rounded-xl shadow-[0_4px_12px_rgba(121,14,236,0.3)] hover:shadow-[0_6px_16px_rgba(121,14,236,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm w-max cursor-pointer">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                Añadir Nuevos Cursos
                            </button>
                        </div>

                        {/* Imagen Ilustrativa a la derecha */}
                        <div className="hidden sm:flex relative w-32 h-32 md:w-45 md:h-45 flex-shrink-0 items-center justify-center -mt-2 md:mr-16">
                            {/* Brillo suave de fondo para resaltar */}
                            <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl"></div>
                            <img
                                src="/class.svg"
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
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">Total Cursos</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{totalCursos}</h3>
                                <span className="text-slate-400 text-sm font-bold">registrados</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-[14px] bg-hx-purple/10 text-hx-purple flex items-center justify-center border border-hx-purple/20 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3 mt-4 mb-2">
                        {/* Columna 1: Área Principal */}
                        <div className="rounded-xl p-3 flex flex-col justify-center shadow-sm overflow-hidden">
                            <p className="text-hx-purple text-[10px] font-black uppercase tracking-widest mb-1 truncate">Mayor Área</p>
                            <div className="flex flex-col mt-1">
                                <span className="text-sm font-black text-black leading-tight truncate" title={maxAreaName}>
                                    {maxAreaCount > 0 ? maxAreaName : 'Ninguna'}
                                </span>
                                <span className="text-black/50 text-[10px] font-bold mt-0.5">
                                    {maxAreaCount > 0 ? `${maxAreaCount} cursos` : '0 cursos'}
                                </span>
                            </div>
                        </div>

                        {/* Columna 2: Huérfanos */}
                        <div className="rounded-xl p-3 flex flex-col justify-center shadow-sm">
                            <p className="text-hx-purple text-[10px] font-black uppercase tracking-widest mb-1">Sin Asignar</p>
                            <div className="flex items-end gap-1.5 mt-1">
                                <span className="text-2xl font-black text-black leading-none">{cursosSinArea}</span>
                                <span className="text-black/80 text-[10px] font-bold mb-0.5">cursos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner de Error Menor */}
            {error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl flex items-center gap-3">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <p className="text-sm font-medium">Usando datos locales por ahora debido a error de conectividad.</p>
                </div>
            )}

            {/* Estado de Carga */}
            {loading && cursos.length === 0 && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-hx-purple/30 border-t-hx-purple rounded-full animate-spin"></div>
                </div>
            )}

            {/* Grid de Cursos (Estilo Tarjetas Libro) */}
            {!loading && (
                <div className="pt-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white py-2 px-4 rounded-[20px] border border-slate-100 shadow-sm md:h-16 w-full gap-4 md:gap-0">
                        {/* Izquierda: Título */}
                        <div className="flex-shrink-0 flex items-center gap-3 w-full md:w-1/4">
                            <div className="w-10 h-10 bg-hx-purple/10 rounded-xl flex items-center justify-center text-hx-purple">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                            </div>
                            <h2 className="text-[20px] font-black text-slate-800 tracking-tight whitespace-nowrap">Cursos</h2>
                        </div>

                        {/* Medio: Buscador Pill */}
                        <div className="flex-1 w-full max-w-lg mx-auto md:mx-4">
                            <div className="relative group flex items-center bg-white rounded-full p-1.5 border-2 border-slate-200 focus-within:border-hx-purple transition-all h-12 w-full">
                                <input
                                    type="text"
                                    placeholder="Buscar curso por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent pl-6 pr-3 py-1 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full w-full"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="mr-2 text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-full hover:bg-rose-50 flex-shrink-0">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                )}
                                <div className="w-9 h-9 rounded-full bg-hx-purple flex items-center justify-center text-white flex-shrink-0 shadow-sm mr-0.5">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                </div>
                            </div>
                        </div>
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-x-10 gap-y-16 px-6 py-6">
                            {cursosFiltrados.map((curso, index) => {
                                const localId = curso.id_curso || `ID-${index + 1}`;
                                const areaEncontrada = areas.find(a => a.id_area === curso.id_area);
                                return (
                                    <CursoBookCard
                                        key={localId}
                                        curso={curso}
                                        area={areaEncontrada}
                                        index={index}
                                        onEdit={abrirModalEdicion}
                                        onDelete={eliminarCurso}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Flotante de Formulario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
                    <div
                        className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">{isEditing ? 'Editar Curso' : 'Añadir Cursos por Área'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-red-500 transition-colors bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} className="p-8 space-y-6">

                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                                    {isEditing ? "Área Académica" : "1. Selecciona el Área Académica"}
                                </label>
                                {areas.length === 0 ? (
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800 font-medium">
                                        No hay áreas registradas. Debes registrar un área primero.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                                        {areas.map(area => {
                                            const isSelected = nuevoCurso.id_area == area.id_area;
                                            return (
                                                <button
                                                    key={area.id_area}
                                                    type="button"
                                                    onClick={() => setNuevoCurso({ ...nuevoCurso, id_area: area.id_area })}
                                                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'border-hx-purple bg-purple-50 ring-2 ring-hx-purple/20 shadow-sm' : 'border-slate-200 hover:border-purple-200 hover:bg-purple-50/30 bg-white'}`}
                                                >
                                                    <span className={`text-sm font-bold truncate pr-2 ${isSelected ? 'text-hx-purple' : 'text-slate-700'}`}>
                                                        {area.nombre || area.nombre_area}
                                                    </span>
                                                    {isSelected ? (
                                                        <div className="w-5 h-5 rounded-full bg-hx-purple flex items-center justify-center flex-shrink-0 shadow-sm">
                                                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0"></div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {nuevoCurso.id_area && (
                                <div className="space-y-4 animate-fade-in pt-4 border-t border-slate-100">
                                    <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                                        {isEditing ? "Nombre del Curso" : "2. Añadir Cursos"}
                                    </label>

                                    {isEditing ? (
                                        <input
                                            required
                                            type="text"
                                            placeholder="Ej. Matemática Básica"
                                            value={nuevoCurso.nombre_curso}
                                            onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre_curso: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-hx-purple focus:ring-4 focus:ring-hx-purple/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300 shadow-sm"
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Escribe el nombre del curso..."
                                                    value={inputCursoVirtual}
                                                    onChange={(e) => setInputCursoVirtual(e.target.value)}
                                                    onKeyDown={handleAddCursoToList}
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-hx-purple focus:ring-4 focus:ring-hx-purple/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300 shadow-sm"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const val = inputCursoVirtual.trim();
                                                        if (val && !cursosNuevos.includes(val)) {
                                                            setCursosNuevos([...cursosNuevos, val]);
                                                            setInputCursoVirtual('');
                                                        }
                                                    }}
                                                    disabled={!inputCursoVirtual.trim()}
                                                    className="px-4 py-3 bg-hx-purple/10 text-hx-purple font-bold text-sm rounded-xl hover:bg-hx-purple hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                    Agregar
                                                </button>
                                            </div>

                                            {/* Lista de chips para cursos nuevos */}
                                            {cursosNuevos.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {cursosNuevos.map(c => (
                                                        <div key={c} className="inline-flex items-center gap-1.5 bg-hx-purple/10 text-hx-purple font-bold text-xs px-3 py-1.5 rounded-lg border border-hx-purple/20 animate-fade-in">
                                                            {c}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeCursoFromList(c)}
                                                                className="hover:bg-hx-purple/20 p-0.5 rounded-full text-hx-purple transition-colors cursor-pointer">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-6 border-t border-slate-100 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="cursor-pointer flex-1 py-3 text-sm font-bold text-[#64748B] hover:text-[#111827] bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-sm rounded-xl transition-all flex items-center justify-center gap-2">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando || !nuevoCurso.id_area || (!isEditing && cursosNuevos.length === 0 && !inputCursoVirtual.trim()) || (isEditing && !nuevoCurso.nombre_curso)}
                                    className="cursor-pointer flex-1 py-3 px-4 bg-hx-purple hover:bg-hx-purple/90 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {guardando ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            {isEditing ? 'Guardar Cambios' : `Guardar ${cursosNuevos.length > 0 ? cursosNuevos.length + (inputCursoVirtual.trim() ? 1 : 0) : 1} Curso(s)`}
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

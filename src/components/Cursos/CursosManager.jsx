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
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalTutoriaOpen, setIsModalTutoriaOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [guardando, setGuardando] = useState(false);

    // Modal de confirmación de eliminación
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [cursoToDelete, setCursoToDelete] = useState(null);
    const [eliminando, setEliminando] = useState(false);

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
            id_area: curso.id_area || '',
            requiere_espacio_unico: curso.requiere_espacio_unico || false
        });
        setIsModalOpen(true);
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
            window.dispatchEvent(new CustomEvent('horarix_data_updated'));
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

                window.dispatchEvent(new CustomEvent('horarix_data_updated'));
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

    const cursosFiltrados = cursos.filter(c =>
        c.nombre_curso?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Habilitar Tutoría ---
    const existeTutoria = cursos.some(c => c.nombre_curso && c.nombre_curso.includes("Tutoría"));

    const handleConfigurarTutoria = async (tipo) => {
        setGuardando(true);
        const nombreDelCurso = tipo === 'oficial' ? 'Tutoría' : 'Tutoría Psicológica';

        try {
            // 1. Buscar o crear área "Desarrollo Personal"
            let areaId = null;
            const areaExistente = areas.find(a =>
                (a.nombre_area || a.nombre) === "Desarrollo Personal" || (a.nombre_area || a.nombre) === "Tutoría"
            );

            if (areaExistente) {
                areaId = areaExistente.id_area;
            } else {
                const resArea = await fetch(`${API_BASE}/areas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: "Desarrollo Personal", max_horas_dia: 2 })
                });
                if (!resArea.ok) throw new Error("Error al crear el área");
                const newArea = await resArea.json();
                areaId = newArea.id_area || newArea.id;
            }

            // 2. Crear curso
            const resCurso = await fetch(`${API_BASE}/cursos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre_curso: nombreDelCurso,
                    id_area: areaId,
                    requiere_espacio_unico: false
                })
            });

            if (!resCurso.ok) throw new Error("Error al crear el curso");

            // 3. Recargar datos
            await fetchDatos();
            window.dispatchEvent(new Event('horarix_data_updated'));
            setIsModalTutoriaOpen(false);

        } catch (err) {
            alert(`Error al habilitar Tutoría: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-fade-in relative">

            {/* Cabecera Superior (Banner + Espacio Derecho) */}
            <div className="flex flex-col md:flex-row gap-6">

                <div className="md:w-2/3 bg-[var(--color-brand-primary)]/10 rounded-[24px] p-8 shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px] border border-[var(--color-brand-primary)]/70">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                        <div className="max-w-md">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                                Directorio de Cursos
                            </h2>
                            <p className="text-slate-500 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Añade los cursos que se dictarán en tu colegio y conéctalas con el área a la que pertenecen.
                            </p>

                            <div className="flex flex-wrap items-center gap-3">
                                {existeTutoria ? (
                                    <button
                                        onClick={abrirModalNueva}
                                        className="bg-brand-primary text-white hover:bg-brand-primary/80 font-extrabold py-2.5 px-6 rounded-xl shadow-[0_4px_12px_rgba(47, 91, 255,0.3)] hover:shadow-[0_6px_16px_rgba(47, 91, 255,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm w-max cursor-pointer">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                        Añadir Nuevos Cursos
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsModalTutoriaOpen(true)}
                                        className="bg-brand-primary text-white hover:bg-brand-primary/80 font-extrabold py-2.5 px-6 rounded-xl shadow-[0_4px_12px_rgba(47, 91, 255,0.3)] hover:shadow-[0_6px_16px_rgba(47, 91, 255,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm w-max cursor-pointer"
                                        title="Primero configura el curso de Tutoría">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                        Configurar Tutoría
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Imagen Ilustrativa a la derecha */}
                        <div className="hidden sm:flex relative w-32 h-32 md:w-45 md:h-45 flex-shrink-0 items-center justify-center -mt-2 md:mr-16">
                            {/* Brillo suave de fondo para resaltar */}
                            <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl"></div>
                            <img
                                src="/cursos.svg"
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
                        <div className="w-12 h-12 rounded-[14px] bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3 mt-4 mb-2">
                        {/* Columna 1: Área Principal */}
                        <div className="rounded-xl p-3 flex flex-col justify-center shadow-sm overflow-hidden">
                            <p className="text-brand-primary text-[10px] font-black uppercase tracking-widest mb-1 truncate">Mayor Área</p>
                            <div className="flex flex-col mt-1">
                                <span className="text-sm font-black text-black leading-tight truncate" title={maxAreaName}>
                                    {maxAreaCount > 0 ? maxAreaName : 'Ninguna'}
                                </span>
                                <span className="text-black/50 text-[10px] font-bold mt-0.5">
                                    {maxAreaCount > 0 ? `${maxAreaCount} cursos` : '0 cursos'}
                                </span>
                            </div>
                        </div>

                        {/* Columna 2: Espacio Único */}
                        <div className="rounded-xl p-3 flex flex-col justify-center shadow-sm">
                            <p className="text-brand-primary text-[10px] font-black uppercase tracking-widest mb-1">Espacio Único</p>
                            <div className="flex items-end gap-1.5 mt-1">
                                <span className="text-2xl font-black text-black leading-none">{cursosEspacioUnico}</span>
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
                    <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
                </div>
            )}

            {/* Grid de Cursos (Estilo Tarjetas Libro) */}
            {!loading && (
                <div className="pt-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white py-2 px-4 rounded-[20px] border border-slate-100 shadow-sm md:h-16 w-full gap-4 md:gap-0">
                        {/* Izquierda: Título */}
                        <div className="flex-shrink-0 flex items-center gap-3 w-full md:w-1/4">
                            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                            </div>
                            <h2 className="text-[20px] font-black text-slate-800 tracking-tight whitespace-nowrap">Cursos</h2>
                        </div>

                        {/* Medio: Buscador Pill */}
                        <div className="flex-1 w-full max-w-lg mx-auto md:mx-4">
                            <div className="relative group flex items-center bg-white rounded-full p-1.5 border-2 border-slate-200 focus-within:border-brand-primary transition-all h-12 w-full">
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
                                <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-white flex-shrink-0 shadow-sm mr-0.5">
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
                        className="bg-white rounded-3xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden transform animate-slide-up"
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
                                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1 stylish-scroll">
                                        {areas.map(area => {
                                            const isSelected = nuevoCurso.id_area == area.id_area;
                                            return (
                                                <button
                                                    key={area.id_area}
                                                    type="button"
                                                    onClick={() => setNuevoCurso({ ...nuevoCurso, id_area: area.id_area })}
                                                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'border-brand-primary bg-[var(--color-brand-light)] ring-2 ring-brand-primary/20 shadow-sm' : 'border-slate-200 hover:border-[var(--color-brand-light)] hover:bg-[var(--color-brand-light)]/30 bg-white'}`}
                                                >
                                                    <span className={`text-sm font-bold truncate pr-2 ${isSelected ? 'text-brand-primary' : 'text-slate-700'}`}>
                                                        {area.nombre || area.nombre_area}
                                                    </span>
                                                    {isSelected ? (
                                                        <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0 shadow-sm">
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
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300 shadow-sm"
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
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300 shadow-sm"
                                                    autoFocus
                                                />
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
                                                    className="px-4 py-3 bg-brand-primary/10 text-brand-primary font-bold text-sm rounded-xl hover:bg-brand-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                    Agregar
                                                </button>
                                            </div>
                                            <p className="text-[11px] font-medium text-slate-500 pl-1">
                                                Presiona <strong>Enter</strong> o haz clic en <strong>Agregar</strong> para añadirlo a la lista inferior.
                                            </p>

                                            {/* Lista de chips para cursos nuevos */}
                                            {cursosNuevos.length > 0 && (
                                                <div className="flex flex-col gap-2.5 pt-3 max-h-[200px] overflow-y-auto pr-1 stylish-scroll">
                                                    {cursosNuevos.map(c => (
                                                        <div key={c.nombre} className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 border-l-4 transition-all animate-fade-in ${c.requiere_espacio_unico
                                                            ? 'bg-[var(--color-brand-light)] border-brand-primary/30 border-l-brand-primary'
                                                            : 'bg-brand-primary/5 border-brand-primary/15 border-l-brand-primary/50'
                                                            }`}>
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-7 h-7 rounded-lg bg-brand-primary/15 flex items-center justify-center flex-shrink-0">
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                                                                </div>
                                                                <span className="text-sm font-bold text-slate-800 truncate">{c.nombre}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className={`text-[10px] font-bold whitespace-nowrap ${c.requiere_espacio_unico ? 'text-brand-primary' : 'text-slate-400'}`}>Espacio Único</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleEspacioUnicoCurso(c.nombre)}
                                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer flex-shrink-0 ${c.requiere_espacio_unico ? 'bg-brand-primary' : 'bg-slate-300'
                                                                        }`}
                                                                    title="Requiere espacio único (aula exclusiva)"
                                                                >
                                                                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${c.requiere_espacio_unico ? 'translate-x-5' : 'translate-x-0'
                                                                        }`}></div>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeCursoFromList(c.nombre)}
                                                                    className="hover:bg-red-100 p-1.5 rounded-full text-slate-400 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0">
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
                            )}

                            {/* Toggle: Requiere Espacio Único (solo en edición individual) */}
                            {isEditing && nuevoCurso.id_area && (
                                <div className="pt-4 border-t border-slate-100 animate-fade-in">
                                    <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-2 block">
                                        Configuración
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setNuevoCurso({ ...nuevoCurso, requiere_espacio_unico: !nuevoCurso.requiere_espacio_unico })}
                                        className={`w-full p-3 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer ${nuevoCurso.requiere_espacio_unico
                                            ? 'border-brand-primary bg-[var(--color-brand-light)] shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${nuevoCurso.requiere_espacio_unico ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                                            </div>
                                            <div className="text-left">
                                                <span className={`text-sm font-bold block ${nuevoCurso.requiere_espacio_unico ? 'text-brand-primary' : 'text-slate-700'}`}>Requiere Espacio Único</span>
                                                <span className="text-[11px] text-slate-400 font-medium">Necesita un aula o laboratorio exclusivo</span>
                                            </div>
                                        </div>
                                        {/* Switch visual */}
                                        <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${nuevoCurso.requiere_espacio_unico ? 'bg-brand-primary' : 'bg-slate-200'}`}>
                                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${nuevoCurso.requiere_espacio_unico ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                    </button>
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
                                    disabled={guardando || !nuevoCurso.id_area || (!isEditing && (cursosNuevos.length === 0 || inputCursoVirtual.trim() !== '')) || (isEditing && !nuevoCurso.nombre_curso)}
                                    className="cursor-pointer flex-1 py-3 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {guardando ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            {isEditing ? 'Guardar Cambios' : `Guardar ${cursosNuevos.length} Curso(s)`}
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Configuración de Tutoría */}
            {isModalTutoriaOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalTutoriaOpen(false)}></div>
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-fade-in flex flex-col border border-slate-100">
                        {/* Cabecera */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-brand-primary/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">Configurar Tutoría</h3>
                            </div>
                            <button onClick={() => setIsModalTutoriaOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer shadow-sm border border-slate-100">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-2">
                                Para configurar correctamente el horario de este curso, responde la siguiente pregunta:
                            </p>
                            <h4 className="text-[13px] font-black text-brand-primary uppercase tracking-wider text-center">¿Quién dictará este curso?</h4>

                            <div className="flex flex-col gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => handleConfigurarTutoria('oficial')}
                                    disabled={guardando}
                                    className="text-left p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-brand-primary hover:bg-[var(--color-brand-light)] transition-all cursor-pointer group flex flex-col items-start relative overflow-hidden disabled:opacity-50"
                                >
                                    <span className="font-black text-slate-800 text-base group-hover:text-brand-primary transition-colors">Solo el Encargado del Aula</span>
                                    <span className="text-xs text-slate-500 font-medium mt-1">El sistema obligará a que el Tutor asignado de la sección dicte este curso.</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleConfigurarTutoria('normal')}
                                    disabled={guardando}
                                    className="text-left p-4 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer group flex flex-col items-start relative overflow-hidden disabled:opacity-50"
                                >
                                    <span className="font-black text-slate-800 text-base group-hover:text-slate-900">Tiene otro docente a cargo</span>
                                    <span className="text-xs text-slate-500 font-medium mt-1">El curso será tratado como un curso normal (ideal para un Psicólogo).</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
    );
}

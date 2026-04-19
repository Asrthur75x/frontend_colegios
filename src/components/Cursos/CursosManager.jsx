import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

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

    // ── Cargar cursos y áreas del backend al montar ──
    const fetchDatos = async () => {
        try {
            setLoading(true);
            const [resCursos, resAreas] = await Promise.all([
                fetch(`${API_BASE}/cursos`).catch(() => ({ ok: false, json: async () => [] })),
                fetch(`${API_BASE}/areas`).catch(() => ({ ok: false, json: async () => [] }))
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
            console.warn("No se pudo obtener datos del backend.", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDatos();
    }, []);

    // ── Abrir modal para nuevo curso ──
    const abrirModalNueva = () => {
        setIsEditing(false);
        setEditId(null);
        setNuevoCurso({ nombre_curso: '', id_area: '' });
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
        }
    };

    // ── Guardar curso ──
    const handleGuardar = async (e) => {
        e.preventDefault();
        setGuardando(true);

        const payload = {
            nombre_curso: nuevoCurso.nombre_curso,
            id_area: nuevoCurso.id_area ? parseInt(nuevoCurso.id_area) : null
        };

        try {
            if (isEditing) {
                setCursos(cursos.map(c => c.id_curso === editId
                    ? { ...c, ...payload }
                    : c
                ));
            } else {
                const nuevoId = Math.floor(Math.random() * 1000);
                const objNuevo = {
                    id_curso: nuevoId,
                    ...payload
                };

                try {
                    const res = await fetch(`${API_BASE}/cursos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        await fetchDatos();
                    } else {
                        setCursos([...cursos, objNuevo]);
                    }
                } catch (apiErr) {
                    setCursos([...cursos, objNuevo]);
                }
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
                    <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">Directorio de Cursos</h1>
                    <p className="text-[#64748B] mt-2 text-sm max-w-xl">
                        Gestiona y explora todas las asignaturas de la institución en un formato rápido.
                    </p>
                </div>
                <button
                    onClick={abrirModalNueva}
                    className="cursor-pointer bg-[#1A5AD7] hover:bg-[#1A5AD7]/90 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    Añadir Nuevo
                </button>
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
                    <div className="w-8 h-8 border-4 border-[#1A5AD7]/30 border-t-[#1A5AD7] rounded-full animate-spin"></div>
                </div>
            )}

            {/* Grid de Cursos (Estilo Tarjetas) */}
            <div className="pt-2">
                {!loading && cursos.length === 0 && (
                    <div className="text-center py-16 text-[#64748B] font-medium bg-white rounded-3xl border border-slate-100 shadow-sm">
                        Todavía no hay ningún curso en la base de datos.
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-2">
                    {cursos.map((curso, idx) => {
                        const localId = curso.id_curso || `ID-${idx + 1}`;
                        const areaEncontrada = areas.find(a => a.id_area === curso.id_area);

                        return (
                            <div key={localId} className="bg-white rounded-[24px] relative shadow-lg hover:shadow-xl transition-shadow border-[3px] border-[#1A5AD7] p-6 pt-8 mt-5 flex flex-col">

                                {/* Pestaña/Ribbon flotante superior izquierda */}
                                <div className="absolute -top-5 left-6 bg-[#1A5AD7] text-white w-14 h-[64px] rounded-b-2xl shadow-md flex items-center justify-center flex-col z-10 border-[3px] border-white">
                                    {/* Icono de curso (reemplaza el número 01, 02...) */}
                                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                                </div>

                                {/* Contenido Header: Nombre y Acciones (icono a la derecha de DATA) */}
                                <div className="flex items-start justify-between mt-6 mb-3">
                                    <h3 className="font-black text-[#111827] text-[17px] leading-tight line-clamp-2 pr-2" title={curso.nombre_curso || "Sin Nombre"}>
                                        {curso.nombre_curso || "Sin Nombre"}
                                    </h3>

                                    {/* Botones de acción minimalistas a la derecha (como el icono en la imagen de DATA 01) */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => abrirModalEdicion(curso)} className="cursor-pointer text-slate-400 hover:text-[#1A5AD7] p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                        </button>
                                        <button onClick={() => eliminarCurso(localId)} className="cursor-pointer text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Párrafo simulando el texto Lorem Ipsum de la imagen, con los datos reales */}
                                <div className="text-slate-500 text-[13px] leading-relaxed mb-6 flex-1">
                                    <p className="mb-1.5">
                                        <strong className="text-slate-700 font-bold">Área:</strong> {areaEncontrada ? areaEncontrada.nombre_area : "Sin asignar"}
                                    </p>
                                    <p>
                                        <strong className="text-slate-700 font-bold">Código:</strong> {localId}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Flotante de Formulario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
                    <div
                        className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">{isEditing ? 'Editar Curso' : 'Nuevo Curso'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-red-500 transition-colors bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} className="p-8 space-y-6">

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Nombre del Curso</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej. Matemática Básica"
                                    value={nuevoCurso.nombre_curso}
                                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre_curso: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1A5AD7] focus:ring-4 focus:ring-[#1A5AD7]/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Área Académica</label>
                                <select
                                    required
                                    value={nuevoCurso.id_area}
                                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, id_area: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1A5AD7] focus:ring-4 focus:ring-[#1A5AD7]/10 outline-none transition-all text-sm font-medium text-[#111827] bg-white cursor-pointer"
                                >
                                    <option value="" disabled>-- Selecciona un área --</option>
                                    {areas.map(area => (
                                        <option key={area.id_area} value={area.id_area}>
                                            {area.nombre_area}
                                        </option>
                                    ))}
                                </select>
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

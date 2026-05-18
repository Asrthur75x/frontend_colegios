import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

// Paleta idéntica a CursosManager
const CURSO_COLORS = [
    { bg: '#1e293b', spine: '#0f172a', text: '#f1f5f9', light: '#f1f5f9' },
    { bg: '#a855f7', spine: '#9333ea', text: '#ffffff', light: '#faf5ff' },
    { bg: '#f43f5e', spine: '#e11d48', text: '#ffffff', light: '#fff1f2' },
    { bg: '#10b981', spine: '#059669', text: '#ffffff', light: '#f0fdf4' },
    { bg: '#3b82f6', spine: '#2563eb', text: '#ffffff', light: '#eff6ff' },
    { bg: '#f59e0b', spine: '#d97706', text: '#1c1917', light: '#fffbeb' },
    { bg: '#06b6d4', spine: '#0891b2', text: '#ffffff', light: '#ecfeff' },
    { bg: '#ec4899', spine: '#db2777', text: '#ffffff', light: '#fdf2f8' },
    { bg: '#8b5cf6', spine: '#7c3aed', text: '#ffffff', light: '#f5f3ff' },
    { bg: '#14b8a6', spine: '#0d9488', text: '#ffffff', light: '#f0fdfa' },
    { bg: '#ef4444', spine: '#dc2626', text: '#ffffff', light: '#fef2f2' },
    { bg: '#6366f1', spine: '#4f46e5', text: '#ffffff', light: '#eef2ff' },
];

// Tarjeta de profesor estilo "Web Design card"
const ProfesorEspecialidadCard = ({ prof, cursos, profesorCurso, onAsignar }) => {
    const initial = prof.nombre_profesor.charAt(0).toUpperCase();
    const idsAsignados = profesorCurso
        .filter(pc => pc.id_profesor === prof.id_profesor)
        .map(pc => pc.id_curso);
    const cursosAsignadosData = cursos.filter(c => idsAsignados.includes(c.id_curso));
    const sinCursos = cursosAsignadosData.length === 0;

    return (
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">

            {/* Área superior con fondo suave — altura fija para igualar tarjetas */}
            <div className="px-6 pt-6 pb-6 flex flex-col gap-2" style={{ backgroundColor: '#e0f2fe', minHeight: '175px' }}>
                <h3 className="font-black text-slate-800 text-[17px] leading-snug truncate" title={prof.nombre_profesor}>
                    {prof.nombre_profesor}
                </h3>
                <p className="text-[12px] font-medium text-slate-500">
                    {sinCursos
                        ? 'Sin especialidades asignadas aún.'
                        : `Capacitado para enseñar ${cursosAsignadosData.length} curso${cursosAsignadosData.length !== 1 ? 's' : ''}.`}
                </p>

                {/* Chips: máximo 2 filas visibles */}
                <div className="flex flex-wrap gap-1.5 overflow-hidden" style={{ maxHeight: '58px' }}>
                    {sinCursos ? (
                        <span className="text-[11px] font-semibold text-slate-400 italic">— ninguno todavía —</span>
                    ) : (
                        <>
                            {cursosAsignadosData.map((curso) => {
                                const idx = cursos.findIndex(x => x.id_curso === curso.id_curso);
                                const c = CURSO_COLORS[idx % CURSO_COLORS.length];
                                return (
                                    <span
                                        key={curso.id_curso}
                                        className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0"
                                        style={{ backgroundColor: c.bg, color: c.text }}
                                        title={curso.nombre_curso}
                                    >
                                        {curso.nombre_curso}
                                    </span>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>

            {/* Botón de acción visible */}
            <div className="px-5 py-4 border-t border-slate-100">
                <button
                    onClick={(e) => { e.stopPropagation(); onAsignar(prof); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[13px] font-bold text-white transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                    style={{ backgroundColor: '#51B4E8' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#38a6e0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#51B4E8'}
                >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Asignar Cursos
                </button>
            </div>
        </div>
    );
};

export default function CargaAcademicaManager() {
    const [profesores, setProfesores] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [profesorCurso, setProfesorCurso] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProfesor, setSelectedProfesor] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const fetchDatos = async (signal) => {
        try {
            setLoading(true);
            const [resProf, resCursos, resPC] = await Promise.all([
                fetch(`${API_BASE}/profesores`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/cursos`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/profesor-curso`, { signal }).catch(() => ({ ok: false, json: () => [] }))
            ]);
            if (resProf.ok) setProfesores(await resProf.json());
            if (resCursos.ok) setCursos(await resCursos.json());
            if (resPC.ok) setProfesorCurso(await resPC.json());
            setError(null);
        } catch (err) {
            if (err.name === 'AbortError') return;
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

    const filteredProfesores = profesores
        .filter(p => p.nombre_profesor?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            const aCursos = profesorCurso.filter(pc => pc.id_profesor === a.id_profesor).length;
            const bCursos = profesorCurso.filter(pc => pc.id_profesor === b.id_profesor).length;
            return aCursos - bCursos; // 0 primero, luego los que más tienen
        });
    const totalPages = Math.ceil(filteredProfesores.length / ITEMS_PER_PAGE);
    const currentProfesores = filteredProfesores.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleSearchChange = (val) => { setSearchTerm(val); setCurrentPage(1); };

    const abrirModal = (prof) => { setSelectedProfesor(prof); setIsModalOpen(true); };

    // IDs de cursos ya asignados al profesor seleccionado
    const cursosDelProfesor = selectedProfesor
        ? profesorCurso.filter(pc => pc.id_profesor === selectedProfesor.id_profesor).map(pc => pc.id_curso)
        : [];

    const handleToggleCurso = async (id_curso) => {
        if (!selectedProfesor || guardando) return;
        if (cursosDelProfesor.includes(id_curso)) return;
        setGuardando(true);
        try {
            const res = await fetch(`${API_BASE}/profesor-curso`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_profesor: selectedProfesor.id_profesor, id_curso })
            });
            if (!res.ok) throw new Error('Error al asignar curso');
            const nuevoPC = await res.json();
            setProfesorCurso(prev => [...prev, nuevoPC]);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-fade-in relative pb-10">

            {/* ── Cabecera Superior ── */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-2/3 bg-gradient-to-r from-hx-blue via-blue-600 to-indigo-700 rounded-[24px] p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
                    <div className="absolute bottom-0 right-32 w-32 h-32 bg-hx-blue/40 rounded-full blur-xl translate-y-1/4"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div className="max-w-md">
                            <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight drop-shadow-sm text-white">Especialidades Docentes</h2>
                            <p className="text-white/90 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Selecciona un docente y elige qué cursos está capacitado para enseñar.
                            </p>
                        </div>
                        <div className="hidden sm:flex text-white/90 opacity-80 pt-2">
                            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                        </div>
                    </div>
                </div>

                {/* Tarjeta Stats */}
                <div className="md:w-1/3 bg-white border border-slate-200 rounded-[24px] p-6 min-h-[180px] flex flex-col">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-4">Resumen</p>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="flex flex-col justify-between rounded-2xl p-5 bg-blue-50">
                            <p className="text-[12px] font-semibold text-blue-400">Docentes</p>
                            <p className="text-3xl font-black text-hx-blue">{profesores.length}</p>
                        </div>
                        <div className="flex flex-col justify-between rounded-2xl p-5 bg-indigo-50">
                            <p className="text-[12px] font-semibold text-indigo-400">Asignaciones</p>
                            <p className="text-3xl font-black text-indigo-600">{profesorCurso.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* ── Toolbar + Grid ── */}
            {!loading && (
                <div className="pt-4">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-8 bg-white py-2 px-4 rounded-[20px] border border-slate-100 shadow-sm h-16 w-full overflow-hidden">
                        <div className="flex-shrink-0 flex items-center gap-3 w-1/4">
                            <div className="w-10 h-10 bg-hx-blue/10 rounded-xl flex items-center justify-center text-hx-blue">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <h2 className="text-[20px] font-black text-slate-800 tracking-tight whitespace-nowrap">
                                Docentes <span className="text-slate-400 text-[15px] font-bold ml-1">({filteredProfesores.length})</span>
                            </h2>
                        </div>
                        <div className="flex-1 max-w-lg mx-4">
                            <div className="relative flex items-center bg-white rounded-full p-1.5 border-2 border-slate-200 focus-within:border-hx-blue transition-all h-12 w-full">
                                <input
                                    type="text" placeholder="Buscar docente por nombre..." value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="flex-1 bg-transparent pl-6 pr-3 py-1 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full w-full"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="mr-2 text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50 flex-shrink-0 cursor-pointer">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                )}
                                <div className="w-9 h-9 rounded-full bg-hx-blue flex items-center justify-center text-white flex-shrink-0 shadow-sm mr-0.5">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 w-1/4"></div>
                    </div>

                    {/* Grid */}
                    {filteredProfesores.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[32px] p-16 text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-slate-300">
                                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800">{searchTerm ? 'No se encontraron resultados' : 'No hay docentes registrados'}</h3>
                            <p className="text-slate-500 text-sm mt-2">
                                {searchTerm ? `No hay docentes que coincidan con "${searchTerm}".` : 'Registra docentes en "Gestión de Docentes" primero.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
                                {currentProfesores.map(prof => (
                                    <ProfesorEspecialidadCard
                                        key={prof.id_profesor}
                                        prof={prof}
                                        cursos={cursos}
                                        profesorCurso={profesorCurso}
                                        onAsignar={abrirModal}
                                    />
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12 mb-4">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-hx-blue transition-colors cursor-pointer">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${currentPage === i + 1 ? 'bg-hx-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>{i + 1}</button>
                                        ))}
                                    </div>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-hx-blue transition-colors cursor-pointer">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-hx-blue/30 border-t-hx-blue rounded-full animate-spin"></div>
                </div>
            )}

            {/* ── Modal: Asignar Cursos ── */}
            {isModalOpen && selectedProfesor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4 sm:p-6">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-full sm:max-h-[90vh] border border-slate-100 flex flex-col overflow-hidden transform animate-slide-up">

                        {/* Header */}
                        <div className="bg-white px-8 py-6 flex justify-between items-start border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md"
                                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                                    {selectedProfesor.nombre_profesor.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{selectedProfesor.nombre_profesor}</h2>
                                    <p className="text-[12px] text-slate-500 mt-0.5 font-medium">
                                        Haz clic en un curso para asignárselo como especialidad
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Grid de cursos con colores de CursosManager */}
                        <div className="p-6 overflow-y-auto flex-1 min-h-0 bg-slate-50/50">
                            {guardando && (
                                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-hx-blue/10 text-hx-blue text-sm font-bold">
                                    <div className="w-4 h-4 border-2 border-hx-blue/30 border-t-hx-blue rounded-full animate-spin"></div>
                                    Guardando asignación...
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {cursos.map((curso, index) => {
                                    const isAsignado = cursosDelProfesor.includes(curso.id_curso);
                                    const c = CURSO_COLORS[index % CURSO_COLORS.length];
                                    return (
                                        <div
                                            key={curso.id_curso}
                                            onClick={() => handleToggleCurso(curso.id_curso)}
                                            className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${isAsignado
                                                    ? 'border-transparent cursor-not-allowed shadow-md'
                                                    : 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-md cursor-pointer'
                                                }`}
                                            style={isAsignado ? { border: `2px solid ${c.bg}`, boxShadow: `0 4px 16px ${c.bg}30` } : {}}
                                        >
                                            {/* Franja de color del curso */}
                                            <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: c.bg }}>
                                                <span className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: c.text, opacity: 0.85 }}>
                                                    Asignatura
                                                </span>
                                                {isAsignado && (
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: c.text }}>
                                                        ✓ Asignado
                                                    </span>
                                                )}
                                            </div>

                                            {/* Cuerpo */}
                                            <div className="p-4 flex items-center gap-3" style={{ backgroundColor: isAsignado ? c.light : '#ffffff' }}>
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                                                    style={{ backgroundColor: c.bg }}>
                                                    {curso.nombre_curso.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-extrabold text-[13px] truncate leading-tight" style={{ color: isAsignado ? c.bg : '#1e293b' }}>
                                                        {curso.nombre_curso}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                                        {isAsignado ? 'Ya enseña este curso' : 'Clic para asignar'}
                                                    </p>
                                                </div>
                                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                                                    style={isAsignado ? { borderColor: c.bg, backgroundColor: c.bg } : { borderColor: '#cbd5e1' }}>
                                                    {isAsignado && (
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {cursos.length === 0 && (
                                <div className="text-center py-10 text-slate-400 font-medium">No hay cursos registrados en el sistema.</div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-white border-t border-slate-100 p-5 flex items-center justify-between shrink-0">
                            <p className="text-[13px] text-slate-500 font-medium">
                                <span className="font-black text-hx-blue">{cursosDelProfesor.length}</span> curso{cursosDelProfesor.length !== 1 ? 's' : ''} asignado{cursosDelProfesor.length !== 1 ? 's' : ''} de {cursos.length}
                            </p>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 bg-hx-blue hover:bg-hx-blue/90 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-hx-blue/20"
                            >
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import ModuleSidebar from '../Shared/ModuleSidebar';

const API_BASE = 'http://localhost:8000/api';

const GRADO_COLORS = [
    'var(--color-brand-primary)'
];

// Tarjeta con diseño exacto a la referencia (Carpeta oscura con borde negro y fondo degradado)
const SeccionCard = ({ sec, tutor, gradoColor, sedeNombre, onAsignar, onQuitar }) => {
    const sinTutor = !tutor;

    return (
        <div className="bg-white rounded-[20px] shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col relative overflow-hidden group">
            {/* Top row */}
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <h3 className="text-slate-700 font-bold text-[14px]">
                        Grado {sec.id_grado ? `${sec.id_grado}°` : 'N/A'}
                    </h3>
                    <p className="text-slate-400 text-[12px] mt-0.5 font-medium flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        {sedeNombre || 'Sede Principal'}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[15px] shadow-sm text-white shrink-0"
                    style={{ backgroundColor: sinTutor ? '#f43f5e' : gradoColor }}>
                    {sinTutor ? '!' : tutor.nombre_profesor.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Middle row */}
            <div className="px-5 py-4 flex-1">
                <h2 className="text-slate-800 font-black text-[20px] truncate pr-2">
                    Sección {sec.nombre || sec.id_seccion.toString().padStart(2, '0')}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-slate-500 text-[14px] font-medium truncate">
                        {sinTutor ? 'Sin asignar' : tutor.nombre_profesor}
                    </p>
                    {!sinTutor && (
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                            TUTOR
                        </span>
                    )}
                </div>
            </div>

            {/* Bottom row */}
            <div
                className="px-5 py-4 border-t border-slate-100 flex justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => onAsignar(sec)}
            >
                <span className="text-[14px] font-black tracking-wider uppercase flex items-center gap-1.5" style={{ color: sinTutor ? '#f43f5e' : gradoColor }}>
                    {sinTutor ? 'Asignar Tutor' : 'Cambiar Tutor'} <span className="text-[18px] leading-none">›</span>
                </span>
            </div>

            {/* Floating Quitar Button */}
            {!sinTutor && (
                <button
                    onClick={(e) => { e.stopPropagation(); onQuitar(sec.id_seccion); }}
                    className="absolute top-4 right-16 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors shadow-sm opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Quitar tutor"
                >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default function TutoriasManager() {
    const [secciones, setSecciones] = useState([]);
    const [grados, setGrados] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [tutorias, setTutorias] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchTermProfesor, setSearchTermProfesor] = useState('');
    const [selectedSeccion, setSelectedSeccion] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const fetchDatos = async (signal) => {
        try {
            setLoading(true);
            const [resSec, resGrad, resProf, resTut, resSedes] = await Promise.all([
                fetch(`${API_BASE}/secciones`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/grados`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/profesores`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/tutorias`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/sedes`, { signal }).catch(() => ({ ok: false, json: () => [] })),
            ]);
            if (resSec.ok) setSecciones(await resSec.json());
            if (resGrad.ok) setGrados(await resGrad.json());
            if (resProf.ok) setProfesores(await resProf.json());
            if (resTut.ok) setTutorias(await resTut.json());
            if (resSedes.ok) setSedes(await resSedes.json());
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

    const getTutorDeSeccion = (id_seccion) => {
        const tut = tutorias.find(t => t.id_seccion === id_seccion);
        return tut ? profesores.find(p => p.id_profesor === tut.id_profesor) || null : null;
    };
    const getTutoriaDeSeccion = (id_seccion) => tutorias.find(t => t.id_seccion === id_seccion) || null;

    const abrirAsignacion = (sec) => { setSelectedSeccion(sec); setSearchTermProfesor(''); };

    const handleQuitarTutor = async (id_seccion) => {
        const tutoriaExistente = getTutoriaDeSeccion(id_seccion);
        if (!tutoriaExistente || !window.confirm('¿Quitar el tutor de esta sección?')) return;
        try {
            await fetch(`${API_BASE}/tutorias/${tutoriaExistente.id_tutoria}`, { method: 'DELETE' });
            setTutorias(prev => prev.filter(t => t.id_tutoria !== tutoriaExistente.id_tutoria));
        } catch (err) { alert(`Error: ${err.message}`); }
    };

    const handleAsignarTutor = async (id_profesor) => {
        if (!selectedSeccion || guardando) return;
        const tutoriaExistente = getTutoriaDeSeccion(selectedSeccion.id_seccion);
        setGuardando(true);
        try {
            if (tutoriaExistente) {
                await fetch(`${API_BASE}/tutorias/${tutoriaExistente.id_tutoria}`, { method: 'DELETE' });
                setTutorias(prev => prev.filter(t => t.id_tutoria !== tutoriaExistente.id_tutoria));
                if (tutoriaExistente.id_profesor === id_profesor) { setSelectedSeccion(null); return; }
            }
            const res = await fetch(`${API_BASE}/tutorias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_seccion: selectedSeccion.id_seccion, id_profesor })
            });
            if (!res.ok) throw new Error('Error al asignar tutoría');
            const nueva = await res.json();
            setTutorias(prev => [...prev, nueva]);
            setSelectedSeccion(null);
        } catch (err) { alert(`Error: ${err.message}`); }
        finally { setGuardando(false); }
    };

    const gradosOrdenados = [...grados].sort((a, b) => a.numero - b.numero);
    const seccionesFiltradas = secciones.filter(s =>
        (s.nombre || `Sección ${s.id_seccion}`).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tutorActual = selectedSeccion ? getTutorDeSeccion(selectedSeccion.id_seccion) : null;
    const tutoriaActual = selectedSeccion ? getTutoriaDeSeccion(selectedSeccion.id_seccion) : null;

    const isConfigReady = !loading && secciones.length > 0 && tutorias.length >= secciones.length;

    useEffect(() => {
        if (!loading && secciones.length > 0) {
            console.log(`Tutorias: Secciones=${secciones.length}, Tutorias=${tutorias.length}, Ready=${isConfigReady}`);
            localStorage.setItem('configReady', isConfigReady ? 'true' : 'false');
            window.dispatchEvent(new Event('edusync_config_ready'));
        }
    }, [isConfigReady, loading, secciones.length, tutorias.length]);

    return (
        <div className="w-full animate-fade-in relative">
            <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-144px)]">
                <ModuleSidebar
                    title="Gestión de Tutorías"
                    description="Asigna a cada sección un docente responsable de acompañar y orientar a sus estudiantes."
                    hideAddButton
                    svgImage="/tutor.svg"
                    stats={[
                        { label: 'Total de secciones', value: secciones.length, subtext: 'Secciones académicas' },
                        { label: 'Con tutor', value: tutorias.length, subtext: 'Asignaciones completadas' },
                        { label: 'Pendientes', value: Math.max(0, secciones.length - tutorias.length), subtext: 'Secciones sin tutor' }
                    ]}
                />

                <main className="md:w-3/4 flex flex-col gap-5 min-w-0">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-[var(--color-brand-primary)]/30 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
                        </div>
                    )}

                    {!loading && !selectedSeccion && (
                        <div>
                            <div className="mb-7 space-y-4">
                                <div className="px-2 flex items-center justify-between gap-4">
                                    <h2 className="text-slate-800 text-[20px] font-black">Tutorados por sección</h2>
                                    <span className="text-[12px] font-bold text-slate-400 whitespace-nowrap">{seccionesFiltradas.length} secciones</span>
                                </div>
                                <div className="relative flex items-center bg-slate-50 rounded-[14px] border border-slate-200 h-14 px-4 focus-within:border-[var(--color-brand-primary)] focus-within:ring-4 focus-within:ring-[var(--color-brand-primary)]/10 transition-all">
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                    <input
                                        type="text"
                                        placeholder="Buscar sección..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1 bg-transparent pl-3 pr-2 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full min-w-0"
                                    />
                                    {searchTerm && (
                                        <button type="button" onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 cursor-pointer transition-colors" aria-label="Limpiar búsqueda">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-8">
                                {gradosOrdenados.map((grado, index) => {
                                    const gradoColor = GRADO_COLORS[index % GRADO_COLORS.length];
                                    const seccionesDelGrado = seccionesFiltradas
                                        .filter(s => s.id_grado === grado.id_grado)
                                        .sort((a, b) => a.id_seccion - b.id_seccion);
                                    if (seccionesDelGrado.length === 0) return null;

                                    return (
                                        <section key={grado.id_grado}>
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="text-sm font-black text-slate-700">{grado.numero}° Grado</h3>
                                                <span className="text-[11px] font-bold text-slate-400">{seccionesDelGrado.length} sección{seccionesDelGrado.length !== 1 ? 'es' : ''}</span>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                                {seccionesDelGrado.map(sec => {
                                                    const sedeObj = sedes.find(s => s.id_sede === sec.id_sede);
                                                    const sedeNombre = sedeObj ? (sedeObj.nombre_sede || sedeObj.nombre) : 'Sede Principal';
                                                    return (
                                                        <SeccionCard
                                                            key={sec.id_seccion}
                                                            sec={sec}
                                                            tutor={getTutorDeSeccion(sec.id_seccion)}
                                                            gradoColor={gradoColor}
                                                            sedeNombre={sedeNombre}
                                                            onAsignar={abrirAsignacion}
                                                            onQuitar={handleQuitarTutor}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    );
                                })}

                                {(() => {
                                    const sinGrado = seccionesFiltradas.filter(s => !s.id_grado).sort((a, b) => a.id_seccion - b.id_seccion);
                                    if (sinGrado.length === 0) return null;
                                    return (
                                        <section>
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="text-sm font-black text-slate-700">Sin grado</h3>
                                                <span className="text-[11px] font-bold text-slate-400">{sinGrado.length} sección{sinGrado.length !== 1 ? 'es' : ''}</span>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                                {sinGrado.map(sec => {
                                                    const sedeObj = sedes.find(s => s.id_sede === sec.id_sede);
                                                    const sedeNombre = sedeObj ? (sedeObj.nombre_sede || sedeObj.nombre) : 'Sede Principal';
                                                    return <SeccionCard key={sec.id_seccion} sec={sec} tutor={getTutorDeSeccion(sec.id_seccion)} gradoColor="var(--color-brand-primary)" sedeNombre={sedeNombre} onAsignar={abrirAsignacion} onQuitar={handleQuitarTutor} />;
                                                })}
                                            </div>
                                        </section>
                                    );
                                })()}

                                {seccionesFiltradas.length === 0 && (
                                    <div className="border-2 border-slate-200 border-dashed rounded-[28px] p-14 text-center">
                                        <h3 className="text-lg font-black text-slate-800">No se encontraron secciones</h3>
                                        <p className="text-sm text-slate-400 mt-1">Prueba con otro término de búsqueda.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && selectedSeccion && (
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
                            <div className="px-7 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Elegir tutor</h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Selecciona al docente responsable de <span className="font-bold text-[var(--color-brand-primary)]">{selectedSeccion.nombre || `Sección ${selectedSeccion.id_seccion}`}</span>.
                                    </p>
                                </div>
                                <button type="button" onClick={() => setSelectedSeccion(null)} className="text-[var(--color-brand-primary)] hover:text-[var(--color-brand-dark)] flex items-center gap-2 text-sm font-bold px-3 py-2 cursor-pointer transition-colors shrink-0">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                                    Volver
                                </button>
                            </div>

                            <div className="p-7">
                                <div className="relative flex items-center bg-slate-50 rounded-[14px] border border-slate-200 h-14 px-4 focus-within:border-[var(--color-brand-primary)] focus-within:ring-4 focus-within:ring-[var(--color-brand-primary)]/10 transition-all mb-6">
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                    <input type="text" placeholder="Buscar docente por nombre..." value={searchTermProfesor} onChange={(e) => setSearchTermProfesor(e.target.value)} className="flex-1 bg-transparent pl-3 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full min-w-0" />
                                </div>

                                {guardando && (
                                    <div className="flex items-center gap-2 mb-5 text-sm font-bold text-[var(--color-brand-primary)]">
                                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
                                        Guardando asignación...
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {profesores.filter(p => (p.nombre_profesor || '').toLowerCase().includes(searchTermProfesor.toLowerCase())).map(prof => {
                                        const isActual = tutoriaActual?.id_profesor === prof.id_profesor;
                                        return (
                                            <button
                                                type="button"
                                                key={prof.id_profesor}
                                                disabled={guardando}
                                                onClick={() => handleAsignarTutor(prof.id_profesor)}
                                                className={`flex items-center gap-4 p-4 rounded-[18px] border-2 text-left transition-all cursor-pointer disabled:opacity-60 ${isActual ? 'border-emerald-400 text-emerald-700' : 'border-slate-100 hover:border-[var(--color-brand-primary)]/40 hover:shadow-sm text-slate-700'}`}
                                            >
                                                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black shrink-0 ${isActual ? 'bg-emerald-500' : 'bg-[var(--color-brand-primary)]'}`}>
                                                    {prof.nombre_profesor.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-sm truncate">{prof.nombre_profesor}</p>
                                                    <p className={`text-[11px] font-medium mt-0.5 ${isActual ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {isActual ? 'Tutor actual · Presiona para quitar' : 'Presiona para asignar'}
                                                    </p>
                                                </div>
                                                {isActual && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {profesores.filter(p => (p.nombre_profesor || '').toLowerCase().includes(searchTermProfesor.toLowerCase())).length === 0 && (
                                    <div className="border-2 border-slate-200 border-dashed rounded-2xl p-10 text-center text-sm font-medium text-slate-400">No se encontraron docentes con ese nombre.</div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

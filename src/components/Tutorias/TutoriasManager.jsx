import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

const GRADO_COLORS = [
    'var(--color-hx-purple)'
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
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const abrirModal = (sec) => { setSelectedSeccion(sec); setIsModalOpen(true); };

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
                if (tutoriaExistente.id_profesor === id_profesor) { setIsModalOpen(false); return; }
            }
            const res = await fetch(`${API_BASE}/tutorias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_seccion: selectedSeccion.id_seccion, id_profesor })
            });
            if (!res.ok) throw new Error('Error al asignar tutoría');
            const nueva = await res.json();
            setTutorias(prev => [...prev, nueva]);
            setIsModalOpen(false);
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
            window.dispatchEvent(new Event('horarix_config_ready'));
        }
    }, [isConfigReady, loading, secciones.length, tutorias.length]);

    return (
        <div className="w-full relative pb-16">

            {/* ── Banner ── */}
            <div className="flex flex-col md:flex-row gap-6 mb-2">
                <div className="md:w-2/3 bg-[var(--color-hx-purple)]/10 rounded-[24px] p-8 shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px] border border-[var(--color-hx-purple)]/70">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-center gap-6">
                        <div className="max-w-md">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                                Asignación de tutorías
                            </h2>
                            <p className="text-slate-500 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Designa al docente responsable de guiar y acompañar a los estudiantes de cada sección académica.
                            </p>
                        </div>

                        {/* Imagen Ilustrativa a la derecha */}
                        <div className="hidden sm:flex relative w-32 h-32 md:w-45 md:h-45 flex-shrink-0 items-center justify-center md:mr-16">
                            {/* Brillo suave de fondo para resaltar */}
                            <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl"></div>
                            <img
                                src="/tutor.svg"
                                alt="Ilustración"
                                className="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)] hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="md:w-1/3 bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] p-6 min-h-[180px] flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">Total Secciones</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{secciones.length}</h3>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-[14px] bg-hx-purple/10 text-hx-purple flex items-center justify-center border border-hx-purple/20 shadow-sm">
                            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                    </div>

                    <div className="mt-auto bg-purple-50 rounded-xl p-3.5 border border-purple-100/60 flex gap-3 items-start">
                        <div className="text-hx-purple bg-white p-1 rounded-lg shadow-sm border border-purple-100 mt-0.5 flex-shrink-0">
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
                        </div>
                        <div>
                            <p className="text-purple-800 text-[12px] font-bold mb-0.5">Con Tutor</p>
                            <p className="text-purple-700/80 text-[11px] font-medium leading-relaxed">
                                Tienes {tutorias.length} secciones con tutor asignado.
                            </p>
                        </div>
                    </div>
                </div>
            </div>



            {/* ── Grupos por Grado ── */}
            {!loading && (
                <div className="mt-0">
                    {gradosOrdenados.map((grado, index) => {
                        const gradoColor = GRADO_COLORS[index % GRADO_COLORS.length];
                        const seccionesDelGrado = seccionesFiltradas
                            .filter(s => s.id_grado === grado.id_grado)
                            .sort((a, b) => a.id_seccion - b.id_seccion);

                        if (seccionesDelGrado.length === 0) return null;

                        return (
                            <div key={grado.id_grado}>
                                <div className="py-8 flex items-center gap-4 w-full">
                                    <div className="flex-1 h-[2px] bg-slate-200"></div>
                                    <span
                                        className="text-[15px] font-black uppercase tracking-[0.2em] px-8 py-2.5 rounded-full bg-white shadow-sm border border-slate-200"
                                        style={{ color: gradoColor }}
                                    >
                                        {grado.numero}° Grado
                                    </span>
                                    <div className="flex-1 h-[2px] bg-slate-200"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                                                onAsignar={abrirModal}
                                                onQuitar={handleQuitarTutor}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Sin Grado */}
                    {(() => {
                        const sinGrado = seccionesFiltradas
                            .filter(s => !s.id_grado)
                            .sort((a, b) => a.id_seccion - b.id_seccion);

                        if (sinGrado.length === 0) return null;

                        return (
                            <div key="sin-grado">
                                <div className="py-8 flex items-center gap-4 w-full">
                                    <div className="flex-1 h-[2px] bg-slate-200"></div>
                                    <span className="text-[15px] font-black text-slate-400 uppercase tracking-[0.2em] px-8 py-2.5 rounded-full bg-white shadow-sm border border-slate-200">
                                        Sin Grado
                                    </span>
                                    <div className="flex-1 h-[2px] bg-slate-200"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {sinGrado.map(sec => {
                                        const sedeObj = sedes.find(s => s.id_sede === sec.id_sede);
                                        const sedeNombre = sedeObj ? (sedeObj.nombre_sede || sedeObj.nombre) : 'Sede Principal';
                                        return (
                                            <SeccionCard
                                                key={sec.id_seccion}
                                                sec={sec}
                                                tutor={getTutorDeSeccion(sec.id_seccion)}
                                                gradoColor="var(--color-hx-purple)"
                                                sedeNombre={sedeNombre}
                                                onAsignar={abrirModal}
                                                onQuitar={handleQuitarTutor}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {seccionesFiltradas.length === 0 && (
                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[32px] p-16 text-center">
                            <h3 className="text-xl font-black text-slate-800">No se encontraron secciones</h3>
                        </div>
                    )}
                </div>
            )}

            {/* ── Modal de Asignación ── */}
            {isModalOpen && selectedSeccion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg max-h-full sm:max-h-[85vh] flex flex-col overflow-hidden transform animate-slide-up">
                        <div className="bg-white px-8 py-7 flex justify-between items-start border-b border-slate-100 shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Elegir Tutor</h2>
                                <p className="text-[13px] text-slate-500 mt-1 font-medium">
                                    Para <span className="font-bold text-hx-purple">{selectedSeccion.nombre || `Sección ${selectedSeccion.id_seccion}`}</span>
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-2 bg-slate-50/50">
                            {guardando && (
                                <div className="flex items-center justify-center gap-2 mb-4 px-4 py-3 rounded-2xl text-[13px] font-bold bg-hx-purple/10 text-hx-purple">
                                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
                                    Guardando asignación...
                                </div>
                            )}
                            {profesores.map(prof => {
                                const isActual = tutoriaActual?.id_profesor === prof.id_profesor;
                                return (
                                    <div
                                        key={prof.id_profesor}
                                        onClick={() => handleAsignarTutor(prof.id_profesor)}
                                        className="flex items-center gap-4 p-4 rounded-[20px] border-2 cursor-pointer transition-all bg-white hover:shadow-md"
                                        style={isActual ? { borderColor: '#10b981', backgroundColor: '#ecfdf5' } : { borderColor: '#f1f5f9' }}
                                    >
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm flex-shrink-0"
                                            style={{ backgroundColor: isActual ? '#10b981' : '#cbd5e1' }}>
                                            {prof.nombre_profesor.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[15px] truncate" style={{ color: isActual ? '#10b981' : '#334155' }}>
                                                {prof.nombre_profesor}
                                            </p>
                                            <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                                                {isActual ? '✓ Tutor actual · Clic para quitar' : 'Clic para asignar'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

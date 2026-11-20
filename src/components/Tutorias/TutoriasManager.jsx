import React, { useState, useEffect, useRef } from 'react';
import ModuleSidebar from '../Shared/ModuleSidebar';

import { hasPermission } from '../../lib/auth/session';
import {
    listTutoriasData, listTutorias, assignTutor, deleteTutoria,
    summarizeTutorias,
} from '../../services/tutorias';

// Tarjeta con diseño exacto a la referencia (Carpeta oscura con borde negro y fondo degradado)
const SeccionCard = ({ sec, tutor, gradoColor, gradoNumero, sedeNombre, onAsignar, onQuitar, canAssign, canDelete, busy, tieneAsignacion }) => {
    const sinTutor = !tutor;

    return (
        <div className="bg-white rounded-[20px] shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col relative overflow-hidden group">
            {/* Top row */}
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <h3 className="text-slate-700 font-bold text-[14px]">
                        {gradoNumero != null ? `${gradoNumero}° Grado` : 'Grado sin configurar'}
                    </h3>
                    <p className="text-slate-400 text-[12px] mt-0.5 font-medium flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        {sedeNombre || 'Sede sin configurar'}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[15px] shadow-sm text-white shrink-0"
                    style={{ backgroundColor: sinTutor ? '#f43f5e' : gradoColor }}>
                    {sinTutor ? '!' : (tutor.nombre_profesor || '?').charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Middle row */}
            <div className="px-5 py-4 flex-1">
                <h2 className="text-slate-800 font-black text-[20px] truncate pr-2">
                    Sección {sec.nombre || sec.id.toString().padStart(2, '0')}
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
            {canAssign && <button
                type="button"
                disabled={busy}
                className="px-5 py-4 border-t border-slate-100 flex justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => onAsignar(sec)}
            >
                <span className="text-[14px] font-black tracking-wider uppercase flex items-center gap-1.5" style={{ color: sinTutor ? '#f43f5e' : gradoColor }}>
                    {sinTutor ? 'Asignar Tutor' : 'Cambiar Tutor'} <span className="text-[18px] leading-none">›</span>
                </span>
            </button>}

            {/* Floating Quitar Button */}
            {tieneAsignacion && canDelete && (
                <button
                    type="button"
                    disabled={busy}
                    onClick={(e) => { e.stopPropagation(); onQuitar(sec.id); }}
                    className="absolute top-4 right-16 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    aria-label={`Quitar tutor de la sección ${sec.nombre || sec.id}`}
                    title="Quitar tutor"
                >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

    const [sessionReady, setSessionReady] = useState(false);
    const canView = sessionReady && hasPermission('horarios:tutoria:view');
    const canAdd = hasPermission('horarios:tutoria:add');
    const canEdit = hasPermission('horarios:tutoria:edit');
    const canDelete = hasPermission('horarios:tutoria:delete');
    const busyRef = useRef(false);
    const [reload, setReload] = useState(0);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        setSessionReady(true);
    }, []);

    useEffect(() => {
        if (!sessionReady) return;
        let active = true;
        if (!canView) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        listTutoriasData().then(data => {
            if (!active) return;
            setSecciones(data.secciones);
            setGrados(data.grados);
            setProfesores(data.profesores);
            setTutorias(data.tutorias);
            setSedes(data.sedes);
        }).catch(err => {
            if (active) setError(err.message);
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [sessionReady, canView, reload]);

    const getTutoriaDeSeccion = id => tutorias.find(t => t.id_seccion === id) || null;
    const getTutorDeSeccion = id => {
        const asignacion = getTutoriaDeSeccion(id);
        return profesores.find(p => p.id === asignacion?.id_profesor) || null;
    };
    const abrirAsignacion = sec => {
        if (busyRef.current) return;
        if (getTutoriaDeSeccion(sec.id) ? !canEdit : !canAdd) return;
        setSelectedSeccion(sec);
        setSearchTermProfesor('');
        setNotice(null);
    };

    const notifyUpdated = () => {
        window.dispatchEvent(new Event('edusync_data_updated'));
        window.dispatchEvent(new Event('horarix_data_updated'));
    };

    const handleQuitarTutor = async idSeccion => {
        if (!canDelete || busyRef.current) return;
        const asignacion = getTutoriaDeSeccion(idSeccion);
        if (!asignacion || !window.confirm('¿Quitar el tutor de esta sección?')) return;
        busyRef.current = true;
        setGuardando(true);
        setNotice(null);
        try {
            await deleteTutoria(asignacion.id);
            // The server confirmed deletion; preserve this state even if refreshing fails.
            setTutorias(prev => prev.filter(t => t.id !== asignacion.id));
            notifyUpdated();
            try { setTutorias(await listTutorias()); }
            catch (err) { setNotice(`Se quitó el tutor, pero no se pudo actualizar la lista: ${err.message}`); }
        } catch (err) { setNotice(err.message); }
        finally { busyRef.current = false; setGuardando(false); }
    };

    const handleAsignarTutor = async idProfesor => {
        if (!selectedSeccion || busyRef.current || !profesores.some(p => p.id === idProfesor)) return;
        busyRef.current = true;
        setGuardando(true);
        setNotice(null);
        try {
            await assignTutor(selectedSeccion.id, idProfesor, { canAdd, canEdit });
            setSelectedSeccion(null);
            notifyUpdated();
            try { setTutorias(await listTutorias()); }
            catch (err) {
                // POST returns a confirmation without an ID. Never invent a local record.
                setError(`La asignación se guardó, pero no se pudo actualizar la lista: ${err.message}`);
            }
        } catch (err) { setNotice(err.message); }
        finally { busyRef.current = false; setGuardando(false); }
    };

    const resumen = summarizeTutorias(secciones, profesores, tutorias);
    const gradosOrdenados = [...grados].sort((a, b) => a.numero - b.numero);
    const seccionesFiltradas = secciones.filter(s =>
        (s.nombre || `Sección ${s.id}`).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const tutoriaActual = selectedSeccion ? getTutoriaDeSeccion(selectedSeccion.id) : null;
    const profesoresFiltrados = profesores.filter(p =>
        (p.nombre_profesor || '').toLowerCase().includes(searchTermProfesor.toLowerCase())
    );

    const cardProps = sec => ({
        sec,
        tutor: getTutorDeSeccion(sec.id),
        tieneAsignacion: Boolean(getTutoriaDeSeccion(sec.id)),
        gradoNumero: grados.find(g => g.id === sec.id_grado)?.numero,
        sedeNombre: sedes.find(s => s.id === sec.id_sede)?.nombre_sede,
        gradoColor: 'var(--color-brand-primary)',
        onAsignar: abrirAsignacion,
        onQuitar: handleQuitarTutor,
        canAssign: getTutoriaDeSeccion(sec.id) ? canEdit : canAdd,
        canDelete,
        busy: guardando,
    });

    if (!sessionReady) return (
        <div role="status" className="flex justify-center items-center gap-3 py-20 text-slate-500">
            <div aria-hidden="true" className="w-8 h-8 border-4 border-[var(--color-brand-primary)]/30 border-t-[var(--color-brand-primary)] rounded-full animate-spin" />
            <span>Cargando tutorías…</span>
        </div>
    );
    if (!canView) return <p role="alert">No tienes permiso para consultar las tutorías.</p>;

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
                        { label: 'Con tutor', value: resumen.completas, subtext: 'Asignaciones válidas' },
                        { label: 'Pendientes', value: resumen.pendientes, subtext: 'Secciones sin tutor' }
                    ]}
                />

                <main className="md:w-3/4 flex flex-col gap-5 min-w-0">
                    {error && (
                        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                            <p className="text-sm font-medium">{error}</p>
                            <button type="button" disabled={guardando} onClick={() => setReload(value => value + 1)} className="mt-2 font-bold underline">Reintentar carga</button>
                        </div>
                    )}

                    {notice && <p role="alert" className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl">{notice}</p>}
                    {!loading && !error && (resumen.duplicadas > 0 || resumen.invalidas > 0) && (
                        <p role="alert" className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl">
                            Hay {resumen.duplicadas} secciones con varias asignaciones y {resumen.invalidas} asignaciones con datos faltantes. Revisa las asignaciones antes de generar el horario.
                        </p>
                    )}
                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-[var(--color-brand-primary)]/30 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
                        </div>
                    )}

                    {!loading && !error && !selectedSeccion && (
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
                                {gradosOrdenados.map(grado => {
                                    const seccionesDelGrado = seccionesFiltradas
                                        .filter(s => s.id_grado === grado.id)
                                        .sort((a, b) => a.id - b.id);
                                    if (seccionesDelGrado.length === 0) return null;

                                    return (
                                        <section key={grado.id}>
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="text-sm font-black text-slate-700">{grado.numero}° Grado</h3>
                                                <span className="text-[11px] font-bold text-slate-400">{seccionesDelGrado.length} sección{seccionesDelGrado.length !== 1 ? 'es' : ''}</span>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                                {seccionesDelGrado.map(sec => <SeccionCard key={sec.id} {...cardProps(sec)} />)}
                                            </div>
                                        </section>
                                    );
                                })}

                                {(() => {
                                    const sinGrado = seccionesFiltradas.filter(s => !grados.some(g => g.id === s.id_grado)).sort((a, b) => a.id - b.id);
                                    if (sinGrado.length === 0) return null;
                                    return (
                                        <section>
                                            <div className="flex items-center justify-between mb-3 px-1">
                                                <h3 className="text-sm font-black text-slate-700">Sin grado</h3>
                                                <span className="text-[11px] font-bold text-slate-400">{sinGrado.length} sección{sinGrado.length !== 1 ? 'es' : ''}</span>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                                {sinGrado.map(sec => <SeccionCard key={sec.id} {...cardProps(sec)} />)}
                                            </div>
                                        </section>
                                    );
                                })()}

                                {seccionesFiltradas.length === 0 && (
                                    <div className="border-2 border-slate-200 border-dashed rounded-[28px] p-14 text-center">
                                        <h3 className="text-lg font-black text-slate-800">No se encontraron secciones</h3>
                                        <p className="text-sm text-slate-400 mt-1">{secciones.length ? 'Prueba con otro término de búsqueda.' : 'Configura las secciones del colegio para asignar sus tutores.'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!loading && !error && selectedSeccion && (
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
                            <div className="px-7 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">Elegir tutor</h2>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Selecciona al docente responsable de <span className="font-bold text-[var(--color-brand-primary)]">{selectedSeccion.nombre || `Sección ${selectedSeccion.id}`}</span>.
                                    </p>
                                </div>
                                <button type="button" disabled={guardando} onClick={() => { setSelectedSeccion(null); setNotice(null); }} className="text-[var(--color-brand-primary)] hover:text-[var(--color-brand-dark)] flex items-center gap-2 text-sm font-bold px-3 py-2 cursor-pointer transition-colors shrink-0">
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
                                    {profesoresFiltrados.map(prof => {
                                        const isActual = tutoriaActual?.id_profesor === prof.id;
                                        return (
                                            <button
                                                type="button"
                                                key={prof.id}
                                                disabled={guardando || isActual || (tutoriaActual ? !canEdit : !canAdd)}
                                                onClick={() => handleAsignarTutor(prof.id)}
                                                className={`flex items-center gap-4 p-4 rounded-[18px] border-2 text-left transition-all cursor-pointer disabled:opacity-60 ${isActual ? 'border-emerald-400 text-emerald-700' : 'border-slate-100 hover:border-[var(--color-brand-primary)]/40 hover:shadow-sm text-slate-700'}`}
                                            >
                                                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black shrink-0 ${isActual ? 'bg-emerald-500' : 'bg-[var(--color-brand-primary)]'}`}>
                                                    {(prof.nombre_profesor || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-sm truncate">{prof.nombre_profesor}</p>
                                                    <p className={`text-[11px] font-medium mt-0.5 ${isActual ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {isActual ? 'Tutor actual' : 'Presiona para asignar'}
                                                    </p>
                                                </div>
                                                {isActual && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {profesoresFiltrados.length === 0 && (
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

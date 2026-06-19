import React, { useState, useEffect, useMemo } from 'react';

const API_BASE = 'http://localhost:8000/api';

const CURSO_COLORS = [
    { solid: '#1e293b', pastel: '#f1f5f9', text: '#1e293b' },
    { solid: '#790EEC', pastel: '#f5f3ff', text: '#4c0d8f' },
    { solid: '#f43f5e', pastel: '#fff1f2', text: '#be123c' },
    { solid: '#10CFAE', pastel: '#f0fdf9', text: '#065f4a' },
    { solid: '#51B4E8', pastel: '#eff8ff', text: '#0c4a7a' },
    { solid: '#F3C252', pastel: '#fffbeb', text: '#7c4a00' },
    { solid: '#F1A5B9', pastel: '#fdf2f5', text: '#7c2042' },
    { solid: '#790EEC', pastel: '#ede9fe', text: '#4c0d8f' },
    { solid: '#10CFAE', pastel: '#f0fdfa', text: '#065f4a' },
    { solid: '#51B4E8', pastel: '#e0f2fe', text: '#0c4a7a' },
    { solid: '#f43f5e', pastel: '#ffe4e6', text: '#be123c' },
    { solid: '#F3C252', pastel: '#fef9c3', text: '#7c4a00' },
];

const DIA_COLOR = { bg: 'var(--color-hx-purple)', text: '#ffffff' };

export default function HorariosPorProfesorManager() {
    const [secciones, setSecciones] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [dias, setDias] = useState([]);
    const [bloques, setBloques] = useState([]);
    const [configGradoDia, setConfigGradoDia] = useState([]);
    const [grados, setGrados] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [seccionTurnos, setSeccionTurnos] = useState([]);
    const [maxBloquesDia, setMaxBloquesDia] = useState(6);

    const [status, setStatus] = useState('loading');
    const [asignaciones, setAsignaciones] = useState([]);

    const [selectedProfesor, setSelectedProfesorState] = useState(() => {
        if (typeof window !== 'undefined') return sessionStorage.getItem('selectedProfesor') || '';
        return '';
    });
    const setSelectedProfesor = (val) => {
        setSelectedProfesorState(val);
        if (typeof window !== 'undefined') {
            if (val) sessionStorage.setItem('selectedProfesor', val);
            else sessionStorage.removeItem('selectedProfesor');
        }
    };
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [secRes, curRes, profRes, diasRes, bloqRes, configRes, horarioRes, gradosRes, sedesRes, turnosRes, seccionTurnosRes] = await Promise.all([
                    fetch(`${API_BASE}/secciones`),
                    fetch(`${API_BASE}/cursos`),
                    fetch(`${API_BASE}/profesores`),
                    fetch(`${API_BASE}/dias`),
                    fetch(`${API_BASE}/bloques`),
                    fetch(`${API_BASE}/grado-dia-config`),
                    fetch(`${API_BASE}/cargar-horario`),
                    fetch(`${API_BASE}/grados`),
                    fetch(`${API_BASE}/sedes`),
                    fetch(`${API_BASE}/turnos`),
                    fetch(`${API_BASE}/seccion-turno`)
                ]);

                const [secData, curData, profData, diasData, bloqData, configData, horarioData, gradosData, sedesData, turnosData, stData] = await Promise.all([
                    secRes.ok ? secRes.json() : Promise.resolve([]),
                    curRes.ok ? curRes.json() : Promise.resolve([]),
                    profRes.ok ? profRes.json() : Promise.resolve([]),
                    diasRes.ok ? diasRes.json() : Promise.resolve([]),
                    bloqRes.ok ? bloqRes.json() : Promise.resolve([]),
                    configRes.ok ? configRes.json() : Promise.resolve([]),
                    horarioRes.ok ? horarioRes.json() : Promise.resolve(null),
                    gradosRes.ok ? gradosRes.json() : Promise.resolve([]),
                    sedesRes.ok ? sedesRes.json() : Promise.resolve([]),
                    turnosRes.ok ? turnosRes.json() : Promise.resolve([]),
                    seccionTurnosRes.ok ? seccionTurnosRes.json() : Promise.resolve([])
                ]);

                const diasOrdenados = diasData.sort((a, b) => a.orden - b.orden);
                const bloquesOrdenados = bloqData.sort((a, b) => a.numero_bloque - b.numero_bloque);
                const maxBlq = configData.reduce((acc, c) => Math.max(acc, c.bloques_dia || 0), 0);

                let asignacionesData = [];
                let nuevoStatus = 'empty';
                if (horarioData && horarioData.status === 'success' && horarioData.resultado?.asignaciones) {
                    asignacionesData = horarioData.resultado.asignaciones;
                    nuevoStatus = 'ready';
                } else if (horarioData && horarioData.asignaciones) {
                    asignacionesData = horarioData.asignaciones;
                    nuevoStatus = 'ready';
                }

                setSecciones(secData);
                setCursos(curData);
                setProfesores(profData);
                setDias(diasOrdenados);
                setBloques(bloquesOrdenados);
                setConfigGradoDia(configData);
                setGrados(gradosData);
                setSedes(sedesData);
                setTurnos(turnosData);
                setSeccionTurnos(stData);
                setMaxBloquesDia(maxBlq > 0 ? maxBlq : 6);
                setAsignaciones(asignacionesData);
                setStatus(nuevoStatus);

            } catch (error) {
                console.error("Error fetching data:", error);
                setStatus('empty');
            }
        };
        fetchData();
    }, []);

    const getCurso = (idStr) => {
        const id = parseInt(idStr.replace('CUR_', ''));
        const c = cursos.find(x => x.id_curso === id);
        return c ? c.nombre_curso : idStr;
    };

    const getSedePorSeccion = (secIdStr) => {
        const id = parseInt(secIdStr.replace('SEC_', ''));
        const s = secciones.find(x => x.id_seccion === id);
        if (s && s.id_sede) {
            const sede = sedes.find(x => x.id_sede === s.id_sede);
            return sede ? sede.nombre_sede : 'Sede Desconocida';
        }
        return 'Sede Desconocida';
    };

    const getGradoSeccion = (secIdStr) => {
        const id = parseInt(secIdStr.replace('SEC_', ''));
        const s = secciones.find(x => x.id_seccion === id);
        if (s) {
            let desc = '';
            if (s.id_grado) {
                const g = grados.find(x => x.id_grado === s.id_grado);
                if (g) desc += g.numero + '° ';
            }
            desc += s.nombre;
            return desc;
        }
        return secIdStr;
    };

    const getColor = (cursoIdStr) => {
        const id = parseInt(cursoIdStr.replace('CUR_', '')) || 0;
        const idx = cursos.findIndex(x => x.id_curso === id);
        return CURSO_COLORS[(idx >= 0 ? idx : id) % CURSO_COLORS.length];
    };

    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // Filtrar profesores por búsqueda
    const filteredProfesores = useMemo(() => {
        if (!searchQuery.trim()) return profesores;
        const q = normalize(searchQuery);
        return profesores.filter(p => normalize(p.nombre_profesor).includes(q));
    }, [profesores, searchQuery]);

    // Auto-seleccionar el primer profesor que coincida con la búsqueda
    useEffect(() => {
        if (searchQuery.trim() && filteredProfesores.length > 0) {
            setSelectedProfesor(`PROF_${filteredProfesores[0].id_profesor}`);
        }
    }, [filteredProfesores, searchQuery]);

    // Asignaciones del profesor seleccionado
    const filteredAsignaciones = asignaciones.filter(a => a.profesor_id === selectedProfesor);

    // Días configurados
    const assignedDays = new Set(filteredAsignaciones.map(a => normalize(a.dia)));
    const diasConfigurados = [...new Set(configGradoDia.map(c => c.id_dia))];
    const gridDias = dias.filter(d => diasConfigurados.includes(d.id_dia) || assignedDays.has(normalize(d.nombre_dia)));

    const blockNumbers = Array.from({ length: maxBloquesDia }, (_, i) => i + 1);

    // Stats del profesor
    const stats = useMemo(() => {
        const totalHoras = filteredAsignaciones.reduce((acc, a) => acc + (a.horas || 1), 0);
        const cursosUnicos = [...new Set(filteredAsignaciones.map(a => a.curso_id))].length;
        const seccionesUnicas = [...new Set(filteredAsignaciones.map(a => a.seccion_id))].length;
        return { totalHoras, cursosUnicos, seccionesUnicas };
    }, [filteredAsignaciones]);

    // Info del profesor seleccionado
    const profSeleccionado = profesores.find(p => `PROF_${p.id_profesor}` === selectedProfesor);

    // Iniciales del profesor
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return parts[0][0].toUpperCase();
    };

    // Contar horas por profesor para la lista
    const horasPorProfesor = useMemo(() => {
        const map = {};
        asignaciones.forEach(a => {
            if (!map[a.profesor_id]) map[a.profesor_id] = 0;
            map[a.profesor_id] += (a.horas || 1);
        });
        return map;
    }, [asignaciones]);

    return (
        <div className={`w-full h-full flex flex-col items-center animate-fade-in relative ${status === 'empty' ? 'justify-center' : 'justify-start'}`}>
            
            {status === 'loading' && (
                <div className="flex flex-col items-center justify-center gap-4 mt-20">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-hx-purple rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1s' }} />
                    </div>
                    <p className="text-slate-400 text-sm font-semibold">Cargando horarios...</p>
                </div>
            )}

            {status === 'empty' && (
                <div className="relative flex flex-col items-center justify-center max-w-2xl w-full mx-auto mt-6 p-8 rounded-[40px] overflow-hidden group transition-all duration-500">
                    <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up w-full">
                        <div className="w-40 h-40 mb-6 flex items-center justify-center drop-shadow-xl hover:scale-105 transition-transform duration-500">
                            <img src="/imagen.svg" alt="Ilustración de horarios" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-[28px] leading-tight font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 mb-3 tracking-tight">
                            Aún no hay horarios listos
                        </h2>
                        <p className="text-slate-500 text-[15px] font-medium max-w-[420px] mx-auto leading-relaxed mb-8">
                            Para ver el horario de los profesores, primero debes generar un horario general desde la sección "Generar Horario".
                        </p>
                    </div>
                </div>
            )}

            {status === 'ready' && (
                <div className="w-full flex flex-col gap-6 animate-fade-in-up">
                    
                    {/* TARJETA UNIFICADA: SELECTOR + PERFIL */}
                    <div className="w-full bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        {/* Fila 1: Selector de Profesor */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                                <div className="flex flex-col flex-1 w-full">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Profesor</label>
                                    <select
                                        value={selectedProfesor}
                                        onChange={e => { setSelectedProfesor(e.target.value); setSearchQuery(''); }}
                                        className="w-full bg-white border-2 border-slate-200 text-slate-800 text-[14px] font-black rounded-xl px-4 py-2.5 outline-none focus:border-hx-purple shadow-sm transition-all cursor-pointer"
                                    >
                                        <option value="">Seleccione un Profesor</option>
                                        {filteredProfesores.map(p => (
                                            <option key={p.id_profesor} value={`PROF_${p.id_profesor}`}>{p.nombre_profesor}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col w-full sm:max-w-[280px]">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Buscar</label>
                                    <div className="relative">
                                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                        <input
                                            type="text"
                                            placeholder="Filtrar por nombre..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-hx-purple shadow-sm transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fila 2: Perfil del Profesor + Stats */}
                        {profSeleccionado && (
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                                    {/* Nombre del Profesor */}
                                    <div>
                                        <h2 className="text-[22px] md:text-[26px] font-black text-slate-800 tracking-tight leading-none mb-1">
                                            {profSeleccionado.nombre_profesor}
                                        </h2>
                                        <span className="text-slate-400 font-bold text-[12px] uppercase tracking-wider">Docente</span>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="text-center px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 min-w-[72px]">
                                            <p className="text-[20px] font-black text-emerald-700 leading-none">{stats.totalHoras}</p>
                                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Horas</p>
                                        </div>
                                        <div className="text-center px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100 min-w-[72px]">
                                            <p className="text-[20px] font-black text-blue-700 leading-none">{stats.cursosUnicos}</p>
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Cursos</p>
                                        </div>
                                        <div className="text-center px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100 min-w-[72px]">
                                            <p className="text-[20px] font-black text-amber-700 leading-none">{stats.seccionesUnicas}</p>
                                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">Secciones</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* MENSAJE VACÍO */}
                    {selectedProfesor && filteredAsignaciones.length === 0 && (
                        <div className="p-8 bg-white border border-slate-200 rounded-[24px] text-center shadow-sm">
                            <p className="text-slate-400 font-bold text-[15px]">Este profesor no tiene asignaciones en el horario actual.</p>
                        </div>
                    )}

                    {/* TABLAS POR TURNO */}
                    {selectedProfesor && filteredAsignaciones.length > 0 && (
                        <div className="flex flex-col gap-6 w-full">
                            {turnos.map(turno => {
                                const asignacionesTurno = filteredAsignaciones.filter(a => {
                                    const secId = parseInt(a.seccion_id.replace('SEC_', ''));
                                    const diaObj = dias.find(d => normalize(d.nombre_dia) === normalize(a.dia));
                                    if (!diaObj) return false;
                                    const st = seccionTurnos.find(st => st.id_seccion === secId && st.id_dia === diaObj.id_dia);
                                    return st && st.id_turno === turno.id_turno;
                                });

                                if (asignacionesTurno.length === 0) return null;

                                return (
                                    <div key={turno.id_turno} className="w-full bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto p-6">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-3 h-3 rounded-full bg-hx-purple"></div>
                                            <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-widest">Turno {turno.nombre}</h3>
                                        </div>
                                        <table className="w-full border-collapse min-w-[600px] table-fixed">
                                            <thead>
                                                <tr>
                                                    <th className="w-16 pb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Blq</th>
                                                    {gridDias.map((dia) => (
                                                        <th key={dia.id_dia} className="pb-3 px-1">
                                                            <div className="rounded-xl py-2.5 px-3 text-center" style={{ backgroundColor: DIA_COLOR.bg }}>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/70">{dia.nombre_dia.slice(0, 3).toUpperCase()}</p>
                                                                <p className="text-[14px] font-black text-white">{dia.nombre_dia}</p>
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {blockNumbers.map((bNum) => {
                                                    return (
                                                        <tr key={bNum} style={{ height: '100px' }}>
                                                            <td className="py-1 pr-2 text-center align-middle" style={{ width: '52px' }}>
                                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                                                                    <span className="text-[11px] font-black text-slate-600">{bNum}</span>
                                                                </div>
                                                            </td>
                                                            {gridDias.map((dia) => {
                                                                const cubiertoPorAnterior = asignacionesTurno.some(x =>
                                                                    normalize(x.dia) === normalize(dia.nombre_dia)
                                                                    && x.horas > 1
                                                                    && (bNum - 1) > x.slot_inicio
                                                                    && (bNum - 1) < (x.slot_inicio + x.horas)
                                                                );
                                                                if (cubiertoPorAnterior) return null;

                                                                const a = asignacionesTurno.find(x =>
                                                                    normalize(x.dia) === normalize(dia.nombre_dia)
                                                                    && (bNum - 1) === x.slot_inicio
                                                                );

                                                                if (a) {
                                                                    const col = getColor(a.curso_id);
                                                                    const span = a.horas || 1;
                                                                    return (
                                                                        <td key={dia.id_dia} rowSpan={span} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                                            <div className="rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-lg border-2 cursor-pointer"
                                                                                style={{ backgroundColor: col.pastel, borderColor: col.solid, height: `calc(${span} * 100px - 8px)` }}>
                                                                                <div className="w-full flex flex-col items-center justify-center">
                                                                                    {span > 1 && (
                                                                                        <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border" style={{ borderColor: col.solid, color: col.solid, backgroundColor: 'transparent' }}>
                                                                                            {span} horas
                                                                                        </span>
                                                                                    )}
                                                                                    
                                                                                    <p className="text-[16px] md:text-[18px] font-black leading-snug" style={{ color: col.text }}>
                                                                                        {getCurso(a.curso_id)}
                                                                                    </p>
                                                                                    
                                                                                    <div className="mt-2 w-full flex flex-col gap-1 items-center">
                                                                                        <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-white/60 border border-white/40 shadow-sm" style={{ color: col.solid }}>
                                                                                            {getGradoSeccion(a.seccion_id)}
                                                                                        </span>
                                                                                        
                                                                                        <span className="inline-block text-[9px] font-bold tracking-wider uppercase opacity-70" style={{ color: col.text }}>
                                                                                            {getSedePorSeccion(a.seccion_id)}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <td key={dia.id_dia} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                                            <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center" style={{ height: 'calc(100px - 8px)' }}>
                                                                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                                            </div>
                                                                        </td>
                                                                    );
                                                                }
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

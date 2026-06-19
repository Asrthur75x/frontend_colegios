import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
const API_BASE = 'http://localhost:8000/api';

// Colores consistentes con CursosManager: borde sólido + fondo pastel
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

// Color único para encabezados de días
const DIA_COLOR = { bg: 'var(--color-hx-purple)', text: '#ffffff' };

export default function HorariosManager() {
    const [status, setStatus] = useState('loading');
    const [loadingStep, setLoadingStep] = useState(0);
    const [errorMsg, setErrorMsg] = useState(null);
    const [maxBloquesDia, setMaxBloquesDia] = useState(6);

    const [secciones, setSecciones] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [profesores, setProfesores] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [dias, setDias] = useState([]);
    const [bloques, setBloques] = useState([]);
    const [configGradoDia, setConfigGradoDia] = useState([]);
    const [grados, setGrados] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [seccionTurnos, setSeccionTurnos] = useState([]);
    const [bloquesReservados, setBloquesReservados] = useState([]);

    const [selectedGrado, setSelectedGrado] = useState('');
    const [selectedSede, setSelectedSede] = useState('');
    const [selectedTurno, setSelectedTurno] = useState('');
    const [selectedSeccion, setSelectedSeccion] = useState('');

    const loadingMessages = [
        "Analizando disponibilidad de docentes...",
        "Calculando carga académica...",
        "Resolviendo restricciones del colegio...",
        "Optimizando cruces en las sedes...",
        "Validando turnos...",
        "¡Horarios generados con éxito!"
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Hacer todas las peticiones en paralelo
                const [secRes, curRes, profRes, diasRes, bloqRes, configRes, horarioRes, gradosRes, sedesRes, turnosRes, seccionTurnosRes, bloqReservRes] = await Promise.all([
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
                    fetch(`${API_BASE}/seccion-turno`),
                    fetch(`${API_BASE}/bloque-reservado`)
                ]);

                // Parsear todos los JSON juntos
                const [secData, curData, profData, diasData, bloqData, configData, horarioData, gradosData, sedesData, turnosData, stData, bloqReservData] = await Promise.all([
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
                    seccionTurnosRes.ok ? seccionTurnosRes.json() : Promise.resolve([]),
                    bloqReservRes.ok ? bloqReservRes.json() : Promise.resolve([])
                ]);

                // Calcular valores derivados
                const diasOrdenados = diasData.sort((a, b) => a.orden - b.orden);
                const bloquesOrdenados = bloqData.sort((a, b) => a.numero_bloque - b.numero_bloque);
                const maxBlq = configData.reduce((acc, c) => Math.max(acc, c.bloques_dia || 0), 0);
                const primeraSeccion = secData.length > 0 ? `SEC_${secData[0].id_seccion}` : '';

                // Verificar si hay horario guardado
                let asignacionesData = [];
                let nuevoStatus = 'empty';
                if (horarioData && horarioData.status === 'success' && horarioData.resultado?.asignaciones) {
                    asignacionesData = horarioData.resultado.asignaciones;
                    nuevoStatus = 'ready';
                }

                // Un solo batch de setState
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
                setBloquesReservados(bloqReservData);
                setMaxBloquesDia(maxBlq > 0 ? maxBlq : 6);
                setAsignaciones(asignacionesData);
                setSelectedSeccion(primeraSeccion);
                setStatus(nuevoStatus);

            } catch (error) {
                console.error("Error fetching data:", error);
                setStatus('empty');
            }
        };
        fetchData();
    }, []);

    // Filtrar secciones basadas en Grado, Sede y Turno
    const filteredSecciones = secciones.filter(sec => {
        if (selectedGrado && sec.id_grado?.toString() !== selectedGrado) return false;
        if (selectedSede && sec.id_sede?.toString() !== selectedSede) return false;
        if (selectedTurno) {
            const hasTurno = seccionTurnos.some(st => st.id_seccion === sec.id_seccion && st.id_turno.toString() === selectedTurno);
            if (!hasTurno) return false;
        }
        return true;
    });

    useEffect(() => {
        if (status === 'ready' || status === 'empty') {
            if (filteredSecciones.length > 0 && !filteredSecciones.find(s => `SEC_${s.id_seccion}` === selectedSeccion)) {
                setSelectedSeccion(`SEC_${filteredSecciones[0].id_seccion}`);
            } else if (filteredSecciones.length === 0) {
                setSelectedSeccion('');
            }
        }
    }, [filteredSecciones, status]);

    const handleGenerar = async () => {
        setStatus('generating');
        setLoadingStep(0);
        setErrorMsg(null);

        const interval = setInterval(() => {
            setLoadingStep(prev => prev < loadingMessages.length - 2 ? prev + 1 : prev);
        }, 12000);

        try {
            const res = await fetch(`${API_BASE}/generar-horario`, { method: 'POST' });
            const data = await res.json();

            if (data.status === 'error' || data.errores) {
                const msgs = data.errores ? data.errores.join(", ") : "Error desconocido del motor";
                setErrorMsg(`No se puede generar el horario por inconsistencias en los datos: ${msgs}`);
                setStatus('empty');
                clearInterval(interval);
                return;
            }

            if (data.status === 'success' && data.resultado && data.resultado.asignaciones) {
                setAsignaciones(data.resultado.asignaciones);
                clearInterval(interval);
                setLoadingStep(loadingMessages.length - 1);
                setTimeout(() => setStatus('ready'), 1000);
            } else if (data.asignaciones) {
                setAsignaciones(data.asignaciones);
                clearInterval(interval);
                setLoadingStep(loadingMessages.length - 1);
                setTimeout(() => setStatus('ready'), 1000);
            } else {
                throw new Error("Respuesta inválida del servidor");
            }
        } catch (error) {
            clearInterval(interval);
            setErrorMsg(`Hubo un error de conexión o validación con el motor de horarios: ${error.message}`);
            setStatus('empty');
        }
    };

    const getCurso = (idStr) => {
        const id = parseInt(idStr.replace('CUR_', ''));
        const c = cursos.find(x => x.id_curso === id);
        return c ? c.nombre_curso : idStr;
    };

    const getProfesor = (idStr) => {
        const id = parseInt(idStr.replace('PROF_', ''));
        const p = profesores.find(x => x.id_profesor === id);
        return p ? p.nombre_profesor : idStr;
    };

    const getColor = (cursoIdStr) => {
        const id = parseInt(cursoIdStr.replace('CUR_', '')) || 0;
        const idx = cursos.findIndex(x => x.id_curso === id);
        return CURSO_COLORS[(idx >= 0 ? idx : id) % CURSO_COLORS.length];
    };

    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredAsignaciones = asignaciones.filter(a =>
        a.seccion_id === selectedSeccion
    );

    const secActual = secciones.find(s => `SEC_${s.id_seccion}` === selectedSeccion);

    // Identificar qué días tienen asignaciones para adaptar la tabla
    const assignedDays = new Set(filteredAsignaciones.map(a => normalize(a.dia)));
    // Mostrar solo los días configurados para el grado de la sección seleccionada
    let gridDias = dias;
    let blockNumbers = Array.from({ length: maxBloquesDia }, (_, i) => i + 1);

    if (secActual) {
        const configSeccion = configGradoDia.filter(c => c.id_grado === secActual.id_grado && c.bloques_dia > 0);

        if (configSeccion.length > 0) {
            const diasConfiguradosParaGrado = configSeccion.map(c => c.id_dia);
            gridDias = dias.filter(d => diasConfiguradosParaGrado.includes(d.id_dia));

            const maxBlqSeccion = configSeccion.reduce((acc, c) => Math.max(acc, c.bloques_dia || 0), 0);
            blockNumbers = Array.from({ length: maxBlqSeccion > 0 ? maxBlqSeccion : maxBloquesDia }, (_, i) => i + 1);
        }
    }

    // Calcular las reservas (bloques especiales) contiguas para esta sección
    const reservacionesSeccion = [];
    if (secActual) {
        const turnosSeccion = seccionTurnos.filter(st => st.id_seccion === secActual.id_seccion).map(st => st.id_turno);
        
        bloquesReservados.forEach(reserva => {
            if (
                reserva.id_sede === secActual.id_sede &&
                reserva.grados.includes(secActual.id_grado) &&
                turnosSeccion.includes(reserva.id_turno)
            ) {
                reserva.opciones.forEach(op => {
                    if (op.slots && op.slots.length > 0) {
                        const hasCollision = op.slots.some(slotNumber => {
                            return filteredAsignaciones.some(a => {
                                const diaMatch = normalize(a.dia) === normalize(dias.find(d => d.id_dia === reserva.id_dia)?.nombre_dia || "");
                                if (!diaMatch) return false;
                                const startSlot = a.slot_inicio + 1;
                                const endSlot = a.slot_inicio + (a.horas || 1);
                                return slotNumber >= startSlot && slotNumber <= endSlot;
                            });
                        });
                        
                        if (!hasCollision) {
                            const sorted = [...op.slots].sort((a, b) => a - b);
                            let start = sorted[0];
                            let prev = sorted[0];
                            let count = 1;
                            const getDisplayName = () => {
                                if (reserva.nombre && op.nombre) {
                                    if (reserva.nombre === op.nombre) return reserva.nombre;
                                    return `${reserva.nombre} - ${op.nombre}`;
                                }
                                if (reserva.nombre) return reserva.nombre;
                                return op.nombre || `Bloque Especial ${op.nro_opcion}`;
                            };
                            for (let i = 1; i < sorted.length; i++) {
                                if (sorted[i] === prev + 1) {
                                    count++;
                                    prev = sorted[i];
                                } else {
                                    reservacionesSeccion.push({ id_dia: reserva.id_dia, slot_inicio: start, horas: count, nombre: getDisplayName() });
                                    start = sorted[i];
                                    prev = sorted[i];
                                    count = 1;
                                }
                            }
                            reservacionesSeccion.push({ id_dia: reserva.id_dia, slot_inicio: start, horas: count, nombre: getDisplayName() });
                        }
                    }
                });
            }
        });
    }

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

            {status === 'generating' && (
                <div className="flex flex-col items-center justify-center max-w-xl w-full mx-auto p-12 mt-10">
                    <div className="w-64 h-64 mb-4 flex items-center justify-center">
                        <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
                            <div className="wheel"></div>
                            <div className="hamster">
                                <div className="hamster__body">
                                    <div className="hamster__head">
                                        <div className="hamster__ear"></div>
                                        <div className="hamster__eye"></div>
                                        <div className="hamster__nose"></div>
                                    </div>
                                    <div className="hamster__limb hamster__limb--fr"></div>
                                    <div className="hamster__limb hamster__limb--fl"></div>
                                    <div className="hamster__limb hamster__limb--br"></div>
                                    <div className="hamster__limb hamster__limb--bl"></div>
                                    <div className="hamster__tail"></div>
                                </div>
                            </div>
                            <div className="spoke"></div>
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Procesando Motor CP-SAT</h3>
                    <div className="w-full space-y-3">
                        {loadingMessages.map((msg, index) => (
                            <div key={index} className={`flex items-center gap-4 transition-all duration-500 ${index < loadingStep ? 'opacity-100' : index === loadingStep ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden m-0'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${index < loadingStep ? 'bg-green-100 text-green-500' : 'bg-hx-purple/10 text-hx-purple'}`}>
                                    {index < loadingStep
                                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        : <div className="w-2.5 h-2.5 rounded-full bg-hx-purple animate-ping" />
                                    }
                                </div>
                                <p className={`font-semibold text-[15px] ${index < loadingStep ? 'text-slate-400' : 'text-slate-800'}`}>{msg}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {status === 'empty' && (
                <div className="relative flex flex-col items-center justify-center max-w-2xl w-full mx-auto mt-6 p-8 rounded-[40px] overflow-hidden group transition-all duration-500">
                    <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up w-full">
                        {errorMsg && (
                            <div className="w-full bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl mb-4 font-bold text-sm text-left whitespace-pre-wrap">
                                {errorMsg}
                            </div>
                        )}

                        <div className="w-40 h-40 mb-6 flex items-center justify-center drop-shadow-xl hover:scale-105 transition-transform duration-500">
                            <img src="/imagen.svg" alt="Ilustración de horarios" className="w-full h-full object-contain" />
                        </div>

                        <h2 className="text-[28px] leading-tight font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 mb-3 tracking-tight">
                            Aún no hay horarios listos
                        </h2>

                        <p className="text-slate-500 text-[15px] font-medium max-w-[420px] mx-auto leading-relaxed mb-8">
                            Parece que todavía no has armado tus horarios. Haz clic en el botón inferior y nosotros haremos la magia por ti.
                        </p>

                        <button 
                            onClick={handleGenerar} 
                            className="group relative flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-hx-purple)] text-white font-black text-lg rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden w-full max-w-[320px] mx-auto"
                        >
                            <div className="absolute inset-0 w-full h-full -ml-16 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shine" />
                            <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="relative z-10 tracking-wide">Generar Horarios</span>
                        </button>
                    </div>
                </div>
            )}

            {status === 'ready' && (
                <div className="w-full flex flex-col gap-8 animate-fade-in-up">
                    
                    {/* PANEL DE FILTROS SUPERIOR (Full Width) */}
                    <div className="w-full bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            
                            {/* Filtros Izquierda */}
                            <div className="flex flex-wrap items-center gap-4">
                                {sedes.length > 1 && (
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sede</label>
                                        <select value={selectedSede} onChange={e => setSelectedSede(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-[13px] font-bold rounded-xl px-4 py-2.5 outline-none focus:border-hx-purple shadow-sm transition-all cursor-pointer">
                                            <option value="">Todas las sedes</option>
                                            {sedes.map(s => <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>)}
                                        </select>
                                    </div>
                                )}
                                
                                {turnos.length > 1 && (
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Turno</label>
                                        <select value={selectedTurno} onChange={e => setSelectedTurno(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-[13px] font-bold rounded-xl px-4 py-2.5 outline-none focus:border-hx-purple shadow-sm transition-all cursor-pointer">
                                            <option value="">Todos los turnos</option>
                                            {turnos.map(t => <option key={t.id_turno} value={t.id_turno}>{t.nombre}</option>)}
                                        </select>
                                    </div>
                                )}

                                {(sedes.length > 1 || turnos.length > 1) && (
                                    <div className="hidden md:block w-px h-10 bg-slate-200 mx-2 mt-4"></div>
                                )}
                                
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Grado y Sección</label>
                                    <select value={selectedSeccion} onChange={e => setSelectedSeccion(e.target.value)} className="bg-white border-2 border-slate-200 text-hx-purple text-[15px] font-black rounded-xl px-5 py-2 outline-none focus:border-hx-purple shadow-sm transition-all cursor-pointer">
                                        {grados.map(g => {
                                            const secs = filteredSecciones.filter(s => s.id_grado === g.id_grado);
                                            if (secs.length === 0) return null;
                                            return (
                                                <optgroup key={g.id_grado} label={`${g.numero}°`}>
                                                    {secs.map(sec => (
                                                        <option key={sec.id_seccion} value={`SEC_${sec.id_seccion}`}>
                                                            {g.numero}° - Sección {sec.nombre}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )
                                        })}
                                    </select>
                                </div>
                            </div>

                            {/* Botón Derecha */}
                            <button
                                onClick={handleGenerar}
                                className="group relative flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-hx-purple)] text-white font-black text-sm rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden flex-shrink-0 mt-4 md:mt-0"
                            >
                                <div className="absolute inset-0 w-full h-full -ml-16 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shine" />
                                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="relative z-10 tracking-wide">Generar Horarios</span>
                            </button>
                        </div>
                    </div>

                    {/* CONTENIDO DEL HORARIO */}
                    <div className="w-full flex flex-col gap-4">
                        {/* Cabecera Dinámica del Aula */}
                        {selectedSeccion && (() => {
                            const currSec = secciones.find(s => `SEC_${s.id_seccion}` === selectedSeccion);
                            if (!currSec) return null;
                            const currGrado = grados.find(g => g.id_grado === currSec.id_grado);
                            const currSede = sedes.find(s => s.id_sede === currSec.id_sede);
                            const currTurnoLinks = seccionTurnos.filter(st => st.id_seccion === currSec.id_seccion);
                            const turnosNombres = currTurnoLinks.map(l => turnos.find(t => t.id_turno === l.id_turno)?.nombre).filter(Boolean).join(" / ");
                            return (
                                <div className="ml-2 mb-2 flex flex-col">
                                    <h2 className="text-[28px] md:text-[34px] font-black text-slate-800 tracking-tight leading-none mb-3">
                                        {currGrado ? `${currGrado.numero}° - ` : ''}Sección {currSec.nombre}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                        <span className="text-hx-purple font-black text-[15px]">{currGrado ? `Grado: ${currGrado.numero}°` : 'Sin Grado'}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500 font-bold text-[15px]">{currSede ? `Sede: ${currSede.nombre_sede}` : 'Sin Sede'}</span>
                                    </div>
                                </div>
                            )
                        })()}
                        
                        {/* Tabla de Horario */}
                        {selectedSeccion && (
                            <div id="horario-table-container" className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto p-6 w-full">
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
                                        // Calcular qué celdas se deben renderizar
                                        return (
                                            <tr key={bNum} style={{ height: '100px' }}>
                                                {/* Número de bloque */}
                                                <td className="py-1 pr-2 text-center align-middle" style={{ width: '52px' }}>
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                                                        <span className="text-[11px] font-black text-slate-600">{bNum}</span>
                                                    </div>
                                                </td>
                                                {gridDias.map((dia) => {
                                                    // Chequear Bloques Reservados Especiales
                                                    const reservaCubierta = reservacionesSeccion.some(r => 
                                                        r.id_dia === dia.id_dia && r.horas > 1 && bNum > r.slot_inicio && bNum < (r.slot_inicio + r.horas)
                                                    );
                                                    if (reservaCubierta) return null;

                                                    const reservaActiva = reservacionesSeccion.find(r => r.id_dia === dia.id_dia && bNum === r.slot_inicio);

                                                    // Verificar si este bloque está cubierto por un rowSpan de un bloque anterior
                                                    const cubiertoPorAnterior = filteredAsignaciones.some(x =>
                                                        normalize(x.dia) === normalize(dia.nombre_dia)
                                                        && x.horas > 1
                                                        && (bNum - 1) > x.slot_inicio
                                                        && (bNum - 1) < (x.slot_inicio + x.horas)
                                                    );
                                                    if (cubiertoPorAnterior && !reservaActiva) return null;

                                                    if (reservaActiva) {
                                                        const span = reservaActiva.horas || 1;
                                                        return (
                                                            <td key={dia.id_dia} rowSpan={span} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                                <div className="rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm border-2 overflow-hidden relative"
                                                                    style={{ backgroundColor: '#fffbeb', borderColor: '#f59e0b', height: `calc(${span} * 100px - 8px)` }}>
                                                                    
                                                                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 25%, transparent 25%, transparent 75%, #f59e0b 75%, #f59e0b), repeating-linear-gradient(45deg, #f59e0b 25%, transparent 25%, transparent 75%, #f59e0b 75%, #f59e0b)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
                                                                    
                                                                    <div className="relative z-10 flex flex-col items-center">
                                                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-2 shadow-sm border border-amber-200">
                                                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                                        </div>
                                                                        {span > 1 && (
                                                                            <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-500 text-amber-600 bg-amber-50/80">
                                                                                {span} horas
                                                                            </span>
                                                                        )}
                                                                        <p className="text-[14px] font-black leading-tight text-amber-700">
                                                                            {reservaActiva.nombre}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        );
                                                    }

                                                    // Buscar asignación que empiece en este bloque
                                                    const a = filteredAsignaciones.find(x =>
                                                        normalize(x.dia) === normalize(dia.nombre_dia)
                                                        && (bNum - 1) === x.slot_inicio
                                                    );

                                                    if (a) {
                                                        const col = getColor(a.curso_id);
                                                        const span = a.horas || 1;
                                                        return (
                                                            <td key={dia.id_dia} rowSpan={span} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                                <div className="rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:shadow-lg border-2"
                                                                    style={{ backgroundColor: col.pastel, borderColor: col.solid, height: `calc(${span} * 100px - 8px)` }}>
                                                                    <div>
                                                                        {span > 1 && (
                                                                            <span className="inline-block mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border" style={{ borderColor: col.solid, color: col.solid, backgroundColor: 'transparent' }}>
                                                                                {span} horas
                                                                            </span>
                                                                        )}
                                                                        <p className="text-[18px] font-black leading-snug" style={{ color: col.text }}>
                                                                            {getCurso(a.curso_id)}
                                                                        </p>
                                                                        <p className="text-[11px] font-semibold mt-2" style={{ color: col.text, opacity: 0.75 }}>
                                                                            <span className="font-black" style={{ opacity: 1 }}>Profesor: </span>{getProfesor(a.profesor_id)}
                                                                        </p>
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
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes shine { 100% { left: 125%; } }
                .animate-shine { animation: shine 3s infinite linear; }
                .animate-spin-reverse { animation: spin-reverse 1s linear infinite; }
                @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .stylish-scroll::-webkit-scrollbar { width: 6px; }
                .stylish-scroll::-webkit-scrollbar-track { background: transparent; }
                .stylish-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .stylish-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
}

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
const DIA_COLOR = { bg: 'var(--color-hx-red)', text: '#ffffff' };

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

                // Parsear todos los JSON juntos
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

    return (
        <div className="w-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-start animate-fade-in relative pb-10">
            {/* Panel de Filtros y Acciones Top */}
            {(status === 'ready' || status === 'empty') && (
                <div className="w-full bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Filtro Grado */}
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Grado</label>
                            <select 
                                value={selectedGrado} 
                                onChange={e => setSelectedGrado(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-hx-red"
                            >
                                <option value="">Todos los Grados</option>
                                {grados.map(g => (
                                    <option key={g.id_grado} value={g.id_grado}>{g.numero}°</option>
                                ))}
                            </select>
                        </div>
                        {/* Filtro Sede */}
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sede</label>
                            <select 
                                value={selectedSede} 
                                onChange={e => setSelectedSede(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-hx-red"
                            >
                                <option value="">Todas las Sedes</option>
                                {sedes.map(s => (
                                    <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>
                                ))}
                            </select>
                        </div>
                        {/* Filtro Turno */}
                        <div className="flex flex-col">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Turno</label>
                            <select 
                                value={selectedTurno} 
                                onChange={e => setSelectedTurno(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-3 py-2 outline-none focus:border-hx-red"
                            >
                                <option value="">Todos los Turnos</option>
                                {turnos.map(t => (
                                    <option key={t.id_turno} value={t.id_turno}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Divisor Vertical */}
                        {status === 'ready' && filteredSecciones.length > 0 && (
                            <div className="hidden lg:block w-px h-10 bg-slate-200 mx-2"></div>
                        )}

                        {/* Pills de sección integradas */}
                        {status === 'ready' && filteredSecciones.length > 0 && (
                            <div className="flex flex-col">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sección</label>
                                <div className="flex flex-wrap items-center gap-2 h-[38px]">
                                    {filteredSecciones.map(sec => {
                                        const secGrado = grados.find(g => g.id_grado === sec.id_grado);
                                        return (
                                            <button key={sec.id_seccion}
                                                onClick={() => setSelectedSeccion(`SEC_${sec.id_seccion}`)}
                                                className={`px-3 py-1 rounded-lg text-sm font-bold transition-all cursor-pointer border h-full flex items-center ${
                                                    selectedSeccion === `SEC_${sec.id_seccion}`
                                                        ? 'bg-[var(--color-hx-red)] text-white border-[var(--color-hx-red)] shadow-sm'
                                                        : 'bg-white text-slate-500 border-slate-200 hover:border-red-400 hover:text-red-500'
                                                }`}>
                                                {secGrado ? `${secGrado.numero}° ` : ''}{sec.nombre}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleGenerar} 
                            className="group relative flex items-center gap-2 px-6 py-3 bg-[var(--color-hx-red)] text-white font-black text-sm rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 w-full h-full -ml-16 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shine"/>
                            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                            <span className="relative z-10 tracking-wide">Generar Nuevo Horario</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Estado cargando datos del servidor */}
            {status === 'loading' && (
                <div className="flex flex-col items-center justify-center gap-4 mt-20">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"/>
                        <div className="absolute inset-0 border-4 border-hx-red rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1s' }}/>
                    </div>
                    <p className="text-slate-400 text-sm font-semibold">Cargando horarios...</p>
                </div>
            )}

            {/* Estado vacío */}
            {status === 'empty' && (
                <div className="flex flex-col items-center justify-center max-w-2xl w-full mx-auto text-center p-12 bg-white rounded-[32px] border border-slate-100 shadow-xl relative overflow-hidden mt-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-hx-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"/>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-hx-pink/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"/>
                    <div className="relative z-10 flex flex-col items-center w-full">
                        {errorMsg && (
                            <div className="w-full bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6 font-bold text-sm text-left whitespace-pre-wrap">
                                {errorMsg}
                            </div>
                        )}
                        <div className="w-24 h-24 mb-8 bg-gradient-to-br from-indigo-500 via-hx-blue to-teal-400 rounded-3xl flex items-center justify-center shadow-lg shadow-hx-blue/20 rotate-3 hover:rotate-6 transition-transform duration-500">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Aún no hay horarios listos</h2>
                        <p className="text-slate-500 text-[15px] font-medium max-w-md mx-auto mb-6 leading-relaxed">
                            Haz clic en el botón superior para calcular y generar las combinaciones de horario.
                        </p>
                    </div>
                </div>
            )}

            {/* Estado cargando generación */}
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
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${index < loadingStep ? 'bg-green-100 text-green-500' : 'bg-hx-red/10 text-hx-red'}`}>
                                    {index < loadingStep
                                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        : <div className="w-2.5 h-2.5 rounded-full bg-hx-red animate-ping"/>
                                    }
                                </div>
                                <p className={`font-semibold text-[15px] ${index < loadingStep ? 'text-slate-400' : 'text-slate-800'}`}>{msg}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Horario listo */}
            {status === 'ready' && (
                <div className="w-full animate-fade-in-up">

                    {filteredSecciones.length === 0 && (
                        <div className="p-6 bg-white border border-slate-200 rounded-[24px] text-center mb-5 shadow-sm">
                            <p className="text-slate-500 font-medium">No hay secciones que coincidan con los filtros seleccionados.</p>
                        </div>
                    )}

                    {/* Tabla con rowSpan para bloques fusionados */}
                    {selectedSeccion && (
                        <div id="horario-table-container" className="bg-white rounded-[24px] border border-slate-100 shadow-xl overflow-x-auto p-6">
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
                                                    // Verificar si este bloque está cubierto por un rowSpan de un bloque anterior
                                                    const cubiertoPorAnterior = filteredAsignaciones.some(x =>
                                                        normalize(x.dia) === normalize(dia.nombre_dia)
                                                        && x.horas > 1
                                                        && (bNum - 1) > x.slot_inicio
                                                        && (bNum - 1) < (x.slot_inicio + x.horas)
                                                    );
                                                    if (cubiertoPorAnterior) return null;

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
                                                                    <div className="w-1 h-1 rounded-full bg-slate-300"/>
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

                            {/* Leyenda de cursos */}
                            {filteredAsignaciones.length > 0 && (() => {
                                const cursosEnSeccion = [...new Set(filteredAsignaciones.map(a => a.curso_id))];
                                return (
                                    <div className="mt-6 pt-5 border-t border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cursos en esta sección</p>
                                        <div className="flex flex-wrap gap-2">
                                            {cursosEnSeccion.map(cid => {
                                                const col = getColor(cid);
                                                return (
                                                    <span key={cid} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border-2"
                                                        style={{ backgroundColor: col.pastel, borderColor: col.solid, color: col.text }}>
                                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.solid }}/>
                                                        {getCurso(cid)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes shine { 100% { left: 125%; } }
                .animate-shine { animation: shine 3s infinite linear; }
                .animate-spin-reverse { animation: spin-reverse 1s linear infinite; }
                @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

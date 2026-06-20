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

import ConfiguracionTiemposModal from './ConfiguracionTiemposModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
    
    // Configuración de tiempos modal
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [timeConfig, setTimeConfig] = useState(null);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('horarix_time_config');
            if (saved) {
                try { setTimeConfig(JSON.parse(saved)); } catch (e) { }
            }
            
            const handleStorageChange = () => {
                const s = localStorage.getItem('horarix_time_config');
                if (s) {
                    try { setTimeConfig(JSON.parse(s)); } catch (e) { }
                }
            };
            window.addEventListener('horarix_time_config_changed', handleStorageChange);
            return () => window.removeEventListener('horarix_time_config_changed', handleStorageChange);
        }
    }, []);

    const handleDownloadPDF = async () => {
        const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
        
        setIsDownloadingPdf(true);
        try {
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            let isFirstPage = true;

            const profesoresAExportar = profesores.length > 0 ? profesores : [];

            if (profesoresAExportar.length === 0) {
                setIsDownloadingPdf(false);
                return;
            }

            profesoresAExportar.forEach(prof => {
                const profAsignaciones = asignaciones.filter(a => String(a.profesor_id).replace('PROF_','') === String(prof.id_profesor));
                if (profAsignaciones.length === 0) return;

                turnos.forEach(turno => {
                    const asignacionesTurno = profAsignaciones.filter(a => {
                        const secId = parseInt(String(a.seccion_id).replace('SEC_', ''));
                        const diaObj = dias.find(d => normalize(d.nombre_dia) === normalize(a.dia));
                        if (!diaObj) return false;
                        const st = seccionTurnos.find(st => st.id_seccion === secId && st.id_dia === diaObj.id_dia);
                        return st && st.id_turno === turno.id_turno;
                    });

                    if (asignacionesTurno.length === 0) return;

                    if (!isFirstPage) pdf.addPage();
                    isFirstPage = false;
                    
                    const titulo = `Profesor: ${prof.nombre_profesor} - Turno: ${turno.nombre}`;
                    
                    pdf.setFontSize(14);
                    pdf.text(titulo, 14, 20);

                    const tableData = [];
                    mappedBlocks.forEach(bloque => {
                        if (bloque.type === 'recreo') {
                            tableData.push([`${bloque.inicio}\n${bloque.fin}`, ...gridDias.map(() => 'RECREO')]);
                        } else {
                            const row = [`${bloque.inicio}\n${bloque.fin}`];
                            gridDias.forEach(dia => {
                                const asignaciones = asignacionesTurno.filter(a => {
                                    const diaObj = dias.find(d => normalize(d.nombre_dia) === normalize(a.dia));
                                    if (!diaObj || diaObj.id_dia !== dia.id_dia) return false;
                                    const bloqIni = a.slot_inicio + 1;
                                    const bloqFin = a.slot_inicio + a.horas;
                                    return bloque.numero >= bloqIni && bloque.numero <= bloqFin;
                                });

                                if (asignaciones.length > 0) {
                                    row.push(asignaciones.map(a => {
                                        const cId = parseInt(a.curso_id?.replace('CUR_','') || '0');
                                        const cursoObj = cursos.find(c => c.id_curso === cId);
                                        const cName = cursoObj ? cursoObj.nombre_curso : a.curso_id;
                                        
                                        const secIdNum = parseInt(String(a.seccion_id).replace('SEC_', ''));
                                        const secObj = secciones.find(s => s.id_seccion === secIdNum);
                                        let secStr = String(a.seccion_id).replace('SEC_', '');
                                        if (secObj) {
                                            const gradoObj = grados.find(g => g.id_grado === secObj.id_grado);
                                            secStr = `${gradoObj ? gradoObj.numero + '° ' : ''}Sec. ${secObj.nombre}`;
                                        }
                                        
                                        return `${cName}\n${secStr}`;
                                    }).join("\n\n"));
                                } else {
                                    row.push("");
                                }
                            });
                            tableData.push(row);
                        }
                    });

                    autoTable(pdf, {
                        startY: 25,
                        head: [["Bloque", ...gridDias.map(d => d.nombre_dia.toUpperCase())]],
                        body: tableData,
                        theme: 'grid',
                        styles: { fontSize: 8, cellPadding: 2, halign: 'center', valign: 'middle' },
                        headStyles: { fillColor: [139, 92, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
                        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 20 } },
                        didParseCell: function(data) {
                            if (data.row.raw[1] === 'RECREO' && data.column.index > 0) {
                                data.cell.styles.fillColor = [253, 230, 138];
                                data.cell.styles.textColor = [180, 83, 9];
                                data.cell.styles.fontStyle = 'bold';
                            }
                        }
                    });
                });
            });

            pdf.save(`Horarios_Profesores_Completos.pdf`);
        } catch (error) {
            console.error("Error al generar el PDF: ", error);
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleDownloadExcel = () => {
        try {
            const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
            const wb = XLSX.utils.book_new();

            const profesoresAExportar = profesores.length > 0 ? profesores : [];

            if (profesoresAExportar.length === 0) return;

            profesoresAExportar.forEach(prof => {
                const profAsignaciones = asignaciones.filter(a => String(a.profesor_id).replace('PROF_','') === String(prof.id_profesor));
                if (profAsignaciones.length === 0) return;

                turnos.forEach(turno => {
                    const asignacionesTurno = profAsignaciones.filter(a => {
                        const secId = parseInt(String(a.seccion_id).replace('SEC_', ''));
                        const diaObj = dias.find(d => normalize(d.nombre_dia) === normalize(a.dia));
                        if (!diaObj) return false;
                        const st = seccionTurnos.find(st => st.id_seccion === secId && st.id_dia === diaObj.id_dia);
                        return st && st.id_turno === turno.id_turno;
                    });

                    if (asignacionesTurno.length === 0) return;

                    const profAbrev = prof.nombre_profesor.split(' ').map(w => w[0]).join('').substring(0, 5);
                    const sheetName = `${profAbrev} ${turno.nombre.substring(0, 10)} ${prof.id_profesor}`;
                    const wsData = [];
                    wsData.push(["Bloque", ...gridDias.map(d => d.nombre_dia.toUpperCase())]);

                    mappedBlocks.forEach(bloque => {
                        if (bloque.type === 'recreo') {
                            wsData.push([`${bloque.inicio} - ${bloque.fin}`, ...gridDias.map(() => 'RECREO')]);
                        } else {
                            const row = [`${bloque.inicio} - ${bloque.fin}`];
                            gridDias.forEach(dia => {
                                const asignaciones = asignacionesTurno.filter(a => {
                                    const diaObj = dias.find(d => normalize(d.nombre_dia) === normalize(a.dia));
                                    if (!diaObj || diaObj.id_dia !== dia.id_dia) return false;
                                    const bloqIni = a.slot_inicio + 1;
                                    const bloqFin = a.slot_inicio + a.horas;
                                    return bloque.numero >= bloqIni && bloque.numero <= bloqFin;
                                });

                                if (asignaciones.length > 0) {
                                    row.push(asignaciones.map(a => {
                                        const cId = parseInt(a.curso_id?.replace('CUR_','') || '0');
                                        const cursoObj = cursos.find(c => c.id_curso === cId);
                                        const cName = cursoObj ? cursoObj.nombre_curso : a.curso_id;

                                        const secIdNum = parseInt(String(a.seccion_id).replace('SEC_', ''));
                                        const secObj = secciones.find(s => s.id_seccion === secIdNum);
                                        let secStr = String(a.seccion_id).replace('SEC_', '');
                                        if (secObj) {
                                            const gradoObj = grados.find(g => g.id_grado === secObj.id_grado);
                                            secStr = `${gradoObj ? gradoObj.numero + '° ' : ''}Sec. ${secObj.nombre}`;
                                        }

                                        return `${cName} / ${secStr}`;
                                    }).join(" | "));
                                } else {
                                    row.push("");
                                }
                            });
                            wsData.push(row);
                        }
                    });

                    const ws = XLSX.utils.aoa_to_sheet(wsData);
                    
                    // Configurar ancho de columnas
                    const colWidths = [{ wch: 15 }, ...gridDias.map(() => ({ wch: 28 }))];
                    ws['!cols'] = colWidths;
                    
                    const safeSheetName = sheetName.substring(0, 31).replace(/[\\/?*[\]]/g, '');
                    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
                });
            });

            if (wb.SheetNames.length === 0) {
                alert("No hay datos de horarios de profesores generados para exportar.");
                return;
            }

            XLSX.writeFile(wb, `Horarios_Profesores_Completos.xlsx`);
        } catch(error) {
            console.error("Error al generar Excel: ", error);
        }
    };

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

    // Helpers para calcular horas dinámicas
    const parseTime = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };
    const formatTime = (mins) => {
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = (mins % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const mappedBlocks = useMemo(() => {
        if (!timeConfig) {
            // Si no hay config, devolvemos formato estándar sin recreos
            return Array.from({ length: maxBloquesDia }, (_, i) => ({
                type: 'clase',
                numero: i + 1,
                inicio: null,
                fin: null
            }));
        }

        let currentMins = parseTime(timeConfig.horaInicio);
        const result = [];
        const dur = parseInt(timeConfig.duracionBloque) || 45;

        for (let i = 1; i <= maxBloquesDia; i++) {
            const inicioClase = formatTime(currentMins);
            currentMins += dur;
            const finClase = formatTime(currentMins);

            result.push({
                type: 'clase',
                numero: i,
                inicio: inicioClase,
                fin: finClase
            });

            const recreo = timeConfig.recreos?.find(r => parseInt(r.despuesDeBloque) === i);
            if (recreo) {
                const inicioRecreo = formatTime(currentMins);
                currentMins += parseInt(recreo.duracion) || 15;
                const finRecreo = formatTime(currentMins);

                result.push({
                    type: 'recreo',
                    inicio: inicioRecreo,
                    fin: finRecreo,
                    duracion: recreo.duracion,
                    despuesDeBloque: i
                });
            }
        }
        return result;
    }, [maxBloquesDia, timeConfig]);

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
                                    <div key={turno.id_turno} className="flex flex-col gap-4 w-full">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-2 ml-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full bg-hx-purple"></div>
                                                <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-widest">Turno {turno.nombre}</h3>
                                            </div>
                                            <div className="flex justify-start lg:justify-end gap-3 flex-shrink-0">
                                                <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 hover:shadow-md font-black text-[13px] transition-all cursor-pointer">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                    Descargar Excel (Todos)
                                                </button>
                                                <button onClick={handleDownloadPDF} disabled={isDownloadingPdf} className={`flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 hover:shadow-md font-black text-[13px] transition-all cursor-pointer ${isDownloadingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                    <svg className={`w-4 h-4 ${isDownloadingPdf ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                    {isDownloadingPdf ? 'Generando PDF...' : 'Descargar PDF (Todos)'}
                                                </button>
                                            </div>
                                        </div>
                                        <div id={`horario-profesor-table-${turno.nombre}`} className="w-full bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto p-6 pt-4">
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
                                                {mappedBlocks.map((bloque, idx) => {
                                                    if (bloque.type === 'recreo') {
                                                        return (
                                                            <tr key={`recreo-${idx}`} style={{ height: '65px' }} className="bg-slate-50">
                                                                <td className="py-2 pr-3 text-center align-middle" style={{ width: '70px' }}>
                                                                    <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-200 shadow-sm rounded-xl py-2 px-1">
                                                                        <span className="text-[13px] font-black text-amber-800 leading-none mb-1">{bloque.inicio}</span>
                                                                        <div className="w-4 h-px bg-amber-300 my-0.5"></div>
                                                                        <span className="text-[11px] font-bold text-amber-600/80 leading-none mt-1">{bloque.fin}</span>
                                                                    </div>
                                                                </td>
                                                                <td colSpan={gridDias.length} className="px-1 py-1 h-[65px]">
                                                                    <div className="w-full h-full min-h-[50px] flex items-center justify-center gap-4 bg-gradient-to-r from-amber-50/50 via-amber-100/50 to-amber-50/50 py-3 rounded-[16px] border border-amber-200/50 shadow-sm relative overflow-hidden">
                                                                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 25%, transparent 25%, transparent 75%, #f59e0b 75%, #f59e0b)', backgroundSize: '10px 10px' }}></div>
                                                                        <div className="h-px bg-amber-300/60 flex-1 ml-8 relative z-10"></div>
                                                                        <div className="flex items-center gap-3 relative z-10">
                                                                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                                            <span className="text-[13px] font-black text-amber-700 tracking-[0.4em] uppercase mt-0.5">R E C R E O</span>
                                                                        </div>
                                                                        <div className="h-px bg-amber-300/60 flex-1 mr-8 relative z-10"></div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    const bNum = bloque.numero;
                                                    return (
                                                        <tr key={`clase-${bNum}`} style={{ height: '100px' }}>
                                                            {/* Número de bloque o Hora */}
                                                            <td className="py-2 pr-3 text-center align-middle" style={{ width: '70px' }}>
                                                                {bloque.inicio ? (
                                                                    <div className="flex flex-col items-center justify-center bg-white border border-slate-100 shadow-sm rounded-xl py-2 px-1">
                                                                        <span className="text-[13px] font-black text-slate-700 leading-none mb-1">{bloque.inicio}</span>
                                                                        <div className="w-4 h-px bg-slate-200 my-0.5"></div>
                                                                        <span className="text-[11px] font-bold text-slate-400 leading-none mt-1">{bloque.fin}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                                                                        <span className="text-[11px] font-black text-slate-600">{bNum}</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            {gridDias.map((dia) => {
                                                                // Buscar asignación
                                                                const asigOriginal = asignacionesTurno.find(x =>
                                                                    normalize(x.dia) === normalize(dia.nombre_dia)
                                                                    && (x.slot_inicio + 1) <= bNum
                                                                    && (x.slot_inicio + x.horas) >= bNum
                                                                );

                                                                let renderAsignacion = null;
                                                                if (asigOriginal) {
                                                                    const startBlock = asigOriginal.slot_inicio + 1;
                                                                    const endBlock = asigOriginal.slot_inicio + asigOriginal.horas;
                                                                    const isStart = bNum === startBlock;
                                                                    const isAfterRecreo = bNum > startBlock && timeConfig?.recreos?.some(rec => parseInt(rec.despuesDeBloque) === (bNum - 1));
                                                                    
                                                                    if (isStart || isAfterRecreo) {
                                                                        let currentSpan = 0;
                                                                        for (let r = bNum; r <= endBlock; r++) {
                                                                            currentSpan++;
                                                                            if (r < endBlock && timeConfig?.recreos?.some(rec => parseInt(rec.despuesDeBloque) === r)) {
                                                                                break;
                                                                            }
                                                                        }
                                                                        renderAsignacion = { a: asigOriginal, span: currentSpan };
                                                                    } else {
                                                                        return null; // Ocupado por span superior
                                                                    }
                                                                }

                                                                if (renderAsignacion) {
                                                                    const a = renderAsignacion.a;
                                                                    const col = getColor(a.curso_id);
                                                                    const span = renderAsignacion.span;

                                                                    return (
                                                                        <td key={dia.id_dia} rowSpan={span} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                                            <div className="rounded-2xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:shadow-lg border-2 relative z-10"
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
                                                                                    
                                                                                    <div className="mt-4 w-full flex flex-col gap-2 items-center">
                                                                                        <span className="block text-[14px] font-black tracking-widest uppercase" style={{ color: col.text }}>
                                                                                            {getGradoSeccion(a.seccion_id)}
                                                                                        </span>
                                                                                        
                                                                                        <span className="block text-[11px] font-bold tracking-widest uppercase opacity-75" style={{ color: col.text }}>
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

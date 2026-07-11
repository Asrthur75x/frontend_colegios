import React, { useState, useEffect, useMemo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import ConfiguracionTiemposModal from './ConfiguracionTiemposModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { subscribe, startGeneracion, clearResult, getGeneracionState, LOADING_MESSAGES } from './generacionGlobal';
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

const formatFriendlyError = (err, profesores) => {
    if (typeof err !== 'string') return err;
    let formattedErr = err;

    // Check for the curricular potential validation error
    const currMatch = err.match(/\[horas_minimas\]\[(PROF_\d+)\]\s*.+?exige (\d+) horas mínimas pero por su habilitación curricular.*?máximo de (\d+) horas/i);
    if (currMatch) {
        const profId = currMatch[1];
        const prof = profesores.find(p => p.id_profesor == profId.replace('PROF_', ''));
        const pName = prof ? prof.nombre_profesor : profId;
        return `El profesor ${pName} exige ${currMatch[2]} horas mínimas, pero por los grados y cursos que tiene habilitados, solo es posible asignarle un máximo de ${currMatch[3]} horas de clase.`;
    }

    // Check for the physical availability validation error
    const physMatch = err.match(/\[horas_minimas\]\[(PROF_\d+)\]\s*.+?exige (\d+) horas mínimas pero su disponibilidad física solo suma (\d+) slots/i);
    if (physMatch) {
        const profId = physMatch[1];
        const prof = profesores.find(p => p.id_profesor == profId.replace('PROF_', ''));
        const pName = prof ? prof.nombre_profesor : profId;
        return `El profesor ${pName} exige ${physMatch[2]} horas mínimas, pero los horarios en los que está disponible solo suman ${physMatch[3]} horas en total.`;
    }

    // Fallback if it's another type of horas_minimas error
    const profMatch = err.match(/\[horas_minimas\]\[(PROF_\d+)\]\s*(.)/);
    if (profMatch) {
        const profId = profMatch[1];
        const firstChar = profMatch[2];
        const prof = profesores.find(p => p.id_profesor == profId.replace('PROF_', ''));
        const pName = prof ? prof.nombre_profesor : profId;
        formattedErr = err.replace(/\[horas_minimas\]\[PROF_\d+\]\s*./, `${pName} ${firstChar.toLowerCase()}`);
    }

    // Clean any remaining tags
    formattedErr = formattedErr.replace(/\[[a-zA-Z_]+\](?:\[[^\]]+\])?\s*/g, '');
    return formattedErr;
};

export default function HorariosManager({ isEditPage = false }) {
    const [status, setStatus] = useState(() => {
        if (typeof window === 'undefined') return 'loading';
        const gen = getGeneracionState();
        if (gen.status === 'generating') return 'generating';
        return 'loading';
    });
    const [loadingStep, setLoadingStep] = useState(() => {
        if (typeof window === 'undefined') return 0;
        const gen = getGeneracionState();
        return gen.status === 'generating' ? gen.loadingStep : 0;
    });
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

    // Configuración de tiempos modal
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    // Drag & Drop edit mode
    const [isEditMode, setIsEditMode] = useState(false);
    const [dragData, setDragData] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);
    const [moveConflicts, setMoveConflicts] = useState(null);
    const [swapConfirm, setSwapConfirm] = useState(null);
    const [originalAsignaciones, setOriginalAsignaciones] = useState(null);
    const [isSavingEdits, setIsSavingEdits] = useState(false);

    // UI States
    const [activeView, setActiveView] = useState('horario'); // 'horario' o 'metricas'
    const [metricasMotor, setMetricasMotor] = useState(null);

    // Se eliminó la dependencia de localStorage para timeConfig
    // Ahora dependemos exclusivamente de la base de datos (fetchData).
    useEffect(() => {
        const handleStorageChange = () => {
            // Recargar datos desde la API si la modal de configuración cambia
            fetch('http://localhost:8000/api/bloques', { cache: 'no-store' })
                .then(r => r.json())
                .then(b => {
                    const data = Array.isArray(b) ? b : (b.data || []);
                    setBloques(data.sort((x, y) => x.numero_bloque - y.numero_bloque));
                })
                .catch(e => console.error(e));
        };
        window.addEventListener('horarix_time_config_changed', handleStorageChange);
        return () => window.removeEventListener('horarix_time_config_changed', handleStorageChange);
    }, []);

    const loadingMessages = LOADING_MESSAGES;

    // Suscribirse al estado global de generación para mantener sincronizado
    useEffect(() => {
        const unsub = subscribe((genState) => {
            if (genState.status === 'generating') {
                setStatus('generating');
                setLoadingStep(genState.loadingStep);
            } else if (genState.status === 'success' && genState.asignaciones) {
                setAsignaciones(genState.asignaciones);
                setLoadingStep(loadingMessages.length - 1);
                setErrorMsg(null);
                setTimeout(() => {
                    setStatus('ready');
                    clearResult();
                }, 1000);
            } else if (genState.status === 'error') {
                setErrorMsg(genState.errorMsg);
                setStatus('empty');
                clearResult();
            }
        });
        return unsub;
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Hacer todas las peticiones en paralelo
                const [secRes, curRes, profRes, diasRes, bloqRes, configRes, horarioRes, gradosRes, sedesRes, turnosRes, seccionTurnosRes, bloqReservRes, metricasRes] = await Promise.all([
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
                    fetch(`${API_BASE}/bloque-reservado`),
                    fetch(`${API_BASE}/horario-metricas-motor`)
                ]);

                // Parsear todos los JSON juntos
                const [secData, curData, profData, diasData, bloqData, configData, horarioData, gradosData, sedesData, turnosData, stData, bloqReservData, metricasData] = await Promise.all([
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
                    bloqReservRes.ok ? bloqReservRes.json() : Promise.resolve([]),
                    metricasRes.ok ? metricasRes.json() : Promise.resolve(null)
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
                setMetricasMotor(metricasData);
                setMaxBloquesDia(maxBlq > 0 ? maxBlq : 6);
                setAsignaciones(asignacionesData);
                setSelectedSeccion(primeraSeccion);
                // No sobreescribir el status si hay una generación en curso
                const gen = getGeneracionState();
                if (gen.status !== 'generating') {
                    setStatus(nuevoStatus);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                const gen2 = getGeneracionState();
                if (gen2.status !== 'generating') {
                    setStatus('empty');
                }
            }
        };
        fetchData();
    }, []);

    const handleDownloadPDF = async () => {
        const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

        setIsDownloadingPdf(true);
        try {
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            let isFirstPage = true;

            const seccionesAExportar = selectedSeccion && filteredSecciones.length > 0
                ? filteredSecciones
                : secciones;

            if (seccionesAExportar.length === 0) {
                setIsDownloadingPdf(false);
                return;
            }

            seccionesAExportar.forEach((sec) => {
                const asignacionesSec = asignaciones.filter(a => String(a.seccion_id).replace('SEC_', '') === String(sec.id_seccion));
                // Si la seccion no tiene clases en absoluto, podemos omitirla para no tener PDFs vacios
                if (asignacionesSec.length === 0) return;

                if (!isFirstPage) pdf.addPage();
                isFirstPage = false;

                const secGrado = grados.find(g => g.id_grado === sec.id_grado);
                const titulo = `Horario General - ${secGrado ? secGrado.numero + ' Grado ' : ''}Seccion ${sec.nombre}`;

                pdf.setFontSize(14);
                pdf.text(titulo, 14, 20);

                const turnosSeccion = seccionTurnos.filter(st => st.id_seccion === sec.id_seccion).map(st => st.id_turno);
                const reservacionesSeccion = [];
                bloquesReservados.forEach(reserva => {
                    if (reserva.id_sede === sec.id_sede && reserva.grados.includes(sec.id_grado) && turnosSeccion.includes(reserva.id_turno)) {
                        reserva.opciones.forEach(op => {
                            if (op.slots && op.slots.length > 0) {
                                op.slots.forEach(slot => {
                                    const getDisplayName = () => {
                                        if (reserva.nombre && op.nombre) {
                                            if (reserva.nombre === op.nombre) return reserva.nombre;
                                            return `${reserva.nombre} - ${op.nombre}`;
                                        }
                                        return reserva.nombre || op.nombre || `Reserva`;
                                    };
                                    reservacionesSeccion.push({ id_dia: reserva.id_dia, numero_bloque: slot, nombre: getDisplayName() });
                                });
                            }
                        });
                    }
                });

                const tableData = [];
                mappedBlocks.forEach(bloque => {
                    if (bloque.type === 'recreo') {
                        tableData.push([`${bloque.inicio}\n${bloque.fin}`, ...gridDias.map(() => 'RECREO')]);
                    } else {
                        const row = [`${bloque.inicio}\n${bloque.fin}`];
                        gridDias.forEach(dia => {
                            const asignaciones = asignacionesSec.filter(a => {
                                const diaObj = dias.find(d => normalize(d.nombre_dia) === normalize(a.dia));
                                if (!diaObj || diaObj.id_dia !== dia.id_dia) return false;
                                const bloqIni = a.slot_inicio + 1;
                                const bloqFin = a.slot_inicio + a.horas;
                                return bloque.numero >= bloqIni && bloque.numero <= bloqFin;
                            });

                            const reservado = reservacionesSeccion.find(r => r.id_dia === dia.id_dia && r.numero_bloque === bloque.numero);

                            if (reservado && asignaciones.length === 0) {
                                row.push(`RESERVA\n${reservado.nombre}`);
                            } else if (asignaciones.length > 0) {
                                row.push(asignaciones.map(a => {
                                    const cursoStr = cursos.find(c => `CUR_${c.id_curso}` === a.curso_id)?.nombre_curso || 'Desconocido';
                                    const profStr = profesores.find(p => `PROF_${p.id_profesor}` === a.profesor_id)?.nombre_profesor || 'Desconocido';
                                    return `${cursoStr}\nProf. ${profStr}`;
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
                    didParseCell: function (data) {
                        if (data.row.raw[1] === 'RECREO' && data.column.index > 0) {
                            data.cell.styles.fillColor = [253, 230, 138];
                            data.cell.styles.textColor = [180, 83, 9];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                });
            });

            pdf.save(`Horarios_Completos_General.pdf`);
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

            const seccionesAExportar = selectedSeccion && filteredSecciones.length > 0
                ? filteredSecciones
                : secciones;

            if (seccionesAExportar.length === 0) return;

            seccionesAExportar.forEach((sec) => {
                const asignacionesSec = asignaciones.filter(a => String(a.seccion_id).replace('SEC_', '') === String(sec.id_seccion));
                if (asignacionesSec.length === 0) return; // Evitar hojas vacías

                const secGrado = grados.find(g => g.id_grado === sec.id_grado);
                const sheetName = `${secGrado ? secGrado.numero : ''}G Sec ${sec.nombre} ${sec.id_seccion}`;

                const wsData = [];
                wsData.push(["Bloque", ...gridDias.map(d => d.nombre_dia.toUpperCase())]);

                const turnosSeccion = seccionTurnos.filter(st => st.id_seccion === sec.id_seccion).map(st => st.id_turno);
                const reservacionesSeccion = [];
                bloquesReservados.forEach(reserva => {
                    if (reserva.id_sede === sec.id_sede && reserva.grados.includes(sec.id_grado) && turnosSeccion.includes(reserva.id_turno)) {
                        reserva.opciones.forEach(op => {
                            if (op.slots && op.slots.length > 0) {
                                op.slots.forEach(slot => {
                                    const getDisplayName = () => {
                                        if (reserva.nombre && op.nombre) {
                                            if (reserva.nombre === op.nombre) return reserva.nombre;
                                            return `${reserva.nombre} - ${op.nombre}`;
                                        }
                                        return reserva.nombre || op.nombre || `Reserva`;
                                    };
                                    reservacionesSeccion.push({ id_dia: reserva.id_dia, numero_bloque: slot, nombre: getDisplayName() });
                                });
                            }
                        });
                    }
                });

                mappedBlocks.forEach(bloque => {
                    if (bloque.type === 'recreo') {
                        wsData.push([`${bloque.inicio} - ${bloque.fin}`, ...gridDias.map(() => 'RECREO')]);
                    } else {
                        const row = [`${bloque.inicio} - ${bloque.fin}`];
                        gridDias.forEach(dia => {
                            const asignaciones = asignacionesSec.filter(a => {
                                const diaObj = dias.find(d => normalize(d.nombre_dia) === normalize(a.dia));
                                if (!diaObj || diaObj.id_dia !== dia.id_dia) return false;
                                const bloqIni = a.slot_inicio + 1;
                                const bloqFin = a.slot_inicio + a.horas;
                                return bloque.numero >= bloqIni && bloque.numero <= bloqFin;
                            });

                            const reservado = reservacionesSeccion.find(r => r.id_dia === dia.id_dia && r.numero_bloque === bloque.numero);

                            if (reservado && asignaciones.length === 0) {
                                row.push(`RESERVA: ${reservado.nombre}`);
                            } else if (asignaciones.length > 0) {
                                row.push(asignaciones.map(a => {
                                    const cursoStr = cursos.find(c => `CUR_${c.id_curso}` === a.curso_id)?.nombre_curso || 'Desconocido';
                                    const profStr = profesores.find(p => `PROF_${p.id_profesor}` === a.profesor_id)?.nombre_profesor || 'Desconocido';
                                    return `${cursoStr} / Prof. ${profStr}`;
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

            if (wb.SheetNames.length === 0) {
                alert("No hay datos de horarios generados para exportar.");
                return;
            }

            XLSX.writeFile(wb, `Horarios_Completos_General.xlsx`);
        } catch (error) {
            console.error("Error al generar Excel: ", error);
        }
    };

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
        setErrorMsg(null);
        startGeneracion();
    };

    // --- Drag & Drop Editing ---
    const toggleEditMode = () => {
        if (!isEditMode) {
            setOriginalAsignaciones([...asignaciones]);
            setIsEditMode(true);
        } else {
            handleCancelEdit();
        }
    };

    const reloadAsignaciones = async () => {
        try {
            const res = await fetch(`${API_BASE}/cargar-horario`);
            const data = await res.json();
            if (data.status === 'success' && data.resultado?.asignaciones) {
                setAsignaciones(data.resultado.asignaciones);
            }
        } catch (e) { console.error(e); }
    };

    const handleDragStart = (e, asignacion) => {
        if (!isEditMode) return;
        const data = {
            seccion_id: parseInt(asignacion.seccion_id.replace('SEC_', '')),
            curso_id: parseInt(asignacion.curso_id.replace('CUR_', '')),
            profesor_id: parseInt(asignacion.profesor_id.replace('PROF_', '')),
            dia_origen: asignacion.dia,
            slot_inicio_origen: asignacion.slot_inicio,
            horas_origen: asignacion.horas,
            turno_origen: asignacion.turno || 'Mañana',
            raw: asignacion
        };
        setDragData(data);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(data));
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
        setDropTarget(null);
    };

    const handleDragOver = (e, diaId, bloqueNum) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget({ diaId, bloqueNum });
    };

    const handleDragLeave = () => { setDropTarget(null); };

    const handleDrop = async (e, dia, bloqueNum) => {
        e.preventDefault();
        setDropTarget(null);
        if (!dragData) return;

        const diaOrigenObj = dias.find(d => normalize(d.nombre_dia) === normalize(dragData.dia_origen));
        const diaDestinoObj = dia;
        if (!diaOrigenObj) return;

        const turnosSeccion = seccionTurnos.filter(st => st.id_seccion === dragData.seccion_id).map(st => st.id_turno);
        const idTurno = turnosSeccion.length > 0 ? turnosSeccion[0] : (turnos.length > 0 ? turnos[0].id_turno : 1);

        const payload = {
            seccion_id: dragData.seccion_id,
            curso_id: dragData.curso_id,
            profesor_id: dragData.profesor_id,
            dia_origen_id: diaOrigenObj.id_dia,
            turno_origen_id: idTurno,
            slot_inicio_origen: dragData.slot_inicio_origen,
            horas_origen: dragData.horas_origen,
            dia_destino_id: diaDestinoObj.id_dia,
            turno_destino_id: idTurno,
            slot_inicio_destino: bloqueNum - 1,
            horas_destino: dragData.horas_origen
        };

        try {
            const valRes = await fetch(`${API_BASE}/horario-final/validate-move`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            const valData = await valRes.json();

            if (!valData.valid) {
                setMoveConflicts({ conflicts: valData.conflicts || [], warnings: valData.warnings || [] });
                setDragData(null);
                return;
            }

            if (valData.isSwap && valData.swapInfo) {
                setSwapConfirm({ payload, swapInfo: valData.swapInfo, warnings: valData.warnings || [] });
                setDragData(null);
                return;
            }

            // Direct move - apply immediately
            if (valData.warnings && valData.warnings.length > 0) {
                // Show warnings but still apply
                console.warn('Move warnings:', valData.warnings);
            }

            const applyRes = await fetch(`${API_BASE}/horario-final/apply-move`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            if (applyRes.ok) await reloadAsignaciones();
        } catch (err) {
            console.error('Move error:', err);
            setMoveConflicts({ conflicts: ['Error de conexión con el servidor'], warnings: [] });
        }
        setDragData(null);
    };

    const confirmSwap = async () => {
        if (!swapConfirm) return;
        try {
            const res = await fetch(`${API_BASE}/horario-final/apply-move`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(swapConfirm.payload)
            });
            if (res.ok) await reloadAsignaciones();
        } catch (err) { console.error(err); }
        setSwapConfirm(null);
    };

    const handleSaveEdits = async () => {
        setIsSavingEdits(true);
        try {
            await fetch(`${API_BASE}/horario-final/save-edits`, { method: 'POST' });
            setOriginalAsignaciones(null);
            setIsEditMode(false);
        } catch (err) { console.error(err); }
        setIsSavingEdits(false);
    };

    const handleCancelEdit = async () => {
        if (originalAsignaciones) setAsignaciones(originalAsignaciones);
        setOriginalAsignaciones(null);
        setIsEditMode(false);
        await reloadAsignaciones();
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

    const mappedBlocks = React.useMemo(() => {
        if (!secActual) {
            return blockNumbers.map(n => ({
                type: 'clase',
                numero: n,
                inicio: null,
                fin: null
            }));
        }

        const turnosSeccionLocal = seccionTurnos.filter(st => st.id_seccion === secActual.id_seccion).map(st => st.id_turno);
        const idTurno = turnosSeccionLocal.length > 0 ? turnosSeccionLocal[0] : null;

        if (!idTurno) {
            return blockNumbers.map(n => ({
                type: 'clase',
                numero: n,
                inicio: null,
                fin: null
            }));
        }

        const bloquesTurno = bloques.filter(b => String(b.id_turno) === String(idTurno));
        if (bloquesTurno.length === 0) {
            return blockNumbers.map(n => ({
                type: 'clase',
                numero: n,
                inicio: null,
                fin: null
            }));
        }

        const result = [];
        const formatTimeDb = (timeStr) => timeStr ? timeStr.substring(0, 5) : null;

        for (let i = 1; i <= blockNumbers.length; i++) {
            const bDb = bloquesTurno.find(b => b.numero_bloque === i && !b.es_recreo);
            if (bDb) {
                result.push({
                    type: 'clase',
                    numero: i,
                    inicio: formatTimeDb(bDb.hora_inicio),
                    fin: formatTimeDb(bDb.hora_final)
                });
            } else {
                result.push({
                    type: 'clase',
                    numero: i,
                    inicio: null,
                    fin: null
                });
            }

            const recreos = bloquesTurno.filter(b => b.es_recreo && b.despues_de_bloque === i);
            recreos.forEach(rec => {
                result.push({
                    type: 'recreo',
                    inicio: formatTimeDb(rec.hora_inicio),
                    fin: formatTimeDb(rec.hora_final),
                    duracion: rec.duracion_minutos,
                    despuesDeBloque: i
                });
            });
        }
        return result;
    }, [blockNumbers, secActual, seccionTurnos, bloques]);

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

            {/* ENCABEZADO */}
            {status !== 'empty' && status !== 'loading' && status !== 'generating' && (
                <div className="flex items-center justify-between mb-8 w-full">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            {isEditPage ? "Edición de Horarios" : "Horarios por Secciones"}
                        </h1>
                        <p className="text-slate-500 text-[14px] mt-1 font-medium">
                            {isEditPage ? "Vista especializada para la revisión y control del horario general." : "Visualización detallada de los horarios generados por sección."}
                        </p>
                    </div>
                </div>
            )}

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
                    <h3 className="text-2xl font-black text-slate-800 mb-6 tracking-tight">Preparando los horarios...</h3>
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
                        {errorMsg ? (
                            <div className="relative mt-8 mb-10 w-full max-w-2xl mx-auto text-left">
                                {/* Sombra plana desplazada tipo tarjeta (roja) */}
                                <div className="absolute top-2 -left-2 w-full h-full bg-[#da524e] rounded-sm"></div>

                                {/* Contenedor principal blanco */}
                                <div className="relative z-10 bg-white border border-gray-200 p-5 flex flex-col gap-2 rounded-sm shadow-md">
                                    <h3 className="text-[#da524e] font-bold text-[18px] tracking-tight mb-1">
                                        Error de configuración detectado
                                    </h3>

                                    <ul className="space-y-1.5 mb-1">
                                        {Array.isArray(errorMsg) ? errorMsg.map((err, i) => (
                                            <li key={i} className="flex items-start gap-2.5">
                                                <svg className="w-5 h-5 text-[#da524e] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-[14.5px] text-[#da524e] font-medium leading-tight mt-0.5">
                                                    {formatFriendlyError(err, profesores)}
                                                </span>
                                            </li>
                                        )) : (
                                            <li className="flex items-start gap-2.5">
                                                <svg className="w-5 h-5 text-[#da524e] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-[14.5px] text-[#da524e] font-medium leading-tight mt-0.5">
                                                    {formatFriendlyError(errorMsg, profesores)}
                                                </span>
                                            </li>
                                        )}
                                    </ul>

                                    <div className="flex mt-2 border-t border-gray-100 pt-3">
                                        <a href="/profesores" className="inline-flex items-center gap-2 px-5 py-2 bg-[#da524e] hover:bg-[#c74541] text-white font-bold text-[13px] rounded-sm transition-colors shadow-sm">
                                            <span>Ir a corregir Profesores</span>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-40 h-40 mb-6 flex items-center justify-center drop-shadow-xl hover:scale-105 transition-transform duration-500">
                                    <img src="/imagen.svg" alt="Ilustración de horarios" className="w-full h-full object-contain" />
                                </div>

                                <h2 className="text-[28px] leading-tight font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 mb-3 tracking-tight">
                                    Aún no hay horarios listos
                                </h2>

                                <p className="text-slate-500 text-[15px] font-medium max-w-[420px] mx-auto leading-relaxed mb-8">
                                    Parece que todavía no has armado tus horarios. Haz clic en el botón inferior y nosotros haremos la magia por ti.
                                </p>
                            </>
                        )}

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

                    {/* TABS DE VISTA */}
                    {!isEditPage && (
                        <div className="flex items-center justify-center w-full">
                            <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/60 shadow-sm backdrop-blur-sm">
                                <button
                                    onClick={() => setActiveView('horario')}
                                    className={`cursor-pointer px-6 py-2.5 rounded-xl font-bold text-[14px] transition-all duration-300 flex items-center gap-2 ${activeView === 'horario' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    Vista por Secciones
                                </button>
                                <button
                                    onClick={() => setActiveView('metricas')}
                                    className={`cursor-pointer px-6 py-2.5 rounded-xl font-bold text-[14px] transition-all duration-300 flex items-center gap-2 ${activeView === 'metricas' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    Estadísticas Generales
                                </button>
                            </div>
                        </div>
                    )}

                    {activeView === 'metricas' ? (
                        <div className="w-full flex flex-col gap-6 animate-fade-in-up">
                            {metricasMotor ? (
                                <div className="space-y-6">
                                    {/* Cards de Resumen */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                                <h3 className="font-bold text-slate-700">Slots Dictados</h3>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="text-4xl font-black text-slate-800">{metricasMotor.resumen_slots?.total_ocupados || 0}</span>
                                                <span className="text-slate-500 text-sm font-medium mb-1">/ {metricasMotor.resumen_slots?.total_disponibles || 0}</span>
                                            </div>
                                            <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${((metricasMotor.resumen_slots?.total_ocupados || 0) / (metricasMotor.resumen_slots?.total_disponibles || 1)) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                </div>
                                                <h3 className="font-bold text-slate-700">Huecos en Horario</h3>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="text-4xl font-black text-slate-800">{metricasMotor.resumen_slots?.total_huecos || 0}</span>
                                                <span className="text-slate-500 text-sm font-medium mb-1">slots vacíos</span>
                                            </div>
                                            <p className="mt-4 text-xs font-semibold text-slate-400">
                                                {metricasMotor.resumen_slots?.total_huecos === 0 ? "¡Horario perfecto sin huecos!" : "Algunas secciones tienen horas libres intermedias."}
                                            </p>
                                        </div>

                                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                </div>
                                                <h3 className="font-bold text-slate-700">Profesores Activos</h3>
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <span className="text-4xl font-black text-slate-800">{Object.keys(metricasMotor.profesores || {}).length}</span>
                                                <span className="text-slate-500 text-sm font-medium mb-1">docentes</span>
                                            </div>
                                            <p className="mt-4 text-xs font-semibold text-slate-400">Con al menos 1 clase asignada</p>
                                        </div>
                                    </div>

                                    {/* Ranking de Profesores */}
                                    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mb-8">
                                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                            <h3 className="font-black text-slate-800 text-lg">Carga Académica de Profesores</h3>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">Ordenado por horas</span>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Object.entries(metricasMotor.profesores || {})
                                                    .sort(([, a], [, b]) => b.total_horas_semanales - a.total_horas_semanales)
                                                    .map(([profId, info]) => {
                                                        const p = profesores.find(x => `PROF_${x.id_profesor}` === profId);
                                                        const name = p ? p.nombre_profesor : profId;
                                                        return (
                                                            <div key={profId} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-hx-purple/30 hover:shadow-sm transition-all group">
                                                                <div>
                                                                    <p className="font-bold text-slate-700 text-[14px] group-hover:text-hx-purple transition-colors">{name}</p>
                                                                    <p className="text-[12px] text-slate-500 mt-1 font-medium">{info.cantidad_secciones} Secc. • {info.cantidad_cursos} Cursos</p>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-right">
                                                                        <p className="font-black text-hx-purple text-xl leading-none">{info.total_horas_semanales}h</p>
                                                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">semana</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-400 font-medium">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <p>No se encontraron métricas. Intente generar el horario nuevamente.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
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

                                    {/* Botones Derecha */}
                                    <div className="flex items-center gap-3 mt-4 md:mt-0 flex-shrink-0">
                                        {isEditPage && (
                                            <button
                                                onClick={() => setIsTimeModalOpen(true)}
                                                className="h-[44px] px-5 bg-white border-2 border-slate-200 text-slate-600 hover:text-hx-purple hover:border-hx-purple text-[13px] font-black rounded-xl transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap cursor-pointer"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                Editar Horario
                                            </button>
                                        )}
                                        {isEditPage && (
                                            <button onClick={handleDownloadExcel}
                                                className="h-[44px] px-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 font-black text-[13px] transition-all cursor-pointer">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                Excel
                                            </button>
                                        )}
                                        {isEditPage && (
                                            <button onClick={handleDownloadPDF} disabled={isDownloadingPdf}
                                                className={`h-[44px] px-4 flex items-center gap-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 font-black text-[13px] transition-all cursor-pointer ${isDownloadingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <svg className={`w-4 h-4 ${isDownloadingPdf ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                {isDownloadingPdf ? 'PDF...' : 'PDF'}
                                            </button>
                                        )}

                                        {!isEditPage && (
                                            <button
                                                onClick={handleGenerar}
                                                className="group relative flex items-center justify-center gap-2 px-6 h-[44px] bg-[var(--color-hx-purple)] text-white font-black text-sm rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden cursor-pointer"
                                            >
                                                <div className="absolute inset-0 w-full h-full -ml-16 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shine" />
                                                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                <span className="relative z-10 tracking-wide">Generar Horarios</span>
                                            </button>
                                        )}
                                    </div>
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
                                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-2 ml-2">
                                            <div className="flex flex-col">
                                                <h2 className="text-[28px] md:text-[34px] font-black text-slate-800 tracking-tight leading-none mb-3">
                                                    {currGrado ? `${currGrado.numero}° - ` : ''}Sección {currSec.nombre}
                                                </h2>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                                    <span className="text-hx-purple font-black text-[15px]">{currGrado ? `Grado: ${currGrado.numero}°` : 'Sin Grado'}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-slate-500 font-bold text-[15px]">{currSede ? `Sede: ${currSede.nombre_sede}` : 'Sin Sede'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Tabla de Horario */}
                                {selectedSeccion ? (
                                    <div className="flex flex-col gap-4 w-full mt-4">
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
                                                    {mappedBlocks.map((bloque, idx) => {
                                                        if (bloque.type === 'recreo') {
                                                            if (!isEditPage) return null;
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
                                                                    {(isEditPage && bloque.inicio) ? (
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
                                                                    // Chequear Bloques Reservados Especiales
                                                                    const reservaOriginal = reservacionesSeccion.find(r =>
                                                                        r.id_dia === dia.id_dia
                                                                        && r.slot_inicio <= bNum
                                                                        && (r.slot_inicio + r.horas - 1) >= bNum
                                                                    );

                                                                    let renderReserva = null;
                                                                    if (reservaOriginal) {
                                                                        const startBlock = reservaOriginal.slot_inicio;
                                                                        const endBlock = reservaOriginal.slot_inicio + reservaOriginal.horas - 1;
                                                                        const isStart = bNum === startBlock;
                                                                        const isAfterRecreo = isEditPage && bNum > startBlock && mappedBlocks.some(b => b.type === 'recreo' && b.despuesDeBloque === (bNum - 1));

                                                                        if (isStart || isAfterRecreo) {
                                                                            let currentSpan = 0;
                                                                            for (let r = bNum; r <= endBlock; r++) {
                                                                                currentSpan++;
                                                                                if (isEditPage && r < endBlock && mappedBlocks.some(b => b.type === 'recreo' && b.despuesDeBloque === r)) {
                                                                                    break;
                                                                                }
                                                                            }
                                                                            renderReserva = { a: reservaOriginal, span: currentSpan };
                                                                        } else {
                                                                            return null; // Ocupado por span superior
                                                                        }
                                                                    }

                                                                    if (renderReserva) {
                                                                        const span = renderReserva.span;
                                                                        const reservaActiva = renderReserva.a;
                                                                        return (
                                                                            <td key={dia.id_dia} rowSpan={span} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                                                <div className={`rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm border-2 overflow-hidden relative`}
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

                                                                    // Buscar asignación
                                                                    const asigOriginal = filteredAsignaciones.find(x =>
                                                                        normalize(x.dia) === normalize(dia.nombre_dia)
                                                                        && (x.slot_inicio + 1) <= bNum
                                                                        && (x.slot_inicio + x.horas) >= bNum
                                                                    );

                                                                    let renderAsignacion = null;
                                                                    if (asigOriginal) {
                                                                        const startBlock = asigOriginal.slot_inicio + 1;
                                                                        const endBlock = asigOriginal.slot_inicio + asigOriginal.horas;
                                                                        const isStart = bNum === startBlock;
                                                                        const isAfterRecreo = isEditPage && bNum > startBlock && mappedBlocks.some(b => b.type === 'recreo' && b.despuesDeBloque === (bNum - 1));

                                                                        if (isStart || isAfterRecreo) {
                                                                            let currentSpan = 0;
                                                                            for (let r = bNum; r <= endBlock; r++) {
                                                                                currentSpan++;
                                                                                if (isEditPage && r < endBlock && mappedBlocks.some(b => b.type === 'recreo' && b.despuesDeBloque === r)) {
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
                                                                        const isDragging = isEditMode && dragData && dragData.raw === a;

                                                                        return (
                                                                            <td key={dia.id_dia} rowSpan={span} className="py-1 px-1" style={{ verticalAlign: 'middle' }}>
                                                                                <div
                                                                                    className={`rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all duration-200 border-2 relative z-10`}
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
                                                                        const isDropHere = isEditMode && dropTarget && dropTarget.diaId === dia.id_dia && dropTarget.bloqueNum === bNum;
                                                                        return (
                                                                            <td key={dia.id_dia} className="py-1 px-1" style={{ verticalAlign: 'middle' }}
                                                                                onDragOver={isEditMode ? (e) => handleDragOver(e, dia.id_dia, bNum) : undefined}
                                                                                onDragLeave={isEditMode ? handleDragLeave : undefined}
                                                                                onDrop={isEditMode ? (e) => handleDrop(e, dia, bNum) : undefined}
                                                                            >
                                                                                <div className={`rounded-xl flex items-center justify-center transition-all duration-200 ${isDropHere
                                                                                        ? 'bg-violet-100 border-2 border-dashed border-[var(--color-hx-purple)] scale-105 shadow-md'
                                                                                        : isEditMode
                                                                                            ? 'bg-slate-50/80 border-2 border-dashed border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'
                                                                                            : 'bg-slate-50 border border-dashed border-slate-200'
                                                                                    }`} style={{ height: 'calc(100px - 8px)' }}>
                                                                                    {isDropHere ? (
                                                                                        <svg className="w-5 h-5 text-[var(--color-hx-purple)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m0 0l-4-4m4 4l4-4" /></svg>
                                                                                    ) : (
                                                                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                                                    )}
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
                                ) : (
                                    <div className="w-full mt-8 p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-700 mb-2">No hay horario disponible</h3>
                                        <p className="text-slate-500 font-medium max-w-sm">
                                            No se encontraron secciones para los filtros seleccionados o aún no se han asignado horarios.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
            {/* Modal de Conflictos */}
            {moveConflicts && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="text-lg font-black text-red-800">No se puede mover</h3>
                        </div>
                        <div className="p-6 space-y-3">
                            {moveConflicts.conflicts.map((c, i) => (
                                <div key={i} className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                                    <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    <p className="text-red-700 text-[13px] font-semibold">{c}</p>
                                </div>
                            ))}
                            {moveConflicts.warnings.map((w, i) => (
                                <div key={`w-${i}`} className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" /></svg>
                                    <p className="text-amber-700 text-[13px] font-semibold">{w}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setMoveConflicts(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[13px] rounded-xl transition-colors cursor-pointer">
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Swap */}
            {swapConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                            </div>
                            <h3 className="text-lg font-black text-amber-800">Intercambiar materias</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 text-[14px] font-medium mb-4">
                                El destino ya tiene una materia asignada. ¿Deseas intercambiarlas?
                            </p>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                                <p className="text-[13px] font-bold text-slate-700">
                                    <span className="text-amber-600">↔</span> {swapConfirm.swapInfo.swap_curso_nombre} con {swapConfirm.swapInfo.swap_profesor_nombre}
                                </p>
                                <p className="text-[12px] text-slate-500">en {swapConfirm.swapInfo.swap_dia_nombre} - {swapConfirm.swapInfo.swap_turno_nombre}</p>
                            </div>
                            {swapConfirm.warnings.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {swapConfirm.warnings.map((w, i) => (
                                        <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                            <p className="text-amber-700 text-[12px] font-semibold">{w}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setSwapConfirm(null)} className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-[13px] transition-colors cursor-pointer">
                                Cancelar
                            </button>
                            <button onClick={confirmSwap} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-[13px] rounded-xl shadow-md transition-all cursor-pointer">
                                Intercambiar
                            </button>
                        </div>
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

            <ConfiguracionTiemposModal
                isOpen={isTimeModalOpen}
                onClose={() => setIsTimeModalOpen(false)}
                maxBloques={maxBloquesDia}
                onSave={() => {
                    fetch('http://localhost:8000/api/bloques')
                        .then(r => r.json())
                        .then(b => setBloques(b.sort((x, y) => x.numero_bloque - y.numero_bloque)))
                        .catch(e => console.error(e));
                }}
            />
        </div>
    );
}

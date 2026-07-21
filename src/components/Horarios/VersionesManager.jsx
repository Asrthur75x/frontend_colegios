import React, { useState, useEffect } from 'react';
import ModuleSidebar from '../Shared/ModuleSidebar';

const API = 'http://localhost:8000/api';
const normalizeDay = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function VersionesManager() {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAction, setLoadingAction] = useState(null); // id of snapshot being acted on
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmLoad, setConfirmLoad] = useState(null);
    const [toast, setToast] = useState(null);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('ALL');
    const [filterDate, setFilterDate] = useState('');

    // Comparación states
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'compare'
    const [catalogos, setCatalogos] = useState({ cursos: {}, secciones: {}, profesores: {} });
    const [dias, setDias] = useState([]);
    const [bloques, setBloques] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [seccionTurnos, setSeccionTurnos] = useState([]);
    const [bloquesReservados, setBloquesReservados] = useState([]);
    const [grados, setGrados] = useState([]);
    const [gradoDiaConfig, setGradoDiaConfig] = useState([]);
    const [sedes, setSedes] = useState([]);
    
    const [compareBase, setCompareBase] = useState(null);
    const [compareTargetId, setCompareTargetId] = useState('');
    const [compareGradoId, setCompareGradoId] = useState('');
    const [compareSeccionId, setCompareSeccionId] = useState('');
    
    const [gridA, setGridA] = useState({});
    const [gridB, setGridB] = useState({});
    const [reservedGridA, setReservedGridA] = useState({});
    const [reservedGridB, setReservedGridB] = useState({});
    const [compareResult, setCompareResult] = useState(null);
    const [loadingCompare, setLoadingCompare] = useState(false);

    const fetchCatalogos = async () => {
        try {
            const [rCursos, rSec, rProf, rDias, rBloq, rTurnos, rST, rGrados, rConfig, rReservas, rSedes] = await Promise.all([
                fetch(`${API}/cursos`), fetch(`${API}/secciones`), fetch(`${API}/profesores`), 
                fetch(`${API}/dias`), fetch(`${API}/bloques`), fetch(`${API}/turnos`), fetch(`${API}/seccion-turno`),
                fetch(`${API}/grados`), fetch(`${API}/grado-dia-config`), fetch(`${API}/bloque-reservado`), fetch(`${API}/sedes`)
            ]);
            if (!rCursos.ok || !rSec.ok || !rProf.ok || !rDias.ok) return;
            const [dCursos, dSec, dProf, dDias, dBloq, dTurnos, dST, dGrados, dConfig, dReservas, dSedes] = await Promise.all([
                rCursos.json(), rSec.json(), rProf.json(), rDias.json(), rBloq.json(), rTurnos.json(), rST.json(),
                rGrados.json(), rConfig.json(), rReservas.json(), rSedes.json()
            ]);
            
            const cMap = { 'TUT1': 'Tutoría', 'CUR_TUT1': 'Tutoría' };
            dCursos.forEach(c => {
                const courseName = c.nombre_curso || c.nombre;
                cMap[`CUR_${c.id_curso}`] = courseName;
                cMap[c.id_curso] = courseName;
                if (c.codigo) cMap[c.codigo] = courseName;
                if (c.codigo_curso) cMap[c.codigo_curso] = courseName;
            });
            const sMap = {}; 
            dSec.forEach(s => {
                const sectionInfo = { nombre: s.nombre, id_grado: s.id_grado, id_sede: s.id_sede };
                sMap[`SEC_${s.id_seccion}`] = sectionInfo;
                sMap[s.id_seccion] = sectionInfo;
            });
            const pMap = {}; 
            dProf.forEach(p => { pMap[`PROF_${p.id_profesor}`] = p.nombre_profesor; pMap[p.id_profesor] = p.nombre_profesor; });
            
            setCatalogos({ cursos: cMap, secciones: sMap, profesores: pMap });
            
            const diasOrdenados = (dDias || []).sort((a, b) => {
                const orden = { "Lunes": 1, "Martes": 2, "Miércoles": 3, "Jueves": 4, "Viernes": 5, "Sábado": 6, "Domingo": 7 };
                return (orden[a.nombre_dia] || 99) - (orden[b.nombre_dia] || 99);
            });
            setDias(diasOrdenados);
            setBloques(dBloq || []);
            setTurnos(dTurnos || []);
            setSeccionTurnos(dST || []);
            setBloquesReservados(dReservas || []);
            setSedes(dSedes || []);
            setGrados(dGrados || []);
            setGradoDiaConfig(dConfig || []);
        } catch (e) { console.error('Error fetching catalogs for comparison', e); }
    };

    const fetchSnapshots = async () => {
        try {
            const res = await fetch(`${API}/horario-snapshots`);
            if (res.ok) {
                const data = await res.json();
                setSnapshots(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => { 
        fetchSnapshots(); 
        fetchCatalogos();
    }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const handleLoad = async (id) => {
        setLoadingAction(id);
        try {
            const res = await fetch(`${API}/horario-snapshots/${id}/load`, { method: 'POST' });
            if (res.ok) {
                showToast('Versión restaurada correctamente');
                await fetchSnapshots();
            } else {
                showToast('Error al restaurar la versión', 'error');
            }
        } catch (e) { showToast('Error de conexión', 'error'); }
        setLoadingAction(null);
        setConfirmLoad(null);
    };

    const handleDelete = async (id) => {
        setLoadingAction(id);
        try {
            const res = await fetch(`${API}/horario-snapshots/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Versión eliminada');
                await fetchSnapshots();
            } else {
                const d = await res.json().catch(() => ({}));
                showToast(d.detail || 'No se pudo eliminar', 'error');
            }
        } catch (e) { showToast('Error de conexión', 'error'); }
        setLoadingAction(null);
        setConfirmDelete(null);
    };

    const handleUpdate = async (id) => {
        setLoadingAction(id);
        try {
            const res = await fetch(`${API}/horario-snapshots/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: editName, descripcion: editDesc || null })
            });
            if (res.ok) {
                showToast('Nombre actualizado');
                await fetchSnapshots();
            } else {
                showToast('Error al actualizar', 'error');
            }
        } catch (e) { showToast('Error de conexión', 'error'); }
        setLoadingAction(null);
        setEditingId(null);
    };

    const handleCompareClick = (snap) => {
        setCompareBase(snap);
        const activeSnap = snapshots.find(s => s.is_active);
        const suggestedTarget = activeSnap?.id_snapshot !== snap.id_snapshot
            ? activeSnap
            : snapshots.find(s => s.id_snapshot !== snap.id_snapshot);
        setCompareTargetId(suggestedTarget?.id_snapshot || '');
        setCompareResult(null);
        setCompareGradoId('');
        setCompareSeccionId('');
        setViewMode('compare');
    };

    const runComparison = async () => {
        if (!compareBase || !compareTargetId || !compareSeccionId) return;
        setLoadingCompare(true);
        try {
            const resBase = await fetch(`${API}/horario-snapshots/${compareBase.id_snapshot}`);
            const resTarget = await fetch(`${API}/horario-snapshots/${compareTargetId}`);
            
            if (!resBase.ok || !resTarget.ok) throw new Error('Failed to fetch snapshot details');
            
            const dataBase = await resBase.json();
            const dataTarget = await resTarget.json();

            const asigBase = dataBase.json_data?.asignaciones?.filter(a => String(a.seccion_id).replace('SEC_', '') === String(compareSeccionId)) || [];
            const asigTarget = dataTarget.json_data?.asignaciones?.filter(a => String(a.seccion_id).replace('SEC_', '') === String(compareSeccionId)) || [];

            const maxBlockByDay = {};
            const processAsig = (list) => {
                const grid = {};
                list.forEach(a => {
                    // El motor guarda slot_inicio con índice base 0; la tabla muestra bloques desde 1.
                    const start = a.slot_inicio !== undefined && a.slot_inicio !== null
                        ? Number(a.slot_inicio) + 1
                        : Number(a.slot || 1);
                    const duration = Number(a.horas || 1);
                    const curId = String(a.curso_id).replace('CUR_', '');
                    const profId = String(a.profesor_id).replace('PROF_', '');
                    const dayName = dias.find(d => normalizeDay(d.nombre_dia) === normalizeDay(String(a.dia)))?.nombre_dia || a.dia;
                    for (let i = 0; i < duration; i++) {
                        const b = start + i;
                        maxBlockByDay[dayName] = Math.max(maxBlockByDay[dayName] || 0, b);
                        grid[`${dayName}_${b}`] = { curId, profId, raw: a };
                    }
                });
                return grid;
            };

            const gA = processAsig(asigBase);
            const gB = processAsig(asigTarget);

            // Usar todos los turnos de la sección, igual que en la vista Horario.
            const relacionesTurnoSeccion = seccionTurnos.filter(
                st => String(st.id_seccion) === String(compareSeccionId)
            );
            const idsTurnoSeccion = new Set(
                relacionesTurnoSeccion.map(st => String(st.id_turno))
            );
            const bloquesTurno = bloques.filter(b => idsTurnoSeccion.has(String(b.id_turno)));
            
            // Calcular días y bloques máximos según grado-dia-config
            const secInfo = catalogos.secciones[`SEC_${compareSeccionId}`];
            const idGrado = compareGradoId || secInfo?.id_grado || null;
            const diasActivosGrado = idGrado
                ? gradoDiaConfig.filter(c => String(c.id_grado) === String(idGrado) && Number(c.bloques_dia) > 0)
                : [];
            const idsDiasActivos = diasActivosGrado.map(c => String(c.id_dia));

            const reservasAplicables = bloquesReservados.filter(reserva => {
                const appliesToGrade = Array.isArray(reserva.grados)
                    && reserva.grados.some(id => String(id) === String(idGrado));
                const appliesToTurno = idsTurnoSeccion.has(String(reserva.id_turno));
                const appliesToSede = !secInfo?.id_sede || String(reserva.id_sede) === String(secInfo.id_sede);
                return appliesToGrade && appliesToTurno && appliesToSede;
            });
            // No inventar días a partir de las reservas: la tabla debe tener
            // exactamente los mismos días configurados que el horario original.
            const diasFiltrados = dias.filter(d => idsDiasActivos.includes(String(d.id_dia)));
            if (diasFiltrados.length === 0) {
                showToast('El grado seleccionado no tiene días configurados', 'error');
                setCompareResult(null);
                setLoadingCompare(false);
                return;
            }
            const activeDays = diasFiltrados;
            const buildReservedCells = (assignments) => {
                const cells = {};
                const maxByDay = {};
                reservasAplicables.forEach(reserva => {
                    const day = activeDays.find(d => String(d.id_dia) === String(reserva.id_dia));
                    if (!day) return;
                    (reserva.opciones || []).forEach(option => {
                        const slots = option.slots || [];
                        // Misma regla del Horario: una alternativa reservada solo se
                        // muestra cuando sus bloques no están ocupados en esa versión.
                        const hasCollision = slots.some(slot => assignments.some(assignment => {
                            if (normalizeDay(String(assignment.dia)) !== normalizeDay(day.nombre_dia)) return false;
                            const assignmentStart = assignment.slot_inicio !== undefined && assignment.slot_inicio !== null
                                ? Number(assignment.slot_inicio) + 1
                                : Number(assignment.slot || 1);
                            const assignmentEnd = assignmentStart + Number(assignment.horas || 1) - 1;
                            return Number(slot) >= assignmentStart && Number(slot) <= assignmentEnd;
                        }));
                        if (hasCollision) return;

                        slots.forEach(slot => {
                            const blockNumber = Number(slot);
                            if (!blockNumber) return;
                            cells[`${day.nombre_dia}_${blockNumber}`] = {
                                nombre: reserva.nombre && option.nombre && reserva.nombre !== option.nombre
                                    ? `${reserva.nombre} - ${option.nombre}`
                                    : reserva.nombre || option.nombre || 'Bloque reservado'
                            };
                            maxByDay[day.nombre_dia] = Math.max(
                                maxByDay[day.nombre_dia] || 0,
                                blockNumber
                            );
                        });
                    });
                });
                return { cells, maxByDay };
            };
            const reservedA = buildReservedCells(asigBase);
            const reservedB = buildReservedCells(asigTarget);
            const blockLimitByDay = {};
            activeDays.forEach(d => {
                const config = diasActivosGrado.find(c => String(c.id_dia) === String(d.id_dia));
                blockLimitByDay[d.nombre_dia] = Math.max(
                    Number(config?.bloques_dia) || 0,
                    maxBlockByDay[d.nombre_dia] || 0,
                    reservedA.maxByDay[d.nombre_dia] || 0,
                    reservedB.maxByDay[d.nombre_dia] || 0
                );
            });
            const configuredMax = Math.max(0, ...Object.values(blockLimitByDay));
            const totalClassBlocks = configuredMax;

            const resultBlocks = [];
            if (totalClassBlocks > 0) {
                const formatTime = (t) => t ? t.substring(0, 5) : '';
                
                for (let i = 1; i <= totalClassBlocks; i++) {
                    const bDb = bloquesTurno.find(b => Number(b.numero_bloque) === i && !b.es_recreo);
                    if (bDb) {
                        resultBlocks.push({
                            type: 'clase',
                            numero: i,
                            inicio: formatTime(bDb.hora_inicio),
                            fin: formatTime(bDb.hora_final)
                        });
                    } else {
                        resultBlocks.push({ type: 'clase', numero: i, inicio: '', fin: '' });
                    }
                    const recreos = bloquesTurno.filter(b => b.es_recreo && Number(b.despues_de_bloque) === i && i < totalClassBlocks);
                    recreos.forEach(rec => {
                        resultBlocks.push({
                            type: 'recreo',
                            inicio: formatTime(rec.hora_inicio),
                            fin: formatTime(rec.hora_final),
                            despuesDeBloque: i
                        });
                    });
                }
            } else {
                showToast('La sección seleccionada no tiene bloques configurados', 'error');
                setCompareResult(null);
                setLoadingCompare(false);
                return;
            }

            setGridA(gA);
            setGridB(gB);
            setReservedGridA(reservedA.cells);
            setReservedGridB(reservedB.cells);
            
            setCompareResult({ mappedBlocks: resultBlocks, activeDias: activeDays, blockLimitByDay });
        } catch (e) {
            console.error(e);
            showToast('Error al comparar las versiones', 'error');
        }
        setLoadingCompare(false);
    };

    const renderCell = (grid, diaNombre, bNum, isLeft) => {
        const reservedMap = isLeft ? reservedGridA : reservedGridB;
        const reserved = reservedMap[`${diaNombre}_${bNum}`];
        const dayLimit = compareResult?.blockLimitByDay?.[diaNombre] || 0;
        const hasRecessAfter = blockNumber => compareResult?.mappedBlocks?.some(
            block => block.type === 'recreo' && block.despuesDeBloque === blockNumber
        );

        if (reserved) {
            const previousReserved = reservedMap[`${diaNombre}_${bNum - 1}`];
            if (previousReserved?.nombre === reserved.nombre && !hasRecessAfter(bNum - 1)) return null;

            let span = 1;
            while (
                bNum + span <= dayLimit
                && reservedMap[`${diaNombre}_${bNum + span}`]?.nombre === reserved.nombre
                && !hasRecessAfter(bNum + span - 1)
            ) span++;

            return (
            <td key={`${diaNombre}_${bNum}`} rowSpan={span} className="p-1 align-middle bg-white">
                <div
                    className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-amber-400 bg-amber-50 text-center shadow-sm relative overflow-hidden"
                    style={{ height: `calc(${span} * 72px - 8px)` }}
                >
                    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 25%, transparent 25%, transparent 75%, #f59e0b 75%, #f59e0b)', backgroundSize: '14px 14px' }}></div>
                    <svg className="relative text-amber-500 mb-1" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                    <span className="relative text-[10px] font-black leading-tight text-amber-800">{reserved.nombre}</span>
                    <span className="relative text-[8px] font-bold uppercase tracking-wider text-amber-600 mt-1">Bloque reservado</span>
                </div>
            </td>
            );
        }
        const cell = grid[`${diaNombre}_${bNum}`];
        if (!cell) return (
            <td key={`${diaNombre}_${bNum}`} className="p-1 border border-slate-100 bg-slate-50/30"></td>
        );

        const previousCell = grid[`${diaNombre}_${bNum - 1}`];
        if (previousCell?.raw === cell.raw && !hasRecessAfter(bNum - 1)) return null;
        let cellSpan = 1;
        while (
            bNum + cellSpan <= dayLimit
            && grid[`${diaNombre}_${bNum + cellSpan}`]?.raw === cell.raw
            && !hasRecessAfter(bNum + cellSpan - 1)
        ) cellSpan++;
        
        const otherGrid = isLeft ? gridB : gridA;
        const otherCell = otherGrid[`${diaNombre}_${bNum}`];

        const rawCourseId = String(cell.raw?.curso_id ?? cell.curId);
        const courseName = cell.raw?.curso_nombre
            || cell.raw?.nombre_curso
            || cell.raw?.curso?.nombre_curso
            || cell.raw?.curso?.nombre
            || catalogos.cursos[rawCourseId]
            || catalogos.cursos[cell.curId]
            || catalogos.cursos[`CUR_${cell.curId}`]
            || (rawCourseId.toUpperCase().startsWith('TUT') ? 'Tutoría' : rawCourseId.replace(/^CUR_/, ''));
        const rawProfessorId = String(cell.raw?.profesor_id ?? cell.profId);
        const professorName = cell.raw?.profesor_nombre
            || cell.raw?.nombre_profesor
            || cell.raw?.profesor?.nombre_profesor
            || cell.raw?.profesor?.nombre
            || catalogos.profesores[rawProfessorId]
            || catalogos.profesores[cell.profId]
            || catalogos.profesores[`PROF_${cell.profId}`]
            || rawProfessorId.replace(/^PROF_/, '');

        let status = 'same'; 
        if (otherCell && cell.curId === otherCell.curId && cell.profId === otherCell.profId) {
            status = 'same';
        } else if (!otherCell) {
            const courseInOther = Object.values(otherGrid).some(c => c.curId === cell.curId);
            status = courseInOther ? 'moved' : 'same'; // Ya no resaltamos añadido/eliminado
        } else if (otherCell && cell.curId === otherCell.curId) {
            status = 'prof_changed';
        } else {
            const courseInOther = Object.values(otherGrid).some(c => c.curId === cell.curId);
            status = courseInOther ? 'moved' : 'same';
        }

        const colors = {
            same: 'bg-white border-slate-200 hover:border-slate-300',
            moved: 'bg-orange-50 border-orange-300 text-orange-900',
            prof_changed: 'bg-purple-50 border-purple-300 text-purple-900'
        };

        if (status === 'same') {
            return (
                <td key={`${diaNombre}_${bNum}`} rowSpan={cellSpan} className="p-1 align-middle bg-white">
                    <div className={`flex flex-col justify-center p-2 rounded-xl border ${colors[status]} shadow-sm transition-all`} style={{ height: `calc(${cellSpan} * 72px - 8px)` }}>
                        <span className="text-[10px] font-black leading-tight text-slate-700">{courseName}</span>
                        <span className="text-[9px] font-bold mt-0.5 truncate text-[var(--color-brand-primary)] opacity-90">{professorName}</span>
                    </div>
                </td>
            );
        }

        return (
            <td key={`${diaNombre}_${bNum}`} rowSpan={cellSpan} className="p-1 align-middle bg-white">
                <div className={`flex flex-col justify-center p-2 rounded-xl border ${colors[status]} shadow-sm transition-all relative`} style={{ height: `calc(${cellSpan} * 72px - 8px)` }}>
                    {status === 'prof_changed' && (
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-purple-500 rounded-full border border-white"></div>
                    )}
                    {status === 'moved' && (
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-orange-500 rounded-full border border-white"></div>
                    )}
                    <span className="text-[10px] font-black leading-tight">{courseName}</span>
                    <span className="text-[9px] font-bold mt-0.5 truncate opacity-75">{professorName}</span>
                </div>
            </td>
        );
    };

    const renderGrid = (grid, isLeft, versionTitle) => {
        if (!compareResult) return null;
        const { mappedBlocks, activeDias, blockLimitByDay } = compareResult;
        
        return (
            <div className="flex-1 min-w-0 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 text-center flex items-center justify-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isLeft ? 'bg-slate-400' : 'bg-[var(--color-brand-primary)]'}`}></div>
                    <div>
                        <p className="font-black text-slate-700 text-sm leading-tight">{versionTitle || 'Versión'}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                            Sede {selectedSedeName} · {selectedGradoName} · Sección {selectedSeccion?.nombre || '—'} · Turno {selectedTurnoLabel}
                        </p>
                    </div>
                </div>
                <div className="w-full overflow-hidden p-2">
                    <table className="w-full border-collapse table-fixed">
                        <thead>
                            <tr>
                                <th className="w-[58px] pb-2 text-[8px] font-black text-slate-400 uppercase tracking-wider bg-white">Blq.</th>
                                {activeDias.map(d => (
                                    <th key={d.id_dia} className="pb-2 px-0.5 bg-white">
                                        <div className="rounded-lg py-2 px-1 text-center bg-[var(--color-brand-primary)]">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-white/70">{d.nombre_dia.slice(0, 3)}</p>
                                            <p className="hidden 2xl:block text-[10px] font-black text-white truncate">{d.nombre_dia}</p>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {mappedBlocks.map((b, i) => {
                                if (b.type === 'recreo') {
                                    return (
                                        <tr key={`rec-${i}`} className="bg-slate-50" style={{ height: '52px' }}>
                                            <td className="text-center align-middle py-1 pr-2">
                                                <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-200 rounded-xl py-1.5">
                                                    <span className="text-[10px] font-black text-amber-700 leading-none">{b.inicio}</span>
                                                    <span className="text-[9px] font-bold text-amber-500 leading-none mt-1">{b.fin}</span>
                                                </div>
                                            </td>
                                            <td colSpan={activeDias.length} className="px-1 py-1">
                                                <div className="h-full min-h-[42px] flex items-center justify-center gap-3 rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50/40 via-amber-100/60 to-amber-50/40">
                                                    <span className="h-px bg-amber-300/60 flex-1 ml-5"></span>
                                                    <span className="text-[10px] font-black text-amber-600 tracking-[0.35em]">RECREO</span>
                                                    <span className="h-px bg-amber-300/60 flex-1 mr-5"></span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={`clase-${b.numero}`} style={{ height: '72px' }}>
                                        <td className="text-center align-middle py-1 pr-2 bg-white">
                                            {b.inicio ? (
                                                <div className="flex flex-col items-center justify-center bg-white border border-slate-200 shadow-sm rounded-xl py-2 px-1">
                                                    <span className="text-[11px] font-black text-slate-700 leading-none">{b.inicio}</span>
                                                    <div className="w-4 h-px bg-slate-200 my-1"></div>
                                                    <span className="text-[9px] font-bold text-slate-400 leading-none">{b.fin}</span>
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
                                                    <span className="text-[10px] font-black text-slate-600">{b.numero}</span>
                                                </div>
                                            )}
                                        </td>
                                        {activeDias.map(d => (
                                            b.numero <= (blockLimitByDay[d.nombre_dia] || 0)
                                                ? renderCell(grid, d.nombre_dia, b.numero, isLeft)
                                                : <td key={`${d.nombre_dia}_${b.numero}`} className="border border-slate-100 bg-slate-100/70">
                                                    <div className="min-h-[64px] rounded-xl bg-slate-100/60" title="Este día no tiene este bloque" />
                                                </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} — ${hours}:${mins}`;
    };

    const formatDuration = (secs) => {
        if (!secs) return '—';
        const m = Math.floor(secs / 60);
        const s = Math.round(secs % 60);
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    const timeAgo = (dateStr) => {
        const now = new Date();
        const d = new Date(dateStr);
        const diff = Math.floor((now - d) / 1000);
        if (diff < 60) return 'Hace un momento';
        if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
        const days = Math.floor(diff / 86400);
        if (days === 1) return 'Ayer';
        return `Hace ${days} días`;
    };

    const selectedGrado = grados.find(g => String(g.id_grado) === String(compareGradoId));
    const selectedSeccion = catalogos.secciones[`SEC_${compareSeccionId}`];
    const selectedSede = sedes.find(sede => String(sede.id_sede) === String(selectedSeccion?.id_sede));
    const selectedSedeName = selectedSede?.nombre_sede || selectedSede?.nombre || 'Sin sede';
    const selectedGradoName = selectedGrado
        ? selectedGrado.nombre_grado || selectedGrado.nombre || `Grado ${selectedGrado.numero || selectedGrado.id_grado}`
        : '';
    const selectedTurnoNames = [...new Set(
        seccionTurnos
            .filter(relation => String(relation.id_seccion) === String(compareSeccionId))
            .map(relation => turnos.find(turno => String(turno.id_turno) === String(relation.id_turno))?.nombre)
            .filter(Boolean)
    )];
    const selectedTurnoLabel = selectedTurnoNames.length > 0 ? selectedTurnoNames.join(' / ') : 'Sin turno';
    const seccionesComparables = Object.entries(catalogos.secciones)
        .filter(([key, section]) => key.startsWith('SEC_') && String(section.id_grado) === String(compareGradoId))
        .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre));

    const filteredSnapshots = React.useMemo(() => {
        return snapshots.filter(snap => {
            if (searchTerm && !snap.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && !(snap.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (filterEstado !== 'ALL' && snap.estado !== filterEstado) return false;
            if (filterDate) {
                const snapDate = new Date(snap.created_at).toISOString().split('T')[0];
                if (snapDate !== filterDate) return false;
            }
            return true;
        });
    }, [snapshots, searchTerm, filterEstado, filterDate]);

    const groupedFamilies = React.useMemo(() => {
        if (!filteredSnapshots || filteredSnapshots.length === 0) return [];
        const sortedAsc = [...filteredSnapshots].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const families = [];
        let currentFamily = null;
        
        sortedAsc.forEach(snap => {
            if (!snap.es_editada) {
                currentFamily = { parent: snap, children: [] };
                families.push(currentFamily);
            } else {
                if (currentFamily) {
                    currentFamily.children.unshift(snap);
                } else {
                    currentFamily = { parent: snap, children: [], isDummy: true };
                    families.push(currentFamily);
                }
            }
        });
        
        families.sort((a, b) => {
            const dateA = new Date(a.parent.created_at);
            const dateB = new Date(b.parent.created_at);
            return dateB - dateA;
        });
        
        const activeIdx = families.findIndex(f => (f.parent && f.parent.is_active) || f.children.some(c => c.is_active));
        if (activeIdx > 0) {
            const activeFamily = families.splice(activeIdx, 1)[0];
            families.unshift(activeFamily);
        }
        
        return families;
    }, [filteredSnapshots]);

    return (
        <div className="w-full animate-fade-in relative">
            {/* Toast */}
            {toast && (
                <div
                    className="fixed top-24 right-8 z-[200] px-5 py-3 rounded-2xl shadow-lg border text-[14px] font-bold flex items-center gap-2.5 animate-in"
                    style={{
                        backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
                        borderColor: toast.type === 'error' ? '#fca5a5' : '#86efac',
                        color: toast.type === 'error' ? '#dc2626' : '#16a34a',
                        animation: 'slideInRight 0.3s ease-out'
                    }}
                >
                    {toast.type === 'error' ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                    )}
                    {toast.msg}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-144px)]">
                {/* ===== LEFT SIDEBAR (1/4) ===== */}
                {viewMode === 'list' && (
                    <ModuleSidebar
                        title="Historial"
                        description="Respaldos y versiones del sistema de horarios."
                        hideAddButton={true}
                        svgImage="/profe.svg"
                        stats={[
                            { label: 'Total Versiones', value: snapshots.length.toString(), subtext: 'Guardadas' },
                            { label: 'Última Versión', value: snapshots.length > 0 ? timeAgo(snapshots[0].created_at) : '—' }
                        ]}
                    />
                )}

                {/* ===== RIGHT CONTENT (3/4) ===== */}
                <main className={`${viewMode === 'compare' ? 'w-full' : 'md:w-3/4'} flex flex-col ${viewMode === 'compare' ? 'gap-0 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)]' : 'gap-5'}`}>
                    
                    {viewMode === 'list' ? (
                        <>
                            <div className="px-2 flex items-center justify-between">
                                <div>
                                    <h2 className="text-slate-800 text-[20px] font-black">Versiones y Respaldos</h2>
                                    <p className="text-slate-500 text-[14px] mt-0.5 font-medium">Historial de horarios generados.</p>
                                </div>
                            </div>
                            
                            {/* Filtros */}
                            <div className="px-2 flex flex-col sm:flex-row gap-3 mb-2">
                                <div className="flex-1 relative">
                                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nombre o descripción..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:bg-white focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/10 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 outline-none focus:bg-white focus:border-[var(--color-brand-primary)] cursor-pointer transition-all"
                                    />
                                    <select 
                                        value={filterEstado}
                                        onChange={(e) => setFilterEstado(e.target.value)}
                                        className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 outline-none focus:bg-white focus:border-[var(--color-brand-primary)] cursor-pointer transition-all"
                                    >
                                        <option value="ALL">Todos los estados</option>
                                        <option value="OPTIMAL">Óptimos</option>
                                        <option value="FEASIBLE">Factibles</option>
                                    </select>
                                </div>
                            </div>

                            {/* Content List */}
                            {loading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-4 border-slate-200 border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
                                        <p className="text-slate-400 text-sm font-medium">Cargando versiones...</p>
                                    </div>
                                </div>
                            ) : filteredSnapshots.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                                            <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
                                            </svg>
                                        </div>
                                        <h3 className="text-slate-700 font-bold text-lg">No hay versiones aún</h3>
                                        <p className="text-slate-400 text-sm">Cuando generes un horario, cada resultado se guardará automáticamente como una versión.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6">
                    {groupedFamilies.map((family, fIndex) => {
                        const itemsToRender = [];
                        if (family.parent && !family.isDummy) itemsToRender.push({ ...family.parent, isParent: true });
                        else if (family.isDummy) itemsToRender.push({ ...family.parent, isParent: true });
                        
                        itemsToRender.push(...family.children.map(c => ({ ...c, isChild: true })));

                        return (
                            <div key={`family-${fIndex}`} className="flex flex-col gap-3 relative">
                                {family.children.length > 0 && !family.isDummy && (
                                    <div className="absolute top-10 left-[27px] bottom-10 w-[2px] bg-slate-200/60 rounded-full z-0"></div>
                                )}
                                {itemsToRender.map((snap, sIndex) => {
                        const isActive = snap.is_active;
                        const isEditing = editingId === snap.id_snapshot;

                        return (
                            <div
                                key={snap.id_snapshot}
                                className={`group relative z-10 rounded-2xl border transition-all duration-200 ${snap.isChild ? 'ml-12 shadow-sm' : ''} ${isActive
                                    ? 'bg-[var(--color-brand-primary)]/5 border-[var(--color-brand-primary)]/30 shadow-[0_0_20px_rgba(47, 91, 255,0.08)]'
                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)]'
                                    }`}
                            >
                                <div className="p-5 flex items-start gap-5">
                                    {/* Timeline indicator */}
                                    <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                                        <div className={`w-4 h-4 rounded-full border-[3px] flex-shrink-0 ${isActive
                                            ? 'border-[var(--color-brand-primary)] bg-white shadow-[0_0_8px_rgba(47, 91, 255,0.4)]'
                                            : 'border-slate-300 bg-white'
                                            }`}></div>
                                        {/* No line here, line is on the family container now */}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            {isActive && (
                                                <span className="bg-[var(--color-brand-primary)] text-white text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                                                    Activa
                                                </span>
                                            )}
                                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${snap.estado === 'OPTIMAL'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : snap.estado === 'FEASIBLE'
                                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                {snap.estado === 'OPTIMAL' ? 'Óptima' : snap.estado === 'FEASIBLE' ? 'Factible' : snap.estado}
                                            </span>
                                            {snap.es_editada && (
                                                <span className="bg-orange-50 text-orange-500 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-orange-100">
                                                    Editada
                                                </span>
                                            )}
                                        </div>

                                        {isEditing ? (
                                            <div className="flex flex-col gap-2 mt-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 transition-all"
                                                    placeholder="Nombre de la versión"
                                                />
                                                <input
                                                    type="text"
                                                    value={editDesc}
                                                    onChange={(e) => setEditDesc(e.target.value)}
                                                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none focus:border-[var(--color-brand-primary)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 transition-all"
                                                    placeholder="Descripción (opcional)"
                                                />
                                                <div className="flex gap-2 mt-1">
                                                    <button
                                                        onClick={() => handleUpdate(snap.id_snapshot)}
                                                        className="px-4 py-2 bg-[var(--color-brand-primary)] text-white text-[12px] font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer"
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="px-4 py-2 bg-slate-100 text-slate-600 text-[12px] font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="text-slate-800 font-black text-[16px] tracking-tight truncate">
                                                    {snap.nombre}
                                                </h3>
                                                {snap.descripcion && (
                                                    <p className="text-slate-400 text-[13px] mt-0.5 truncate">{snap.descripcion}</p>
                                                )}
                                            </>
                                        )}

                                        {/* Stats row */}
                                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-semibold">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                                                {formatDate(snap.created_at)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-semibold">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                                {formatDuration(snap.tiempo_segundos)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[12px] font-semibold">
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                                                {snap.asignaciones_count} asignaciones
                                            </div>

                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0 pt-1">
                                        {/* Edit name */}
                                        {!isEditing && (
                                            <button
                                                onClick={() => { setEditingId(snap.id_snapshot); setEditName(snap.nombre); setEditDesc(snap.descripcion || ''); }}
                                                className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer border border-slate-200"
                                                title="Renombrar"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                Editar
                                            </button>
                                        )}

                                        {/* Compare */}
                                        <button
                                            onClick={() => handleCompareClick(snap)}
                                            className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer border border-slate-200"
                                            title="Comparar con otra versión"
                                        >
                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
                                            Comparar
                                        </button>

                                        {/* Load / Restore */}
                                        {!isActive && (
                                            <button
                                                onClick={() => setConfirmLoad(snap.id_snapshot)}
                                                className="h-9 px-3.5 rounded-xl flex items-center gap-1.5 text-[12px] font-bold bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/20 border border-[var(--color-brand-primary)]/15 transition-all cursor-pointer"
                                                title="Restaurar como activa"
                                            >
                                                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                                                Restaurar
                                            </button>
                                        )}

                                        {/* Delete */}
                                        {!isActive && (
                                            <button
                                                onClick={() => setConfirmDelete(snap.id_snapshot)}
                                                className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[12px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all cursor-pointer border border-rose-100"
                                                title="Eliminar"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    ) : (
            <div className="flex flex-col min-h-[calc(100vh-110px)] gap-5 pb-4">
            {/* Header Compare */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Comparar horarios</h2>
                        <p className="text-[13px] font-medium text-slate-500 mt-0.5">Revisa los cambios entre dos versiones.</p>
                    </div>
                </div>
                <button
                    onClick={() => setViewMode('list')}
                    className="cursor-pointer text-[var(--color-brand-primary)] hover:text-[var(--color-brand-dark)] transition-colors flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    Volver
                </button>
            </div>

            {/* Barra compacta de comparación */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_.65fr_.55fr_auto] gap-2.5 items-end">
                <div className="min-w-0">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 ml-1">Origen</label>
                    <div className="h-10 flex items-center rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 truncate" title={compareBase?.nombre}>
                        {compareBase?.nombre}
                    </div>
                </div>

                <div className="min-w-0">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 ml-1">Comparar con</label>
                    <select
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 outline-none cursor-pointer focus:border-[var(--color-brand-primary)]"
                        value={compareTargetId}
                        onChange={e => { setCompareTargetId(e.target.value); setCompareResult(null); }}
                    >
                        <option value="" disabled>Selecciona una versión</option>
                        {snapshots.filter(s => s.id_snapshot !== compareBase?.id_snapshot).map(s => (
                            <option key={s.id_snapshot} value={s.id_snapshot}>{s.nombre}{s.is_active ? ' · Activa' : ''}</option>
                        ))}
                    </select>
                </div>

                <div className="min-w-0">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 ml-1">Grado</label>
                    <select
                        value={compareGradoId}
                        onChange={e => {
                            setCompareGradoId(e.target.value);
                            setCompareSeccionId('');
                            setCompareResult(null);
                        }}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 outline-none cursor-pointer focus:border-[var(--color-brand-primary)]"
                    >
                        <option value="">Selecciona</option>
                        {grados.map(grado => (
                            <option key={grado.id_grado} value={grado.id_grado}>
                                {grado.nombre_grado || grado.nombre || `Grado ${grado.numero || grado.id_grado}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="min-w-0">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1 ml-1">Sección</label>
                    <select
                        value={compareSeccionId}
                        disabled={!compareGradoId}
                        onChange={e => { setCompareSeccionId(e.target.value); setCompareResult(null); }}
                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus:border-[var(--color-brand-primary)]"
                    >
                        <option value="">Selecciona</option>
                        {seccionesComparables.map(([key, section]) => (
                            <option key={key} value={key.replace('SEC_', '')}>{section.nombre}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={runComparison}
                    disabled={!compareTargetId || !compareSeccionId || loadingCompare}
                    className="h-10 px-5 bg-[var(--color-brand-primary)] text-white text-[11px] font-bold rounded-xl hover:bg-[var(--color-brand-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 sm:col-span-2 xl:col-span-1"
                >
                    {loadingCompare ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    )}
                    COMPARAR
                </button>
            </div>

            {/* Legend */}
            {compareResult && (
                <div className="flex flex-wrap items-center justify-center gap-4 py-2 px-4 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-600">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></span> Día/Hora Diferente</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></span> Profesor Cambiado</div>
                </div>
            )}

            {/* Grids Side by Side */}
            {compareResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-4 min-w-0 pb-6">
                    {renderGrid(gridA, true, compareBase?.nombre)}
                    {renderGrid(gridB, false, snapshots.find(s=>String(s.id_snapshot)===String(compareTargetId))?.nombre)}
                </div>
            )}

            {!compareResult && !loadingCompare && (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                            <svg width="32" height="32" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
                        </div>
                        <h3 className="text-slate-600 font-bold text-lg">Selecciona una sección</h3>
                        <p className="text-slate-400 text-sm mt-1">Elige la versión a comparar y la sección para generar el plano visual.</p>
                    </div>
                </div>
            )}
        </div>
    )}

            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
                </main>
            </div>

            {/* Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-500">
                                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">¿Eliminar versión?</h3>
                            <p className="text-sm text-slate-500 mb-6">Esta acción no se puede deshacer. Todos los datos de este horario se perderán permanentemente.</p>
                            
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setConfirmDelete(null)} disabled={loadingAction === confirmDelete} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer">Cancelar</button>
                                <button onClick={() => handleDelete(confirmDelete)} disabled={loadingAction === confirmDelete} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer">
                                    {loadingAction === confirmDelete ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Modal */}
            {confirmLoad && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-[var(--color-brand-primary)]/10 rounded-full flex items-center justify-center mb-4 text-[var(--color-brand-primary)]">
                                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">¿Restaurar versión?</h3>
                            <p className="text-sm text-slate-500 mb-6">Esta versión se convertirá en el horario activo actual, reemplazando al que está ahora mismo.</p>
                            
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setConfirmLoad(null)} disabled={loadingAction === confirmLoad} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer">Cancelar</button>
                                <button onClick={() => handleLoad(confirmLoad)} disabled={loadingAction === confirmLoad} className="flex-1 py-3 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer">
                                    {loadingAction === confirmLoad ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Restaurar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

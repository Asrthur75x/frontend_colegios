import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

const ProfesorCard = ({ prof, sedesStr, cantGrados, cantDispo, onEdit, onDelete, isSelected, onToggleSelect, isSelectionMode, faltanDatos }) => {
    return (
        <div
            className={`relative bg-white rounded-[20px] border p-6 flex flex-col gap-5 hover:shadow-md transition-all group cursor-pointer
                ${isSelected ? 'border-brand-primary shadow-sm ring-1 ring-brand-primary/20 bg-brand-primary/10' : 'border-slate-100 shadow-sm'}
                ${faltanDatos ? 'border-amber-200 bg-amber-50/30' : ''}
            `}
            onClick={() => isSelectionMode && onToggleSelect(prof.id_profesor)}
        >
            {/* Etiqueta Faltan Datos */}
            {faltanDatos && !isSelectionMode && (
                <div className="absolute top-0 right-0 mt-3 mr-3 px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm z-10">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Faltan Datos
                </div>
            )}

            {/* Checkbox (solo visible en modo selección) */}
            {isSelectionMode && (
                <div className="absolute top-4 right-4 z-10">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border-2 ${isSelected ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white border-slate-300 hover:border-brand-primary'}`}>
                        {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                </div>
            )}

            {/* Cabecera de la Tarjeta */}
            <div className={`flex items-center gap-4 ${isSelectionMode ? 'pr-8' : ''}`}>
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 border-2 border-white ring-2 transition-colors ${isSelected ? 'bg-brand-primary text-white ring-brand-primary/30' : 'bg-brand-primary/10 text-brand-primary ring-brand-primary/20'}`}>
                    <span className="font-black text-2xl uppercase tracking-wider">{prof.nombre_profesor.charAt(0)}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-800 text-[15px] leading-tight truncate" title={prof.nombre_profesor}>
                        {prof.nombre_profesor}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1 truncate" title={sedesStr}>
                        {sedesStr !== 'Ninguna' ? sedesStr : 'Sin Sede Asignada'}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-slate-400" title="Bloques de Disponibilidad Físicos">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            <span className="text-[10px] font-bold truncate">
                                {cantDispo === 'Total' ? 'Dispo. Total' : `${cantDispo} Blq.`}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400" title="Horas Mínimas">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span className="text-[10px] font-bold">{prof.horas_minimas || 0} H. Mín.</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400" title="Grados Permitidos">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                            <span className="text-[10px] font-bold">{cantGrados} Grados</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botones de Acción (ocultos en modo selección) */}
            {!isSelectionMode && (
                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(prof); }}
                        className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Editar
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(prof.id_profesor); }}
                        className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-all flex justify-center items-center gap-1.5 cursor-pointer"
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        Eliminar
                    </button>
                </div>
            )}
        </div>
    );
};

function parseApiError(res, fallback) {
    return res.json().then((body) => {
        const d = body?.detail;
        if (typeof d === 'string') return d;
        if (Array.isArray(d) && d[0]?.msg) return d.map((e) => e.msg).join(', ');
        return fallback;
    }).catch(() => fallback);
}

export default function ProfesoresManager() {
    const [profesores, setProfesores] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [profesorSedes, setProfesorSedes] = useState([]);
    const [grados, setGrados] = useState([]);
    const [gradoProfesores, setGradoProfesores] = useState([]);
    const [disponibilidades, setDisponibilidades] = useState([]);
    const [preferencias, setPreferencias] = useState([]);
    const [dias, setDias] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [bloques, setBloques] = useState([]);
    const [gradoDiaConfigs, setGradoDiaConfigs] = useState([]);
    const [maxBloquesDia, setMaxBloquesDia] = useState(10);
    const [secciones, setSecciones] = useState([]);
    const [seccionTurnos, setSeccionTurnos] = useState([]);
    const [profesorCursos, setProfesorCursos] = useState([]);
    const [planes, setPlanes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isNewRegistration, setIsNewRegistration] = useState(false);
    const [editId, setEditId] = useState(null);
    const [activeTab, setActiveTab] = useState('perfil');
    const [guardando, setGuardando] = useState(false);

    // Form State
    const [formNombre, setFormNombre] = useState('');
    const [formHorasMinimas, setFormHorasMinimas] = useState(0);
    const [nombreError, setNombreError] = useState('');
    const [horasMinError, setHorasMinError] = useState('');
    const [sedesError, setSedesError] = useState('');
    const [gradosError, setGradosError] = useState('');
    const [dispoError, setDispoError] = useState('');
    const [formSedes, setFormSedes] = useState([]); // array of id_sede
    const [formGrados, setFormGrados] = useState([]); // array of id_grado
    const [formDispo, setFormDispo] = useState([]); // array of { id_dia, id_turno, nro_bloque }
    const [formPreferencia, setFormPreferencia] = useState([]); // array of { id_dia, id_turno, nro_bloque }
    const [isDragging, setIsDragging] = useState(false);
    const [dragAction, setDragAction] = useState(null); // 'add' or 'remove'
    const [esDisponibilidadTotal, setEsDisponibilidadTotal] = useState(false);
    const [modoPincel, setModoPincel] = useState('disponible'); // 'disponible' | 'preferido'
    const [activeSede, setActiveSede] = useState(null); // Sede seleccionada en el Tab 3
    const [activeTurnoTab, setActiveTurnoTab] = useState(null); // Turno seleccionado en Disponibilidad

    // List Management State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    // Derived: filtered + paginated lists
    const filteredProfesores = profesores.filter(p =>
        p.nombre_profesor?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const aFaltan = gradoProfesores.filter(x => x.id_profesor === a.id_profesor).length === 0;
        const bFaltan = gradoProfesores.filter(x => x.id_profesor === b.id_profesor).length === 0;
        if (aFaltan && !bFaltan) return -1;
        if (!aFaltan && bFaltan) return 1;
        return 0;
    });
    const totalPages = Math.ceil(filteredProfesores.length / ITEMS_PER_PAGE);
    const currentProfesores = filteredProfesores.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset to page 1 when search changes
    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setCurrentPage(1);
    };

    // Selection helpers
    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // Open delete modal helper
    const openDeleteModal = (idsOrId) => {
        const ids = Array.isArray(idsOrId) ? idsOrId : [idsOrId];
        setItemsToDelete(ids);
        setIsDeleteModalOpen(true);
    };

    // Confirm deletion handler
    const confirmarEliminacion = async () => {
        setIsDeleting(true);
        try {
            for (let id of itemsToDelete) {
                const disps = disponibilidades.filter(x => x.id_profesor === id);
                for (let d of disps) {
                    await fetch(`${API_BASE}/profesor-disponibilidad/${d.id_disponibilidad}`, { method: 'DELETE' });
                }
                const prefs = preferencias.filter(x => x.id_profesor === id);
                for (let p of prefs) {
                    await fetch(`${API_BASE}/profesor-preferencia/${p.id_preferencia}`, { method: 'DELETE' });
                }
                const gp = gradoProfesores.filter(x => x.id_profesor === id);
                for (let g of gp) {
                    await fetch(`${API_BASE}/grado-profesor/${g.id_grado_profesor}`, { method: 'DELETE' });
                }
                const ps = profesorSedes.filter(x => x.id_profesor === id);
                for (let s of ps) {
                    await fetch(`${API_BASE}/profesor-sedes/${s.id_sede_profesor}`, { method: 'DELETE' });
                }
                await fetch(`${API_BASE}/profesores/${id}`, { method: 'DELETE' });
            }
            setSelectedIds(prev => prev.filter(id => !itemsToDelete.includes(id)));
            setIsSelectionMode(false);
            await fetchDatos();
            window.dispatchEvent(new Event('horarix_data_updated'));
            setIsDeleteModalOpen(false);
            setItemsToDelete([]);
        } catch (err) {
            alert(`Error al eliminar: ${err.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchDatos = async (signal) => {
        try {
            setLoading(true);
            const endpoints = [
                'profesores', 'sedes', 'profesor-sedes',
                'profesor-disponibilidad', 'profesor-preferencia', 'dias', 'turnos', 'bloques', 'grado-dia-config',
                'grados', 'grado-profesor', 'secciones', 'seccion-turno',
                'profesor-curso', 'planes'
            ];

            const responses = await Promise.all(
                endpoints.map(ep => fetch(`${API_BASE}/${ep}`, { signal }))
            );

            for (let i = 0; i < responses.length; i++) {
                if (!responses[i].ok && responses[i].status !== 404) {
                    if (endpoints[i] !== 'profesor-preferencia') throw new Error(`Error cargando ${endpoints[i]}`);
                }
            }

            const data = await Promise.all(responses.map(r => r.ok ? r.json() : []));

            setProfesores(data[0] || []);
            setSedes(data[1] || []);
            setProfesorSedes(data[2] || []);
            setDisponibilidades(data[3] || []);
            setPreferencias(data[4] || []);
            setDias(data[5] || []);
            setTurnos(data[6] || []);
            setBloques(data[7] || []);
            setGrados(data[9] || []);
            setGradoProfesores(data[10] || []);
            setSecciones(data[11] || []);
            setSeccionTurnos(data[12] || []);
            setProfesorCursos(data[13] || []);
            setPlanes(data[14] || []);

            // Calcular el máximo de bloques por día desde grado-dia-config
            const gdc = data[8] || [];
            setGradoDiaConfigs(gdc);
            const maxBlq = gdc.reduce((acc, c) => Math.max(acc, c.bloques_dia || 0), 0);
            setMaxBloquesDia(maxBlq > 0 ? maxBlq : 10);

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

    // Sincronizar activeSede con formSedes si se deselecciona o está vacío
    useEffect(() => {
        if (formSedes.length > 0 && (!activeSede || !formSedes.includes(activeSede))) {
            setActiveSede(formSedes[0]);
        } else if (formSedes.length === 0) {
            setActiveSede(null);
        }
    }, [formSedes, activeSede]);

    // Helper para Sedes asignadas a un profesor
    const getSedesProfesor = (id_prof) => {
        let ps = profesorSedes.filter(x => x.id_profesor === id_prof).map(x => x.id_sede);
        if (ps.length === 0) {
            // Fallback a disponibilidades si el endpoint de sedes falló/no existe
            const disps = disponibilidades.filter(x => x.id_profesor === id_prof).map(x => x.id_sede);
            const prefs = preferencias.filter(x => x.id_profesor === id_prof).map(x => x.id_sede);
            ps = [...new Set([...disps, ...prefs])].filter(id => id != null);
        }

        // Si sigue vacío, verificamos si está incompleto o es un profesor antiguo
        if (ps.length === 0) {
            const tieneGrados = gradoProfesores.some(x => x.id_profesor === id_prof);
            return tieneGrados ? 'Libre (Todas)' : 'Sin Sede Asignada';
        }

        return ps.map(sid => {
            const s = sedes.find(sede => sede.id_sede === sid);
            return s ? s.nombre_sede : 'Desconocida';
        }).join(', ');
    };

    const getCantDispo = (id_prof) => {
        const cant = disponibilidades.filter(x => x.id_profesor === id_prof).length;
        if (cant === 0) {
            const prefs = preferencias.filter(x => x.id_profesor === id_prof).length;
            const tieneGrados = gradoProfesores.some(x => x.id_profesor === id_prof);
            if (prefs === 0 && tieneGrados) return 'Total';
        }
        return cant;
    };

    const getCantGrados = (id_prof) => {
        return gradoProfesores.filter(x => x.id_profesor === id_prof).length;
    };

    // ── Abrir Modal ──
    const abrirModalNueva = () => {
        setIsEditing(false);
        setIsNewRegistration(true);
        setEditId(null);
        setFormNombre('');
        setFormHorasMinimas(0);
        setNombreError('');
        setHorasMinError('');
        setHorasMinWarnings([]);
        setFormSedes([]);
        setFormGrados([]);
        setFormDispo([]);
        setFormPreferencia([]);
        setEsDisponibilidadTotal(false);
        setModoPincel('disponible');
        setActiveSede(null);
        setActiveTurnoTab(null);
        setActiveTab('perfil');
        setIsModalOpen(true);
    };

    const abrirModalEdicion = (prof) => {
        setIsEditing(true);
        setIsNewRegistration(false);
        setEditId(prof.id_profesor);
        setFormNombre(prof.nombre_profesor);
        setFormHorasMinimas(prof.horas_minimas || 0);
        setNombreError('');
        setHorasMinError('');
        setHorasMinWarnings([]);

        // Cargar grados actuales primero para saber si está incompleto
        const gradosActuales = gradoProfesores
            .filter(x => x.id_profesor === prof.id_profesor)
            .map(x => x.id_grado);
        setFormGrados(gradosActuales);

        const estaIncompleto = gradosActuales.length === 0;

        // Cargar sedes actuales
        let sedesActuales = profesorSedes
            .filter(x => x.id_profesor === prof.id_profesor)
            .map(x => x.id_sede);

        if (sedesActuales.length === 0) {
            const disps = disponibilidades.filter(x => x.id_profesor === prof.id_profesor).map(x => x.id_sede);
            const prefs = preferencias.filter(x => x.id_profesor === prof.id_profesor).map(x => x.id_sede);
            sedesActuales = [...new Set([...disps, ...prefs])].filter(id => id != null);
        }

        // Si NO está incompleto (es un profesor antiguo) y no tiene sedes, asignarle todas.
        // Si ESTÁ incompleto, lo dejamos vacío para que el usuario las seleccione.
        if (!estaIncompleto && sedesActuales.length === 0) {
            sedesActuales = sedes.map(s => s.id_sede);
        }

        setFormSedes(sedesActuales);

        // Cargar dispo actual
        const dispoActual = disponibilidades
            .filter(x => x.id_profesor === prof.id_profesor)
            .map(x => ({
                id_dia: x.id_dia,
                id_turno: x.id_turno,
                nro_bloque: x.nro_bloque,
                id_sede: x.id_sede
            }));
        setFormDispo(dispoActual);

        // Cargar preferencias actuales
        const prefActual = preferencias
            .filter(x => x.id_profesor === prof.id_profesor)
            .map(x => ({
                id_dia: x.id_dia,
                id_turno: x.id_turno,
                nro_bloque: x.nro_bloque,
                id_sede: x.id_sede
            }));
        setFormPreferencia(prefActual);

        // Si es un profe válido y no tiene bloques, entonces sí tiene disponibilidad total.
        const esDispoTotal = !estaIncompleto && dispoActual.length === 0 && prefActual.length === 0;
        setEsDisponibilidadTotal(prof.es_disponibilidad_total === true || esDispoTotal);
        setModoPincel('disponible');
        setActiveSede(sedesActuales.length > 0 ? sedesActuales[0] : null);
        setActiveTurnoTab(null);
        setActiveTab('perfil');
        setIsModalOpen(true);
    };

    // ── Guardar Perfil (Nombre) ──
    // ── Función de validación de horas mínimas ──
    const validarHorasMinimas = (valor, profId = editId) => {
        const val = parseInt(valor, 10);
        const warnings = [];

        // Errores bloqueantes
        if (isNaN(val) || val === '' || valor === '') {
            return { error: 'Debes ingresar un valor numérico.', warnings };
        }
        if (val < 1) {
            return { error: 'Las horas mínimas deben ser al menos 1.', warnings };
        }
        if (val > 40) {
            return { error: 'El máximo permitido es 40 horas semanales.', warnings };
        }
        if (!Number.isInteger(Number(valor)) || String(valor).includes('.')) {
            return { error: 'Solo se permiten números enteros.', warnings };
        }

        // Validaciones con datos del profesor
        if (profId) {
            // 1. Validación física (Bloqueante): bloques de disponibilidad pintados
            const bloquesDisponibles = disponibilidades.filter(d => d.id_profesor === profId).length;
            if (bloquesDisponibles > 0 && val > bloquesDisponibles) {
                return { error: `Excede la disponibilidad física. Solo tiene ${bloquesDisponibles} bloques pintados pero exiges ${val} horas.`, warnings };
            }

            // 2. Validación curricular (NO Bloqueante / Advertencia): horas máximas que podría dictar
            const cursosDelProf = profesorCursos.filter(pc => pc.id_profesor === profId).map(pc => pc.id_curso);
            const gradosDelProf = gradoProfesores.filter(gp => gp.id_profesor === profId).map(gp => gp.id_grado);

            if (cursosDelProf.length > 0 && gradosDelProf.length > 0) {
                let horasCurriculares = 0;
                const seccionesPorGrado = {};
                secciones.forEach(sec => {
                    seccionesPorGrado[sec.id_grado] = (seccionesPorGrado[sec.id_grado] || 0) + 1;
                });

                for (const idGrado of gradosDelProf) {
                    const numSecciones = seccionesPorGrado[idGrado] || 0;
                    for (const idCurso of cursosDelProf) {
                        const plan = planes.find(p => p.id_grado === idGrado && p.id_curso === idCurso);
                        if (plan) {
                            horasCurriculares += (plan.horas_semanales || 0) * numSecciones;
                        }
                    }
                }

                if (horasCurriculares > 0 && val > horasCurriculares) {
                    warnings.push(`Advertencia: Sus cursos y grados actuales suman un máximo de ${horasCurriculares} horas, pero le exiges ${val}. Recuerda asignarle más cursos en Carga Académica.`);
                }
            }
        }

        return { error: '', warnings };
    };

    const [horasMinWarnings, setHorasMinWarnings] = useState([]);

    const handleHorasMinChange = (e) => {
        const raw = e.target.value;
        setFormHorasMinimas(raw);
        if (raw === '' || raw === '0') {
            setHorasMinError('Las horas mínimas deben ser al menos 1.');
            setHorasMinWarnings([]);
            return;
        }
        const { error, warnings } = validarHorasMinimas(raw);
        setHorasMinError(error);
        setHorasMinWarnings(warnings);
    };

    const handleGuardarHorasMinimas = async () => {
        if (!editId) return;

        const { error } = validarHorasMinimas(formHorasMinimas);
        if (error) {
            setHorasMinError(error);
            return;
        }

        setGuardando(true);
        try {
            const res = await fetch(`${API_BASE}/profesores/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_profesor: formNombre.trim(), horas_minimas: parseInt(formHorasMinimas, 10) || 0 })
            });
            if (!res.ok) throw new Error(await parseApiError(res, 'Error al guardar horas mínimas'));
            await fetchDatos();
            setIsModalOpen(false);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const handleGuardarPerfil = async (e) => {
        e.preventDefault();
        if (!formNombre.trim()) {
            setNombreError("El nombre es obligatorio");
            return;
        }
        setNombreError('');

        setGuardando(true);
        try {
            let pId = editId;
            if (isEditing) {
                const res = await fetch(`${API_BASE}/profesores/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre_profesor: formNombre.trim(), horas_minimas: parseInt(formHorasMinimas, 10) || 0 })
                });
                if (!res.ok) throw new Error(await parseApiError(res, 'Error al actualizar'));
            } else {
                const res = await fetch(`${API_BASE}/profesores`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre_profesor: formNombre.trim(), horas_minimas: parseInt(formHorasMinimas, 10) || 0 })
                });
                if (!res.ok) throw new Error(await parseApiError(res, 'Error al crear'));
                const newProf = await res.json();
                pId = newProf.id_profesor;
                setEditId(pId);
                setIsEditing(true);
            }
            await fetchDatos();
            setActiveTab('sedes'); // Mover a sedes tras crear/editar nombre
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    // ── Guardar Sedes ──
    const toggleSede = (id_sede) => {
        setFormSedes(prev =>
            prev.includes(id_sede)
                ? prev.filter(x => x !== id_sede)
                : [...prev, id_sede]
        );
        if (sedesError) setSedesError('');
    };

    const handleGuardarSedes = async () => {
        if (!editId) return;
        if (formSedes.length === 0) {
            setSedesError('Debes seleccionar al menos una sede para continuar.');
            return;
        }
        setGuardando(true);
        try {
            // Eliminar actuales
            const actuales = profesorSedes.filter(x => x.id_profesor === editId);
            for (let a of actuales) {
                await fetch(`${API_BASE}/profesor-sedes/${a.id_sede_profesor}`, { method: 'DELETE' });
            }
            // Insertar nuevas
            for (let sid of formSedes) {
                await fetch(`${API_BASE}/profesor-sedes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_profesor: editId, id_sede: sid })
                });
            }
            await fetchDatos();
            if (formSedes.length > 0 && (!activeSede || !formSedes.includes(activeSede))) {
                setActiveSede(formSedes[0]);
            }
            setActiveTab('grados');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    // ── Guardar Grados ──
    const toggleGrado = (id_grado) => {
        setFormGrados(prev =>
            prev.includes(id_grado)
                ? prev.filter(x => x !== id_grado)
                : [...prev, id_grado]
        );
        if (gradosError) setGradosError('');
    };

    const handleGuardarGrados = async () => {
        if (!editId) return;
        if (formGrados.length === 0) {
            setGradosError('Debes seleccionar al menos un grado para continuar.');
            return;
        }
        setGuardando(true);
        try {
            // Eliminar actuales
            const actuales = gradoProfesores.filter(x => x.id_profesor === editId);
            for (let a of actuales) {
                await fetch(`${API_BASE}/grado-profesor/${a.id_grado_profesor}`, { method: 'DELETE' });
            }
            // Insertar nuevas
            for (let gid of formGrados) {
                await fetch(`${API_BASE}/grado-profesor`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_profesor: editId, id_grado: gid })
                });
            }
            await fetchDatos();
            setActiveTab('disponibilidad');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    // ── Guardar Disponibilidad ──
    const applyBrush = (id_dia, id_turno, nro_bloque, action) => {
        if (!activeSede) return;
        const isDispo = formDispo.some(x => x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede);
        const isPref = formPreferencia.some(x => x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede);

        if (modoPincel === 'disponible') {
            if (action === 'add' && !isDispo) {
                setFormDispo(prev => [...prev, { id_dia, id_turno, nro_bloque, id_sede: activeSede }]);
            } else if (action === 'remove' && isDispo) {
                setFormDispo(prev => prev.filter(x => !(x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede)));
                setFormPreferencia(prev => prev.filter(x => !(x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede)));
            }
        } else {
            // Modo Preferido
            if (action === 'add' && !isPref) {
                if (!isDispo) setFormDispo(prev => [...prev, { id_dia, id_turno, nro_bloque, id_sede: activeSede }]);
                setFormPreferencia(prev => [...prev, { id_dia, id_turno, nro_bloque, id_sede: activeSede }]);
            } else if (action === 'remove' && isPref) {
                setFormPreferencia(prev => prev.filter(x => !(x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede)));
                setFormDispo(prev => prev.filter(x => !(x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede)));
            }
        }
    };

    const handleMouseDown = (id_dia, id_turno, nro_bloque) => {
        if (!activeSede) {
            alert('Por favor selecciona una sede arriba primero.');
            return;
        }
        setIsDragging(true);
        const isDispo = formDispo.some(x => x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede);
        const isPref = formPreferencia.some(x => x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede);
        
        let action = 'add';
        if (modoPincel === 'disponible') {
            if (isDispo) action = 'remove';
        } else {
            if (isPref) action = 'remove';
        }
        setDragAction(action);
        applyBrush(id_dia, id_turno, nro_bloque, action);
        if (dispoError) setDispoError('');
    };

    const handleMouseEnter = (id_dia, id_turno, nro_bloque) => {
        if (isDragging) {
            applyBrush(id_dia, id_turno, nro_bloque, dragAction);
        }
    };

    const setDispoAll = (val) => {
        if (!activeSede) return;
        if (val) {
            let all = [];
            dias.forEach(d => {
                turnos.forEach(t => {
                    const bList = bloques.filter(x => x.id_turno === t.id_turno);
                    bList.forEach(b => {
                        all.push({ id_dia: d.id_dia, id_turno: t.id_turno, nro_bloque: b.numero_bloque, id_sede: activeSede });
                    });
                });
            });
            if (modoPincel === 'preferido') {
                setFormDispo(prev => [...prev.filter(x => x.id_sede !== activeSede), ...all]);
                setFormPreferencia(prev => [...prev.filter(x => x.id_sede !== activeSede), ...all]);
            } else {
                setFormDispo(prev => [...prev.filter(x => x.id_sede !== activeSede), ...all]);
                setFormPreferencia(prev => [...prev.filter(x => x.id_sede !== activeSede)]);
            }
        } else {
            setFormDispo(prev => prev.filter(x => x.id_sede !== activeSede));
            setFormPreferencia(prev => prev.filter(x => x.id_sede !== activeSede));
        }
        if (dispoError) setDispoError('');
    };

    const handleGuardarDispo = async () => {
        if (!editId) return;

        if (!esDisponibilidadTotal) {
            const sedesFaltantes = formSedes.filter(sid => !formDispo.some(d => d.id_sede === sid));
            if (sedesFaltantes.length > 0) {
                const nombresFaltantes = sedesFaltantes.map(sid => sedes.find(s => s.id_sede === sid)?.nombre_sede || `Sede ${sid}`).join(', ');
                setDispoError(`Por favor, asigna disponibilidad en la cuadrícula para: ${nombresFaltantes}`);
                return;
            }
        }

        setGuardando(true);
        try {
            // Eliminar actuales
            const actualesD = disponibilidades.filter(x => x.id_profesor === editId);
            for (let a of actualesD) {
                await fetch(`${API_BASE}/profesor-disponibilidad/${a.id_disponibilidad}`, { method: 'DELETE' });
            }
            const actualesP = preferencias.filter(x => x.id_profesor === editId);
            for (let a of actualesP) {
                await fetch(`${API_BASE}/profesor-preferencia/${a.id_preferencia}`, { method: 'DELETE' });
            }

            if (esDisponibilidadTotal) {
                // El backend ahora maneja las sedes correctamente en profesor_sedes,
                // así que si es "Libre", simplemente dejamos sus tablas de disponibilidad y preferencia vacías.
                // No se necesita enviar ningún bloque de tiempo.
            } else {
                // Insertar nuevas
                for (let d of formDispo) {
                    await fetch(`${API_BASE}/profesor-disponibilidad`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_profesor: editId,
                            id_dia: d.id_dia,
                            id_turno: d.id_turno,
                            nro_bloque: d.nro_bloque,
                            id_sede: d.id_sede
                        })
                    });
                }
                for (let p of formPreferencia) {
                    await fetch(`${API_BASE}/profesor-preferencia`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_profesor: editId,
                            id_dia: p.id_dia,
                            id_turno: p.id_turno,
                            nro_bloque: p.nro_bloque,
                            id_sede: p.id_sede
                        })
                    });
                }
            }

            await fetchDatos();
            // Avanzar a la pestaña de Horas Mínimas en vez de cerrar
            const { error, warnings } = validarHorasMinimas(formHorasMinimas);
            setHorasMinError(error);
            setHorasMinWarnings(warnings);
            setActiveTab('horas_minimas');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };


    return (
        <div className="w-full space-y-8 animate-fade-in relative">
            {/* Cabecera Superior (Banner + Espacio Derecho) */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Banner Principal (Izquierda) */}
                <div className="md:w-2/3 bg-[var(--color-brand-primary)]/10 rounded-[24px] p-8 shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px] border border-[var(--color-brand-primary)]/70">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                        <div className="max-w-md">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                                Directorio de Docentes
                            </h2>
                            <p className="text-slate-500 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Administra el personal docente, asigna sus sedes correspondientes y define su disponibilidad horaria exacta.
                            </p>

                            <button
                                onClick={abrirModalNueva}
                                className="bg-brand-primary text-white hover:bg-brand-primary/80 font-extrabold py-2.5 px-6 rounded-xl shadow-[0_4px_12px_rgba(47, 91, 255,0.3)] hover:shadow-[0_6px_16px_rgba(47, 91, 255,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm w-max cursor-pointer">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                Añadir Nuevo Docente
                            </button>
                        </div>

                        {/* Imagen Ilustrativa a la derecha */}
                        <div className="hidden sm:flex relative w-32 h-32 md:w-45 md:h-45 flex-shrink-0 items-center justify-center -mt-2 md:mr-16">
                            {/* Brillo suave de fondo para resaltar */}
                            <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl"></div>
                            <img
                                src="/profe.svg"
                                alt="Ilustración"
                                className="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)] hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Espacio Derecho Reservado */}
                <div className="md:w-1/3 bg-white border-2 border-slate-200 border-dashed rounded-[24px] flex flex-col items-center justify-center p-8 min-h-[180px]">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary mb-3">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <p className="text-slate-400 font-extrabold text-sm">Plana Docente</p>
                    <p className="text-slate-400/70 text-xs mt-1 text-center font-medium max-w-[160px]">
                        Gestiona el personal y su disponibilidad.
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Toolbar y Grid de Profesores */}
            {!loading && (
                <div className="pt-4">
                    {/* Toolbar en una sola línea */}
                    <div className="flex items-center justify-between mb-8 bg-white py-2 px-4 rounded-[20px] border border-slate-100 shadow-sm h-16 w-full overflow-hidden">
                        {/* Izquierda: Título */}
                        <div className="flex-shrink-0 flex items-center gap-3 w-1/4">
                            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <h2 className="text-[20px] font-black text-slate-800 tracking-tight whitespace-nowrap">Docentes <span className="text-slate-400 text-[15px] font-bold ml-1">({filteredProfesores.length})</span></h2>
                        </div>

                        {/* Medio: Buscador Pill */}
                        <div className="flex-1 max-w-lg mx-4">
                            <div className="relative group flex items-center bg-white rounded-full p-1.5 border-2 border-slate-200 focus-within:border-brand-primary transition-all h-12 w-full">
                                <input
                                    type="text"
                                    placeholder="Buscar docente por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="flex-1 bg-transparent pl-6 pr-3 py-1 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full w-full"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="mr-2 text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50 flex-shrink-0">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                )}
                                <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-white flex-shrink-0 shadow-sm mr-0.5">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Derecha: Seleccionar + Eliminar */}
                        <div className="flex items-center gap-3 justify-end flex-shrink-0 w-1/4">
                            <button
                                onClick={() => { setIsSelectionMode(!isSelectionMode); if (isSelectionMode) setSelectedIds([]); }}
                                className={`text-[12px] font-bold transition-all cursor-pointer px-4 py-2.5 rounded-xl flex items-center gap-2 border shadow-sm whitespace-nowrap
                                    ${isSelectionMode
                                        ? 'bg-slate-800 border-slate-800 text-white hover:bg-slate-700'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${isSelectionMode ? 'bg-white/20 border-white/30 text-white' : 'bg-white border-slate-300'}`}>
                                    {isSelectionMode && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                </div>
                                {isSelectionMode ? 'Cancelar' : 'Seleccionar'}
                            </button>
                            {isSelectionMode && (
                                <button
                                    onClick={() => selectedIds.length > 0 && openDeleteModal(selectedIds)}
                                    disabled={selectedIds.length === 0}
                                    className={`text-[12px] font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 border shadow-sm whitespace-nowrap
                                        ${selectedIds.length > 0
                                            ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 cursor-pointer'
                                            : 'bg-red-50 text-red-300 border-red-100 opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                    Eliminar {selectedIds.length > 0 && `(${selectedIds.length})`}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grid */}
                    {filteredProfesores.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[32px] p-16 text-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-slate-300">
                                {searchTerm ? (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                ) : (
                                    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                )}
                            </div>
                            <h3 className="text-xl font-black text-slate-800">{searchTerm ? 'No se encontraron resultados' : 'No hay docentes registrados'}</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                                {searchTerm ? `No hay docentes que coincidan con "${searchTerm}".` : 'Comienza añadiendo tu primer docente usando el botón de arriba.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
                                {currentProfesores.map((prof, index) => {
                                    const hasGrados = gradoProfesores.some(x => x.id_profesor === prof.id_profesor);
                                    const faltanDatos = !hasGrados;

                                    return (
                                        <ProfesorCard
                                            key={prof.id_profesor}
                                            prof={prof}
                                            index={index}
                                            sedesStr={getSedesProfesor(prof.id_profesor)}
                                            cantGrados={getCantGrados(prof.id_profesor)}
                                            cantDispo={getCantDispo(prof.id_profesor)}
                                            onEdit={abrirModalEdicion}
                                            onDelete={() => openDeleteModal(prof.id_profesor)}
                                            isSelected={selectedIds.includes(prof.id_profesor)}
                                            onToggleSelect={toggleSelect}
                                            isSelectionMode={isSelectionMode}
                                            faltanDatos={faltanDatos}
                                        />
                                    );
                                })}
                            </div>
                            {/* Paginación */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12 mb-4">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-brand-primary transition-colors cursor-pointer">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${currentPage === i + 1 ? 'bg-brand-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>{i + 1}</button>
                                        ))}
                                    </div>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-brand-primary transition-colors cursor-pointer">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Modal de Eliminación Visual */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden transform animate-slide-up text-center p-8">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">
                            {itemsToDelete.length > 1 ? `¿Eliminar ${itemsToDelete.length} docentes?` : '¿Eliminar docente?'}
                        </h3>
                        <p className="text-slate-500 text-sm mb-8 font-medium">
                            Esta acción no se puede deshacer. También se eliminarán sus asignaciones de sedes y disponibilidad.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => { setIsDeleteModalOpen(false); setItemsToDelete([]); }} disabled={isDeleting} className="flex-1 cursor-pointer py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50">
                                Cancelar
                            </button>
                            <button onClick={confirmarEliminacion} disabled={isDeleting} className="flex-1 cursor-pointer py-3 px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl shadow-md shadow-red-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Principal con TABS */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4 sm:p-6">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-full sm:max-h-[90vh] border border-slate-100 flex flex-col overflow-hidden transform animate-slide-up">

                        {/* Header Limpio */}
                        <div className="bg-white px-8 py-6 flex justify-between items-start border-b border-slate-100 shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{!isNewRegistration ? 'Gestión de Docente' : 'Nuevo Docente'}</h2>
                                <p className="text-sm text-slate-500 mt-1">{!isNewRegistration ? 'Edita los datos y disponibilidad del docente.' : 'Registra un nuevo docente en el sistema.'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Body (Sidebar + Content) */}
                        <div className="flex flex-col md:flex-row flex-1 min-h-0">

                            {/* Sidebar Nav */}
                            <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 flex md:flex-col shrink-0 p-4 gap-2 overflow-x-auto md:overflow-x-visible">
                                <button onClick={() => !isNewRegistration && setActiveTab('perfil')} className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'perfil' ? 'bg-white shadow-sm border border-slate-200 text-brand-primary' : 'border border-transparent text-slate-500 hover:bg-slate-100/50 hover:text-slate-700'} ${isNewRegistration && activeTab !== 'perfil' ? 'pointer-events-none opacity-50' : isNewRegistration ? 'cursor-default' : 'cursor-pointer'}`}>1. Perfil Personal</button>
                                <button onClick={() => editId && !isNewRegistration && setActiveTab('sedes')} disabled={!editId || isNewRegistration} className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${(!editId || (isNewRegistration && activeTab !== 'sedes')) ? 'opacity-40 cursor-not-allowed border border-transparent' : activeTab === 'sedes' ? 'bg-white shadow-sm border border-slate-200 text-brand-primary' : 'border border-transparent text-slate-500 hover:bg-slate-100/50 hover:text-slate-700 cursor-pointer'}`}>2. Asignar Sedes</button>
                                <button onClick={() => editId && !isNewRegistration && setActiveTab('grados')} disabled={!editId || isNewRegistration} className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${(!editId || (isNewRegistration && activeTab !== 'grados')) ? 'opacity-40 cursor-not-allowed border border-transparent' : activeTab === 'grados' ? 'bg-white shadow-sm border border-slate-200 text-brand-primary' : 'border border-transparent text-slate-500 hover:bg-slate-100/50 hover:text-slate-700 cursor-pointer'}`}>3. Grados Permitidos</button>
                                <button onClick={() => editId && !isNewRegistration && setActiveTab('disponibilidad')} disabled={!editId || isNewRegistration} className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${(!editId || (isNewRegistration && activeTab !== 'disponibilidad')) ? 'opacity-40 cursor-not-allowed border border-transparent' : activeTab === 'disponibilidad' ? 'bg-white shadow-sm border border-slate-200 text-brand-primary' : 'border border-transparent text-slate-500 hover:bg-slate-100/50 hover:text-slate-700 cursor-pointer'}`}>4. Disponibilidad</button>
                                <button onClick={() => editId && !isNewRegistration && setActiveTab('horas_minimas')} disabled={!editId || isNewRegistration} className={`text-left px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${(!editId || (isNewRegistration && activeTab !== 'horas_minimas')) ? 'opacity-40 cursor-not-allowed border border-transparent' : activeTab === 'horas_minimas' ? 'bg-white shadow-sm border border-slate-200 text-brand-primary' : 'border border-transparent text-slate-500 hover:bg-slate-100/50 hover:text-slate-700 cursor-pointer'}`}>5. Horas Mínimas</button>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                                {/* TAB 1: PERFIL */}
                                {activeTab === 'perfil' && (
                                    <form onSubmit={handleGuardarPerfil} autoComplete="off" className="max-w-md mx-auto space-y-5">
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 block mb-2">Nombre del Docente</label>
                                            <input
                                                type="text"
                                                value={formNombre}
                                                onChange={(e) => setFormNombre(e.target.value)}
                                                className={`w-full px-4 py-3 rounded-xl border ${nombreError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 focus:border-brand-primary focus:ring-brand-primary/10'} bg-slate-50 text-slate-800 focus:bg-white focus:ring-4 outline-none transition-all text-sm font-medium`}
                                                placeholder="Ej. Juan Pérez"
                                            />
                                            {nombreError && (
                                                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                                    {nombreError}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-4 pt-2">
                                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">Cancelar</button>
                                            <button disabled={guardando} type="submit" className={`flex-1 py-3.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${guardando ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                                                {guardando ? 'Guardando...' : 'Continuar'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* TAB 2: SEDES */}
                                {activeTab === 'sedes' && (
                                    <div className="max-w-2xl mx-auto">
                                        <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">Sedes del Docente</p>
                                                <p className="text-[11px] text-slate-400">Selecciona una o más sedes donde imparte clases</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                            {sedes.map(s => {
                                                const activo = formSedes.includes(s.id_sede);
                                                return (
                                                    <div
                                                        key={s.id_sede}
                                                        onClick={() => toggleSede(s.id_sede)}
                                                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${activo ? 'border-brand-primary bg-brand-primary/5 shadow-sm shadow-brand-primary/10' : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
                                                            }`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${activo ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400'
                                                            }`}>
                                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[12px] text-slate-500 mt-0.5 truncate">Nombre de la sede:</p>
                                                            <p className={`font-bold text-sm truncate ${activo ? 'text-brand-primary' : 'text-slate-700'}`}>{s.nombre_sede}</p>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${activo ? 'border-brand-primary bg-brand-primary' : 'border-slate-200'
                                                            }`}>
                                                            {activo && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {sedes.length === 0 && (
                                                <div className="col-span-2 text-center py-8 text-slate-400">
                                                    <svg className="mx-auto mb-2" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                                                    <p className="text-sm font-medium">No hay sedes registradas</p>
                                                </div>
                                            )}
                                        </div>
                                        {sedesError && (
                                            <div className="mt-4 bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                {sedesError}
                                            </div>
                                        )}
                                        <div className="flex gap-4 mt-6">
                                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">Cancelar</button>
                                            <button disabled={guardando} onClick={handleGuardarSedes} className={`flex-1 py-3.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 text-sm ${guardando ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                                                {guardando ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>) : (<>Continuar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>)}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: GRADOS */}
                                {activeTab === 'grados' && (
                                    <div className="max-w-2xl mx-auto animate-fade-in">
                                        <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">Grados Permitidos</p>
                                                <p className="text-[11px] text-slate-400">Selecciona los grados en los que este docente puede enseñar</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                                            {grados.map(g => {
                                                const activo = formGrados.includes(g.id_grado);
                                                return (
                                                    <div
                                                        key={g.id_grado}
                                                        onClick={() => toggleGrado(g.id_grado)}
                                                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${activo ? 'border-brand-primary bg-brand-primary/5 shadow-sm shadow-brand-primary/10' : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'}`}
                                                    >
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${activo ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                            <span className="font-black text-sm">{g.nombre_grado?.charAt(0) || g.id_grado}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0 w-full">
                                                            <p className={`font-bold text-xs truncate ${activo ? 'text-brand-primary' : 'text-slate-700'}`}>{g.nombre_grado || `Grado ${g.id_grado}`}</p>
                                                            {g.nivel && <p className="text-[10px] text-slate-400 mt-0.5 truncate uppercase">{g.nivel}</p>}
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors mt-1 ${activo ? 'border-brand-primary bg-brand-primary' : 'border-slate-200'}`}>
                                                            {activo && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"><polyline points="20 6 9 17 4 12" /></svg>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {grados.length === 0 && (
                                                <div className="col-span-full text-center py-8 text-slate-400">
                                                    <svg className="mx-auto mb-2" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 14l9-5-9-5-9 5 9 5z" /></svg>
                                                    <p className="text-sm font-medium">No hay grados registrados</p>
                                                </div>
                                            )}
                                        </div>
                                        {gradosError && (
                                            <div className="mt-4 bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                {gradosError}
                                            </div>
                                        )}
                                        <div className="flex gap-4 mt-6">
                                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">Cancelar</button>
                                            <button disabled={guardando} onClick={handleGuardarGrados} className={`flex-1 py-3.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 text-sm ${guardando ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                                                {guardando ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>) : (<>Continuar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>)}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: DISPONIBILIDAD */}
                                {activeTab === 'disponibilidad' && (
                                    <div className="space-y-4">
                                        {/* Row de Sedes */}
                                        {formSedes.length > 0 && (
                                            <div className="mb-4">
                                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Sedes</label>
                                                <div className="flex gap-2 flex-wrap bg-slate-100/50 p-2 rounded-2xl border border-slate-100">
                                                    {formSedes.map(sid => {
                                                        const sObj = sedes.find(s => s.id_sede === sid);
                                                        if (!sObj) return null;
                                                        return (
                                                            <button
                                                                key={sid}
                                                                onClick={() => setActiveSede(sid)}
                                                                className={`px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${activeSede === sid ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'bg-white text-slate-500 hover:text-brand-primary border border-slate-200 hover:border-brand-primary'} ${esDisponibilidadTotal ? 'opacity-30 pointer-events-none grayscale' : ''}`}
                                                            >
                                                                {sObj.nombre_sede}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className={`transition-all duration-300 ${esDisponibilidadTotal ? 'opacity-30 pointer-events-none grayscale' : ''}`}>

                                            <div className="flex flex-wrap items-center justify-between gap-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex bg-slate-200/50 p-1 rounded-lg">
                                                        <button onClick={() => setModoPincel('disponible')} className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${modoPincel === 'disponible' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${modoPincel === 'disponible' ? 'bg-brand-primary' : 'bg-slate-300'}`}></div> Disponible
                                                        </button>
                                                        <button onClick={() => setModoPincel('preferido')} className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${modoPincel === 'preferido' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${modoPincel === 'preferido' ? 'bg-amber-400' : 'bg-slate-300'}`}></div> Preferido
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {/* Leyenda compacta */}
                                                    <div className="hidden sm:flex items-center gap-3 text-[10px] font-bold text-slate-500">
                                                        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-brand-primary"></div>Disp</div>
                                                        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-amber-400"></div>Pref</div>
                                                        <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded border border-red-200 bg-red-50"></div>No Disp</div>
                                                    </div>
                                                    <button onClick={() => setDispoAll(false)} className="bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm border border-slate-200 hover:border-red-200 font-bold text-[11px]" title="Limpiar todo">
                                                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                        Limpiar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contenedor de Turnos y Toggle Total */}
                                        {(() => {
                                            // Construir la lista de turnos a mostrar
                                            let turnosRender = turnos.length > 0 ? turnos : [];

                                            // Filtrar turnos según los grados seleccionados
                                            if (secciones.length > 0 && seccionTurnos.length > 0 && formGrados.length > 0) {
                                                const seccionesGrado = secciones.filter(s => formGrados.includes(s.id_grado)).map(s => s.id_seccion);
                                                const turnosValidosIds = [...new Set(seccionTurnos.filter(st => seccionesGrado.includes(st.id_seccion)).map(st => st.id_turno))];
                                                if (turnosValidosIds.length > 0) {
                                                    turnosRender = turnosRender.filter(t => turnosValidosIds.includes(t.id_turno));
                                                }
                                            }

                                            if (turnosRender.length === 0) {
                                                const allEntries = [...formDispo, ...formPreferencia];
                                                const idsUnicos = [...new Set(allEntries.map(x => x.id_turno))];
                                                turnosRender = idsUnicos.map(id => ({ id_turno: id, nombre: `Turno ${id}` }));
                                            }
                                            if (turnosRender.length === 0) {
                                                turnosRender = [{ id_turno: 1, nombre: 'Turno General' }];
                                            }

                                            // Asegurarnos de tener un turno activo
                                            const currentTurnoId = turnosRender.some(t => t.id_turno === activeTurnoTab) ? activeTurnoTab : turnosRender[0].id_turno;

                                            return (
                                                <div className="space-y-4">
                                                    {/* Header de Turnos + Toggle Total */}
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

                                                        {/* Tabs de Turnos */}
                                                        <div className="flex gap-2 overflow-x-auto pb-1 flex-1 w-full sm:w-auto">
                                                            {turnosRender.length > 1 && turnosRender.map(t => (
                                                                <button
                                                                    key={t.id_turno}
                                                                    onClick={() => setActiveTurnoTab(t.id_turno)}
                                                                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${currentTurnoId === t.id_turno ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} ${esDisponibilidadTotal ? 'opacity-30 pointer-events-none grayscale' : ''}`}
                                                                >
                                                                    {t.nombre}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {/* Toggle Total (Movido a esta fila) */}
                                                        <div className="flex items-center gap-2 bg-brand-primary/5 px-3 py-1.5 rounded-lg border border-brand-primary/20 shrink-0">
                                                            <span className="font-bold text-brand-primary text-xs">Disponibilidad Total</span>
                                                            <div
                                                                onClick={() => {
                                                                    setEsDisponibilidadTotal(!esDisponibilidadTotal);
                                                                    if (!esDisponibilidadTotal) {
                                                                        setFormDispo([]);
                                                                        setFormPreferencia([]);
                                                                    }
                                                                }}
                                                                className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative shrink-0 ${esDisponibilidadTotal ? 'bg-brand-primary' : 'bg-slate-300'}`}
                                                            >
                                                                <div className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform ${esDisponibilidadTotal ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`transition-all duration-300 ${esDisponibilidadTotal ? 'opacity-30 pointer-events-none grayscale' : ''}`}>

                                                        {turnosRender.map(turno => {
                                                            if (turno.id_turno !== currentTurnoId) return null;
                                                            // Bloques del API para este turno
                                                            const bloquesTurno = bloques.filter(b => b.id_turno === turno.id_turno && !b.es_recreo);
                                                            // Usar: bloques del API si existen, si no generar desde grado-dia-config dinámico
                                                            const maxFromDispo = Math.max(
                                                                ...formDispo.filter(x => x.id_turno === turno.id_turno).map(x => x.nro_bloque || 0),
                                                                ...formPreferencia.filter(x => x.id_turno === turno.id_turno).map(x => x.nro_bloque || 0),
                                                                0
                                                            );
                                                            
                                                            // Calcular cuántos bloques requiere como máximo los grados que el profe va a enseñar
                                                            const configForGrados = gradoDiaConfigs.filter(c => formGrados.includes(c.id_grado));
                                                            const maxFromGrados = configForGrados.length > 0 
                                                                ? Math.max(...configForGrados.map(c => c.bloques_dia || 0))
                                                                : maxBloquesDia; // Si no hay grados seleccionados o falta config, usa el global

                                                            const maxBloques = Math.max(maxFromDispo, maxFromGrados);
                                                            const bloquesRender = bloquesTurno.length > 0
                                                                ? bloquesTurno.filter(b => b.numero_bloque <= maxBloques)
                                                                : Array.from({ length: maxBloques }, (_, i) => ({ numero_bloque: i + 1, id_bloque: `temp-${turno.id_turno}-${i}` }));

                                                            // Filtrar días válidos para los grados seleccionados
                                                            const diasValidosIds = configForGrados.length > 0
                                                                ? [...new Set(configForGrados.map(c => c.id_dia))]
                                                                : dias.map(d => d.id_dia); // fallback a todos los días si no hay grados

                                                            const diasRender = dias.filter(d => diasValidosIds.includes(d.id_dia));

                                                            return (
                                                                <div key={turno.id_turno} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                                                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                                                                        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-widest">{turno.nombre}</h3>
                                                                    </div>
                                                                    <div className="overflow-x-auto">
                                                                        <div className="min-w-full p-2 sm:p-4">
                                                                            <table 
                                                                                className="w-full border-collapse text-xs select-none"
                                                                                onMouseUp={() => setIsDragging(false)}
                                                                                onMouseLeave={() => setIsDragging(false)}
                                                                            >
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 bg-white border-r border-slate-100">Blq</th>
                                                                                        {diasRender.map(d => <th key={d.id_dia} className="p-3 text-center text-[10px] font-black text-slate-600 bg-white min-w-[50px]">{d.nombre_dia?.slice(0, 3).toUpperCase() || d.nombre_dia}</th>)}

                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {bloquesRender.map((b, bi) => (
                                                                                        <tr key={b.id_bloque} className={bi % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                                                                                            <td className="p-3 text-sm font-black text-slate-400 whitespace-nowrap text-center bg-slate-50 border-r border-slate-100">
                                                                                                {b.numero_bloque}
                                                                                            </td>
                                                                                            {diasRender.map(d => {
                                                                                                const isDispo = formDispo.some(x => x.id_dia === d.id_dia && x.id_turno === turno.id_turno && x.nro_bloque === b.numero_bloque && x.id_sede === activeSede);
                                                                                                const isPref = formPreferencia.some(x => x.id_dia === d.id_dia && x.id_turno === turno.id_turno && x.nro_bloque === b.numero_bloque && x.id_sede === activeSede);

                                                                                                return (
                                                                                                    <td
                                                                                                        key={d.id_dia}
                                                                                                        onMouseDown={() => handleMouseDown(d.id_dia, turno.id_turno, b.numero_bloque)}
                                                                                                        onMouseEnter={() => handleMouseEnter(d.id_dia, turno.id_turno, b.numero_bloque)}
                                                                                                        className="p-2 text-center cursor-pointer"
                                                                                                    >
                                                                                                        <div className={`mx-auto w-10 h-8 rounded-xl flex items-center justify-center transition-colors border ${isPref
                                                                                                            ? 'bg-amber-400 border-transparent shadow-md shadow-amber-400/20 text-white'
                                                                                                            : isDispo
                                                                                                                ? 'bg-brand-primary border-transparent shadow-md shadow-brand-primary/20 text-white'
                                                                                                                : 'bg-red-50 hover:bg-red-100 border-red-100 text-red-400'
                                                                                                            }`}>
                                                                                                            {isPref ? (
                                                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                                                                            ) : isDispo ? (
                                                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                                                                            ) : (
                                                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </td>
                                                                                                );
                                                                                            })}
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {dispoError && (
                                            <div className="mt-4 bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                {dispoError}
                                            </div>
                                        )}
                                        <div className="flex gap-4 pt-4 border-t border-slate-100 mt-4">
                                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">Cancelar</button>
                                            <button disabled={guardando} onClick={handleGuardarDispo} className={`flex-1 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl shadow-md transition-all ${guardando ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                                                {guardando ? 'Guardando...' : 'Continuar'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 5: HORAS MÍNIMAS */}
                                {activeTab === 'horas_minimas' && (
                                    <div className="max-w-md mx-auto space-y-5">
                                        <div className="flex items-center gap-3 mb-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary shrink-0">
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">Horas Mínimas Exigidas</p>
                                                <p className="text-[11px] text-slate-400">Define la carga horaria mínima semanal que debe cumplir este docente.</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-bold text-slate-700 block mb-2">Cantidad de Horas</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="40"
                                                step="1"
                                                value={formHorasMinimas}
                                                onChange={handleHorasMinChange}
                                                className={`w-full px-4 py-3 rounded-xl border ${horasMinError ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10' : 'border-slate-200 bg-slate-50 focus:border-brand-primary focus:ring-brand-primary/10'} text-slate-800 focus:bg-white focus:ring-4 outline-none transition-all text-sm font-medium`}
                                            />
                                            {horasMinError && (
                                                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                                    {horasMinError}
                                                </p>
                                            )}
                                            {!horasMinError && horasMinWarnings.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {horasMinWarnings.map((w, i) => (
                                                        <p key={i} className="text-amber-600 text-xs flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                                            <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                                            <span>{w}</span>
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                            {!horasMinError && horasMinWarnings.length === 0 && formHorasMinimas && parseInt(formHorasMinimas) >= 1 && (
                                                <p className="text-emerald-600 text-xs mt-1.5 flex items-center gap-1">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                                    Valor válido. El motor priorizará asignarle al menos {formHorasMinimas} horas.
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-4 pt-4 border-t border-slate-100 mt-4">
                                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">Cancelar</button>
                                            <button disabled={guardando || !!horasMinError} onClick={handleGuardarHorasMinimas} className={`flex-1 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${(guardando || !!horasMinError) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                                                {guardando ? 'Guardando...' : 'Finalizar y Guardar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

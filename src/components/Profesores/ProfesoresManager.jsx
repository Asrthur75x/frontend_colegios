import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

const ProfesorCard = ({ prof, sedesStr, cantDispo, onEdit, onDelete, isSelected, onToggleSelect, isSelectionMode }) => {
    return (
        <div 
            className={`relative bg-white rounded-[20px] border p-6 flex flex-col gap-5 hover:shadow-md transition-all group cursor-pointer
                ${isSelected ? 'border-hx-blue shadow-sm ring-1 ring-hx-blue/20 bg-blue-50/20' : 'border-slate-100 shadow-sm'}
            `}
            onClick={() => isSelectionMode && onToggleSelect(prof.id_profesor)}
        >
            {/* Checkbox (solo visible en modo selección) */}
            {isSelectionMode && (
                <div className="absolute top-4 right-4 z-10">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border-2 ${isSelected ? 'bg-hx-blue border-hx-blue text-white' : 'bg-white border-slate-300 hover:border-hx-blue'}`}>
                        {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                </div>
            )}

            {/* Cabecera de la Tarjeta */}
            <div className={`flex items-center gap-4 ${isSelectionMode ? 'pr-8' : ''}`}>
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 border-2 border-white ring-2 transition-colors ${isSelected ? 'bg-hx-blue text-white ring-hx-blue/30' : 'bg-hx-blue/10 text-hx-blue ring-hx-blue/20'}`}>
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
                        <div className="flex items-center gap-1 text-slate-400" title="Bloques Disponibles">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            <span className={`text-[10px] font-bold ${cantDispo === 'Total' ? 'text-hx-blue' : ''}`}>
                                {cantDispo === 'Total' ? 'Dispo. Total' : `${cantDispo} Blq.`}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400" title="ID Profesor">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            <span className="text-[10px] font-bold">#{prof.id_profesor}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botones de Acción (ocultos en modo selección) */}
            {!isSelectionMode && (
                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(prof); }}
                        className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-hx-blue hover:border-hx-blue hover:bg-hx-blue/5 transition-all flex justify-center items-center gap-1.5"
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Editar
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(prof.id_profesor); }}
                        className="py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-red-500 hover:border-red-500 hover:bg-red-50 transition-all flex justify-center items-center gap-1.5"
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
    const [disponibilidades, setDisponibilidades] = useState([]);
    const [preferencias, setPreferencias] = useState([]);
    const [dias, setDias] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [bloques, setBloques] = useState([]);
    const [maxBloquesDia, setMaxBloquesDia] = useState(10);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [activeTab, setActiveTab] = useState('perfil');
    const [guardando, setGuardando] = useState(false);

    // Form State
    const [formNombre, setFormNombre] = useState('');
    const [nombreError, setNombreError] = useState('');
    const [formSedes, setFormSedes] = useState([]); // array of id_sede
    const [formDispo, setFormDispo] = useState([]); // array of { id_dia, id_turno, nro_bloque }
    const [formPreferencia, setFormPreferencia] = useState([]); // array of { id_dia, id_turno, nro_bloque }
    const [esDisponibilidadTotal, setEsDisponibilidadTotal] = useState(false);
    const [modoPincel, setModoPincel] = useState('disponible'); // 'disponible' | 'preferido'
    const [activeSede, setActiveSede] = useState(null); // Sede seleccionada en el Tab 3

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
    );
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
                const ps = profesorSedes.filter(x => x.id_profesor === id);
                for (let s of ps) {
                    await fetch(`${API_BASE}/profesor-sedes/${s.id_profesor_sede}`, { method: 'DELETE' });
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
                'profesor-disponibilidad', 'profesor-preferencia', 'dias', 'turnos', 'bloques', 'grado-dia-config'
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

            // Calcular el máximo de bloques por día desde grado-dia-config
            const gradoDiaConfigs = data[8] || [];
            const maxBlq = gradoDiaConfigs.reduce((acc, c) => Math.max(acc, c.bloques_dia || 0), 0);
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
        
        // Si sigue vacío, es un profesor "Libre" del sistema antiguo que no tenía sede atada
        if (ps.length === 0) return 'Libre (Todas)';
        
        return ps.map(sid => {
            const s = sedes.find(sede => sede.id_sede === sid);
            return s ? s.nombre_sede : 'Desconocida';
        }).join(', ');
    };

    const getCantDispo = (id_prof) => {
        const cant = disponibilidades.filter(x => x.id_profesor === id_prof).length;
        if (cant === 0) {
            const prefs = preferencias.filter(x => x.id_profesor === id_prof).length;
            if (prefs === 0) return 'Total';
        }
        return cant;
    };

    // ── Abrir Modal ──
    const abrirModalNueva = () => {
        setIsEditing(false);
        setEditId(null);
        setFormNombre('');
        setNombreError('');
        setFormSedes([]);
        setFormDispo([]);
        setFormPreferencia([]);
        setActiveSede(null);
        setEsDisponibilidadTotal(false);
        setActiveTab('perfil');
        setIsModalOpen(true);
    };

    const abrirModalEdicion = (prof) => {
        setIsEditing(true);
        setEditId(prof.id_profesor);
        setFormNombre(prof.nombre_profesor);
        setNombreError('');

        // Cargar sedes actuales
        let sedesActuales = profesorSedes
            .filter(x => x.id_profesor === prof.id_profesor)
            .map(x => x.id_sede);
            
        if (sedesActuales.length === 0) {
            const disps = disponibilidades.filter(x => x.id_profesor === prof.id_profesor).map(x => x.id_sede);
            const prefs = preferencias.filter(x => x.id_profesor === prof.id_profesor).map(x => x.id_sede);
            sedesActuales = [...new Set([...disps, ...prefs])].filter(id => id != null);
        }
        
        // Si es un profesor antiguo libre sin sedes, asignarle todas por defecto para que las pueda ver/editar
        if (sedesActuales.length === 0) {
            sedesActuales = sedes.map(s => s.id_sede);
        }
        
        setFormSedes(sedesActuales);
        if (sedesActuales.length > 0) setActiveSede(sedesActuales[0]);

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

        // Si no tiene disponibilidades ni preferencias, está libre todos los días
        setEsDisponibilidadTotal(dispoActual.length === 0 && prefActual.length === 0);

        setActiveTab('perfil');
        setIsModalOpen(true);
    };

    const eliminarProfesor = async (id) => {
        const confirmacion = window.confirm('¿Eliminar profesor y todas sus asignaciones?');
        if (!confirmacion) return;
        try {
            // Eliminar dependencias primero si el backend no hace cascade
            const linkSedes = profesorSedes.filter(x => x.id_profesor === id);
            for (let ls of linkSedes) {
                await fetch(`${API_BASE}/profesor-sedes/${ls.id_sede_profesor}`, { method: 'DELETE' });
            }
            const linkDispos = disponibilidades.filter(x => x.id_profesor === id);
            for (let ld of linkDispos) {
                await fetch(`${API_BASE}/profesor-disponibilidad/${ld.id_disponibilidad}`, { method: 'DELETE' });
            }
            const linkPrefs = preferencias.filter(x => x.id_profesor === id);
            for (let lp of linkPrefs) {
                await fetch(`${API_BASE}/profesor-preferencia/${lp.id_preferencia}`, { method: 'DELETE' });
            }

            // Finalmente eliminar profesor
            const res = await fetch(`${API_BASE}/profesores/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await parseApiError(res, 'Error al eliminar'));

            await fetchDatos();
            window.dispatchEvent(new Event('horarix_data_updated'));
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    // ── Guardar Perfil (Nombre) ──
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
                    body: JSON.stringify({ nombre_profesor: formNombre.trim() })
                });
                if (!res.ok) throw new Error(await parseApiError(res, 'Error al actualizar'));
            } else {
                const res = await fetch(`${API_BASE}/profesores`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre_profesor: formNombre.trim() })
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
    };

    const handleGuardarSedes = async () => {
        if (!editId) return;
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
            setActiveTab('disponibilidad');
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    // ── Guardar Disponibilidad ──
    const toggleDispo = (id_dia, id_turno, nro_bloque) => {
        if (!activeSede) {
            alert('Por favor selecciona una sede arriba primero.');
            return;
        }
        const isDispo = formDispo.some(x => x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede);
        const isPref = formPreferencia.some(x => x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede);

        if (modoPincel === 'disponible') {
            if (!isDispo) {
                // Agregar a disponible
                setFormDispo(prev => [...prev, { id_dia, id_turno, nro_bloque, id_sede: activeSede }]);
            } else {
                // Quitar de disponible (y por ende de preferido)
                setFormDispo(prev => prev.filter(x => !(x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede)));
                setFormPreferencia(prev => prev.filter(x => !(x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede)));
            }
        } else {
            // Modo Preferido
            if (!isPref) {
                // Agregar a ambas (un preferido DEBE estar disponible)
                if (!isDispo) setFormDispo(prev => [...prev, { id_dia, id_turno, nro_bloque, id_sede: activeSede }]);
                setFormPreferencia(prev => [...prev, { id_dia, id_turno, nro_bloque, id_sede: activeSede }]);
            } else {
                // Quitar de preferido Y de disponible → vuelve a "No disponible"
                setFormPreferencia(prev => prev.filter(x => !(x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede)));
                setFormDispo(prev => prev.filter(x => !(x.id_dia === id_dia && x.id_turno === id_turno && x.nro_bloque === nro_bloque && x.id_sede === activeSede)));
            }
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
                setFormPreferencia(prev => prev.filter(x => x.id_sede !== activeSede));
            }
        } else {
            setFormDispo(prev => prev.filter(x => x.id_sede !== activeSede));
            setFormPreferencia(prev => prev.filter(x => x.id_sede !== activeSede));
        }
    };

    const handleGuardarDispo = async () => {
        if (!editId) return;
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
            setIsModalOpen(false);
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
                <div className="md:w-2/3 bg-gradient-to-r from-hx-blue via-blue-600 to-indigo-700 rounded-[24px] p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
                    <div className="absolute bottom-0 right-32 w-32 h-32 bg-hx-blue/40 rounded-full blur-xl translate-y-1/4"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="max-w-md">
                            <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight drop-shadow-sm text-white">
                                Directorio de Docentes
                            </h2>
                            <p className="text-white/90 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Administra el personal docente, asigna sus sedes correspondientes y define su disponibilidad horaria exacta.
                            </p>

                            <button
                                onClick={abrirModalNueva}
                                className="bg-white text-hx-blue hover:bg-slate-50 font-extrabold py-2.5 px-6 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm w-max">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                Añadir Nuevo Docente
                            </button>
                        </div>
                        {/* Logo decorativo */}
                        <div className="hidden sm:flex text-white/90 opacity-80 pt-2">
                            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                    </div>
                </div>

                {/* Espacio Derecho Reservado */}
                <div className="md:w-1/3 bg-white border-2 border-slate-200 border-dashed rounded-[24px] flex flex-col items-center justify-center p-8 min-h-[180px]">
                    <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center text-sky-400 mb-3">
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
                            <div className="w-10 h-10 bg-hx-blue/10 rounded-xl flex items-center justify-center text-hx-blue">
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                            <h2 className="text-[20px] font-black text-slate-800 tracking-tight whitespace-nowrap">Docentes <span className="text-slate-400 text-[15px] font-bold ml-1">({filteredProfesores.length})</span></h2>
                        </div>

                        {/* Medio: Buscador Pill */}
                        <div className="flex-1 max-w-lg mx-4">
                            <div className="relative group flex items-center bg-white rounded-full p-1.5 border-2 border-slate-200 focus-within:border-hx-blue transition-all h-12 w-full">
                                <input 
                                    type="text" 
                                    placeholder="Buscar docente por nombre..." 
                                    value={searchTerm}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="flex-1 bg-transparent pl-6 pr-3 py-1 outline-none text-[14px] font-medium text-slate-700 placeholder:text-slate-400 h-full w-full"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="mr-2 text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50 flex-shrink-0">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                )}
                                <div className="w-9 h-9 rounded-full bg-hx-blue flex items-center justify-center text-white flex-shrink-0 shadow-sm mr-0.5">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
                                    {isSelectionMode && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
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
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                ) : (
                                    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
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
                                {currentProfesores.map((prof, index) => (
                                    <ProfesorCard 
                                        key={prof.id_profesor} 
                                        prof={prof} 
                                        index={index}
                                        sedesStr={getSedesProfesor(prof.id_profesor)}
                                        cantDispo={getCantDispo(prof.id_profesor)}
                                        onEdit={abrirModalEdicion}
                                        onDelete={() => openDeleteModal(prof.id_profesor)}
                                        isSelected={selectedIds.includes(prof.id_profesor)}
                                        onToggleSelect={toggleSelect}
                                        isSelectionMode={isSelectionMode}
                                    />
                                ))}
                            </div>
                            {/* Paginación */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12 mb-4">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-hx-blue transition-colors cursor-pointer">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${currentPage === i + 1 ? 'bg-hx-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>{i + 1}</button>
                                        ))}
                                    </div>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:text-hx-blue transition-colors cursor-pointer">
                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
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
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-full sm:max-h-[90vh] border border-slate-100 flex flex-col overflow-hidden transform animate-slide-up">

                        {/* Header Limpio */}
                        <div className="bg-white px-8 py-6 flex justify-between items-start border-b border-slate-100 shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{isEditing ? 'Gestión de Docente' : 'Nuevo Docente'}</h2>
                                <p className="text-sm text-slate-500 mt-1">{isEditing ? 'Edita los datos y disponibilidad del docente.' : 'Registra un nuevo docente en el sistema.'}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* Tabs Limpios */}
                        <div className="flex border-b border-slate-100 px-8 shrink-0 bg-white">
                            <button onClick={() => setActiveTab('perfil')} className={`py-4 px-2 mr-6 font-bold text-sm border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'perfil' ? 'border-hx-blue text-hx-blue' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>1. Perfil Personal</button>
                            <button onClick={() => editId && setActiveTab('sedes')} disabled={!editId} className={`py-4 px-2 mr-6 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${!editId ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer ' + (activeTab === 'sedes' ? 'border-hx-blue text-hx-blue' : 'border-transparent text-slate-400 hover:text-slate-600')}`}>2. Asignar Sedes</button>
                            <button onClick={() => editId && setActiveTab('disponibilidad')} disabled={!editId} className={`py-4 px-2 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${!editId ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer ' + (activeTab === 'disponibilidad' ? 'border-hx-blue text-hx-blue' : 'border-transparent text-slate-400 hover:text-slate-600')}`}>3. Disponibilidad</button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-8 overflow-y-auto flex-1 min-h-0">
                            {/* TAB 1: PERFIL */}
                            {activeTab === 'perfil' && (
                                <form onSubmit={handleGuardarPerfil} className="max-w-md mx-auto space-y-5">
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 block mb-2">Nombre Completo del Docente</label>
                                        <input
                                            type="text" value={formNombre}
                                            onChange={(e) => {
                                                setFormNombre(e.target.value);
                                                if (e.target.value.trim()) setNombreError('');
                                            }}
                                            placeholder="Ej. Juan Carlos Pérez"
                                            className={`w-full px-4 py-3 rounded-xl border ${nombreError ? 'border-red-400 bg-red-50 focus:ring-red-400/20 text-red-900 placeholder-red-300' : 'border-slate-200 bg-slate-50 focus:border-hx-blue focus:ring-hx-blue/10 text-slate-800'} focus:bg-white focus:ring-4 outline-none transition-all text-sm font-medium`}
                                        />
                                        {nombreError && (
                                            <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1.5 animate-fade-in">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                                {nombreError}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-4 pt-2">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">Cancelar</button>
                                        <button disabled={guardando} type="submit" className={`flex-1 py-3.5 bg-hx-blue hover:bg-hx-blue/90 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${guardando ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                                            {guardando ? 'Guardando...' : 'Continuar'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* TAB 2: SEDES */}
                            {activeTab === 'sedes' && (
                                <div className="max-w-2xl mx-auto">
                                    <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="w-9 h-9 bg-hx-blue/10 rounded-xl flex items-center justify-center text-hx-blue shrink-0">
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
                                                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${activo ? 'border-hx-blue bg-hx-blue/5 shadow-sm shadow-hx-blue/10' : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${activo ? 'bg-hx-blue text-white' : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-sm truncate ${activo ? 'text-hx-blue' : 'text-slate-700'}`}>{s.nombre_sede}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{s.direccion || 'Sin dirección'}</p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${activo ? 'border-hx-blue bg-hx-blue' : 'border-slate-200'
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
                                    <div className="flex gap-4 mt-6">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">Cancelar</button>
                                        <button disabled={guardando} onClick={handleGuardarSedes} className={`flex-1 py-3.5 bg-hx-blue hover:bg-hx-blue/90 text-white font-bold rounded-xl shadow-md shadow-hx-blue/20 transition-all flex items-center justify-center gap-2 text-sm ${guardando ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                                            {guardando ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>) : (<>Continuar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>)}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: DISPONIBILIDAD */}
                            {activeTab === 'disponibilidad' && (
                                <div className="space-y-5">
                                    {/* Info banner y Toggle Total */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between p-4 bg-hx-blue/5 rounded-2xl border border-hx-blue/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-hx-blue shrink-0">
                                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-hx-blue text-sm">Disponibilidad Total (Libre)</p>
                                                    <p className="text-[11px] text-slate-500 font-medium">El docente puede trabajar cualquier día y en cualquier bloque.</p>
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => {
                                                    setEsDisponibilidadTotal(!esDisponibilidadTotal);
                                                    if (!esDisponibilidadTotal) {
                                                        setFormDispo([]);
                                                        setFormPreferencia([]);
                                                    }
                                                }}
                                                className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative shrink-0 ${esDisponibilidadTotal ? 'bg-hx-blue' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${esDisponibilidadTotal ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>

                                        <div className={`transition-all duration-300 ${esDisponibilidadTotal ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                                                {/* Tabs de Sedes seleccionadas */}
                                                {formSedes.length > 0 && (
                                                    <div className="flex gap-2 mb-4 bg-slate-100/50 p-2 rounded-2xl border border-slate-100">
                                                        {formSedes.map(sid => {
                                                            const sObj = sedes.find(s => s.id_sede === sid);
                                                            if (!sObj) return null;
                                                            return (
                                                                <button
                                                                    key={sid}
                                                                    onClick={() => setActiveSede(sid)}
                                                                    className={`px-6 py-2.5 rounded-xl font-extrabold text-sm transition-all ${activeSede === sid ? 'bg-hx-blue text-white shadow-md shadow-hx-blue/20' : 'bg-white text-slate-500 hover:text-hx-blue border border-slate-200 hover:border-hx-blue'}`}
                                                                >
                                                                    {sObj.nombre_sede}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-slate-200/50 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
                                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-700 text-sm">Horario Personalizado</p>
                                                            <p className="text-[11px] text-slate-400">Elige un modo y haz clic en la tabla para marcar bloques.</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex bg-slate-200/50 p-1 rounded-xl self-start xl:self-center">
                                                        <button onClick={() => setModoPincel('disponible')} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-2 ${modoPincel === 'disponible' ? 'bg-white text-hx-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                                            <div className={`w-2 h-2 rounded-full ${modoPincel === 'disponible' ? 'bg-hx-blue' : 'bg-slate-300'}`}></div> Modo Disponible
                                                        </button>
                                                        <button onClick={() => setModoPincel('preferido')} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-2 ${modoPincel === 'preferido' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                                            <div className={`w-2 h-2 rounded-full ${modoPincel === 'preferido' ? 'bg-amber-400' : 'bg-slate-300'}`}></div> Modo Preferido
                                                        </button>
                                                    </div>
                                                </div>
                                                {/* Leyenda */}
                                                <div className="flex items-center justify-between px-2">
                                                    <div className="flex items-center gap-5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 bg-hx-blue rounded-md flex items-center justify-center text-white shadow-sm shadow-hx-blue/20">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                            </div>
                                                            <span className="text-xs text-slate-600 font-bold">Disponible</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 bg-amber-400 rounded-md flex items-center justify-center text-white shadow-sm shadow-amber-400/20">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                            </div>
                                                            <span className="text-xs text-slate-600 font-bold">Preferido</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 bg-red-50 border border-red-100 rounded-md flex items-center justify-center text-red-400">
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                            </div>
                                                            <span className="text-xs text-slate-600 font-bold">No disponible</span>
                                                        </div>
                                                    </div>

                                                    <button onClick={() => setDispoAll(false)} className="bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-sm" title="Limpiar todo">
                                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    </button>
                                                </div>
                                        </div>
                                    </div>

                                    {/* Contenedor de Turnos para evitar desbordamiento */}
                                    {(() => {
                                        // Construir la lista de turnos a mostrar:
                                        // Si hay turnos del API úsalos, si no, extraer desde las disponibilidades/preferencias
                                        let turnosRender = turnos.length > 0 ? turnos : [];
                                        if (turnosRender.length === 0) {
                                            const allEntries = [...formDispo, ...formPreferencia];
                                            const idsUnicos = [...new Set(allEntries.map(x => x.id_turno))];
                                            turnosRender = idsUnicos.map(id => ({ id_turno: id, nombre: `Turno ${id}` }));
                                        }
                                        // Si aún no hay nada (nuevo docente sin datos), crear un turno genérico
                                        if (turnosRender.length === 0) {
                                            turnosRender = [{ id_turno: 1, nombre: 'Turno General' }];
                                        }
                                        return (
                                        <div className={`space-y-6 transition-all duration-300 ${esDisponibilidadTotal ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                                        {turnosRender.map(turno => {
                                            // Bloques del API para este turno
                                            const bloquesTurno = bloques.filter(b => b.id_turno === turno.id_turno);
                                            // Usar: bloques del API si existen, si no generar desde grado-dia-config
                                            const maxFromDispo = Math.max(
                                                ...formDispo.filter(x => x.id_turno === turno.id_turno).map(x => x.nro_bloque || 0),
                                                ...formPreferencia.filter(x => x.id_turno === turno.id_turno).map(x => x.nro_bloque || 0),
                                                0
                                            );
                                            const maxBloques = Math.max(maxFromDispo, maxBloquesDia);
                                            const bloquesRender = bloquesTurno.length > 0
                                                ? bloquesTurno
                                                : Array.from({ length: maxBloques }, (_, i) => ({ numero_bloque: i + 1, id_bloque: `temp-${turno.id_turno}-${i}` }));

                                            return (
                                                <div key={turno.id_turno} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-hx-blue"></div>
                                                        <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-widest">{turno.nombre}</h3>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <div className="min-w-full p-2 sm:p-4">
                                                            <table className="w-full border-collapse text-xs">
                                                                <thead>
                                                                    <tr>
                                                                        <th className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 bg-white border-r border-slate-100">Blq</th>
                                                                        {dias.map(d => <th key={d.id_dia} className="p-3 text-center text-[10px] font-black text-slate-600 bg-white min-w-[50px]">{d.nombre_dia?.slice(0, 3).toUpperCase() || d.nombre_dia}</th>)}

                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {bloquesRender.map((b, bi) => (
                                                                        <tr key={b.id_bloque} className={bi % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                                                                            <td className="p-3 text-sm font-black text-slate-400 whitespace-nowrap text-center bg-slate-50 border-r border-slate-100">
                                                                                {b.numero_bloque}
                                                                            </td>
                                                                            {dias.map(d => {
                                                                                const isDispo = formDispo.some(x => x.id_dia === d.id_dia && x.id_turno === turno.id_turno && x.nro_bloque === b.numero_bloque && x.id_sede === activeSede);
                                                                                const isPref = formPreferencia.some(x => x.id_dia === d.id_dia && x.id_turno === turno.id_turno && x.nro_bloque === b.numero_bloque && x.id_sede === activeSede);

                                                                                return (
                                                                                    <td
                                                                                        key={d.id_dia}
                                                                                        onClick={() => toggleDispo(d.id_dia, turno.id_turno, b.numero_bloque)}
                                                                                        className="p-2 text-center cursor-pointer"
                                                                                    >
                                                                                        <div className={`mx-auto w-10 h-8 rounded-xl flex items-center justify-center transition-colors border ${isPref
                                                                                                ? 'bg-amber-400 border-transparent shadow-md shadow-amber-400/20 text-white'
                                                                                                : isDispo
                                                                                                    ? 'bg-hx-blue border-transparent shadow-md shadow-hx-blue/20 text-white'
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
                                        );
                                    })()}

                                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                                        <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">Cancelar</button>
                                        <button disabled={guardando} onClick={handleGuardarDispo} className={`flex-1 py-3 bg-hx-blue hover:bg-hx-blue/90 text-white font-bold rounded-xl shadow-md transition-all ${guardando ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                                            {guardando ? 'Finalizando...' : 'Finalizar y Guardar'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

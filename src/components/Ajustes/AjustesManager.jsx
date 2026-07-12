import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function AjustesManager() {
    const [activeTab, setActiveTab] = useState('institucion');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');

    // --- State: Institución ---
    const [colegio, setColegio] = useState({ id_colegio: 1, nombre_colegio: '' });
    const [sedes, setSedes] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [newSede, setNewSede] = useState('');
    const [newTurno, setNewTurno] = useState('');

    // --- State: Organización ---
    const [dias, setDias] = useState([]);
    const [grados, setGrados] = useState([]);
    const [gradoDiaConfig, setGradoDiaConfig] = useState([]);
    const [newGrado, setNewGrado] = useState('');

    // --- State: Estructura ---
    const [secciones, setSecciones] = useState([]);
    const [seccionTurnos, setSeccionTurnos] = useState([]);
    const [newSeccionGrado, setNewSeccionGrado] = useState('');
    const [newSeccionSede, setNewSeccionSede] = useState('');
    const [newSeccionNombre, setNewSeccionNombre] = useState('');
    const [selectedSeccionId, setSelectedSeccionId] = useState('');
    const [selectedTurnoId, setSelectedTurnoId] = useState('');
    const [filtroSeccionGrado, setFiltroSeccionGrado] = useState('');
    const [filtroSeccionSede, setFiltroSeccionSede] = useState('');

    // --- State: Edición Visual ---
    const [isEditingColegio, setIsEditingColegio] = useState(false);
    const [editingSedeId, setEditingSedeId] = useState(null);
    const [editSedeValue, setEditSedeValue] = useState('');
    const [editingTurnoId, setEditingTurnoId] = useState(null);
    const [editTurnoValue, setEditTurnoValue] = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                colRes, sedesRes, turnosRes, diasRes, gradosRes,
                configRes, secRes, stRes
            ] = await Promise.all([
                fetch(`${API_BASE}/colegio`),
                fetch(`${API_BASE}/sedes`),
                fetch(`${API_BASE}/turnos`),
                fetch(`${API_BASE}/dias`),
                fetch(`${API_BASE}/grados`),
                fetch(`${API_BASE}/grado-dia-config`),
                fetch(`${API_BASE}/secciones`),
                fetch(`${API_BASE}/seccion-turno`)
            ]);

            if (colRes.ok) {
                const colData = await colRes.json();
                if (colData.length > 0) setColegio(colData[0]);
            }
            if (sedesRes.ok) setSedes(await sedesRes.json());
            if (turnosRes.ok) setTurnos(await turnosRes.json());

            if (diasRes.ok) {
                const dData = await diasRes.json();
                setDias(dData.sort((a, b) => a.orden - b.orden));
            }

            if (gradosRes.ok) {
                const gData = await gradosRes.json();
                setGrados(gData.sort((a, b) => a.numero - b.numero));
            }

            if (configRes.ok) setGradoDiaConfig(await configRes.json());
            if (secRes.ok) setSecciones(await secRes.json());
            if (stRes.ok) setSeccionTurnos(await stRes.json());

        } catch (err) {
            console.error(err);
            showToast("Error al cargar los datos.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ===== INSTITUCIÓN =====
    const handleUpdateColegio = async () => {
        try {
            await fetch(`${API_BASE}/colegio/${colegio.id_colegio}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_colegio: colegio.nombre_colegio })
            });
            showToast("Nombre guardado correctamente.");
        } catch (err) {
            showToast("Error al guardar.");
        }
    };

    const handleAddSede = async () => {
        if (!newSede.trim()) return;
        try {
            const res = await fetch(`${API_BASE}/sedes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_sede: newSede, id_colegio: colegio.id_colegio })
            });
            if (res.ok) {
                setNewSede('');
                fetchData();
                showToast("Sede añadida.");
            }
        } catch (err) { showToast("Error al añadir sede."); }
    };

    const handleUpdateSede = async (id) => {
        if (!editSedeValue.trim()) return;
        try {
            const res = await fetch(`${API_BASE}/sedes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_sede: editSedeValue })
            });
            if (res.ok) {
                setEditingSedeId(null);
                fetchData();
                showToast("Sede actualizada.");
            } else {
                showToast("Error al actualizar sede.");
            }
        } catch (err) { showToast("Error al actualizar sede."); }
    };

    const handleDeleteSede = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/sedes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
                showToast("Sede eliminada.");
            } else {
                showToast("No se puede eliminar (¿En uso?).");
            }
        } catch (err) { showToast("Error al eliminar sede."); }
    };

    const handleAddTurno = async () => {
        if (!newTurno.trim()) return;
        try {
            const res = await fetch(`${API_BASE}/turnos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: newTurno })
            });
            if (res.ok) {
                setNewTurno('');
                fetchData();
                showToast("Turno añadido.");
            }
        } catch (err) { showToast("Error al añadir turno."); }
    };

    const handleUpdateTurno = async (id) => {
        if (!editTurnoValue.trim()) return;
        try {
            const res = await fetch(`${API_BASE}/turnos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: editTurnoValue })
            });
            if (res.ok) {
                setEditingTurnoId(null);
                fetchData();
                showToast("Turno actualizado.");
            } else {
                showToast("Error al actualizar turno.");
            }
        } catch (err) { showToast("Error al actualizar turno."); }
    };

    const handleDeleteTurno = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/turnos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
                showToast("Turno eliminado.");
            } else {
                showToast("No se puede eliminar (¿En uso?).");
            }
        } catch (err) { showToast("Error al eliminar turno."); }
    };

    // ===== ORGANIZACIÓN =====
    const handleAddGrado = async () => {
        const num = parseInt(newGrado);
        if (isNaN(num)) return;
        try {
            const res = await fetch(`${API_BASE}/grados`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numero: num })
            });
            if (res.ok) {
                setNewGrado('');
                fetchData();
                showToast("Grado añadido.");
            }
        } catch (err) { showToast("Error al añadir grado."); }
    };

    const handleDeleteGrado = async (id) => {
        try {
            await fetch(`${API_BASE}/grados/${id}`, { method: 'DELETE' });
            fetchData();
            showToast("Grado eliminado.");
        } catch (err) { showToast("Error al eliminar grado."); }
    };

    const handleUpdateGradoDiaConfig = async (id_grado, id_dia, bloques_dia) => {
        const existing = gradoDiaConfig.find(c => c.id_grado === id_grado && c.id_dia === id_dia);
        try {
            if (existing) {
                if (bloques_dia === 0) {
                    await fetch(`${API_BASE}/grado-dia-config/${existing.id_config}`, { method: 'DELETE' });
                } else {
                    await fetch(`${API_BASE}/grado-dia-config/${existing.id_config}`, { method: 'DELETE' });
                    await fetch(`${API_BASE}/grado-dia-config`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_grado, id_dia, bloques_dia })
                    });
                }
            } else {
                if (bloques_dia > 0) {
                    await fetch(`${API_BASE}/grado-dia-config`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_grado, id_dia, bloques_dia })
                    });
                }
            }
            fetchData();
        } catch (err) { showToast("Error al guardar configuración."); }
    };

    // ===== ESTRUCTURA =====
    const handleAddSeccion = async () => {
        if (!newSeccionNombre.trim() || !newSeccionGrado || !newSeccionSede) return;
        try {
            const res = await fetch(`${API_BASE}/secciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: newSeccionNombre,
                    id_grado: parseInt(newSeccionGrado),
                    id_sede: parseInt(newSeccionSede)
                })
            });
            if (res.ok) {
                setNewSeccionNombre('');
                fetchData();
                showToast("Sección añadida.");
            }
        } catch (err) { showToast("Error al añadir sección."); }
    };

    const handleDeleteSeccion = async (id) => {
        try {
            await fetch(`${API_BASE}/secciones/${id}`, { method: 'DELETE' });
            fetchData();
            showToast("Sección eliminada.");
        } catch (err) { showToast("Error al eliminar sección."); }
    };

    const handleAssignTurno = async () => {
        if (!selectedSeccionId || !selectedTurnoId) return;
        try {
            // Eliminar turnos existentes para esta sección
            const existingSt = seccionTurnos.filter(st => st.id_seccion === parseInt(selectedSeccionId));
            for (let st of existingSt) {
                await fetch(`${API_BASE}/seccion-turno/${st.id_seccion_turno}`, { method: 'DELETE' });
            }

            const gradoId = secciones.find(s => s.id_seccion === parseInt(selectedSeccionId))?.id_grado;
            const primerDiaId = gradoDiaConfig.find(c => c.id_grado === gradoId && c.bloques_dia > 0)?.id_dia || dias[0]?.id_dia;

            await fetch(`${API_BASE}/seccion-turno`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_seccion: parseInt(selectedSeccionId),
                    id_turno: parseInt(selectedTurnoId),
                    id_dia: primerDiaId
                })
            });
            fetchData();
            showToast("Turno asignado correctamente.");
            setSelectedSeccionId('');
            setSelectedTurnoId('');
        } catch (err) { showToast("Error al asignar turno."); }
    };

    const TABS = [
        { id: 'institucion', label: 'Institución', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { id: 'organizacion', label: 'Organización', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { id: 'estructura', label: 'Estructura', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
    ];

    if (loading) return <div className="text-center p-10 font-bold text-slate-400">Cargando ajustes...</div>;

    return (
        <div className="w-full flex gap-8">
            {/* Sidebar Interno */}
            <div className="w-64 flex-shrink-0">
                <nav className="flex flex-col gap-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === tab.id
                                ? 'bg-[var(--color-brand-primary)] text-white shadow-md shadow-[var(--color-brand-primary)]/20'
                                : 'bg-white text-slate-500 hover:bg-slate-50 border border-transparent'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d={tab.icon}></path>
                            </svg>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Contenido Principal */}
            <div className="flex-1">
                {toast && (
                    <div className="fixed top-6 right-6 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-xl z-50 font-bold text-sm animate-fade-in-down">
                        {toast}
                    </div>
                )}

                {/* --- PESTAÑA INSTITUCIÓN --- */}
                {activeTab === 'institucion' && (
                    <div className="space-y-6 animate-fade-in-up">
                        {/* Nombre del Colegio */}
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 mb-4">Información Principal</h3>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre de la Institución</label>
                                    {isEditingColegio ? (
                                        <input
                                            type="text"
                                            value={colegio.nombre_colegio}
                                            onChange={e => setColegio({ ...colegio, nombre_colegio: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-[var(--color-brand-primary)]"
                                        />
                                    ) : (
                                        <div className="w-full bg-slate-50 border border-transparent text-slate-700 text-sm font-bold rounded-xl px-4 py-3">
                                            {colegio.nombre_colegio || "No definido"}
                                        </div>
                                    )}
                                </div>
                                {isEditingColegio ? (
                                    <button onClick={() => { handleUpdateColegio(); setIsEditingColegio(false); }} className="px-6 py-3 bg-[var(--color-brand-primary)] text-white font-bold text-sm rounded-xl hover:shadow-md transition-all">Guardar</button>
                                ) : (
                                    <button onClick={() => setIsEditingColegio(true)} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition-all">Editar</button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Sedes */}
                            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                                <h3 className="text-lg font-black text-slate-800 mb-4">Gestión de Sedes</h3>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text" placeholder="Nueva Sede..." value={newSede} onChange={e => setNewSede(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:border-[var(--color-brand-primary)]"
                                    />
                                    <button onClick={handleAddSede} className="px-4 py-2 bg-[var(--color-brand-primary)] text-white cursor-pointer font-bold text-sm rounded-xl">Agregar</button>
                                </div>
                                <ul className="space-y-2">
                                    {sedes.map(s => (
                                        <li key={s.id_sede} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                            {editingSedeId === s.id_sede ? (
                                                <input
                                                    type="text"
                                                    value={editSedeValue}
                                                    onChange={e => setEditSedeValue(e.target.value)}
                                                    className="flex-1 bg-white border border-slate-200 text-sm font-bold rounded-lg px-3 py-1.5 outline-none mr-3"
                                                />
                                            ) : (
                                                <span className="font-bold text-sm text-slate-700 flex-1">{s.nombre_sede}</span>
                                            )}
                                            <div className="flex gap-1">
                                                {editingSedeId === s.id_sede ? (
                                                    <button onClick={() => handleUpdateSede(s.id_sede)} className="text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] p-1 font-bold text-xs bg-[var(--color-brand-primary)]/10 rounded px-2">Guardar</button>
                                                ) : (
                                                    <button onClick={() => { setEditingSedeId(s.id_sede); setEditSedeValue(s.nombre_sede); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteSede(s.id_sede)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Turnos */}
                            <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                                <h3 className="text-lg font-black text-slate-800 mb-4">Gestión de Turnos</h3>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text" placeholder="Nuevo Turno..." value={newTurno} onChange={e => setNewTurno(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:border-[var(--color-brand-primary)]"
                                    />
                                    <button onClick={handleAddTurno} className="px-4 py-2 bg-[var(--color-brand-primary)] text-white font-bold text-sm rounded-xl cursor-pointer">Agregar</button>
                                </div>
                                <ul className="space-y-2">
                                    {turnos.map(t => (
                                        <li key={t.id_turno} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                                            {editingTurnoId === t.id_turno ? (
                                                <input
                                                    type="text"
                                                    value={editTurnoValue}
                                                    onChange={e => setEditTurnoValue(e.target.value)}
                                                    className="flex-1 bg-white border border-slate-200 text-sm font-bold rounded-lg px-3 py-1.5 outline-none mr-3"
                                                />
                                            ) : (
                                                <span className="font-bold text-sm text-slate-700 flex-1">{t.nombre}</span>
                                            )}
                                            <div className="flex gap-1">
                                                {editingTurnoId === t.id_turno ? (
                                                    <button onClick={() => handleUpdateTurno(t.id_turno)} className="text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] p-1 font-bold text-xs bg-[var(--color-brand-primary)]/10 rounded px-2">Guardar</button>
                                                ) : (
                                                    <button onClick={() => { setEditingTurnoId(t.id_turno); setEditTurnoValue(t.nombre); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteTurno(t.id_turno)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PESTAÑA ORGANIZACIÓN --- */}
                {activeTab === 'organizacion' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 mb-4">Configuración de Grados y Días</h3>
                            <div className="flex gap-2 mb-6 max-w-sm">
                                <input
                                    type="number" placeholder="Número de Grado (Ej: 1)" value={newGrado} onChange={e => setNewGrado(e.target.value)}
                                    className="flex-1 bg-slate-50 border border-slate-200 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:border-[var(--color-brand-primary)]"
                                />
                                <button onClick={handleAddGrado} className="px-4 py-2 bg-[var(--color-brand-primary)] text-white font-bold text-sm rounded-xl">Añadir Grado</button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="pb-3 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Grado</th>
                                            {dias.map(d => (
                                                <th key={d.id_dia} className="pb-3 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                    {d.nombre_dia.slice(0, 3)}
                                                </th>
                                            ))}
                                            <th className="pb-3 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {grados.map(g => (
                                            <tr key={g.id_grado} className="border-t border-slate-100">
                                                <td className="py-4 font-black text-slate-800 text-lg">{g.numero}°</td>
                                                {dias.map(d => {
                                                    const conf = gradoDiaConfig.find(c => c.id_grado === g.id_grado && c.id_dia === d.id_dia);
                                                    const bloques = conf ? conf.bloques_dia : 0;
                                                    return (
                                                        <td key={d.id_dia} className="py-4 px-2 text-center">
                                                            <input
                                                                type="number" min="0" max="15"
                                                                value={bloques}
                                                                onChange={(e) => handleUpdateGradoDiaConfig(g.id_grado, d.id_dia, parseInt(e.target.value) || 0)}
                                                                className="w-16 text-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-sm font-bold outline-none focus:border-[var(--color-brand-primary)] mx-auto"
                                                            />
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-4 text-right">
                                                    <button onClick={() => handleDeleteGrado(g.id_grado)} className="text-red-400 hover:text-red-600 font-bold text-sm flex items-center gap-1 justify-end ml-auto">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {grados.length === 0 && (
                                            <tr><td colSpan={dias.length + 2} className="py-8 text-center text-slate-400 font-medium">No hay grados registrados. Añade uno para configurar sus bloques.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- PESTAÑA ESTRUCTURA --- */}
                {activeTab === 'estructura' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 mb-4">Creación de Secciones</h3>
                            <div className="flex flex-wrap gap-4 mb-6">
                                <select value={newSeccionGrado} onChange={e => setNewSeccionGrado(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 outline-none">
                                    <option value="">Seleccione Grado</option>
                                    {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.numero}° Grado</option>)}
                                </select>
                                <select value={newSeccionSede} onChange={e => setNewSeccionSede(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 outline-none">
                                    <option value="">Seleccione Sede</option>
                                    {sedes.map(s => <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>)}
                                </select>
                                <input
                                    type="text" placeholder="Nombre (Ej: A, B, 1A)" value={newSeccionNombre} onChange={e => setNewSeccionNombre(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 outline-none w-48"
                                />
                                <button onClick={handleAddSeccion} className="px-6 py-2 bg-[var(--color-brand-primary)] text-white font-bold text-sm rounded-xl hover:shadow-md transition-all cursor-pointer">Añadir Sección</button>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6 shadow-sm">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Asignar Turno a Sección
                                </h4>
                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Seleccionar Sección</label>
                                        <select value={selectedSeccionId} onChange={e => setSelectedSeccionId(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none">
                                            <option value="">-- Elige una sección --</option>
                                            {secciones.map(sec => (
                                                <option key={sec.id_seccion} value={sec.id_seccion}>{sec.nombre} (Grado {grados.find(g => g.id_grado === sec.id_grado)?.numero})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="text-[11px] font-bold text-slate-500 mb-1.5 block">Seleccionar Turno</label>
                                        <select value={selectedTurnoId} onChange={e => setSelectedTurnoId(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none">
                                            <option value="">-- Elige un turno --</option>
                                            {turnos.map(t => (
                                                <option key={t.id_turno} value={t.id_turno}>{t.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button onClick={handleAssignTurno} disabled={!selectedSeccionId || !selectedTurnoId} className="px-6 py-2.5 bg-[var(--color-brand-primary)] disabled:opacity-50 text-white font-bold text-sm rounded-xl hover:shadow-md transition-all cursor-pointer">
                                        Asignar Turno
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-4 mt-8 pt-6 border-t border-slate-100">
                                <h3 className="text-lg font-black text-slate-800">Listado de Secciones</h3>
                                <div className="flex gap-2">
                                    <select value={filtroSeccionGrado} onChange={e => setFiltroSeccionGrado(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none">
                                        <option value="">Todos los Grados</option>
                                        {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.numero}° Grado</option>)}
                                    </select>
                                    <select value={filtroSeccionSede} onChange={e => setFiltroSeccionSede(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none">
                                        <option value="">Todas las Sedes</option>
                                        {sedes.map(s => <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {secciones.filter(sec => {
                                    const matchGrado = filtroSeccionGrado ? sec.id_grado === parseInt(filtroSeccionGrado) : true;
                                    const matchSede = filtroSeccionSede ? sec.id_sede === parseInt(filtroSeccionSede) : true;
                                    return matchGrado && matchSede;
                                }).map(sec => {
                                    const g = grados.find(x => x.id_grado === sec.id_grado);
                                    const s = sedes.find(x => x.id_sede === sec.id_sede);
                                    const st = seccionTurnos.find(x => x.id_seccion === sec.id_seccion);
                                    const turnoActual = st ? turnos.find(t => t.id_turno === st.id_turno)?.nombre : 'Sin Turno';

                                    return (
                                        <div key={sec.id_seccion} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between hover:shadow-sm transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-black text-slate-800 text-lg flex items-baseline gap-1.5">
                                                        {sec.nombre} 
                                                        <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">Grado {g?.numero}</span>
                                                    </h4>
                                                    <p className="text-xs font-bold text-slate-500 mt-0.5 flex items-center gap-1">
                                                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                        {s?.nombre_sede}
                                                    </p>
                                                </div>
                                                <button onClick={() => handleDeleteSeccion(sec.id_seccion)} className="text-red-400 hover:text-red-600 p-1 cursor-pointer bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                                                    Turno Asignado: <span className={st ? "text-[var(--color-brand-primary)]" : "text-slate-400"}>{turnoActual}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {secciones.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        No hay secciones creadas todavía.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
                .animate-fade-in-down { animation: fadeInDown 0.4s ease-out forwards; }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

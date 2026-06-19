import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function BloquesReservadosManager() {
    const [status, setStatus] = useState('loading');
    const [sedes, setSedes] = useState([]);
    const [dias, setDias] = useState([]);
    const [turnos, setTurnos] = useState([]);
    const [grados, setGrados] = useState([]);
    const [gradoDiaConfigs, setGradoDiaConfigs] = useState([]);
    const [reservas, setReservas] = useState([]);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        id_sede: '',
        id_dia: '',
        id_turno: '',
        nombre_actividad: '',
        grados: [],
        opciones_slots: [ [] ]
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [rSedes, rDias, rTurnos, rGrados, rConfig, rReservas] = await Promise.all([
                fetch(`${API_BASE}/sedes`),
                fetch(`${API_BASE}/dias`),
                fetch(`${API_BASE}/turnos`),
                fetch(`${API_BASE}/grados`),
                fetch(`${API_BASE}/grado-dia-config`),
                fetch(`${API_BASE}/bloque-reservado`)
            ]);

            setSedes(rSedes.ok ? await rSedes.json() : []);
            setDias(rDias.ok ? await rDias.json() : []);
            setTurnos(rTurnos.ok ? await rTurnos.json() : []);
            setGrados(rGrados.ok ? await rGrados.json() : []);
            setGradoDiaConfigs(rConfig.ok ? await rConfig.json() : []);
            setReservas(rReservas.ok ? await rReservas.json() : []);
            
            setStatus('ready');
        } catch (error) {
            console.error("Error cargando datos:", error);
            setStatus('error');
        }
    };

    const handleOpenModal = () => {
        setFormData({
            id_sede: sedes.length > 0 ? sedes[0].id_sede : '',
            id_dia: dias.length > 0 ? dias[0].id_dia : '',
            id_turno: turnos.length > 0 ? turnos[0].id_turno : '',
            nombre_actividad: '',
            grados: [],
            opciones_slots: [ [] ]
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const toggleGrado = (id_grado) => {
        setFormData(prev => {
            const exists = prev.grados.includes(id_grado);
            return {
                ...prev,
                grados: exists ? prev.grados.filter(g => g !== id_grado) : [...prev.grados, id_grado]
            };
        });
    };

    const handleAddOpcion = () => {
        setFormData({
            ...formData,
            opciones_slots: [...formData.opciones_slots, []]
        });
    };

    const handleRemoveOpcion = (opIdx) => {
        const newOps = formData.opciones_slots.filter((_, i) => i !== opIdx);
        setFormData({ ...formData, opciones_slots: newOps });
    };



    const handleSave = async () => {
        if (!formData.id_sede || !formData.id_dia || !formData.id_turno) {
            alert("Debes seleccionar Sede, Día y Turno.");
            return;
        }
        if (!formData.nombre_actividad.trim()) {
            alert("Debes ingresar el nombre de la actividad.");
            return;
        }
        if (formData.grados.length === 0) {
            alert("Debes seleccionar al menos un grado.");
            return;
        }
        if (formData.opciones_slots.length === 0 || formData.opciones_slots.some(op => op.length === 0)) {
            alert("Todas las opciones deben tener al menos un bloque asignado.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                id_sede: parseInt(formData.id_sede),
                id_dia: parseInt(formData.id_dia),
                id_turno: parseInt(formData.id_turno),
                nombre: formData.nombre_actividad.trim(),
                grados: formData.grados.map(g => parseInt(g)),
                opciones: formData.opciones_slots.map((slots, i) => ({
                    nro_opcion: i + 1,
                    nombre: formData.nombre_actividad.trim(),
                    slots: slots
                }))
            };
            const res = await fetch(`${API_BASE}/bloque-reservado-completo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                await fetchInitialData();
                setIsModalOpen(false);
            } else {
                const err = await res.text();
                alert("Error al guardar: " + err);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Seguro que deseas eliminar este bloque reservado?")) return;
        try {
            const res = await fetch(`${API_BASE}/bloque-reservado/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await fetchInitialData();
            } else {
                alert("Error al eliminar.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getNombreSede = id => sedes.find(s => s.id_sede === id)?.nombre_sede || id;
    const getNombreDia = id => dias.find(d => d.id_dia === id)?.nombre_dia || id;
    const getNombreTurno = id => turnos.find(t => t.id_turno === id)?.nombre || id;
    const getNumeroGrado = id => grados.find(g => g.id_grado === id)?.numero || id;

    // --- Dynamic Blocks Calculation ---
    const maxBloques = React.useMemo(() => {
        if (!formData.id_dia || formData.grados.length === 0 || gradoDiaConfigs.length === 0) return 0;
        const configs = gradoDiaConfigs.filter(c => 
            c.id_dia === parseInt(formData.id_dia) && 
            formData.grados.includes(c.id_grado)
        );
        if (configs.length === 0) return 0;
        return Math.max(...configs.map(c => c.bloques_dia || 0));
    }, [formData.id_dia, formData.grados, gradoDiaConfigs]);

    // --- Métricas para el panel derecho ---
    const totalReservas = reservas.length;
    const totalHorasBloqueadas = reservas.reduce((acc, r) => acc + r.opciones.reduce((sum, op) => sum + op.slots.length, 0), 0);

    if (status === 'loading') return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-hx-purple/30 border-t-hx-purple rounded-full animate-spin"></div></div>;

    return (
        <div className="w-full space-y-8 animate-fade-in relative pb-10">

            {/* Cabecera Superior (Banner + Espacio Derecho) */}
            <div className="flex flex-col md:flex-row gap-6">

                <div className="md:w-2/3 bg-[var(--color-hx-purple)]/10 rounded-[24px] p-8 shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px] border border-[var(--color-hx-purple)]/70">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                        <div className="max-w-md">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                                Bloques Especiales
                            </h2>
                            <p className="text-slate-500 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Reserva bloques de horario que serán compartidos entre múltiples grados, ideal para talleres, electivos o actividades conjuntas.
                            </p>

                            <button
                                onClick={handleOpenModal}
                                className="bg-hx-purple text-white hover:bg-hx-purple/80 font-extrabold py-2.5 px-6 rounded-xl shadow-[0_4px_12px_rgba(121,14,236,0.3)] hover:shadow-[0_6px_16px_rgba(121,14,236,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm w-max cursor-pointer"
                            >
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                Crear Nuevo Bloque
                            </button>
                        </div>

                        {/* Imagen Ilustrativa a la derecha */}
                        <div className="hidden sm:flex relative w-32 h-32 md:w-45 md:h-45 flex-shrink-0 items-center justify-center -mt-2 md:mr-8">
                            <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl"></div>
                            <img
                                src="/imagen.svg"
                                alt="Ilustración"
                                className="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)] hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Panel de Información (Derecha) */}
                <div className="md:w-1/3 bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] flex flex-col p-6 min-h-[180px] relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-1">Total Reservas</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{totalReservas}</h3>
                                <span className="text-slate-400 text-sm font-bold">bloques</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-[14px] bg-hx-purple/10 text-hx-purple flex items-center justify-center border border-hx-purple/20 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3 mt-4 mb-2">
                        <div className="rounded-xl p-3 flex flex-col justify-center shadow-sm overflow-hidden bg-slate-50 border border-slate-100">
                            <p className="text-hx-purple text-[10px] font-black uppercase tracking-widest mb-1 truncate">Horas Bloqueadas</p>
                            <div className="flex flex-col mt-1">
                                <span className="text-2xl font-black text-slate-800 leading-tight truncate">
                                    {totalHorasBloqueadas}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de Bloques */}
            <div className="pt-4">
                {reservas.length === 0 ? (
                    <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-[32px] p-16 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <svg width="32" height="32" fill="none" stroke="#cbd5e1" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-800">No hay bloques especiales</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                            Comienza creando tu primer bloque reservado usando el botón en la cabecera superior.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {reservas.map(r => (
                            <div key={r.id_bloque_reservado} className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 relative group overflow-hidden flex flex-col">
                                {/* Decoración superior según turno */}
                                <div className={`h-2 w-full ${r.id_turno === 1 ? 'bg-amber-400' : 'bg-indigo-500'}`}></div>
                                
                                <button 
                                    onClick={() => handleDelete(r.id_bloque_reservado)}
                                    className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white border border-slate-100 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm hover:border-red-500 z-10"
                                    title="Eliminar Reserva"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                                
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-[var(--color-hx-purple)] flex items-center justify-center border border-purple-100 shadow-sm shrink-0">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-[18px] font-black text-slate-800 leading-tight">
                                                {r.nombre || "Actividad Especial"}
                                            </h3>
                                            <p className="text-xs font-bold text-slate-400 mt-0.5">
                                                {getNombreDia(r.id_dia)} • {getNombreTurno(r.id_turno)} • Sede {getNombreSede(r.id_sede)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-5 flex-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Grados Involucrados</p>
                                        <div className="flex flex-wrap gap-2">
                                            {r.grados.map(gid => (
                                                <span key={gid} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px] font-black border border-slate-200 shadow-sm">
                                                    {getNumeroGrado(gid)}°
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200/60 pb-2">Configuración de Grupos</p>
                                        <div className="flex flex-col gap-3">
                                            {r.opciones.map(op => (
                                                <div key={op.id_bloque_opcion} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-hx-purple"></div>
                                                        <span className="font-bold text-slate-700 text-xs">Alternativa {op.nro_opcion}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {op.slots.sort((a, b) => a - b).map((s, i) => (
                                                            <span key={i} className="px-2 py-0.5 rounded bg-[var(--color-hx-purple)] text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                                                                B{s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Único Organizado */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[32px]">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nuevo Bloque Especial</h2>
                                <p className="text-slate-500 font-medium text-sm mt-1">Configura los parámetros para este bloque compartido.</p>
                            </div>
                            <button onClick={handleCloseModal} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Body scrollable */}
                        <div className="p-8 overflow-y-auto flex-1 flex flex-col gap-8">
                            
                            {/* A. Datos Generales */}
                            <div className="bg-white">
                                <h3 className="text-sm font-black text-[var(--color-hx-purple)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center">1</span>
                                    Datos Generales
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">Sede</label>
                                        <select 
                                            value={formData.id_sede} onChange={e => setFormData({...formData, id_sede: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-2.5 outline-none focus:border-hx-purple"
                                        >
                                            {sedes.map(s => <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">Día</label>
                                        <select 
                                            value={formData.id_dia} onChange={e => setFormData({...formData, id_dia: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-2.5 outline-none focus:border-hx-purple"
                                        >
                                            {dias.map(d => <option key={d.id_dia} value={d.id_dia}>{d.nombre_dia}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">Turno</label>
                                        <select 
                                            value={formData.id_turno} onChange={e => setFormData({...formData, id_turno: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl px-4 py-2.5 outline-none focus:border-hx-purple"
                                        >
                                            {turnos.map(t => <option key={t.id_turno} value={t.id_turno}>{t.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* B. Grados */}
                            <div className="bg-white">
                                <h3 className="text-sm font-black text-[var(--color-hx-purple)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center">2</span>
                                    Grados Participantes
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {grados.map(g => {
                                        const isSelected = formData.grados.includes(g.id_grado);
                                        return (
                                            <button
                                                key={g.id_grado}
                                                onClick={() => toggleGrado(g.id_grado)}
                                                className={`px-4 py-2 rounded-xl font-black text-sm transition-all flex items-center gap-2 border-2 ${
                                                    isSelected 
                                                    ? 'bg-[var(--color-hx-purple)] border-[var(--color-hx-purple)] text-white shadow-md' 
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                                }`}
                                            >
                                                {isSelected && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                {g.numero}° Grado
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* C. Configuración de Grupos y Horas */}
                            <div className="bg-white">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                    <h3 className="text-sm font-black text-[var(--color-hx-purple)] uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center">3</span>
                                        Grupos y Horas (Bloques)
                                    </h3>
                                    <button 
                                        onClick={handleAddOpcion}
                                        className="text-xs font-black text-[var(--color-hx-purple)] bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1 shadow-sm border border-purple-100"
                                    >
                                        + Añadir Alternativa de Horario
                                    </button>
                                </div>
                                
                                <div className="mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                                    <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-widest flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Nombre de la Actividad General
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.nombre_actividad}
                                        onChange={(e) => setFormData({...formData, nombre_actividad: e.target.value})}
                                        placeholder="Ej: Examen de Matemática, Taller de Arte..."
                                        className="w-full text-lg font-black text-slate-800 bg-white border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-hx-purple focus:ring-2 focus:ring-purple-100 placeholder:text-slate-300 transition-all shadow-sm"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2 font-medium">
                                        Este nombre se aplicará a todas las alternativas de horario que configures a continuación.
                                    </p>
                                </div>

                                <div className="relative pl-2 sm:pl-6">
                                    {/* Timeline Connector */}
                                    {formData.opciones_slots.length > 1 && (
                                        <div className="absolute left-6 sm:left-10 top-8 bottom-8 w-[2px] bg-slate-200 z-0 rounded-full"></div>
                                    )}
                                    
                                    <div className="space-y-6">

                                        {formData.opciones_slots.map((op, opIdx) => (
                                            <div key={opIdx} className="relative z-10">
                                                {/* "O" Badge */}
                                                {opIdx > 0 && (
                                                    <div className="absolute -top-4 -left-[14px] sm:-left-[14px] w-7 h-7 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 z-20 shadow-sm">
                                                        O
                                                    </div>
                                                )}
                                                
                                                <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-sm relative hover:border-purple-200 transition-all ml-4 sm:ml-0">
                                                    {formData.opciones_slots.length > 1 && (
                                                        <button 
                                                            onClick={() => handleRemoveOpcion(opIdx)}
                                                            className="absolute -top-3 -right-3 w-8 h-8 bg-white border-2 border-slate-100 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 hover:border-red-200 transition-all"
                                                            title="Eliminar esta alternativa"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                    
                                                    <div className="flex flex-col sm:flex-row gap-5">
                                                        <div className="flex flex-row sm:flex-col items-center sm:items-start gap-3 sm:w-1/4 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
                                                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-hx-purple font-black flex items-center justify-center text-lg border border-purple-100 shadow-sm">
                                                                {opIdx + 1}
                                                            </div>
                                                            <div>
                                                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Alternativa</span>
                                                                <span className="text-xs font-bold text-slate-500">De horario</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex-1 pt-1 sm:pt-0">
                                                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                Selecciona los bloques a reservar:
                                                            </label>
                                                            
                                                            {maxBloques === 0 ? (
                                                                <div className="w-full bg-amber-50 text-amber-600 p-4 rounded-xl border border-amber-200 text-sm font-bold flex items-center gap-2">
                                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                                    No hay bloques configurados.
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-2.5">
                                                                    {Array.from({ length: maxBloques }, (_, i) => i + 1).map(num => {
                                                                        const isSelected = op.includes(num);
                                                                return (
                                                                    <button
                                                                        key={num}
                                                                        onClick={() => {
                                                                            const newOps = [...formData.opciones_slots];
                                                                            if (isSelected) {
                                                                                newOps[opIdx] = newOps[opIdx].filter(s => s !== num);
                                                                            } else {
                                                                                newOps[opIdx] = [...newOps[opIdx], num].sort((a,b)=>a-b);
                                                                            }
                                                                            setFormData({ ...formData, opciones_slots: newOps });
                                                                        }}
                                                                        className={`w-10 h-10 rounded-xl font-black text-sm transition-all border-2 ${
                                                                            isSelected 
                                                                            ? 'bg-[var(--color-hx-purple)] border-[var(--color-hx-purple)] text-white shadow-md scale-105' 
                                                                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-100'
                                                                        }`}
                                                                    >
                                                                        {num}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                    
                                                    {op.length === 0 && maxBloques > 0 && (
                                                        <p className="text-[10px] text-amber-500 font-bold mt-3 flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-lg inline-flex">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                            Selecciona al menos un bloque.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-slate-100 bg-white rounded-b-[32px] flex justify-end gap-3">
                            <button 
                                onClick={handleCloseModal}
                                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-8 py-3 bg-[var(--color-hx-purple)] text-white font-black rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Bloque'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

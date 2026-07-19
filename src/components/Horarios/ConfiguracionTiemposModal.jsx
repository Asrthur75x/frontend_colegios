import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function ConfiguracionTiemposModal({ isOpen, onClose, maxBloques, maxBloquesPorTurno = {}, onSave, inline = false, initialTurnoId = null, disabledTurnoIds = [] }) {
    const [turnos, setTurnos] = useState([]);
    const [selectedTurno, setSelectedTurno] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Guardamos la configuración de *todos* los turnos en un solo estado
    // configs[id_turno] = { horaInicio: '08:00', duracionBloque: '45', recreos: [] }
    const [configs, setConfigs] = useState({});
    const [configMode, setConfigMode] = useState('general');
    const [customBlocks, setCustomBlocks] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [turnosRes, bloquesRes] = await Promise.all([
                fetch(`${API_BASE}/turnos`),
                fetch(`${API_BASE}/bloques`)
            ]);
            
            let turnosData = await turnosRes.json();
            let bloquesData = await bloquesRes.json();
            
            if (!Array.isArray(turnosData)) turnosData = turnosData.data || [];
            if (!Array.isArray(bloquesData)) bloquesData = bloquesData.data || [];
            
            setTurnos(turnosData);
            
            if (turnosData.length > 0) {
                // Pre-llenamos el estado de config para cada turno
                const initialConfigs = {};
                turnosData.forEach(turno => {
                    const idTurno = turno.id_turno;
                    const bloquesTurno = bloquesData.filter(b => b.id_turno === idTurno);
                    
                    if (bloquesTurno.length === 0) {
                        initialConfigs[idTurno] = { horaInicio: '', duracionBloque: '', recreos: [] };
                    } else {
                        const bloque1 = bloquesTurno.find(b => b.numero_bloque === 1 && !b.es_recreo);
                        let hora = '';
                        let dur = '';
                        if (bloque1) {
                            hora = bloque1.hora_inicio?.substring(0, 5) || '';
                            dur = bloque1.duracion_minutos ? String(bloque1.duracion_minutos) : '';
                        }
                        
                        const recreosDb = bloquesTurno
                            .filter(b => b.es_recreo)
                            .map(r => ({
                                id_bloque: r.id_bloque,
                                despuesDeBloque: r.despues_de_bloque || 1,
                                duracion: String(r.duracion_minutos || 15)
                            }));
                        
                        initialConfigs[idTurno] = { horaInicio: hora, duracionBloque: dur, recreos: recreosDb };
                    }
                });
                
                setConfigs(initialConfigs);
                const turnoEstaBloqueado = idTurno => disabledTurnoIds.some(id => String(id) === String(idTurno));
                const initialId = turnosData.some(t => t.id_turno === initialTurnoId && !turnoEstaBloqueado(t.id_turno))
                    ? initialTurnoId
                    : turnosData.find(t => !turnoEstaBloqueado(t.id_turno))?.id_turno || null;
                setSelectedTurno(initialId);

                const personalizedConfigs = {};
                turnosData.forEach(turno => {
                    const clasesTurno = bloquesData
                        .filter(b => b.id_turno === turno.id_turno && !b.es_recreo)
                        .sort((a, b) => a.numero_bloque - b.numero_bloque);
                    personalizedConfigs[turno.id_turno] = clasesTurno.length > 0
                        ? clasesTurno.map(b => ({
                            id_bloque: b.id_bloque,
                            numero_bloque: b.numero_bloque,
                            hora_inicio: b.hora_inicio?.substring(0, 5) || '',
                            hora_final: b.hora_final?.substring(0, 5) || ''
                        }))
                        : Array.from({ length: maxBloquesPorTurno[turno.id_turno] || maxBloques || 12 }, (_, index) => ({
                            id_bloque: null,
                            numero_bloque: index + 1,
                            hora_inicio: '',
                            hora_final: ''
                        }));
                });
                setCustomBlocks(personalizedConfigs);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTurnoChange = (idTurno) => {
        if (disabledTurnoIds.some(id => String(id) === String(idTurno))) return;
        setSelectedTurno(idTurno);
    };

    if (!isOpen) return null;

    // Obtener la configuración actual (si no existe, valores por defecto seguros)
    const currentConfig = configs[selectedTurno] || { horaInicio: '', duracionBloque: '', recreos: [] };
    const selectedTurnoData = turnos.find(turno => String(turno.id_turno) === String(selectedTurno));
    const totalBloquesTurno = customBlocks[selectedTurno]?.length || maxBloquesPorTurno[selectedTurno] || maxBloques || 0;

    // Funciones para actualizar la configuración del turno seleccionado
    const setHoraInicio = (val) => {
        setConfigs(prev => {
            const current = prev[selectedTurno] || { horaInicio: '', duracionBloque: '', recreos: [] };
            return { ...prev, [selectedTurno]: { ...current, horaInicio: val } };
        });
    };

    const setDuracionBloque = (val) => {
        setConfigs(prev => {
            const current = prev[selectedTurno] || { horaInicio: '', duracionBloque: '', recreos: [] };
            return { ...prev, [selectedTurno]: { ...current, duracionBloque: val } };
        });
    };

    const addRecreo = () => {
        setConfigs(prev => {
            const current = prev[selectedTurno] || { horaInicio: '', duracionBloque: '', recreos: [] };
            return {
                ...prev,
                [selectedTurno]: { ...current, recreos: [...current.recreos, { despuesDeBloque: 1, duracion: '' }] }
            };
        });
    };

    const updateRecreo = (index, field, value) => {
        const recreoActualizado = { ...currentConfig.recreos[index], [field]: value };
        setConfigs(prev => {
            const current = prev[selectedTurno] || { horaInicio: '', duracionBloque: '', recreos: [] };
            const newRecreos = [...current.recreos];
            newRecreos[index] = recreoActualizado;
            return {
                ...prev,
                [selectedTurno]: { ...current, recreos: newRecreos }
            };
        });
        if (configMode === 'personalizada' && recreoActualizado) {
            syncNextBlockStart(recreoActualizado.despuesDeBloque, recreoActualizado.duracion);
        }
    };

    const removeRecreo = (index) => {
        const recreoEliminado = currentConfig.recreos[index];
        setConfigs(prev => {
            const current = prev[selectedTurno] || { horaInicio: '', duracionBloque: '', recreos: [] };
            return {
                ...prev,
                [selectedTurno]: { ...current, recreos: current.recreos.filter((_, i) => i !== index) }
            };
        });
        if (configMode === 'personalizada' && recreoEliminado) {
            syncNextBlockStart(recreoEliminado.despuesDeBloque, 0);
        }
    };

    const updateCustomBlock = (index, field, value) => {
        setCustomBlocks(prev => {
            const turnoBlocks = [...(prev[selectedTurno] || [])];
            turnoBlocks[index] = { ...turnoBlocks[index], [field]: value };
            if (field === 'hora_final' && turnoBlocks[index + 1]) {
                const recreo = currentConfig.recreos.find(item => Number(item.despuesDeBloque) === Number(turnoBlocks[index].numero_bloque));
                const siguienteInicio = recreo && Number(recreo.duracion) > 0
                    ? addMinutesToTime(value, Number(recreo.duracion))
                    : value;
                turnoBlocks[index + 1] = { ...turnoBlocks[index + 1], hora_inicio: siguienteInicio };
            }
            return { ...prev, [selectedTurno]: turnoBlocks };
        });
    };

    const syncNextBlockStart = (despuesDeBloque, duracion) => {
        setCustomBlocks(prev => {
            const turnoBlocks = [...(prev[selectedTurno] || [])];
            const bloqueIndex = turnoBlocks.findIndex(bloque => Number(bloque.numero_bloque) === Number(despuesDeBloque));
            if (bloqueIndex < 0 || !turnoBlocks[bloqueIndex + 1] || !turnoBlocks[bloqueIndex].hora_final) return prev;
            const siguienteInicio = Number(duracion) > 0
                ? addMinutesToTime(turnoBlocks[bloqueIndex].hora_final, Number(duracion))
                : turnoBlocks[bloqueIndex].hora_final;
            turnoBlocks[bloqueIndex + 1] = { ...turnoBlocks[bloqueIndex + 1], hora_inicio: siguienteInicio };
            return { ...prev, [selectedTurno]: turnoBlocks };
        });
    };

    const getDurationMinutes = (start, end) => {
        if (!start || !end) return null;
        const [startHour, startMinute] = start.split(':').map(Number);
        const [endHour, endMinute] = end.split(':').map(Number);
        return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    };

    const addMinutesToTime = (time, minutes) => {
        const [hour, minute] = time.split(':').map(Number);
        const total = (hour * 60 + minute + Number(minutes)) % (24 * 60);
        return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    };

    const handleSave = async () => {
        try {
            if (configMode === 'personalizada') {
                const turnoBlocks = customBlocks[selectedTurno] || [];
                const invalidBlock = turnoBlocks.find(b => !b.hora_inicio || !b.hora_final || b.hora_inicio >= b.hora_final);
                if (invalidBlock) {
                    alert(`Revisa las horas del bloque ${invalidBlock.numero_bloque}.`);
                    return;
                }

                const recreos = currentConfig.recreos || [];
                const invalidRecreo = recreos.find(recreo => {
                    const despuesDe = Number(recreo.despuesDeBloque);
                    return !turnoBlocks.some(bloque => bloque.numero_bloque === despuesDe) || Number(recreo.duracion) <= 0;
                });
                const posicionesRecreo = recreos.map(recreo => Number(recreo.despuesDeBloque));
                if (invalidRecreo || new Set(posicionesRecreo).size !== posicionesRecreo.length) {
                    alert('Revisa la ubicación y duración de los recreos. Solo puede haber uno después de cada bloque.');
                    return;
                }

                for (const bloque of turnoBlocks) {
                    const payload = {
                        id_turno: selectedTurno,
                        numero_bloque: bloque.numero_bloque,
                        hora_inicio: bloque.hora_inicio,
                        hora_final: bloque.hora_final,
                        es_recreo: false,
                        duracion_minutos: getDurationMinutes(bloque.hora_inicio, bloque.hora_final)
                    };
                    const response = await fetch(
                        bloque.id_bloque ? `${API_BASE}/bloques/${bloque.id_bloque}` : `${API_BASE}/bloques`,
                        {
                            method: bloque.id_bloque ? 'PUT' : 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        }
                    );
                    if (!response.ok) throw new Error(`No se pudo guardar el bloque ${bloque.numero_bloque}.`);
                }

                for (const recreo of recreos) {
                    const despuesDeBloque = Number(recreo.despuesDeBloque);
                    const duracion = Number(recreo.duracion);
                    const bloqueAnterior = turnoBlocks.find(bloque => bloque.numero_bloque === despuesDeBloque);
                    const horaInicio = bloqueAnterior.hora_final;
                    const payload = {
                        id_turno: selectedTurno,
                        numero_bloque: null,
                        hora_inicio: horaInicio,
                        hora_final: addMinutesToTime(horaInicio, duracion),
                        es_recreo: true,
                        despues_de_bloque: despuesDeBloque,
                        duracion_minutos: duracion
                    };
                    const response = await fetch(`${API_BASE}/bloques`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (!response.ok) throw new Error(`No se pudo guardar el recreo después del bloque ${despuesDeBloque}.`);
                }
            } else {
                const conf = configs[selectedTurno];
                if (!conf) return;
                const payload = {
                    horaInicio: conf.horaInicio || '08:00',
                    duracionBloque: parseInt(conf.duracionBloque) || 45,
                    recreos: conf.recreos.map(r => ({
                        despuesDeBloque: parseInt(r.despuesDeBloque) || 1,
                        duracion: parseInt(r.duracion) || 15
                    }))
                };

                const response = await fetch(`${API_BASE}/configurar-tiempos/${selectedTurno}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) throw new Error('No se pudo guardar la configuración general.');
            }
            
            // Recargar datos y notificar
            window.dispatchEvent(new Event('edusync_time_config_changed'));
            if (onSave) {
                await onSave();
            } else {
                onClose();
            }
        } catch (error) {
            console.error("Error saving time config:", error);
            alert("Error al guardar la configuración");
        }
    };

    return (
        <div className={inline
            ? 'w-full animate-fade-in-up'
            : 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in'}>
            <div className={`bg-white rounded-3xl overflow-hidden flex flex-col ${inline
                ? 'w-full border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                : 'shadow-2xl w-full max-w-lg max-h-[90vh]'}`}>
                <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Editar configuración de horas</h2>
                        {inline && <p className="text-[12px] text-slate-400 font-semibold mt-1">Configura las horas del turno.</p>}
                    </div>
                    <button type="button" onClick={onClose} className={`transition-colors cursor-pointer ${inline ? 'px-3 py-2 rounded-xl flex items-center gap-2 text-[12px] font-black text-brand-primary hover:text-[var(--color-brand-dark)] hover:bg-[var(--color-brand-light)]' : 'p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                        {inline ? (
                            <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> Volver al horario</>
                        ) : (
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        )}
                    </button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto flex-1 flex flex-col gap-8 bg-white">
                    {/* Selector de Turno */}
                    {turnos.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-7 h-7 rounded-lg bg-[var(--color-brand-light)] text-brand-primary flex items-center justify-center text-[11px] font-black">1</span>
                                <h3 className="text-[13px] font-black text-slate-800">Selecciona el turno</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {turnos.map(turno => (
                                    <button
                                        key={turno.id_turno}
                                        type="button"
                                        onClick={() => handleTurnoChange(turno.id_turno)}
                                        disabled={disabledTurnoIds.some(id => String(id) === String(turno.id_turno))}
                                        title={disabledTurnoIds.some(id => String(id) === String(turno.id_turno)) ? 'Este turno ya tiene una configuración' : `Configurar turno ${turno.nombre}`}
                                        className={`min-w-[110px] py-2.5 px-4 rounded-xl border text-[12px] font-black transition-all cursor-pointer ${
                                            String(selectedTurno) === String(turno.id_turno)
                                            ? 'bg-brand-primary border-brand-primary text-white shadow-md'
                                            : disabledTurnoIds.some(id => String(id) === String(turno.id_turno))
                                            ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-brand-primary/40'
                                        }`}
                                    >
                                        {turno.nombre}{disabledTurnoIds.some(id => String(id) === String(turno.id_turno)) ? ' · Configurado' : ''}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {isLoading ? (
                        <div className="py-10 text-center text-slate-400 font-bold text-sm">Cargando...</div>
                    ) : (
                        <>
                            <section className="border-t border-slate-100 pt-7">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="w-7 h-7 rounded-lg bg-[var(--color-brand-light)] text-brand-primary flex items-center justify-center text-[11px] font-black">2</span>
                                    <h3 className="text-[13px] font-black text-slate-800">Tipo de configuración</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setConfigMode('general')}
                                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${configMode === 'general'
                                            ? 'border-brand-primary bg-[var(--color-brand-light)]'
                                            : 'border-slate-200 bg-white hover:border-brand-primary/40'}`}
                                    >
                                        <span className={`block text-[13px] font-black ${configMode === 'general' ? 'text-brand-primary' : 'text-slate-700'}`}>Configuración general</span>
                                        <span className="block text-[11px] text-slate-400 font-semibold mt-1">Misma duración para todos.</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfigMode('personalizada')}
                                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${configMode === 'personalizada'
                                            ? 'border-brand-primary bg-[var(--color-brand-light)]'
                                            : 'border-slate-200 bg-white hover:border-brand-primary/40'}`}
                                    >
                                        <span className={`block text-[13px] font-black ${configMode === 'personalizada' ? 'text-brand-primary' : 'text-slate-700'}`}>Horario personalizado</span>
                                        <span className="block text-[11px] text-slate-400 font-semibold mt-1">Horas distintas por bloque.</span>
                                    </button>
                                </div>
                            </section>

                            {configMode === 'general' ? (
                                <>
                                    <section className="border-t border-slate-100 pt-7">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="w-7 h-7 rounded-lg bg-[var(--color-brand-light)] text-brand-primary flex items-center justify-center text-[11px] font-black">3</span>
                                            <h3 className="text-[13px] font-black text-slate-800">Define la jornada</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hora inicial</label>
                                                <input
                                                    key={`time-${selectedTurno}`}
                                                    type="time"
                                                    value={currentConfig.horaInicio}
                                                    onChange={e => setHoraInicio(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[14px] font-bold rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-brand-primary transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duración de cada bloque</label>
                                                <div className="relative">
                                                    <input
                                                        key={`dur-${selectedTurno}`}
                                                        type="number"
                                                        value={currentConfig.duracionBloque}
                                                        onChange={e => setDuracionBloque(e.target.value)}
                                                        min="1"
                                                        placeholder="Ej: 45"
                                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[14px] font-bold rounded-xl pl-4 pr-16 py-3 outline-none focus:bg-white focus:border-brand-primary transition-all placeholder:text-slate-300 placeholder:font-normal"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">minutos</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="border-t border-slate-100 pt-7 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-lg bg-[var(--color-brand-light)] text-brand-primary flex items-center justify-center text-[11px] font-black">4</span>
                                                <h3 className="text-[13px] font-black text-slate-800">Organiza los recreos</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addRecreo}
                                                className="text-[11px] font-black text-white bg-brand-primary hover:bg-[var(--color-brand-dark)] px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                                            >
                                                + Añadir recreo
                                            </button>
                                        </div>

                                        {currentConfig.recreos.length === 0 ? (
                                            <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                                <p className="text-[13px] font-semibold text-slate-400">No hay recreos configurados</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                {currentConfig.recreos.map((rec, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[11px] font-black text-brand-primary shrink-0">{idx + 1}</div>
                                                        <div className="flex-1 flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Después del bloque</span>
                                                            <select
                                                                value={rec.despuesDeBloque}
                                                                onChange={e => updateRecreo(idx, 'despuesDeBloque', parseInt(e.target.value))}
                                                                className="w-full bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-lg px-2 py-1.5 outline-none"
                                                            >
                                                                {Array.from({ length: maxBloquesPorTurno[selectedTurno] || maxBloques || 12 }, (_, i) => i + 1).map(n => (
                                                                    <option key={n} value={n}>Bloque {n}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="flex-1 flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Minutos</span>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={rec.duracion}
                                                                onChange={e => updateRecreo(idx, 'duracion', e.target.value.replace(/\D/g, ''))}
                                                                placeholder="Ej: 15"
                                                                className="w-full bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-lg px-2 py-1.5 outline-none placeholder:font-normal placeholder:text-slate-300"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRecreo(idx)}
                                                            className="mt-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                </>
                            ) : (
                                <>
                                <section className="order-2 border-t border-slate-100 pt-7">
                                    <div className="flex items-center justify-between gap-3 mb-5">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-[var(--color-brand-light)] text-brand-primary flex items-center justify-center text-[11px] font-black">4</span>
                                            <h3 className="text-[13px] font-black text-slate-800">Horario por bloque</h3>
                                        </div>
                                        <span className="px-3 py-1.5 rounded-lg border border-brand-primary/20 bg-[var(--color-brand-light)] text-[10px] font-black text-brand-primary">
                                            {selectedTurnoData?.nombre || 'Turno'} · {totalBloquesTurno} bloques
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        {(customBlocks[selectedTurno] || []).map((bloque, index) => (
                                            <div key={bloque.id_bloque || bloque.numero_bloque} className="grid grid-cols-[72px_1fr_18px_1fr] items-end gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                                                <div className="self-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Bloque</span>
                                                    <strong className="block text-[16px] font-black text-slate-800 mt-0.5">{bloque.numero_bloque}</strong>
                                                </div>
                                                <label className="min-w-0">
                                                    <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Inicio</span>
                                                    <input type="time" value={bloque.hora_inicio} onChange={e => updateCustomBlock(index, 'hora_inicio', e.target.value)} className="w-full min-w-0 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-lg px-2 py-2 outline-none focus:border-brand-primary" />
                                                </label>
                                                <span className="self-center pb-2 text-center text-slate-300 font-black">→</span>
                                                <label className="min-w-0">
                                                    <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Final</span>
                                            <input
                                                        type="time"
                                                        value={bloque.hora_final}
                                                        onChange={e => updateCustomBlock(index, 'hora_final', e.target.value)}
                                                        className="w-full min-w-0 bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-lg px-2 py-2 outline-none focus:border-brand-primary"
                                            />
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                                <section className="order-1 border-t border-slate-100 pt-7 flex flex-col gap-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-lg bg-[var(--color-brand-light)] text-brand-primary flex items-center justify-center text-[11px] font-black">3</span>
                                            <h3 className="text-[13px] font-black text-slate-800">Recreos del turno</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addRecreo}
                                            className="text-[11px] font-black text-white bg-brand-primary hover:bg-[var(--color-brand-dark)] px-3 py-2 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                                        >
                                            + Añadir recreo
                                        </button>
                                    </div>

                                    {currentConfig.recreos.length === 0 ? (
                                        <div className="text-center py-5 border border-dashed border-slate-200 rounded-xl">
                                            <p className="text-[12px] font-semibold text-slate-400">Sin recreos configurados</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                            {currentConfig.recreos.map((recreo, index) => (
                                                <div key={index} className="grid grid-cols-[1fr_1fr_36px] items-end gap-3 border border-slate-200 rounded-xl p-3">
                                                    <label className="min-w-0">
                                                        <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Después del bloque</span>
                                                        <select
                                                            value={recreo.despuesDeBloque}
                                                            onChange={event => updateRecreo(index, 'despuesDeBloque', Number(event.target.value))}
                                                            className="w-full bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-lg px-2 py-2 outline-none focus:border-brand-primary"
                                                        >
                                                            {(customBlocks[selectedTurno] || []).map(bloque => (
                                                                <option key={bloque.numero_bloque} value={bloque.numero_bloque}>Bloque {bloque.numero_bloque}</option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label className="min-w-0">
                                                        <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Duración</span>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={recreo.duracion}
                                                                onChange={event => updateRecreo(index, 'duracion', event.target.value.replace(/\D/g, ''))}
                                                                placeholder="15"
                                                                className="w-full bg-white border border-slate-200 text-slate-700 text-[12px] font-bold rounded-lg pl-3 pr-9 py-2 outline-none focus:border-brand-primary"
                                                            />
                                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">min</span>
                                                        </div>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRecreo(index)}
                                                        title="Quitar recreo"
                                                        className="w-9 h-9 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                                                    >
                                                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="px-7 py-4 border-t border-slate-100 bg-white flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 text-[13px] font-black text-white bg-brand-primary hover:bg-[var(--color-brand-dark)] rounded-xl shadow-md transition-all cursor-pointer"
                    >
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
    );
}

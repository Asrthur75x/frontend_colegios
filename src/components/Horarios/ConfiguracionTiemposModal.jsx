import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function ConfiguracionTiemposModal({ isOpen, onClose, maxBloques, onSave }) {
    const [turnos, setTurnos] = useState([]);
    const [selectedTurno, setSelectedTurno] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Guardamos la configuración de *todos* los turnos en un solo estado
    // configs[id_turno] = { horaInicio: '08:00', duracionBloque: '45', recreos: [] }
    const [configs, setConfigs] = useState({});

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
                                despuesDeBloque: r.despues_de_bloque || 1,
                                duracion: String(r.duracion_minutos || 15)
                            }));
                        
                        initialConfigs[idTurno] = { horaInicio: hora, duracionBloque: dur, recreos: recreosDb };
                    }
                });
                
                setConfigs(initialConfigs);
                setSelectedTurno(turnosData[0].id_turno);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTurnoChange = (idTurno) => {
        setSelectedTurno(idTurno);
    };

    if (!isOpen) return null;

    // Obtener la configuración actual (si no existe, valores por defecto seguros)
    const currentConfig = configs[selectedTurno] || { horaInicio: '', duracionBloque: '', recreos: [] };

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
        setConfigs(prev => {
            const current = prev[selectedTurno] || { horaInicio: '', duracionBloque: '', recreos: [] };
            const newRecreos = [...current.recreos];
            newRecreos[index] = { ...newRecreos[index], [field]: value };
            return {
                ...prev,
                [selectedTurno]: { ...current, recreos: newRecreos }
            };
        });
    };

    const removeRecreo = (index) => {
        setConfigs(prev => {
            const current = prev[selectedTurno] || { horaInicio: '', duracionBloque: '', recreos: [] };
            return {
                ...prev,
                [selectedTurno]: { ...current, recreos: current.recreos.filter((_, i) => i !== index) }
            };
        });
    };

    const handleSave = async () => {
        try {
            // Guardar configuración de TODOS los turnos al mismo tiempo
            const savePromises = turnos.map(turno => {
                const conf = configs[turno.id_turno];
                if (!conf) return Promise.resolve();
                
                const payload = {
                    horaInicio: conf.horaInicio || '08:00',
                    duracionBloque: parseInt(conf.duracionBloque) || 45,
                    recreos: conf.recreos.map(r => ({
                        despuesDeBloque: parseInt(r.despuesDeBloque) || 1,
                        duracion: parseInt(r.duracion) || 15
                    }))
                };

                return fetch(`${API_BASE}/configurar-tiempos/${turno.id_turno}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            });

            await Promise.all(savePromises);
            
            // Recargar datos y notificar
            window.dispatchEvent(new Event('horarix_time_config_changed'));
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error("Error saving time config:", error);
            alert("Error al guardar la configuración");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-800">Configuración de Horas</h2>
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                    {/* Selector de Turno */}
                    {turnos.length > 0 && (
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                            {turnos.map(turno => (
                                <button
                                    key={turno.id_turno}
                                    type="button"
                                    onClick={() => handleTurnoChange(turno.id_turno)}
                                    className={`flex-1 py-2 px-4 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                                        String(selectedTurno) === String(turno.id_turno)
                                        ? 'bg-brand-primary text-white shadow-md'
                                        : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                                    }`}
                                >
                                    {turno.nombre}
                                </button>
                            ))}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="py-10 text-center text-slate-400 font-bold text-sm">Cargando...</div>
                    ) : (
                        <>
                            {/* Ajustes Generales */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Hora Inicial</label>
                                    <input
                                        key={`time-${selectedTurno}`}
                                        type="time"
                                        value={currentConfig.horaInicio}
                                        onChange={e => setHoraInicio(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 text-slate-800 text-[14px] font-bold rounded-xl px-4 py-2.5 outline-none focus:border-brand-primary transition-all"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Duración (min)</label>
                                    <input
                                        key={`dur-${selectedTurno}`}
                                        type="number"
                                        value={currentConfig.duracionBloque}
                                        onChange={e => setDuracionBloque(e.target.value)}
                                        min="1"
                                        placeholder="Ej: 45"
                                        className="w-full bg-white border-2 border-slate-200 text-slate-800 text-[14px] font-bold rounded-xl px-4 py-2.5 outline-none focus:border-brand-primary transition-all placeholder:text-slate-300 placeholder:font-normal"
                                    />
                                </div>
                            </div>

                            {/* Recreos */}
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Recreos</label>
                                    <button
                                        type="button"
                                        onClick={addRecreo}
                                        className="text-[11px] font-bold text-brand-primary hover:text-[var(--color-brand-dark)] bg-[var(--color-brand-light)] px-3 py-1 rounded-full transition-colors cursor-pointer"
                                    >
                                        + Añadir Recreo
                                    </button>
                                </div>

                                {currentConfig.recreos.length === 0 ? (
                                    <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                        <p className="text-[13px] font-semibold text-slate-400">No hay recreos configurados</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {currentConfig.recreos.map((rec, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                <div className="flex-1 flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Después del bloque</span>
                                                    <select
                                                        value={rec.despuesDeBloque}
                                                        onChange={e => updateRecreo(idx, 'despuesDeBloque', parseInt(e.target.value))}
                                                        className="w-full bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-lg px-2 py-1.5 outline-none"
                                                    >
                                                        {Array.from({ length: maxBloques || 12 }, (_, i) => i + 1).map(n => (
                                                            <option key={n} value={n}>Bloque {n}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1 flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Minutos</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={rec.duracion}
                                                        onChange={e => updateRecreo(idx, 'duracion', e.target.value)}
                                                        placeholder="Ej: 15"
                                                        className="w-full bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-lg px-2 py-1.5 outline-none placeholder:font-normal placeholder:text-slate-300"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRecreo(idx)}
                                                    className="mt-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
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

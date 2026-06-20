import React, { useState, useEffect } from 'react';

export default function ConfiguracionTiemposModal({ isOpen, onClose, maxBloques, onSave }) {
    const [horaInicio, setHoraInicio] = useState('08:00');
    const [duracionBloque, setDuracionBloque] = useState(45);
    const [recreos, setRecreos] = useState([]); // [{ despuesDeBloque: 2, duracion: 30 }]

    // Load from localStorage if exists
    useEffect(() => {
        if (isOpen && typeof window !== 'undefined') {
            const saved = localStorage.getItem('horarix_time_config');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.horaInicio) setHoraInicio(parsed.horaInicio);
                    if (parsed.duracionBloque) setDuracionBloque(parsed.duracionBloque);
                    if (parsed.recreos) setRecreos(parsed.recreos);
                } catch (e) {
                    console.error("Error parsing saved time config", e);
                }
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const addRecreo = () => {
        setRecreos([...recreos, { despuesDeBloque: 1, duracion: 15 }]);
    };

    const updateRecreo = (index, field, value) => {
        const newRecreos = [...recreos];
        newRecreos[index][field] = parseInt(value) || 0;
        setRecreos(newRecreos);
    };

    const removeRecreo = (index) => {
        const newRecreos = [...recreos];
        newRecreos.splice(index, 1);
        setRecreos(newRecreos);
    };

    const handleSave = () => {
        const config = {
            horaInicio,
            duracionBloque: parseInt(duracionBloque) || 45,
            recreos
        };
        if (typeof window !== 'undefined') {
            localStorage.setItem('horarix_time_config', JSON.stringify(config));
            window.dispatchEvent(new Event('horarix_time_config_changed'));
        }
        if (onSave) onSave(config);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-800">Configuración de Horas</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                    {/* Ajustes Generales */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Hora Inicial</label>
                            <input 
                                type="time" 
                                value={horaInicio}
                                onChange={e => setHoraInicio(e.target.value)}
                                className="w-full bg-white border-2 border-slate-200 text-slate-800 text-[14px] font-bold rounded-xl px-4 py-2.5 outline-none focus:border-hx-purple transition-all"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Duración (min)</label>
                            <input 
                                type="number" 
                                value={duracionBloque}
                                onChange={e => setDuracionBloque(e.target.value)}
                                min="1"
                                className="w-full bg-white border-2 border-slate-200 text-slate-800 text-[14px] font-bold rounded-xl px-4 py-2.5 outline-none focus:border-hx-purple transition-all"
                            />
                        </div>
                    </div>

                    {/* Recreos */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Recreos</label>
                            <button 
                                onClick={addRecreo}
                                className="text-[11px] font-bold text-hx-purple hover:text-purple-700 bg-purple-50 px-3 py-1 rounded-full transition-colors"
                            >
                                + Añadir Recreo
                            </button>
                        </div>

                        {recreos.length === 0 ? (
                            <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                                <p className="text-[13px] font-semibold text-slate-400">No hay recreos configurados</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {recreos.map((rec, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <div className="flex-1 flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Después del bloque</span>
                                            <select 
                                                value={rec.despuesDeBloque}
                                                onChange={e => updateRecreo(idx, 'despuesDeBloque', e.target.value)}
                                                className="w-full bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-lg px-2 py-1.5 outline-none"
                                            >
                                                {Array.from({ length: maxBloques }, (_, i) => i + 1).map(n => (
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
                                                className="w-full bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-lg px-2 py-1.5 outline-none"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => removeRecreo(idx)}
                                            className="mt-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2.5 text-[13px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2.5 text-[13px] font-black text-white bg-hx-purple hover:bg-purple-700 rounded-xl shadow-md transition-all"
                    >
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
    );
}

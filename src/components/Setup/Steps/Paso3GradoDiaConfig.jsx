import React, { useEffect, useState } from 'react';

export default function Paso3GradoDiaConfig({ data, setData, isSaved, onEnableEdit, isEditing, onCancelEdit }) {
    const [activeTab, setActiveTab] = useState(null);
    const [isCopying, setIsCopying] = useState(false);
    const [selectedGradesToCopy, setSelectedGradesToCopy] = useState([]);
    const [successMessage, setSuccessMessage] = useState(false);

    useEffect(() => {
        if (data.grados && data.grados.length > 0 && !activeTab) {
            const gradosOrdenados = [...data.grados].sort((a, b) => a - b);
            setActiveTab(gradosOrdenados[0]);
        }

        if (!data.gradoDiaConfig && data.grados && data.dias) {
            const initialConfig = {};
            data.grados.forEach(g => {
                data.dias.forEach(d => {
                    initialConfig[`${g}-${d.id}`] = 0;
                });
            });
            setData(prev => ({ ...prev, gradoDiaConfig: initialConfig }));
        }
    }, [data.grados, data.dias, setData, data.gradoDiaConfig, activeTab]);

    if (!data.gradoDiaConfig || !activeTab) return null;

    const handleDayChange = (grado, diaId, delta) => {
        setData(prev => {
            const key = `${grado}-${diaId}`;
            const currentVal = prev.gradoDiaConfig[key] || 0;
            const newVal = Math.max(0, Math.min(15, currentVal + delta));
            return {
                ...prev,
                gradoDiaConfig: {
                    ...prev.gradoDiaConfig,
                    [key]: newVal
                }
            };
        });
    };

    const toggleGradeToCopy = (g) => {
        setSelectedGradesToCopy(prev =>
            prev.includes(g) ? prev.filter(id => id !== g) : [...prev, g]
        );
    };

    const confirmCopy = () => {
        if (selectedGradesToCopy.length === 0) return;

        setData(prev => {
            const newConfig = { ...prev.gradoDiaConfig };
            selectedGradesToCopy.forEach(targetGrado => {
                data.dias.forEach(d => {
                    newConfig[`${targetGrado}-${d.id}`] = newConfig[`${activeTab}-${d.id}`];
                });
            });
            return { ...prev, gradoDiaConfig: newConfig };
        });

        setIsCopying(false);
        setSelectedGradesToCopy([]);

        setSuccessMessage(true);
        setTimeout(() => {
            setSuccessMessage(false);
        }, 3000);
    };

    return (
        <div className="w-full flex flex-col animate-fade-in pb-12 min-h-[550px] lg:min-h-[600px]">
            
            {/* Encabezado y Edición */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-2 leading-tight tracking-tight">
                        Bloques por Día
                    </h2>
                    <p className="text-slate-500 text-sm m-0 max-w-xl">
                        Configura la cantidad de periodos o bloques de clase para cada grado y día.
                    </p>
                </div>
                {/* Botones de Edición */}
                <div className="flex-shrink-0">
                    {isSaved && (
                        <button onClick={onEnableEdit} className="px-5 py-2.5 rounded-xl border-2 border-[var(--color-brand-primary)] text-white text-sm font-bold bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)] transition-all flex items-center gap-2 shadow-sm cursor-pointer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            Editar Información
                        </button>
                    )}
                    {isEditing && (
                        <button onClick={onCancelEdit} className="px-5 py-2.5 rounded-xl border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] text-sm font-bold bg-white hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div className={`w-full max-w-5xl mx-auto flex flex-col gap-8 ${isSaved ? 'opacity-60 pointer-events-none select-none grayscale-[20%]' : ''}`}>
                
                {/* SELECTOR DE GRADOS HORIZONTAL */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                        <svg className="text-[var(--color-brand-primary)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        <h3 className="text-lg font-bold text-slate-800">Selecciona el Grado</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        {[...data.grados].sort((a, b) => a - b).map(grado => {
                            const isActive = activeTab === grado;
                            
                            // Verificar si este grado tiene al menos 1 bloque asignado en algún día
                            const totalBlocks = data.dias.reduce((acc, dia) => {
                                const val = data.gradoDiaConfig[`${grado}-${dia.id}`];
                                return acc + (val || 0);
                            }, 0);
                            const hasBlocks = totalBlocks > 0;
                            
                            return (
                                <button
                                    key={grado}
                                    onClick={() => {
                                        setActiveTab(grado);
                                        setIsCopying(false);
                                        setSuccessMessage(false);
                                    }}
                                    className={`px-5 py-3 rounded-2xl border-2 font-bold transition-all flex items-center gap-4 cursor-pointer relative
                                        ${isActive
                                            ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)] shadow-[0_4px_16px_rgba(16,207,174,0.15)] transform hover:-translate-y-1'
                                            : hasBlocks
                                                ? 'border-[var(--color-brand-primary)]/30 bg-white text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 hover:-translate-y-1 shadow-sm'
                                                : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-[var(--color-brand-primary)]/40 hover:bg-white hover:-translate-y-1'}`}
                                >
                                    {hasBlocks && !isActive && (
                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--color-brand-primary)] rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                    )}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors 
                                        ${isActive 
                                            ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white' 
                                            : hasBlocks
                                                ? 'border-[var(--color-brand-primary)]/50 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
                                                : 'border-slate-200 bg-white'}`}>
                                        <span className="text-lg font-black">{grado}°</span>
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-widest hidden sm:block">Grado</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* CONFIGURADOR DE DÍAS (GRID 3 COLUMNAS) */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                            <svg className="text-[var(--color-brand-primary)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <h3 className="text-lg font-bold text-slate-800">Bloques para el {activeTab}° Grado</h3>
                        </div>
                        <div className="relative">
                            {data.grados.length > 1 && !successMessage && (
                                <button
                                    onClick={() => !isCopying && setIsCopying(true)}
                                    className={`text-sm font-bold text-white bg-[var(--color-brand-primary)] border-2 border-[var(--color-brand-primary)] px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm ${isCopying ? 'opacity-50 cursor-default' : 'cursor-pointer hover:bg-[var(--color-brand-primary)]/80 hover:border-[var(--color-brand-primary)]/80'}`}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    Copiar a otros grados
                                </button>
                            )}
                            {successMessage && (
                                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 border-2 border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-2">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    ¡Copiado con éxito!
                                </span>
                            )}

                            {/* POPOVER DE COPIADO */}
                            {isCopying && !successMessage && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white border-2 border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-50 animate-fade-in origin-top-right">
                                    <h4 className="font-bold text-slate-800 text-sm border-b-2 border-slate-100 pb-2">¿A qué grados quieres copiar?</h4>
                                    
                                    <div className="flex flex-wrap gap-2 w-full">
                                        {data.grados.filter(g => g !== activeTab).sort((a, b) => a - b).map(g => {
                                            const isSelected = selectedGradesToCopy.includes(g);
                                            return (
                                                <label key={g} className={`cursor-pointer px-3 py-1.5 rounded-lg border-2 transition-all font-bold text-sm flex items-center gap-2 select-none ${isSelected ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                                                    <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleGradeToCopy(g)} />
                                                    <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors border-2 ${isSelected ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white' : 'border-slate-300 bg-white'}`}>
                                                        {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                    </div>
                                                    {g}°
                                                </label>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="flex gap-2 w-full mt-1">
                                        <button onClick={() => { setIsCopying(false); setSelectedGradesToCopy([]); }} className="cursor-pointer flex-1 py-2 rounded-xl font-bold text-xs border-2 border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">Cancelar</button>
                                        <button onClick={confirmCopy} disabled={selectedGradesToCopy.length === 0} className={`flex-1 py-2 rounded-xl font-bold text-xs border-2 transition-all ${selectedGradesToCopy.length > 0 ? 'cursor-pointer border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white shadow-sm' : 'border-slate-200 bg-slate-200 text-slate-400 cursor-not-allowed'}`}>Aplicar Copia</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.dias.map(dia => {
                            const val = data.gradoDiaConfig[`${activeTab}-${dia.id}`] !== undefined ? data.gradoDiaConfig[`${activeTab}-${dia.id}`] : 0;
                            const hasBlocks = val > 0;
                            return (
                                <div key={dia.id} className={`bg-white border-2 rounded-3xl p-5 flex flex-col items-center gap-4 transition-all ${hasBlocks ? 'border-[var(--color-brand-primary)]/40 shadow-sm' : 'border-slate-100'}`}>
                                    <span className="text-[13px] xl:text-[14px] font-black uppercase tracking-normal text-slate-800">{dia.nombre}</span>
                                    
                                    {/* Controles de Número */}
                                    <div className="flex items-center w-full justify-between gap-3 bg-slate-50 rounded-2xl border border-slate-100 p-1.5">
                                        <button onClick={() => handleDayChange(activeTab, dia.id, -1)} className="w-10 h-10 cursor-pointer rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)] hover:text-white font-black text-xl flex items-center justify-center transition-all shadow-sm">-</button>
                                        <span className={`text-2xl font-black ${hasBlocks ? 'text-[var(--color-brand-primary)]' : 'text-slate-800'}`}>{val}</span>
                                        <button onClick={() => handleDayChange(activeTab, dia.id, 1)} className="w-10 h-10 cursor-pointer rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)] hover:text-white font-black text-xl flex items-center justify-center transition-all shadow-sm">+</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>


            </div>
        </div>
    );
}

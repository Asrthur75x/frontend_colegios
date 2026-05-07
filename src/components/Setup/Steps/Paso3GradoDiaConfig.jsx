import React, { useEffect, useState } from 'react';

export default function Paso3GradoDiaConfig({ data, setData }) {
    // El grado seleccionado en las pestañas (por defecto el primero)
    const [activeTab, setActiveTab] = useState(null);
    const [isCopying, setIsCopying] = useState(false);
    const [selectedGradesToCopy, setSelectedGradesToCopy] = useState([]);
    const [successMessage, setSuccessMessage] = useState(false);

    // Inicializar configuración y pestaña por defecto
    useEffect(() => {
        if (data.grados && data.grados.length > 0 && !activeTab) {
            const gradosOrdenados = [...data.grados].sort((a, b) => a - b);
            setActiveTab(gradosOrdenados[0]);
        }

        if (!data.gradoDiaConfig && data.grados && data.dias) {
            const initialConfig = {};
            data.grados.forEach(g => {
                data.dias.forEach(d => {
                    initialConfig[`${g}-${d.id}`] = 0; // Empezar en 0
                });
            });
            setData(prev => ({ ...prev, gradoDiaConfig: initialConfig }));
        }
    }, [data.grados, data.dias, setData, data.gradoDiaConfig, activeTab]);

    if (!data.gradoDiaConfig || !activeTab) return null;

    // Cambiar bloques para un día específico del grado activo
    const handleDayChange = (grado, diaId, delta) => {
        setData(prev => {
            const key = `${grado}-${diaId}`;
            const currentVal = prev.gradoDiaConfig[key] || 0; // Por defecto 0
            const newVal = Math.max(0, Math.min(15, currentVal + delta)); // Mínimo 0
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
        
        // Mostrar mensaje de éxito temporal en vez de un alert
        setSuccessMessage(true);
        setTimeout(() => {
            setSuccessMessage(false);
        }, 3000);
    };

    return (
        <div className="w-full flex flex-col items-center animate-fade-in pb-12 px-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] text-center mb-3 leading-tight">
                Bloques por Día
            </h2>
            <p className="text-slate-500 text-center mb-8 text-lg max-w-[500px]">
                Configura los periodos de clase. Selecciona un grado en las pestañas para editar sus días.
            </p>

            <div className="w-full max-w-[800px] flex flex-col items-center">
                
                {/* PESTAÑAS (TABS) */}
                <div className="flex flex-wrap justify-center gap-2 mb-6 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    {data.grados.sort((a, b) => a - b).map(grado => {
                        const isActive = activeTab === grado;
                        return (
                            <button
                                key={grado}
                                onClick={() => {
                                    setActiveTab(grado);
                                    setIsCopying(false);
                                    setSuccessMessage(false);
                                }}
                                className={`cursor-pointer px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                                    isActive 
                                    ? 'bg-[#F3C252] text-[#111827] shadow-lg shadow-[#F3C252]/20 scale-105' 
                                    : 'bg-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                                }`}
                            >
                                {grado}° Grado
                            </button>
                        );
                    })}
                </div>

                {/* PANEL PRINCIPAL */}
                <div className="w-full bg-white border-2 border-slate-100 rounded-[2rem] p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300">
                    {/* Adorno visual del panel */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#F3C252]/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                    
                    {/* Cabecera del Panel */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10 border-b border-slate-100 pb-5 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#F3C252]/10 border border-[#F3C252]/30 flex items-center justify-center font-black text-2xl text-[#d49e24]">
                                {activeTab}°
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">Horario Exclusivo</h3>
                                <p className="text-slate-500 text-sm font-semibold">Configurando días para {activeTab}° Grado</p>
                            </div>
                        </div>
                    </div>

                    {/* Días (Forzado a 3 columnas exactas) */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 relative z-10 max-w-[600px] mx-auto">
                        {data.dias.map(dia => {
                            const val = data.gradoDiaConfig[`${activeTab}-${dia.id}`] !== undefined ? data.gradoDiaConfig[`${activeTab}-${dia.id}`] : 0;
                            return (
                                <div key={dia.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:p-4 flex flex-col items-center hover:border-[#F3C252] hover:bg-white hover:shadow-lg hover:shadow-[#F3C252]/5 transition-all duration-300 group">
                                    <span className="text-[10px] sm:text-xs font-black text-slate-400 group-hover:text-[#d49e24] uppercase tracking-widest mb-3 sm:mb-4 transition-colors">
                                        {dia.nombre.substring(0,3)}
                                    </span>
                                    <div className="flex items-center gap-1.5 sm:gap-3 w-full justify-center">
                                        <button 
                                            onClick={() => handleDayChange(activeTab, dia.id, -1)} 
                                            className="cursor-pointer w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white text-slate-400 hover:bg-[#F3C252] hover:text-[#111827] font-black shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-all text-lg flex items-center justify-center shrink-0"
                                        >-</button>
                                        <span className="text-xl sm:text-2xl font-black text-slate-800 w-5 sm:w-6 text-center">{val}</span>
                                        <button 
                                            onClick={() => handleDayChange(activeTab, dia.id, 1)} 
                                            className="cursor-pointer w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white text-slate-400 hover:bg-[#F3C252] hover:text-[#111827] font-black shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] transition-all text-lg flex items-center justify-center shrink-0"
                                        >+</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Panel de Copiado Global */}
                    {data.grados.length > 1 && (
                        <div className="mt-8 pt-6 border-t border-slate-100 relative z-10 min-h-[70px]">
                            {successMessage && (
                                <div className="flex justify-center animate-fade-in">
                                    <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-xl font-bold border border-emerald-100 shadow-sm w-full sm:w-auto justify-center">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        ¡Horario copiado con éxito!
                                    </div>
                                </div>
                            )}

                            {!isCopying && !successMessage && (
                                <div className="flex justify-center animate-fade-in">
                                    <button 
                                        onClick={() => setIsCopying(true)}
                                        className="cursor-pointer flex items-center gap-2 px-6 py-4 bg-[#111827] text-white hover:bg-[#F3C252] hover:text-[#111827] rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:shadow-[#F3C252]/20 group w-full sm:w-auto justify-center"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                        Copiar este horario a otros grados
                                    </button>
                                </div>
                            )}
                            
                            {isCopying && !successMessage && (
                                <div className="bg-[#F3C252]/5 border border-[#F3C252]/30 rounded-2xl p-5 sm:p-6 animate-fade-in shadow-inner">
                                    <h4 className="font-bold text-slate-800 mb-4 text-center sm:text-left flex items-center gap-2 justify-center sm:justify-start">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d49e24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                        Selecciona los grados destino:
                                    </h4>
                                    
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6">
                                        {data.grados.filter(g => g !== activeTab).sort((a,b) => a-b).map(g => {
                                            const isSelected = selectedGradesToCopy.includes(g);
                                            return (
                                                <label key={g} className={`cursor-pointer px-4 py-2.5 rounded-xl border-2 transition-all font-bold text-sm flex items-center gap-2.5 select-none ${isSelected ? 'border-[#F3C252] bg-white shadow-md text-[#d49e24]' : 'border-slate-200 bg-white/50 text-slate-500 hover:border-[#F3C252]/50 hover:bg-white'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden" 
                                                        checked={isSelected} 
                                                        onChange={() => toggleGradeToCopy(g)} 
                                                    />
                                                    <div className={`w-5 h-5 rounded-[4px] flex items-center justify-center transition-colors border ${isSelected ? 'border-[#F3C252] bg-[#F3C252] text-white' : 'border-slate-300 bg-white'}`}>
                                                        {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                    </div>
                                                    {g}° Grado
                                                </label>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#F3C252]/20">
                                        <button 
                                            onClick={() => {
                                                setIsCopying(false);
                                                setSelectedGradesToCopy([]);
                                            }} 
                                            className="cursor-pointer px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white hover:text-slate-800 transition-colors w-full sm:w-auto"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={confirmCopy} 
                                            disabled={selectedGradesToCopy.length === 0} 
                                            className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm w-full sm:w-auto ${selectedGradesToCopy.length > 0 ? 'cursor-pointer bg-[#111827] text-white hover:bg-black hover:shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'}`}
                                        >
                                            Aplicar Copiado
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

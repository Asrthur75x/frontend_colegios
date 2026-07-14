import React from 'react';

export default function Paso2DiasGrados({ data, setData, isSaved, onEnableEdit, isEditing, onCancelEdit }) {
    const diasSemana = [
        { id: 1, nombre: 'Lunes' },
        { id: 2, nombre: 'Martes' },
        { id: 3, nombre: 'Miércoles' },
        { id: 4, nombre: 'Jueves' },
        { id: 5, nombre: 'Viernes' },
        { id: 6, nombre: 'Sábado' }
    ];

    const gradosDisponibles = [1, 2, 3, 4, 5];

    const handleDiaToggle = (dia) => {
        setData(prev => {
            const diasActuales = prev.dias || [];
            const existe = diasActuales.some(d => d.nombre === dia.nombre);
            let nuevosDias;
            if (existe) {
                nuevosDias = diasActuales.filter(d => d.nombre !== dia.nombre);
            } else {
                nuevosDias = [...diasActuales, dia];
            }
            nuevosDias.sort((a, b) => a.id - b.id);
            return { ...prev, dias: nuevosDias };
        });
    };

    const handleGradoToggle = (grado) => {
        setData(prev => {
            const gradosActuales = prev.grados || [];
            let nuevosGrados;
            if (gradosActuales.includes(grado)) {
                nuevosGrados = gradosActuales.filter(g => g !== grado);
            } else {
                nuevosGrados = [...gradosActuales, grado];
            }
            nuevosGrados.sort((a, b) => a - b);
            return { ...prev, grados: nuevosGrados };
        });
    };

    return (
        <div className="w-full flex flex-col animate-fade-in pb-12">
            
            {/* Encabezado y Edición */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-2 leading-tight tracking-tight">
                        Días y Grados
                    </h2>
                    <p className="text-slate-500 text-sm m-0 max-w-xl">
                        Configura los días lectivos y los grados de tu institución.
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

            <div className={`w-full flex flex-col gap-8 ${isSaved ? 'opacity-60 pointer-events-none select-none grayscale-[20%]' : ''}`}>
                
                {/* CONTENEDOR PRINCIPAL VERTICAL */}
                <div className="flex flex-col gap-10 w-full max-w-5xl mx-auto items-start">
                    
                    {/* DÍAS LECTIVOS */}
                    <div className="flex flex-col gap-4 w-full">
                        <div className="flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                            <svg className="text-[var(--color-brand-primary)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <h3 className="text-lg font-bold text-slate-800">Días Lectivos</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {diasSemana.map((dia) => {
                                const isSelected = data.dias?.some(d => d.nombre === dia.nombre);
                                return (
                                    <button
                                        key={dia.id}
                                        onClick={() => handleDiaToggle(dia)}
                                        className={`h-28 p-2 rounded-3xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center
                                            ${isSelected
                                                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)] shadow-[0_4px_16px_rgba(16,207,174,0.15)] transform hover:-translate-y-1'
                                                : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-[var(--color-brand-primary)]/40 hover:bg-white hover:-translate-y-1'}`}
                                    >
                                        <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'border-[var(--color-brand-primary)] bg-white' : 'border-slate-200 bg-white'}`}>
                                            {isSelected ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            ) : (
                                                <span className="text-[11px] font-black">{dia.nombre.substring(0,3)}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center w-full">
                                            <span className="text-[12px] font-black uppercase tracking-normal">{dia.nombre}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* GRADOS */}
                    <div className="flex flex-col gap-4 w-full">
                        <div className="flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                            <svg className="text-[var(--color-brand-primary)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                            <h3 className="text-lg font-bold text-slate-800">Grados Disponibles</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {gradosDisponibles.map((grado) => {
                                const isSelected = data.grados?.includes(grado);
                                return (
                                    <button
                                        key={grado}
                                        onClick={() => handleGradoToggle(grado)}
                                        className={`h-28 p-2 rounded-3xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-center
                                            ${isSelected
                                                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)] shadow-[0_4px_16px_rgba(16,207,174,0.15)] transform hover:-translate-y-1'
                                                : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-[var(--color-brand-primary)]/40 hover:bg-white hover:-translate-y-1'}`}
                                    >
                                        <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white' : 'border-slate-200 bg-white'}`}>
                                            <span className="text-lg font-black">{grado}°</span>
                                        </div>
                                        <div className="flex flex-col items-center w-full">
                                            <span className="text-[12px] font-black uppercase tracking-normal">Grado {grado}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

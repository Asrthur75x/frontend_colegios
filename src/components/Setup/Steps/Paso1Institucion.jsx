import React, { useState } from 'react';

export default function Paso1Institucion({ data, setData, isSaved, onEnableEdit, isEditing, onCancelEdit, errors = {}, clearError = () => {} }) {
    const [activeSedeIdx, setActiveSedeIdx] = useState(0);
    const [showSedeOptions, setShowSedeOptions] = useState(!data.sedes || data.sedes[0] === '');

    const handleNestedChange = (section, field, value) => {
        setData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleFlatChange = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleSedeChoice = (choice) => {
        setData(prev => {
            const newState = { ...prev, tipo_sede: choice };
            if (!choice) {
                // Sede única
                newState.numero_sedes = 1;
                newState.sedes = [prev.sedes[0] || ''];
            } else {
                // Varias sedes
                if (prev.numero_sedes < 2) {
                    newState.numero_sedes = 2;
                    newState.sedes = [prev.sedes[0] || '', ''];
                }
            }
            return newState;
        });
    };

    const handleNumeroSedes = (e) => {
        const val = parseInt(e.target.value) || 1;
        handleFlatChange('numero_sedes', val);
        const newSedes = [...data.sedes];
        if (val > newSedes.length) {
            for (let i = newSedes.length; i < val; i++) {
                newSedes.push('');
            }
        } else if (val < newSedes.length) {
            newSedes.length = val;
        }
        handleFlatChange('sedes', newSedes);
    };

    const handleSedeNameChange = (index, value) => {
        const newSedes = [...data.sedes];
        newSedes[index] = value;
        handleFlatChange('sedes', newSedes);
    };

    const handleTurnoToggle = (turno) => {
        setData(prev => {
            const turnosActuales = prev.turnos || [];
            let nuevosTurnos;
            if (turnosActuales.includes(turno)) {
                nuevosTurnos = turnosActuales.filter(t => t !== turno);
            } else {
                nuevosTurnos = [...turnosActuales, turno];
            }
            
            // Mantener siempre el orden: Mañana primero, luego Tarde
            const ordenTurnos = ['Mañana', 'Tarde'];
            nuevosTurnos.sort((a, b) => ordenTurnos.indexOf(a) - ordenTurnos.indexOf(b));
            
            return {
                ...prev,
                turnos: nuevosTurnos
            };
        });
    };

    return (
        <div className="w-full flex flex-col animate-fade-in pb-12">
            
            {/* Encabezado y Edición */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6 pb-6 border-b border-slate-100">
                <div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-2 leading-tight tracking-tight">
                        ¡Bienvenido a HorariX!
                    </h2>
                    <p className="text-slate-500 text-base m-0 max-w-xl">
                        Configuremos la información principal de tu institución para empezar.
                    </p>
                </div>
                {/* Botones de Edición */}
                <div className="flex-shrink-0">
                    {isSaved && (
                        <button onClick={onEnableEdit} className="px-5 py-2.5 rounded-xl border-2 border-[var(--color-brand-primary)] text-white text-sm font-bold bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)] transition-all flex items-center gap-2 shadow-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                            Editar Información
                        </button>
                    )}
                    {isEditing && (
                        <button onClick={onCancelEdit} className="px-5 py-2.5 rounded-xl border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] text-sm font-bold bg-white hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            <div className={`w-full flex flex-col gap-16 ${isSaved ? 'opacity-60 pointer-events-none select-none grayscale-[20%]' : ''}`}>
                
                {/* SECCIÓN 1: HERO INPUT (Colegio) */}
                <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto relative">
                    <label className="text-sm font-bold text-[var(--color-brand-primary)] uppercase tracking-[0.2em] mb-4">
                        ¿Cómo se llama la institución?
                    </label>
                    <input
                        type="text"
                        className={`w-full text-2xl lg:text-3xl font-extrabold text-center bg-transparent outline-none placeholder-slate-200 transition-colors
                            ${errors.colegio ? 'text-red-500 border-b-2 border-red-500 border-dashed focus:ring-0 pb-2' : 'text-slate-800 border-none focus:ring-0'}`}
                        placeholder="Ej. San Juan Bautista"
                        value={data.colegio.nombre}
                        onChange={(e) => {
                            handleNestedChange('colegio', 'nombre', e.target.value);
                            if (errors.colegio) clearError('colegio');
                        }}
                        disabled={isSaved}
                    />
                    <div className="h-1 w-32 bg-[var(--color-brand-primary)] rounded-full mt-6 opacity-30 transition-all duration-300 hover:w-48 hover:opacity-100"></div>
                    {errors.colegio && (
                        <p className="text-red-500 text-[12px] font-bold text-center animate-fade-in tracking-widest uppercase absolute -bottom-8 w-full">{errors.colegio}</p>
                    )}
                </div>

                {/* SECCIÓN 2 y 3: GRID (Sedes y Turnos) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-5xl mx-auto">
                    
                    {/* SEDES */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                            <svg className="text-slate-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            <h3 className="text-xl font-bold text-slate-800">Estructura de Sedes</h3>
                        </div>
                        
                        <div className="w-full h-[210px] relative">
                            {showSedeOptions ? (
                                <div className="animate-fade-in flex flex-col h-full">
                                    <div className="flex h-full gap-4">
                                        <button
                                            onClick={() => { handleSedeChoice(false); setShowSedeOptions(false); if (errors.tipo_sede) clearError('tipo_sede'); }}
                                            className={`flex-1 p-6 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-3 cursor-pointer
                                                ${errors.tipo_sede ? 'border-red-400 bg-red-50 text-red-500' : 
                                                (data.tipo_sede === false
                                                    ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)] shadow-sm'
                                                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-[var(--color-brand-primary)]/40 hover:bg-white')}`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${data.tipo_sede === false ? 'border-[var(--color-brand-primary)] bg-white' : errors.tipo_sede ? 'border-red-400 bg-white' : 'border-slate-200 bg-white'}`}>1</div>
                                            <span className="text-sm">Sede Única</span>
                                        </button>
                                        <button
                                            onClick={() => { handleSedeChoice(true); setShowSedeOptions(false); if (errors.tipo_sede) clearError('tipo_sede'); }}
                                            className={`flex-1 p-6 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-3 cursor-pointer
                                                ${errors.tipo_sede ? 'border-red-400 bg-red-50 text-red-500' : 
                                                (data.tipo_sede === true
                                                    ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)] shadow-sm'
                                                    : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-[var(--color-brand-primary)]/40 hover:bg-white')}`}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${data.tipo_sede === true ? 'border-[var(--color-brand-primary)] bg-white' : errors.tipo_sede ? 'border-red-400 bg-white' : 'border-slate-200 bg-white'}`}>+</div>
                                            <span className="text-sm">Varias Sedes</span>
                                        </button>
                                    </div>
                                    {errors.tipo_sede && (
                                        <p className="text-red-500 text-[11px] font-bold text-center mt-3 animate-fade-in uppercase tracking-widest absolute -bottom-8 w-full">{errors.tipo_sede}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="animate-fade-in h-full flex flex-col">
                                    <button 
                                        onClick={() => setShowSedeOptions(true)}
                                        className="self-start flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-dark)] underline-offset-4 hover:underline transition-all mb-4 cursor-pointer"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                        Cambiar tipo de sede
                                    </button>

                                    {data.tipo_sede === false && (
                                        <div className="animate-fade-in flex flex-col gap-2 relative">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-2">Nombre de la Sede Única</label>
                                            <input
                                                type="text"
                                                className={`w-full p-4 rounded-xl border-2 bg-slate-50 focus:bg-white focus:outline-none transition-all font-bold text-slate-800 placeholder-slate-300
                                                    ${errors.sedes ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-400/10' : 'border-slate-200 focus:border-[var(--color-brand-primary)] focus:ring-4 focus:ring-[var(--color-brand-primary)]/10'}`}
                                                placeholder="Ej. Sede Principal"
                                                value={data.sedes[0] || ''}
                                                onChange={(e) => {
                                                    handleSedeNameChange(0, e.target.value);
                                                    if (errors.sedes) clearError('sedes');
                                                }}
                                            />
                                            {errors.sedes && <p className="text-red-500 text-[11px] font-bold animate-fade-in absolute -bottom-6 left-2">{errors.sedes}</p>}
                                        </div>
                                    )}

                                    {data.tipo_sede === true && (
                                        <div className="animate-fade-in flex flex-col gap-4">
                                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border-2 border-slate-100">
                                                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Cantidad de sedes:</label>
                                                <input
                                                    type="number"
                                                    min="2"
                                                    className="w-20 p-2 text-center rounded-lg border-2 border-slate-200 focus:outline-none focus:border-[var(--color-brand-primary)] font-bold text-slate-800 text-lg"
                                                    value={data.numero_sedes}
                                                    onChange={(e) => {
                                                        handleNumeroSedes(e);
                                                        // Reset to 0 if we shrink the array too much
                                                        if (activeSedeIdx >= parseInt(e.target.value)) {
                                                            setActiveSedeIdx(parseInt(e.target.value) - 1);
                                                        }
                                                    }}
                                                />
                                            </div>

                                            <div className="flex flex-col bg-slate-50 p-4 rounded-xl border-2 border-slate-100 relative">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-[10px] font-bold text-[var(--color-brand-primary)] uppercase tracking-widest">
                                                        {activeSedeIdx === 0 ? "Sede Principal" : `Sede ${activeSedeIdx + 1}`}
                                                    </label>
                                                    <div className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
                                                        {activeSedeIdx + 1} de {data.sedes.length}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => setActiveSedeIdx(Math.max(0, activeSedeIdx - 1))}
                                                        disabled={activeSedeIdx === 0}
                                                        className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-white border-2 border-slate-200 text-slate-500 hover:text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)]/50 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all cursor-pointer"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                                    </button>
                                                    
                                                    <input
                                                        type="text"
                                                        className={`flex-1 w-full p-2 rounded-lg border-2 bg-white transition-all text-sm font-bold placeholder-slate-300 text-center
                                                            ${errors.sedes ? 'border-red-400 text-red-500 focus:border-red-500 outline-none' : 'border-slate-200 text-slate-800 focus:outline-none focus:border-[var(--color-brand-primary)]'}`}
                                                        placeholder={activeSedeIdx === 0 ? "Ej. Sede Central" : `Nombre sede ${activeSedeIdx + 1}`}
                                                        value={data.sedes[activeSedeIdx] || ''}
                                                        onChange={(e) => {
                                                            handleSedeNameChange(activeSedeIdx, e.target.value);
                                                            if (errors.sedes) clearError('sedes');
                                                        }}
                                                    />

                                                    <button 
                                                        onClick={() => setActiveSedeIdx(Math.min(data.sedes.length - 1, activeSedeIdx + 1))}
                                                        disabled={activeSedeIdx === data.sedes.length - 1}
                                                        className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-white border-2 border-slate-200 text-slate-500 hover:text-[var(--color-brand-primary)] hover:border-[var(--color-brand-primary)]/50 disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:border-slate-200 transition-all cursor-pointer"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                    </button>
                                                </div>
                                                {errors.sedes && <p className="text-red-500 text-[11px] font-bold text-center animate-fade-in absolute -bottom-6 left-0 w-full">{errors.sedes}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TURNOS */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                            <svg className="text-slate-400" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            <h3 className="text-xl font-bold text-slate-800">Horarios de Operación</h3>
                        </div>
                        
                        <div className="flex flex-col h-[210px] relative">
                            <div className="flex gap-4 h-full">
                            {['Mañana', 'Tarde'].map((turno) => {
                                const isSelected = data.turnos?.includes(turno);
                                const isManana = turno === 'Mañana';
                                return (
                                    <button
                                        key={turno}
                                        onClick={() => {
                                            handleTurnoToggle(turno);
                                            if (errors.turnos) clearError('turnos');
                                        }}
                                        disabled={isSaved}
                                        className={`flex-1 p-6 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-4 cursor-pointer
                                            ${errors.turnos ? 'border-red-400 bg-red-50' : 
                                            (isSelected
                                                ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)] shadow-[0_4px_12px_rgba(16,207,174,0.15)] transform hover:-translate-y-1'
                                                : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-[var(--color-brand-primary)]/40 hover:bg-white hover:-translate-y-1')
                                            } ${isSaved ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isSelected ? 'border-[var(--color-brand-primary)] bg-white' : 'border-slate-200 bg-white'}`}>
                                            {isManana ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M6.34 17.66l-1.41 1.41"></path><path d="M19.07 4.93l-1.41 1.41"></path></svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                                            )}
                                        </div>
                                        <span className="text-sm uppercase tracking-widest">{turno}</span>
                                    </button>
                                );
                            })}
                            </div>
                            {errors.turnos && (
                                <p className="text-red-500 text-[11px] font-bold text-center mt-3 animate-fade-in uppercase tracking-widest absolute -bottom-8 w-full">{errors.turnos}</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

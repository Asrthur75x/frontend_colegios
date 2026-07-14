import React, { useEffect, useState, useRef } from 'react';

/**
 * seccionTurno data structure:
 *   Simple mode:   seccionTurno[sede][grado][seccion] = "Mañana"  (string)
 *   Advanced mode: seccionTurno[sede][grado][seccion] = { [diaId]: "Mañana", ... }  (object)
 *
 * gradoDiaConfig key: "grado-diaId" → bloques_dia (number)
 * Only days with bloques_dia > 0 are relevant for a grade.
 */
export default function Paso5Turnos({ data, setData, isSaved, onEnableEdit, isEditing, onCancelEdit }) {
    // Initialize with first turno for all sections (simple mode)
    // Also sync new sections added via step 4 editing
    useEffect(() => {
        if (!data.secciones || data.turnos.length === 0) return;

        if (!data.seccionTurno) {
            // First time: build from scratch
            const init = {};
            for (const sede of Object.keys(data.secciones)) {
                init[sede] = {};
                for (const grado of Object.keys(data.secciones[sede])) {
                    init[sede][grado] = {};
                    for (const sec of data.secciones[sede][grado]) {
                        init[sede][grado][sec] = null;
                    }
                }
            }
            setData(prev => ({ ...prev, seccionTurno: init }));
        } else {
            // Sync: add any new sections missing from seccionTurno
            let needsUpdate = false;
            const updated = { ...data.seccionTurno };
            for (const sede of Object.keys(data.secciones)) {
                if (!updated[sede]) { updated[sede] = {}; needsUpdate = true; }
                for (const grado of Object.keys(data.secciones[sede])) {
                    if (!updated[sede][grado]) { updated[sede][grado] = {}; needsUpdate = true; }
                    for (const sec of data.secciones[sede][grado]) {
                        if (updated[sede][grado][sec] === undefined) {
                            updated[sede][grado][sec] = null;
                            needsUpdate = true;
                        }
                    }
                }
            }
            if (needsUpdate) {
                setData(prev => ({ ...prev, seccionTurno: updated }));
            }
        }
    }, [data.secciones, data.turnos, data.seccionTurno, setData]);

    const [activeSede, setActiveSede] = useState('');
    // Track which section cards have the advanced popover open: key = "grado__seccion"
    const [advancedMode, setAdvancedMode] = useState({});
    const [hasChangedAdvanced, setHasChangedAdvanced] = useState({});
    const [activeTab, setActiveTab] = useState(null);
    const carouselRef = useRef(null);

    useEffect(() => {
        if (data.secciones) {
            const sedes = Object.keys(data.secciones);
            if (sedes.length > 0 && !activeSede) {
                setActiveSede(sedes[0]);
            }
        }
    }, [data.secciones, activeSede]);

    useEffect(() => {
        if (data.secciones && activeSede) {
            const gradosDisponibles = Object.keys(data.secciones[activeSede] || {}).sort((a, b) => parseInt(a) - parseInt(b));
            if (gradosDisponibles.length > 0) {
                if (!activeTab || !gradosDisponibles.includes(activeTab)) {
                    setActiveTab(gradosDisponibles[0]);
                }
            } else {
                setActiveTab(null);
            }
        }
    }, [data.secciones, activeSede, activeTab]);

    if (!data.seccionTurno || !activeSede || data.turnos.length === 0) return null;

    const sedes = Object.keys(data.secciones || {});
    const gradosSedeActiva = data.secciones[activeSede] || {};
    const dias = data.dias || [];

    /**
     * Returns only the days that have at least 1 block configured for the given grade.
     * Uses gradoDiaConfig keys like "grado-diaId".
     */
    const getDiasConBloques = (grado) => {
        const config = data.gradoDiaConfig || {};
        return dias.filter(dia => {
            const key = `${grado}-${dia.id}`;
            return (config[key] || 0) > 0;
        });
    };

    // --- Handlers ---

    // Set same turno for all days (simple mode)
    const handleTurnoGlobal = (grado, seccion, turno) => {
        setData(prev => ({
            ...prev,
            seccionTurno: {
                ...prev.seccionTurno,
                [activeSede]: {
                    ...(prev.seccionTurno[activeSede] || {}),
                    [grado]: { ...(prev.seccionTurno[activeSede]?.[grado] || {}), [seccion]: turno }
                }
            }
        }));
    };

    // Set turno for a specific day (advanced mode)
    const handleTurnoPorDia = (grado, seccion, diaId, turno) => {
        setHasChangedAdvanced(prev => ({ ...prev, [`${grado}__${seccion}`]: true }));
        const diasConBloques = getDiasConBloques(grado);
        const current = data.seccionTurno[activeSede]?.[grado]?.[seccion];
        // Build the per-day object. If it was a string, expand only the relevant days.
        const currentObj = typeof current === 'object' && current !== null
            ? current
            : diasConBloques.reduce((acc, d) => ({ ...acc, [d.id]: current || null }), {});

        setData(prev => {
            const newTurno = currentObj[diaId] === turno ? null : turno;
            return {
                ...prev,
                seccionTurno: {
                    ...prev.seccionTurno,
                    [activeSede]: {
                        ...(prev.seccionTurno[activeSede] || {}),
                        [grado]: {
                            ...(prev.seccionTurno[activeSede]?.[grado] || {}),
                            [seccion]: { ...currentObj, [diaId]: newTurno }
                        }
                    }
                }
            };
        });
    };

    // Toggle advanced mode popover for a section card
    const toggleAdvanced = (grado, seccion) => {
        const key = `${grado}__${seccion}`;
        const isEntering = !advancedMode[key];
        const diasConBloques = getDiasConBloques(grado);

        if (isEntering) {
            // Convert current simple string to per-day object (only days with blocks)
            const current = data.seccionTurno[activeSede]?.[grado]?.[seccion];
            if (typeof current === 'string') {
                const expanded = diasConBloques.reduce((acc, d) => ({ ...acc, [d.id]: current }), {});
                setData(prev => ({
                    ...prev,
                    seccionTurno: {
                        ...prev.seccionTurno,
                        [activeSede]: {
                            ...prev.seccionTurno[activeSede],
                            [grado]: { ...(prev.seccionTurno[activeSede]?.[grado] || {}), [seccion]: expanded }
                        }
                    }
                }));
            }
        } else {
            setHasChangedAdvanced(prev => ({ ...prev, [key]: false }));
            // Collapse ONLY if all days have the exact same turno.
            const current = data.seccionTurno[activeSede]?.[grado]?.[seccion];
            if (typeof current === 'object' && current !== null) {
                const values = Object.values(current);
                const allSame = values.length > 0 && values.every(v => v === values[0]);
                if (allSame) {
                    setData(prev => ({
                        ...prev,
                        seccionTurno: {
                            ...prev.seccionTurno,
                            [activeSede]: {
                                ...prev.seccionTurno[activeSede],
                                [grado]: { ...(prev.seccionTurno[activeSede]?.[grado] || {}), [seccion]: values[0] }
                            }
                        }
                    }));
                }
            }
        }
        setAdvancedMode(prev => ({ ...prev, [key]: isEntering }));
    };

    return (
        <div className="w-full flex flex-col animate-fade-in pb-4">
            {/* Encabezado y Edición */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-2 gap-2 pb-3 border-b border-slate-100">
                <div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-2 leading-tight tracking-tight">
                        Asignación de Turnos
                    </h2>
                    <p className="text-slate-500 text-sm m-0 max-w-xl">
                        Selecciona a qué turno pertenece cada sección. <span className="font-semibold text-slate-600">Si cambia de turno según el día</span>, usa el botón <span className="font-semibold text-[var(--color-brand-primary)]">Variar por día</span>.
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

            <div className={`w-full max-w-5xl mx-auto flex flex-col gap-2 ${isSaved ? 'opacity-60 pointer-events-none select-none grayscale-[20%]' : ''}`}>

                {/* GRID DE GRADOS Y TURNOS */}
                <div className="flex flex-col gap-3">
                    {/* SELECTOR DE GRADOS (TABS) Y SECCIONES DEL GRADO ACTIVO */}
                    {activeTab && gradosSedeActiva[activeTab] && (
                        <div className="w-full flex flex-col gap-3 mt-1">
                            
                            {/* Tabs de Grados y Selector de Sede */}
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="text-[var(--color-brand-primary)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                        <h3 className="text-lg font-bold text-slate-800">Selecciona el Grado</h3>
                                    </div>
                                    
                                    {/* SELECTOR DE SEDES INLINE */}
                                    {sedes.length > 1 && (
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 hidden sm:block">Sedes</span>
                                            <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                                                {sedes.map(sede => {
                                                    const isActive = activeSede === sede;
                                                    return (
                                                        <button
                                                            key={sede}
                                                            onClick={() => setActiveSede(sede)}
                                                            className={`cursor-pointer px-4 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-2
                                                                ${isActive
                                                                    ? 'bg-[var(--color-brand-primary)] text-white shadow-sm'
                                                                    : 'text-slate-500 hover:text-slate-700'}`}
                                                        >
                                                            <span className="uppercase">Sede {sede}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {Object.keys(gradosSedeActiva).sort((a, b) => parseInt(a) - parseInt(b)).map(grado => {
                                        const isActive = activeTab === grado;
                                        return (
                                            <button
                                                key={grado}
                                                onClick={() => setActiveTab(grado)}
                                                className={`px-4 py-2.5 rounded-2xl border-2 font-bold transition-all flex items-center gap-3 cursor-pointer
                                                    ${isActive
                                                        ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)] shadow-[0_4px_16px_rgba(16,207,174,0.15)] transform hover:-translate-y-1'
                                                        : 'border-slate-200 bg-white text-slate-400 hover:border-[var(--color-brand-primary)]/40 hover:bg-slate-50 hover:-translate-y-1 shadow-sm'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors 
                                                    ${isActive 
                                                        ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-white' 
                                                        : 'border-slate-200 bg-white'}`}>
                                                    <span className="text-base font-black">{grado}°</span>
                                                </div>
                                                <span className="text-sm font-bold uppercase tracking-widest hidden sm:block">Grado</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Contenido del Grado Activo */}
                            <div className="flex flex-col gap-4">
                                {(() => {
                                    const grado = activeTab;
                                    const seccionesArray = gradosSedeActiva[grado] || [];
                                    const diasConBloques = getDiasConBloques(grado);
                                    const puedeVariarPorDia = diasConBloques.length >= 2;

                                    return (
                                        <>
                                            <div className="flex items-center gap-3 mb-2 px-1">
                                                <h4 className="text-xl font-extrabold text-slate-800">Secciones del {grado}° Grado</h4>
                                                <span className="ml-auto text-[10px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                                                    {diasConBloques.length === 0
                                                        ? 'Sin bloques'
                                                        : diasConBloques.map(d => d.nombre.slice(0, 3)).join(' · ')}
                                                </span>
                                            </div>

                                            {/* Tarjetas Premium Chunky para las secciones del grado activo (CARRUSEL CON FLECHAS) */}
                                            <div className="relative group w-full flex items-center">
                                                {seccionesArray.length > 2 && (
                                                    <button onClick={() => { if(carouselRef.current) carouselRef.current.scrollBy({ left: -340, behavior: 'smooth' }) }} className="absolute -left-6 z-10 bg-white border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] w-10 h-10 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-[var(--color-brand-primary)] hover:text-white transition-colors">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                                    </button>
                                                )}
                                                
                                                <div ref={carouselRef} className="flex gap-5 overflow-hidden pb-6 pt-2 w-full px-6 scroll-smooth">
                                                    {seccionesArray.map(seccion => {
                                                        const key = `${grado}__${seccion}`;
                                                        const isAdvanced = !!advancedMode[key];
                                                        const valor = data.seccionTurno[activeSede]?.[grado]?.[seccion];
                                                        
                                                        const isMixed = typeof valor === 'object' && valor !== null && new Set(Object.values(valor)).size > 1;
                                                        const turnoGlobal = typeof valor === 'string' ? valor : (isMixed ? null : (valor ? Object.values(valor)[0] : null));

                                                        const getBtnClass = () => {
                                                            return 'px-3 py-2 text-white bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] shadow-md shadow-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/90';
                                                        };

                                                        return (
                                                            <div key={seccion}
                                                                className={`bg-white border-2 rounded-3xl p-4 shadow-sm flex flex-col gap-3 transition-all duration-300 min-w-[360px] max-w-[380px] shrink-0 ${isMixed ? 'border-[var(--color-brand-primary)]/40' : 'border-slate-100 hover:border-[var(--color-brand-primary)]/30'
                                                                    }`}>

                                                                {/* Header de la tarjeta */}
                                                                <div className="flex flex-col gap-4 w-full">
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-100 px-4 py-1.5 rounded-full">
                                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sección</span>
                                                                            <span className="text-lg font-black text-[var(--color-brand-primary)]">{seccion}</span>
                                                                        </div>

                                                                        {/* Botón toggle modo avanzado (Siempre arriba a la derecha) */}
                                                                        {puedeVariarPorDia && (
                                                                            <button
                                                                                onClick={() => toggleAdvanced(grado, seccion)}
                                                                                className={`cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 rounded-xl border-2 ${getBtnClass()}`}
                                                                            >
                                                                                {isAdvanced && hasChangedAdvanced[`${grado}__${seccion}`] && (
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                                    </svg>
                                                                                )}
                                                                                {isAdvanced && !hasChangedAdvanced[`${grado}__${seccion}`] && (
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                                                        <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                                                                                    </svg>
                                                                                )}
                                                                                {!isAdvanced && (
                                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                                                        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                                                                    </svg>
                                                                                )}
                                                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                                                    {isAdvanced ? (hasChangedAdvanced[`${grado}__${seccion}`] ? "Listo" : "Cerrar") : "Variar por día"}
                                                                                </span>
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {/* MODO SIMPLE: un selector de turno para todos los días */}
                                                                    {!isAdvanced && (
                                                                        <div className="flex flex-wrap justify-center gap-3 w-full">
                                                                            {data.turnos.map(turno => {
                                                                                const isSelected = turnoGlobal === turno;
                                                                                const isManana = turno === 'Mañana';
                                                                                return (
                                                                                    <button key={turno}
                                                                                        onClick={() => handleTurnoGlobal(grado, seccion, turno)}
                                                                                        className={`cursor-pointer flex-1 min-w-0 px-4 py-5 rounded-2xl transition-all border-2 flex flex-col items-center justify-center gap-3 ${isSelected
                                                                                            ? 'bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] shadow-[0_4px_12px_rgba(16,207,174,0.15)] transform hover:-translate-y-1'
                                                                                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-[var(--color-brand-primary)]/40 hover:bg-white hover:-translate-y-1'
                                                                                            }`}>
                                                                                        {isManana ? (
                                                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M5 5l1.5 1.5"></path><path d="M17.5 17.5L19 19"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M5 19l1.5-1.5"></path><path d="M17.5 6.5L19 5"></path></svg>
                                                                                        ) : (
                                                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10V2"></path><path d="M12 14v8"></path><path d="M4 12H2"></path><path d="M22 12h-2"></path><path d="M4.9 4.9l1.4 1.4"></path><path d="M17.7 17.7l1.4 1.4"></path><path d="M4.9 19.1l1.4-1.4"></path><path d="M17.7 4.9l1.4 1.4"></path></svg>
                                                                                        )}
                                                                                        <span className="text-[13px] font-black uppercase tracking-wide">{turno}</span>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}

                                                                    {/* MODO AVANZADO: fila horizontal de días */}
                                                                    {isAdvanced && (
                                                                        <div className="flex flex-col gap-3 w-full animate-fade-in bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
                                                                            <p className="text-[11px] font-semibold text-slate-400 text-center m-0">
                                                                                Selecciona el turno de cada día. <span className="text-[var(--color-brand-primary)] font-bold">AM</span> = Mañana · <span className="text-[var(--color-brand-primary)] font-bold">PM</span> = Tarde
                                                                            </p>
                                                                            <div className="flex gap-2.5 w-full">
                                                                                {diasConBloques.map((dia) => {
                                                                                    const turnoDelDia = typeof valor === 'object' && valor !== null
                                                                                        ? (valor[dia.id] || null)
                                                                                        : (turnoGlobal);
                                                                                    return (
                                                                                        <div key={dia.id} className="flex-1 flex flex-col items-center gap-2">
                                                                                            <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider">{dia.nombre.substring(0, 3)}</span>
                                                                                            <div className="flex flex-col gap-1.5 w-full">
                                                                                                {data.turnos.map(turno => (
                                                                                                    <button key={turno}
                                                                                                        onClick={() => handleTurnoPorDia(grado, seccion, dia.id, turno)}
                                                                                                        className={`cursor-pointer w-full py-2.5 rounded-xl text-[11px] font-black transition-all border-2 ${turnoDelDia === turno
                                                                                                            ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/30 shadow-sm'
                                                                                                            : 'bg-white text-slate-400 border-slate-200 hover:border-[var(--color-brand-primary)]/30 hover:text-slate-500'
                                                                                                            }`}>
                                                                                                        {turno === 'Mañana' ? 'AM' : 'PM'}
                                                                                                    </button>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {seccionesArray.length > 2 && (
                                                    <button onClick={() => { if(carouselRef.current) carouselRef.current.scrollBy({ left: 340, behavior: 'smooth' }) }} className="absolute -right-6 z-10 bg-white border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] w-10 h-10 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-[var(--color-brand-primary)] hover:text-white transition-colors">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useEffect, useState } from 'react';

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
        if (!data.secciones || data.turnos.length <= 1) return;
        const primerTurno = data.turnos[0];

        if (!data.seccionTurno) {
            // First time: build from scratch
            const init = {};
            for (const sede of Object.keys(data.secciones)) {
                init[sede] = {};
                for (const grado of Object.keys(data.secciones[sede])) {
                    init[sede][grado] = {};
                    for (const sec of data.secciones[sede][grado]) {
                        init[sede][grado][sec] = primerTurno;
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
                            updated[sede][grado][sec] = primerTurno;
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
    // Track which section cards are in "per-day" mode: key = "grado__seccion"
    const [advancedMode, setAdvancedMode] = useState({});

    useEffect(() => {
        if (data.secciones) {
            const sedes = Object.keys(data.secciones);
            if (sedes.length > 0 && !activeSede) setActiveSede(sedes[0]);
        }
    }, [data.secciones, activeSede]);

    if (!data.seccionTurno || !activeSede || data.turnos.length <= 1) return null;

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

    // Toggle advanced mode for a section card
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
            // Collapse ONLY if all days have the exact same turno.
            const current = data.seccionTurno[activeSede]?.[grado]?.[seccion];
            if (typeof current === 'object') {
                const values = Object.values(current);
                const allSame = values.every(v => v === values[0]);
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
        <div className="w-full flex flex-col items-center animate-fade-in pb-6 px-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] text-center mb-2 leading-tight">
                Asignación de Turnos
            </h2>
            <div className="w-full max-w-[800px] flex flex-col items-end gap-5 mb-5">
                <p className="text-slate-500 text-center mb-8 text-lg w-full">
                    Selecciona a qué turno pertenece cada sección.{' '}
                    <span className="font-semibold text-slate-600">Si una sección cambia de turno según el día</span>
                    , usa el botón <span className="font-semibold text-[var(--color-brand-primary)]">Variar por día</span>.
                </p>
                {isSaved && (
                    <button
                        onClick={onEnableEdit}
                        className="px-4 py-1.5 rounded-full border-2 border-[var(--color-brand-primary)] text-[#ffffff] text-sm font-bold bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)] hover:border-[var(--color-brand-dark)] transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        Activar Edición
                    </button>
                )}
                {isEditing && (
                    <button
                        onClick={onCancelEdit}
                        className="px-4 py-1.5 rounded-full border-2 border-[var(--color-brand-primary)] text-slate-500 text-sm font-bold bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Cancelar Edición
                    </button>
                )}
            </div>

            <div className={`w-full max-w-[800px] flex flex-col items-center ${isSaved ? 'opacity-60 pointer-events-none select-none grayscale-[20%]' : ''}`}>

            {/* SEDES tabs */}
            {sedes.length > 1 && (
                <div className="flex flex-wrap justify-center gap-2 mb-5 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-full max-w-[700px]">
                    {sedes.map(sede => (
                        <button key={sede} onClick={() => setActiveSede(sede)}
                            className={`cursor-pointer px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeSede === sede
                                ? 'bg-[var(--color-brand-primary)] text-white shadow-lg shadow-[var(--color-brand-primary)]/30 scale-105'
                                : 'bg-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                                }`}>
                            Sede {sede}
                        </button>
                    ))}
                </div>
            )}

            {/* GRADOS — sueltos */}
            <div className="w-full max-w-[700px] flex flex-col gap-4">
                {Object.keys(gradosSedeActiva).sort((a, b) => parseInt(a) - parseInt(b)).map(grado => {
                    const seccionesArray = gradosSedeActiva[grado] || [];
                    if (seccionesArray.length === 0) return null;

                    // Days with blocks for this grade
                    const diasConBloques = getDiasConBloques(grado);
                    // Only show "Por día" button if there are 2+ days with blocks
                    const puedeVariarPorDia = diasConBloques.length >= 2;

                    return (
                        <div key={grado}>
                            {/* Cabecera grado */}
                            <div className="flex items-center gap-3 mb-3 px-1">
                                <div className="w-9 h-9 rounded-xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center font-black text-base text-slate-700">
                                    {grado}°
                                </div>
                                <span className="font-bold text-slate-500 text-sm uppercase tracking-wider">Grado</span>
                                {/* Days badge */}
                                <span className="ml-auto text-xs text-slate-400 font-medium">
                                    {diasConBloques.length === 0
                                        ? 'Sin bloques'
                                        : diasConBloques.map(d => d.nombre.slice(0, 3)).join(' · ')}
                                </span>
                            </div>

                            {/* Tarjetas de secciones */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {seccionesArray.map(seccion => {
                                    const key = `${grado}__${seccion}`;
                                    const isAdvanced = !!advancedMode[key];
                                    const valor = data.seccionTurno[activeSede]?.[grado]?.[seccion];
                                    
                                    const isMixed = typeof valor === 'object' && new Set(Object.values(valor)).size > 1;
                                    const turnoGlobal = typeof valor === 'string' ? valor : (isMixed ? null : Object.values(valor)[0] || data.turnos[0]);

                                    const getBtnClass = () => {
                                        if (isAdvanced && isMixed) return 'px-3 py-1.5 text-white bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] shadow-md shadow-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]';
                                        if (isAdvanced && !isMixed) return 'px-3 py-1.5 text-slate-500 bg-white border-slate-300 hover:bg-slate-100 shadow-sm';
                                        if (!isAdvanced && isMixed) return 'px-3 py-1.5 text-white bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] shadow-md shadow-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]';
                                        return 'px-3 py-2 text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/8 border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-brand-primary)]/15 hover:border-[var(--color-brand-primary)] shadow-sm';
                                    };

                                    return (
                                        <div key={seccion}
                                            className={`bg-white border-2 rounded-2xl p-3 shadow-sm flex flex-col gap-3 transition-all duration-300 ${isAdvanced ? 'border-[var(--color-brand-primary)]/50 col-span-2 sm:col-span-3' : 'border-slate-100 items-center hover:border-[var(--color-brand-primary)]/30'
                                                }`}>

                                            {/* Header de la tarjeta */}
                                            <div className={`flex items-center ${isAdvanced ? 'justify-between' : 'flex-col gap-5 w-full'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sección</span>
                                                    <span className="text-xl font-black text-[var(--color-brand-primary)]">{seccion}</span>
                                                </div>

                                                {/* MODO SIMPLE: un selector de turno para todos los días */}
                                                {!isAdvanced && (
                                                    <div className="flex flex-wrap justify-center gap-1.5 w-full">
                                                        {data.turnos.map(turno => (
                                                            <button key={turno}
                                                                onClick={() => handleTurnoGlobal(grado, seccion, turno)}
                                                                className={`cursor-pointer flex-1 min-w-0 px-2 py-2 rounded-lg text-xs font-bold transition-all border-2 ${turnoGlobal === turno
                                                                    ? 'bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                                                                    : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-600'
                                                                    }`}>
                                                                {turno}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Botón toggle modo avanzado — solo si hay 2+ días con bloques */}
                                                {puedeVariarPorDia && (
                                                    <button
                                                        onClick={() => toggleAdvanced(grado, seccion)}
                                                        className={`cursor-pointer flex items-center gap-2 transition-all duration-200 rounded-xl border-2 ${getBtnClass()}`}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                        {isAdvanced ? (
                                                            isMixed 
                                                                ? <span className="text-[12px] font-black">✓ Listo</span>
                                                                : <span className="text-[12px] font-black">✕ Cerrar</span>
                                                        ) : (
                                                            <span className="text-[12px] font-black">
                                                                Variar por día {isMixed && "(Activo)"}
                                                            </span>
                                                        )}
                                                    </button>
                                                )}
                                            </div>



                                            {/* MODO AVANZADO: un selector por cada día con bloques */}
                                            {isAdvanced && (
                                                <div className="flex flex-col gap-2 w-full">
                                                    {diasConBloques.map(dia => {
                                                        const turnoDelDia = typeof valor === 'object' && valor !== null
                                                            ? (valor[dia.id] || data.turnos[0])
                                                            : (turnoGlobal);
                                                        const bloquesDelDia = (data.gradoDiaConfig || {})[`${grado}-${dia.id}`] || 0;
                                                        return (
                                                            <div key={dia.id} className="flex items-center gap-3">
                                                                <div className="flex flex-col w-24 shrink-0">
                                                                    <span className="text-xs font-bold text-slate-600">{dia.nombre}</span>
                                                                    <span className="text-[10px] text-slate-400">{bloquesDelDia} bloque{bloquesDelDia !== 1 ? 's' : ''}</span>
                                                                </div>
                                                                <div className="flex gap-1.5 flex-1">
                                                                    {data.turnos.map(turno => (
                                                                        <button key={turno}
                                                                            onClick={() => handleTurnoPorDia(grado, seccion, dia.id, turno)}
                                                                            className={`cursor-pointer flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${turnoDelDia === turno
                                                                                ? 'bg-[var(--color-brand-primary)]/10 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                                                                                : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200 hover:text-slate-600'
                                                                                }`}>
                                                                            {turno}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="h-px bg-slate-100 mt-4" />
                        </div>
                    );
                })}
            </div>
        </div>
        </div>
    );
}

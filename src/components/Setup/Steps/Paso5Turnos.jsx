import React, { useEffect, useState } from 'react';

/**
 * seccionTurno data structure:
 *   Simple mode:   seccionTurno[sede][grado][seccion] = "Mañana"  (string)
 *   Advanced mode: seccionTurno[sede][grado][seccion] = { [diaId]: "Mañana", ... }  (object)
 *
 * gradoDiaConfig key: "grado-diaId" → bloques_dia (number)
 * Only days with bloques_dia > 0 are relevant for a grade.
 */
export default function Paso5Turnos({ data, setData }) {
    // Initialize with first turno for all sections (simple mode)
    useEffect(() => {
        if (!data.seccionTurno && data.secciones && data.turnos.length > 1) {
            const primerTurno = data.turnos[0];
            const init = {};
            for (const sede of Object.keys(data.secciones)) {
                init[sede] = {};
                for (const grado of Object.keys(data.secciones[sede])) {
                    init[sede][grado] = {};
                    for (const sec of data.secciones[sede][grado]) {
                        init[sede][grado][sec] = primerTurno; // simple string
                    }
                }
            }
            setData(prev => ({ ...prev, seccionTurno: init }));
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
                    ...prev.seccionTurno[activeSede],
                    [grado]: { ...prev.seccionTurno[activeSede][grado], [seccion]: turno }
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
            : diasConBloques.reduce((acc, d) => ({ ...acc, [d.id]: current || data.turnos[0] }), {});

        setData(prev => ({
            ...prev,
            seccionTurno: {
                ...prev.seccionTurno,
                [activeSede]: {
                    ...prev.seccionTurno[activeSede],
                    [grado]: {
                        ...prev.seccionTurno[activeSede][grado],
                        [seccion]: { ...currentObj, [diaId]: turno }
                    }
                }
            }
        }));
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
                            [grado]: { ...prev.seccionTurno[activeSede][grado], [seccion]: expanded }
                        }
                    }
                }));
            }
        } else {
            // Collapse: pick the most common turno as global value
            const current = data.seccionTurno[activeSede]?.[grado]?.[seccion];
            if (typeof current === 'object') {
                const values = Object.values(current);
                const majority = values.sort((a, b) =>
                    values.filter(v => v === b).length - values.filter(v => v === a).length
                )[0] || data.turnos[0];
                setData(prev => ({
                    ...prev,
                    seccionTurno: {
                        ...prev.seccionTurno,
                        [activeSede]: {
                            ...prev.seccionTurno[activeSede],
                            [grado]: { ...prev.seccionTurno[activeSede][grado], [seccion]: majority }
                        }
                    }
                }));
            }
        }
        setAdvancedMode(prev => ({ ...prev, [key]: isEntering }));
    };

    return (
        <div className="w-full flex flex-col items-center animate-fade-in pb-6 px-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] text-center mb-2 leading-tight">
                Asignación de Turnos
            </h2>
            <p className="text-slate-500 text-center mb-6 text-base max-w-[480px]">
                Selecciona a qué turno pertenece cada sección.{' '}
                <span className="font-semibold text-slate-600">Si una sección cambia de turno según el día</span>
                , usa el botón <span className="font-semibold text-[#10CFAE]">Variar por día</span>.
            </p>

            {/* SEDES tabs */}
            {sedes.length > 1 && (
                <div className="flex flex-wrap justify-center gap-2 mb-5 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-full max-w-[700px]">
                    {sedes.map(sede => (
                        <button key={sede} onClick={() => setActiveSede(sede)}
                            className={`cursor-pointer px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeSede === sede
                                ? 'bg-[#10CFAE] text-white shadow-lg shadow-[#10CFAE]/30 scale-105'
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
                                    const turnoGlobal = typeof valor === 'string' ? valor : data.turnos[0];

                                    return (
                                        <div key={seccion}
                                            className={`bg-white border-2 rounded-2xl p-3 shadow-sm flex flex-col gap-3 transition-all duration-300 ${isAdvanced ? 'border-[#10CFAE]/50 col-span-2 sm:col-span-3' : 'border-slate-100 items-center hover:border-[#10CFAE]/30'
                                                }`}>

                                            {/* Header de la tarjeta */}
                                            <div className={`flex items-center ${isAdvanced ? 'justify-between' : 'flex-col gap-5 w-full'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sección</span>
                                                    <span className="text-xl font-black text-[#10CFAE]">{seccion}</span>
                                                </div>

                                                {/* MODO SIMPLE: un selector de turno para todos los días */}
                                                {!isAdvanced && (
                                                    <div className="flex flex-wrap justify-center gap-1.5 w-full">
                                                        {data.turnos.map(turno => (
                                                            <button key={turno}
                                                                onClick={() => handleTurnoGlobal(grado, seccion, turno)}
                                                                className={`cursor-pointer flex-1 min-w-0 px-2 py-2 rounded-lg text-xs font-bold transition-all border-2 ${turnoGlobal === turno
                                                                    ? 'bg-[#10CFAE]/10 border-[#10CFAE] text-[#10CFAE]'
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
                                                        className={`cursor-pointer flex items-center gap-2 transition-all duration-200 rounded-xl border-2 ${isAdvanced
                                                            ? 'px-3 py-1.5 text-white bg-[#10CFAE] border-[#10CFAE] shadow-md shadow-[#10CFAE]/30 hover:bg-[#0db89a]'
                                                            : 'px-3 py-2 text-[#10CFAE] bg-[#10CFAE]/8 border-[#10CFAE]/40 hover:bg-[#10CFAE]/15 hover:border-[#10CFAE] shadow-sm'
                                                            }`}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                                        </svg>
                                                        {isAdvanced
                                                            ? <span className="text-xs font-bold">✕</span>
                                                            : <span className="text-[12px] font-black ">
                                                                Variar por día
                                                            </span>
                                                        }
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
                                                                                ? 'bg-[#10CFAE]/10 border-[#10CFAE] text-[#10CFAE]'
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
    );
}

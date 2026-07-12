import React, { useEffect, useState } from 'react';

const OPCIONES_SECCION = ['A', 'B', 'C', 'D'];

export default function Paso4Secciones({ data, setData, isSaved, onEnableEdit, isEditing, onCancelEdit }) {
    // Si no hay secciones inicializadas, lo hacemos al montar
    useEffect(() => {
        if (!data.secciones && data.grados && data.sedes) {
            const initialSecciones = {};
            data.sedes.forEach(sede => {
                initialSecciones[sede] = {};
                data.grados.forEach(grado => {
                    // Por defecto, asignar la sección "A"
                    initialSecciones[sede][grado] = ["A"];
                });
            });
            setData(prev => ({ ...prev, secciones: initialSecciones }));
        }
    }, [data.grados, data.sedes, data.secciones, setData]);

    const [activeSede, setActiveSede] = useState(data.sedes?.[0] || '');
    const [addingCustom, setAddingCustom] = useState({});
    const [customInput, setCustomInput] = useState({});

    // Auto-seleccionar la primera sede al cargar si no está seteada
    useEffect(() => {
        if (data.sedes && data.sedes.length > 0 && !activeSede) {
            setActiveSede(data.sedes[0]);
        }
    }, [data.sedes, activeSede]);

    if (!data.secciones || !activeSede) return null;

    const currentSecciones = data.secciones[activeSede] || {};

    const toggleSeccion = (grado, seccionNombre) => {
        const actuales = currentSecciones[grado] || [];

        let nuevas;
        if (actuales.includes(seccionNombre)) {
            // Quitarla
            nuevas = actuales.filter(s => s !== seccionNombre);
        } else {
            // Añadirla
            nuevas = [...actuales, seccionNombre];
        }

        setData(prev => ({
            ...prev,
            secciones: {
                ...prev.secciones,
                [activeSede]: {
                    ...prev.secciones[activeSede],
                    [grado]: nuevas
                }
            }
        }));
    };

    return (
        <div className="w-full flex flex-col items-center animate-fade-in pb-12 px-4">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] text-center mb-3 leading-tight">
                Secciones por Grado
            </h2>
            <div className="w-full max-w-[800px] flex flex-col items-end gap-5 mb-5">
                <p className="text-slate-500 text-center mb-8 text-lg w-full">
                    Selecciona las secciones para cada grado. Haz clic para activar o desactivar.
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

                {/* PESTAÑAS DE SEDES (solo si hay más de 1) */}
                {data.sedes.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-6 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        {data.sedes.map(sede => {
                            const isActive = activeSede === sede;
                            return (
                                <button
                                    key={sede}
                                    onClick={() => setActiveSede(sede)}
                                    className={`cursor-pointer px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${isActive
                                        ? 'bg-[var(--color-brand-primary)] text-white shadow-lg shadow-[var(--color-brand-primary)]/30 scale-105'
                                        : 'bg-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                                        }`}
                                >
                                    Sede {sede}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="w-full flex flex-col gap-4">
                    {[...data.grados].sort((a, b) => a - b).map(grado => {
                        const seleccionadas = currentSecciones[grado] || [];

                        return (
                            <div key={grado} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 flex flex-col hover:border-[var(--color-brand-primary)]/50 hover:shadow-md transition-all gap-4">
                                {/* Cabecera del grado */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center font-black text-lg text-slate-700">
                                        {grado}°
                                    </div>
                                    <span className="font-bold text-slate-600">Grado</span>
                                </div>

                                {/* Opciones de secciones (Botones Toggle) */}
                                <div className="flex flex-wrap gap-2 pl-2">
                                    {Array.from(new Set([...OPCIONES_SECCION, ...seleccionadas])).sort().map(opcion => {
                                        const isSelected = seleccionadas.includes(opcion);
                                        return (
                                            <button
                                                key={opcion}
                                                onClick={() => toggleSeccion(grado, opcion)}
                                                className={`cursor-pointer px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${isSelected
                                                    ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white shadow-md shadow-[var(--color-brand-primary)]/20 scale-105'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-brand-primary)]/5'
                                                    }`}
                                            >
                                                {opcion}
                                            </button>
                                        );
                                    })}
                                    {/* Botón + o Input para añadir otra */}
                                    {addingCustom[grado] ? (
                                        <div className="flex items-center gap-1 animate-fade-in">
                                            <input
                                                type="text"
                                                value={customInput[grado] || ''}
                                                onChange={(e) => setCustomInput(prev => ({ ...prev, [grado]: e.target.value }))}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = (customInput[grado] || '').trim().toUpperCase();
                                                        if (val && !seleccionadas.includes(val)) toggleSeccion(grado, val);
                                                        setAddingCustom(prev => ({ ...prev, [grado]: false }));
                                                        setCustomInput(prev => ({ ...prev, [grado]: '' }));
                                                    } else if (e.key === 'Escape') {
                                                        setAddingCustom(prev => ({ ...prev, [grado]: false }));
                                                        setCustomInput(prev => ({ ...prev, [grado]: '' }));
                                                    }
                                                }}
                                                placeholder="Ej: Única, E..."
                                                className="w-28 px-3 py-2 rounded-xl text-sm border-2 border-[var(--color-brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => {
                                                    const val = (customInput[grado] || '').trim().toUpperCase();
                                                    if (val && !seleccionadas.includes(val)) toggleSeccion(grado, val);
                                                    setAddingCustom(prev => ({ ...prev, [grado]: false }));
                                                    setCustomInput(prev => ({ ...prev, [grado]: '' }));
                                                }}
                                                className="w-9 h-9 flex items-center justify-center bg-[var(--color-brand-primary)] text-white rounded-xl hover:bg-[var(--color-brand-primary)] transition-colors"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setAddingCustom(prev => ({ ...prev, [grado]: false }));
                                                    setCustomInput(prev => ({ ...prev, [grado]: '' }));
                                                }}
                                                className="w-9 h-9 flex items-center justify-center border-2 border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-colors"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setAddingCustom(prev => ({ ...prev, [grado]: true }))}
                                            className="cursor-pointer px-3 py-2 rounded-xl font-bold text-sm transition-all border-2 border-dashed border-slate-300 text-slate-400 hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 flex items-center justify-center"
                                            title="Añadir otra sección"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

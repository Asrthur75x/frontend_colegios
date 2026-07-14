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
                    // Inicializar vacío para que el usuario deba seleccionar obligatoriamente
                    initialSecciones[sede][grado] = [];
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
        <div className="w-full flex flex-col animate-fade-in pb-12">
            {/* Encabezado y Edición */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] mb-2 leading-tight tracking-tight">
                        Secciones por Grado
                    </h2>
                    <p className="text-slate-500 text-sm m-0 max-w-xl">
                        Configura las secciones (paralelos) disponibles para cada grado en tus sedes.
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

                {/* GRID DE GRADOS Y SECCIONES */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-100 pb-2 gap-3">
                        <div className="flex items-center gap-2">
                            <svg className="text-[var(--color-brand-primary)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            <h3 className="text-lg font-bold text-slate-800">Secciones Disponibles</h3>
                        </div>

                        {/* SELECTOR DE SEDES INLINE */}
                        {data.sedes.length > 1 && (
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 hidden sm:block">Sedes</span>
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl w-fit">
                                    {data.sedes.map(sede => {
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
                                                {sede}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {[...data.grados].sort((a, b) => a - b).map(grado => {
                            const seleccionadas = currentSecciones[grado] || [];

                            return (
                                <div key={grado} className="bg-white border-2 border-slate-100 hover:border-[var(--color-brand-primary)]/30 rounded-3xl p-5 flex flex-col items-center gap-5 transition-all shadow-sm">
                                    {/* Cabecera del grado */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-14 h-14 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center font-black text-2xl text-slate-700">
                                            {grado}°
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Grado</span>
                                    </div>

                                    {/* Opciones de secciones (Botones Toggle) */}
                                    <div className="flex flex-wrap justify-center gap-2 w-full border-t-2 border-slate-50 pt-4">
                                        {Array.from(new Set([...OPCIONES_SECCION, ...seleccionadas])).sort().map(opcion => {
                                            const isSelected = seleccionadas.includes(opcion);
                                            return (
                                                <button
                                                    key={opcion}
                                                    onClick={() => toggleSeccion(grado, opcion)}
                                                    className={`cursor-pointer w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all border-2 ${isSelected
                                                        ? 'bg-[var(--color-brand-primary)] border-[var(--color-brand-primary)] text-white shadow-md shadow-[var(--color-brand-primary)]/20 transform hover:-translate-y-0.5'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-brand-primary)]/5'
                                                        }`}
                                                >
                                                    {opcion}
                                                </button>
                                            );
                                        })}

                                        {/* Botón + o Input para añadir otra */}
                                        {addingCustom[grado] ? (
                                            <div className="flex items-center gap-1 animate-fade-in w-full justify-center mt-2">
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
                                                    placeholder="Ej: E"
                                                    className="w-16 px-2 py-2 rounded-xl text-center text-sm font-bold border-2 border-[var(--color-brand-primary)] focus:outline-none bg-white text-slate-700"
                                                    autoFocus
                                                    maxLength={3}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const val = (customInput[grado] || '').trim().toUpperCase();
                                                        if (val && !seleccionadas.includes(val)) toggleSeccion(grado, val);
                                                        setAddingCustom(prev => ({ ...prev, [grado]: false }));
                                                        setCustomInput(prev => ({ ...prev, [grado]: '' }));
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center bg-[var(--color-brand-primary)] text-white rounded-xl hover:bg-[var(--color-brand-primary)]/90 transition-colors shadow-sm cursor-pointer"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setAddingCustom(prev => ({ ...prev, [grado]: false }));
                                                        setCustomInput(prev => ({ ...prev, [grado]: '' }));
                                                    }}
                                                    className="w-10 h-10 flex items-center justify-center border-2 border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setAddingCustom(prev => ({ ...prev, [grado]: true }))}
                                                className="cursor-pointer w-10 h-10 rounded-xl font-bold transition-all border-2 border-dashed border-slate-300 text-slate-400 hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)]/5 flex items-center justify-center"
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
        </div>
    );
}

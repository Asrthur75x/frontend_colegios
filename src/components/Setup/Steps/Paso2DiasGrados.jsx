import React from 'react';

export default function Paso2DiasGrados({ data, setData, isSaved, onEnableEdit, isEditing, onCancelEdit }) {
    const diasSemana = [
        { id: 1, nombre: 'Lunes' },
        { id: 2, nombre: 'Martes' },
        { id: 3, nombre: 'Miércoles' },
        { id: 4, nombre: 'Jueves' },
        { id: 5, nombre: 'Viernes' },
        { id: 6, nombre: 'Sábado' },
        { id: 7, nombre: 'Domingo' }
    ];

    const gradosDisponibles = [1, 2, 3, 4, 5, 6];

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
            return { ...prev, grados: nuevosGrados };
        });
    };

    return (
        <div className="w-full flex flex-col items-center animate-fade-in pb-8">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] text-center mb-4 leading-tight">
                Días y Grados
            </h2>
            <div className="w-full max-w-[480px] flex flex-col items-end gap-5 mb-5">
                <p className="text-slate-500 text-center text-lg m-0 w-full">
                    Configura los días lectivos y los grados de tu institución.
                </p>
                {isSaved && (
                    <button
                        onClick={onEnableEdit}
                        className="px-4 py-1.5 rounded-full border-2 border-[var(--color-brand-primary)] text-[#ffffff] text-sm font-bold bg-[var(--color-brand-primary)] hover:opacity-90 transition-opacity shadow-sm cursor-pointer flex items-center justify-center gap-2"
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

            <div className={`w-full max-w-[480px] space-y-8 ${isSaved ? 'opacity-60 pointer-events-none select-none grayscale-[20%]' : ''}`}>

                {/* DÍAS */}
                <div className="w-full">
                    <label className="block text-[13px] font-bold text-slate-400 mb-3 uppercase tracking-wider text-center">
                        Días Lectivos
                    </label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {diasSemana.map((dia) => {
                            const isSelected = data.dias?.some(d => d.nombre === dia.nombre);
                            return (
                                <button
                                    key={dia.id}
                                    onClick={() => handleDiaToggle(dia)}
                                    className={`p-3 rounded-xl border-2 font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer
                                        ${isSelected
                                            ? 'border-brand-primary text-brand-primary bg-brand-primary/10'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                                >
                                    {isSelected && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    )}
                                    {dia.nombre}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* GRADOS */}
                <div className="w-full">
                    <label className="block text-[13px] font-bold text-slate-400 mb-3 uppercase tracking-wider text-center">
                        Grados
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {gradosDisponibles.map((grado) => {
                            const isSelected = data.grados?.includes(grado);
                            return (
                                <button
                                    key={grado}
                                    onClick={() => handleGradoToggle(grado)}
                                    className={`p-4 rounded-xl border-2 font-bold transition-all text-lg flex items-center justify-center cursor-pointer
                                        ${isSelected
                                            ? 'border-brand-primary text-brand-primary bg-brand-primary/10'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                                >
                                    {grado}°
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

import React from 'react';

export default function Paso2DiasGrados({ data, setData }) {
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
        <div className="w-full flex flex-col items-center animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] text-center mb-4 leading-tight">
                Días y Grados
            </h2>
            <p className="text-slate-500 text-center mb-12 text-lg">
                Configura los días lectivos y los grados de tu institución.
            </p>

            <div className="w-full max-w-[480px] space-y-8">
                
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
                                            ? 'border-hx-blue text-hx-blue bg-hx-blue/10' 
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
                                            ? 'border-[#F3C252] text-[#d49e24] bg-[#F3C252]/10' 
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

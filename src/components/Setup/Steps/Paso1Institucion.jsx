import React, { useState } from 'react';

export default function Paso1Institucion({ data, setData }) {

    // Si ya hay un nombre de sede guardado, asumimos que tiene sedes
    const [tieneSedes, setTieneSedes] = useState(data.sede.nombre_sede !== '' ? true : null);

    const handleChange = (section, field, value) => {
        setData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleSedeChoice = (choice) => {
        setTieneSedes(choice);
        if (!choice) {
            // Si elige que no, limpiamos el input
            handleChange('sede', 'nombre_sede', '');
        }
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
            return {
                ...prev,
                turnos: nuevosTurnos
            };
        });
    };

    return (
        <div className="w-full flex flex-col items-center animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#111827] text-center mb-4 leading-tight">
                ¡Bienvenido a HorariX!
            </h2>
            <p className="text-slate-500 text-center mb-12 text-lg">
                Ingresa la información principal de tu institución.
            </p>

            <div className="w-full max-w-[480px] space-y-10">

                {/* COLEGIO */}
                <div className="w-full">
                    <label className="block text-[13px] font-bold text-slate-400 mb-3 uppercase tracking-wider text-center">
                        Colegio
                    </label>
                    <input
                        type="text"
                        className="w-full p-4 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#790EEC] focus:ring-4 focus:ring-[#790EEC]/10 transition-all text-center text-lg font-bold text-slate-800 placeholder-slate-300"
                        placeholder="Ej. San Juan Bautista"
                        value={data.colegio.nombre}
                        onChange={(e) => handleChange('colegio', 'nombre', e.target.value)}
                    />
                </div>

                {/* SEDE */}
                <div className="w-full">
                    <label className="block text-[13px] font-bold text-slate-400 mb-3 uppercase tracking-wider text-center">
                        ¿Cuenta con sedes adicionales?
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                            onClick={() => handleSedeChoice(true)}
                            className={`p-4 rounded-xl border-2 font-bold transition-all text-sm
                                ${tieneSedes === true
                                    ? 'border-[#10CFAE] text-[#0d9b83] bg-[#10CFAE]/10'
                                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                            Sí, tenemos sedes
                        </button>
                        <button
                            onClick={() => handleSedeChoice(false)}
                            className={`p-4 rounded-xl border-2 font-bold transition-all text-sm
                                ${tieneSedes === false
                                    ? 'border-[#F1A5B9] text-[#e33767] bg-[#F1A5B9]/10'
                                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                            No, sede única
                        </button>
                    </div>

                    {tieneSedes && (
                        <div className="animate-fade-in mt-4">
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#10CFAE] focus:ring-4 focus:ring-[#10CFAE]/10 transition-all text-center text-lg font-bold text-slate-800 placeholder-slate-300"
                                placeholder="Nombre de tu Sede Inicial..."
                                value={data.sede.nombre_sede}
                                onChange={(e) => handleChange('sede', 'nombre_sede', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* TURNO */}
                <div className="w-full">
                    <label className="block text-[13px] font-bold text-slate-400 mb-3 uppercase tracking-wider text-center">
                        Selecciona el o los Turnos
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {['Mañana', 'Tarde'].map((turno) => {
                            const isSelected = data.turnos?.includes(turno);
                            return (
                                <button
                                    key={turno}
                                    onClick={() => handleTurnoToggle(turno)}
                                    className={`p-4 rounded-xl border-2 font-bold transition-all text-sm flex items-center justify-center gap-2
                                        ${isSelected 
                                            ? 'border-[#51B4E8] text-[#2c8bbd] bg-[#51B4E8]/10' 
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                                >
                                    {isSelected && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    )}
                                    {turno}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

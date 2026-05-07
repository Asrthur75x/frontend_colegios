import React, { useState } from 'react';

export default function Paso1Institucion({ data, setData }) {

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

            <div className="w-full max-w-[480px] space-y-6">

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
                        onChange={(e) => handleNestedChange('colegio', 'nombre', e.target.value)}
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
                            className={`p-4 rounded-xl border-2 font-bold transition-all text-sm cursor-pointer
                                ${data.tipo_sede === true
                                    ? 'border-[#10CFAE] text-[#0d9b83] bg-[#10CFAE]/10'
                                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                            Sí, tenemos sedes
                        </button>
                        <button
                            onClick={() => handleSedeChoice(false)}
                            className={`p-4 rounded-xl border-2 font-bold transition-all text-sm cursor-pointer
                                ${data.tipo_sede === false
                                    ? 'border-[#F1A5B9] text-[#e33767] bg-[#F1A5B9]/10'
                                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                            No, sede única
                        </button>
                    </div>

                    {data.tipo_sede === false && (
                        <div className="animate-fade-in mt-4 space-y-3">
                            <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider text-center">
                                Nombre de la Sede Única
                            </label>
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#F1A5B9] focus:ring-4 focus:ring-[#F1A5B9]/10 transition-all text-center text-lg font-bold text-slate-800 placeholder-slate-300"
                                placeholder="Ej. Sede Principal"
                                value={data.sedes[0] || ''}
                                onChange={(e) => handleSedeNameChange(0, e.target.value)}
                            />
                        </div>
                    )}

                    {data.tipo_sede === true && (
                        <div className="animate-fade-in mt-4 space-y-4">
                            <div>
                                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
                                    ¿Cuántas sedes tiene?
                                </label>
                                <input
                                    type="number"
                                    min="2"
                                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#10CFAE] focus:ring-4 focus:ring-[#10CFAE]/10 transition-all text-center text-lg font-bold text-slate-800"
                                    value={data.numero_sedes}
                                    onChange={handleNumeroSedes}
                                />
                            </div>
                            
                            <div className="space-y-3 mt-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {data.sedes.map((sede, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <label className="text-[11px] font-bold text-slate-400 ml-2 mb-1">
                                            {idx === 0 ? "Nombre Sede Principal" : `Nombre Sede ${idx + 1}`}
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full p-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-[#10CFAE] focus:ring-2 focus:ring-[#10CFAE]/10 transition-all text-sm font-bold text-slate-800 placeholder-slate-300"
                                            placeholder={idx === 0 ? "Ej. Sede Central" : `Ej. Sede ${idx + 1}`}
                                            value={sede}
                                            onChange={(e) => handleSedeNameChange(idx, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
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
                                    className={`p-4 rounded-xl border-2 font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer
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

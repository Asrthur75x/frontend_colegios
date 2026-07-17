import React, { useState } from 'react';

export default function Paso6Tutoria({ data, setData, isSaved, onEnableEdit, isEditing, onCancelEdit }) {
    const readOnly = isSaved && !isEditing;

    const handleSelect = (val) => {
        if (readOnly) return;
        setData({ ...data, tutoria: val });
    };

    return (
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 w-full max-w-4xl mx-auto flex flex-col min-h-[500px]">
            <div className="mb-10 text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-[var(--color-brand-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Configuración de Tutoría</h2>
                <p className="text-slate-500 text-[15px] font-medium leading-relaxed">
                    ¿Quién dictará el curso de Tutoría en tu colegio?
                </p>
            </div>

            <div className="flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Opción 1: Encargado del Aula */}
                    <label 
                        className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col group ${
                            readOnly 
                                ? (data.tutoria === 'oficial' ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 opacity-100' : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed')
                                : (data.tutoria === 'oficial' 
                                    ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 shadow-md transform scale-[1.02]' 
                                    : 'border-slate-200 hover:border-[var(--color-brand-primary)]/50 bg-white hover:bg-slate-50')
                        }`}
                    >
                        {!readOnly && (
                            <input 
                                type="radio" 
                                name="tutoriaType" 
                                value="oficial"
                                checked={data.tutoria === 'oficial'}
                                onChange={(e) => handleSelect(e.target.value)}
                                className="sr-only"
                            />
                        )}
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${data.tutoria === 'oficial' ? 'bg-[var(--color-brand-primary)] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-[var(--color-brand-primary)]/10 group-hover:text-[var(--color-brand-primary)]'}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                            {data.tutoria === 'oficial' && (
                                <div className="text-[var(--color-brand-primary)] animate-fade-in">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            )}
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-2">Encargado del Aula</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            El tutor asignado de la sección dictará este curso.
                        </p>
                    </label>

                    {/* Opción 2: Curso Normal */}
                    <label 
                        className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col group ${
                            readOnly 
                                ? (data.tutoria === 'normal' ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 opacity-100' : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed')
                                : (data.tutoria === 'normal' 
                                    ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 shadow-md transform scale-[1.02]' 
                                    : 'border-slate-200 hover:border-[var(--color-brand-primary)]/50 bg-white hover:bg-slate-50')
                        }`}
                    >
                        {!readOnly && (
                            <input 
                                type="radio" 
                                name="tutoriaType" 
                                value="normal"
                                checked={data.tutoria === 'normal'}
                                onChange={(e) => handleSelect(e.target.value)}
                                className="sr-only"
                            />
                        )}
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${data.tutoria === 'normal' ? 'bg-[var(--color-brand-primary)] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-[var(--color-brand-primary)]/10 group-hover:text-[var(--color-brand-primary)]'}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                            </div>
                            {data.tutoria === 'normal' && (
                                <div className="text-[var(--color-brand-primary)] animate-fade-in">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            )}
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-2">Docente Específico</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Dictado por un psicólogo o especialista de la institución.
                        </p>
                    </label>

                    {/* Opción 3: Sin Tutoría */}
                    <label 
                        className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col group ${
                            readOnly 
                                ? (data.tutoria === 'none' ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 opacity-100' : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed')
                                : (data.tutoria === 'none' 
                                    ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 shadow-md transform scale-[1.02]' 
                                    : 'border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50')
                        }`}
                    >
                        {!readOnly && (
                            <input 
                                type="radio" 
                                name="tutoriaType" 
                                value="none"
                                checked={data.tutoria === 'none'}
                                onChange={(e) => handleSelect(e.target.value)}
                                className="sr-only"
                            />
                        )}
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${data.tutoria === 'none' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'}`}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                            </div>
                            {data.tutoria === 'none' && (
                                <div className="text-slate-800 animate-fade-in">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                            )}
                        </div>
                        <h3 className="text-lg font-black text-slate-800 mb-2">No dictamos Tutoría</h3>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            Este curso no se registrará en la currícula.
                        </p>
                    </label>
                </div>
            </div>


        </div>
    );
}

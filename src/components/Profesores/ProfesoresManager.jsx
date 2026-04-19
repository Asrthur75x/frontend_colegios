import React, { useState } from 'react';

const mockProfesores = [
    {
        id: 1,
        name: "Ricardo Mendoza",
        materias: ["Urbanismo II", "Teoría III"],
        horas: 32,
        maxHoras: 40
    },
    {
        id: 2,
        name: "Elena Suárez",
        materias: ["Cálculo Diferencial", "Estática"],
        horas: 40,
        maxHoras: 40
    },
    {
        id: 3,
        name: "Javier Vargas",
        materias: ["Modelado 3D"],
        horas: 12,
        maxHoras: 20
    },
    {
        id: 4,
        name: "Lucia Campos",
        materias: ["Historia del Arte", "Composición"],
        horas: 24,
        maxHoras: 40
    }
];

export default function ProfesoresManager() {
    const [profesores, setProfesores] = useState(mockProfesores);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [nuevoProfesor, setNuevoProfesor] = useState({
        name: '',
        maxHoras: 40,
        materias: ''
    });

    const abrirModalNueva = () => {
        setIsEditing(false);
        setEditId(null);
        setNuevoProfesor({ name: '', maxHoras: 40, materias: '' });
        setIsModalOpen(true);
    };

    const abrirModalEdicion = (prof) => {
        setIsEditing(true);
        setEditId(prof.id);
        setNuevoProfesor({
            name: prof.name,
            maxHoras: prof.maxHoras,
            materias: prof.materias.join(', ')
        });
        setIsModalOpen(true);
    };

    const eliminarProfesor = (id) => {
        const confirmacion = window.confirm("¿Estás seguro de que deseas eliminar este profesor?");
        if (confirmacion) {
            setProfesores(profesores.filter(p => p.id !== id));
        }
    };

    const handleGuardar = (e) => {
        e.preventDefault();

        const newEntry = {
            id: isEditing ? editId : Date.now(), // ID único
            name: nuevoProfesor.name,
            materias: nuevoProfesor.materias.split(',').map(m => m.trim()).filter(m => m !== ''),
            horas: isEditing ? profesores.find(p => p.id === editId).horas : 0,
            maxHoras: parseInt(nuevoProfesor.maxHoras)
        };

        if (isEditing) {
            setProfesores(profesores.map(p => p.id === editId ? newEntry : p));
        } else {
            setProfesores([newEntry, ...profesores]);
        }

        setIsModalOpen(false);
    };

    return (
        <div className="w-full space-y-8 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">Inventario de Profesores</h1>
                    <p className="text-[#64748B] mt-1 text-sm max-w-2xl">
                        Administra a los profesores, los cursos que enseñan y sus horarios disponibles para organizar las clases.
                    </p>
                </div>
                <button
                    onClick={abrirModalNueva}
                    className="bg-[#1A5AD7] hover:bg-[#1A5AD7]/90 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center gap-2 transition-all">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                    Añadir Nuevo Profesor
                </button>
            </div>

            {/* Tarjetas de Resumen Neutrales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-[11px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Total Docentes Registrados</h3>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-[#111827]">{profesores.length}</span>
                        <span className="text-[11px] font-bold text-[#1A5AD7] mb-1 tracking-wide bg-[#1A5AD7]/10 px-2 py-0.5 rounded">En Nómina</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-[11px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Tiempo Completo</h3>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-[#111827]">
                            {profesores.filter(p => p.maxHoras >= 40).length}
                        </span>
                        <span className="text-[11px] font-bold text-green-600 mb-1 tracking-wide">40 hrs</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-[11px] font-bold text-[#64748B] mb-2 uppercase tracking-widest">Tiempo Parcial</h3>
                    <div className="flex items-end gap-3">
                        <span className="text-4xl font-black text-[#111827]">
                            {profesores.filter(p => p.maxHoras < 40).length}
                        </span>
                        <span className="text-[11px] font-bold text-[#64748B] mb-1 tracking-wide">Menos de 40 hrs</span>
                    </div>
                </div>
            </div>

            {/* Lista de Personal */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative z-10">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[#111827]">Listado de Personal</h2>
                    {/* Buscador Simple Opcional visualmente */}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 text-[#64748B] text-[10px] tracking-widest uppercase border-b border-slate-100">
                                <th className="px-6 py-4 font-bold">Profesor</th>
                                <th className="px-6 py-4 font-bold">Materias Asignadas</th>
                                <th className="px-6 py-4 font-bold">Disponibilidad Semanal</th>
                                <th className="px-6 py-4 font-bold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profesores.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-8 text-[#64748B]">Ningún profesor registrado todavía.</td>
                                </tr>
                            )}
                            {profesores.map((prof) => (
                                <tr key={prof.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#1A5AD7]/10 flex items-center justify-center text-[#1A5AD7]">
                                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-[#111827]">{prof.name}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 flex-wrap max-w-[200px]">
                                            {prof.materias.length > 0 ? prof.materias.map(m => (
                                                <span key={m} className={`border text-[11px] px-2.5 py-1 ${m.includes('+1') ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-slate-50 border-slate-200 text-[#64748B]'} rounded-md font-bold`}>{m}</span>
                                            )) : <span className="text-xs text-slate-400 font-medium">Sin asignaturas</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 w-56">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${prof.horas >= prof.maxHoras ? 'bg-red-500' : 'bg-[#1A5AD7]'}`}
                                                    style={{ width: `${Math.min((prof.horas / prof.maxHoras) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-[#111827] w-14 text-right">{prof.horas} <span className="font-medium text-[#64748B]">/ {prof.maxHoras}h</span></span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => abrirModalEdicion(prof)}
                                                className="w-8 h-8 rounded-lg bg-indigo-50 text-[#1A5AD7] hover:bg-[#1A5AD7] hover:text-white flex items-center justify-center transition-colors"
                                                title="Editar"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => eliminarProfesor(prof.id)}
                                                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                                                title="Eliminar"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B] font-medium">
                    <p>Mostrando {profesores.length} profesores registrados</p>
                </div>
            </div>

            {/* Modal Flotante de Formulario */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
                    <div
                        className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">{isEditing ? 'Editar Profesor' : 'Nuevo Profesor'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleGuardar} className="p-8 space-y-6">

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej. Roberto Martínez"
                                    value={nuevoProfesor.name}
                                    onChange={(e) => setNuevoProfesor({ ...nuevoProfesor, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1A5AD7] focus:ring-4 focus:ring-[#1A5AD7]/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Horas Máximas a la Semana</label>
                                <input
                                    required
                                    type="number"
                                    min="1" max="60"
                                    value={nuevoProfesor.maxHoras}
                                    onChange={(e) => setNuevoProfesor({ ...nuevoProfesor, maxHoras: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1A5AD7] focus:ring-4 focus:ring-[#1A5AD7]/10 outline-none transition-all text-sm font-medium text-[#111827] bg-slate-50"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Materias de Especialidad (Opcional, separadas por coma)</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Matemáticas I, Física Básica"
                                    value={nuevoProfesor.materias}
                                    onChange={(e) => setNuevoProfesor({ ...nuevoProfesor, materias: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#1A5AD7] focus:ring-4 focus:ring-[#1A5AD7]/10 outline-none transition-all text-sm font-medium text-[#111827] placeholder:text-slate-300"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold text-[#64748B] hover:text-[#111827] hover:bg-slate-50 rounded-xl transition-colors">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-[#1A5AD7] hover:bg-[#1A5AD7]/90 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2">
                                    {isEditing ? 'Guardar Cambios' : 'Añadir Registro'}
                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

const PlanCard = ({ plan, curso, cursoIndex, onEdit, onDelete, maxHorasGrado }) => {
    const colors = [
        { bg: '#1e293b', light: '#f1f5f9' },
        { bg: '#a855f7', light: '#faf5ff' },
        { bg: '#f43f5e', light: '#fff1f2' },
        { bg: '#10b981', light: '#f0fdf4' },
        { bg: '#3b82f6', light: '#eff6ff' },
        { bg: '#f59e0b', light: '#fffbeb' },
        { bg: '#06b6d4', light: '#ecfeff' },
        { bg: '#ec4899', light: '#fdf2f8' },
        { bg: '#8b5cf6', light: '#f5f3ff' },
        { bg: '#14b8a6', light: '#f0fdfa' },
        { bg: '#ef4444', light: '#fef2f2' },
        { bg: '#6366f1', light: '#eef2ff' },
    ];
    const c = colors[cursoIndex % colors.length] || colors[0];
    const isExcedido = plan.horas_semanales > maxHorasGrado && maxHorasGrado > 0;

    // Iniciales del curso para el avatar circular
    const initials = curso
        ? curso.nombre_curso.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '??';

    return (
        <div className={`bg-white rounded-2xl overflow-hidden flex flex-col border ${isExcedido ? 'border-red-400' : 'border-slate-200'
            } shadow-sm`}>

            {/* Franja de color superior */}
            <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: c.bg }}>
                <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.15em]">
                    Plan de Estudio
                </span>
                {isExcedido && (
                    <span className="text-[9px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                        ⚠ Excedido
                    </span>
                )}
            </div>

            {/* Cuerpo de la tarjeta */}
            <div className="p-4 flex flex-col gap-3 flex-1">
                {/* Título: Nombre completo del curso */}
                <h3 className="font-extrabold text-[16px] text-slate-800 leading-snug">
                    {curso ? curso.nombre_curso : 'Curso Desconocido'}
                </h3>

                {/* Badge de horas */}
                <div className="flex items-center gap-1.5 w-max">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="text-slate-400"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    <span className="text-[13px] font-extrabold text-slate-700">{plan.horas_semanales}</span>
                    <span className="text-[11px] font-semibold text-slate-400">hrs/sem</span>
                </div>

                {/* Footer: Avatar + estado + acciones */}
                <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100">
                    {/* Avatar con iniciales del curso */}
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black text-white shadow-sm"
                        style={{ backgroundColor: c.bg }}
                    >
                        {initials}
                    </div>

                    {/* Botones Editar / Eliminar — siempre visibles */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(plan)}
                            className="cursor-pointer flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-hx-purple bg-slate-50 hover:bg-purple-50 rounded-lg border border-slate-200 hover:border-purple-200 transition-colors"
                        >
                            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Editar
                        </button>
                        <button
                            onClick={() => onDelete(plan.id_plan)}
                            className="cursor-pointer flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
                        >
                            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Eliminar
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default function PlanesManager() {
    const [planes, setPlanes] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [grados, setGrados] = useState([]);
    const [gradoDiaConfig, setGradoDiaConfig] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gradoFiltro, setGradoFiltro] = useState(null); // null = mostrar todos

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [modalStep, setModalStep] = useState(1); // 1=elige grado, 2=elige cursos
    const [modalGradoId, setModalGradoId] = useState(null);
    const [seleccion, setSeleccion] = useState({}); // { id_curso: horas }

    // Para edición individual
    const [nuevoPlan, setNuevoPlan] = useState({ id_grado: '', id_curso: '', horas_semanales: '' });

    const fetchDatos = async (signal) => {
        try {
            setLoading(true);
            const [resPlanes, resCursos, resGrados, resConfig] = await Promise.all([
                fetch(`${API_BASE}/planes`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/cursos`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/grados`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/grado-dia-config`, { signal }).catch(() => ({ ok: false, json: () => [] })),
            ]);

            if (resPlanes.ok) setPlanes(await resPlanes.json());
            if (resCursos.ok) setCursos(await resCursos.json());
            if (resGrados.ok) setGrados(await resGrados.json());
            if (resConfig.ok) setGradoDiaConfig(await resConfig.json());

            setError(null);
        } catch (err) {
            if (err.name === 'AbortError') return;
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchDatos(controller.signal);
        return () => controller.abort();
    }, []);

    const getMaxSlotsForGrado = (id_grado) => {
        const configs = gradoDiaConfig.filter(c => c.id_grado === id_grado);
        return configs.reduce((sum, c) => sum + (c.bloques_dia || 0), 0);
    };

    const getUsedSlotsForGrado = (id_grado) => {
        const planesGrado = planes.filter(p => p.id_grado === id_grado);
        return planesGrado.reduce((sum, p) => sum + (p.horas_semanales || 0), 0);
    };

    const abrirModalNueva = (id_grado = null) => {
        setIsEditing(false);
        setEditId(null);
        setModalStep(id_grado ? 2 : 1);
        setModalGradoId(id_grado);
        setSeleccion({});
        setIsModalOpen(true);
    };

    const abrirModalEdicion = (plan) => {
        setIsEditing(true);
        setEditId(plan.id_plan);
        setNuevoPlan({
            id_grado: plan.id_grado || '',
            id_curso: plan.id_curso || '',
            horas_semanales: plan.horas_semanales || ''
        });
        setIsModalOpen(true);
    };

    const eliminarPlan = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este registro del plan de estudio?")) {
            try {
                await fetch(`${API_BASE}/planes/${id}`, { method: 'DELETE' });
                setPlanes(planes.filter(p => p.id_plan !== id));
                window.dispatchEvent(new CustomEvent('horarix_data_updated'));
            } catch (err) {
                alert("Error al eliminar");
            }
        }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();

        const idGradoInt = parseInt(nuevoPlan.id_grado);
        const horasInt = parseInt(nuevoPlan.horas_semanales);

        if (!idGradoInt || !nuevoPlan.id_curso || !horasInt) {
            alert("Por favor completa todos los campos.");
            return;
        }

        const maxSlots = getMaxSlotsForGrado(idGradoInt);
        let usedSlots = getUsedSlotsForGrado(idGradoInt);

        if (isEditing) {
            const planActual = planes.find(p => p.id_plan === editId);
            if (planActual) {
                usedSlots -= planActual.horas_semanales;
            }
        }

        if (maxSlots === 0) {
            alert(`El grado ${idGradoInt} no tiene turnos configurados. Debes asignarle días y bloques (slots) en la Configuración Inicial antes de armar su malla.`);
            return;
        }

        if ((usedSlots + horasInt) > maxSlots) {
            alert(`Límite excedido. El grado ${idGradoInt} tiene ${maxSlots} slots habilitados en total. Actualmente has usado ${usedSlots} slots. No puedes agregar ${horasInt} horas más.`);
            return;
        }

        setGuardando(true);
        const payload = {
            id_grado: idGradoInt,
            id_curso: parseInt(nuevoPlan.id_curso),
            horas_semanales: horasInt
        };

        try {
            if (isEditing) {
                await fetch(`${API_BASE}/planes/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                await fetch(`${API_BASE}/planes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            await fetchDatos();
            window.dispatchEvent(new CustomEvent('horarix_data_updated'));
            setIsModalOpen(false);
        } catch (err) {
            alert(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    const planesPorGrado = grados.map(grado => {
        const planesGrado = planes.filter(p => p.id_grado === grado.id_grado);
        const slotsMaximos = getMaxSlotsForGrado(grado.id_grado);
        const slotsUsados = planesGrado.reduce((sum, p) => sum + p.horas_semanales, 0);

        return {
            ...grado,
            planes: planesGrado,
            slotsMaximos,
            slotsUsados
        };
    });

    return (
        <div className="w-full space-y-8 animate-fade-in relative pb-10">
            {/* Cabecera Superior (Restaurada al estilo morado) */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="md:w-2/3 bg-[var(--color-hx-purple)]/10 rounded-[24px] p-8 shadow-md relative overflow-hidden flex flex-col justify-center min-h-[180px] border border-[var(--color-hx-purple)]/70">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
                        <div className="max-w-md">
                            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-tight mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                                Planes de Estudio
                            </h2>
                            <p className="text-slate-500 text-[13px] font-medium mb-6 leading-relaxed max-w-sm drop-shadow-sm">
                                Configura la malla curricular y asigna la carga horaria para cada curso según el grado.
                            </p>

                            <button
                                onClick={() => abrirModalNueva()}
                                className="bg-hx-purple text-white hover:bg-hx-purple/80 font-extrabold py-2.5 px-6 rounded-xl shadow-[0_4px_12px_rgba(121,14,236,0.3)] hover:shadow-[0_6px_16px_rgba(121,14,236,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm w-max cursor-pointer">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                Añadir a la Malla
                            </button>
                        </div>

                        {/* Imagen Ilustrativa a la derecha */}
                        <div className="hidden sm:flex relative w-32 h-32 md:w-45 md:h-45 flex-shrink-0 items-center justify-center -mt-2 md:mr-16">
                            {/* Brillo suave de fondo para resaltar */}
                            <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl"></div>
                            <img
                                src="/class.svg"
                                alt="Ilustración"
                                className="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)] hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="md:w-1/3 bg-white border border-slate-200 rounded-[24px] p-4 min-h-[160px] flex flex-col">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Estado de la Malla</p>
                    <div className="flex flex-col gap-3 flex-1">
                        {/* Primera fila: 2 columnas */}
                        <div className="grid grid-cols-2 gap-3 flex-1">
                            <div className="flex flex-col justify-between rounded-2xl p-5" style={{ backgroundColor: '#f3f0ff' }}>
                                <p className="text-[12px] font-semibold" style={{ color: '#a78bfa' }}>Cursos</p>
                                <p className="text-3xl font-black" style={{ color: '#7c3aed' }}>{cursos.length}</p>
                            </div>
                            <div className="flex flex-col justify-between rounded-2xl p-5" style={{ backgroundColor: '#eef2ff' }}>
                                <p className="text-[12px] font-semibold" style={{ color: '#818cf8' }}>Grados</p>
                                <p className="text-3xl font-black" style={{ color: '#4f46e5' }}>{grados.length}</p>
                            </div>
                        </div>
                        {/* Segunda fila: 1 columna completa */}
                        <div className="flex items-center justify-between rounded-2xl p-5" style={{ backgroundColor: '#f0fdf4' }}>
                            <p className="text-[13px] font-semibold" style={{ color: '#4ade80' }}>Mallas completas</p>
                            <p className="text-3xl font-black" style={{ color: '#16a34a' }}>{planesPorGrado.filter(g => g.slotsUsados === g.slotsMaximos && g.slotsMaximos > 0).length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-hx-purple/30 border-t-hx-purple rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="space-y-8 pt-4">
                    {/* Barra de filtrado por Grado */}
                    {planesPorGrado.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3 flex-wrap shadow-sm">
                            <div className="flex items-center gap-2 text-slate-500 mr-1">
                                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                                <span className="text-[11px] font-black uppercase tracking-wider">Filtrar por grado</span>
                            </div>
                            <div className="w-px h-5 bg-slate-200"></div>
                            <button
                                onClick={() => setGradoFiltro(null)}
                                style={gradoFiltro === null
                                    ? { backgroundColor: '#7c3aed', color: '#ffffff', borderColor: '#7c3aed' }
                                    : { backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#94a3b8' }
                                }
                                className="cursor-pointer px-4 py-2 rounded-full text-[12px] font-bold border transition-all"
                            >
                                Todos
                            </button>
                            {planesPorGrado.map(g => {
                                const isOver = g.slotsUsados > g.slotsMaximos;
                                const isFull = g.slotsUsados === g.slotsMaximos && g.slotsMaximos > 0;
                                const isActive = gradoFiltro === g.id_grado;
                                return (
                                    <button
                                        key={g.id_grado}
                                        onClick={() => setGradoFiltro(isActive ? null : g.id_grado)}
                                        style={isActive
                                            ? { backgroundColor: '#7c3aed', color: '#ffffff', borderColor: '#7c3aed' }
                                            : { backgroundColor: '#ffffff', color: '#0f172a', borderColor: '#94a3b8' }
                                        }
                                        className="cursor-pointer px-4 py-2 rounded-full text-[12px] font-bold border transition-all flex items-center gap-1.5"
                                    >
                                        Grado {g.numero}
                                        {isOver && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#f87171' }}></span>}
                                        {isFull && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#34d399' }}></span>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {planesPorGrado.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-3xl p-16 text-center">
                            <h3 className="text-xl font-black text-slate-800">No hay grados registrados</h3>
                            <p className="text-slate-500 text-sm mt-2">Configura los grados primero para poder armar su plan de estudios.</p>
                        </div>
                    ) : (
                        planesPorGrado
                            .filter(g => gradoFiltro === null || g.id_grado === gradoFiltro)
                            .map((grado) => (
                                <div key={grado.id_grado} id={`grado-${grado.id_grado}`} className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-100">

                                    {/* Encabezado del Grado — Banner informativo */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 pb-5 border-b border-slate-200/70">

                                        {/* Izquierda: Número de grado grande */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#ffffff' }}>
                                                <span className="font-black text-2xl leading-none" style={{ color: '#ffffff' }}>{grado.numero}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 text-xl leading-tight">Grado {grado.numero}</h3>
                                                <p className="text-slate-400 text-[12px] font-medium mt-0.5">{grado.planes.length} cursos en la malla</p>
                                            </div>
                                        </div>

                                        {/* Derecha: Indicador de capacidad visual */}
                                        <div className="flex flex-col items-end gap-2 min-w-[180px]">
                                            {/* Número grande con etiqueta */}
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="font-black text-3xl leading-none" style={{ color: grado.slotsUsados > grado.slotsMaximos ? '#ef4444' : grado.slotsUsados === grado.slotsMaximos && grado.slotsMaximos > 0 ? '#16a34a' : '#1e293b' }}>
                                                    {grado.slotsUsados}
                                                </span>
                                                <span className="text-slate-400 font-bold text-sm">/ {grado.slotsMaximos} slots</span>
                                            </div>
                                            {/* Barra */}
                                            <div className="w-full h-2.5 rounded-full" style={{ backgroundColor: '#e2e8f0' }}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min(grado.slotsMaximos > 0 ? (grado.slotsUsados / grado.slotsMaximos) * 100 : 0, 100)}%`,
                                                        backgroundColor: grado.slotsUsados > grado.slotsMaximos ? '#ef4444' : grado.slotsUsados === grado.slotsMaximos && grado.slotsMaximos > 0 ? '#10b981' : '#1e293b'
                                                    }}
                                                ></div>
                                            </div>
                                            {/* Etiqueta de estado */}
                                            <span className="text-[11px] font-bold" style={{ color: grado.slotsUsados > grado.slotsMaximos ? '#ef4444' : grado.slotsUsados === grado.slotsMaximos && grado.slotsMaximos > 0 ? '#16a34a' : '#94a3b8' }}>
                                                {grado.slotsMaximos > 0
                                                    ? grado.slotsUsados > grado.slotsMaximos
                                                        ? '⚠ Capacidad excedida'
                                                        : grado.slotsUsados === grado.slotsMaximos
                                                            ? '✓ Malla completa'
                                                            : `${grado.slotsMaximos - grado.slotsUsados} slots disponibles`
                                                    : 'Sin slots configurados'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Contenedor de las Tarjetas */}
                                    <div>
                                        {grado.planes.length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-slate-400 font-medium text-sm">No hay cursos asignados en este grado.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                                {grado.planes.map((plan, i) => {
                                                    const cursoIndex = cursos.findIndex(c => c.id_curso === plan.id_curso);
                                                    const curso = cursos[cursoIndex >= 0 ? cursoIndex : 0];
                                                    return (
                                                        <PlanCard
                                                            key={plan.id_plan || `temp-${i}`}
                                                            plan={plan}
                                                            curso={curso}
                                                            cursoIndex={cursoIndex >= 0 ? cursoIndex : i}
                                                            maxHorasGrado={grado.slotsMaximos}
                                                            onEdit={abrirModalEdicion}
                                                            onDelete={eliminarPlan}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            )}

            {/* Modal Bulk / Edición */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full border border-slate-100 overflow-hidden" style={{ maxWidth: isEditing ? '480px' : '900px' }} onClick={e => e.stopPropagation()}>

                        {/* Header con gradiente */}
                        <div className="relative px-8 py-6 flex justify-between items-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: '#fff' }}></div>
                            <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: '#fff' }}></div>
                            <div className="relative z-10">
                                <h2 className="text-xl font-extrabold" style={{ color: '#ffffff' }}>
                                    {isEditing ? 'Editar Asignación' : modalStep === 1 ? 'Añadir cursos a la malla' : `Grado ${grados.find(g => g.id_grado === modalGradoId)?.numero} — Elige cursos`}
                                </h2>
                                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                    {isEditing ? 'Modifica los datos de esta asignación'
                                        : modalStep === 1 ? 'Selecciona el grado al que quieres añadir'
                                            : 'Haz clic en los cursos y ajusta sus horas semanales'}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="relative z-10 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        {/* MODO EDICIÓN */}
                        {isEditing ? (
                            <form onSubmit={handleGuardar} className="p-8 space-y-5">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Grado Escolar</label>
                                    <select required value={nuevoPlan.id_grado} onChange={e => setNuevoPlan({ ...nuevoPlan, id_grado: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm font-medium">
                                        <option value="" disabled>-- Selecciona un grado --</option>
                                        {grados.map(g => <option key={g.id_grado} value={g.id_grado}>Grado {g.numero}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Curso</label>
                                    <select required value={nuevoPlan.id_curso} onChange={e => setNuevoPlan({ ...nuevoPlan, id_curso: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm font-medium">
                                        <option value="" disabled>-- Selecciona el curso --</option>
                                        {cursos.map(c => <option key={c.id_curso} value={c.id_curso}>{c.nombre_curso}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Horas Semanales</label>
                                    <input required type="number" min="1" max="40" placeholder="Ej. 5" value={nuevoPlan.horas_semanales} onChange={e => setNuevoPlan({ ...nuevoPlan, horas_semanales: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm font-medium" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="cursor-pointer flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
                                    <button type="submit" disabled={guardando} className="cursor-pointer flex-1 py-3 text-white text-sm font-bold rounded-xl transition-all" style={{ backgroundColor: '#7c3aed' }}>{guardando ? 'Guardando...' : 'Guardar Cambios'}</button>
                                </div>
                            </form>

                            /* PASO 1: Elegir Grado */
                        ) : modalStep === 1 ? (
                            <div className="p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {grados.map(g => {
                                        const slots = getMaxSlotsForGrado(g.id_grado);
                                        const used = getUsedSlotsForGrado(g.id_grado);
                                        const pct = slots > 0 ? Math.min((used / slots) * 100, 100) : 0;
                                        const isFull = used === slots && slots > 0;
                                        return (
                                            <button key={g.id_grado}
                                                onClick={() => { setModalGradoId(g.id_grado); setModalStep(2); setSeleccion({}); }}
                                                className="cursor-pointer rounded-2xl text-left transition-all overflow-hidden group"
                                                style={{ border: '2px solid #e2e8f0', backgroundColor: '#fafafa' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.backgroundColor = '#f5f3ff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fafafa'; }}
                                            >
                                                {/* Franja superior de color */}
                                                <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#7c3aed,#4f46e5)' }}></div>
                                                <div className="p-5">
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl mb-3" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff' }}>{g.numero}</div>
                                                    <p className="font-black text-slate-800 text-[15px]">Grado {g.numero}</p>
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-[10px] font-bold mb-1" style={{ color: '#94a3b8' }}>
                                                            <span>Slots</span>
                                                            <span style={{ color: isFull ? '#16a34a' : '#1e293b' }}>{used}/{slots}</span>
                                                        </div>
                                                        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#e2e8f0' }}>
                                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isFull ? '#10b981' : '#7c3aed' }}></div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex items-center justify-between">
                                                        <span className="text-[11px] font-semibold" style={{ color: isFull ? '#16a34a' : '#94a3b8' }}>{isFull ? '✓ Completo' : `${slots - used} disponibles`}</span>
                                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#7c3aed" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            /* PASO 2: Seleccionar cursos en lote */
                        ) : (() => {
                            const yaAsignados = planes.filter(p => p.id_grado === modalGradoId).map(p => p.id_curso);
                            const maxSlots = getMaxSlotsForGrado(modalGradoId);
                            const usedSlots = getUsedSlotsForGrado(modalGradoId);
                            const horasSeleccion = Object.values(seleccion).reduce((a, b) => a + (parseInt(b) || 0), 0);
                            const totalTras = usedSlots + horasSeleccion;
                            const numSeleccionados = Object.keys(seleccion).length;

                            const toggleCurso = (id_curso) => {
                                if (seleccion[id_curso] !== undefined) {
                                    const copia = { ...seleccion };
                                    delete copia[id_curso];
                                    setSeleccion(copia);
                                } else {
                                    setSeleccion({ ...seleccion, [id_curso]: 1 });
                                }
                            };

                            const handleGuardarBulk = async () => {
                                if (numSeleccionados === 0) return;
                                setGuardando(true);
                                try {
                                    for (const [id_curso, horas] of Object.entries(seleccion)) {
                                        await fetch(`${API_BASE}/planes`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ id_grado: modalGradoId, id_curso: parseInt(id_curso), horas_semanales: parseInt(horas) || 1 })
                                        });
                                    }
                                    await fetchDatos(new AbortController().signal);
                                    window.dispatchEvent(new CustomEvent('horarix_data_updated'));
                                    setIsModalOpen(false);
                                } catch { alert('Error al guardar'); }
                                finally { setGuardando(false); }
                            };

                            return (
                                <div className="flex flex-col" style={{ maxHeight: '85vh' }}>
                                    {/* Barra de capacidad */}
                                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                                        <button onClick={() => setModalStep(1)} className="cursor-pointer text-slate-400 hover:text-slate-700 text-[12px] font-bold flex items-center gap-1">
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                                            Cambiar grado
                                        </button>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-[11px] font-bold mb-1">
                                                <span className="text-slate-500">Slots</span>
                                                <span style={{ color: totalTras > maxSlots ? '#ef4444' : '#1e293b' }}>{totalTras} / {maxSlots}</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#e2e8f0' }}>
                                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(maxSlots > 0 ? (totalTras / maxSlots) * 100 : 0, 100)}%`, backgroundColor: totalTras > maxSlots ? '#ef4444' : '#7c3aed' }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Aviso de capacidad llena */}
                                    {totalTras > maxSlots && maxSlots > 0 && (
                                        <div className="mx-5 mt-0 mb-1 px-4 py-3 rounded-2xl flex items-center gap-3" style={{ backgroundColor: '#fef2f2', border: '1.5px solid #fecaca' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                            <div>
                                                <p className="text-[12px] font-black" style={{ color: '#dc2626' }}>Capacidad {totalTras > maxSlots ? 'excedida' : 'completa'}</p>
                                                <p className="text-[11px] font-medium" style={{ color: '#ef4444' }}>
                                                    {totalTras > maxSlots
                                                        ? `Llevas ${totalTras - maxSlots} hora${totalTras - maxSlots !== 1 ? 's' : ''} de más. Reduce horas antes de guardar.`
                                                        : 'No puedes añadir más cursos ni aumentar horas.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                                        {cursos.map(c => {
                                            const estaAsignado = yaAsignados.includes(c.id_curso);
                                            const seleccionado = seleccion[c.id_curso] !== undefined;
                                            const COLOR_MAP = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#d53f8c', '#00b5d8', '#667eea', '#f6ad55'];
                                            const BG_MAP = ['#fff5f5', '#fffaf0', '#fffff0', '#f0fff4', '#ebf8ff', '#faf5ff', '#fff5f7', '#e6fffa', '#ebf4ff', '#fffbeb'];
                                            const color = COLOR_MAP[c.id_curso % COLOR_MAP.length];
                                            const bgTint = BG_MAP[c.id_curso % BG_MAP.length];

                                            const capacidadLlena = totalTras >= maxSlots && maxSlots > 0;

                                            if (estaAsignado) return (
                                                <div key={c.id_curso} className="rounded-2xl flex items-center gap-3 px-4 py-3 cursor-not-allowed" style={{ border: '2px solid #f1f5f9', backgroundColor: '#f8fafc', opacity: 0.5 }}>
                                                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-black" style={{ backgroundColor: color }}>{c.nombre_curso.charAt(0)}</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[13px] font-bold text-slate-500 truncate">{c.nombre_curso}</p>
                                                        <span className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>Asignado ✓</span>
                                                    </div>
                                                </div>
                                            );

                                            // Curso disponible pero capacidad llena y no está seleccionado
                                            const bloqueado = capacidadLlena && !seleccionado;

                                            return (
                                                <div key={c.id_curso}
                                                    onClick={() => !bloqueado && toggleCurso(c.id_curso)}
                                                    className="rounded-2xl transition-all"
                                                    style={{
                                                        cursor: bloqueado ? 'not-allowed' : 'pointer',
                                                        border: `2px solid ${seleccionado ? '#7c3aed' : bloqueado ? '#f1f5f9' : '#e2e8f0'}`,
                                                        backgroundColor: seleccionado ? '#f5f3ff' : bloqueado ? '#f8fafc' : bgTint,
                                                        opacity: bloqueado ? 0.45 : 1,
                                                        boxShadow: seleccionado ? '0 4px 16px rgba(124,58,237,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                                                    }}
                                                >
                                                    {/* Fila superior: avatar + nombre + check */}
                                                    <div className="flex items-center gap-3 px-4 py-3">
                                                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-black shadow-sm" style={{ backgroundColor: seleccionado ? '#7c3aed' : color }}>{c.nombre_curso.charAt(0)}</div>
                                                        <p className="flex-1 text-[13px] font-bold leading-snug min-w-0" style={{ color: seleccionado ? '#5b21b6' : '#374151' }}>{c.nombre_curso}</p>
                                                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: seleccionado ? '#7c3aed' : '#e2e8f0' }}>
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={seleccionado ? '#fff' : '#94a3b8'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                        </div>
                                                    </div>
                                                    {/* Fila de horas (solo si seleccionado) */}
                                                    {seleccionado && (
                                                        <div className="px-4 pb-3 flex items-center gap-2 border-t" style={{ borderColor: '#ede9fe' }} onClick={e => e.stopPropagation()}>
                                                            <span className="text-[11px] font-semibold flex-1" style={{ color: '#7c3aed' }}>Horas / semana</span>
                                                            <button onClick={() => setSeleccion(s => ({ ...s, [c.id_curso]: Math.max(1, (parseInt(s[c.id_curso]) || 1) - 1) }))}
                                                                className="cursor-pointer w-7 h-7 rounded-lg text-white font-black text-base flex items-center justify-center" style={{ backgroundColor: '#7c3aed' }}>−</button>
                                                            <span className="font-black text-slate-800 text-sm w-6 text-center">{seleccion[c.id_curso]}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const actual = parseInt(seleccion[c.id_curso]) || 1;
                                                                    const otrasHoras = Object.entries(seleccion).filter(([k]) => parseInt(k) !== c.id_curso).reduce((a, [, v]) => a + (parseInt(v) || 0), 0);
                                                                    if (usedSlots + otrasHoras + actual + 1 > maxSlots) return;
                                                                    setSeleccion(s => ({ ...s, [c.id_curso]: actual + 1 }));
                                                                }}
                                                                className="w-7 h-7 rounded-lg text-white font-black text-base flex items-center justify-center transition-opacity"
                                                                style={{
                                                                    cursor: (usedSlots + horasSeleccion >= maxSlots) ? 'not-allowed' : 'pointer',
                                                                    backgroundColor: '#7c3aed',
                                                                    opacity: (usedSlots + horasSeleccion >= maxSlots) ? 0.4 : 1
                                                                }}
                                                            >+</button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                                        <p className="text-[12px] text-slate-500 font-medium">{numSeleccionados} curso{numSeleccionados !== 1 ? 's' : ''} seleccionado{numSeleccionados !== 1 ? 's' : ''}</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setIsModalOpen(false)} className="cursor-pointer px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
                                            <button onClick={handleGuardarBulk} disabled={guardando || numSeleccionados === 0}
                                                className="cursor-pointer px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50"
                                                style={{ backgroundColor: '#7c3aed' }}>
                                                {guardando ? 'Guardando...' : `Añadir ${numSeleccionados > 0 ? numSeleccionados : ''} curso${numSeleccionados !== 1 ? 's' : ''}`}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

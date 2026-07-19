import React, { useState, useEffect } from 'react';
import ModuleSidebar from '../Shared/ModuleSidebar';

const API_BASE = 'http://localhost:8000/api';

const PlanCard = ({ plan, curso, cursoIndex, onEdit, onDelete, maxHorasGrado }) => {
    const colors = [
        { bg: '#1e293b', text: '#f1f5f9' }, // Slate oscuro
        { bg: '#a855f7', text: '#ffffff' }, // Morado
        { bg: '#f43f5e', text: '#ffffff' }, // Rosa/Rojo
        { bg: '#10b981', text: '#ffffff' }, // Esmeralda
        { bg: '#3b82f6', text: '#ffffff' }, // Azul
        { bg: '#f59e0b', text: '#1c1917' }, // Ámbar
        { bg: '#06b6d4', text: '#ffffff' }, // Cyan
        { bg: '#ec4899', text: '#ffffff' }, // Rosa fucsia
        { bg: '#8b5cf6', text: '#ffffff' }, // Violeta
        { bg: '#14b8a6', text: '#ffffff' }, // Teal
        { bg: '#ef4444', text: '#ffffff' }, // Rojo vivo
        { bg: '#6366f1', text: '#ffffff' }, // Índigo
    ];
    const safeIndex = cursoIndex >= 0 ? cursoIndex : 0;
    const c = colors[safeIndex % colors.length];
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

                    {/* Botones Eliminar — siempre visibles */}
                    <div className="flex gap-2">
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
    const [currentView, setCurrentView] = useState('list');
    const [planes, setPlanes] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [grados, setGrados] = useState([]);
    const [gradoDiaConfig, setGradoDiaConfig] = useState([]);
    const [bloquesReservados, setBloquesReservados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gradoFiltro, setGradoFiltro] = useState(null); // null = mostrar todos

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [guardadoExitoso, setGuardadoExitoso] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    };

    const [formStep, setFormStep] = useState(1);
    const [showClone, setShowClone] = useState(false);
    const [cloneOrigen, setCloneOrigen] = useState('');
    const [cloneDestino, setCloneDestino] = useState('');
    const [modalGradoId, setModalGradoId] = useState(null);
    const [seleccion, setSeleccion] = useState({}); // { id_curso: horas }

    // Para edición individual
    const [nuevoPlan, setNuevoPlan] = useState({ id_grado: '', id_curso: '', horas_semanales: '' });

    const fetchDatos = async (signal) => {
        try {
            setLoading(true);
            const [resPlanes, resCursos, resGrados, resConfig, resReservas] = await Promise.all([
                fetch(`${API_BASE}/planes`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/cursos`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/grados`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/grado-dia-config`, { signal }).catch(() => ({ ok: false, json: () => [] })),
                fetch(`${API_BASE}/bloque-reservado`, { signal }).catch(() => ({ ok: false, json: () => [] })),
            ]);

            if (resPlanes.ok) setPlanes(await resPlanes.json());
            if (resCursos.ok) setCursos(await resCursos.json());
            if (resGrados.ok) setGrados(await resGrados.json());
            if (resConfig.ok) setGradoDiaConfig(await resConfig.json());
            if (resReservas.ok) setBloquesReservados(await resReservas.json());

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
        const totalConfig = configs.reduce((sum, c) => sum + (c.bloques_dia || 0), 0);

        let reservedSlots = 0;
        const reservasPorNombre = {};

        bloquesReservados.forEach(reserva => {
            if (reserva.grados && reserva.grados.includes(id_grado)) {
                let maxSlotsInOpciones = 0;
                if (reserva.opciones) {
                    reserva.opciones.forEach(op => {
                        if (op.slots && op.slots.length > maxSlotsInOpciones) {
                            maxSlotsInOpciones = op.slots.length;
                        }
                    });
                }

                // Agrupar por nombre para evitar descontar el mismo bloque múltiple veces si está en diferentes sedes
                const nombreGrupo = (reserva.nombre || "Sin Nombre").trim().toLowerCase();
                if (!reservasPorNombre[nombreGrupo] || maxSlotsInOpciones > reservasPorNombre[nombreGrupo]) {
                    reservasPorNombre[nombreGrupo] = maxSlotsInOpciones;
                }
            }
        });

        Object.values(reservasPorNombre).forEach(slots => {
            reservedSlots += slots;
        });

        return Math.max(0, totalConfig - reservedSlots);
    };

    const getUsedSlotsForGrado = (id_grado) => {
        const planesGrado = planes.filter(p => p.id_grado === id_grado);
        return planesGrado.reduce((sum, p) => sum + (p.horas_semanales || 0), 0);
    };

    const vaciarMallaGrado = async (id_grado) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar TODA la malla de este grado?")) {
            try {
                const planesDelGrado = planes.filter(p => p.id_grado === id_grado);
                for (const plan of planesDelGrado) {
                    await fetch(`${API_BASE}/planes/${plan.id_plan}`, { method: 'DELETE' });
                }
                setPlanes(planes.filter(p => p.id_grado !== id_grado));
                window.dispatchEvent(new CustomEvent('edusync_data_updated'));
            } catch {
                showToast("Error al vaciar la malla");
            }
        }
    };

    const copiarMallaGrado = async (id_grado_destino, id_grado_origen) => {
        if (!id_grado_origen || !id_grado_destino) return;

        try {
            setGuardando(true);
            // 1. Delete all existing planes in destino
            const planesDestino = planes.filter(p => p.id_grado === id_grado_destino);
            for (const plan of planesDestino) {
                await fetch(`${API_BASE}/planes/${plan.id_plan}`, { method: 'DELETE' });
            }

            // 2. Add planes from origen to destino
            const planesOrigen = planes.filter(p => p.id_grado === parseInt(id_grado_origen));
            for (const plan of planesOrigen) {
                await fetch(`${API_BASE}/planes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_grado: id_grado_destino,
                        id_curso: plan.id_curso,
                        horas_semanales: plan.horas_semanales
                    })
                });
            }

            // 3. Refresh
            await fetchDatos(new AbortController().signal);
            window.dispatchEvent(new CustomEvent('edusync_data_updated'));

            showToast("Malla clonada correctamente", "success");
            setCloneOrigen("");
            setCloneDestino("");
            setShowClone(false);

        } catch {
            showToast("Error al copiar la malla");
        } finally {
            setGuardando(false);
        }
    };

    const abrirModalEdicionMalla = (id_grado = null) => {
        setIsEditing(false);
        setEditId(null);
        setFormStep(id_grado ? 2 : 1);
        setModalGradoId(id_grado);

        if (id_grado) {
            const planesDelGrado = planes.filter(p => p.id_grado === id_grado);
            const seleccionActual = {};
            planesDelGrado.forEach(p => {
                seleccionActual[p.id_curso] = p.horas_semanales;
            });
            setSeleccion(seleccionActual);
        } else {
            setSeleccion({});
        }
        setCurrentView('form');
    };

    const abrirModalEdicion = (plan) => {
        setIsEditing(true);
        setEditId(plan.id_plan);
        setNuevoPlan({
            id_grado: plan.id_grado || '',
            id_curso: plan.id_curso || '',
            horas_semanales: plan.horas_semanales || ''
        });
        setCurrentView('form');
    };

    const eliminarPlan = async (id) => {
        if (window.confirm("¿Seguro que deseas eliminar este registro del plan de estudio?")) {
            try {
                await fetch(`${API_BASE}/planes/${id}`, { method: 'DELETE' });
                setPlanes(planes.filter(p => p.id_plan !== id));
                window.dispatchEvent(new CustomEvent('edusync_data_updated'));
            } catch {
                showToast("Error al eliminar");
            }
        }
    };

    const handleGuardar = async (e) => {
        e.preventDefault();

        const idGradoInt = parseInt(nuevoPlan.id_grado);
        const horasInt = parseInt(nuevoPlan.horas_semanales);

        if (!idGradoInt || !nuevoPlan.id_curso || !horasInt) {
            showToast("Por favor completa todos los campos.", "warning");
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
            showToast(`El grado ${idGradoInt} no tiene turnos configurados. Debes asignarle días y bloques (slots) en la Configuración Inicial antes de armar su malla.`);
            return;
        }

        if ((usedSlots + horasInt) > maxSlots) {
            showToast(`Límite excedido. El grado ${idGradoInt} tiene ${maxSlots} slots habilitados en total. Actualmente has usado ${usedSlots} slots. No puedes agregar ${horasInt} horas más.`);
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
            window.dispatchEvent(new CustomEvent('edusync_data_updated'));
            setCurrentView('list');
        } catch (err) {
            showToast(`Error: ${err.message}`);
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
        <div className="w-full animate-fade-in relative">
            {/* TOAST NOTIFICATION */}
            {toast.show && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border ${toast.type === 'error' ? 'bg-red-500 text-white border-red-600' :
                        toast.type === 'success' ? 'bg-green-500 text-white border-green-600' :
                            'bg-amber-500 text-white border-amber-600'
                        }`}>
                        {toast.type === 'error' && <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                        {toast.type === 'warning' && <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                        {toast.type === 'success' && <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}

                        <span className="font-bold text-sm">{toast.message}</span>

                        <button onClick={() => setToast(prev => ({ ...prev, show: false }))} className="ml-2 hover:opacity-70 transition-opacity">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-144px)]">
                {/* ===== LEFT SIDEBAR (1/4) ===== */}
                <ModuleSidebar
                    title="Planes de Estudio"
                    description="Configura la malla curricular y asigna la carga horaria para cada curso según el grado."
                    onAddClick={() => abrirModalEdicionMalla()}
                    addButtonText="Añadir a la Malla"
                    svgImage="/class.svg"
                    stats={[
                        { label: 'Dimensiones', value: `${grados.length} Grados`, subtext: `${cursos.length} cursos registrados` },
                        { label: 'Completas', value: planesPorGrado.filter(g => g.slotsUsados === g.slotsMaximos && g.slotsMaximos > 0).length, subtext: 'mallas' }
                    ]}
                />

                {/* ===== RIGHT CONTENT (3/4) ===== */}
                <main className="md:w-3/4 flex flex-col gap-5">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
                        </div>
                    ) : currentView === 'list' ? (
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
                                            ? { backgroundColor: 'var(--color-brand-primary)', color: '#ffffff', borderColor: 'var(--color-brand-primary)' }
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
                                                    ? { backgroundColor: 'var(--color-brand-primary)', color: '#ffffff', borderColor: 'var(--color-brand-primary)' }
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
                                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-dark))', color: '#ffffff' }}>
                                                        <span className="font-black text-2xl leading-none" style={{ color: '#ffffff' }}>{grado.numero}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-slate-800 text-xl leading-tight flex items-center gap-3">
                                                            Grado {grado.numero}
                                                            {grado.slotsUsados === grado.slotsMaximos && grado.slotsMaximos > 0 && (
                                                                <div className="flex items-center gap-1 bg-green-50 text-green-600 border border-green-200 px-2.5 py-0.5 rounded-lg text-[11px] font-bold shadow-sm">
                                                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                                    Completado
                                                                </div>
                                                            )}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <button
                                                                onClick={() => abrirModalEdicionMalla(grado.id_grado)}
                                                                className="cursor-pointer text-[11px] font-bold text-slate-500 hover:text-brand-primary bg-slate-100 hover:bg-[var(--color-brand-light)] rounded-lg border border-slate-200 hover:border-[var(--color-brand-light)] transition-colors px-2 py-1 flex items-center gap-1 shadow-sm"
                                                            >
                                                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                                Editar Malla
                                                            </button>
                                                            {grado.planes.length > 0 && (
                                                                <button
                                                                    onClick={() => vaciarMallaGrado(grado.id_grado)}
                                                                    className="cursor-pointer text-[11px] font-bold text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-colors px-2 py-1 flex items-center gap-1 shadow-sm"
                                                                >
                                                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    Eliminar
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-400 text-[12px] font-medium mt-1">{grado.planes.length} cursos en la malla</p>
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
                    ) : currentView === 'form' ? (
                        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-8 animate-fade-in flex flex-col min-h-[500px] w-full">
                            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-slate-500 stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                    </div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Añadir a la Malla</h2>
                                </div>
                                <button
                                    onClick={() => setCurrentView('list')}
                                    className="cursor-pointer text-[var(--color-brand-primary)] hover:text-[var(--color-brand-dark)] transition-colors flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                                    Volver
                                </button>
                            </div>

                            <div className="w-full mx-auto flex flex-col">
                                {/* Stepper Header Compacto */}
                                <div className="flex items-center justify-center w-full mb-8">
                                    <div className="flex items-center">
                                        <div className="flex flex-col items-center gap-1.5 relative z-10 w-24">
                                            <button onClick={() => setFormStep(1)} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all cursor-pointer ${formStep >= 1 ? 'bg-[var(--color-brand-primary)] text-white shadow-md ring-2 ring-white' : 'bg-slate-100 text-slate-400'}`}>1</button>
                                            <span className={`text-[10px] font-black uppercase tracking-wider text-center ${formStep >= 1 ? 'text-[var(--color-brand-primary)]' : 'text-slate-400'}`}>Grado y Clonado</span>
                                        </div>
                                        <div className={`w-24 sm:w-32 h-0.5 rounded-full -mx-4 z-0 transition-all duration-500 ${formStep >= 2 ? 'bg-[var(--color-brand-primary)]' : 'bg-slate-100'}`}></div>
                                        <div className="flex flex-col items-center gap-1.5 relative z-10 w-24">
                                            <button onClick={() => modalGradoId && setFormStep(2)} disabled={!modalGradoId} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all ${modalGradoId ? 'cursor-pointer' : 'cursor-not-allowed'} ${formStep >= 2 ? 'bg-[var(--color-brand-primary)] text-white shadow-md ring-2 ring-white' : 'bg-slate-100 text-slate-400'}`}>2</button>
                                            <span className={`text-[10px] font-black uppercase tracking-wider text-center ${formStep >= 2 ? 'text-[var(--color-brand-primary)]' : 'text-slate-400'}`}>Malla Curricular</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 border border-slate-100 rounded-[24px] p-8 shadow-inner flex flex-col">
                                    {/* STEP 1: Seleccionar Grado */}
                                    {formStep === 1 && (
                                        <div className="animate-fade-in flex flex-col">
                                            <div className="flex justify-between items-start mb-8 px-4 relative">
                                                <div className="text-left">
                                                    <h3 className="text-2xl font-black text-slate-800">Selecciona el Grado</h3>
                                                    <p className="text-slate-500 mt-1 text-sm font-medium">Elige a qué grado deseas configurarle la malla curricular</p>
                                                </div>

                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowClone(!showClone)}
                                                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer border border-[var(--color-brand-primary)] ${showClone ? 'bg-[var(--color-brand-primary)] text-white' : 'bg-indigo-50 text-[var(--color-brand-primary)] hover:bg-indigo-100'}`}
                                                    >
                                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                        Clonar Malla
                                                    </button>

                                                    {/* Viñeta (Popover) de Clonado */}
                                                    {showClone && (
                                                        <div className="absolute top-full right-0 mt-3 w-[360px] bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-5 z-50 animate-fade-in origin-top-right">
                                                            <div className="mb-4">
                                                                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                                                    Clonado Rápido
                                                                </h4>
                                                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                                                    Copia la configuración de cursos de un grado a otro.
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-col gap-3 mb-4">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Origen (Copiar desde)</label>
                                                                    <select
                                                                        value={cloneOrigen}
                                                                        onChange={e => setCloneOrigen(e.target.value)}
                                                                        className="w-full px-3 py-2.5 rounded-lg border-2 border-slate-200 bg-slate-50 outline-none text-xs font-bold focus:border-[var(--color-brand-primary)] focus:bg-white text-slate-700 transition-all cursor-pointer"
                                                                    >
                                                                        <option value="">Seleccione Origen...</option>
                                                                        {grados.filter(g => planesPorGrado.find(p => p.id_grado === g.id_grado)?.planes.length > 0).map(g => <option key={g.id_grado} value={g.id_grado}>Grado {g.numero}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Destino (Pegar en)</label>
                                                                    <select
                                                                        value={cloneDestino}
                                                                        onChange={e => setCloneDestino(e.target.value)}
                                                                        className="w-full px-3 py-2.5 rounded-lg border-2 border-slate-200 bg-slate-50 outline-none text-xs font-bold focus:border-[var(--color-brand-primary)] focus:bg-white text-slate-700 transition-all cursor-pointer"
                                                                    >
                                                                        <option value="">Seleccione Destino...</option>
                                                                        {grados.map(g => <option key={g.id_grado} value={g.id_grado}>Grado {g.numero}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={() => copiarMallaGrado(parseInt(cloneDestino), parseInt(cloneOrigen))}
                                                                disabled={!cloneOrigen || !cloneDestino || cloneOrigen === cloneDestino || guardando}
                                                                className="w-full py-2.5 bg-[var(--color-brand-primary)] text-white font-bold text-xs rounded-lg transition-all disabled:opacity-50 hover:bg-[var(--color-brand-primary)]/90 cursor-pointer shadow-md"
                                                            >
                                                                {guardando ? 'Aplicando...' : 'Aplicar Cambios'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap justify-center gap-5 px-4 mb-4">
                                                {grados.map(g => {
                                                    const isSelected = modalGradoId === g.id_grado;
                                                    const slotsMaximos = getMaxSlotsForGrado(g.id_grado);
                                                    const planesGrado = planes.filter(p => p.id_grado === g.id_grado);
                                                    const slotsUsados = planesGrado.reduce((sum, p) => sum + p.horas_semanales, 0);
                                                    const isCompleted = slotsMaximos > 0 && slotsUsados === slotsMaximos;

                                                    return (
                                                        <button
                                                            key={g.id_grado}
                                                            type="button"
                                                            onClick={() => {
                                                                setModalGradoId(g.id_grado);
                                                                const seleccionActual = {};
                                                                planesGrado.forEach(p => {
                                                                    seleccionActual[p.id_curso] = p.horas_semanales;
                                                                });
                                                                setSeleccion(seleccionActual);
                                                            }}
                                                            className={`group relative w-24 h-24 rounded-[20px] flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer overflow-hidden ${isSelected ? 'bg-[var(--color-brand-primary)] border-transparent shadow-lg shadow-indigo-500/30 scale-105' : 'bg-white border-2 border-slate-200 hover:border-[var(--color-brand-primary)]/40 hover:shadow-md hover:-translate-y-1'}`}
                                                        >
                                                            {isSelected && <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>}

                                                            {isCompleted && (
                                                                <div className={`absolute top-2 right-2 rounded-full p-0.5 shadow-sm transition-colors ${isSelected ? 'bg-white text-[var(--color-brand-primary)]' : 'bg-[var(--color-brand-primary)] text-white'}`}>
                                                                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                                                                </div>
                                                            )}

                                                            <span className={`relative z-10 text-3xl font-black transition-colors ${isSelected ? 'text-white' : 'text-slate-700 group-hover:text-[var(--color-brand-primary)]'}`}>
                                                                {g.numero}
                                                            </span>
                                                            <span className={`relative z-10 text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-slate-700 '}`}>
                                                                Grado
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex justify-end mt-4 pt-6 border-t border-slate-100 px-4">
                                                <button
                                                    onClick={() => { setShowClone(false); setFormStep(2); }}
                                                    disabled={!modalGradoId}
                                                    className="px-8 py-3.5 bg-[var(--color-brand-primary)] text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-brand-dark)] transition-all flex items-center gap-2 cursor-pointer"
                                                >
                                                    Siguiente Paso
                                                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 2: Asignar Cursos */}
                                    {formStep === 2 && (() => {
                                        const maxSlots = getMaxSlotsForGrado(modalGradoId);
                                        const totalTras = Object.values(seleccion).reduce((a, b) => a + (parseInt(b) || 0), 0);

                                        const toggleCurso = (id_curso) => {
                                            if (seleccion[id_curso] !== undefined) {
                                                const copia = { ...seleccion };
                                                delete copia[id_curso];
                                                setSeleccion(copia);
                                            } else {
                                                if (maxSlots > 0 && totalTras >= maxSlots) return; // No permitir seleccionar más si está lleno
                                                setSeleccion({ ...seleccion, [id_curso]: 1 });
                                            }
                                        };

                                        const handleGuardarBulk = async () => {
                                            setGuardando(true);
                                            try {
                                                const planesActuales = planes.filter(p => p.id_grado === modalGradoId);

                                                for (const [id_curso, horas] of Object.entries(seleccion)) {
                                                    const planExistente = planesActuales.find(p => p.id_curso === parseInt(id_curso));
                                                    if (planExistente) {
                                                        if (planExistente.horas_semanales !== parseInt(horas)) {
                                                            await fetch(`${API_BASE}/planes/${planExistente.id_plan}`, {
                                                                method: 'PUT',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ id_grado: modalGradoId, id_curso: parseInt(id_curso), horas_semanales: parseInt(horas) || 1 })
                                                            });
                                                        }
                                                    } else {
                                                        await fetch(`${API_BASE}/planes`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ id_grado: modalGradoId, id_curso: parseInt(id_curso), horas_semanales: parseInt(horas) || 1 })
                                                        });
                                                    }
                                                }
                                                for (const plan of planesActuales) {
                                                    if (seleccion[plan.id_curso] === undefined) {
                                                        await fetch(`${API_BASE}/planes/${plan.id_plan}`, { method: 'DELETE' });
                                                    }
                                                }
                                                await fetchDatos(new AbortController().signal);
                                                window.dispatchEvent(new CustomEvent('edusync_data_updated'));
                                                setGuardadoExitoso(true);
                                                setTimeout(() => {
                                                    setGuardadoExitoso(false);
                                                    setFormStep(1);
                                                }, 1000);
                                            } catch (err) {
                                                console.error("Error al guardar la malla", err);
                                            }
                                            finally { setGuardando(false); }
                                        };

                                        return (
                                            <div className="animate-fade-in flex flex-col">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div>
                                                        <h3 className="text-2xl font-black text-slate-800">Malla Curricular</h3>
                                                        <p className="text-slate-500 mt-1 text-sm font-medium">Asigna los cursos y horas para el Grado {grados.find(g => g.id_grado === modalGradoId)?.numero}</p>
                                                    </div>
                                                </div>

                                                {/* Barra de capacidad */}
                                                <div className="mb-8 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                                                    <div className="flex justify-between items-center font-bold mb-4">
                                                        <span className="text-slate-500 uppercase tracking-wider text-xs flex items-center gap-2">
                                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            Carga Académica
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-[11px] ${totalTras > maxSlots && maxSlots > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                                                            {maxSlots > 0 ? `${totalTras} / ${maxSlots} horas asignadas` : `${totalTras} horas asignadas (Sin límite establecido)`}
                                                        </span>
                                                    </div>

                                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: maxSlots > 0 ? `${Math.min((totalTras / maxSlots) * 100, 100)}%` : `${Math.min((totalTras / 40) * 100, 100)}%`,
                                                                backgroundColor: (maxSlots > 0 && totalTras > maxSlots) ? '#ef4444' : 'var(--color-brand-primary)'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    {totalTras > maxSlots && maxSlots > 0 && (
                                                        <p className="text-red-500 text-xs font-bold mt-3 text-center flex items-center justify-center gap-1.5">
                                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                            Has excedido el límite de horas para este grado.
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                                    {cursos.map((c, index) => {
                                                        const isSel = seleccion[c.id_curso] !== undefined;
                                                        const colors = [
                                                            { bg: '#1e293b', text: '#f1f5f9' }, // Slate oscuro
                                                            { bg: '#a855f7', text: '#ffffff' }, // Morado
                                                            { bg: '#f43f5e', text: '#ffffff' }, // Rosa/Rojo
                                                            { bg: '#10b981', text: '#ffffff' }, // Esmeralda
                                                            { bg: '#3b82f6', text: '#ffffff' }, // Azul
                                                            { bg: '#f59e0b', text: '#1c1917' }, // Ámbar
                                                            { bg: '#06b6d4', text: '#ffffff' }, // Cyan
                                                            { bg: '#ec4899', text: '#ffffff' }, // Rosa fucsia
                                                            { bg: '#8b5cf6', text: '#ffffff' }, // Violeta
                                                            { bg: '#14b8a6', text: '#ffffff' }, // Teal
                                                            { bg: '#ef4444', text: '#ffffff' }, // Rojo vivo
                                                            { bg: '#6366f1', text: '#ffffff' }, // Índigo
                                                        ];
                                                        const cColor = colors[index % colors.length];
                                                        return (
                                                            <div
                                                                key={c.id_curso}
                                                                className={`p-4 rounded-[20px] border-2 transition-all flex flex-col gap-3 cursor-pointer ${isSel ? 'shadow-md -translate-y-0.5' : 'hover:-translate-y-0.5 hover:shadow-sm bg-white'}`}
                                                                style={{
                                                                    borderColor: cColor.bg,
                                                                    backgroundColor: isSel ? cColor.bg + '1A' : '#ffffff'
                                                                }}
                                                                onClick={() => toggleCurso(c.id_curso)}
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1">
                                                                        <h4 className={`font-black text-sm leading-tight mt-1 ${isSel ? 'text-slate-900' : 'text-slate-700'}`}>{c.nombre_curso}</h4>
                                                                    </div>
                                                                    <div
                                                                        className="w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors flex-shrink-0"
                                                                        style={{
                                                                            backgroundColor: isSel ? cColor.bg : 'transparent',
                                                                            borderColor: cColor.bg
                                                                        }}
                                                                    >
                                                                        {isSel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                                    </div>
                                                                </div>

                                                                {isSel && (
                                                                    <div className="pt-3 border-t border-indigo-100/50 flex items-center gap-3 animate-fade-in">
                                                                        <label className="text-[11px] font-bold text-slate-500">Horas:</label>
                                                                        <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => { e.stopPropagation(); setSeleccion({ ...seleccion, [c.id_curso]: Math.max(1, (seleccion[c.id_curso] || 1) - 1) }) }}
                                                                                className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-brand-primary cursor-pointer transition-colors"
                                                                            >
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                                            </button>
                                                                            <div className="flex-1 text-center font-black text-sm text-slate-800 border-x border-slate-100 bg-slate-50/50 flex items-center justify-center h-8">
                                                                                {seleccion[c.id_curso] || 1}
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (maxSlots > 0 && totalTras >= maxSlots) return;
                                                                                    setSeleccion({ ...seleccion, [c.id_curso]: Math.min(40, (seleccion[c.id_curso] || 1) + 1) });
                                                                                }}
                                                                                disabled={maxSlots > 0 && totalTras >= maxSlots}
                                                                                className={`w-8 h-8 flex items-center justify-center transition-colors ${maxSlots > 0 && totalTras >= maxSlots ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-50 hover:text-brand-primary cursor-pointer'}`}
                                                                            >
                                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex justify-between items-center mt-auto pt-6 border-t border-slate-200">
                                                    <div className="flex gap-4 ml-auto">
                                                        <button
                                                            onClick={() => setFormStep(1)}
                                                            className="px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
                                                        >
                                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                                            Atrás
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleGuardarBulk}
                                                            disabled={guardando || guardadoExitoso || (totalTras > maxSlots && maxSlots > 0) || totalTras === 0}
                                                            className={`px-8 py-3.5 text-white text-[14px] font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer ${guardadoExitoso
                                                                ? 'bg-[var(--color-brand-dark)] ring-4 ring-[var(--color-brand-primary)]/30'
                                                                : 'bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)]'
                                                                }`}
                                                        >
                                                            {guardadoExitoso ? (
                                                                <>
                                                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                                                    ¡Guardado!
                                                                </>
                                                            ) : guardando ? 'Guardando...' : 'Guardar Malla'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </main>
            </div>

            {/* Modal de Edición Individual (mantenemos esto flotante para ediciones rápidas) */}
            {currentView === 'list' && isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-[480px] border border-slate-100 overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Header con gradiente */}
                        <div className="relative px-8 py-6 flex justify-between items-center overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-dark))' }}>
                            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-20" style={{ backgroundColor: '#fff' }}></div>
                            <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: '#fff' }}></div>
                            <div className="relative z-10">
                                <h2 className="text-xl font-extrabold" style={{ color: '#ffffff' }}>Editar Asignación</h2>
                                <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>Modifica los datos de esta asignación</p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="relative z-10 cursor-pointer w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
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
                                <button type="button" onClick={() => setCurrentView('list')} className="cursor-pointer flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">Cancelar</button>
                                <button type="submit" disabled={guardando} className="cursor-pointer flex-1 py-3 text-white text-sm font-bold rounded-xl transition-all bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)]">{guardando ? 'Guardando...' : 'Guardar Cambios'}</button>
                            </div>
                        </form>

                            /* PASO 1 y 2: STEPPER */
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState } from 'react';

/**
 * Mapeo de tipos de causa a configuración visual.
 * Todo en lenguaje amigable para el usuario (administrador de colegio).
 */
const CAUSA_CONFIG = {
    competencia_slots: {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        label: 'Comparten los mismos horarios',
        bgColor: '#FFF7ED',
        borderColor: '#FDBA74',
        textColor: '#9A3412',
        iconBg: '#FED7AA',
        iconColor: '#EA580C',
    },
    traslado_intersedes: {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
        label: 'Tiempo de traslado entre sedes',
        bgColor: '#EFF6FF',
        borderColor: '#93C5FD',
        textColor: '#1E3A8A',
        iconBg: '#BFDBFE',
        iconColor: '#2563EB',
    },
    reserva_bloqueo: {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
        ),
        label: 'Bloqueado por reservas',
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        textColor: '#991B1B',
        iconBg: '#FECACA',
        iconColor: '#DC2626',
    },
    tope_categoria: {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        label: 'Límite de horas por área',
        bgColor: '#FFFBEB',
        borderColor: '#FCD34D',
        textColor: '#92400E',
        iconBg: '#FDE68A',
        iconColor: '#D97706',
    },
    indeterminado: {
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        label: 'Combinación de factores',
        bgColor: '#F9FAFB',
        borderColor: '#D1D5DB',
        textColor: '#374151',
        iconBg: '#E5E7EB',
        iconColor: '#6B7280',
    },
};

/**
 * Traduce la descripción técnica de una causa a lenguaje amigable.
 */
function friendlyDescription(causa) {
    const { tipo, descripcion, slots_afectados } = causa;
    const slots = slots_afectados || 0;
    const horaLabel = slots === 1 ? 'hora de clase' : 'horas de clase';

    switch (tipo) {
        case 'competencia_slots':
            return `Otros profesores ya ocupan ${slots} ${horaLabel} en las mismas secciones y horarios donde este profesor podría dar clases.`;
        case 'traslado_intersedes':
            return `Se pierden ${slots} ${horaLabel} porque el profesor necesita trasladarse entre sedes distintas y no le alcanza el tiempo entre clases.`;
        case 'reserva_bloqueo':
            return `${slots} ${horaLabel} de disponibilidad del profesor coinciden con bloques reservados (como recreos, asambleas, etc.) que no pueden usarse.`;
        case 'tope_categoria':
            return `En algunos días, el área de sus cursos ya alcanzó el máximo de horas permitido por día, impidiendo ${slots} asignación${slots !== 1 ? 'es' : ''} más.`;
        case 'indeterminado':
            return 'El faltante se debe a una combinación de varias situaciones que individualmente no causan el problema, pero juntas sí lo provocan.';
        default:
            return descripcion || 'Situación no identificada.';
    }
}

/**
 * Tarjeta individual de una causa de conflicto.
 */
function CausaCard({ causa }) {
    const config = CAUSA_CONFIG[causa.tipo] || CAUSA_CONFIG.indeterminado;

    return (
        <div
            className="rounded-xl border overflow-hidden transition-all duration-300"
            style={{
                background: config.bgColor,
                borderColor: config.borderColor,
            }}
        >
            <div className="p-4 flex items-start gap-3">
                {/* Icono */}
                <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: config.iconBg, color: config.iconColor }}
                >
                    {config.icon}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="font-bold text-[13.5px]"
                            style={{ color: config.textColor }}
                        >
                            {config.label}
                        </span>
                        {causa.slots_afectados > 0 && (
                            <span
                                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                style={{
                                    background: config.iconBg,
                                    color: config.iconColor,
                                }}
                            >
                                {causa.slots_afectados}h afectada{causa.slots_afectados !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <p
                        className="text-[13px] leading-relaxed m-0"
                        style={{ color: config.textColor, opacity: 0.85 }}
                    >
                        {friendlyDescription(causa)}
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Tarjeta de un profesor con conflicto.
 */
function ProfesorCard({ profesor, index }) {
    const [expanded, setExpanded] = useState(true);
    const porcentaje = profesor.horas_requeridas > 0
        ? Math.round((profesor.horas_alcanzadas / profesor.horas_requeridas) * 100)
        : 0;

    return (
        <div
            className="bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg"
            style={{
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
                animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`,
            }}
        >
            {/* Header del profesor */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-5 flex items-center gap-4 text-left cursor-pointer bg-transparent border-none hover:bg-slate-50/50 transition-colors"
            >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-bold text-slate-800 m-0 truncate">
                        {profesor.profesor_nombre || profesor.profesor_id}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5">
                        {/* Mini barra de progreso */}
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[140px]">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${porcentaje}%`,
                                    background: porcentaje >= 80 ? '#22c55e' : porcentaje >= 50 ? '#f59e0b' : '#ef4444',
                                }}
                            />
                        </div>
                        <span className="text-[12px] font-semibold text-slate-500">
                            {profesor.horas_alcanzadas}/{profesor.horas_requeridas}h
                        </span>
                    </div>
                </div>

                {/* Badge déficit */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12px] font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100">
                        Faltan {profesor.deficit}h
                    </span>
                    {/* Chevron */}
                    <svg
                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Causas — expandible */}
            <div
                className="overflow-hidden transition-all duration-400"
                style={{
                    maxHeight: expanded ? '1000px' : '0',
                    opacity: expanded ? 1 : 0,
                }}
            >
                <div className="px-5 pb-5 space-y-2.5 border-t border-slate-50 pt-4">
                    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider m-0 mb-2">
                        ¿Por qué sucede esto?
                    </p>
                    {profesor.causas && profesor.causas.map((causa, i) => (
                        <CausaCard key={i} causa={causa} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * Componente principal de resultados del diagnóstico.
 * Se renderiza inline en la página de horarios.
 */
export default function DiagnosticoResultados({ resultado }) {
    if (!resultado) return null;

    const { estado, total_profesores_afectados, cuellos_de_botella, mensaje } = resultado;

    // --- Estado: Sin conflictos detectados ---
    if (estado === 'sin_conflictos') {
        return (
            <div className="w-full mx-auto animate-fade-in-up">
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center"
                    style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)' }}>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No se encontraron conflictos específicos</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        El análisis no encontró situaciones puntuales que impidan armar los horarios.
                        Intenta generar nuevamente — a veces se necesita un poco más de tiempo para encontrar la solución.
                    </p>
                </div>
            </div>
        );
    }

    // --- Estado: Falló el análisis ---
    if (estado === 'solver_fallo') {
        return (
            <div className="w-full mx-auto animate-fade-in-up">
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center"
                    style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)' }}>
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">No se pudo completar el análisis</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                        La configuración actual tiene demasiadas restricciones cruzadas que impiden el análisis.
                        Revisa que los datos de profesores, grados y cursos estén correctamente configurados.
                    </p>
                </div>
            </div>
        );
    }

    // --- Estado: Conflictos detectados ---
    if (estado === 'conflictos_detectados' && cuellos_de_botella && cuellos_de_botella.length > 0) {
        return (
            <div className="w-full mx-auto animate-fade-in-up">
                {/* Header resumen */}
                <div className="mb-5 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-4">
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-[13px] font-bold text-amber-700">
                            {total_profesores_afectados} {total_profesores_afectados === 1 ? 'profesor tiene' : 'profesores tienen'} conflictos de horario
                        </span>
                    </div>
                    <p className="text-[14px] text-slate-500 max-w-lg mx-auto leading-relaxed">
                        Encontramos situaciones que impiden asignar todas las horas requeridas.
                        Revisa cada profesor para entender qué está pasando y qué puedes ajustar.
                    </p>
                </div>

                {/* Lista de profesores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {cuellos_de_botella.map((profesor, index) => (
                        <ProfesorCard key={profesor.profesor_id} profesor={profesor} index={index} />
                    ))}
                </div>

                {/* Sugerencia final */}
                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[13px] text-slate-500 leading-relaxed m-0">
                        <span className="font-bold text-slate-600">Sugerencia:</span>{' '}
                        Para resolver estos conflictos, puedes ajustar la disponibilidad de los profesores
                        afectados, revisar los cursos que tienen habilitados, o modificar las reservas de bloques
                        horarios. Una vez que hagas los ajustes, intenta generar los horarios nuevamente.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}

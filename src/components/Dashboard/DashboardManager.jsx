import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000/api';

export default function DashboardManager() {
    const [stats, setStats] = useState({ profesores: 0, cursos: 0, areas: 0, sedes: 0, grados: 0, secciones: 0, planes: 0, tutorias: 0 });
    const [colegio, setColegio] = useState(null);
    const [horarioCount, setHorarioCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [profList, setProfList] = useState([]);
    const [cursosList, setCursosList] = useState([]);
    const [profCurso, setProfCurso] = useState([]);
    const [sedesList, setSedesList] = useState([]);
    const [sedeProfesor, setSedeProfesor] = useState([]);
    const [areasList, setAreasList] = useState([]);
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof sessionStorage !== 'undefined') {
            const saved = sessionStorage.getItem('dashboardActiveSede');
            return saved ? parseInt(saved, 10) : null;
        }
        return null;
    });
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (activeTab && typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('dashboardActiveSede', activeTab.toString());
        }
    }, [activeTab]);

    useEffect(() => {
        const load = async () => {
            try {
                const endpoints = ['profesores', 'cursos', 'areas', 'sedes', 'grados', 'secciones', 'planes', 'tutorias'];
                const responses = await Promise.all(endpoints.map(e => fetch(`${API}/${e}`).then(r => r.ok ? r.json() : [])));
                const c = {};
                endpoints.forEach((e, i) => c[e] = Array.isArray(responses[i]) ? responses[i].length : 0);
                setStats(c);
                const colRes = await fetch(`${API}/colegio`);
                if (colRes.ok) { const d = await colRes.json(); setColegio(Array.isArray(d) && d[0] ? d[0] : null); }
                const hRes = await fetch(`${API}/horario-final`);
                if (hRes.ok) { const d = await hRes.json(); setHorarioCount(Array.isArray(d) ? d.length : 0); }
                const [pRes, cRes, pcRes, spRes, aRes] = await Promise.all([
                    fetch(`${API}/profesores`).then(r => r.ok ? r.json() : []),
                    fetch(`${API}/cursos`).then(r => r.ok ? r.json() : []),
                    fetch(`${API}/profesor-curso`).then(r => r.ok ? r.json() : []),
                    fetch(`${API}/profesor-sedes`).then(r => r.ok ? r.json() : []),
                    fetch(`${API}/areas`).then(r => r.ok ? r.json() : []),
                ]);
                setSedesList(Array.isArray(responses[3]) ? responses[3] : []);
                setProfList(Array.isArray(pRes) ? pRes : []);
                setCursosList(Array.isArray(cRes) ? cRes : []);
                setProfCurso(Array.isArray(pcRes) ? pcRes : []);
                setSedeProfesor(Array.isArray(spRes) ? spRes : []);
                setAreasList(Array.isArray(aRes) ? aRes : []);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        load();
        window.addEventListener('horarix_data_updated', load);
        return () => window.removeEventListener('horarix_data_updated', load);
    }, []);

    const v = (n) => loading ? '—' : n;

    const StatCard = ({ icon, label, value, colorLight, colorDark }) => (
        <div className="rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm border border-slate-50" style={{ background: `linear-gradient(180deg, ${colorLight} 0%, white 100%)` }}>
            <div>
                <p className="text-slate-800 text-[15px] font-bold">{label}</p>
                <p className="text-slate-500 text-[12px] mt-0.5">{value} Registros</p>
            </div>
            <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center relative flex-shrink-0">
                <div className="absolute inset-0 rounded-full opacity-15" style={{ backgroundColor: colorDark }}></div>
                <div className="absolute inset-[2px] rounded-full opacity-50 bg-white"></div>
                <div className="relative z-10" style={{ color: colorDark }}>
                    {icon}
                </div>
            </div>
        </div>
    );

    const activeSedeId = activeTab || (sedesList.length > 0 ? sedesList[0].id_sede : null);
    let displayProfs = profList;

    if (sedesList.length > 0 && activeSedeId) {
        const profIdsInSede = sedeProfesor.filter(sp => sp.id_sede === activeSedeId).map(sp => sp.id_profesor);
        if (sedeProfesor.length > 0) {
            displayProfs = profList.filter(p => profIdsInSede.includes(p.id_profesor));
        }
    }

    const maxToShow = 6;
    const totalPages = Math.ceil(displayProfs.length / maxToShow);
    const startIndex = (currentPage - 1) * maxToShow;
    const paginatedProfs = displayProfs.slice(startIndex, startIndex + maxToShow);

    // Calculate areas data for vertical bar chart
    const cursosPorAreaRaw = areasList.map(area => ({
        name: area.nombre,
        count: cursosList.filter(c => c.id_area === area.id_area).length
    })).filter(a => a.count > 0).sort((a, b) => b.count - a.count);

    const chartColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

    const cursosPorArea = cursosPorAreaRaw.map((area, index) => ({
        ...area,
        color: chartColors[index % chartColors.length]
    }));

    // Lógica para progreso de preparación global del sistema
    let progresoBase = 0;
    if (colegio) progresoBase += 10;
    if (sedesList.length > 0) progresoBase += 10;
    if (stats.grados > 0) progresoBase += 10;
    if (stats.secciones > 0) progresoBase += 10;
    if (areasList.length > 0) progresoBase += 10;
    if (profList.length > 0) progresoBase += 10;

    const cursosAsignados = new Set(profCurso.map(pc => pc.id_curso)).size;
    // Excluir los cursos de "Tutoría" del conteo total porque se asignan por sección, no por carga académica
    const cursosRegulares = cursosList.filter(c => !c.nombre_curso?.toLowerCase().includes('tutor'));
    const totalCursos = cursosRegulares.length;
    // El 40% final del progreso recae en la asignación de profesores a cursos
    const porcentajeAsignacion = totalCursos > 0 ? (cursosAsignados / totalCursos) * 40 : 0;

    const progresoHorarios = Math.min(100, Math.round(progresoBase + porcentajeAsignacion));

    return (
        <div className="w-full max-w-[1440px] mx-auto pb-4">            {/* ═══ ENVOLTORIO PRINCIPAL: Dos Columnas Maestras ═══ */}
            <div className="flex flex-col xl:flex-row gap-8">

                {/* ── COLUMNA IZQUIERDA (Contenido Principal) ── */}
                <div className="flex-1 flex flex-col gap-8">

                    {/* 1. BANNER PRINCIPAL */}
                    <div className="relative overflow-hidden rounded-[24px] bg-[var(--color-hx-purple)]/10 flex flex-col md:flex-row items-center justify-between p-8 md:p-10 shadow-sm border border-[var(--color-hx-purple)]/70">
                        {/* Text Content */}
                        <div className="relative z-10 max-w-sm xl:max-w-lg">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                                Hola, colegio
                                {colegio?.nombre_colegio && (
                                    <span className="relative">
                                        <span className="absolute inset-0 bg-[var(--color-hx-purple)] rounded-xl blur-md opacity-40 animate-pulse"></span>
                                        <span className="relative bg-[var(--color-hx-purple)]/60 text-white px-4 py-1.5 rounded-xl inline-block shadow-sm text-3xl md:text-4xl">
                                            {colegio.nombre_colegio}
                                        </span>
                                    </span>
                                )}
                            </h1>
                            <p className="text-slate-500 text-[15px] md:text-[16px] font-medium leading-relaxed mt-2">
                                Aquí tienes el resumen general, el progreso de configuración y las métricas principales de tu institución.
                            </p>
                        </div>

                        {/* Animated Graphic Right Side */}
                        <div className="relative mt-8 md:mt-0 w-full md:w-[360px] h-48 flex items-center justify-center flex-shrink-0">
                            {/* Background glows */}
                            <div className="absolute w-48 h-48 bg-blue-200 rounded-full blur-3xl opacity-60 mix-blend-multiply animate-pulse" style={{ animationDuration: '4s' }}></div>
                            <div className="absolute w-36 h-36 bg-purple-200 rounded-full blur-3xl opacity-60 mix-blend-multiply right-8 top-0 animate-pulse" style={{ animationDuration: '5s' }}></div>

                            {/* School Illustration */}
                            <svg width="100%" height="100%" viewBox="0 0 340 220" className="relative z-10 drop-shadow-xl">
                                {/* Sun */}
                                <circle cx="280" cy="50" r="24" fill="#fef08a" className="animate-pulse" style={{ animationDuration: '4s' }} />

                                {/* Floating Clouds */}
                                <g>
                                    <animateTransform attributeName="transform" type="translate" values="0,0; 10,0; 0,0" dur="8s" repeatCount="indefinite" />
                                    <path d="M50 60 Q 60 40 80 60 Q 100 50 110 70 Q 120 90 90 90 L 50 90 Q 30 90 50 60 Z" fill="#ffffff" fillOpacity="0.8" />
                                </g>
                                <g>
                                    <animateTransform attributeName="transform" type="translate" values="0,0; -10,0; 0,0" dur="10s" repeatCount="indefinite" />
                                    <path d="M220 80 Q 230 65 245 80 Q 260 70 270 85 Q 280 100 255 100 L 220 100 Q 205 100 220 80 Z" fill="#ffffff" fillOpacity="0.6" />
                                </g>

                                {/* Clock Tower */}
                                <rect x="140" y="50" width="60" height="50" rx="2" fill="#cbd5e1" />
                                <polygon points="170,20 135,50 205,50" fill="#f43f5e" />
                                <circle cx="170" cy="70" r="14" fill="white" />
                                <path d="M170 70 L170 62" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                                <path d="M170 70 L176 73" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

                                {/* Main Building */}
                                <rect x="90" y="100" width="160" height="100" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
                                <rect x="85" y="90" width="170" height="10" rx="4" fill="#f43f5e" />

                                {/* Building Details */}
                                <rect x="120" y="100" width="100" height="10" fill="#e2e8f0" />

                                {/* Door */}
                                <path d="M150 200 L150 150 A 20 20 0 0 1 190 150 L190 200 Z" fill="#8b5cf6" />
                                <rect x="169" y="150" width="2" height="50" fill="#6d28d9" />

                                {/* Windows */}
                                <rect x="105" y="115" width="25" height="30" rx="2" fill="#bae6fd" />
                                <rect x="210" y="115" width="25" height="30" rx="2" fill="#bae6fd" />
                                <rect x="105" y="160" width="25" height="30" rx="2" fill="#bae6fd" />
                                <rect x="210" y="160" width="25" height="30" rx="2" fill="#bae6fd" />
                                <rect x="105" y="160" width="25" height="30" rx="2" fill="#bae6fd" />
                                <rect x="210" y="160" width="25" height="30" rx="2" fill="#bae6fd" />

                                {/* Left Tree */}
                                <g transform="translate(50, 150)">
                                    <rect x="15" y="20" width="10" height="40" fill="#78350f" />
                                    <circle cx="20" cy="15" r="20" fill="#10b981" />
                                    <circle cx="10" cy="25" r="15" fill="#059669" />
                                    <circle cx="30" cy="25" r="15" fill="#34d399" />
                                </g>

                                {/* Right Tree */}
                                <g transform="translate(250, 155)">
                                    <rect x="12" y="15" width="8" height="30" fill="#78350f" />
                                    <circle cx="16" cy="10" r="16" fill="#10b981" />
                                    <circle cx="8" cy="20" r="12" fill="#059669" />
                                    <circle cx="24" cy="20" r="12" fill="#34d399" />
                                </g>
                            </svg>
                        </div>
                    </div>

                    {/* 2. MÉTRICAS */}
                    <div className="mt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                label="Profesores"
                                value={v(stats.profesores)}
                                colorLight="#f3e8ff"
                                colorDark="#790EEC"
                                icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                            />
                            <StatCard
                                label="Cursos"
                                value={v(stats.cursos)}
                                colorLight="#dcfce7"
                                colorDark="#059669"
                                icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>}
                            />
                            <StatCard
                                label="Secciones"
                                value={v(stats.secciones)}
                                colorLight="#ffedd5"
                                colorDark="#d97706"
                                icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>}
                            />
                            <StatCard
                                label="Grados"
                                value={v(stats.grados)}
                                colorLight="#dbeafe"
                                colorDark="#2563eb"
                                icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>}
                            />
                        </div>
                    </div>

                    {/* Contenedor Inferior: Progreso de Llenado + Mapa de Áreas */}
                    <div className="flex flex-col md:flex-row gap-6 w-full">

                        {/* 1. Progreso de Llenado (Izquierda) */}
                        <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-[1] flex flex-col justify-center min-w-[300px]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100/50">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-slate-800 font-black text-[18px] tracking-tight">Preparación del Sistema</h3>
                                    <p className="text-slate-500 text-[13px] mt-0.5">Estado global de configuración</p>
                                </div>
                            </div>

                            <div className="mt-2">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-4xl font-black text-slate-800 tracking-tighter">{progresoHorarios}%</span>
                                    <span className="text-slate-500 text-[13px] font-semibold">Completado</span>
                                </div>
                                {/* Progress Bar Container */}
                                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner relative">
                                    {/* Animated Progress Fill */}
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out relative"
                                        style={{ width: `${progresoHorarios}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-[12px] font-medium mt-4 text-center">
                                    {progresoHorarios === 100
                                        ? '¡Sistema 100% listo para generar horarios!'
                                        : 'Añade más datos básicos y asigna docentes para llegar al 100%.'}
                                </p>
                            </div>
                        </div>

                        {/* 2. Mapa de Áreas (Derecha) */}
                        <div className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-[1.3] flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center border border-purple-100/50">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-slate-800 font-black text-[18px] tracking-tight">Mapa de Áreas</h3>
                                    <p className="text-slate-500 text-[13px] mt-0.5">Cantidad de cursos por área</p>
                                </div>
                            </div>

                            {cursosPorArea.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium">No hay datos</div>
                            ) : (
                                <div className="flex flex-wrap gap-2.5 content-start flex-1 overflow-y-auto custom-scrollbar pr-2 h-[120px]">
                                    {cursosPorArea.map((area, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 bg-slate-50/50 border border-slate-100/80 rounded-lg px-3 py-2 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all"
                                        >
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: area.color }}></span>
                                            <span className="text-slate-600 text-[13px] font-bold leading-tight">{area.name}</span>
                                            <span className="text-slate-400 text-[12px] font-black ml-1 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                                {area.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* ── COLUMNA DERECHA (Directorio Docente) ── */}
                <div className="w-full xl:w-[340px] flex-shrink-0">
                    <div className="bg-white rounded-[24px] h-full flex flex-col overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.09)] min-h-[500px]">
                        {/* Header */}
                        <div className="px-6 pt-7 pb-5 flex items-center justify-between border-b border-slate-50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-50/80 via-white to-blue-50/50"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-[0_2px_10px_rgb(0,0,0,0.05)] text-[var(--color-hx-purple)] border border-[var(--color-hx-purple)]/20">
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                </div>
                                <h3 className="text-slate-800 font-black text-[18px] tracking-tight">Docentes</h3>
                            </div>
                            <div className="relative z-10">
                                <span className="bg-white border border-[var(--color-hx-purple)]/20 text-[var(--color-hx-purple)] text-[12px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                                    {displayProfs.length} docente{displayProfs.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {/* Tabs for Sedes (if multiple) */}
                        {sedesList.length >= 2 && (
                            <div className="px-6 py-4 bg-slate-50/30 border-b border-slate-50">
                                <div className="bg-slate-200/60 p-1.5 rounded-2xl flex gap-1 relative shadow-inner border border-[var(--color-hx-purple)]">
                                    {sedesList.map(sede => {
                                        const isActive = activeTab === sede.id_sede || (!activeTab && sedesList[0].id_sede === sede.id_sede);
                                        const countInSede = sedeProfesor.length > 0
                                            ? sedeProfesor.filter(sp => sp.id_sede === sede.id_sede).length
                                            : profList.length;

                                        return (
                                            <button
                                                key={sede.id_sede}
                                                onClick={() => { setActiveTab(sede.id_sede); setCurrentPage(1); }}
                                                className={`flex-1 text-[13px] font-bold py-2 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5 ${isActive ? 'bg-[var(--color-hx-purple)]/60 text-white shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                            >
                                                {sede.nombre_sede}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* List */}
                        <div className="flex-1 px-4 overflow-y-auto pb-6 pt-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
                            {displayProfs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-slate-400"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                                    <p className="text-slate-500 text-sm font-medium">No hay docentes</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5 h-full flex flex-col relative">
                                    <div className="flex-1 space-y-1.5 min-h-[480px]">
                                        {paginatedProfs.map((prof) => {
                                            const initials = (prof.nombre_profesor || '?').substring(0, 2).toUpperCase();
                                            const profCursosCount = profCurso.filter(pc => pc.id_profesor === prof.id_profesor).length;

                                            return (
                                                <div key={prof.id_profesor} className="rounded-2xl p-2.5 flex items-center gap-3.5 bg-transparent hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group cursor-default">
                                                    {/* Avatar */}
                                                    <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-black text-[14px] flex-shrink-0 bg-[var(--color-hx-purple)]/10 text-[var(--color-hx-purple)] shadow-sm">
                                                        {initials}
                                                    </div>
                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                                                        <p className="text-slate-800 font-bold text-[14px] truncate leading-tight group-hover:text-[var(--color-hx-purple)] transition-colors">
                                                            {prof.nombre_profesor}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-colors">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${profCursosCount > 0 ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                                                            <p className="text-slate-500 text-[11px] font-bold">
                                                                {profCursosCount > 0 ? `${profCursosCount} curso${profCursosCount !== 1 ? 's' : ''}` : 'Ninguno'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between p-2 border border-slate-100 bg-white shadow-sm rounded-2xl mt-auto absolute bottom-0 left-0 right-0">
                                            <button
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-[var(--color-hx-purple)] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer shadow-sm border border-slate-100 bg-slate-50"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                            </button>
                                            <span className="text-[15px] font-bold text-slate-600">
                                                {currentPage} <span className="font-medium text-slate-400">de</span> {totalPages}
                                            </span>
                                            <button
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-[var(--color-hx-purple)] disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer shadow-sm border border-slate-100 bg-slate-50"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

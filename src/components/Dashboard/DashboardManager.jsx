import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000/api';

const pastelColors = [
    { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', hoverBg: 'hover:bg-red-100' },
    { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', hoverBg: 'hover:bg-emerald-100' },
    { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', hoverBg: 'hover:bg-purple-100' },
    { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', hoverBg: 'hover:bg-orange-100' },
    { bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-600', hoverBg: 'hover:bg-sky-100' },
    { bg: 'bg-pink-50', border: 'border-pink-100', text: 'text-pink-600', hoverBg: 'hover:bg-pink-100' },
    { bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-600', hoverBg: 'hover:bg-teal-100' },
    { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600', hoverBg: 'hover:bg-yellow-100' },
    { bg: 'bg-fuchsia-50', border: 'border-fuchsia-100', text: 'text-fuchsia-600', hoverBg: 'hover:bg-fuchsia-100' },
    { bg: 'bg-lime-50', border: 'border-lime-100', text: 'text-lime-600', hoverBg: 'hover:bg-lime-100' },
    { bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-600', hoverBg: 'hover:bg-stone-100' },
    { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-600', hoverBg: 'hover:bg-cyan-100' },
    { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', hoverBg: 'hover:bg-amber-100' },
    { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-600', hoverBg: 'hover:bg-violet-100' },
    { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', hoverBg: 'hover:bg-rose-100' }
];

export default function DashboardManager() {
    const [stats, setStats] = useState({ profesores: 0, cursos: 0, areas: 0, sedes: 0, grados: 0, secciones: 0, planes: 0, tutorias: 0, reservas: 0 });
    const [areaDetails, setAreaDetails] = useState([]);
    const [colegio, setColegio] = useState(null);
    const [horarioCount, setHorarioCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const endpoints = [
                    { key: 'profesores', url: 'profesores' },
                    { key: 'cursos', url: 'cursos' },
                    { key: 'areas', url: 'areas' },
                    { key: 'sedes', url: 'sedes' },
                    { key: 'grados', url: 'grados' },
                    { key: 'secciones', url: 'secciones' },
                    { key: 'planes', url: 'planes' },
                    { key: 'tutorias', url: 'tutorias' },
                    { key: 'reservas', url: 'bloque-reservado' }
                ];
                const responses = await Promise.all(endpoints.map(e => fetch(`${API}/${e.url}`).then(r => r.ok ? r.json() : [])));
                const c = {};
                endpoints.forEach((e, i) => c[e.key] = Array.isArray(responses[i]) ? responses[i].length : 0);
                setStats(c);
                const areasData = responses[endpoints.findIndex(e => e.key === 'areas')];
                const cursosData = responses[endpoints.findIndex(e => e.key === 'cursos')];
                
                c.areasReales = Array.isArray(areasData) ? areasData.filter(a => a.nombre !== 'Desarrollo Personal' && a.nombre_area !== 'Desarrollo Personal').length : 0;
                c.cursosReales = Array.isArray(cursosData) ? cursosData.filter(c => c.nombre_curso !== 'Tutoría' && c.nombre_curso !== 'Tutoría Psicológica').length : 0;
                
                setStats(c);

                if (Array.isArray(areasData) && Array.isArray(cursosData)) {
                    const details = areasData.map(a => {
                        const count = cursosData.filter(c => c.id_area === a.id_area).length;
                        return { nombre: a.nombre, count };
                    }).sort((a, b) => b.count - a.count);
                    setAreaDetails(details);
                }

                const colRes = await fetch(`${API}/colegio`);
                if (colRes.ok) { const d = await colRes.json(); setColegio(Array.isArray(d) && d[0] ? d[0] : null); }
                const hRes = await fetch(`${API}/horario-final`);
                if (hRes.ok) { const d = await hRes.json(); setHorarioCount(Array.isArray(d) ? d.length : 0); }
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        load();
        window.addEventListener('horarix_data_updated', load);
        return () => window.removeEventListener('horarix_data_updated', load);
    }, []);

    const reqCompleted = stats.areasReales > 0 && stats.cursosReales > 0 && stats.planes > 0 && stats.profesores > 0;
    const academicComplete = stats.areasReales > 0 && stats.cursosReales > 0 && stats.planes > 0;

    const navSteps = [
        { id: 1, label: 'Áreas', path: '/areas', isCompleted: stats.areasReales > 0, isLocked: false },
        { id: 2, label: 'Cursos', path: '/cursos', isCompleted: stats.cursosReales > 0, isLocked: stats.areasReales === 0 },
        { id: 3, label: 'Actividades', path: '/reservas', isCompleted: stats.reservas > 0, optional: true, isLocked: stats.cursosReales === 0 },
        { id: 4, label: 'Planes', path: '/planes', isCompleted: stats.planes > 0, isLocked: stats.cursosReales === 0 },
        { id: 5, label: 'Profesores', path: '/profesores', isCompleted: stats.profesores > 0, isLocked: !academicComplete },
        { id: 6, label: 'Tutorías', path: '/tutorias', isCompleted: stats.tutorias > 0, isLocked: !academicComplete },
        { id: 7, label: 'Generar', desc: 'Crear Horario', path: '/horarios', isCompleted: horarioCount > 0, isButton: true, isReady: reqCompleted },
    ];

    const nodes = navSteps.map((step, i) => {
        const x = [50, 75, 25, 75, 25, 75, 50][i];
        const y = 5 + (i * (90 / (navSteps.length - 1)));
        return { x, y, stepNum: i + 1, ...step };
    });

    const generatePath = () => {
        if (nodes.length === 0) return "";
        let path = `M ${nodes[0].x} ${nodes[0].y}`;
        for (let i = 1; i < nodes.length; i++) {
            const prev = nodes[i - 1];
            const curr = nodes[i];
            const cp1y = prev.y + (curr.y - prev.y) / 2;
            path += ` C ${prev.x} ${cp1y}, ${curr.x} ${cp1y}, ${curr.x} ${curr.y}`;
        }
        return path;
    };

    const generateActivePath = () => {
        let maxCompletedIdx = -1;
        nodes.forEach((n, idx) => {
            if (n.isCompleted) maxCompletedIdx = idx;
        });
        if (maxCompletedIdx <= 0) return "";
        
        let path = `M ${nodes[0].x} ${nodes[0].y}`;
        for (let i = 1; i <= maxCompletedIdx; i++) {
            const prev = nodes[i - 1];
            const curr = nodes[i];
            const cp1y = prev.y + (curr.y - prev.y) / 2;
            path += ` C ${prev.x} ${cp1y}, ${curr.x} ${cp1y}, ${curr.x} ${curr.y}`;
        }
        return path;
    };

    return (
        <div className="w-full max-w-[1440px] mx-auto overflow-hidden h-[685px] mt-5">
            <div className="flex flex-col lg:flex-row gap-6 h-full">

                {/* COLUMNA IZQUIERDA: Panel de Resumen */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Top Banner */}
                    <div className="relative bg-[var(--color-brand-primary)] rounded-[32px] p-10 pb-16 text-white overflow-hidden shadow-lg flex-shrink-0">
                        <div className="relative z-10 max-w-[70%]">
                            <h1 className="text-4xl font-black mb-3">Hola, Vlep</h1>
                            <p className="text-[15px] text-white/85 font-medium leading-relaxed">
                                Te damos la bienvenida al panel principal de tu colegio. Aquí tienes un vistazo general de tu configuración actual antes de generar los horarios.
                            </p>
                        </div>
                        {/* Decorative Abstract Shapes */}
                        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none">
                            <svg viewBox="0 0 200 200" className="absolute -right-8 -top-12 w-72 h-72">
                                <circle cx="100" cy="100" r="100" fill="currentColor" />
                            </svg>
                            <svg viewBox="0 0 200 200" className="absolute right-32 -bottom-16 w-48 h-48">
                                <circle cx="100" cy="100" r="100" fill="currentColor" />
                            </svg>
                            <svg viewBox="0 0 200 200" className="absolute right-12 top-1/2 -translate-y-1/2 w-24 h-24 opacity-50">
                                <rect x="50" y="50" width="100" height="100" rx="20" fill="currentColor" transform="rotate(45 100 100)" />
                            </svg>
                        </div>
                    </div>

                    {/* Overlapping Cards */}
                    <div className="relative z-20 flex gap-4 -mt-10 px-6 flex-shrink-0">
                        {/* Card 1: Grados */}
                        <div className="flex-1 bg-fuchsia-50 border border-fuchsia-200 rounded-3xl shadow-sm p-4 flex items-center gap-3 relative overflow-hidden transition-transform hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-fuchsia-500 flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                            </div>
                            <div className="flex flex-col text-left">
                                <div className="text-2xl font-black text-slate-800 leading-none">{stats.grados}</div>
                                <div className="text-[11px] text-fuchsia-600 font-extrabold mt-1 uppercase tracking-wider">Grados</div>
                            </div>
                        </div>

                        {/* Card 2: Secciones */}
                        <div className="flex-1 bg-cyan-50 border border-cyan-200 rounded-3xl shadow-sm p-4 flex items-center gap-3 relative overflow-hidden transition-transform hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-cyan-500 flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            </div>
                            <div className="flex flex-col text-left">
                                <div className="text-2xl font-black text-slate-800 leading-none">{stats.secciones}</div>
                                <div className="text-[11px] text-cyan-600 font-extrabold mt-1 uppercase tracking-wider">Secciones</div>
                            </div>
                        </div>

                        {/* Card 3: Cursos */}
                        <div className="flex-1 bg-lime-50 border border-lime-200 rounded-3xl shadow-sm p-4 flex items-center gap-3 relative overflow-hidden transition-transform hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lime-500 flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                            </div>
                            <div className="flex flex-col text-left">
                                <div className="text-2xl font-black text-slate-800 leading-none">{stats.cursos}</div>
                                <div className="text-[11px] text-lime-600 font-extrabold mt-1 uppercase tracking-wider">Cursos</div>
                            </div>
                        </div>

                        {/* Card 4: Profesores */}
                        <div className="flex-1 bg-violet-50 border border-violet-200 rounded-3xl shadow-sm p-4 flex items-center gap-3 relative overflow-hidden transition-transform hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-violet-500 flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                            <div className="flex flex-col text-left">
                                <div className="text-2xl font-black text-slate-800 leading-none">{stats.profesores}</div>
                                <div className="text-[11px] text-violet-600 font-extrabold mt-1 uppercase tracking-wider">Profesores</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Áreas & Quick Actions */}
                    <div className="mt-8 px-6 flex-1 flex gap-6 items-stretch pb-6">
                        {/* Áreas Summary (Fills the left space) */}
                        <div className="flex-1  shadow-sm rounded-[32px] p-6 lg:p-8 flex flex-col relative overflow-hidden group">
                            <div className="flex justify-between items-end mb-5 relative z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--color-brand-primary)]">Distribución de Áreas</h3>
                                    <p className="text-[13px] text-slate-400 font-medium mt-0.5">Cursos organizados por área</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-slate-800 leading-none">{stats.areas}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Total</div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                {areaDetails.length > 0 ? (
                                    <div className="flex flex-wrap gap-2.5 content-start h-full">
                                        {areaDetails.map((area, idx) => {
                                            const color = pastelColors[idx % pastelColors.length];
                                            return (
                                                <div key={idx} className={`${color.bg} ${color.border} border rounded-2xl pl-3 pr-1 py-1 flex items-center gap-2 hover:-translate-y-0.5 ${color.hoverBg} transition-all cursor-default shadow-sm`}>
                                                    <span className={`text-[12px] font-bold ${color.text} truncate max-w-[150px]`} title={area.nombre}>{area.nombre}</span>
                                                    <span className={`bg-white ${color.text} rounded-xl px-2 py-1 text-[11px] font-black shadow-sm`}>{area.count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-slate-400 text-sm text-center h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">No hay áreas configuradas</div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <div className="w-[360px] flex-shrink-0 grid grid-cols-2 gap-4">
                            {/* Button 1: Agregar Profesor */}
                            <button className="bg-[var(--color-brand-light)] hover:bg-indigo-100 transition-colors text-[var(--color-brand-primary)] rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm aspect-square group cursor-pointer border border-indigo-100/50">
                                <div className="p-3 rounded-2xl group-hover:scale-110 transition-transform ">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                                </div>
                                <span className="font-extrabold text-[13px] text-center leading-tight">Agregar<br />Profesor</span>
                            </button>

                            {/* Button 2: Edición de horarios */}
                            <button className="bg-[var(--color-brand-light)] hover:bg-indigo-100 transition-colors text-[var(--color-brand-primary)] rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm aspect-square group cursor-pointer border border-indigo-100/50">
                                <div className="p-3 rounded-2xl group-hover:scale-110 transition-transform ">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M11 15h2v2h-2z"></path></svg>
                                </div>
                                <span className="font-extrabold text-[13px] text-center leading-tight">Edición de<br />Horarios</span>
                            </button>

                            {/* Button 3: Historial */}
                            <button className="bg-[var(--color-brand-light)] hover:bg-indigo-100 transition-colors text-[var(--color-brand-primary)] rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm aspect-square group cursor-pointer border border-indigo-100/50">
                                <div className="p-3 rounded-2xl group-hover:scale-110 transition-transform ">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                </div>
                                <span className="font-extrabold text-[13px] text-center leading-tight">Historial de<br />Versiones</span>
                            </button>

                            {/* Button 4: Ajustes de Sistema */}
                            <a
                                href="/ajustes"
                                className="bg-[var(--color-brand-light)] hover:bg-indigo-100 transition-colors text-[var(--color-brand-primary)] rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm aspect-square group cursor-pointer border border-indigo-100/50"
                            >
                                <div className="p-3 rounded-2xl group-hover:scale-110 transition-transform ">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                </div>
                                <span className="font-extrabold text-[13px] text-center leading-tight">Ajustes del<br />Sistema</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Mapa tipo Wizard */}
                <div className="w-full lg:w-[520px] flex-shrink-0 h-full bg-[var(--color-brand-light)] rounded-tl-[40px] rounded-tr-[80px] rounded-bl-[80px] rounded-br-[40px] flex flex-col relative overflow-hidden border border-indigo-50/50">

                    {/* Header del Mapa */}
                    <div className="pt-6 pb-0 px-8 z-10 relative">
                        <h2 className="text-[20px] font-black text-[var(--color-brand-dark)] leading-tight">Configuración del sistema: </h2>
                    </div>

                    {/* Contenedor del Mapa (Ocupa el resto del espacio sin scroll) */}
                    <div className="flex-1 relative w-full pointer-events-none mt-0 mb-8">
                        {/* SVG PATHS */}
                        <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {/* Background Path */}
                            <path d={generatePath()} fill="none" stroke="var(--color-brand-primary)" strokeOpacity="0.15" strokeWidth="0.8" strokeDasharray="3 4" strokeLinecap="round" />
                            {/* Active Path */}
                            <path d={generateActivePath()} fill="none" stroke="var(--color-brand-primary)" strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round" className="transition-all duration-700 ease-out drop-shadow-sm" />
                        </svg>

                        {/* Nodes */}
                        {nodes.map((node) => {
                            return (
                                <div
                                    key={node.stepNum}
                                    className={`absolute flex flex-col items-center pointer-events-auto ${(node.isButton && !node.isReady) || node.isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                    onClick={() => {
                                        if (node.isLocked || (node.isButton && !node.isReady)) return;
                                        window.location.href = node.path;
                                    }}
                                    style={{
                                        left: `${node.x}%`,
                                        top: `${node.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        transition: 'all 0.5s ease'
                                    }}
                                >
                                    {node.isButton ? (
                                        <div className={`px-6 py-3.5 rounded-2xl flex items-center gap-3 font-black text-[15px] transition-all duration-300 shadow-xl border-4 ${node.isReady
                                            ? "hover:scale-105 bg-[var(--color-brand-primary)] text-white border-white shadow-[0_4px_15px_rgba(139,92,246,0.4)]"
                                            : "bg-slate-300 text-slate-500 border-slate-200 shadow-none grayscale"
                                            } whitespace-nowrap`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                            <span>Generar Horario</span>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Tooltip Viñeta - ¡Comienza aquí! */}
                                            {node.id === 1 && stats.areasReales === 0 && (
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[var(--color-brand-primary)] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg animate-bounce z-30">
                                                    ¡Comienza por aquí!
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--color-brand-primary)] rotate-45"></div>
                                                </div>
                                            )}
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[15px] transition-all duration-500 shadow-xl border-4 ${
                                                    node.isLocked
                                                        ? "bg-slate-200 text-slate-400 border-slate-300 grayscale"
                                                        : node.isCompleted
                                                            ? "bg-[var(--color-brand-dark)] text-[var(--color-brand-white)] border-[var(--color-brand-white)] hover:scale-110"
                                                            : "bg-[var(--color-brand-white)] text-[var(--color-brand-dark)] border-[var(--color-brand-white)] hover:scale-110"
                                                    }`}
                                            >
                                                {node.isLocked ? (
                                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                ) : node.isCompleted ? (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                ) : (
                                                    node.stepNum
                                                )}
                                            </div>
                                            <span
                                                className={`absolute top-full mt-2 px-3 py-1.5 rounded-xl text-[12px] font-extrabold text-center tracking-widest uppercase transition-colors whitespace-nowrap shadow-sm border border-white/50 ${
                                                    node.isLocked ? 'bg-slate-100 text-slate-400'
                                                    : node.isCompleted ? 'bg-white text-[var(--color-brand-dark)]/90' 
                                                    : 'bg-white/70 text-[var(--color-brand-dark)]/60'
                                                    }`}
                                            >
                                                {node.label}
                                                {node.optional && <span className="block text-[9px] opacity-70">(Opcional)</span>}
                                            </span>
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

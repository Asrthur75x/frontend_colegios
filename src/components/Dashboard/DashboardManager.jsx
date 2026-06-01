import React, { useState, useEffect } from 'react';

const API = 'http://localhost:8000/api';

export default function DashboardManager() {
    const [stats, setStats] = useState({ profesores: 0, cursos: 0, areas: 0, sedes: 0, grados: 0, secciones: 0, planes: 0, tutorias: 0 });
    const [colegio, setColegio] = useState(null);
    const [horarioCount, setHorarioCount] = useState(0);
    const [loading, setLoading] = useState(true);

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

                    {/* Espacio reservado para más contenido principal */}
                    <div className="flex-1 rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center p-8 mt-2 min-h-[200px]">
                        <p className="text-slate-400 font-medium">Futuras tablas o gráficos del dashboard</p>
                    </div>

                </div>

                {/* ── COLUMNA DERECHA (Aside Completo hasta abajo) ── */}
                <div className="w-full xl:w-[340px] flex-shrink-0">
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-[24px] p-8 h-full flex flex-col items-center justify-center min-h-[600px] text-center">
                        <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        <h3 className="text-slate-500 font-bold text-lg mb-2">Espacio para Anuncios</h3>
                        <p className="text-slate-400 text-sm">Más adelante se agregará el contenido correspondiente a esta sección.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function Sidebar({ currentPath: initialPath = '' }) {
    const [currentPath, setCurrentPath] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.location.pathname.replace(/\/$/, "");
        }
        return initialPath.replace(/\/$/, "");
    });

    const [areasCount, setAreasCount] = useState(0);
    const [cursosCount, setCursosCount] = useState(0);
    const [planesCount, setPlanesCount] = useState(0);
    const [toastMsg, setToastMsg] = useState('');

    // Acordeón: ambos abiertos por defecto
    const [openAcademico, setOpenAcademico] = useState(true);
    const [openDocente, setOpenDocente] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPath(window.location.pathname.replace(/\/$/, ""));
        }

        const fetchCounts = async () => {
            try {
                const [areasRes, cursosRes, planesRes] = await Promise.all([
                    fetch(`${API_BASE}/areas`),
                    fetch(`${API_BASE}/cursos`),
                    fetch(`${API_BASE}/planes`),
                ]);
                if (areasRes.ok) setAreasCount((await areasRes.json()).length);
                if (cursosRes.ok) setCursosCount((await cursosRes.json()).length);
                if (planesRes.ok) setPlanesCount((await planesRes.json()).length);
            } catch (err) {
                console.error("Error fetching sidebar counts:", err);
            }
        };

        fetchCounts();
        window.addEventListener('horarix_data_updated', fetchCounts);
        return () => window.removeEventListener('horarix_data_updated', fetchCounts);
    }, []);

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const handleNavigation = (e, path, isLocked, lockMsg) => {
        if (isLocked) {
            e.preventDefault();
            showToast(lockMsg);
        }
    };

    // Color activo (Dashboard morado, Ajustes amarillo)
    const activeColor = currentPath.startsWith('/ajustes') ? 'var(--color-hx-purple)' : 'var(--color-hx-purple)';

    const activeItemStyle = {
        backgroundColor: '#fff',
        color: activeColor,
        borderTopLeftRadius: '32px',
        borderBottomLeftRadius: '32px',
        position: 'relative',
        fontWeight: 'bold',
        marginLeft: '12px',
        paddingRight: '12px'
    };

    const inactiveItemStyle = {
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '600',
        marginLeft: '12px',
        paddingRight: '12px',
        transition: 'all 0.2s ease'
    };

    const MenuItem = ({ path, label, icon, isLocked, lockMsg }) => {
        const isActive = path === '/dashboard'
            ? (currentPath === '' || currentPath === '/' || currentPath === '/dashboard')
            : currentPath.startsWith(path);

        return (
            <li className="relative mb-1">
                <a
                    href={path}
                    onClick={(e) => handleNavigation(e, path, isLocked, lockMsg)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    style={isActive ? activeItemStyle : inactiveItemStyle}
                    onMouseEnter={(e) => { if (!isActive && !isLocked) e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { if (!isActive && !isLocked) e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                >
                    {/* Cutout corners cuando activo */}
                    {isActive && (
                        <>
                            <div style={{ position: 'absolute', top: '-32px', right: 0, width: '32px', height: '32px', backgroundColor: 'transparent', borderBottomRightRadius: '32px', boxShadow: '16px 16px 0 16px #fff', pointerEvents: 'none' }}></div>
                            <div style={{ position: 'absolute', bottom: '-32px', right: 0, width: '32px', height: '32px', backgroundColor: 'transparent', borderTopRightRadius: '32px', boxShadow: '16px -16px 0 16px #fff', pointerEvents: 'none' }}></div>
                        </>
                    )}

                    <div className={`flex items-center justify-center flex-shrink-0 ${isLocked ? 'opacity-40' : ''}`}>
                        {icon}
                    </div>
                    <span className={`flex-1 text-[13px] ${isLocked ? 'opacity-40' : ''}`}>{label}</span>

                    {isLocked && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    )}
                </a>
            </li>
        );
    };

    const academicComplete = areasCount > 0 && cursosCount > 0 && planesCount > 0;

    // Header de módulo tipo acordeón, con diseño distinguido principal y SIN overflow
    const ModuleHeader = ({ label, icon, isOpen, onToggle, locked }) => (
        <li className="relative mb-2 mt-1 px-3">
            <button
                onClick={onToggle}
                className="flex items-center gap-3 w-full px-4 py-3 cursor-pointer rounded-2xl transition-all"
                style={{
                    backgroundColor: locked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
                    color: locked ? 'rgba(255,255,255,0.4)' : '#fff',
                    border: locked ? '1px dashed rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.15)',
                    boxShadow: locked ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                    if (!locked) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!locked) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }
                }}
            >
                <div className="flex items-center justify-center flex-shrink-0">
                    {icon}
                </div>
                <span className="flex-1 text-left text-[12px] font-black uppercase tracking-wider">
                    {label}
                </span>

                {locked ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                ) : (
                    <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor"
                        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    >
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                )}
            </button>
        </li>
    );

    return (
        <aside
            className="w-64 flex flex-col justify-between fixed h-screen top-0 left-0 z-50 overflow-hidden shadow-2xl transition-colors duration-500"
            style={{ 
                backgroundColor: currentPath.startsWith('/ajustes') ? 'var(--color-hx-purple)' : 'rgba(121, 14, 236, 0.95)'
            }}
        >
            <div className="pt-6 pb-4 flex flex-col h-full overflow-y-auto">
                {/* Logo */}
                <div className="px-8 mb-8 flex items-center gap-3 flex-shrink-0">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-xl shadow-md" style={{ color: currentPath.startsWith('/ajustes') ? 'var(--color-hx-purple)' : 'var(--color-hx-purple)' }}>H</div>
                    <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">HorariX</h1>
                </div>

                {/* Inicio */}
                <ul className="flex flex-col relative mb-4 flex-shrink-0">
                    <MenuItem
                        path="/dashboard"
                        label="Inicio"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                    />
                </ul>

                {/* ── MÓDULOS ── */}
                <ul className="flex flex-col relative mb-4 flex-shrink-0 animate-fade-in-down">
                    <ModuleHeader
                        label="Módulo Académico"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>}
                        isOpen={openAcademico}
                        onToggle={() => setOpenAcademico(o => !o)}
                        locked={false}
                    />
                    {openAcademico && (
                        <div className="flex flex-col relative">
                            <MenuItem
                                path="/areas"
                                label="Áreas Académicas"
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
                            />
                            <MenuItem
                                path="/cursos"
                                label="Cursos"
                                isLocked={areasCount === 0}
                                lockMsg="Debes registrar al menos un Área primero."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>}
                            />
                            <MenuItem
                                path="/reservas"
                                label="Actividades Fijas"
                                isLocked={cursosCount === 0}
                                lockMsg="Debes registrar al menos un Curso primero."
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                        <rect x="8" y="14" width="4" height="4" rx="1"></rect>
                                    </svg>
                                }
                            />
                            <MenuItem
                                path="/planes"
                                label="Planes de Estudio"
                                isLocked={cursosCount === 0}
                                lockMsg="Debes registrar al menos un Curso primero."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>}
                            />
                        </div>
                    )}
                </ul>

                {/* ── MÓDULO DOCENTE ── */}
                <ul className="flex flex-col relative mb-4 flex-shrink-0 animate-fade-in-down">
                    <ModuleHeader
                        label="Módulo Docente"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>}
                        isOpen={openDocente}
                        onToggle={() => setOpenDocente(o => !o)}
                        locked={!academicComplete}
                    />
                    {!academicComplete && openDocente && (
                        <p className="text-[10px] pl-16 pr-5 pb-3 font-semibold" style={{ color: 'rgba(255,255,255,0.35)', marginTop: '-2px' }}>
                            Completa el Módulo Académico para desbloquear
                        </p>
                    )}
                    {openDocente && (
                        <div className="flex flex-col relative">
                            <MenuItem
                                path="/profesores"
                                label="Gestión de Docentes"
                                isLocked={!academicComplete}
                                lockMsg="Completa el Módulo Académico primero (Áreas, Cursos y Planes de Estudio)."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                            />
                            <MenuItem
                                path="/carga-academica"
                                label="Carga Académica"
                                isLocked={!academicComplete}
                                lockMsg="Completa el Módulo Académico primero (Áreas, Cursos y Planes de Estudio)."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                            />
                            <MenuItem
                                path="/tutorias"
                                label="Asignación de Tutorías"
                                isLocked={!academicComplete}
                                lockMsg="Completa el Módulo Académico primero (Áreas, Cursos y Planes de Estudio)."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                            />
                        </div>
                    )}
                </ul>
            </div>

            {/* Cerrar sesión */}
            <div className="p-6 flex-shrink-0">
                <button
                    onClick={() => { localStorage.removeItem('user'); sessionStorage.clear(); window.location.href = '/login'; }}
                    className="flex items-center gap-3 font-bold px-4 py-3 rounded-xl transition-all outline-none w-full"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Cerrar Sesión
                </button>
            </div>

            {/* Toast */}
            {toastMsg && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[230px] bg-red-500 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 z-50">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {toastMsg}
                </div>
            )}
        </aside>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { getSession } from '../lib/auth/session';
import { logout } from '../services/auth';
import { listAreas, listCursos, listPlanesEstudio } from '../services/catalogs';

export default function MainNavbar({ currentPath = '' }) {
    const currentUser = getSession()?.user;
    const [areasCount, setAreasCount] = useState(0);
    const [cursosCount, setCursosCount] = useState(0);
    const [planesCount, setPlanesCount] = useState(0);

    // Usamos realPath en lugar de currentPath para que funcione con astro persist
    const [realPath, setRealPath] = useState(typeof window !== 'undefined' ? window.location.pathname : currentPath);

    // State for popover dropdown (Académico / Docentes) — sin expandir ni empujar la barra principal
    const [activeDropdown, setActiveDropdown] = useState(null);
    const navRef = useRef(null);

    // Escuchar cambios de ruta en Astro ViewTransitions
    useEffect(() => {
        const handlePathChange = () => {
            const path = window.location.pathname;
            setRealPath(path);
            setActiveDropdown(null);
        };
        document.addEventListener('astro:page-load', handlePathChange);
        window.addEventListener('popstate', handlePathChange);
        return () => {
            document.removeEventListener('astro:page-load', handlePathChange);
            window.removeEventListener('popstate', handlePathChange);
        };
    }, []);

    // Cerrar popover al hacer clic fuera o presionar Escape
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (navRef.current && !navRef.current.contains(e.target)) {
                setActiveDropdown(null);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setActiveDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [areas, cursos, planes] = await Promise.all([
                    listAreas(),
                    listCursos(),
                    listPlanesEstudio(),
                ]);
                const numAreas = areas.length;
                const numCursos = cursos.length;
                const numPlanes = planes.length;

                setAreasCount(numAreas);
                setCursosCount(numCursos);
                setPlanesCount(numPlanes);

                // --- ROUTE GUARD (Seguridad de navegación) ---
                const path = window.location.pathname;
                const isAcademicComplete = numAreas > 0 && numCursos > 0 && numPlanes > 0;
                let shouldRedirect = false;

                // Reglas idénticas a los candados visuales
                if (path.startsWith('/cursos') && numAreas === 0) shouldRedirect = true;
                if ((path.startsWith('/reservas') || path.startsWith('/planes')) && numCursos === 0) shouldRedirect = true;
                if ((path.startsWith('/profesores') || path.startsWith('/carga-academica') || path.startsWith('/tutorias')) && !isAcademicComplete) shouldRedirect = true;

                if (shouldRedirect) {
                    window.location.replace('/dashboard');
                }

            } catch (err) {
                console.error("Error fetching navbar counts:", err);
            }
        };

        fetchCounts();
        window.addEventListener('edusync_data_updated', fetchCounts);
        return () => window.removeEventListener('edusync_data_updated', fetchCounts);
    }, []);

    // El evento click-outside ha sido eliminado para que no se cierre la pastilla.

    const academicComplete = areasCount > 0 && cursosCount > 0 && planesCount > 0;

    const navItems = [
        {
            id: 'dashboard',
            label: 'Inicio',
            path: '/dashboard',
            icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        },
        {
            id: 'academico',
            label: 'Académico',
            path: null,
            icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>,
            dropdownItems: [
                { label: 'Áreas', path: '/areas', icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
                { label: 'Cursos', path: '/cursos', locked: areasCount === 0, lockMsg: 'Requiere Área', icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg> },
                { label: 'Actividades', path: '/reservas', locked: cursosCount === 0, lockMsg: 'Requiere Curso', icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
                { label: 'Planes', path: '/planes', locked: cursosCount === 0, lockMsg: 'Requiere Curso', icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg> }
            ]
        },
        {
            id: 'docentes',
            label: 'Docentes',
            path: null,
            icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
            dropdownItems: [
                { label: 'Profesores', path: '/profesores', locked: !academicComplete, lockMsg: 'Incompleto', icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
                { label: 'Tutorías', path: '/tutorias', locked: !academicComplete, lockMsg: 'Incompleto', icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> }
            ]
        },
        {
            id: 'horarios',
            label: 'Horarios',
            path: '/horarios/editar',
            matchPrefix: '/horarios',
            icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
        }
    ];

    const horariosTabs = [
        { label: 'Generar', path: '/horarios', exact: true, icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
        { label: 'Ver / Editar', path: '/horarios/editar', icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> },
        { label: 'Por Profesor', path: '/horarios/profesores', icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
        { label: 'Diagnóstico', path: '/horarios/diagnostico', icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg> },
        { label: 'Historial', path: '/horarios/versiones', icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /><path d="M12 7v5l4 2" /></svg> },
    ];

    const isHorariosSection = realPath.startsWith('/horarios');

    const handleNavClick = (item) => {
        if (item.path) {
            window.location.href = item.path;
        } else {
            setActiveDropdown(activeDropdown === item.id ? null : item.id);
        }
    };

    const handleLogout = async () => {
        await logout();
        sessionStorage.clear();
        window.location.replace('/login');
    };

    return (
        <>
        <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 z-50 flex items-center justify-between px-4 sm:px-6 h-20 transition-all duration-300">
            {/* Logo Section */}
            <a href="/dashboard" className="flex items-center gap-2 cursor-pointer group shrink-0">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 group-hover:scale-105 transition-transform origin-left">
                    <defs>
                        <linearGradient id="grad-logo-nav" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--color-brand-primary)" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                    </defs>
                    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#grad-logo-nav)" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#grad-logo-nav)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-black text-xl text-[var(--color-brand-dark)] tracking-tight hidden sm:inline">Horarix</span>
            </a>

            {/* Center Navigation (Quieta, sin saltos ni expansiones laterales) */}
            <nav ref={navRef} className="flex items-center gap-1 sm:gap-2">
                {navItems.map((item) => {
                    const isOpen = activeDropdown === item.id;
                    const isChildActive = item.dropdownItems?.some(child => realPath.startsWith(child.path) || realPath === child.path);
                    const isMainActive = item.matchPrefix
                        ? realPath.startsWith(item.matchPrefix)
                        : realPath === item.path;
                    const isActive = isMainActive || isChildActive;

                    if (item.path) {
                        return (
                            <a
                                key={item.id}
                                href={item.path}
                                className={`flex items-center justify-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-full transition-all duration-200 font-bold text-[13px] sm:text-[14px] cursor-pointer whitespace-nowrap ${isActive
                                        ? 'bg-[var(--color-brand-dark)] text-white shadow-md'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </a>
                        );
                    }

                    return (
                        <div key={item.id} className="relative">
                            <button
                                type="button"
                                onClick={() => handleNavClick(item)}
                                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 rounded-full transition-all duration-200 font-bold text-[13px] sm:text-[14px] cursor-pointer whitespace-nowrap ${isActive || isOpen
                                        ? 'bg-[var(--color-brand-dark)] text-white shadow-md'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {isOpen && item.dropdownItems && (
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 min-w-[200px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(15,23,42,0.12)] border border-slate-100 p-1.5 z-50">
                                    {item.dropdownItems.map((child, idx) => {
                                        const isSubActive = realPath === child.path || realPath.startsWith(child.path + '/');
                                        return (
                                            <a
                                                key={idx}
                                                href={child.locked ? '#' : child.path}
                                                onClick={e => {
                                                    if (child.locked) {
                                                        e.preventDefault();
                                                    } else {
                                                        setActiveDropdown(null);
                                                    }
                                                }}
                                                title={child.locked ? `Bloqueado: ${child.lockMsg}` : undefined}
                                                className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${child.locked
                                                        ? 'opacity-45 cursor-not-allowed text-slate-400'
                                                        : isSubActive
                                                            ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]'
                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2.5">
                                                    {child.icon}
                                                    <span>{child.label}</span>
                                                </span>
                                                {child.locked && (
                                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                                        🔒 {child.lockMsg}
                                                    </span>
                                                )}
                                            </a>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Right Section (Profile / Logout) */}
            <div className="relative flex items-center">
                <div className="group relative">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-brand-light)]/20 flex items-center justify-center text-[var(--color-brand-primary)] font-bold border border-[var(--color-brand-primary)]/20 cursor-pointer hover:bg-[var(--color-brand-primary)] hover:text-white transition-colors">
                        {(currentUser?.nombre || currentUser?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    {/* Dropdown Menu (Hover) */}
                    <div className="absolute right-0 top-full pt-3 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                        <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-2">
                            <div className="px-3 py-2 border-b border-slate-50 mb-2">
                                <p className="text-sm font-black text-slate-800">{currentUser?.nombre || 'Usuario'}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Cuenta Activa</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        {/* Sub-barra fija de pestañas para Horarios */}
        {isHorariosSection && (
            <div className="fixed top-20 left-0 w-full h-12 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 z-40 flex items-center justify-center px-4">
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full py-1">
                    {horariosTabs.map((tab) => {
                        const normalizedPath = realPath.replace(/\/+$/, '') || '/';
                        const isTabActive = tab.exact
                            ? normalizedPath === tab.path
                            : normalizedPath === tab.path || normalizedPath.startsWith(`${tab.path}/`);
                        return (
                            <a
                                key={tab.path}
                                href={tab.path}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12.5px] font-black transition-all whitespace-nowrap border ${isTabActive
                                        ? 'bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/25 shadow-xs'
                                        : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100/80'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </a>
                        );
                    })}
                </div>
            </div>
        )}
        </>
    );
}

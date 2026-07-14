import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function MainNavbar({ currentPath = '' }) {
    const [areasCount, setAreasCount] = useState(0);
    const [cursosCount, setCursosCount] = useState(0);
    const [planesCount, setPlanesCount] = useState(0);
    
    // State for the expanded module (inline)
    const [activeDropdown, setActiveDropdown] = useState(null);
    const navRef = useRef(null);

    useEffect(() => {
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
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        },
        {
            id: 'academico',
            label: 'Académico',
            path: null,
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
            dropdownItems: [
                { label: 'Áreas', path: '/areas', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
                { label: 'Cursos', path: '/cursos', locked: areasCount === 0, lockMsg: 'Requiere Área', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
                { label: 'Actividades', path: '/reservas', locked: cursosCount === 0, lockMsg: 'Requiere Curso', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
                { label: 'Planes', path: '/planes', locked: cursosCount === 0, lockMsg: 'Requiere Curso', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 17 22 12"/></svg> }
            ]
        },
        {
            id: 'docentes',
            label: 'Docentes',
            path: null,
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
            dropdownItems: [
                { label: 'Profesores', path: '/profesores', locked: !academicComplete, lockMsg: 'Incompleto', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                { label: 'Carga', path: '/carga-academica', locked: !academicComplete, lockMsg: 'Incompleto', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
                { label: 'Tutorías', path: '/tutorias', locked: !academicComplete, lockMsg: 'Incompleto', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
            ]
        },
        {
            id: 'horarios',
            label: 'Horarios',
            path: null,
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
            dropdownItems: [
                { label: 'Secciones', path: '/horarios', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> },
                { label: 'Edición', path: '/horarios/editar', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
                { label: 'Profesores', path: '/horarios/profesores', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                { label: 'Historial', path: '/horarios/versiones', icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/><path d="M12 7v5l4 2"/></svg> }
            ]
        }
    ];

    const handleNavClick = (item) => {
        if (item.path) {
            window.location.href = item.path;
        } else {
            setActiveDropdown(activeDropdown === item.id ? null : item.id);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        sessionStorage.clear();
        window.location.href = '/login';
    };

    return (
        <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm z-50 flex items-center justify-between px-6 h-20 transition-all duration-300">
            {/* Logo Section */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.href = '/dashboard'}>
                <div className="w-10 h-10 bg-[var(--color-brand-primary)] rounded-[14px] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <span className="text-white font-black text-sm tracking-tighter">HV</span>
                </div>
                <span className="font-black text-xl text-[var(--color-brand-dark)] tracking-tight">HoraVlep</span>
            </div>

            {/* Center Navigation Icons (Inline Expand) */}
            <nav ref={navRef} className="flex items-center gap-2 transition-all duration-500 ease-out">
                {navItems.map((item) => {
                    const isExpanded = activeDropdown === item.id;
                    const isChildActive = item.dropdownItems?.some(child => currentPath.startsWith(child.path) || currentPath === child.path);
                    const isMainActive = currentPath === item.path;
                    const isActive = isMainActive || isChildActive;

                    if (isExpanded && item.dropdownItems) {
                        // RENDERIZADO EXPANDIDO EN LÍNEA (PASTILLA HORIZONTAL OSCURA)
                        return (
                            <div key={item.id} className="flex items-center bg-[var(--color-brand-dark)] rounded-full p-1 shadow-lg animate-[fadeIn_0.3s_ease-out_forwards] gap-1.5">
                                {/* Botón Principal Activo (Solo Icono) */}
                                <button
                                    onClick={() => handleNavClick(item)}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[var(--color-brand-dark)] shadow-sm transition-transform cursor-pointer hover:scale-105 shrink-0"
                                    title={`Cerrar ${item.label}`}
                                >
                                    {item.icon}
                                </button>

                                {/* Sub-enlaces en línea */}
                                <div className="flex items-center gap-1.5 pl-0.5 pr-2">
                                    {item.dropdownItems.map((child, idx) => {
                                        const isSubActive = currentPath.startsWith(child.path) || currentPath === child.path;
                                        return (
                                            <a
                                                key={idx}
                                                href={child.locked ? '#' : child.path}
                                                onClick={e => { if(child.locked) e.preventDefault(); }}
                                                className={`relative group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-[13px] font-bold ${
                                                    child.locked
                                                        ? 'opacity-50 cursor-not-allowed bg-transparent text-white/40'
                                                        : isSubActive
                                                            ? 'bg-white/20 text-white shadow-md border border-white/10'
                                                            : 'text-white/70 hover:bg-white/10 hover:text-white cursor-pointer'
                                                }`}
                                            >
                                                {child.icon}
                                                <span>{child.label}</span>

                                                {/* Tooltip de Bloqueo */}
                                                {child.locked && (
                                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white text-[var(--color-brand-dark)] text-[11px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none z-50">
                                                        🔒 {child.lockMsg}
                                                    </div>
                                                )}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }

                    // RENDERIZADO NORMAL (BOTONES SUELTOS)
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item)}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 font-bold text-[14px] cursor-pointer ${
                                isActive 
                                    ? 'bg-[var(--color-brand-dark)] text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Right Section (Profile / Logout) */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold border border-gray-200">
                    U
                </div>
                <button
                    onClick={handleLogout}
                    className="w-10 h-10 flex items-center justify-center rounded-[14px] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                    title="Cerrar Sesión"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
            </div>
        </header>
    );
}

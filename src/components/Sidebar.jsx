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
    const [toastMsg, setToastMsg] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPath(window.location.pathname.replace(/\/$/, ""));
        }

        const fetchCounts = async () => {
            try {
                const [areasRes, cursosRes] = await Promise.all([
                    fetch(`${API_BASE}/areas`),
                    fetch(`${API_BASE}/cursos`)
                ]);

                if (areasRes.ok) {
                    const areas = await areasRes.json();
                    setAreasCount(areas.length);
                }
                if (cursosRes.ok) {
                    const cursos = await cursosRes.json();
                    setCursosCount(cursos.length);
                }
            } catch (err) {
                console.error("Error fetching access counts:", err);
            }
        };

        fetchCounts();

        // Escuchar actualizaciones globales para refrescar los contadores dinámicamente
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

    // Estilos para el elemento activo (efecto GoDoc+)
    const activeItemStyle = {
        backgroundColor: '#fff',
        color: currentPath.startsWith('/cursos') ? 'var(--color-hx-purple)' : 'var(--color-hx-blue)',
        borderTopLeftRadius: '32px',
        borderBottomLeftRadius: '32px',
        position: 'relative',
        fontWeight: 'bold',
        marginLeft: '12px',
        paddingRight: '12px'
    };

    const inactiveItemStyle = {
        color: '#fff',
        fontWeight: '600',
        marginLeft: '12px',
        paddingRight: '12px',
        transition: 'all 0.3s ease'
    };

    // Renderizador de un ítem del menú
    const MenuItem = ({ path, label, icon, isLocked, lockMsg }) => {
        const isActive = path === '/dashboard'
            ? (currentPath === '' || currentPath === '/' || currentPath === '/dashboard')
            : currentPath.startsWith(path);

        return (
            <li className="relative mb-2">
                <a
                    href={path}
                    onClick={(e) => handleNavigation(e, path, isLocked, lockMsg)}
                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer group`}
                    style={isActive ? activeItemStyle : inactiveItemStyle}
                    onMouseEnter={(e) => {
                        if (!isActive && !isLocked) e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive && !isLocked) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                    }}
                >
                    {/* Pseudo-elementos para el efecto Cutout del ítem activo */}
                    {isActive && (
                        <>
                            <div style={{
                                position: 'absolute', top: '-32px', right: 0, width: '32px', height: '32px',
                                backgroundColor: 'transparent', borderBottomRightRadius: '32px',
                                boxShadow: '16px 16px 0 16px #fff', pointerEvents: 'none'
                            }}></div>
                            <div style={{
                                position: 'absolute', bottom: '-32px', right: 0, width: '32px', height: '32px',
                                backgroundColor: 'transparent', borderTopRightRadius: '32px',
                                boxShadow: '16px -16px 0 16px #fff', pointerEvents: 'none'
                            }}></div>
                        </>
                    )}

                    <div className={`flex items-center justify-center ${isLocked ? 'opacity-50' : ''}`}>
                        {icon}
                    </div>

                    <span className={`flex-1 ${isLocked ? 'opacity-50' : ''}`}>{label}</span>

                    {isLocked && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-50 ml-auto">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    )}
                </a>
            </li>
        );
    };

    return (
        <aside
            className="w-64 flex flex-col justify-between fixed h-screen top-0 left-0 z-50 overflow-hidden shadow-2xl transition-colors duration-500"
            style={{ backgroundColor: currentPath.startsWith('/cursos') ? 'var(--color-hx-purple)' : 'var(--color-hx-blue)' }}
        >
            <div className="pt-6 pb-4">
                {/* Logo */}
                <div className="px-8 mb-10 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-hx-blue font-black text-xl shadow-md">
                        H
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
                        HorariX
                    </h1>
                </div>

                {/* Menú */}
                <ul className="flex flex-col relative">
                    <MenuItem
                        path="/dashboard"
                        label="Inicio"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>}
                    />

                    <MenuItem
                        path="/areas"
                        label="Áreas Académicas"
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}
                    />

                    <MenuItem
                        path="/cursos"
                        label="Cursos"
                        isLocked={areasCount === 0}
                        lockMsg="Debes registrar al menos un Área primero."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>}
                    />

                    <MenuItem
                        path="/profesores"
                        label="Docentes"
                        isLocked={cursosCount === 0}
                        lockMsg="Debes registrar al menos un Curso primero."
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                    />


                </ul>
            </div>

            <div className="p-6">
                <button
                    onClick={() => {
                        localStorage.removeItem('user');
                        sessionStorage.clear();
                        window.location.href = '/login';
                    }}
                    className="flex items-center gap-3 text-white/80 font-bold px-4 py-3 hover:bg-white/10 hover:text-white rounded-xl transition-all outline-none w-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Cerrar Sesión
                </button>
            </div>

            {/* Toast Flotante */}
            {toastMsg && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[220px] bg-red-500 text-white text-xs font-bold px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-slide-up z-50">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    {toastMsg}
                </div>
            )}
        </aside>
    );
}

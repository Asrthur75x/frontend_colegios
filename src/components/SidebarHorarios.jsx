import React, { useState, useEffect } from 'react';

export default function SidebarHorarios({ currentPath: initialPath = '' }) {
    const [currentPath, setCurrentPath] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.location.pathname.replace(/\/$/, "");
        }
        return initialPath.replace(/\/$/, "");
    });

    useEffect(() => {
        const updatePath = () => {
            setCurrentPath(window.location.pathname.replace(/\/$/, ""));
        };
        updatePath();
        
        document.addEventListener('astro:page-load', updatePath);
        return () => {
            document.removeEventListener('astro:page-load', updatePath);
        };
    }, []);

    const activeItemStyle = {
        backgroundColor: '#fff',
        color: 'var(--color-hx-purple)',
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

    const MenuItem = ({ path, label, icon }) => {
        const isActive = path === '/horarios' ? currentPath === '/horarios' : currentPath.startsWith(path);

        return (
            <li className="relative mb-1">
                <a
                    href={path}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                    style={isActive ? activeItemStyle : inactiveItemStyle}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                >
                    {/* Cutout corners cuando activo */}
                    {isActive && (
                        <>
                            <div style={{ position: 'absolute', top: '-32px', right: 0, width: '32px', height: '32px', backgroundColor: 'transparent', borderBottomRightRadius: '32px', boxShadow: '16px 16px 0 16px #fff', pointerEvents: 'none' }}></div>
                            <div style={{ position: 'absolute', bottom: '-32px', right: 0, width: '32px', height: '32px', backgroundColor: 'transparent', borderTopRightRadius: '32px', boxShadow: '16px -16px 0 16px #fff', pointerEvents: 'none' }}></div>
                        </>
                    )}
                    <div className="flex items-center justify-center flex-shrink-0">
                        {icon}
                    </div>
                    <span className="flex-1 text-[13px]">{label}</span>
                </a>
            </li>
        );
    };

    return (
        <aside
            className="w-64 flex flex-col justify-between fixed h-screen top-0 left-0 z-50 overflow-hidden shadow-2xl transition-colors"
            style={{ backgroundColor: 'var(--color-hx-purple)' }}
        >
            <div className="pt-6 pb-4 flex flex-col h-full overflow-y-auto">
                {/* Logo */}
                <div className="px-8 mb-8 flex items-center gap-3 flex-shrink-0">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-xl shadow-md" style={{ color: 'var(--color-hx-purple)' }}>H</div>
                    <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">HorariX</h1>
                </div>



                {/* Menú de Horarios */}
                <ul className="flex flex-col relative flex-shrink-0">
                    <MenuItem
                        path="/horarios"
                        label="Horarios por Secciones"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                        }
                    />
                    <MenuItem
                        path="/horarios/editar"
                        label="Edición de Horarios"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        }
                    />
                    <MenuItem
                        path="/horarios/profesores"
                        label="Horarios por Profesores"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        }
                    />
                    <MenuItem
                        path="/horarios/versiones"
                        label="Historial de Versiones"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 4v6h6"/>
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                                <path d="M12 7v5l4 2"/>
                            </svg>
                        }
                    />
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
        </aside>
    );
}

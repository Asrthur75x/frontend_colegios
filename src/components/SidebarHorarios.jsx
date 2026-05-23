import React, { useState, useEffect } from 'react';

export default function SidebarHorarios() {
    const [currentPath, setCurrentPath] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.location.pathname.replace(/\/$/, "");
        }
        return '/horarios';
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPath(window.location.pathname.replace(/\/$/, ""));
        }
    }, []);

    const activeItemStyle = {
        backgroundColor: '#fff',
        color: 'var(--color-hx-red)',
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
        const isActive = currentPath.startsWith(path);

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
            className="w-64 flex flex-col justify-between fixed h-screen top-0 left-0 z-50 overflow-hidden shadow-2xl"
            style={{ backgroundColor: 'var(--color-hx-red)' }}
        >
            <div className="pt-6 pb-4 flex flex-col h-full overflow-y-auto">
                {/* Logo */}
                <div className="px-8 mb-8 flex items-center gap-3 flex-shrink-0">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-xl shadow-md" style={{ color: 'var(--color-hx-red)' }}>H</div>
                    <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">HorariX</h1>
                </div>

                {/* Etiqueta de módulo */}
                <div className="px-8 mb-3 flex-shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        Centro de Horarios
                    </p>
                </div>

                {/* Menú de Horarios */}
                <ul className="flex flex-col relative flex-shrink-0">
                    <MenuItem
                        path="/horarios"
                        label="Generar Horario"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
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

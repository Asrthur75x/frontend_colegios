import React, { useState, useEffect } from 'react';

export default function Login() {
    const [email, setEmail] = useState('admin@colegio.com');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Cuando React hidrata, hacer visible el componente con fade-in suave
        const t = setTimeout(() => setMounted(true), 30);
        return () => clearTimeout(t);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Error de autenticación');
            }

            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data.user));
            setIsExiting(true);

            // Verificar si el setup ya fue completado
            let destino = '/setup';
            try {
                const stRes = await fetch('http://127.0.0.1:8000/api/seccion-turno');
                if (stRes.ok) {
                    const stData = await stRes.json();
                    if (stData.length > 0) {
                        destino = '/dashboard';
                    }
                }
            } catch (_) { /* Si falla, ir al setup por defecto */ }

            setTimeout(() => { window.location.href = destino; }, 700);

        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        // visibility:hidden hasta que React monta => elimina el flash de íconos gigantes
        <div
            className="flex w-full bg-slate-50 overflow-hidden font-sans"
            style={{
                height: '100vh',
                opacity: mounted ? 1 : 0,
                visibility: mounted ? 'visible' : 'hidden',
                transition: mounted ? 'opacity 0.35s ease' : 'none',
            }}
        >
            {/* ===== LEFT PANEL ===== */}
            <div
                className="hidden lg:flex bg-hx-purple relative flex-col justify-center items-center z-10 shadow-2xl"
                style={{
                    width: '35%',
                    flexShrink: 0,
                    transform: isExiting ? 'translateX(-110%)' : 'translateX(0)',
                    transition: 'transform 0.7s ease-in-out',
                }}
            >
                {/* SVG Onda Vertical — inline styles para no depender de Tailwind */}
                <div style={{
                    position: 'absolute', top: 0, right: -149,
                    height: '100%', width: 150,
                    overflow: 'hidden', pointerEvents: 'none',
                }}>
                    <svg viewBox="0 0 100 1000" preserveAspectRatio="none"
                        style={{ width: '100%', height: '100%', fill: 'var(--color-hx-purple)', display: 'block' }}>
                        <path d="M0,0 L0,1000 L20,1000 C150,750 -50,250 20,0 Z"></path>
                    </svg>
                </div>

                {/* Texto HORARIX vertical decorativo */}
                <div style={{
                    position: 'absolute', left: 40,
                    top: '65%', transform: 'translateY(-50%) rotate(-90deg)',
                    transformOrigin: 'left center',
                    fontSize: 100, fontWeight: 900,
                    color: 'white', opacity: 0.15,
                    letterSpacing: '0.15em', whiteSpace: 'nowrap',
                    pointerEvents: 'none', userSelect: 'none',
                }}>
                    HORARIX
                </div>

                <div className="relative z-10 p-12 w-full flex flex-col items-center">
                    {/* Logo Abstracto Moderno */}
                    <div className="w-24 h-24 mb-12 flex items-center justify-center relative group">
                        {/* Glowing backdrop */}
                        <div className="absolute inset-0 bg-white/10 rounded-full blur-xl group-hover:bg-white/20 transition-all duration-700"></div>
                        
                        {/* Core geometric shape */}
                        <div className="relative w-16 h-16 rounded-[14px] border-[3px] border-white/80 rotate-45 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:rotate-180 transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                            <div className="w-5 h-5 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.9)] animate-pulse"></div>
                        </div>
                    </div>

                    {/* Decoración circular con orbitales */}
                    <div style={{ position: 'relative', width: 256, height: 256 }}>
                        <div style={{
                            width: '100%', height: '100%',
                            border: '4px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: 16,
                        }}>
                            <div className="w-full h-full border-[2px] border-white/40 rounded-full flex items-center justify-center relative animate-[spin_30s_linear_infinite]">
                                <div className="absolute top-0 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                                <div style={{ position: 'absolute', bottom: 0, width: 14, height: 14, borderRadius: '50%', background: '#790EEC', boxShadow: '0 0 10px #790EEC' }} />
                                <div style={{ position: 'absolute', left: 0, width: 10, height: 10, borderRadius: '50%', background: '#F1A5B9', boxShadow: '0 0 8px #F1A5B9' }} />
                                <div style={{ position: 'absolute', right: 0, width: 10, height: 10, borderRadius: '50%', background: '#F3C252', boxShadow: '0 0 8px #F3C252' }} />
                            </div>
                        </div>
                        {/* Ícono centrado */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="96" height="96" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 0.9 }}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                    </div>

                    <p style={{
                        color: 'white', marginTop: 64,
                        fontSize: 17, letterSpacing: '0.2em',
                        fontWeight: 800, opacity: 0.95,
                        textAlign: 'center', textTransform: 'uppercase',
                    }}>
                        PLATAFORMA HORARIX
                    </p>
                    <p style={{
                        color: 'rgba(255,255,255,0.7)', marginTop: 10,
                        fontSize: 15, letterSpacing: '0.03em',
                        fontWeight: 500, textAlign: 'center',
                    }}>
                        Gestión de horarios académicos
                    </p>
                </div>
            </div>

            {/* ===== RIGHT PANEL - Formulario ===== */}
            <div
                className="flex-1 flex flex-col justify-center items-center bg-white relative z-0"
                style={{
                    transform: isExiting ? 'translateX(110%)' : 'translateX(0)',
                    transition: 'transform 0.7s ease-in-out',
                    overflow: 'hidden',
                }}
            >
                {/* Blobs de color en el panel derecho */}
                <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: 260, height: 260, background: '#790EEC', opacity: 0.10, borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: 240, height: 240, background: '#F3C252', opacity: 0.13, borderRadius: '50%', filter: 'blur(55px)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '30%', right: '-30px', width: 180, height: 180, background: '#F1A5B9', opacity: 0.12, borderRadius: '50%', filter: 'blur(50px)', pointerEvents: 'none' }} />
                <div style={{ width: '100%', maxWidth: 380, padding: '0 32px' }}>
                    <h2 className="text-4xl font-extrabold text-hx-purple mb-12 text-center tracking-tight">
                        INICIAR SESIÓN
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-8">
                        {/* Correo */}
                        <div>
                            <label className="block text-[11px] font-bold text-hx-purple uppercase tracking-widest mb-1 opacity-80">
                                Correo Electrónico
                            </label>
                            <div className="flex items-center border-b-[3px] border-slate-100 py-2 focus-within:border-hx-purple transition-colors">
                                <input
                                    type="email"
                                    className="appearance-none bg-transparent border-none w-full text-slate-800 mr-3 py-1 px-2 leading-tight focus:outline-none font-bold text-lg"
                                    placeholder="admin@colegio.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <svg width="20" height="20" fill="none" stroke="var(--color-hx-purple)" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className="block text-[11px] font-bold text-hx-purple uppercase tracking-widest mb-1 opacity-80">
                                Contraseña
                            </label>
                            <div className="flex items-center border-b-[3px] border-slate-100 py-2 focus-within:border-hx-purple transition-colors">
                                <input
                                    type="password"
                                    className="appearance-none bg-transparent border-none w-full text-slate-800 mr-3 py-1 px-2 leading-tight focus:outline-none font-bold text-lg tracking-widest"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <svg width="20" height="20" fill="none" stroke="var(--color-hx-purple)" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-3 rounded-xl border border-red-100">
                                {error}
                            </p>
                        )}

                        <div className="pt-8">
                            <button
                                type="submit"
                                disabled={isLoading || isExiting}
                                style={{
                                    width: '100%',
                                    background: (isLoading || isExiting) ? 'rgba(121,14,236,0.5)' : 'var(--color-hx-purple)',
                                    borderRadius: 9999,
                                    padding: '16px 32px',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: 18,
                                    border: 'none',
                                    cursor: (isLoading || isExiting) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 10px 30px -10px rgba(121,14,236,0.5)',
                                }}
                            >
                                {isLoading ? 'CARGANDO...' : isExiting ? 'ENTRANDO...' : 'Entrar'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';

export default function Login() {
    const [email, setEmail] = useState('admin@colegio.com');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
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

            let destino = '/setup';
            try {
                const stRes = await fetch('http://127.0.0.1:8000/api/seccion-turno');
                if (stRes.ok) {
                    const stData = await stRes.json();
                    if (stData.length > 0) {
                        destino = '/dashboard';
                    }
                }
            } catch (_) { }

            setTimeout(() => { window.location.href = destino; }, 500);

        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div
            className="w-full h-screen font-sans flex transition-opacity duration-500 bg-[var(--color-brand-light)]"
            style={{ opacity: mounted ? 1 : 0 }}
        >
            {/* ====== Left Panel: Form ====== */}
            <div className="w-full lg:w-[45%] h-full flex flex-col justify-center px-8 sm:px-12 md:px-16 lg:px-24 relative z-10">

                {/* Branding Top Left */}
                <div className="absolute top-10 left-8 sm:left-12 lg:left-24 flex items-center gap-2">
                    <span className="text-2xl font-black tracking-wide text-[var(--color-brand-primary)]">PlanificaPro!</span>
                </div>

                <div className="w-full max-w-sm mx-auto">
                    <div className="flex justify-between items-end mb-2">
                        <h2 className="text-[28px] font-extrabold text-[var(--color-brand-black)] tracking-tight">
                            Iniciar Sesión
                        </h2>
                    </div>
                    <p className="text-[14px] text-slate-500 font-medium mb-8">
                        Ingresa tus credenciales para acceder a la plataforma.
                    </p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-[13px] font-bold text-slate-700 uppercase tracking-widest">Correo Electrónico</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3.5 bg-white border border-slate-200 text-[var(--color-brand-black)] placeholder:text-slate-400 font-medium text-[15px] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
                                placeholder="Ingresa tu correo"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2 relative">
                            <label className="block text-[13px] font-bold text-slate-700 uppercase tracking-widest">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 text-[var(--color-brand-black)] placeholder:text-slate-400 font-medium text-[15px] focus:outline-none focus:border-[var(--color-brand-primary)] transition-colors"
                                    placeholder="Ingresa tu contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        {showPassword ? (
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z" />
                                        ) : (
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-3 border border-red-100">
                                {error}
                            </p>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)] text-white font-bold text-[14px] tracking-widest uppercase transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-[var(--color-brand-primary)]/20 cursor-pointer"
                            >
                                {isLoading ? 'CARGANDO...' : 'INICIAR SESIÓN'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer Copyright */}
                <div className="absolute bottom-10 left-8 sm:left-12 lg:left-24">
                    <p className="text-[13px] text-slate-400 font-medium">
                        © 2026 PlanificaPro. Todos los derechos reservados
                    </p>
                </div>
            </div>

            {/* ====== Right Panel: Decorative Blue Area ====== */}
            <div className="hidden lg:flex flex-1 relative bg-[var(--color-brand-dark)] p-12 lg:p-16 xl:p-20 items-center justify-center overflow-hidden">

                {/* Background Decor */}
                <div className="absolute inset-0 pointer-events-none">
                    <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '80%', height: '80%', borderRadius: '50%', border: '40px solid rgba(255,255,255,0.05)', opacity: 0.8 }}></div>
                    <div style={{ position: 'absolute', bottom: '-40%', left: '-20%', width: '100%', height: '100%', borderRadius: '50%', border: '40px solid rgba(255,255,255,0.05)', opacity: 0.5 }}></div>
                </div>

                {/* Glass/Border Card */}
                <div className="relative w-full h-full max-h-[850px] border border-white/20 rounded-[2rem] p-12 flex flex-col justify-between overflow-hidden shadow-2xl bg-white/5">

                    {/* Glowing dot like in the image */}
                    <div className="absolute top-[30%] left-[30%] w-16 h-16 bg-orange-400 rounded-full filter blur-xl opacity-60 mix-blend-screen pointer-events-none"></div>

                    <div className="relative z-10 pt-4 flex-1 flex flex-col justify-center">
                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-medium text-white leading-[1.2] mb-6">
                            Bienvenido a <br /><span className="font-extrabold">PlanificaPro</span>
                        </h1>
                        <p className="text-xl text-white/80 font-light leading-relaxed max-w-lg">
                            Organiza, distribuye y optimiza el tiempo de tu institución en segundos sin conflictos ni dolores de cabeza.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

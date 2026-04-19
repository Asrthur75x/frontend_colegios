import React from 'react';

export default function DashboardManager() {
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateString = today.toLocaleDateString('es-ES', options);

    return (
        <div className="w-full max-w-[1400px] mx-auto animate-fade-in pb-10">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">

                {/* LEFT COLUMN - STATS (Like Course Activity) */}
                <div className="xl:col-span-4 flex flex-col gap-5">
                    <div className="flex items-center justify-between mb-1 px-1">
                        <div>
                            <h1 className="text-[36px] font-extrabold text-[#111827] tracking-tight leading-tight">
                                Vista General
                            </h1>
                            <p className="text-[#1A5AD7] font-bold text-sm mt-0.5 capitalize">
                                {dateString}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1 text-sm text-slate-400 font-bold mt-2 mb-1">
                        <span className="text-[#64748B]">Métricas</span>
                    </div>

                    <div className="space-y-4">
                        {/* Profesores Card */}
                        <div className="p-6 rounded-[24px] bg-[#1A5AD7] text-white shadow-[0_10px_20px_-8px_rgba(26,90,215,0.4)] relative overflow-hidden">
                            {/* Decorative background circle */}
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-[0.07] rounded-full"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="text-white opacity-90 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">Profesores</h3>
                                        <p className="text-blue-100 text-xs mt-1.5 opacity-80 max-w-[140px] leading-relaxed">Docentes para asignación de horarios</p>
                                    </div>
                                </div>
                                <div className="bg-white text-[#1A5AD7] flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded-2xl shadow-sm">
                                    <span className="font-black text-xl leading-none">42</span>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center text-xs font-semibold text-blue-100 opacity-80 uppercase tracking-widest">
                                <span>Total Registrados</span>
                            </div>
                        </div>

                        {/* Cursos Card */}
                        <div className="p-6 rounded-[24px] bg-[#C154FF] text-white shadow-[0_10px_20px_-8px_rgba(193,84,255,0.4)] relative overflow-hidden">
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white opacity-[0.07] rounded-full"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="text-white opacity-90 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">Cursos</h3>
                                        <p className="text-purple-100 text-xs mt-1.5 opacity-80 max-w-[140px] leading-relaxed">Materias y asignaturas a programar</p>
                                    </div>
                                </div>
                                <div className="bg-white text-[#b541f5] flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded-2xl shadow-sm">
                                    <span className="font-black text-xl leading-none">128</span>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center text-xs font-semibold text-purple-100 opacity-80 uppercase tracking-widest">
                                <span>Total Registrados</span>
                            </div>
                        </div>

                        {/* Aulas Card */}
                        <div className="p-6 rounded-[24px] bg-[#FFC52E] text-white shadow-[0_10px_20px_-8px_rgba(255,197,46,0.4)] relative overflow-hidden">
                            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white opacity-[0.07] rounded-full"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="text-white opacity-90 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" /><path d="M2 20h20" /><path d="M14 12v.01" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight text-[#8c6b1a]">Aulas</h3>
                                        <p className="text-[#a68228] text-xs mt-1.5 opacity-80 max-w-[140px] leading-relaxed">Salones y ambientes físicos de estudio</p>
                                    </div>
                                </div>
                                <div className="bg-white text-[#d49e15] flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded-2xl shadow-sm">
                                    <span className="font-black text-xl leading-none">15</span>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center text-xs font-semibold text-[#8a6a1a] opacity-80 uppercase tracking-widest">
                                <span>Total Registradas</span>
                            </div>
                        </div>

                        {/* Grados Card */}
                        <div className="p-6 rounded-[24px] bg-[#FF6A6A] text-white shadow-[0_10px_20px_-8px_rgba(255,106,106,0.4)] relative overflow-hidden">
                            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white opacity-[0.07] rounded-full"></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="text-white opacity-90 mt-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight text-[#7a2f2f]">Grados</h3>
                                        <p className="text-[#ffd6d6] text-xs mt-1.5 opacity-80 max-w-[140px] leading-relaxed">Niveles educativos de la institución</p>
                                    </div>
                                </div>
                                <div className="bg-white text-[#ed5a5a] flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded-2xl shadow-sm">
                                    <span className="font-black text-xl leading-none">5</span>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center text-xs font-semibold text-[#7a2f2f] opacity-80 uppercase tracking-widest">
                                <span>Total Registrados</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="xl:col-span-8 flex flex-col pt-1 pl-0 xl:pl-4">

                    {/* Acciones Rápidas (Grid 2x2) */}
                    <div className="mb-10 px-2 xl:px-0">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-[#111827] tracking-wide">Accesos directos</h2>
                            <p className="text-xs font-bold text-[#1A5AD7] bg-[#1A5AD7]/10 px-3 py-1 rounded-full uppercase tracking-wider">Gestión</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Action 1 */}
                            <a href="/configuracion" className="group bg-white p-7 rounded-3xl border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#FF4757]/30 transition-all hover:-translate-y-1">
                                <div className="w-[56px] h-[56px] rounded-2xl bg-[#FF4757]/10 flex items-center justify-center text-[#FF4757] mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#111827] text-[15px] group-hover:text-[#FF4757] transition-colors mb-1">Configuración General</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">Parámetros del sistema y restricciones globales.</p>
                                </div>
                            </a>

                            {/* Action 2 */}
                            <a href="/exportar" className="group bg-white p-7 rounded-3xl border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#1A5AD7]/30 transition-all hover:-translate-y-1">
                                <div className="w-[56px] h-[56px] rounded-2xl bg-[#1A5AD7]/10 flex items-center justify-center text-[#1A5AD7] mb-5 group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#111827] text-[15px] group-hover:text-[#1A5AD7] transition-colors mb-1">Exportar Reportes</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">Descargar horarios en formato PDF y listados.</p>
                                </div>
                            </a>

                            {/* Action 3 */}
                            <a href="/profesores" className="group bg-white p-7 rounded-3xl border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#C154FF]/30 transition-all hover:-translate-y-1">
                                <div className="w-[56px] h-[56px] rounded-2xl bg-[#C154FF]/10 flex items-center justify-center text-[#C154FF] mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#111827] text-[15px] group-hover:text-[#C154FF] transition-colors mb-1">Personal Docente</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">Gestión de profesores locales y sus disponibilidades.</p>
                                </div>
                            </a>

                            {/* Action 4 */}
                            <a href="/cursos" className="group bg-white p-7 rounded-3xl border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-[#FFC52E]/40 transition-all hover:-translate-y-1">
                                <div className="w-[56px] h-[56px] rounded-2xl bg-[#FFC52E]/10 flex items-center justify-center text-[#d49e15] mb-5 group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M12 11v6" /><path d="M9 14h6" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#111827] text-[15px] group-hover:text-[#d49e15] transition-colors mb-1">Catálogo de Cursos</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">Registro de asignaturas y cargas horarias de materias.</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Actividad Reciente block */}
                    <div className="flex-1 bg-white rounded-[32px] border border-slate-100 p-8 pt-7 shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative overflow-hidden">

                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] opacity-50 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-8 pb-4 relative z-10">
                            <h2 className="text-xl font-extrabold text-[#111827]">Actividad Reciente</h2>
                        </div>

                        <div className="space-y-6 relative z-10 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-100/80">

                            <div className="relative flex items-start gap-5 group">
                                <div className="absolute w-6 h-6 bg-white rounded-full flex justify-center items-center -left-0 border-[3px] border-white shadow-sm z-10 group-hover:scale-125 transition-transform">
                                    <div className="w-2.5 h-2.5 bg-[#1A5AD7] rounded-full"></div>
                                </div>
                                <div className="ml-10 bg-slate-50/80 rounded-2xl p-5 flex-1 border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-[#1A5AD7]/20 transition-colors shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                                        <h4 className="text-[15px] font-bold text-[#111827]">Nuevo profesor registrado</h4>
                                        <span className="text-[10px] font-bold text-[#1A5AD7] bg-[#1A5AD7]/10 px-2 py-1 rounded text-center tracking-widest">2 HORAS</span>
                                    </div>
                                    <p className="text-[14px] text-slate-500">Ana Martínez fue añadida a la nómina del departamento de Ciencias.</p>
                                </div>
                            </div>

                            <div className="relative flex items-start gap-5 group">
                                <div className="absolute w-6 h-6 bg-white rounded-full flex justify-center items-center -left-0 border-[3px] border-white shadow-sm z-10 group-hover:scale-125 transition-transform">
                                    <div className="w-2.5 h-2.5 bg-[#2563EB] rounded-full"></div>
                                </div>
                                <div className="ml-10 bg-slate-50/80 rounded-2xl p-5 flex-1 border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-[#2563EB]/20 transition-colors shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                                        <h4 className="text-[15px] font-bold text-[#111827]">Aula en mantenimiento</h4>
                                        <span className="text-[10px] font-bold text-[#2563EB] bg-[#2563EB]/10 px-2 py-1 rounded text-center tracking-widest">AYER</span>
                                    </div>
                                    <p className="text-[14px] text-slate-500">El Laboratorio de Cómputo B fue inhabilitado temporalmente para los próximos 3 días.</p>
                                </div>
                            </div>

                            <div className="relative flex items-start gap-5 group">
                                <div className="absolute w-6 h-6 bg-white rounded-full flex justify-center items-center -left-0 border-[3px] border-white shadow-sm z-10 group-hover:scale-125 transition-transform">
                                    <div className="w-2.5 h-2.5 bg-[#60A5FA] rounded-full"></div>
                                </div>
                                <div className="ml-10 bg-slate-50/80 rounded-2xl p-5 flex-1 border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-[#60A5FA]/30 transition-colors shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                                        <h4 className="text-[15px] font-bold text-[#111827]">Horarios publicados</h4>
                                        <span className="text-[10px] font-bold text-[#60A5FA] bg-[#60A5FA]/10 px-2 py-1 rounded text-center tracking-widest">3 DÍAS</span>
                                    </div>
                                    <p className="text-[14px] text-slate-500">Se generaron de manera exitosa y publicaron los horarios correspondientes al Ciclo A.</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

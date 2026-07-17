import React from 'react';

const ModuleSidebar = ({
    title,
    description,
    onAddClick,
    addButtonText,
    svgImage,
    tipText,
    stats,
}) => {
    return (
        <aside className="md:w-1/4 flex-shrink-0 -mt-8">
            <div className="sticky top-8 flex flex-col gap-5">

                {/* Blue Header Card */}
                <div className="bg-[var(--color-brand-primary)]/10 rounded-[24px] p-6 shadow-md relative overflow-hidden border border-[var(--color-brand-primary)]/70 flex flex-col gap-2">
                    {/* Brillo de fondo */}
                    <div className="absolute inset-0 bg-white/40 rounded-full blur-2xl z-0"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-3">{title}</h2>
                        <p className="text-[13px] text-slate-600 font-medium leading-relaxed mb-6">
                            {description}
                        </p>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={onAddClick}
                        className="relative z-10 w-full bg-[var(--color-brand-dark)] hover:bg-[var(--color-brand-primary)] text-white font-bold py-3 px-4 rounded-[12px] shadow-[0_4px_12px_rgba(47,91,255,0.25)] hover:shadow-[0_6px_16px_rgba(47,91,255,0.35)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 text-[13px] cursor-pointer"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        {addButtonText}
                    </button>

                    {/* Imagen SVG */}
                    {svgImage && (
                        <div className="relative z-10 flex items-center justify-center mt-6 h-36">
                            <img
                                src={svgImage}
                                alt="Ilustración"
                                className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)] hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    )}
                </div>

                {/* Tip */}
                {tipText && (
                    <div className="bg-amber-50 rounded-[16px] p-5 border border-amber-100/60 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <div className="text-amber-500 bg-white p-2 rounded-lg shadow-sm border border-amber-100 flex-shrink-0">
                                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
                            <p className="text-amber-800 text-sm font-black">Un buen tip</p>
                        </div>
                        <p className="text-amber-700/90 text-[13px] font-semibold leading-relaxed">
                            {tipText}
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default ModuleSidebar;

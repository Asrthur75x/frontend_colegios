import React, { useState, useEffect } from 'react';
import Paso1Institucion from './Steps/Paso1Institucion';

export default function SetupWizard() {
    const [step, setStep] = useState(1);
    const [wizardData, setWizardData] = useState({
        colegio: { nombre: '' },
        sede: { nombre_sede: '' },
        turnos: []
    });

    const [isSaving, setIsSaving] = useState(false);
    // mounted: controla el FOUC (flash de contenido sin estilos)
    const [mounted, setMounted] = useState(false);
    // entered: controla la animación de entrada (paneles deslizándose desde los costados)
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        // Paso 1: hacemos visible el componente (evita flash de íconos gigantes)
        const t1 = setTimeout(() => setMounted(true), 30);
        // Paso 2: disparamos la animación de entrada (paneles entran desde los costados)
        const t2 = setTimeout(() => setEntered(true), 60);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const saveStep1Data = async () => {
        setIsSaving(true);
        try {
            let colResponse = await fetch('http://127.0.0.1:8000/api/colegio');
            let colegios = await colResponse.json();
            let colId = 1;

            if (colegios.length > 0) {
                colId = colegios[0].id_colegio;
                await fetch(`http://127.0.0.1:8000/api/colegio/${colId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre_colegio: wizardData.colegio.nombre })
                });
            }

            if (wizardData.sede.nombre_sede) {
                await fetch('http://127.0.0.1:8000/api/sedes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre_sede: wizardData.sede.nombre_sede, id_colegio: colId })
                });
            }

            for (let t of wizardData.turnos) {
                await fetch('http://127.0.0.1:8000/api/turnos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: t })
                });
            }

            setStep(prev => prev + 1);
        } catch (error) {
            console.error("Error al guardar en el backend:", error);
            setStep(prev => prev + 1);
        } finally {
            setIsSaving(false);
        }
    };

    const handleNext = () => {
        if (step === 1) saveStep1Data();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        // Invisible hasta que React monta — mismo patrón que Login para evitar FOUC
        <div
            className="flex font-sans text-slate-800 overflow-hidden"
            style={{
                width: '100vw',
                height: '100vh',
                background: '#f8fafc',
                opacity: mounted ? 1 : 0,
                visibility: mounted ? 'visible' : 'hidden',
                transition: mounted ? 'opacity 0.35s ease' : 'none',
            }}
        >
            {/* ===== LEFT PANEL - Morado ===== */}
            <div
                className="hidden lg:flex flex-col justify-between relative z-10"
                style={{
                    width: '35%',
                    flexShrink: 0,
                    background: '#790EEC', // Solid color to seamlessly match the wave
                    padding: '48px',
                    // Entra desde la izquierda
                    transform: entered ? 'translateX(0)' : 'translateX(-110%)',
                    transition: 'transform 0.7s ease-in-out',
                }}
            >
                {/* SVG Onda Vertical — inline para no depender de Tailwind */}
                <div style={{
                    position: 'absolute', top: 0, right: -150,
                    height: '100%', width: 152,
                    overflow: 'hidden', pointerEvents: 'none',
                }}>
                    <svg viewBox="0 0 100 1000" preserveAspectRatio="none"
                        style={{ width: '100%', height: '100%', fill: '#790EEC', display: 'block' }}>
                        <path d="M0,0 L0,1000 L20,1000 C150,750 -50,250 20,0 Z"></path>
                    </svg>
                </div>

                {/* Blur circles decorativos */}
                <div style={{
                    position: 'absolute', top: '-10%', right: '-10%',
                    width: 256, height: 256,
                    background: '#F1A5B9', opacity: 0.2,
                    borderRadius: '50%', filter: 'blur(60px)',
                }}></div>
                <div style={{
                    position: 'absolute', top: '40%', left: '-20%',
                    width: 320, height: 320,
                    background: '#10CFAE', opacity: 0.2,
                    borderRadius: '50%', filter: 'blur(60px)',
                }}></div>

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-[#790EEC] text-xl shadow-lg">
                        Hx
                    </div>
                    <span className="text-white text-2xl font-bold tracking-tight">HorariX</span>
                </div>

                {/* Ilustración central */}
                <div className="relative z-10 flex flex-col items-center justify-center flex-grow mt-12">
                    <svg width="240" height="240" viewBox="0 0 240 240" fill="none"
                        className="mb-10 hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}>
                        <circle cx="120" cy="120" r="100" fill="#51B4E8" fillOpacity="0.2"/>
                        <path d="M120 40 L190 160 H50 Z" fill="#10CFAE" fillOpacity="0.9"/>
                        <rect x="90" y="100" width="60" height="60" rx="12" fill="#F3C252" fillOpacity="0.9"/>
                        <circle cx="140" cy="140" r="25" fill="#F1A5B9"/>
                    </svg>
                    <h2 style={{ color: 'white', fontSize: 32, fontWeight: 800, textAlign: 'center', marginBottom: 12 }}>
                        Comienza la Magia
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontSize: 16, maxWidth: 260, lineHeight: 1.6 }}>
                        Moldea la estructura de tu institución de forma rápida y sencilla.
                    </p>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, position: 'relative', zIndex: 10 }}>
                    © 2026 HorariX.
                </div>
            </div>

            {/* ===== RIGHT PANEL - Formulario ===== */}
            <div
                className="flex-1 flex flex-col items-center justify-center bg-white relative z-0 overflow-y-auto"
                style={{
                    // Entra desde la derecha
                    transform: entered ? 'translateX(0)' : 'translateX(110%)',
                    transition: 'transform 0.7s ease-in-out',
                }}
            >
                <div style={{
                    width: '100%', maxWidth: 600,
                    padding: '32px 64px 48px',
                    opacity: entered ? 1 : 0,
                    transition: 'opacity 0.3s ease 0.3s',
                }}>
                    {/* Indicador de paso */}
                    <div style={{
                        textAlign: 'center', fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.15em', color: '#790EEC',
                        textTransform: 'uppercase', marginBottom: 48, marginTop: 16,
                    }}>
                        PASO 1 DE 1 • DATOS INICIALES
                    </div>

                    <div className="flex-grow flex flex-col justify-center w-full">
                        {step === 1 && (
                            <Paso1Institucion
                                data={wizardData}
                                setData={setWizardData}
                            />
                        )}
                    </div>

                    {/* Botones de navegación */}
                    <div style={{ marginTop: 64, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: '100%', maxWidth: 400,
                            display: 'flex', gap: 16, marginBottom: 40,
                            justifyContent: step === 1 ? 'center' : 'space-between',
                        }}>
                            {step > 1 && (
                                <button
                                    onClick={handleBack}
                                    className="w-1/2 py-4 rounded-xl font-bold text-sm tracking-widest transition-all border-2 border-[#790EEC] text-[#790EEC] hover:bg-[#790EEC]/5"
                                >
                                    VOLVER
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                disabled={isSaving}
                                style={{
                                    width: step === 1 ? '100%' : '50%',
                                    background: isSaving ? 'rgba(121,14,236,0.5)' : '#790EEC',
                                    color: 'white', fontWeight: 700,
                                    padding: '16px 0', borderRadius: 12,
                                    fontSize: 13, letterSpacing: '0.1em',
                                    border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSaving ? 'none' : '0 8px 20px -6px rgba(121,14,236,0.5)',
                                }}
                            >
                                {isSaving ? 'GUARDANDO...' : (step === 1 ? 'EMPEZAR Y GUARDAR' : 'CONTINUAR')}
                            </button>
                        </div>

                        {/* Barra de progreso */}
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
                            1 DE 1
                        </div>
                        <div style={{ width: 192, height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '100%', background: '#51B4E8', borderRadius: 999, transition: 'width 0.5s ease' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

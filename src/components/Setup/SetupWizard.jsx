import React, { useState, useEffect } from 'react';
import Paso1Institucion from './Steps/Paso1Institucion';
import Paso2DiasGrados from './Steps/Paso2DiasGrados';
import Paso3GradoDiaConfig from './Steps/Paso3GradoDiaConfig';

const DEFAULT_DATA = {
    colegio: { nombre: '' },
    tipo_sede: null,
    numero_sedes: 1,
    sedes: [''],
    turnos: [],
    dias: [
        { id: 1, nombre: 'Lunes' },
        { id: 2, nombre: 'Martes' },
        { id: 3, nombre: 'Miércoles' },
        { id: 4, nombre: 'Jueves' },
        { id: 5, nombre: 'Viernes' }
    ],
    grados: [],
    gradoDiaConfig: null
};

function getSavedStep() {
    if (typeof window === 'undefined') return 1;
    try {
        const s = sessionStorage.getItem('horarix_wizard_step');
        return s ? parseInt(s, 10) : 1;
    } catch { return 1; }
}

function getSavedData() {
    if (typeof window === 'undefined') return DEFAULT_DATA;
    try {
        const d = sessionStorage.getItem('horarix_wizard_data');
        return d ? JSON.parse(d) : DEFAULT_DATA;
    } catch { return DEFAULT_DATA; }
}

function getSavedSteps() {
    if (typeof window === 'undefined') return [];
    try {
        const s = sessionStorage.getItem('horarix_wizard_saved_steps');
        return s ? JSON.parse(s) : [];
    } catch { return []; }
}

export default function SetupWizard() {
    const [step, setStep] = useState(1);
    const [wizardData, setWizardData] = useState(DEFAULT_DATA);
    const [savedSteps, setSavedSteps] = useState([]);
    const [dataLoaded, setDataLoaded] = useState(false); // guardia para no sobreescribir localStorage en el primer render
    const [errorMsg, setErrorMsg] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [entered, setEntered] = useState(false);

    // Cargar desde sessionStorage solo en el cliente (después de montar)
    useEffect(() => {
        // Limpiar claves viejas de localStorage (migración a sessionStorage)
        try {
            localStorage.removeItem('horarix_wizard_step');
            localStorage.removeItem('horarix_wizard_data');
            localStorage.removeItem('horarix_wizard_saved_steps');
        } catch (_) {}

        setStep(getSavedStep());
        setWizardData(getSavedData());
        setSavedSteps(getSavedSteps());
        setDataLoaded(true); // marcar que ya cargamos, ahora sí se puede persistir

        const t1 = setTimeout(() => setMounted(true), 30);
        const t2 = setTimeout(() => setEntered(true), 60);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    // Persistir en sessionStorage — solo DESPUÉS de que los datos hayan sido cargados
    useEffect(() => {
        if (!dataLoaded) return;
        if (typeof window === 'undefined') return;
        try {
            sessionStorage.setItem('horarix_wizard_step', step.toString());
            sessionStorage.setItem('horarix_wizard_data', JSON.stringify(wizardData));
            sessionStorage.setItem('horarix_wizard_saved_steps', JSON.stringify(savedSteps));
        } catch (e) {
            console.warn('No se pudo guardar en sessionStorage', e);
        }
    }, [step, wizardData, savedSteps, dataLoaded]);

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

            for (let sedeNombre of wizardData.sedes) {
                if (sedeNombre.trim()) {
                    await fetch('http://127.0.0.1:8000/api/sedes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre_sede: sedeNombre, id_colegio: colId })
                    });
                }
            }

            for (let t of wizardData.turnos) {
                await fetch('http://127.0.0.1:8000/api/turnos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre: t })
                });
            }

            setSavedSteps(prev => prev.includes(1) ? prev : [...prev, 1]);
            setStep(prev => prev + 1);
        } catch (error) {
            console.error("Error al guardar en el backend:", error);
            setStep(prev => prev + 1);
        } finally {
            setIsSaving(false);
        }
    };

    const saveStep2Data = async () => {
        setIsSaving(true);
        try {
            for (let d of wizardData.dias) {
                await fetch('http://127.0.0.1:8000/api/dias', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre_dia: d.nombre, orden: d.id })
                });
            }

            for (let g of wizardData.grados) {
                await fetch('http://127.0.0.1:8000/api/grados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ numero: g })
                });
            }

            setSavedSteps(prev => prev.includes(2) ? prev : [...prev, 2]);
            setStep(prev => prev + 1);
        } catch (error) {
            console.error("Error al guardar días y grados:", error);
            setErrorMsg("Hubo un error guardando los datos del paso 2.");
            setStep(prev => prev + 1);
        } finally {
            setIsSaving(false);
        }
    };

    const saveStep3Data = async () => {
        setIsSaving(true);
        try {
            const { gradoDiaConfig } = wizardData;
            for (const [key, bloques] of Object.entries(gradoDiaConfig)) {
                const [grado, diaId] = key.split('-');
                await fetch('http://127.0.0.1:8000/api/grado-dia-config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_grado: parseInt(grado),
                        id_dia: parseInt(diaId),
                        bloques_dia: bloques
                    })
                });
            }

            // Limpiar sessionStorage al terminar con éxito
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('horarix_wizard_step');
                sessionStorage.removeItem('horarix_wizard_data');
                sessionStorage.removeItem('horarix_wizard_saved_steps');
            }

            window.location.href = '/dashboard';
        } catch (error) {
            console.error("Error al guardar configuración de bloques:", error);
            setErrorMsg("Hubo un error guardando los datos del paso 3.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleNext = () => {
        if (step === 1) {
            setErrorMsg('');
            const { colegio, tipo_sede, sedes, turnos } = wizardData;

            if (!colegio.nombre.trim() ||
                tipo_sede === null ||
                !sedes ||
                sedes.length === 0 ||
                sedes.some(s => !s.trim()) ||
                turnos.length === 0) {
                setErrorMsg('Por favor, completa todos los campos obligatorios.');
                return;
            }

            // Si el paso 1 ya fue guardado, solo avanzar sin volver a guardar
            if (savedSteps.includes(1)) {
                setStep(prev => prev + 1);
            } else {
                saveStep1Data();
            }
        } else if (step === 2) {
            setErrorMsg('');
            const { dias, grados } = wizardData;

            if (!dias || dias.length === 0 || !grados || grados.length === 0) {
                setErrorMsg('Por favor, selecciona al menos un día y un grado.');
                return;
            }

            // Si el paso 2 ya fue guardado, solo avanzar sin volver a guardar
            if (savedSteps.includes(2)) {
                setStep(prev => prev + 1);
            } else {
                saveStep2Data();
            }
        } else if (step === 3) {
            setErrorMsg('');
            saveStep3Data();
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
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
            {/* ===== LEFT PANEL ===== */}
            <div
                className="hidden lg:flex flex-col justify-between relative z-10"
                style={{
                    width: '35%',
                    flexShrink: 0,
                    background: step === 1 ? 'var(--color-hx-purple)' : step === 2 ? 'var(--color-hx-blue)' : 'var(--color-hx-yellow)',
                    padding: '48px',
                    transform: entered ? 'translateX(0)' : 'translateX(-110%)',
                    transition: 'transform 0.7s ease-in-out, background 0.5s ease',
                }}
            >
                <div style={{
                    position: 'absolute', top: 0, right: -150,
                    height: '100%', width: 152,
                    overflow: 'hidden', pointerEvents: 'none',
                }}>
                    <svg viewBox="0 0 100 1000" preserveAspectRatio="none"
                        style={{
                            width: '100%', height: '100%', display: 'block',
                            fill: step === 1 ? 'var(--color-hx-purple)' : step === 2 ? 'var(--color-hx-blue)' : 'var(--color-hx-yellow)',
                            transition: 'fill 0.5s ease'
                        }}>
                        <path d="M0,0 L0,1000 L20,1000 C150,750 -50,250 20,0 Z"></path>
                    </svg>
                </div>

                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 256, height: 256, background: '#F1A5B9', opacity: 0.2, borderRadius: '50%', filter: 'blur(60px)' }}></div>
                <div style={{ position: 'absolute', top: '40%', left: '-20%', width: 320, height: 320, background: '#10CFAE', opacity: 0.2, borderRadius: '50%', filter: 'blur(60px)' }}></div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-[#790EEC] text-xl shadow-lg">Hx</div>
                    <span className="text-white text-2xl font-bold tracking-tight">HorariX</span>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center flex-grow mt-12">
                    <svg width="240" height="240" viewBox="0 0 240 240" fill="none"
                        className="mb-10 hover:scale-105 transition-transform duration-700"
                        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))' }}>
                        {step === 1 && (
                            <>
                                <circle cx="120" cy="120" r="100" fill="#51B4E8" fillOpacity="0.2" />
                                <path d="M120 40 L190 160 H50 Z" fill="#10CFAE" fillOpacity="0.9" />
                                <rect x="90" y="100" width="60" height="60" rx="12" fill="#F3C252" fillOpacity="0.9" />
                                <circle cx="140" cy="140" r="25" fill="#F1A5B9" />
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <circle cx="120" cy="120" r="100" fill="#F1A5B9" fillOpacity="0.2" />
                                <rect x="80" y="80" width="80" height="80" rx="20" fill="#790EEC" fillOpacity="0.9" />
                                <circle cx="160" cy="80" r="30" fill="#F3C252" />
                                <path d="M80 180 Q120 130 160 180 Z" fill="#51B4E8" fillOpacity="0.9" />
                            </>
                        )}
                        {step === 3 && (
                            <>
                                <circle cx="120" cy="120" r="100" fill="var(--color-hx-purple)" fillOpacity="0.2" />
                                <rect x="60" y="90" width="120" height="60" rx="12" fill="var(--color-hx-teal)" fillOpacity="0.9" />
                                <circle cx="180" cy="150" r="25" fill="var(--color-hx-pink)" />
                                <path d="M120 40 L160 100 H80 Z" fill="var(--color-hx-blue)" fillOpacity="0.9" />
                            </>
                        )}
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

            {/* ===== RIGHT PANEL ===== */}
            <div
                className="flex-1 bg-white relative z-0 overflow-y-auto"
                style={{
                    transform: entered ? 'translateX(0)' : 'translateX(110%)',
                    transition: 'transform 0.7s ease-in-out',
                }}
            >
                <div className="absolute top-6 right-8 flex items-center gap-2 z-50">
                    <div className="w-10 h-10 rounded-full bg-[#790EEC]/10 flex items-center justify-center text-[#790EEC] font-bold cursor-pointer hover:bg-[#790EEC]/20 transition-colors" title="Perfil">
                        A
                    </div>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Cerrar Sesión"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </button>
                </div>

                <div className="min-h-full w-full flex flex-col items-center justify-center py-8">
                    <div style={{
                        width: '100%', maxWidth: 600,
                        padding: '16px 32px 24px',
                        opacity: entered ? 1 : 0,
                        transition: 'opacity 0.3s ease 0.3s',
                    }}>
                        <div style={{
                            textAlign: 'center', fontSize: 11, fontWeight: 700,
                            letterSpacing: '0.15em',
                            color: step === 1 ? 'var(--color-hx-purple)' : step === 2 ? 'var(--color-hx-blue)' : '#d49e24',
                            textTransform: 'uppercase', marginBottom: 48, marginTop: 16,
                            transition: 'color 0.5s ease',
                        }}>
                            PASO {step} DE 3 • {step === 1 ? 'DATOS INICIALES' : step === 2 ? 'DÍAS Y GRADOS' : 'BLOQUES POR DÍA'}
                        </div>

                        <div className="flex-grow flex flex-col justify-center w-full">
                            {step === 1 && (
                                <Paso1Institucion data={wizardData} setData={setWizardData} />
                            )}
                            {step === 2 && (
                                <div className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
                                    <Paso2DiasGrados data={wizardData} setData={setWizardData} />
                                </div>
                            )}
                            {step === 3 && (
                                <div className="animate-fade-in" style={{ animationDuration: '0.6s' }}>
                                    <Paso3GradoDiaConfig data={wizardData} setData={setWizardData} />
                                </div>
                            )}
                        </div>

                        {/* Botones de navegación */}
                        <div style={{ marginTop: 40, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {errorMsg && (
                                <div className="w-full max-w-[400px] mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 animate-fade-in text-red-500 text-sm font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    {errorMsg}
                                </div>
                            )}
                            <div style={{
                                width: '100%', maxWidth: 400,
                                display: 'flex', gap: 16, marginBottom: 40,
                                justifyContent: step === 1 ? 'center' : 'space-between',
                            }}>
                                {step > 1 && (
                                    <button
                                        onClick={handleBack}
                                        className={`cursor-pointer w-1/2 py-4 rounded-xl font-bold text-sm tracking-widest transition-all border-2 
                                            ${step === 2 ? 'border-hx-blue text-hx-blue hover:bg-hx-blue/5' : 'border-hx-yellow text-[#d49e24] hover:bg-hx-yellow/10'}`}
                                    >
                                        VOLVER
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    disabled={isSaving}
                                    style={{
                                        width: step === 1 ? '100%' : '50%',
                                        background: isSaving
                                            ? (step === 1 ? 'rgba(121,14,236,0.5)' : step === 2 ? 'rgba(81,180,232,0.5)' : 'rgba(243,194,82,0.5)')
                                            : (step === 1 ? 'var(--color-hx-purple)' : step === 2 ? 'var(--color-hx-blue)' : 'var(--color-hx-yellow)'),
                                        color: 'white', fontWeight: 700,
                                        padding: '16px 0', borderRadius: 12,
                                        fontSize: 13, letterSpacing: '0.1em',
                                        border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isSaving ? 'none' : (step === 1 ? '0 8px 20px -6px rgba(121,14,236,0.5)' : step === 2 ? '0 8px 20px -6px rgba(81,180,232,0.5)' : '0 8px 20px -6px rgba(243,194,82,0.5)'),
                                    }}
                                >
                                    {isSaving ? 'GUARDANDO...' : (step === 3 ? 'FINALIZAR' : 'CONTINUAR Y GUARDAR')}
                                </button>
                            </div>

                            {/* Barra de progreso */}
                            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
                                {step} DE 3
                            </div>
                            <div style={{ width: 192, height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: step === 1 ? '33.33%' : step === 2 ? '66.66%' : '100%',
                                    background: step === 1 ? 'var(--color-hx-teal)' : step === 2 ? 'var(--color-hx-blue)' : 'var(--color-hx-yellow)',
                                    borderRadius: 999, transition: 'all 0.5s ease'
                                }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

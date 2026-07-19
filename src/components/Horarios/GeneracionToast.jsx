import React, { useState, useEffect } from 'react';
import { subscribe, clearResult, isGenerating, LOADING_MESSAGES } from './generacionGlobal';

/**
 * Toast global que muestra el estado de la generación de horarios
 * cuando el usuario está en OTRA página (no en /horarios).
 * Se monta desde Layout.astro para que persista durante la navegación.
 */
export default function GeneracionToast() {
    const [genState, setGenState] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const unsub = subscribe((state) => {
            setGenState(state);
        });
        return unsub;
    }, []);

    // Determinar si estamos en la página de horarios
    const [isOnHorarios, setIsOnHorarios] = useState(false);
    useEffect(() => {
        const checkPath = () => {
            const path = window.location.pathname;
            setIsOnHorarios(path.startsWith('/horarios'));
        };
        checkPath();

        // Escuchar navegaciones de Astro
        document.addEventListener('astro:page-load', checkPath);
        document.addEventListener('astro:after-swap', checkPath);
        return () => {
            document.removeEventListener('astro:page-load', checkPath);
            document.removeEventListener('astro:after-swap', checkPath);
        };
    }, []);

    // Mostrar/ocultar toast
    useEffect(() => {
        if (!genState) return;

        // Si estamos en la página de horarios, no mostrar toast (el componente principal lo maneja)
        if (isOnHorarios) {
            setVisible(false);
            return;
        }

        if (genState.status === 'generating') {
            setVisible(true);
            setDismissed(false);
        } else if (genState.status === 'success' && !dismissed) {
            setVisible(true);
        } else if (genState.status === 'error' && !dismissed) {
            setVisible(true);
        } else if (!genState.status) {
            setVisible(false);
        }
    }, [genState, isOnHorarios, dismissed]);

    if (!visible || !genState || isOnHorarios) return null;

    const handleDismiss = () => {
        setDismissed(true);
        setVisible(false);
    };

    const handleGoToHorarios = () => {
        setDismissed(true);
        setVisible(false);
        window.location.href = '/horarios';
    };

    const containerStyle = {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        width: '320px',
        background: 'white',
        borderRadius: '16px',
        // Sombra más difuminada con un toque morado tipo "humo" y borde sutil
        boxShadow: '0 20px 50px rgba(47, 91, 255, 0.15), 0 0 0 1px rgba(47, 91, 255, 0.05)',
        border: '1px solid rgba(47, 91, 255, 0.15)',
        padding: '16px',
        animation: 'slideUpFadeIn 0.3s ease-out',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    };

    // --- GENERANDO ---
    if (genState.status === 'generating') {
        const currentMsg = genState.progressMessage || LOADING_MESSAGES[genState.loadingStep] || LOADING_MESSAGES[0];
        const progress = Number(genState.progressPercent) || 0;
        return (
            <div style={containerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Spinner */}
                    <div style={{ position: 'relative', width: '24px', height: '24px', flexShrink: 0 }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            border: '3px solid #f1f5f9',
                            borderRadius: '50%'
                        }} />
                        <div style={{
                            position: 'absolute', inset: 0,
                            border: '3px solid transparent',
                            borderTopColor: 'var(--color-brand-primary, var(--color-brand-primary))',
                            borderRightColor: 'var(--color-brand-primary, var(--color-brand-primary))',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                            Generando horarios...
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                            {currentMsg}
                        </p>
                    </div>
                </div>
                {/* Barra de progreso */}
                <div style={{
                    height: '4px',
                    background: '#f1f5f9',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginTop: '4px'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'var(--color-brand-primary, var(--color-brand-primary))',
                        borderRadius: '2px',
                        transition: 'width 0.5s ease'
                    }} />
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '10.5px', color: '#94a3b8', textAlign: 'center' }}>
                    Puedes seguir navegando, te avisaremos.
                </p>
            </div>
        );
    }

    // --- ÉXITO ---
    if (genState.status === 'success') {
        return (
            <div style={containerStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Check icon */}
                    <div style={{
                        width: '24px', height: '24px', flexShrink: 0,
                        background: '#ecfdf5', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#10b981'
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                            Horarios generados
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                            El proceso ha finalizado correctamente.
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 0 }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <button
                    onClick={handleGoToHorarios}
                    style={{
                        padding: '8px',
                        background: 'var(--color-brand-primary, var(--color-brand-primary))',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '4px'
                    }}
                >
                    Ver resultados
                </button>
            </div>
        );
    }

    // --- ERROR ---
    if (genState.status === 'error') {
        return (
            <div style={containerStyle}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Error icon */}
                    <div style={{
                        width: '24px', height: '24px', flexShrink: 0,
                        background: '#fef2f2', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ef4444'
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                            Error de generación
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#ef4444', maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {Array.isArray(genState.errorMsg) ? "Se encontraron conflictos físicos o curriculares en la validación." : genState.errorMsg}
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 0 }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

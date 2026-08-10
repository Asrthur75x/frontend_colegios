import React from 'react';
import { Toaster } from 'sileo';
import 'sileo/styles.css';

/**
 * Wrapper del componente Toaster de Sileo.
 * - Posición: top-right, debajo del navbar (offset top: 92px)
 * - Fondo: azul claro (#EFF6FF) con textos en slate oscuro
 */
export default function SileoToaster() {
    return (
        <Toaster
            position="top-right"
            offset={{ top: 92, right: 16 }}
            options={{
                fill: '#EFF6FF',
                styles: {
                    title: '!text-slate-800',
                    description: '!text-slate-500',
                    badge: '!bg-blue-100',
                },
            }}
        />
    );
}

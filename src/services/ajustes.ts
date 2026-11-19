import type { components } from '../lib/api/schema';
import { apiClient, executeRead, executeRequest } from '../lib/api/client';

type S = components['schemas'];
export type Config = S['GetGradoDiaConfigDetail'];
export type SeccionTurno = S['GetSeccionTurnoDetail'];
export interface WritePermissions { canAdd: boolean; canEdit: boolean; canDelete: boolean }

export const ajustesCrud = {
    sede: {
        list: () => executeRead<S['GetSedeDetail'][]>('/api/v1/sede', () => apiClient.GET('/api/v1/sede')),
        create: (body: S['CreateSedeParam']) => executeRequest<unknown>(() => apiClient.POST('/api/v1/sede', { body })),
        update: (id: number, body: S['UpdateSedeParam']) => executeRequest<unknown>(() => apiClient.PUT('/api/v1/sede/{pk}', { params: { path: { pk: id } }, body })),
        delete: (id: number) => executeRequest<unknown>(() => apiClient.DELETE('/api/v1/sede/{pk}', { params: { path: { pk: id } } })),
    },
    turno: {
        list: () => executeRead<S['GetTurnoDetail'][]>('/api/v1/turno', () => apiClient.GET('/api/v1/turno')),
        create: (body: S['CreateTurnoParam']) => executeRequest<unknown>(() => apiClient.POST('/api/v1/turno', { body })),
        update: (id: number, body: S['UpdateTurnoParam']) => executeRequest<unknown>(() => apiClient.PUT('/api/v1/turno/{pk}', { params: { path: { pk: id } }, body })),
        delete: (id: number) => executeRequest<unknown>(() => apiClient.DELETE('/api/v1/turno/{pk}', { params: { path: { pk: id } } })),
    },
    grado: {
        list: () => executeRead<S['GetGradoDetail'][]>('/api/v1/grado', () => apiClient.GET('/api/v1/grado')),
        create: (body: S['CreateGradoParam']) => executeRequest<unknown>(() => apiClient.POST('/api/v1/grado', { body })),
        update: (id: number, body: S['UpdateGradoParam']) => executeRequest<unknown>(() => apiClient.PUT('/api/v1/grado/{pk}', { params: { path: { pk: id } }, body })),
        delete: (id: number) => executeRequest<unknown>(() => apiClient.DELETE('/api/v1/grado/{pk}', { params: { path: { pk: id } } })),
    },
    seccion: {
        list: () => executeRead<S['GetSeccionDetail'][]>('/api/v1/seccion', () => apiClient.GET('/api/v1/seccion')),
        create: (body: S['CreateSeccionParam']) => executeRequest<unknown>(() => apiClient.POST('/api/v1/seccion', { body })),
        update: (id: number, body: S['UpdateSeccionParam']) => executeRequest<unknown>(() => apiClient.PUT('/api/v1/seccion/{pk}', { params: { path: { pk: id } }, body })),
        delete: (id: number) => executeRequest<unknown>(() => apiClient.DELETE('/api/v1/seccion/{pk}', { params: { path: { pk: id } } })),
    },
};

export const listDias = () => executeRead<S['GetDiaDetail'][]>('/api/v1/dia', () => apiClient.GET('/api/v1/dia'));
export const listConfigs = () => executeRequest<Config[]>(() => apiClient.GET('/api/v1/grado-dia-config'));
export const listSeccionTurnos = () => executeRequest<SeccionTurno[]>(() => apiClient.GET('/api/v1/seccion-turno'));

export async function getAjustesData(canRead: (resource: string) => boolean) {
    const [sedes, turnos, dias, grados, configs, secciones, seccionTurnos] = await Promise.all([
        canRead('sede') ? ajustesCrud.sede.list() : [],
        canRead('turno') ? ajustesCrud.turno.list() : [],
        canRead('dia') ? listDias() : [],
        canRead('grado') ? ajustesCrud.grado.list() : [],
        canRead('grado_dia_config') ? listConfigs() : [],
        canRead('seccion') ? ajustesCrud.seccion.list() : [],
        canRead('seccion_turno') ? listSeccionTurnos() : [],
    ]);
    return { sedes, turnos, dias, grados, configs, secciones, seccionTurnos };
}

export const getColegio = (id: number) => executeRequest<S['GetTenantDetail']>(() => apiClient.GET('/api/v1/platform/tenant/{pk}', { params: { path: { pk: id } } }));
export const updateColegio = (id: number, display_name: string) => executeRequest<unknown>(() => apiClient.PUT('/api/v1/platform/tenant/{pk}', { params: { path: { pk: id } }, body: { display_name } }));

export function parseWholeNumber(value: string | number, min: number, max = Number.MAX_SAFE_INTEGER): number {
    const number = Number(value);
    if (String(value).trim() === '' || !Number.isSafeInteger(number) || number < min || number > max) {
        throw new Error(`Ingresa un número entero entre ${min} y ${max === Number.MAX_SAFE_INTEGER ? 'el máximo permitido' : max}.`);
    }
    return number;
}

export async function saveGradoDiaConfig(id_grado: number, id_dia: number, value: string | number, permissions: WritePermissions): Promise<void> {
    const bloques_dia = parseWholeNumber(value, 0, 15);
    const rows = (await listConfigs()).filter(c => c.id_grado === id_grado && c.id_dia === id_dia);
    if (rows.length > 1) throw new Error('Hay configuraciones duplicadas para este grado y día. Revisa los registros antes de continuar.');
    const existing = rows[0];
    if (bloques_dia === 0) {
        if (!existing) return;
        if (!permissions.canDelete) throw new Error('No tienes permiso para deshabilitar este día.');
        await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/grado-dia-config/{pk}', { params: { path: { pk: existing.id } } }));
    } else if (existing) {
        if (existing.bloques_dia === bloques_dia) return;
        if (!permissions.canEdit) throw new Error('No tienes permiso para modificar los bloques.');
        await executeRequest<unknown>(() => apiClient.PUT('/api/v1/grado-dia-config/{pk}', {
            params: { path: { pk: existing.id } }, body: { bloques_dia },
        }));
    } else {
        if (!permissions.canAdd) throw new Error('No tienes permiso para configurar bloques.');
        await executeRequest<unknown>(() => apiClient.POST('/api/v1/grado-dia-config', { body: { id_grado, id_dia, bloques_dia } }));
    }
}

export async function syncTurnoSeccion(id_seccion: number, id_turno: number, dias: number[], permissions: WritePermissions): Promise<void> {
    const enabled = [...new Set(dias)];
    if (!enabled.length) throw new Error('Configura los días y bloques del grado antes de asignar un turno.');
    const existing = (await listSeccionTurnos()).filter(r => r.id_seccion === id_seccion);
    const planned = enabled.map(id_dia => {
        const rows = existing.filter(r => r.id_dia === id_dia);
        if (rows.length > 1) throw new Error('La sección tiene varios turnos en un mismo día. Revisa las asignaciones antes de continuar.');
        return { id_dia, row: rows[0] };
    });
    const obsolete = existing.filter(r => !enabled.includes(r.id_dia ?? -1));
    if (planned.some(p => !p.row) && !permissions.canAdd) throw new Error('No tienes permiso para añadir turnos a la sección.');
    if (planned.some(p => p.row && p.row.id_turno !== id_turno) && !permissions.canEdit) throw new Error('No tienes permiso para cambiar los turnos de la sección.');
    if (obsolete.length && !permissions.canDelete) throw new Error('No tienes permiso para retirar las asignaciones de días deshabilitados.');
    let completed = 0;
    try {
        for (const { id_dia, row } of planned) {
            if (row?.id_turno === id_turno) continue;
            if (row) {
                await executeRequest<unknown>(() => apiClient.PUT('/api/v1/seccion-turno/{pk}', {
                    params: { path: { pk: row.id } }, body: { id_turno },
                }));
            } else {
                await executeRequest<unknown>(() => apiClient.POST('/api/v1/seccion-turno', { body: { id_seccion, id_turno, id_dia } }));
            }
            completed += 1;
        }
        // Remove obsolete assignments only after all enabled days were saved.
        for (const row of obsolete) {
            await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/seccion-turno/{pk}', { params: { path: { pk: row.id } } }));
            completed += 1;
        }
    } catch (error) {
        const detail = error instanceof Error ? error.message : 'No se pudo completar la asignación';
        throw new Error(completed ? `Se aplicaron ${completed} cambios antes del error: ${detail}. Revisa el estado actual antes de reintentar.` : detail);
    }
}

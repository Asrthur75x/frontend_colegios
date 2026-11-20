import type { components } from '../lib/api/schema';
import { apiClient, executeRead, executeRequest } from '../lib/api/client';

type S = components['schemas'];
export const startHorario = () => executeRequest<S['GenerarHorarioResult']>(() => apiClient.POST('/api/v1/horario/generacion'));
export const getHorarioProgress = (task_id: string) => executeRequest<S['ProgressDetail']>(() => apiClient.GET('/api/v1/horario/generacion/{task_id}', { params: { path: { task_id } } }));
export const getHorarioActivo = () => executeRequest<S['HorarioCargarResult']>(() => apiClient.GET('/api/v1/horario/activo'));
export const getHorarioMetricas = () => executeRequest<S['MetricasMotorDetail']>(() => apiClient.GET('/api/v1/horario/metricas'));
export const listHorarioBloques = () => executeRequest<S['GetBloqueDetail'][]>(() => apiClient.GET('/api/v1/bloque'));
export const validateHorarioMove = (body: S['MoveValidateParam']) =>
    executeRequest<S['MoveValidateResult']>(() => apiClient.POST('/api/v1/horario/movimiento/validacion', { body }));
export const applyHorarioMove = (body: S['MoveApplyParam']) =>
    executeRequest<S['HorarioCargarResult']>(() => apiClient.POST('/api/v1/horario/movimiento', { body }));
export const saveHorarioEdits = () =>
    executeRequest<S['SaveEditsResult']>(() => apiClient.POST('/api/v1/horario/edicion'));

export const adaptSnapshot = (s: S['GetSnapshotListItem']) => ({
    ...s,
    id_snapshot: s.id,
    es_editada: s.is_edited,
    is_official: Boolean((s as { is_official?: boolean }).is_official),
    created_at: s.created_time,
});
export const listSnapshots = () =>
    executeRequest<S['GetSnapshotListItem'][]>(() => apiClient.GET('/api/v1/snapshot'));
export const getSnapshot = (pk: number) =>
    executeRequest<S['GetSnapshotDetail']>(() => apiClient.GET('/api/v1/snapshot/{pk}', { params: { path: { pk } } }));
export const updateSnapshot = (pk: number, body: S['UpdateSnapshotParam'] & { is_official?: boolean | null }) =>
    executeRequest<unknown>(() => apiClient.PUT('/api/v1/snapshot/{pk}', { params: { path: { pk } }, body: body as S['UpdateSnapshotParam'] }));
export const deleteSnapshot = (pk: number) =>
    executeRequest<unknown>(() => apiClient.DELETE('/api/v1/snapshot/{pk}', { params: { path: { pk } } }));
export const restoreSnapshot = (pk: number) =>
    executeRequest<S['SnapshotLoadResult']>(() => apiClient.POST('/api/v1/snapshot/{pk}/restauracion', { params: { path: { pk } } }));

export const listTurnos = () =>
    executeRead<S['GetTurnoDetail'][]>('/api/v1/turno', () => apiClient.GET('/api/v1/turno'));
export const deleteBloque = (pk: number) =>
    executeRequest<unknown>(() => apiClient.DELETE('/api/v1/bloque/{pk}', { params: { path: { pk } } }));
export const createBloque = (body: S['CreateBloqueParam']) =>
    executeRequest<unknown>(() => apiClient.POST('/api/v1/bloque', { body }));
export const updateBloque = (pk: number, body: S['UpdateBloqueParam']) =>
    executeRequest<unknown>(() => apiClient.PUT('/api/v1/bloque/{pk}', { params: { path: { pk } }, body }));
export const configureTurnoTiempos = (id_turno: number, body: S['ConfigurarTiemposParam']) =>
    executeRequest<unknown>(() => apiClient.POST('/api/v1/bloque/configuracion/{id_turno}', { params: { path: { id_turno } }, body }));

// Preserve the existing table's view model while taking IDs from the current API.
export function adaptHorarioData(data: {
    secciones: S['GetSeccionDetail'][]; cursos: S['GetCursoDetail'][];
    profesores: S['GetProfesorDetail'][]; dias: S['GetDiaDetail'][];
    bloques: S['GetBloqueDetail'][]; grados: S['GetGradoDetail'][];
    sedes: S['GetSedeDetail'][]; turnos: S['GetTurnoDetail'][];
    reservas: S['GetBloqueReservadoAnidadoDetail'][];
}) {
    return {
        ...data,
        secciones: data.secciones.map(x => ({ ...x, id_seccion: x.id })),
        cursos: data.cursos.map(x => ({ ...x, id_curso: x.id })),
        profesores: data.profesores.map(x => ({ ...x, id_profesor: x.id })),
        dias: data.dias.map(x => ({ ...x, id_dia: x.id })).sort((a, b) => a.orden - b.orden),
        bloques: adaptBloques(data.bloques),
        grados: data.grados.map(x => ({ ...x, id_grado: x.id })),
        sedes: data.sedes.map(x => ({ ...x, id_sede: x.id })),
        turnos: data.turnos.map(x => ({ ...x, id_turno: x.id })),
        reservas: data.reservas.map(x => ({ ...x, id_bloque_reservado: x.id,
            opciones: (x.opciones ?? []).map(op => ({ ...op, id_bloque_opcion: op.id,
                slots: (op.slots ?? []).map(slot => slot.nro_bloque).filter((n): n is number => n != null),
            })),
        })),
    };
}

export function adaptBloques(bloques: S['GetBloqueDetail'][]) {
    return bloques.map(x => ({ ...x, id_bloque: x.id, es_recreo: x.is_recess }))
        .sort((a, b) => (a.numero_bloque ?? 0) - (b.numero_bloque ?? 0));
}

export async function getHorarioData(canRead: (permission: string) => boolean) {
    const [secciones, cursos, profesores, dias, bloques, configs, grados, sedes, turnos, seccionTurnos, reservas, horario] = await Promise.all([
        executeRead<S['GetSeccionDetail'][]>('/api/v1/seccion', () => apiClient.GET('/api/v1/seccion')),
        executeRead<S['GetCursoDetail'][]>('/api/v1/curso', () => apiClient.GET('/api/v1/curso')),
        executeRead<S['GetProfesorDetail'][]>('/api/v1/profesor', () => apiClient.GET('/api/v1/profesor')),
        executeRead<S['GetDiaDetail'][]>('/api/v1/dia', () => apiClient.GET('/api/v1/dia')),
        canRead('horarios:bloque:view') ? listHorarioBloques() : [],
        executeRead<S['GetGradoDiaConfigDetail'][]>('/api/v1/grado-dia-config', () => apiClient.GET('/api/v1/grado-dia-config')),
        executeRead<S['GetGradoDetail'][]>('/api/v1/grado', () => apiClient.GET('/api/v1/grado')),
        executeRead<S['GetSedeDetail'][]>('/api/v1/sede', () => apiClient.GET('/api/v1/sede')),
        executeRead<S['GetTurnoDetail'][]>('/api/v1/turno', () => apiClient.GET('/api/v1/turno')),
        executeRead<S['GetSeccionTurnoDetail'][]>('/api/v1/seccion-turno', () => apiClient.GET('/api/v1/seccion-turno')),
        canRead('horarios:bloque_reservado:view') ? executeRead<S['GetBloqueReservadoAnidadoDetail'][]>('/api/v1/bloque-reservado', () => apiClient.GET('/api/v1/bloque-reservado')) : [],
        getHorarioActivo(),
    ]);
    return { ...adaptHorarioData({ secciones, cursos, profesores, dias, bloques, grados, sedes, turnos, reservas }), configs, seccionTurnos, horario };
}

export async function getVersionesCatalogData(canRead: (permission: string) => boolean) {
    const [secciones, cursos, profesores, dias, bloques, configs, grados, sedes, turnos, seccionTurnos, reservas] = await Promise.all([
        executeRead<S['GetSeccionDetail'][]>('/api/v1/seccion', () => apiClient.GET('/api/v1/seccion')),
        executeRead<S['GetCursoDetail'][]>('/api/v1/curso', () => apiClient.GET('/api/v1/curso')),
        executeRead<S['GetProfesorDetail'][]>('/api/v1/profesor', () => apiClient.GET('/api/v1/profesor')),
        executeRead<S['GetDiaDetail'][]>('/api/v1/dia', () => apiClient.GET('/api/v1/dia')),
        canRead('horarios:bloque:view') ? listHorarioBloques() : [],
        executeRead<S['GetGradoDiaConfigDetail'][]>('/api/v1/grado-dia-config', () => apiClient.GET('/api/v1/grado-dia-config')),
        executeRead<S['GetGradoDetail'][]>('/api/v1/grado', () => apiClient.GET('/api/v1/grado')),
        executeRead<S['GetSedeDetail'][]>('/api/v1/sede', () => apiClient.GET('/api/v1/sede')),
        listTurnos(),
        executeRead<S['GetSeccionTurnoDetail'][]>('/api/v1/seccion-turno', () => apiClient.GET('/api/v1/seccion-turno')),
        canRead('horarios:bloque_reservado:view') ? executeRead<S['GetBloqueReservadoAnidadoDetail'][]>('/api/v1/bloque-reservado', () => apiClient.GET('/api/v1/bloque-reservado')) : [],
    ]);
    return { ...adaptHorarioData({ secciones, cursos, profesores, dias, bloques, grados, sedes, turnos, reservas }), configs, seccionTurnos };
}

export function generationAssignments(resultado: Record<string, unknown> | null | undefined) {
    if (!resultado || !['OPTIMAL', 'FEASIBLE'].includes(String(resultado.estado))) {
        throw new Error(String(resultado?.mensaje || `El motor terminó con estado ${resultado?.estado || 'desconocido'}.`));
    }
    if (!Array.isArray(resultado.asignaciones) || !resultado.asignaciones.length) {
        throw new Error('El motor terminó sin asignaciones para mostrar.');
    }
    return resultado.asignaciones;
}

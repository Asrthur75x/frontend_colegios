import type { components } from '../lib/api/schema';
import { apiClient, executeRead, executeRequest } from '../lib/api/client';

type S = components['schemas'];
export const startHorario = () => executeRequest<S['GenerarHorarioResult']>(() => apiClient.POST('/api/v1/horario/generacion'));
export const getHorarioProgress = (task_id: string) => executeRequest<S['ProgressDetail']>(() => apiClient.GET('/api/v1/horario/generacion/{task_id}', { params: { path: { task_id } } }));
export const getHorarioActivo = () => executeRequest<S['HorarioCargarResult']>(() => apiClient.GET('/api/v1/horario/activo'));
export const getHorarioMetricas = () => executeRequest<S['MetricasMotorDetail']>(() => apiClient.GET('/api/v1/horario/metricas'));
export const listHorarioBloques = () => executeRequest<S['GetBloqueDetail'][]>(() => apiClient.GET('/api/v1/bloque'));

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

export function generationAssignments(resultado: Record<string, unknown> | null | undefined) {
    if (!resultado || !['OPTIMAL', 'FEASIBLE'].includes(String(resultado.estado))) {
        throw new Error(String(resultado?.mensaje || `El motor terminó con estado ${resultado?.estado || 'desconocido'}.`));
    }
    if (!Array.isArray(resultado.asignaciones) || !resultado.asignaciones.length) {
        throw new Error('El motor terminó sin asignaciones para mostrar.');
    }
    return resultado.asignaciones;
}

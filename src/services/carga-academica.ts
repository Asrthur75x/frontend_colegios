import type { components } from '../lib/api/schema';
import { apiClient, executeRead, executeRequest } from '../lib/api/client';
import { listAreas, listCursos } from './catalogs';

type Profesor = components['schemas']['GetProfesorDetail'];
export type ProfesorCurso = components['schemas']['GetProfesorCursoDetail'];

export function listProfesorCursos(): Promise<ProfesorCurso[]> {
    return executeRequest<ProfesorCurso[]>(() => apiClient.GET('/api/v1/profesor-curso'));
}

export async function listCargaAcademicaData() {
    const [profesores, cursos, areas, relaciones] = await Promise.all([
        executeRead<Profesor[]>('/api/v1/profesor', () => apiClient.GET('/api/v1/profesor')),
        listCursos(),
        listAreas(),
        executeRead<ProfesorCurso[]>('/api/v1/profesor-curso', () => apiClient.GET('/api/v1/profesor-curso')),
    ]);
    return { profesores, cursos, areas, relaciones };
}

// Set the requested state rather than toggling a potentially stale local value.
export async function setCursoAsignado(
    idProfesor: number,
    idCurso: number,
    asignado: boolean,
    permissions: { canAdd: boolean; canDelete: boolean },
): Promise<void> {
    const relaciones = (await listProfesorCursos()).filter(r =>
        r.id_profesor === idProfesor && r.id_curso === idCurso);
    if (asignado) {
        if (relaciones.length) return;
        if (!permissions.canAdd) throw new Error('No tienes permiso para asignar cursos.');
        await executeRequest<unknown>(() => apiClient.POST('/api/v1/profesor-curso', {
            body: { id_profesor: idProfesor, id_curso: idCurso },
        }));
    } else {
        if (!relaciones.length) return;
        if (!permissions.canDelete) throw new Error('No tienes permiso para quitar cursos.');
        // Remove all matching rows if older data contains duplicates.
        for (const relacion of relaciones) {
            await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/profesor-curso/{pk}', {
                params: { path: { pk: relacion.id } },
            }));
        }
    }
}

export function cursosAsignados(idProfesor: number, relaciones: ProfesorCurso[], cursoIds: Set<number>): number[] {
    return [...new Set(relaciones.filter(r => r.id_profesor === idProfesor
        && r.id_curso != null && cursoIds.has(r.id_curso)).map(r => r.id_curso!))];
}

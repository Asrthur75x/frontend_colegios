import type { components } from '../lib/api/schema';

import { apiClient, executeRead, executeRequest } from '../lib/api/client';
import { listAreas } from './catalogs';

export type Curso = components['schemas']['GetCursoDetail'];
export type Area = components['schemas']['GetAreaDetail'];

type CreateCurso = components['schemas']['CreateCursoParam'];
type UpdateCurso = components['schemas']['UpdateCursoParam'];

export { listAreas };

export function listCursos(): Promise<Curso[]> {
    return executeRead<Curso[]>('/api/v1/curso', () => apiClient.GET('/api/v1/curso'));
}

export async function createCurso(body: CreateCurso): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/curso', { body }));
}

export async function updateCurso(id: number, body: UpdateCurso): Promise<void> {
    await executeRequest<unknown>(() => apiClient.PUT('/api/v1/curso/{pk}', {
        params: { path: { pk: id } },
        body,
    }));
}

export async function deleteCurso(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/curso/{pk}', {
        params: { path: { pk: id } },
    }));
}

import type { components } from '../lib/api/schema';

import { apiClient, executeRead, executeRequest } from '../lib/api/client';
import { listCursos, listPlanesEstudio } from './catalogs';

export type PlanEstudio = components['schemas']['GetPlanEstudioDetail'];
export type Curso = components['schemas']['GetCursoDetail'];
export type Grado = components['schemas']['GetGradoDetail'];
export type GradoDiaConfig = components['schemas']['GetGradoDiaConfigDetail'];
export type BloqueReservado = components['schemas']['GetBloqueReservadoAnidadoDetail'];

type CreatePlanEstudio = components['schemas']['CreatePlanEstudioParam'];
type UpdatePlanEstudio = components['schemas']['UpdatePlanEstudioParam'];

export { listCursos, listPlanesEstudio };

export function listGrados(): Promise<Grado[]> {
    return executeRead<Grado[]>('/api/v1/grado', () => apiClient.GET('/api/v1/grado'));
}

export function listGradoDiaConfig(): Promise<GradoDiaConfig[]> {
    return executeRead<GradoDiaConfig[]>('/api/v1/grado-dia-config', () => apiClient.GET('/api/v1/grado-dia-config'));
}

export function listBloquesReservados(): Promise<BloqueReservado[]> {
    return executeRead<BloqueReservado[]>('/api/v1/bloque-reservado', () => apiClient.GET('/api/v1/bloque-reservado'));
}

export async function createPlanEstudio(body: CreatePlanEstudio): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/plan-estudio', { body }));
}

export async function updatePlanEstudio(id: number, body: UpdatePlanEstudio): Promise<void> {
    await executeRequest<unknown>(() => apiClient.PUT('/api/v1/plan-estudio/{pk}', {
        params: { path: { pk: id } },
        body,
    }));
}

export async function deletePlanEstudio(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/plan-estudio/{pk}', {
        params: { path: { pk: id } },
    }));
}

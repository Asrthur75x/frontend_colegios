import type { components } from '../lib/api/schema';

import { apiClient, executeRead } from '../lib/api/client';

export type Area = components['schemas']['GetAreaDetail'];
export type Curso = components['schemas']['GetCursoDetail'];
export type PlanEstudio = components['schemas']['GetPlanEstudioDetail'];

export function listAreas(): Promise<Area[]> {
    return executeRead<Area[]>('/api/v1/area', () => apiClient.GET('/api/v1/area'));
}

export function listCursos(): Promise<Curso[]> {
    return executeRead<Curso[]>('/api/v1/curso', () => apiClient.GET('/api/v1/curso'));
}

export function listPlanesEstudio(): Promise<PlanEstudio[]> {
    return executeRead<PlanEstudio[]>('/api/v1/plan-estudio', () => apiClient.GET('/api/v1/plan-estudio'));
}

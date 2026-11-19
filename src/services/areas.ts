import type { components } from '../lib/api/schema';

import { apiClient, executeRead, executeRequest } from '../lib/api/client';
import { listAreas, listCursos } from './catalogs';

export type Area = components['schemas']['GetAreaDetail'];
export type Curso = components['schemas']['GetCursoDetail'];
export type Profesor = components['schemas']['GetProfesorDetail'];
export type Sede = components['schemas']['GetSedeDetail'];
export type Grado = components['schemas']['GetGradoDetail'];
export type ProfesorCurso = components['schemas']['GetProfesorCursoDetail'];
export type SedeProfesor = components['schemas']['GetSedeProfesorDetail'];
export type GradoProfesor = components['schemas']['GetGradoProfesorDetail'];

type CreateArea = components['schemas']['CreateAreaParam'];
type UpdateArea = components['schemas']['UpdateAreaParam'];
type CreateCurso = components['schemas']['CreateCursoParam'];
type CreateProfesor = components['schemas']['CreateProfesorParam'];
type CreateProfesorCurso = components['schemas']['CreateProfesorCursoParam'];
type CreateSedeProfesor = components['schemas']['CreateSedeProfesorParam'];
type CreateGradoProfesor = components['schemas']['CreateGradoProfesorParam'];

export { listAreas, listCursos };

export async function createArea(body: CreateArea): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/area', { body }));
}

export async function updateArea(id: number, body: UpdateArea): Promise<void> {
    await executeRequest<unknown>(() => apiClient.PUT('/api/v1/area/{pk}', {
        params: { path: { pk: id } },
        body,
    }));
}

export async function deleteArea(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/area/{pk}', {
        params: { path: { pk: id } },
    }));
}

export async function createCurso(body: CreateCurso): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/curso', { body }));
}

export function listProfesores(): Promise<Profesor[]> {
    return executeRead<Profesor[]>('/api/v1/profesor', () => apiClient.GET('/api/v1/profesor'));
}

export async function createProfesor(body: CreateProfesor): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/profesor', { body }));
}

export function listSedes(): Promise<Sede[]> {
    return executeRead<Sede[]>('/api/v1/sede', () => apiClient.GET('/api/v1/sede'));
}

export function listGrados(): Promise<Grado[]> {
    return executeRead<Grado[]>('/api/v1/grado', () => apiClient.GET('/api/v1/grado'));
}

export function listProfesorCursos(): Promise<ProfesorCurso[]> {
    return executeRead<ProfesorCurso[]>('/api/v1/profesor-curso', () => apiClient.GET('/api/v1/profesor-curso'));
}

export async function createProfesorCurso(body: CreateProfesorCurso): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/profesor-curso', { body }));
}

export function listSedeProfesores(): Promise<SedeProfesor[]> {
    return executeRead<SedeProfesor[]>('/api/v1/sede-profesor', () => apiClient.GET('/api/v1/sede-profesor'));
}

export async function createSedeProfesor(body: CreateSedeProfesor): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/sede-profesor', { body }));
}

export function listGradoProfesores(): Promise<GradoProfesor[]> {
    return executeRead<GradoProfesor[]>('/api/v1/grado-profesor', () => apiClient.GET('/api/v1/grado-profesor'));
}

export async function createGradoProfesor(body: CreateGradoProfesor): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/grado-profesor', { body }));
}

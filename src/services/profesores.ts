import type { components } from '../lib/api/schema';

import { apiClient, executeRead, executeRequest } from '../lib/api/client';

export type Profesor = components['schemas']['GetProfesorDetail'];
export type Sede = components['schemas']['GetSedeDetail'];
export type SedeProfesor = components['schemas']['GetSedeProfesorDetail'];
export type Grado = components['schemas']['GetGradoDetail'];
export type GradoProfesor = components['schemas']['GetGradoProfesorDetail'];
export type ProfesorDisponibilidad = components['schemas']['GetProfesorDisponibilidadDetail'];
export type ProfesorPreferencia = components['schemas']['GetProfesorPreferenciaDetail'];
export type ProfesorCurso = components['schemas']['GetProfesorCursoDetail'];
export type Dia = components['schemas']['GetDiaDetail'];
export type Turno = components['schemas']['GetTurnoDetail'];
export type Bloque = components['schemas']['GetBloqueDetail'];
export type GradoDiaConfig = components['schemas']['GetGradoDiaConfigDetail'];
export type Seccion = components['schemas']['GetSeccionDetail'];
export type SeccionTurno = components['schemas']['GetSeccionTurnoDetail'];
export type PlanEstudio = components['schemas']['GetPlanEstudioDetail'];
export type Curso = components['schemas']['GetCursoDetail'];
export type Area = components['schemas']['GetAreaDetail'];

type CreateProfesor = components['schemas']['CreateProfesorParam'];
type UpdateProfesor = components['schemas']['UpdateProfesorParam'];
type CreateSedeProfesor = components['schemas']['CreateSedeProfesorParam'];
type CreateGradoProfesor = components['schemas']['CreateGradoProfesorParam'];
type CreateProfesorCurso = components['schemas']['CreateProfesorCursoParam'];
type CreateProfesorDisponibilidad = components['schemas']['CreateProfesorDisponibilidadParam'];
type CreateProfesorPreferencia = components['schemas']['CreateProfesorPreferenciaParam'];

export interface ProfesoresData {
    profesores: Profesor[];
    sedes: Sede[];
    profesorSedes: SedeProfesor[];
    disponibilidades: ProfesorDisponibilidad[];
    preferencias: ProfesorPreferencia[];
    dias: Dia[];
    turnos: Turno[];
    bloques: Bloque[];
    gradoDiaConfigs: GradoDiaConfig[];
    grados: Grado[];
    gradoProfesores: GradoProfesor[];
    secciones: Seccion[];
    seccionTurnos: SeccionTurno[];
    profesorCursos: ProfesorCurso[];
    planes: PlanEstudio[];
    cursos: Curso[];
    areas: Area[];
}

export async function listProfesoresData(): Promise<ProfesoresData> {
    const [
        profesores, sedes, profesorSedes, disponibilidades, preferencias,
        dias, turnos, bloques, gradoDiaConfigs, grados, gradoProfesores,
        secciones, seccionTurnos, profesorCursos, planes, cursos, areas,
    ] = await Promise.all([
        executeRead<Profesor[]>('/api/v1/profesor', () => apiClient.GET('/api/v1/profesor')),
        executeRead<Sede[]>('/api/v1/sede', () => apiClient.GET('/api/v1/sede')),
        executeRead<SedeProfesor[]>('/api/v1/sede-profesor', () => apiClient.GET('/api/v1/sede-profesor')),
        executeRead<ProfesorDisponibilidad[]>('/api/v1/profesor-disponibilidad', () => apiClient.GET('/api/v1/profesor-disponibilidad')),
        executeRead<ProfesorPreferencia[]>('/api/v1/profesor-preferencia', () => apiClient.GET('/api/v1/profesor-preferencia')),
        executeRead<Dia[]>('/api/v1/dia', () => apiClient.GET('/api/v1/dia')),
        executeRead<Turno[]>('/api/v1/turno', () => apiClient.GET('/api/v1/turno')),
        executeRead<Bloque[]>('/api/v1/bloque', () => apiClient.GET('/api/v1/bloque')),
        executeRead<GradoDiaConfig[]>('/api/v1/grado-dia-config', () => apiClient.GET('/api/v1/grado-dia-config')),
        executeRead<Grado[]>('/api/v1/grado', () => apiClient.GET('/api/v1/grado')),
        executeRead<GradoProfesor[]>('/api/v1/grado-profesor', () => apiClient.GET('/api/v1/grado-profesor')),
        executeRead<Seccion[]>('/api/v1/seccion', () => apiClient.GET('/api/v1/seccion')),
        executeRead<SeccionTurno[]>('/api/v1/seccion-turno', () => apiClient.GET('/api/v1/seccion-turno')),
        executeRead<ProfesorCurso[]>('/api/v1/profesor-curso', () => apiClient.GET('/api/v1/profesor-curso')),
        executeRead<PlanEstudio[]>('/api/v1/plan-estudio', () => apiClient.GET('/api/v1/plan-estudio')),
        executeRead<Curso[]>('/api/v1/curso', () => apiClient.GET('/api/v1/curso')),
        executeRead<Area[]>('/api/v1/area', () => apiClient.GET('/api/v1/area')),
    ]);

    return {
        profesores, sedes, profesorSedes, disponibilidades, preferencias,
        dias, turnos, bloques, gradoDiaConfigs, grados, gradoProfesores,
        secciones, seccionTurnos, profesorCursos, planes, cursos, areas,
    };
}

export function createProfesor(body: CreateProfesor): Promise<Profesor> {
    return executeRequest<Profesor>(() => apiClient.POST('/api/v1/profesor', { body }));
}

export async function updateProfesor(id: number, body: UpdateProfesor): Promise<void> {
    await executeRequest<unknown>(() => apiClient.PUT('/api/v1/profesor/{pk}', {
        params: { path: { pk: id } }, body,
    }));
}

export async function deleteProfesor(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/profesor/{pk}', {
        params: { path: { pk: id } },
    }));
}

export async function createSedeProfesor(body: CreateSedeProfesor): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/sede-profesor', { body }));
}

export async function deleteSedeProfesor(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/sede-profesor/{pk}', { params: { path: { pk: id } } }));
}

export async function createGradoProfesor(body: CreateGradoProfesor): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/grado-profesor', { body }));
}

export async function deleteGradoProfesor(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/grado-profesor/{pk}', { params: { path: { pk: id } } }));
}

export async function createProfesorCurso(body: CreateProfesorCurso): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/profesor-curso', { body }));
}

export async function deleteProfesorCurso(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/profesor-curso/{pk}', { params: { path: { pk: id } } }));
}

export async function createProfesorDisponibilidad(body: CreateProfesorDisponibilidad): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/profesor-disponibilidad', { body }));
}

export async function deleteProfesorDisponibilidad(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/profesor-disponibilidad/{pk}', { params: { path: { pk: id } } }));
}

export async function createProfesorPreferencia(body: CreateProfesorPreferencia): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/profesor-preferencia', { body }));
}

export async function deleteProfesorPreferencia(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/profesor-preferencia/{pk}', { params: { path: { pk: id } } }));
}

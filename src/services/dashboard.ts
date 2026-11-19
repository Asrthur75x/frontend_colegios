import type { components } from '../lib/api/schema';

import { apiClient, executeRequest } from '../lib/api/client';
import { listAreas, listCursos, listPlanesEstudio } from './catalogs';

type Profesor = components['schemas']['GetProfesorDetail'];
type Sede = components['schemas']['GetSedeDetail'];
type Grado = components['schemas']['GetGradoDetail'];
type Seccion = components['schemas']['GetSeccionDetail'];
type Tutoria = components['schemas']['GetTutoriaDetail'];
type BloqueReservado = components['schemas']['GetBloqueReservadoAnidadoDetail'];
type HorarioFinalCount = components['schemas']['HorarioFinalCountResult'];

export async function getDashboardData() {
    const [profesores, cursos, areas, sedes, grados, secciones, planes, tutorias, reservas] = await Promise.all([
        executeRequest<Profesor[]>(() => apiClient.GET('/api/v1/profesor')),
        listCursos(),
        listAreas(),
        executeRequest<Sede[]>(() => apiClient.GET('/api/v1/sede')),
        executeRequest<Grado[]>(() => apiClient.GET('/api/v1/grado')),
        executeRequest<Seccion[]>(() => apiClient.GET('/api/v1/seccion')),
        listPlanesEstudio(),
        executeRequest<Tutoria[]>(() => apiClient.GET('/api/v1/tutoria')),
        executeRequest<BloqueReservado[]>(() => apiClient.GET('/api/v1/bloque-reservado')),
    ]);

    return { profesores, cursos, areas, sedes, grados, secciones, planes, tutorias, reservas };
}

export async function getHorarioFinalCount(): Promise<number> {
    const result = await executeRequest<HorarioFinalCount>(() => apiClient.GET('/api/v1/horario/final'));
    return result.total_asignaciones;
}

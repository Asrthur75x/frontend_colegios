import type { components } from '../lib/api/schema';
import { apiClient, executeRead, executeRequest } from '../lib/api/client';

export type Tutoria = components['schemas']['GetTutoriaDetail'];
type Seccion = components['schemas']['GetSeccionDetail'];
type Profesor = components['schemas']['GetProfesorDetail'];
type Grado = components['schemas']['GetGradoDetail'];
type Sede = components['schemas']['GetSedeDetail'];
type CreateTutoria = components['schemas']['CreateTutoriaParam'];
type UpdateTutoria = components['schemas']['UpdateTutoriaParam'];

export function listTutorias(): Promise<Tutoria[]> {
    // Fresh after writes and before deciding between create and update.
    return executeRequest<Tutoria[]>(() => apiClient.GET('/api/v1/tutoria'));
}

export async function listTutoriasData() {
    const [secciones, grados, profesores, tutorias, sedes] = await Promise.all([
        executeRead<Seccion[]>('/api/v1/seccion', () => apiClient.GET('/api/v1/seccion')),
        executeRead<Grado[]>('/api/v1/grado', () => apiClient.GET('/api/v1/grado')),
        executeRead<Profesor[]>('/api/v1/profesor', () => apiClient.GET('/api/v1/profesor')),
        executeRead<Tutoria[]>('/api/v1/tutoria', () => apiClient.GET('/api/v1/tutoria')),
        executeRead<Sede[]>('/api/v1/sede', () => apiClient.GET('/api/v1/sede')),
    ]);
    return { secciones, grados, profesores, tutorias, sedes };
}

export async function createTutoria(body: CreateTutoria): Promise<void> {
    await executeRequest<unknown>(() => apiClient.POST('/api/v1/tutoria', { body }));
}

export async function updateTutoria(id: number, body: UpdateTutoria): Promise<void> {
    await executeRequest<unknown>(() => apiClient.PUT('/api/v1/tutoria/{pk}', {
        params: { path: { pk: id } }, body,
    }));
}

export async function deleteTutoria(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/tutoria/{pk}', {
        params: { path: { pk: id } },
    }));
}

export async function assignTutor(
    idSeccion: number,
    idProfesor: number,
    permissions: { canAdd: boolean; canEdit: boolean },
): Promise<void> {
    const actuales = await listTutorias();
    const asignaciones = actuales.filter(t => t.id_seccion === idSeccion);
    if (asignaciones.length > 1) {
        throw new Error('Esta sección tiene varias asignaciones. Quita las adicionales antes de cambiar el tutor.');
    }
    const existente = asignaciones[0];
    if (existente?.id_profesor === idProfesor) return;
    if (existente ? !permissions.canEdit : !permissions.canAdd) {
        throw new Error('No tienes permiso para realizar esta asignación.');
    }
    const body = { id_seccion: idSeccion, id_profesor: idProfesor };
    if (existente) await updateTutoria(existente.id, body);
    else await createTutoria(body);
}

export function summarizeTutorias(secciones: Seccion[], profesores: Profesor[], tutorias: Tutoria[]) {
    const profesorIds = new Set(profesores.map(p => p.id));
    const seccionIds = new Set(secciones.map(s => s.id));
    const porSeccion = new Map<number, Tutoria[]>();
    for (const tutoria of tutorias) {
        if (tutoria.id_seccion == null) continue;
        const asignaciones = porSeccion.get(tutoria.id_seccion) ?? [];
        asignaciones.push(tutoria);
        porSeccion.set(tutoria.id_seccion, asignaciones);
    }
    const completas = secciones.filter(s => {
        const asignaciones = porSeccion.get(s.id) ?? [];
        return asignaciones.length === 1 && profesorIds.has(asignaciones[0].id_profesor ?? -1);
    }).length;
    const duplicadas = secciones.filter(s => (porSeccion.get(s.id)?.length ?? 0) > 1).length;
    const invalidas = tutorias.filter(t => !seccionIds.has(t.id_seccion ?? -1)
        || !profesorIds.has(t.id_profesor ?? -1)).length;
    return { completas, pendientes: secciones.length - completas, duplicadas, invalidas };
}

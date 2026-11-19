import type { components } from '../lib/api/schema';
import { apiClient, executeRead, executeRequest } from '../lib/api/client';

type Sede = components['schemas']['GetSedeDetail'];
type Dia = components['schemas']['GetDiaDetail'];
type Turno = components['schemas']['GetTurnoDetail'];
type Grado = components['schemas']['GetGradoDetail'];
type GradoDiaConfig = components['schemas']['GetGradoDiaConfigDetail'];
export type Reserva = components['schemas']['GetBloqueReservadoAnidadoDetail'];
type CreateReserva = components['schemas']['CreateBloqueReservadoCompletoParam'];

export interface ReservaForm {
    sedes: number[];
    id_dia: string;
    id_turno: string;
    nombre_actividad: string;
    grados: number[];
    opciones_slots: number[][];
}

export async function listReservasData() {
    const [sedes, dias, turnos, grados, configs, reservas] = await Promise.all([
        executeRead<Sede[]>('/api/v1/sede', () => apiClient.GET('/api/v1/sede')),
        executeRead<Dia[]>('/api/v1/dia', () => apiClient.GET('/api/v1/dia')),
        executeRead<Turno[]>('/api/v1/turno', () => apiClient.GET('/api/v1/turno')),
        executeRead<Grado[]>('/api/v1/grado', () => apiClient.GET('/api/v1/grado')),
        executeRead<GradoDiaConfig[]>('/api/v1/grado-dia-config', () => apiClient.GET('/api/v1/grado-dia-config')),
        executeRead<Reserva[]>('/api/v1/bloque-reservado', () => apiClient.GET('/api/v1/bloque-reservado')),
    ]);
    return { sedes, dias, turnos, grados, configs, reservas };
}

export function listReservas(): Promise<Reserva[]> {
    return executeRequest<Reserva[]>(() => apiClient.GET('/api/v1/bloque-reservado'));
}

export function maxBloquesReserva(idDia: number, grados: number[], configs: GradoDiaConfig[]): number {
    return Math.max(0, ...configs.filter(c => c.id_dia === idDia && grados.includes(c.id_grado ?? -1))
        .map(c => c.bloques_dia ?? 0));
}

export function validateReserva(form: ReservaForm, maxBloques: number): Record<string, string> {
    const errors: Record<string, string> = {};
    const validId = (id: number) => Number.isInteger(id) && id > 0;
    if (!form.sedes.length || !form.sedes.every(validId)) errors.sedes = 'Selecciona al menos una sede válida';
    if (!validId(Number(form.id_dia))) errors.id_dia = 'Selecciona un día';
    if (!validId(Number(form.id_turno))) errors.id_turno = 'Selecciona un turno';
    if (!form.nombre_actividad.trim()) errors.nombre_actividad = 'El nombre es obligatorio';
    else if (form.nombre_actividad.trim().length > 256) errors.nombre_actividad = 'El nombre admite hasta 256 caracteres';
    if (!form.grados.length || !form.grados.every(validId)) errors.grados = 'Selecciona al menos un grado válido';
    if (!form.opciones_slots.length || form.opciones_slots.some(op => !op.length)) {
        errors.opciones_slots = 'Todas las alternativas deben tener al menos un bloque seleccionado';
    } else if (!Number.isInteger(maxBloques) || maxBloques < 1) {
        errors.opciones_slots = 'No hay bloques configurados para el día y los grados seleccionados';
    } else {
        const seen = new Set<string>();
        for (const op of form.opciones_slots) {
            const sorted = [...op].sort((a, b) => a - b);
            if (sorted.some(n => !Number.isInteger(n) || n < 1 || n > maxBloques)) {
                errors.opciones_slots = 'Hay bloques fuera de la configuración actual. Revisa las alternativas';
                break;
            }
            if (sorted.some((n, i) => i > 0 && n - sorted[i - 1] !== 1)) {
                errors.opciones_slots = 'Los bloques de cada alternativa deben ser consecutivos y no repetirse';
                break;
            }
            const key = sorted.join(',');
            if (seen.has(key)) {
                errors.opciones_slots = 'No puedes crear alternativas idénticas con los mismos bloques';
                break;
            }
            seen.add(key);
        }
    }
    return errors;
}

export function buildReservaPayloads(form: ReservaForm, maxBloques: number): CreateReserva[] {
    const errors = validateReserva(form, maxBloques);
    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
    return [...new Set(form.sedes)].map(id_sede => ({
        id_sede, id_dia: Number(form.id_dia), id_turno: Number(form.id_turno),
        nombre: form.nombre_actividad.trim(), grados: [...new Set(form.grados)],
        opciones: form.opciones_slots.map((op, i) => ({
            nro_opcion: i + 1, nombre: form.nombre_actividad.trim(),
            slots: [...op].sort((a, b) => a - b).map(nro_bloque => ({ nro_bloque })),
        })),
    }));
}

export async function createReservas(payloads: CreateReserva[]) {
    const saved: number[] = [];
    const failed: { id_sede: number; message: string }[] = [];
    for (const body of payloads) {
        try {
            await executeRequest<unknown>(() => apiClient.POST('/api/v1/bloque-reservado', { body }));
            saved.push(body.id_sede);
        } catch (error) {
            failed.push({ id_sede: body.id_sede, message: error instanceof Error ? error.message : 'No se pudo guardar la actividad' });
        }
    }
    return { saved, failed };
}

export async function deleteReserva(id: number): Promise<void> {
    await executeRequest<unknown>(() => apiClient.DELETE('/api/v1/bloque-reservado/{pk}', {
        params: { path: { pk: id } },
    }));
}

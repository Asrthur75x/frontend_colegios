import { apiClient, executeRequest } from '../lib/api/client';
import type { components } from '../lib/api/schema';

type SeccionTurno = components['schemas']['GetSeccionTurnoDetail'];

export function listSeccionTurnos(): Promise<SeccionTurno[]> {
    return executeRequest<SeccionTurno[]>(() => apiClient.GET('/api/v1/seccion-turno'));
}

import createClient from 'openapi-fetch';
import { cachedRead, invalidateReads } from './read-cache';

import type { paths } from './schema';
import {
    clearSession,
    getSession,
    isAccessTokenExpired,
    updateSessionTokens,
} from '../auth/session';

interface ApiEnvelope<T> {
    code: number;
    msg: string;
    data?: T | null;
}

interface ApiResult<T> {
    data?: ApiEnvelope<T>;
    error?: unknown;
    response: Response;
}

export class ApiError extends Error {
    readonly status: number;
    readonly details: unknown;
    readonly retryAfter: number | null;

    constructor(message: string, status = 0, details: unknown = null, retryAfter: number | null = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
        this.retryAfter = retryAfter;
    }
}

const apiOrigin = (import.meta.env.PUBLIC_API_ORIGIN ?? '').replace(/\/$/, '');

export const apiClient = createClient<paths>({ baseUrl: apiOrigin });
const publicClient = createClient<paths>({ baseUrl: apiOrigin });

apiClient.use({
    onResponse({ request, response }) {
        if (response.ok && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
            invalidateReads();
        }
        return response;
    },
    onRequest({ request, schemaPath }) {
        const session = getSession();
        if (!session) return request;

        request.headers.set('Authorization', `Bearer ${session.accessToken}`);
        if (!schemaPath.startsWith('/api/v1/platform/')) {
            request.headers.set('X-Tenant-ID', session.user.schema_name);
        }
        return request;
    },
});

let refreshPromise: Promise<boolean> | null = null;

function readError(result: ApiResult<unknown>): ApiError {
    const payload = result.error as Partial<ApiEnvelope<unknown>> | undefined;
    const message = payload?.msg || `La solicitud fallo (${result.response.status})`;
    const retryAfter = result.response.headers.get('Retry-After');
    const detail = result.response.status === 429 && retryAfter && /^\d+$/.test(retryAfter)
        ? `${message}. Espera ${retryAfter} segundos antes de volver a cargar.`
        : message;
    return new ApiError(detail, result.response.status, payload?.data ?? payload ?? null,
        retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : null);
}

export function unwrapResponse<T>(result: ApiResult<T>): T {
    if (!result.response.ok || result.error) {
        throw readError(result);
    }

    const envelope = result.data;
    if (!envelope || envelope.code < 200 || envelope.code >= 300) {
        throw new ApiError(envelope?.msg || 'Respuesta invalida del servidor', envelope?.code || result.response.status);
    }
    return envelope.data as T;
}

export async function refreshSession(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        const session = getSession();
        if (!session?.refreshToken) return false;

        const result = await publicClient.POST('/api/v1/auth/refresh', {
            body: { refresh_token: session.refreshToken },
        });
        if (!result.response.ok || result.error || !result.data?.data) {
            clearSession();
            return false;
        }
        updateSessionTokens(result.data.data);
        return true;
    })().catch(() => {
        clearSession();
        return false;
    }).finally(() => {
        refreshPromise = null;
    });

    return refreshPromise;
}

export async function executeRequest<T>(operation: () => Promise<ApiResult<T>>, allowRefresh = true): Promise<T> {
    if (allowRefresh && isAccessTokenExpired()) {
        const refreshed = await refreshSession();
        if (!refreshed) throw new ApiError('Tu sesion ha expirado', 401);
    }

    let result = await operation();
    if (allowRefresh && result.response.status === 401) {
        const refreshed = await refreshSession();
        if (!refreshed) throw new ApiError('Tu sesion ha expirado', 401);
        result = await operation();
    }
    return unwrapResponse(result);
}

export { publicClient };

// Cache only explicit catalog reads; mutations and live progress always use executeRequest.
export function executeRead<T>(path: string, operation: () => Promise<ApiResult<T>>): Promise<T> {
    const session = getSession();
    if (!session || isAccessTokenExpired()) return executeRequest(operation);
    const scope = JSON.stringify([
        apiOrigin, session.user.schema_name, session.user.id, session.refreshTokenExpiresAt,
    ]);
    return cachedRead(scope, path, () => executeRequest(operation));
}

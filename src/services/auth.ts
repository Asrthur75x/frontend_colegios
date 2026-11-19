import type { components } from '../lib/api/schema';

import { apiClient, executeRequest, publicClient, unwrapResponse } from '../lib/api/client';
import { clearSession, saveSession } from '../lib/auth/session';

type LoginCredentials = components['schemas']['app__horarios__schema__token_schema__LoginParam'];
type LoginData = components['schemas']['app__horarios__schema__token_schema__GetLoginToken'];

export async function login(credentials: LoginCredentials): Promise<LoginData> {
    const result = await publicClient.POST('/api/v1/auth/login', { body: credentials });
    const data = unwrapResponse<LoginData>(result);
    saveSession(data);
    return data;
}

export async function logout(): Promise<void> {
    try {
        await executeRequest<unknown>(() => apiClient.POST('/api/v1/auth/logout'));
    } finally {
        clearSession();
    }
}

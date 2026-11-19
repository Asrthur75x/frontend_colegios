import { invalidateReads } from '../api/read-cache';
import type { components } from '../api/schema';

type LoginData = components['schemas']['app__horarios__schema__token_schema__GetLoginToken'];
type RefreshedTokens = components['schemas']['app__horarios__schema__token_schema__GetNewToken'];
export type AuthUser = components['schemas']['GetUserInfo'];

export interface AuthSession {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    user: AuthUser;
}

const SESSION_KEY = 'horarix.auth.session.v1';
const SESSION_EVENT = 'horarix:session-changed';

function getStorage(): Storage | null {
    return typeof window === 'undefined' ? null : window.sessionStorage;
}

function parseDate(value: string): number {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function notifySessionChanged(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SESSION_EVENT));
    }
}

export function getSession(): AuthSession | null {
    const storage = getStorage();
    const rawSession = storage?.getItem(SESSION_KEY);
    if (!rawSession) return null;

    try {
        const session = JSON.parse(rawSession) as AuthSession;
        if (!session.accessToken || !session.refreshToken || !session.user?.schema_name) {
            clearSession();
            return null;
        }
        return session;
    } catch {
        clearSession();
        return null;
    }
}

export function saveSession(data: LoginData): AuthSession {
    invalidateReads();
    const session: AuthSession = {
        accessToken: data.access_token,
        accessTokenExpiresAt: data.access_token_expire_time,
        refreshToken: data.refresh_token,
        refreshTokenExpiresAt: data.refresh_token_expire_time,
        user: data.user,
    };

    getStorage()?.setItem(SESSION_KEY, JSON.stringify(session));
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('user');
    }
    notifySessionChanged();
    return session;
}

export function updateSessionTokens(tokens: RefreshedTokens): AuthSession | null {
    const current = getSession();
    if (!current) return null;

    const updated: AuthSession = {
        ...current,
        accessToken: tokens.access_token,
        accessTokenExpiresAt: tokens.access_token_expire_time,
        refreshToken: tokens.refresh_token,
        refreshTokenExpiresAt: tokens.refresh_token_expire_time,
    };
    getStorage()?.setItem(SESSION_KEY, JSON.stringify(updated));
    notifySessionChanged();
    return updated;
}

export function clearSession(): void {
    invalidateReads();
    getStorage()?.removeItem(SESSION_KEY);
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem('user');
    }
    notifySessionChanged();
}

export function hasUsableSession(): boolean {
    const session = getSession();
    return Boolean(session && parseDate(session.refreshTokenExpiresAt) > Date.now());
}

export function isAccessTokenExpired(): boolean {
    const session = getSession();
    return !session || parseDate(session.accessTokenExpiresAt) <= Date.now();
}

export function hasPermission(permission: string): boolean {
    return getSession()?.user.perms.includes(permission) ?? false;
}

export { SESSION_EVENT };

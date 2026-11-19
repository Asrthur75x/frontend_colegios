const PREFIX = 'horarix.api.read.v1:';
const TTL_MS = 60_000;
const pending = new Map<string, Promise<unknown>>();
let generation = 0;

function storage(): Storage | null {
    try { return typeof window === 'undefined' ? null : window.sessionStorage; }
    catch { return null; }
}

export function invalidateReads(): void {
    generation += 1;
    pending.clear();
    const store = storage();
    if (!store) return;
    try {
        for (let i = store.length - 1; i >= 0; i -= 1) {
            const key = store.key(i);
            if (key?.startsWith(PREFIX)) store.removeItem(key);
        }
    } catch { /* Storage is optional. */ }
}

export function cachedRead<T>(scope: string, path: string, load: () => Promise<T>): Promise<T> {
    const key = PREFIX + JSON.stringify([scope, path]);
    const store = storage();
    try {
        const raw = store?.getItem(key);
        if (raw) {
            const entry = JSON.parse(raw);
            if (entry.expiresAt > Date.now()) return Promise.resolve(entry.data as T);
            store?.removeItem(key);
        }
    } catch { /* A failed cache read must not prevent the request. */ }

    const existing = pending.get(key);
    if (existing) return existing as Promise<T>;
    const startedGeneration = generation;
    const request = load().then(data => {
        if (startedGeneration === generation) {
            try { store?.setItem(key, JSON.stringify({ expiresAt: Date.now() + TTL_MS, data })); }
            catch { /* Storage is optional. */ }
        }
        return data;
    }).finally(() => {
        if (pending.get(key) === request) pending.delete(key);
    });
    pending.set(key, request);
    return request;
}

import { getApiOrigin, getV1BaseUrl } from '@/src/config/api-url';
import { clearSession, getAccessToken, getRefreshToken, saveSession } from '@/src/auth/session';
import { parseAuthUser } from '@/src/auth/types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const msg = (body as { message?: unknown }).message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (Array.isArray(msg) && msg.length > 0) return msg.map(String).join(', ');
  return fallback;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    return messageFromBody(await res.json(), fallback);
  } catch {
    return fallback;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;
      const res = await fetch(`${getV1BaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const body = (await res.json()) as { accessToken?: string; refreshToken?: string; user?: unknown };
      if (!body.accessToken || !body.refreshToken) return false;
      await saveSession(
        { accessToken: body.accessToken, refreshToken: body.refreshToken },
        parseAuthUser(body.user),
      );
      return true;
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function isAuthPath(path: string): boolean {
  return /\/auth\/(login|login-with-token|refresh|logout|forgot-password|reset-password)/.test(path);
}

/** Fetch the same Nest API the tenant web app uses. Authenticated calls send the mobile bearer token. */
export async function apiFetch(path: string, init?: RequestInit, auth = true): Promise<Response> {
  const url = path.startsWith('http') ? path : `${getApiOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (auth) {
    const token = await getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError(0, `Could not reach ${getApiOrigin()}. Check your connection.`);
  }
  if (res.status === 401 && auth && !isAuthPath(path) && (await refreshSession())) {
    const retryHeaders = new Headers(headers);
    const token = await getAccessToken();
    if (token) retryHeaders.set('Authorization', `Bearer ${token}`);
    res = await fetch(url, { ...init, headers: retryHeaders });
  }
  if (res.status === 401 && auth && !isAuthPath(path)) {
    await clearSession();
  }
  return res;
}

export async function apiJson<T>(path: string, init?: RequestInit, auth = true): Promise<T> {
  const res = await apiFetch(path, init, auth);
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    throw new ApiError(res.status, await readError(res, `Request failed (${res.status})`));
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function collectPages<T>(
  loadPage: (page: number, pageSize: number) => Promise<{ items: T[]; hasMore: boolean }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const { items, hasMore } = await loadPage(page, 100);
    rows.push(...items);
    if (!hasMore || items.length === 0) break;
  }
  return rows;
}

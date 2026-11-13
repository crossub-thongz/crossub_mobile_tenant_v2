import { ApiError, fetchWithBearer } from '@/src/api/client';
import { getApiOrigin } from '@/src/config/api-url';

export { ApiError };

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

/**
 * Routes outside the mobile contract (password reset, open-viewing check-in, file bytes).
 * Authenticated calls use the same bearer fetch as `createCrossubClient`.
 */
export async function apiFetch(path: string, init?: RequestInit, auth = true): Promise<Response> {
  const url = path.startsWith('http') ? path : `${getApiOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(init?.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  try {
    if (!auth) return await fetch(url, { ...init, headers });
    return await fetchWithBearer(url, { ...init, headers });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, `Could not reach ${getApiOrigin()}. Check your connection.`);
  }
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

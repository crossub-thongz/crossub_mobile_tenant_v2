import { createCrossubClient } from '@crossub-thongz/api-contract';

import { clearSession, getAccessToken, getRefreshToken, saveSession } from '@/src/auth/session';
import { parseAuthUser } from '@/src/auth/types';
import { getApiOrigin, getV1BaseUrl, isApiOriginUrl } from '@/src/config/api-url';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function messageFrom(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim()) return body.trim();
  if (!body || typeof body !== 'object') return fallback;
  const msg = (body as { message?: unknown }).message;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (Array.isArray(msg) && msg.length > 0) return msg.map(String).join(', ');
  return fallback;
}

function isAuthUrl(url: string): boolean {
  return /\/auth\/(login|login-with-token|refresh|logout|forgot-password|reset-password)(\?|$)/.test(url);
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

async function attachAccessToken(request: Request): Promise<Request> {
  if (!isApiOriginUrl(request.url) || isAuthUrl(request.url)) return request;
  const headers = new Headers(request.headers);
  const token = await getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return new Request(request, { headers });
}

/** Same bearer fetch the inspector app uses: attach the access token, refresh once on 401. */
export async function fetchWithBearer(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const original = input instanceof Request ? input : new Request(input, init);
    if (!isApiOriginUrl(original.url)) return await fetch(original);
    const first = await attachAccessToken(original.clone());
    let res = await fetch(first);
    if (res.status !== 401 || isAuthUrl(first.url)) return res;
    if (!(await refreshSession())) {
      await clearSession();
      return res;
    }
    const retry = await attachAccessToken(original.clone());
    res = await fetch(retry);
    if (res.status === 401) await clearSession();
    return res;
  } catch {
    throw new ApiError(0, `Could not reach ${getApiOrigin()}. Check your connection.`);
  }
}

export const crossub = createCrossubClient({
  baseUrl: getV1BaseUrl(),
  fetch: fetchWithBearer,
});

type CallResult<T> = { data?: T; error?: unknown; response: Response };

export async function unwrap<T>(result: CallResult<T> | Promise<CallResult<T>>): Promise<T> {
  const settled = await result;
  if (settled.response.status === 204) return undefined as T;
  if (settled.response.ok && settled.data !== undefined && !settled.error) return settled.data;
  const fallback = `Request failed (${settled.response.status || 'network'})`;
  throw new ApiError(settled.response.status, messageFrom(settled.error, fallback));
}

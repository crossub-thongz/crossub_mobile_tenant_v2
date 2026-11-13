import { crossub, unwrap } from '@/src/api/client';
import { apiJson } from '@/src/api/http';
import { clearSession, getRefreshToken, saveSession } from '@/src/auth/session';
import { isTenantUser, parseAuthUser, type AuthUser } from '@/src/auth/types';

export async function loginWithPassword(email: string, password: string): Promise<AuthUser> {
  const body = await unwrap(
    await crossub.POST('/auth/login', {
      body: { email: email.trim().toLowerCase(), password },
    }),
  );
  const user = parseAuthUser(body.user);
  if (!body.accessToken || !body.refreshToken || !user) {
    throw new Error('Sign in failed.');
  }
  if (!isTenantUser(user)) {
    throw new Error('This app is for tenants. Staff accounts use the CROSSUB admin portal.');
  }
  await saveSession({ accessToken: body.accessToken, refreshToken: body.refreshToken }, user);
  return user;
}

export async function logoutRequest(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) {
      await unwrap(await crossub.POST('/auth/logout', { body: { refreshToken } }));
    }
  } catch {
    // The local session is cleared either way.
  }
  await clearSession();
}

/** Same public route the tenant web app posts to (`POST /api/auth/forgot-password`). */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiJson(
    '/api/auth/forgot-password',
    { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase() }) },
    false,
  );
}

export async function resetPasswordStatus(token: string): Promise<'ok' | 'used' | 'invalid'> {
  try {
    const body = await apiJson<{ state?: string }>(
      '/api/auth/reset-password/status',
      { method: 'POST', body: JSON.stringify({ token }) },
      false,
    );
    if (body?.state === 'used') return 'used';
    return 'ok';
  } catch (err) {
    const status = err && typeof err === 'object' && 'status' in err ? Number((err as { status: number }).status) : 0;
    if (status === 410) return 'used';
    return 'invalid';
  }
}

export async function submitNewPassword(token: string, newPassword: string): Promise<void> {
  await apiJson(
    '/api/auth/reset-password',
    { method: 'POST', body: JSON.stringify({ token, newPassword }) },
    false,
  );
}

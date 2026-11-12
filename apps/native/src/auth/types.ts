export type AuthUser = {
  id?: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
};

export function parseAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const email = typeof record.email === 'string' ? record.email : '';
  if (!email) return null;
  const role =
    typeof record.role === 'string'
      ? record.role
      : record.role && typeof record.role === 'object' && typeof (record.role as { key?: unknown }).key === 'string'
        ? (record.role as { key: string }).key
        : undefined;
  return {
    id: typeof record.id === 'string' ? record.id : undefined,
    email,
    role,
    firstName: typeof record.firstName === 'string' ? record.firstName : undefined,
    lastName: typeof record.lastName === 'string' ? record.lastName : undefined,
  };
}

export function isTenantUser(user: AuthUser | null): boolean {
  return user?.role === 'TENANT';
}

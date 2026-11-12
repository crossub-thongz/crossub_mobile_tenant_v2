const PASSWORD_MIN = 10;
const PASSWORD_MAX = 128;

type ResetLink = { email: string; used: boolean };

const links = new Map<string, ResetLink>();
const passwords = new Map<string, string>();

export function requestPasswordLink(email: string) {
  const token = `reset-${Date.now().toString(36)}`;
  links.set(token, { email: email.trim().toLowerCase(), used: false });
  return token;
}

export function passwordFor(email: string) {
  return passwords.get(email.trim().toLowerCase()) ?? null;
}

export type ResetResult = 'ok' | 'used' | 'invalid' | 'short' | 'mismatch';

export function resetPassword(token: string, nextPassword: string, confirmPassword: string): ResetResult {
  const link = links.get(token);
  if (!link) return 'invalid';
  if (link.used) return 'used';
  if (nextPassword.length < PASSWORD_MIN || nextPassword.length > PASSWORD_MAX) return 'short';
  if (nextPassword !== confirmPassword) return 'mismatch';
  passwords.set(link.email, nextPassword);
  link.used = true;
  return 'ok';
}

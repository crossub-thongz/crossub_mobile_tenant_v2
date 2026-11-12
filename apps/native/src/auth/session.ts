import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthUser } from '@/src/auth/types';

const ACCESS_KEY = 'csb_access_token';
const REFRESH_KEY = 'csb_refresh_token';
const USER_KEY = 'csb_auth_user';
const memory = new Map<string, string>();

export type SessionTokens = { accessToken: string; refreshToken: string };

async function read(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? memory.get(key) ?? null;
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value != null) return value;
  } catch {
    // SecureStore is unavailable in some web and test hosts.
  }
  return memory.get(key) ?? null;
}

async function write(key: string, value: string): Promise<void> {
  memory.set(key, value);
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Keep the in-memory copy.
  }
}

async function remove(key: string): Promise<void> {
  memory.delete(key);
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}

export async function getAccessToken(): Promise<string | null> {
  return read(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return read(REFRESH_KEY);
}

export async function loadStoredUser(): Promise<AuthUser | null> {
  const raw = await read(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveSession(tokens: SessionTokens, user: AuthUser | null): Promise<void> {
  await write(ACCESS_KEY, tokens.accessToken);
  await write(REFRESH_KEY, tokens.refreshToken);
  if (user) await write(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await Promise.all([remove(ACCESS_KEY), remove(REFRESH_KEY), remove(USER_KEY)]);
  if (Platform.OS === 'web') globalThis.localStorage?.removeItem('crossub.tenant.session');
}

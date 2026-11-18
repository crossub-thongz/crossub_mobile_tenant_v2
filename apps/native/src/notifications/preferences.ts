import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Notice kinds the tenant API sends. Choices stay on this phone. */
export const NOTICE_TYPE = {
  RENT_DUE: 'RENT_DUE',
  RENT_RECEIVED: 'RENT_RECEIVED',
  MAINTENANCE: 'MAINTENANCE',
  INSPECTION: 'INSPECTION',
  RENT_REVIEW: 'RENT_REVIEW',
  MESSAGE: 'MESSAGE',
  LEASE: 'LEASE',
} as const;

export type NoticeTypeId = (typeof NOTICE_TYPE)[keyof typeof NOTICE_TYPE];

export const NOTICE_TYPE_LABEL: Record<NoticeTypeId, string> = {
  RENT_DUE: 'Rent due',
  RENT_RECEIVED: 'Rent received',
  MAINTENANCE: 'Repairs',
  INSPECTION: 'Inspections',
  RENT_REVIEW: 'Rent review',
  MESSAGE: 'Messages',
  LEASE: 'Lease',
};

const KEY = 'csb_notice_prefs';
const memory = new Map<string, string>();

function emptyPrefs(): Record<NoticeTypeId, boolean> {
  return {
    RENT_DUE: true,
    RENT_RECEIVED: true,
    MAINTENANCE: true,
    INSPECTION: true,
    RENT_REVIEW: true,
    MESSAGE: true,
    LEASE: true,
  };
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? memory.get(KEY) ?? null;
  try {
    const value = await SecureStore.getItemAsync(KEY);
    if (value != null) return value;
  } catch {
    // SecureStore is unavailable on some hosts. The memory copy is the fallback.
  }
  return memory.get(KEY) ?? null;
}

async function writeRaw(value: string): Promise<void> {
  memory.set(KEY, value);
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(KEY, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // The memory copy still applies for this session.
  }
}

export async function loadNoticePrefs(): Promise<Record<NoticeTypeId, boolean>> {
  const prefs = emptyPrefs();
  const raw = await readRaw();
  if (!raw) return prefs;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const id of Object.keys(prefs) as NoticeTypeId[]) {
      if (typeof parsed[id] === 'boolean') prefs[id] = parsed[id];
    }
  } catch {
    return emptyPrefs();
  }
  return prefs;
}

export async function saveNoticePref(id: NoticeTypeId, enabled: boolean): Promise<Record<NoticeTypeId, boolean>> {
  const prefs = await loadNoticePrefs();
  prefs[id] = enabled;
  await writeRaw(JSON.stringify(prefs));
  return prefs;
}

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'csb_device_lock';
let memory = false;

async function readFlag(): Promise<boolean> {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) === '1' || memory;
  try {
    const value = await SecureStore.getItemAsync(KEY);
    if (value != null) return value === '1';
  } catch {
    // Fall through to the memory copy.
  }
  return memory;
}

async function writeFlag(enabled: boolean): Promise<void> {
  memory = enabled;
  const value = enabled ? '1' : '0';
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

export async function deviceLockEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return readFlag();
}

async function localAuth() {
  return import('expo-local-authentication');
}

export async function unlockWithBiometrics(): Promise<boolean> {
  const LocalAuthentication = await localAuth();
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock CROS Tenant',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}

/** Turn device unlock on. Returns an error string, or null once the phone has confirmed it. */
export async function enableDeviceLock(): Promise<string | null> {
  if (Platform.OS === 'web') return 'Biometric unlock runs on the iPhone and Android app.';
  let LocalAuthentication: Awaited<ReturnType<typeof localAuth>>;
  try {
    LocalAuthentication = await localAuth();
  } catch {
    return 'Biometric unlock needs an updated app.';
  }
  const hardware = await LocalAuthentication.hasHardwareAsync();
  if (!hardware) return 'This phone has no biometric unlock.';
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return 'Set up Face ID or a fingerprint in the phone settings first.';
  const confirmed = await unlockWithBiometrics();
  if (!confirmed) return 'Biometric unlock was not confirmed.';
  await writeFlag(true);
  return null;
}

/** Turn device unlock off. Returns an error string, or null once the phone has confirmed it. */
export async function disableDeviceLock(): Promise<string | null> {
  if (Platform.OS === 'web') return 'Biometric unlock runs on the iPhone and Android app.';
  try {
    const confirmed = await unlockWithBiometrics();
    if (!confirmed) return 'Biometric unlock was not confirmed.';
  } catch {
    return 'Biometric unlock needs an updated app.';
  }
  await writeFlag(false);
  return null;
}

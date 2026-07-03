import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IntegrityMode } from '../config';
import { moduleRecord } from './nativeModule';
import {
  canFallbackToMockRuntime,
  getCachedIosKeyId,
  getIntegrityMode,
  iosKeyStorageKey,
  mockIosKeyId,
  setCachedIosKeyId,
} from './shared';
import { assertIosAppAttestSupported } from './iosSupport';

async function loadStoredRealIosKeyId() {
  const stored = await AsyncStorage.getItem(iosKeyStorageKey);
  return stored && stored.trim().length > 0 ? stored : null;
}

async function persistRealIosKeyId(keyId: string) {
  await AsyncStorage.setItem(iosKeyStorageKey, keyId);
}

export async function resetIosKeyId() {
  setCachedIosKeyId(null);
  await AsyncStorage.removeItem(iosKeyStorageKey);
}

export async function ensureIosKeyId(
  mode: IntegrityMode = getIntegrityMode(),
  options: { forceNew?: boolean } = {}
) {
  console.log('[integrity] ensureIosKeyId:start', {
    cached: getCachedIosKeyId(),
    mode,
    forceNew: options.forceNew ?? false,
  });

  if (mode === 'mock') {
    setCachedIosKeyId(mockIosKeyId());
    console.log('[integrity] ensureIosKeyId:mock-mode-using-fixed-key', {
      keyId: getCachedIosKeyId(),
    });
    return getCachedIosKeyId()!;
  }

  if (!options.forceNew && getCachedIosKeyId()) {
    console.log('[integrity] ensureIosKeyId:return-cached', {
      keyId: getCachedIosKeyId(),
    });
    return getCachedIosKeyId()!;
  }

  if (!options.forceNew) {
    const storedKeyId = await loadStoredRealIosKeyId();
    if (storedKeyId) {
      setCachedIosKeyId(storedKeyId);
      console.log('[integrity] ensureIosKeyId:return-stored', {
        keyId: getCachedIosKeyId(),
      });
      return getCachedIosKeyId()!;
    }
  }

  let mod;
  try {
    mod = moduleRecord();
  } catch {
    if (!canFallbackToMockRuntime()) {
      throw new Error(
        "Native module 'ExpoAppIntegrity' is unavailable. Build and run a native app with `npm run ios` or `npm run android` instead of Expo Go, then reinstall the app after native dependency changes."
      );
    }
    setCachedIosKeyId(mockIosKeyId());
    console.log('[integrity] ensureIosKeyId:module-missing-using-mock-key');
    return getCachedIosKeyId()!;
  }

  const generator =
    (mod.generateAppAttestKeyAsync as undefined | (() => Promise<string>)) ??
    (mod.generateKeyAsync as undefined | (() => Promise<string>));

  if (!generator) {
    if (!canFallbackToMockRuntime()) {
      throw new Error('App Attest key generation API is unavailable in this Expo runtime.');
    }
    setCachedIosKeyId(mockIosKeyId());
    console.log('[integrity] ensureIosKeyId:no-generator-using-mock-key');
    return getCachedIosKeyId()!;
  }

  assertIosAppAttestSupported(mod);
  setCachedIosKeyId(await generator());
  await persistRealIosKeyId(getCachedIosKeyId()!);
  console.log('[integrity] ensureIosKeyId:generated', {
    keyId: getCachedIosKeyId(),
  });
  return getCachedIosKeyId()!;
}

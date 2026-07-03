import { requireOptionalNativeModule } from 'expo-modules-core';
import type { AppIntegrityModule } from './types';

function missingModuleError() {
  return new Error(
    "Native module 'ExpoAppIntegrity' is unavailable. Build and run a native app with `npm run ios` or `npm run android` instead of Expo Go, then reinstall the app after native dependency changes."
  );
}

export function moduleRecord(): AppIntegrityModule {
  console.log('[integrity] resolving native module ExpoAppIntegrity');
  const mod =
    requireOptionalNativeModule<AppIntegrityModule>('ExpoAppIntegrity');
  if (!mod) {
    console.log('[integrity] native module ExpoAppIntegrity missing');
    throw missingModuleError();
  }
  console.log('[integrity] native module ExpoAppIntegrity loaded', {
    keys: Object.keys(mod),
  });
  return mod;
}

export function isIntegrityModuleAvailable() {
  try {
    moduleRecord();
    return true;
  } catch {
    return false;
  }
}

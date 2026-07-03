import { isIosPlatform } from './shared';
import type { AppIntegrityModule } from './types';

export function isAppAttestRecoverableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /invalid input provided|invalid key provided/i.test(message);
}

export function wrapIosIntegrityError(phase: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/This feature is not supported on this device/i.test(message)) {
    return new Error(
      `${phase} failed because App Attest is not supported on this device/runtime. Use a physical iPhone or iPad, not Simulator or Expo Go.`
    );
  }
  if (/invalid input provided/i.test(message)) {
    return new Error(
      `${phase} failed with DCError.invalidInput. This usually means the App Attest key is stale, the device/runtime does not support App Attest, or the app signing/entitlement does not match this build.`
    );
  }
  if (/invalid key provided/i.test(message)) {
    return new Error(
      `${phase} failed because iOS rejected the App Attest key. Re-register the App Attest key for this app build and try again.`
    );
  }
  return error instanceof Error ? error : new Error(message);
}

export function assertIosAppAttestSupported(mod: AppIntegrityModule) {
  if (!isIosPlatform()) {
    throw new Error('App Attest is only available on iOS.');
  }
  if (mod.isSupported === false) {
    throw new Error(
      'This feature is not supported on this device. App Attest requires a supported physical iPhone or iPad runtime.'
    );
  }
}

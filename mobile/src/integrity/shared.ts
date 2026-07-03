import { Platform } from 'react-native';
import { mobileConfig, type IntegrityMode } from '../config';
import type { PlatformName } from '../types';

export const iosKeyStorageKey = 'integrity-demo-mobile-ios-key-id';

let cachedIosKeyId: string | null = null;
let mockIosSignCount = 0;

export function getCachedIosKeyId() {
  return cachedIosKeyId;
}

export function setCachedIosKeyId(keyId: string | null) {
  cachedIosKeyId = keyId;
}

export function nextMockIosSignCount() {
  mockIosSignCount += 1;
  return mockIosSignCount;
}

export function getIntegrityMode(): IntegrityMode {
  return mobileConfig.integrityMode;
}

export function getNativePlatform(): PlatformName {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

export function isIosPlatform() {
  return Platform.OS === 'ios';
}

export function canFallbackToMockRuntime() {
  return !mobileConfig.requireNativeRuntime;
}

export function mockIosKeyId() {
  return 'mock-ios-key';
}

export function mockAndroidProof(requestHash: string) {
  return `mock-play-integrity:${requestHash}`;
}

export function formatIosProof(
  keyId: string,
  assertion: string,
  mode: IntegrityMode
) {
  const prefix = mode === 'mock' ? 'mock-ios-assertion' : 'ios-app-attest';
  return `${prefix}:${keyId}:${assertion}`;
}

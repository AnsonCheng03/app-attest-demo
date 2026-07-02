import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";
import { buildRequestHash } from "./hash";
import type { PlatformName } from "./types";

let cachedIosKeyId: string | null = null;
let mockIosSignCount = 0;
const iosKeyStorageKey = "integrity-demo-mobile-ios-key-id";

type AppIntegrityModule = {
  isSupported?: boolean;
  requestPlayIntegrityTokenAsync?: (options: {
    requestHash: string;
  }) => Promise<string>;
  getPlayIntegrityTokenAsync?: (requestHash: string) => Promise<string>;
  generateAppAttestKeyAsync?: () => Promise<string>;
  generateKeyAsync?: () => Promise<string>;
  attestAppAttestKeyAsync?: (options: {
    keyId: string;
    challenge: string;
  }) => Promise<string>;
  attestKeyAsync?: (keyId: string, challenge: string) => Promise<string>;
  generateAssertionAsync?: (options: {
    keyId: string;
    clientDataHash: string;
  }) => Promise<string>;
  assertAppAttestKeyAsync?: (
    keyId: string,
    clientDataHash: string,
  ) => Promise<string>;
};

function missingModuleError() {
  return new Error(
    "Native module 'ExpoAppIntegrity' is unavailable. Build and run a native app with `npm run ios` or `npm run android` instead of Expo Go, then reinstall the app after native dependency changes.",
  );
}

function moduleRecord(): AppIntegrityModule {
  console.log("[integrity] resolving native module ExpoAppIntegrity");
  const mod =
    requireOptionalNativeModule<AppIntegrityModule>("ExpoAppIntegrity");
  if (!mod) {
    console.log("[integrity] native module ExpoAppIntegrity missing");
    throw missingModuleError();
  }
  console.log("[integrity] native module ExpoAppIntegrity loaded", {
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

export function getIntegrityMode(): "mock" | "real" {
  return process.env.EXPO_PUBLIC_INTEGRITY_MODE === "real" ? "real" : "mock";
}

export function getNativePlatform(): PlatformName {
  return Platform.OS === "ios" ? "ios" : "android";
}

function mockIosKeyId() {
  return "mock-ios-key";
}

function isAppAttestRecoverableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /invalid input provided|invalid key provided/i.test(message);
}

function wrapIosIntegrityError(phase: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/This feature is not supported on this device/i.test(message)) {
    return new Error(
      `${phase} failed because App Attest is not supported on this device/runtime. Use a physical iPhone or iPad, not Simulator or Expo Go.`,
    );
  }
  if (/invalid input provided/i.test(message)) {
    return new Error(
      `${phase} failed with DCError.invalidInput. This usually means the App Attest key is stale, the device/runtime does not support App Attest, or the app signing/entitlement does not match this build.`,
    );
  }
  if (/invalid key provided/i.test(message)) {
    return new Error(
      `${phase} failed because iOS rejected the App Attest key. Re-register the App Attest key for this app build and try again.`,
    );
  }
  return error instanceof Error ? error : new Error(message);
}

function assertIosAppAttestSupported(mod: AppIntegrityModule) {
  if (Platform.OS !== "ios") {
    throw new Error("App Attest is only available on iOS.");
  }
  if (mod.isSupported === false) {
    throw new Error(
      "This feature is not supported on this device. App Attest requires a supported physical iPhone or iPad runtime.",
    );
  }
}

async function loadStoredRealIosKeyId() {
  const stored = await AsyncStorage.getItem(iosKeyStorageKey);
  return stored && stored.trim().length > 0 ? stored : null;
}

async function persistRealIosKeyId(keyId: string) {
  await AsyncStorage.setItem(iosKeyStorageKey, keyId);
}

export async function resetIosKeyId() {
  cachedIosKeyId = null;
  await AsyncStorage.removeItem(iosKeyStorageKey);
}

export function formatIosProof(
  keyId: string,
  assertion: string,
  mode: "mock" | "real",
) {
  const prefix = mode === "mock" ? "mock-ios-assertion" : "ios-app-attest";
  return `${prefix}:${keyId}:${assertion}`;
}

export async function createAndroidProof(
  method: string,
  path: string,
  bodyHash: string,
  challenge: string,
  mode: "mock" | "real",
) {
  console.log("[integrity] createAndroidProof:start", {
    method,
    path,
    challengePreview: challenge.slice(0, 12),
    mode,
  });
  const requestHash = await buildRequestHash(method, path, bodyHash, challenge);
  console.log("[integrity] createAndroidProof:requestHash", {
    requestHashPreview: requestHash.slice(0, 12),
  });
  if (mode === "mock") {
    console.log("[integrity] createAndroidProof:using-mock");
    return `mock-play-integrity:${requestHash}`;
  }

  const mod = moduleRecord();
  const getToken =
    (mod.requestPlayIntegrityTokenAsync as
      | undefined
      | ((options: { requestHash: string }) => Promise<string>)) ??
    (mod.getPlayIntegrityTokenAsync as
      | undefined
      | ((requestHash: string) => Promise<string>));

  if (!getToken) {
    throw new Error("Play Integrity API is unavailable in this Expo runtime.");
  }

  let token: string;
  try {
    token = await (
      getToken as (options: { requestHash: string }) => Promise<string>
    )({ requestHash });
  } catch {
    console.log("[integrity] createAndroidProof:fallback-signature");
    token = await (getToken as (requestHash: string) => Promise<string>)(
      requestHash,
    );
  }

  console.log("[integrity] createAndroidProof:done", {
    tokenPreview: token.slice(0, 12),
  });
  return token;
}

export async function ensureIosKeyId(
  mode: "mock" | "real" = getIntegrityMode(),
  options: { forceNew?: boolean } = {},
) {
  console.log("[integrity] ensureIosKeyId:start", {
    cached: cachedIosKeyId,
    mode,
    forceNew: options.forceNew ?? false,
  });
  if (mode === "mock") {
    cachedIosKeyId = mockIosKeyId();
    console.log("[integrity] ensureIosKeyId:mock-mode-using-fixed-key", {
      keyId: cachedIosKeyId,
    });
    return cachedIosKeyId;
  }

  if (!options.forceNew && cachedIosKeyId) {
    console.log("[integrity] ensureIosKeyId:return-cached", {
      keyId: cachedIosKeyId,
    });
    return cachedIosKeyId;
  }

  if (!options.forceNew) {
    const storedKeyId = await loadStoredRealIosKeyId();
    if (storedKeyId) {
      cachedIosKeyId = storedKeyId;
      console.log("[integrity] ensureIosKeyId:return-stored", {
        keyId: cachedIosKeyId,
      });
      return cachedIosKeyId;
    }
  }

  let mod: AppIntegrityModule;
  try {
    mod = moduleRecord();
  } catch {
    cachedIosKeyId = mockIosKeyId();
    console.log("[integrity] ensureIosKeyId:module-missing-using-mock-key");
    return cachedIosKeyId;
  }

  const generator =
    (mod.generateAppAttestKeyAsync as undefined | (() => Promise<string>)) ??
    (mod.generateKeyAsync as undefined | (() => Promise<string>));

  if (!generator) {
    cachedIosKeyId = mockIosKeyId();
    console.log("[integrity] ensureIosKeyId:no-generator-using-mock-key");
    return cachedIosKeyId;
  }

  assertIosAppAttestSupported(mod);
  cachedIosKeyId = await generator();
  await persistRealIosKeyId(cachedIosKeyId);
  console.log("[integrity] ensureIosKeyId:generated", {
    keyId: cachedIosKeyId,
  });
  return cachedIosKeyId;
}

export async function createIosAttestationObject(
  challenge: string,
  keyId: string,
  mode: "mock" | "real",
) {
  console.log("[integrity] createIosAttestationObject:start", {
    challengePreview: challenge.slice(0, 12),
    keyId,
    mode,
  });
  if (mode === "mock") {
    console.log("[integrity] createIosAttestationObject:using-mock");
    return `mock-ios-attestation:${challenge}:${keyId}`;
  }

  const mod = moduleRecord();
  assertIosAppAttestSupported(mod);
  const attestor =
    (mod.attestAppAttestKeyAsync as
      | undefined
      | ((options: { keyId: string; challenge: string }) => Promise<string>)) ??
    (mod.attestKeyAsync as
      | undefined
      | ((keyId: string, challenge: string) => Promise<string>));

  if (!attestor) {
    throw new Error(
      "App Attest attestation API is unavailable in this Expo runtime.",
    );
  }

  try {
    if (attestor.length === 2) {
      const result = await (attestor as (first: string, second: string) => Promise<string>)(
        keyId,
        challenge,
      );
      console.log("[integrity] createIosAttestationObject:done", {
        attestationPreview: result.slice(0, 12),
      });
      return result;
    }

    const result = await (
      attestor as (options: {
        keyId: string;
        challenge: string;
      }) => Promise<string>
    )({ keyId, challenge });
    console.log("[integrity] createIosAttestationObject:done", {
      attestationPreview: result.slice(0, 12),
    });
    return result;
  } catch (error) {
    throw wrapIosIntegrityError("App Attest registration", error);
  }
}

export async function createIosAssertion(
  method: string,
  path: string,
  bodyHash: string,
  challenge: string,
  keyId: string,
  mode: "mock" | "real",
) {
  console.log("[integrity] createIosAssertion:start", {
    method,
    path,
    challengePreview: challenge.slice(0, 12),
    keyId,
    mode,
  });
  const requestHash = await buildRequestHash(method, path, bodyHash, challenge);
  console.log("[integrity] createIosAssertion:requestHash", {
    requestHashPreview: requestHash.slice(0, 12),
  });
  if (mode === "mock") {
    mockIosSignCount += 1;
    console.log("[integrity] createIosAssertion:using-mock", {
      signCount: mockIosSignCount,
    });
    return `${requestHash}|${mockIosSignCount}`;
  }

  const mod = moduleRecord();
  assertIosAppAttestSupported(mod);
  const asserter =
    (mod.generateAssertionAsync as
      | undefined
      | ((options: {
          keyId: string;
          clientDataHash: string;
        }) => Promise<string>)) ??
    (mod.assertAppAttestKeyAsync as
      | undefined
      | ((keyId: string, clientDataHash: string) => Promise<string>));

  if (!asserter) {
    throw new Error(
      "App Attest assertion API is unavailable in this Expo runtime.",
    );
  }

  try {
    if (asserter.length === 2) {
      const result = await (asserter as (first: string, second: string) => Promise<string>)(
        keyId,
        requestHash,
      );
      console.log("[integrity] createIosAssertion:done", {
        assertionPreview: result.slice(0, 12),
      });
      return result;
    }

    const result = await (
      asserter as (options: {
        keyId: string;
        clientDataHash: string;
      }) => Promise<string>
    )({
      keyId,
      clientDataHash: requestHash,
    });
    console.log("[integrity] createIosAssertion:done", {
      assertionPreview: result.slice(0, 12),
    });
    return result;
  } catch (error) {
    if (isAppAttestRecoverableError(error)) {
      throw new Error(
        "App Attest assertion failed on the device. The stored key may be stale for this app build. Re-run 'Register iOS App Attest key' first.",
      );
    }
    throw wrapIosIntegrityError("App Attest assertion", error);
  }
}

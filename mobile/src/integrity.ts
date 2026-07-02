import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";
import { buildRequestHash } from "./hash";
import type { PlatformName } from "./types";

let cachedIosKeyId: string | null = null;
let mockIosSignCount = 0;

type AppIntegrityModule = {
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

export async function ensureIosKeyId() {
  console.log("[integrity] ensureIosKeyId:start", {
    cached: cachedIosKeyId,
  });
  if (cachedIosKeyId) {
    console.log("[integrity] ensureIosKeyId:return-cached", {
      keyId: cachedIosKeyId,
    });
    return cachedIosKeyId;
  }

  let mod: AppIntegrityModule;
  try {
    mod = moduleRecord();
  } catch {
    cachedIosKeyId = "mock-ios-key";
    console.log("[integrity] ensureIosKeyId:module-missing-using-mock-key");
    return cachedIosKeyId;
  }

  const generator =
    (mod.generateAppAttestKeyAsync as undefined | (() => Promise<string>)) ??
    (mod.generateKeyAsync as undefined | (() => Promise<string>));

  if (!generator) {
    cachedIosKeyId = "mock-ios-key";
    console.log("[integrity] ensureIosKeyId:no-generator-using-mock-key");
    return cachedIosKeyId;
  }

  cachedIosKeyId = await generator();
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
}

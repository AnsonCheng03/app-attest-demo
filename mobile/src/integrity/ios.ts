import type { IntegrityMode } from '../config';
import { buildRequestHash } from '../hash';
import { moduleRecord } from './nativeModule';
import { assertIosAppAttestSupported, isAppAttestRecoverableError, wrapIosIntegrityError } from './iosSupport';
import { formatIosProof, nextMockIosSignCount } from './shared';

export { formatIosProof } from './shared';

export async function createIosAttestationObject(
  challenge: string,
  keyId: string,
  mode: IntegrityMode
) {
  console.log('[integrity] createIosAttestationObject:start', {
    challengePreview: challenge.slice(0, 12),
    keyId,
    mode,
  });
  if (mode === 'mock') {
    console.log('[integrity] createIosAttestationObject:using-mock');
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
    throw new Error('App Attest attestation API is unavailable in this Expo runtime.');
  }

  try {
    if (attestor.length === 2) {
      const result = await (attestor as (first: string, second: string) => Promise<string>)(
        keyId,
        challenge
      );
      console.log('[integrity] createIosAttestationObject:done', {
        attestationPreview: result.slice(0, 12),
      });
      return result;
    }

    const result = await (
      attestor as (options: { keyId: string; challenge: string }) => Promise<string>
    )({ keyId, challenge });
    console.log('[integrity] createIosAttestationObject:done', {
      attestationPreview: result.slice(0, 12),
    });
    return result;
  } catch (error) {
    throw wrapIosIntegrityError('App Attest registration', error);
  }
}

export async function createIosAssertion(
  method: string,
  path: string,
  bodyHash: string,
  challenge: string,
  keyId: string,
  mode: IntegrityMode
) {
  console.log('[integrity] createIosAssertion:start', {
    method,
    path,
    challengePreview: challenge.slice(0, 12),
    keyId,
    mode,
  });
  const requestHash = await buildRequestHash(method, path, bodyHash, challenge);
  console.log('[integrity] createIosAssertion:requestHash', {
    requestHashPreview: requestHash.slice(0, 12),
  });

  if (mode === 'mock') {
    const signCount = nextMockIosSignCount();
    console.log('[integrity] createIosAssertion:using-mock', { signCount });
    return `${requestHash}|${signCount}`;
  }

  const mod = moduleRecord();
  assertIosAppAttestSupported(mod);
  const asserter =
    (mod.generateAssertionAsync as
      | undefined
      | ((options: { keyId: string; clientDataHash: string }) => Promise<string>)) ??
    (mod.assertAppAttestKeyAsync as
      | undefined
      | ((keyId: string, clientDataHash: string) => Promise<string>));

  if (!asserter) {
    throw new Error('App Attest assertion API is unavailable in this Expo runtime.');
  }

  try {
    if (asserter.length === 2) {
      const result = await (asserter as (first: string, second: string) => Promise<string>)(
        keyId,
        requestHash
      );
      console.log('[integrity] createIosAssertion:done', {
        assertionPreview: result.slice(0, 12),
      });
      return result;
    }

    const result = await (
      asserter as (options: { keyId: string; clientDataHash: string }) => Promise<string>
    )({
      keyId,
      clientDataHash: requestHash,
    });
    console.log('[integrity] createIosAssertion:done', {
      assertionPreview: result.slice(0, 12),
    });
    return result;
  } catch (error) {
    if (isAppAttestRecoverableError(error)) {
      throw new Error(
        "App Attest assertion failed on the device. The stored key may be stale for this app build. Re-run 'Register iOS App Attest key' first."
      );
    }
    throw wrapIosIntegrityError('App Attest assertion', error);
  }
}

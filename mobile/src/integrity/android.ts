import type { IntegrityMode } from '../config';
import { buildRequestHash } from '../hash';
import { moduleRecord } from './nativeModule';
import { canFallbackToMockRuntime, mockAndroidProof } from './shared';

export async function createAndroidProof(
  method: string,
  path: string,
  bodyHash: string,
  challenge: string,
  mode: IntegrityMode
) {
  console.log('[integrity] createAndroidProof:start', {
    method,
    path,
    challengePreview: challenge.slice(0, 12),
    mode,
  });
  const requestHash = await buildRequestHash(method, path, bodyHash, challenge);
  console.log('[integrity] createAndroidProof:requestHash', {
    requestHashPreview: requestHash.slice(0, 12),
  });

  if (mode === 'mock') {
    console.log('[integrity] createAndroidProof:using-mock');
    return mockAndroidProof(requestHash);
  }

  let mod;
  try {
    mod = moduleRecord();
  } catch (error) {
    if (canFallbackToMockRuntime()) {
      console.log('[integrity] createAndroidProof:module-missing-fallback-mock', {
        error: error instanceof Error ? error.message : String(error),
      });
      return mockAndroidProof(requestHash);
    }
    throw error;
  }

  const getToken =
    (mod.requestPlayIntegrityTokenAsync as
      | undefined
      | ((options: { requestHash: string }) => Promise<string>)) ??
    (mod.getPlayIntegrityTokenAsync as
      | undefined
      | ((requestHash: string) => Promise<string>));

  if (!getToken) {
    if (canFallbackToMockRuntime()) {
      console.log('[integrity] createAndroidProof:api-missing-fallback-mock');
      return mockAndroidProof(requestHash);
    }
    throw new Error('Play Integrity API is unavailable in this Expo runtime.');
  }

  let token: string;
  try {
    token = await (
      getToken as (options: { requestHash: string }) => Promise<string>
    )({ requestHash });
  } catch (error) {
    console.log('[integrity] createAndroidProof:fallback-signature');
    try {
      token = await (getToken as (requestHash: string) => Promise<string>)(
        requestHash
      );
    } catch (fallbackError) {
      if (canFallbackToMockRuntime()) {
        console.log(
          '[integrity] createAndroidProof:token-request-failed-fallback-mock',
          {
            error:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError),
            firstError: error instanceof Error ? error.message : String(error),
          }
        );
        return mockAndroidProof(requestHash);
      }
      throw fallbackError;
    }
  }

  console.log('[integrity] createAndroidProof:done', {
    tokenPreview: token.slice(0, 12),
  });
  return token;
}

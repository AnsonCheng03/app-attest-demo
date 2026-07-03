import * as Crypto from 'expo-crypto';

export const loginPath = '/auth/login';

export const saveNotesPath = '/me/data/save-notes';

export async function sha256Base64(input: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
}

export async function buildRequestHash(
  method: string,
  path: string,
  bodyHash: string,
  challenge: string
) {
  return sha256Base64([method, path, bodyHash, challenge].join('\n'));
}

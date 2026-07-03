export type AppIntegrityModule = {
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
    clientDataHash: string
  ) => Promise<string>;
};

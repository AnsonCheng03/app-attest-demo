export type PlatformName = 'android' | 'ios';
export type IntegrityAction = 'login' | 'collectVoucher' | 'useWalletCode';

export interface ChallengeResponse {
  challengeId: string;
  challenge: string;
  expiresAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  integrity: {
    platform: PlatformName;
    challengeId: string;
    proof: string;
  };
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  userId: string;
}

export interface CollectVoucherRequest {
  platform: PlatformName;
  challengeId: string;
  proof: string;
}

export interface CollectVoucherResponse {
  voucherId: string;
  status: string;
}

export interface ProfileResponse {
  userId: string;
  username: string;
  tier: string;
}

export interface HealthResponse {
  status: string;
}

export interface IosRegisterRequest {
  challengeId: string;
  challenge: string;
  keyId: string;
  attestationObject: string;
}

export interface IosRegisterResponse {
  userId: string;
  deviceId: string;
  keyId: string;
  createdAt: string;
}

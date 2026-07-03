export type PlatformName = 'android' | 'ios';
export type IntegrityAction = 'login' | 'saveNotes' | 'useWalletCode';

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

export interface SaveNotesRequest {
  notes: string;
  platform: PlatformName;
  challengeId: string;
  proof: string;
}

export interface SaveNotesResponse {
  status: string;
  notes: string;
}

export interface UserDataResponse {
  userId: string;
  username: string;
  notes: string;
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

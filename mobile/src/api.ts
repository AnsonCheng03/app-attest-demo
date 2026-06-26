import {
  ChallengeResponse,
  CollectVoucherRequest,
  CollectVoucherResponse,
  IntegrityAction,
  IosRegisterRequest,
  IosRegisterResponse,
  LoginRequest,
  LoginResponse,
  PlatformName,
  ProfileResponse,
} from './types';

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export function createChallenge(
  baseUrl: string,
  platform: PlatformName,
  action: IntegrityAction
) {
  return request<ChallengeResponse>(baseUrl, '/integrity/challenge', {
    method: 'POST',
    body: JSON.stringify({ platform, action }),
  });
}

export function registerIosKey(baseUrl: string, body: IosRegisterRequest) {
  return request<IosRegisterResponse>(baseUrl, '/integrity/ios/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function login(baseUrl: string, body: LoginRequest) {
  return request<LoginResponse>(baseUrl, '/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function collectVoucher(
  baseUrl: string,
  token: string,
  voucherId: string,
  body: CollectVoucherRequest
) {
  return request<CollectVoucherResponse>(
    baseUrl,
    `/me/vouchers/${voucherId}/collect`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }
  );
}

export function getProfile(baseUrl: string, token: string) {
  return request<ProfileResponse>(baseUrl, '/me/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

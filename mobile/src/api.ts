import {
  ChallengeResponse,
  HealthResponse,
  IntegrityAction,
  IosRegisterRequest,
  IosRegisterResponse,
  LoginRequest,
  LoginResponse,
  PlatformName,
  SaveNotesRequest,
  SaveNotesResponse,
  UserDataResponse,
} from './types';

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestInit
): Promise<T> {
  const url = `${baseUrl}${path}`;
  const startedAt = Date.now();
  console.log('[api] request:start', {
    method: options.method ?? 'GET',
    url,
    headers: options.headers,
    body: options.body,
  });
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const durationMs = Date.now() - startedAt;
  console.log('[api] request:response', {
    method: options.method ?? 'GET',
    url,
    status: response.status,
    ok: response.ok,
    durationMs,
  });

  if (!response.ok) {
    const body = await response.text();
    console.log('[api] request:error-body', {
      method: options.method ?? 'GET',
      url,
      body,
    });
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }

  const json = (await response.json()) as T;
  console.log('[api] request:success-body', {
    method: options.method ?? 'GET',
    url,
    body: json,
  });
  return json;
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

export function saveNotes(
  baseUrl: string,
  token: string,
  body: SaveNotesRequest
) {
  return request<SaveNotesResponse>(baseUrl, '/me/data/save-notes', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export function getData(baseUrl: string, token: string) {
  return request<UserDataResponse>(baseUrl, '/me/data', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function checkHealth(baseUrl: string) {
  return request<HealthResponse>(baseUrl, '/actuator/health', {
    method: 'GET',
  });
}

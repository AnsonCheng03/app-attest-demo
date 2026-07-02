import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  checkHealth,
  collectVoucher,
  createChallenge,
  getProfile,
  login,
  registerIosKey,
} from '../api';
import { collectVoucherPath, loginPath, sha256Base64 } from '../hash';
import {
  createAndroidProof,
  createIosAssertion,
  createIosAttestationObject,
  ensureIosKeyId,
  formatIosProof,
  getIntegrityMode,
  getNativePlatform,
  isIntegrityModuleAvailable,
  resetIosKeyId,
} from '../integrity';
import type { CollectVoucherRequest, IntegrityAction, PlatformName } from '../types';
import type { LogEntry, LogGroup } from './types';

const inputStorageKey = 'integrity-demo-mobile-inputs';

function previewValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length <= 80) {
      return value;
    }

    return `${value.slice(0, 32)}...${value.slice(-16)} (len=${value.length})`;
  }

  if (Array.isArray(value)) {
    return value.map(previewValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        previewValue(nestedValue),
      ])
    );
  }

  return value;
}

function formatLogIO(input: unknown, output?: unknown) {
  const lines = [`Input: ${JSON.stringify(previewValue(input), null, 2)}`];

  if (output !== undefined) {
    lines.push(`Output: ${JSON.stringify(previewValue(output), null, 2)}`);
  }

  return lines.join('\n');
}

function formatErrorDetail(context: {
  stepTitle?: string;
  stepDetail?: string;
  error: unknown;
}) {
  const message =
    context.error instanceof Error ? context.error.message : String(context.error);

  return [
    `Failed at: ${context.stepTitle ?? 'unknown step'}`,
    context.stepDetail ? `Last detail: ${context.stepDetail}` : undefined,
    `Error: ${message}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function isRecoverableIosRegistrationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /stale|invalidinput|invalid input|invalid key/i.test(message);
}

export function useIntegrityDemo() {
  const defaultApiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const requireNativeRuntime =
    process.env.EXPO_PUBLIC_REQUIRE_NATIVE_RUNTIME === 'true';
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('password123');
  const [voucherId, setVoucherId] = useState('voucher-001');
  const [apiBaseUrlInput, setApiBaseUrlInput] = useState(defaultApiBaseUrl);
  const [token, setToken] = useState('');
  const [challengeSummary, setChallengeSummary] = useState('');
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');
  const hasLoadedSavedInputs = useRef(false);

  const apiBaseUrl = apiBaseUrlInput.trim() || defaultApiBaseUrl;
  const integrityMode = getIntegrityMode();
  const nativePlatform = getNativePlatform();
  const integrityModuleAvailable = isIntegrityModuleAvailable();
  const nativeRuntimeRequiredButMissing =
    requireNativeRuntime && !integrityModuleAvailable;

  useEffect(() => {
    let cancelled = false;

    async function loadSavedInputs() {
      try {
        const raw = await AsyncStorage.getItem(inputStorageKey);
        if (!raw || cancelled) {
          return;
        }

        const saved = JSON.parse(raw) as Partial<{
          username: string;
          password: string;
          voucherId: string;
          apiBaseUrlInput: string;
        }>;

        if (typeof saved.username === 'string') {
          setUsername(saved.username);
        }
        if (typeof saved.password === 'string') {
          setPassword(saved.password);
        }
        if (typeof saved.voucherId === 'string') {
          setVoucherId(saved.voucherId);
        }
        if (typeof saved.apiBaseUrlInput === 'string') {
          setApiBaseUrlInput(saved.apiBaseUrlInput);
        }
      } catch (error) {
        console.warn('Failed to load saved mobile inputs', error);
      } finally {
        if (!cancelled) {
          hasLoadedSavedInputs.current = true;
        }
      }
    }

    loadSavedInputs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedSavedInputs.current) {
      return;
    }

    AsyncStorage.setItem(
      inputStorageKey,
      JSON.stringify({
        username,
        password,
        voucherId,
        apiBaseUrlInput,
      })
    ).catch((error) => {
      console.warn('Failed to save mobile inputs', error);
    });
  }, [apiBaseUrlInput, password, username, voucherId]);

  const appendLogEntry = (groupId: string, entry: Omit<LogEntry, 'id'>) => {
    setLogGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              entries: [
                ...group.entries,
                { ...entry, id: `${groupId}-${group.entries.length + 1}` },
              ],
            }
          : group
      )
    );
  };

  const startLogGroup = (title: string, flowTitle: string) => {
    const groupId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextGroup: LogGroup = {
      id: groupId,
      title,
      flowTitle,
      status: 'running',
      entries: [],
    };
    setLogGroups((current) =>
      [nextGroup, ...current].slice(0, 12)
    );
    return groupId;
  };

  const setLogGroupStatus = (
    groupId: string,
    status: LogGroup['status']
  ) => {
    setLogGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, status } : group
      )
    );
  };

  const updateRequestStatus = (title: string, detail?: string) => {
    setRequestStatus(detail ? `${title}: ${detail}` : title);
  };

  const withLoading = async (
    label: string,
    flowTitle: string,
    task: (
      report: (
        title: string,
        detail?: string,
        tone?: LogEntry['tone']
      ) => void
    ) => Promise<void>
  ) => {
    const groupId = startLogGroup(label, flowTitle);
    let lastStepTitle: string | undefined;
    let lastStepDetail: string | undefined;
    setLoading(true);
    updateRequestStatus(label, 'starting');
    try {
      await task((title, detail, tone = 'info') => {
        lastStepTitle = title;
        lastStepDetail = detail;
        updateRequestStatus(title, detail);
        appendLogEntry(groupId, { title, detail, tone });
      });
      appendLogEntry(groupId, {
        title: 'Completed',
        detail: `${label} finished successfully.`,
        tone: 'success',
      });
      setLogGroupStatus(groupId, 'success');
      updateRequestStatus(label, 'done');
    } catch (error) {
      appendLogEntry(groupId, {
        title: 'Request failed',
        detail: formatErrorDetail({
          stepTitle: lastStepTitle,
          stepDetail: lastStepDetail,
          error,
        }),
        tone: 'error',
      });
      setLogGroupStatus(groupId, 'error');
      updateRequestStatus(label, 'failed');
    } finally {
      setLoading(false);
    }
  };

  const onGetChallenge = (action: IntegrityAction) =>
    withLoading(`Get ${action} challenge`, 'Challenge Request', async (report) => {
      const challengeRequest = { platform: nativePlatform, action };
      report(
        '1. Ask backend for a one-time challenge',
        formatLogIO(
          {
            function: 'createChallenge',
            baseUrl: apiBaseUrl,
            request: challengeRequest,
          }
        )
      );
      const response = await createChallenge(
        apiBaseUrl,
        challengeRequest.platform,
        challengeRequest.action
      );
      setChallengeSummary(`${action}: ${response.challengeId}`);
      report(
        '2. Backend returned challenge details',
        formatLogIO(challengeRequest, response)
      );
    });

  const onRegisterIosKey = () =>
    withLoading(
      'Register iOS App Attest key',
      'App Attest Registration',
      async (report) => {
        if (nativePlatform !== 'ios') {
          throw new Error('This registration flow requires an iOS runtime.');
        }

        report(
          '1. Ask backend for a one-time registration challenge',
          formatLogIO(
            {
              function: 'createChallenge',
              baseUrl: apiBaseUrl,
              request: { platform: 'ios', action: 'login' },
            }
          )
        );
        const challenge = await createChallenge(apiBaseUrl, 'ios', 'login');
        report(
          '2. Backend returned the registration challenge',
          formatLogIO({ platform: 'ios', action: 'login' }, challenge)
        );
        report(
          '3. Load or create the App Attest key',
          formatLogIO({
            function: 'ensureIosKeyId',
            integrityMode,
          })
        );
        let keyId = await ensureIosKeyId(integrityMode);
        report(
          '4. Frontend resolved the App Attest key',
          formatLogIO({ integrityMode }, { keyId })
        );
        let attestationInput = {
          function: 'createIosAttestationObject',
          challenge: challenge.challenge,
          keyId,
          integrityMode,
        };
        let attestationObject: string;
        try {
          attestationObject = await createIosAttestationObject(
            challenge.challenge,
            keyId,
            integrityMode
          );
        } catch (error) {
          if (integrityMode !== 'real' || !isRecoverableIosRegistrationError(error)) {
            throw error;
          }
          report(
            '5. Existing App Attest key looked stale; clear it and generate a fresh key',
            formatLogIO(
              { function: 'resetIosKeyId', previousKeyId: keyId },
              { retry: true }
            ),
            'info'
          );
          await resetIosKeyId();
          keyId = await ensureIosKeyId(integrityMode, { forceNew: true });
          report(
            '6. Frontend generated a fresh App Attest key',
            formatLogIO({ integrityMode, forceNew: true }, { keyId }),
            'info'
          );
          attestationInput = {
            function: 'createIosAttestationObject',
            challenge: challenge.challenge,
            keyId,
            integrityMode,
          };
          attestationObject = await createIosAttestationObject(
            challenge.challenge,
            keyId,
            integrityMode
          );
        }
        report(
          '7. Build the App Attest attestation object',
          formatLogIO(attestationInput, { attestationObject })
        );
        const registerRequest = {
          challengeId: challenge.challengeId,
          challenge: challenge.challenge,
          keyId,
          attestationObject,
        };
        report(
          '8. Send keyId + attestation object to backend',
          formatLogIO(
            {
              function: 'registerIosKey',
              baseUrl: apiBaseUrl,
              request: registerRequest,
            }
          )
        );
        const response = await registerIosKey(apiBaseUrl, {
          ...registerRequest,
        });
        report(
          '9. Backend registered the App Attest key',
          formatLogIO(registerRequest, response),
          'success'
        );
      }
    );

  const onAndroidLogin = () =>
    withLoading('Android login', 'Play Integrity Login', async (report) => {
      const challengeRequest = { platform: 'android' as const, action: 'login' as const };
      report(
        '1. Ask backend for a one-time login challenge',
        formatLogIO({
          function: 'createChallenge',
          baseUrl: apiBaseUrl,
          request: challengeRequest,
        })
      );
      const challenge = await createChallenge(apiBaseUrl, 'android', 'login');
      report(
        '2. Backend returned the login challenge',
        formatLogIO(challengeRequest, challenge)
      );
      const loginBody = `username=${username}\npassword=${password}`;
      const bodyHashForLogin = await sha256Base64(
        loginBody
      );
      report(
        '3. Build request-bound hash inputs',
        formatLogIO(
          {
            function: 'sha256Base64',
            input: loginBody,
          },
          { bodyHash: bodyHashForLogin }
        )
      );
      const proofInput = {
        function: 'createAndroidProof',
        method: 'POST',
        path: loginPath,
        bodyHash: bodyHashForLogin,
        challenge: challenge.challenge,
        integrityMode,
      };
      const proof = await createAndroidProof(
        'POST',
        loginPath,
        bodyHashForLogin,
        challenge.challenge,
        integrityMode
      );
      report(
        '4. Request Play Integrity proof from the runtime',
        formatLogIO(proofInput, { proof })
      );
      const loginRequest = {
        username,
        password,
        integrity: {
          platform: 'android' as const,
          challengeId: challenge.challengeId,
          proof,
        },
      };
      report(
        '5. Send login request + integrity proof to backend',
        formatLogIO({
          function: 'login',
          baseUrl: apiBaseUrl,
          request: loginRequest,
        })
      );
      const response = await login(apiBaseUrl, {
        ...loginRequest,
      });
      setToken(response.accessToken);
      report(
        '6. Backend accepted the login',
        formatLogIO(loginRequest, response),
        'success'
      );
    });

  const onIosLogin = () =>
    withLoading('iOS login', 'App Attest Assertion Login', async (report) => {
      const challengeRequest = { platform: 'ios' as const, action: 'login' as const };
      report(
        '1. Ask backend for a fresh assertion challenge',
        formatLogIO({
          function: 'createChallenge',
          baseUrl: apiBaseUrl,
          request: challengeRequest,
        })
      );
      const challenge = await createChallenge(apiBaseUrl, 'ios', 'login');
      report(
        '2. Backend returned the assertion challenge',
        formatLogIO(challengeRequest, challenge)
      );
      report(
        '3. Load the registered App Attest key',
        formatLogIO({
          function: 'ensureIosKeyId',
          integrityMode,
        })
      );
      const keyId = await ensureIosKeyId(integrityMode);
      report('4. Frontend resolved the App Attest key', formatLogIO({ integrityMode }, { keyId }));
      const loginBody = `username=${username}\npassword=${password}`;
      const bodyHashForLogin = await sha256Base64(loginBody);
      report(
        '5. Build request-bound client data hash',
        formatLogIO(
          {
            function: 'sha256Base64',
            input: loginBody,
          },
          { bodyHash: bodyHashForLogin }
        )
      );
      const assertionInput = {
        function: 'createIosAssertion',
        method: 'POST',
        path: loginPath,
        bodyHash: bodyHashForLogin,
        challenge: challenge.challenge,
        keyId,
        integrityMode,
      };
      const assertion = await createIosAssertion(
        'POST',
        loginPath,
        bodyHashForLogin,
        challenge.challenge,
        keyId,
        integrityMode
      );
      report(
        '6. Generate the App Attest assertion',
        formatLogIO(assertionInput, { assertion })
      );
      const proofInput = {
        function: 'formatIosProof',
        keyId,
        assertion,
        integrityMode,
      };
      const proof = formatIosProof(keyId, assertion, integrityMode);
      report(
        '7. Format the iOS proof string',
        formatLogIO(proofInput, { proof })
      );
      const loginRequest = {
        username,
        password,
        integrity: {
          platform: 'ios' as const,
          challengeId: challenge.challengeId,
          proof,
        },
      };
      report(
        '8. Send login request + assertion to backend',
        formatLogIO({
          function: 'login',
          baseUrl: apiBaseUrl,
          request: loginRequest,
        })
      );
      const response = await login(apiBaseUrl, {
        ...loginRequest,
      });
      setToken(response.accessToken);
      report(
        '9. Backend accepted the login',
        formatLogIO(loginRequest, response),
        'success'
      );
    });

  const onCollectVoucher = () =>
    withLoading(
      'Collect voucher',
      nativePlatform === 'ios'
        ? 'App Attest Protected Request'
        : 'Play Integrity Protected Request',
      async (report) => {
        if (!token) {
          throw new Error('Login first before collecting a voucher.');
        }

        const actionPlatform: PlatformName =
          nativePlatform === 'ios' ? 'ios' : 'android';
        const challengeRequest = {
          platform: actionPlatform,
          action: 'collectVoucher' as const,
        };
        report(
          '1. Ask backend for a fresh protected-request challenge',
          formatLogIO({
            function: 'createChallenge',
            baseUrl: apiBaseUrl,
            request: challengeRequest,
          })
        );
        const challenge = await createChallenge(
          apiBaseUrl,
          actionPlatform,
          'collectVoucher'
        );
        const path = collectVoucherPath(voucherId);
        report(
          '2. Backend returned the protected-request challenge',
          formatLogIO(challengeRequest, challenge)
        );
        const emptyBodyHash = await sha256Base64('');
        report(
          '3. Build request-bound hash inputs',
          formatLogIO(
            {
              function: 'sha256Base64',
              input: '',
            },
            {
              path,
              bodyHash: emptyBodyHash,
            }
          )
        );
        let proof: string;

        if (actionPlatform === 'ios') {
          report(
            '4. Load the registered App Attest key',
            formatLogIO({
              function: 'ensureIosKeyId',
              integrityMode,
            })
          );
          const keyId = await ensureIosKeyId(integrityMode);
          report('5. Frontend resolved the App Attest key', formatLogIO({ integrityMode }, { keyId }));
          const assertionInput = {
            function: 'createIosAssertion',
            method: 'POST',
            path,
            bodyHash: emptyBodyHash,
            challenge: challenge.challenge,
            keyId,
            integrityMode,
          };
          const assertion = await createIosAssertion(
            'POST',
            path,
            emptyBodyHash,
            challenge.challenge,
            keyId,
            integrityMode
          );
          report(
            '6. Generate App Attest assertion',
            formatLogIO(assertionInput, { assertion })
          );
          const proofInput = {
            function: 'formatIosProof',
            keyId,
            assertion,
            integrityMode,
          };
          proof = formatIosProof(keyId, assertion, integrityMode);
          report(
            '7. Format the iOS proof string',
            formatLogIO(proofInput, { proof })
          );
        } else {
          const proofInput = {
            function: 'createAndroidProof',
            method: 'POST',
            path,
            bodyHash: emptyBodyHash,
            challenge: challenge.challenge,
            integrityMode,
          };
          proof = await createAndroidProof(
            'POST',
            path,
            emptyBodyHash,
            challenge.challenge,
            integrityMode
          );
          report(
            '4. Request Play Integrity proof from the runtime',
            formatLogIO(proofInput, { proof })
          );
        }

        const collectRequest: CollectVoucherRequest = {
          platform: actionPlatform,
          challengeId: challenge.challengeId,
          proof,
        };
        report(
          actionPlatform === 'ios'
            ? '8. Send voucher request + assertion to backend'
            : '5. Send voucher request + integrity proof to backend',
          formatLogIO({
            function: 'collectVoucher',
            baseUrl: apiBaseUrl,
            token,
            voucherId,
            request: collectRequest,
          })
        );
        const response = await collectVoucher(
          apiBaseUrl,
          token,
          voucherId,
          collectRequest
        );
        report(
          actionPlatform === 'ios'
            ? '9. Backend accepted the protected request'
            : '6. Backend accepted the protected request',
          formatLogIO(collectRequest, response),
          'success'
        );
      }
    );

  const onGetProfile = () =>
    withLoading('Get profile', 'Authenticated Profile Read', async (report) => {
      if (!token) {
        throw new Error('Login first before requesting the profile.');
      }

      report(
        '1. Send authenticated profile request',
        formatLogIO({
          function: 'getProfile',
          baseUrl: apiBaseUrl,
          token,
        })
      );
      report(
        '2. Backend returned the profile',
        formatLogIO({ token }, await getProfile(apiBaseUrl, token)),
        'success'
      );
    });

  const onCheckHealth = () =>
    withLoading('Check backend health', 'Backend Health Check', async (report) => {
      report(
        '1. Send backend health request',
        formatLogIO({
          function: 'checkHealth',
          baseUrl: apiBaseUrl,
        })
      );
      const response = await checkHealth(apiBaseUrl);
      report(
        '2. Backend health response received',
        formatLogIO({ baseUrl: apiBaseUrl }, response),
        'success'
      );
    });

  return {
    actions: {
      onAndroidLogin,
      onCheckHealth,
      onCollectVoucher,
      onGetChallenge,
      onGetProfile,
      onIosLogin,
      onRegisterIosKey,
    },
    apiBaseUrl,
    apiBaseUrlInput,
    challengeSummary,
    integrityMode,
    integrityModuleAvailable,
    loading,
    logGroups,
    nativePlatform,
    nativeRuntimeRequiredButMissing,
    password,
    requestStatus,
    requireNativeRuntime,
    setApiBaseUrlInput,
    setPassword,
    setUsername,
    setVoucherId,
    token,
    username,
    voucherId,
  };
}

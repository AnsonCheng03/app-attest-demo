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
} from '../integrity';
import type { IntegrityAction } from '../types';
import type { LogEntry, LogGroup } from './types';

const inputStorageKey = 'integrity-demo-mobile-inputs';

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
    setLoading(true);
    updateRequestStatus(label, 'starting');
    try {
      await task((title, detail, tone = 'info') => {
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
      const message = error instanceof Error ? error.message : String(error);
      appendLogEntry(groupId, {
        title: 'Request failed',
        detail: message,
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
      report(
        '1. Ask backend for a one-time challenge',
        `Platform: ${nativePlatform}, action: ${action}`
      );
      const response = await createChallenge(apiBaseUrl, nativePlatform, action);
      setChallengeSummary(`${action}: ${response.challengeId}`);
      report(
        '2. Backend returned challenge details',
        `Challenge ID: ${response.challengeId}`
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
          'Backend creates a fresh iOS registration nonce.'
        );
        const challenge = await createChallenge(apiBaseUrl, 'ios', 'login');
        report(
          '2. Load or create the App Attest key',
          'The device returns the keyId without exposing the private key.'
        );
        const keyId = await ensureIosKeyId(integrityMode);
        report(
          '3. Build the App Attest attestation object',
          `Creating attestation for key ${keyId}.`
        );
        const attestationObject = await createIosAttestationObject(
          challenge.challenge,
          keyId,
          integrityMode
        );
        report(
          '4. Send keyId + attestation object to backend',
          'Backend will verify the attestation and store the device key.'
        );
        const response = await registerIosKey(apiBaseUrl, {
          challengeId: challenge.challengeId,
          challenge: challenge.challenge,
          keyId,
          attestationObject,
        });
        report(
          '5. Backend registered the App Attest key',
          `Registered keyId: ${response.keyId}`,
          'success'
        );
      }
    );

  const onAndroidLogin = () =>
    withLoading('Android login', 'Play Integrity Login', async (report) => {
      report(
        '1. Ask backend for a one-time login challenge',
        'Backend issues a fresh challenge for this protected request.'
      );
      const challenge = await createChallenge(apiBaseUrl, 'android', 'login');
      report(
        '2. Build request-bound hash inputs',
        'Hashing the login body so the proof is tied to this request.'
      );
      const bodyHashForLogin = await sha256Base64(
        `username=${username}\npassword=${password}`
      );
      report(
        '3. Request Play Integrity proof from the runtime',
        'The app asks the platform layer for a request-bound proof.'
      );
      const proof = await createAndroidProof(
        'POST',
        loginPath,
        bodyHashForLogin,
        challenge.challenge,
        integrityMode
      );
      report(
        '4. Send login request + integrity proof to backend',
        'Backend can now verify the proof against the protected request.'
      );
      const response = await login(apiBaseUrl, {
        username,
        password,
        integrity: {
          platform: 'android',
          challengeId: challenge.challengeId,
          proof,
        },
      });
      setToken(response.accessToken);
      report(
        '5. Backend accepted the login',
        `Access token received: ${response.accessToken}`,
        'success'
      );
    });

  const onIosLogin = () =>
    withLoading('iOS login', 'App Attest Assertion Login', async (report) => {
      report(
        '1. Ask backend for a fresh assertion challenge',
        'Backend issues a one-time challenge for this protected login.'
      );
      const challenge = await createChallenge(apiBaseUrl, 'ios', 'login');
      report(
        '2. Load the registered App Attest key',
        'Using the previously registered keyId for this device.'
      );
      const keyId = await ensureIosKeyId(integrityMode);
      report(
        '3. Build request-bound client data hash',
        'Hashing the login request body before generating an assertion.'
      );
      const bodyHashForLogin = await sha256Base64(
        `username=${username}\npassword=${password}`
      );
      report(
        '4. Generate the App Attest assertion',
        `Signing the request hash with key ${keyId}.`
      );
      const assertion = await createIosAssertion(
        'POST',
        loginPath,
        bodyHashForLogin,
        challenge.challenge,
        keyId,
        integrityMode
      );
      report(
        '5. Send login request + assertion to backend',
        'Backend verifies the assertion using the stored public key.'
      );
      const response = await login(apiBaseUrl, {
        username,
        password,
        integrity: {
          platform: 'ios',
          challengeId: challenge.challengeId,
          proof: formatIosProof(keyId, assertion, integrityMode),
        },
      });
      setToken(response.accessToken);
      report(
        '6. Backend accepted the login',
        `Access token received: ${response.accessToken}`,
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

        const actionPlatform = nativePlatform === 'ios' ? 'ios' : 'android';
        report(
          '1. Ask backend for a fresh protected-request challenge',
          `Platform: ${actionPlatform}, action: collectVoucher`
        );
        const challenge = await createChallenge(
          apiBaseUrl,
          actionPlatform,
          'collectVoucher'
        );
        const path = collectVoucherPath(voucherId);
        report(
          '2. Build request-bound hash inputs',
          `Preparing proof inputs for ${path}.`
        );
        const emptyBodyHash = await sha256Base64('');
        let proof: string;

        if (actionPlatform === 'ios') {
          report(
            '3. Load the registered App Attest key',
            'The device will use the stored private key for this assertion.'
          );
          const keyId = await ensureIosKeyId(integrityMode);
          report(
            '4. Generate App Attest assertion',
            `Signing the request hash with key ${keyId}.`
          );
          const assertion = await createIosAssertion(
            'POST',
            path,
            emptyBodyHash,
            challenge.challenge,
            keyId,
            integrityMode
          );
          proof = formatIosProof(keyId, assertion, integrityMode);
        } else {
          report(
            '3. Request Play Integrity proof from the runtime',
            'The proof is bound to this collect-voucher request.'
          );
          proof = await createAndroidProof(
            'POST',
            path,
            emptyBodyHash,
            challenge.challenge,
            integrityMode
          );
        }

        report(
          actionPlatform === 'ios'
            ? '5. Send voucher request + assertion to backend'
            : '4. Send voucher request + integrity proof to backend',
          'Backend validates the proof before processing the voucher.'
        );
        const response = await collectVoucher(apiBaseUrl, token, voucherId, {
          platform: actionPlatform,
          challengeId: challenge.challengeId,
          proof,
        });
        report(
          actionPlatform === 'ios'
            ? '6. Backend accepted the protected request'
            : '5. Backend accepted the protected request',
          `Voucher ${response.voucherId}: ${response.status}`,
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
        'This endpoint uses the bearer token and does not require fresh integrity.'
      );
      const response = await getProfile(apiBaseUrl, token);
      report(
        '2. Backend returned the profile',
        `Profile ${response.username} (${response.tier})`,
        'success'
      );
    });

  const onCheckHealth = () =>
    withLoading('Check backend health', 'Backend Health Check', async (report) => {
      report(
        '1. Send backend health request',
        'Checking whether the API is reachable.'
      );
      const response = await checkHealth(apiBaseUrl);
      report(
        '2. Backend health response received',
        `Health: ${response.status}`,
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

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
  const [log, setLog] = useState<string[]>([]);
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

  const pushLog = (line: string) =>
    setLog((current) => [line, ...current].slice(0, 20));

  const updateRequestStatus = (line: string) => {
    setRequestStatus(line);
    pushLog(line);
  };

  const withLoading = async (
    label: string,
    task: (report: (line: string) => void) => Promise<void>
  ) => {
    setLoading(true);
    setRequestStatus(`${label}: starting`);
    try {
      await task((line) => updateRequestStatus(`${label}: ${line}`));
      setRequestStatus(`${label}: done`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRequestStatus(`${label}: failed`);
      pushLog(`ERROR: ${label}: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const onGetChallenge = (action: IntegrityAction) =>
    withLoading(`Get ${action} challenge`, async (report) => {
      report(`requesting challenge for ${nativePlatform}`);
      const response = await createChallenge(apiBaseUrl, nativePlatform, action);
      setChallengeSummary(`${action}: ${response.challengeId}`);
      report(`received challenge ${response.challengeId}`);
      pushLog(`Challenge for ${action}: ${response.challengeId}`);
    });

  const onRegisterIosKey = () =>
    withLoading('Register iOS App Attest key', async (report) => {
      if (nativePlatform !== 'ios') {
        pushLog('iOS registration is only available when the app runs as iOS.');
        return;
      }

      report('requesting registration challenge');
      const challenge = await createChallenge(apiBaseUrl, 'ios', 'login');
      report('ensuring App Attest key exists');
      const keyId = await ensureIosKeyId(integrityMode);
      report(`building attestation object for key ${keyId}`);
      const attestationObject = await createIosAttestationObject(
        challenge.challenge,
        keyId,
        integrityMode
      );
      report('sending attestation to server');
      const response = await registerIosKey(apiBaseUrl, {
        challengeId: challenge.challengeId,
        challenge: challenge.challenge,
        keyId,
        attestationObject,
      });
      report(`server registered key ${response.keyId}`);
      pushLog(`Registered iOS key ${response.keyId}`);
    });

  const onAndroidLogin = () =>
    withLoading('Android login', async (report) => {
      report('requesting login challenge');
      const challenge = await createChallenge(apiBaseUrl, 'android', 'login');
      report('hashing login payload');
      const bodyHashForLogin = await sha256Base64(
        `username=${username}\npassword=${password}`
      );
      report('creating Play Integrity proof');
      const proof = await createAndroidProof(
        'POST',
        loginPath,
        bodyHashForLogin,
        challenge.challenge,
        integrityMode
      );
      report('sending login request');
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
      report('login succeeded and token received');
      pushLog(`Android login token: ${response.accessToken}`);
    });

  const onIosLogin = () =>
    withLoading('iOS login', async (report) => {
      report('requesting login challenge');
      const challenge = await createChallenge(apiBaseUrl, 'ios', 'login');
      report('ensuring App Attest key exists');
      const keyId = await ensureIosKeyId(integrityMode);
      report('hashing login payload');
      const bodyHashForLogin = await sha256Base64(
        `username=${username}\npassword=${password}`
      );
      report(`generating assertion for key ${keyId}`);
      const assertion = await createIosAssertion(
        'POST',
        loginPath,
        bodyHashForLogin,
        challenge.challenge,
        keyId,
        integrityMode
      );
      report('sending login request');
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
      report('login succeeded and token received');
      pushLog(`iOS login token: ${response.accessToken}`);
    });

  const onCollectVoucher = () =>
    withLoading('Collect voucher', async (report) => {
      if (!token) {
        pushLog('Login first to get a bearer token.');
        return;
      }

      const actionPlatform = nativePlatform === 'ios' ? 'ios' : 'android';
      report(`requesting collectVoucher challenge for ${actionPlatform}`);
      const challenge = await createChallenge(
        apiBaseUrl,
        actionPlatform,
        'collectVoucher'
      );
      const path = collectVoucherPath(voucherId);
      report(`preparing request for ${path}`);
      const emptyBodyHash = await sha256Base64('');
      let proof: string;

      if (actionPlatform === 'ios') {
        report('ensuring App Attest key exists');
        const keyId = await ensureIosKeyId(integrityMode);
        report(`generating App Attest assertion for key ${keyId}`);
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
        report('creating Play Integrity proof');
        proof = await createAndroidProof(
          'POST',
          path,
          emptyBodyHash,
          challenge.challenge,
          integrityMode
        );
      }

      report('sending collect voucher request');
      const response = await collectVoucher(apiBaseUrl, token, voucherId, {
        platform: actionPlatform,
        challengeId: challenge.challengeId,
        proof,
      });
      report(`server responded with status ${response.status}`);
      pushLog(`Voucher ${response.voucherId}: ${response.status}`);
    });

  const onGetProfile = () =>
    withLoading('Get profile', async (report) => {
      if (!token) {
        pushLog('Login first to get a bearer token.');
        return;
      }

      report('sending profile request');
      const response = await getProfile(apiBaseUrl, token);
      report(`profile loaded for ${response.username}`);
      pushLog(`Profile ${response.username} (${response.tier})`);
    });

  const onCheckHealth = () =>
    withLoading('Check backend health', async (report) => {
      report('sending health request');
      const response = await checkHealth(apiBaseUrl);
      report(`backend health is ${response.status}`);
      pushLog(`Health: ${response.status}`);
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
    log,
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

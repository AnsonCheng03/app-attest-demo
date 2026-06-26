import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  collectVoucher,
  createChallenge,
  getProfile,
  login,
  registerIosKey,
} from './src/api';
import { collectVoucherPath, loginPath, sha256Base64 } from './src/hash';
import {
  createAndroidProof,
  createIosAssertion,
  createIosAttestationObject,
  ensureIosKeyId,
  formatIosProof,
  getIntegrityMode,
  getNativePlatform,
  isIntegrityModuleAvailable,
} from './src/integrity';

type ActionName = 'login' | 'collectVoucher' | 'useWalletCode';

const inputStorageKey = 'integrity-demo-mobile-inputs';

export default function App() {
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

  const pushLog = (line: string) => setLog((current) => [line, ...current].slice(0, 20));

  const withLoading = async (task: () => Promise<void>) => {
    setLoading(true);
    try {
      await task();
    } catch (error) {
      pushLog(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const onGetChallenge = (action: ActionName) =>
    withLoading(async () => {
      const response = await createChallenge(apiBaseUrl, nativePlatform, action);
      setChallengeSummary(`${action}: ${response.challengeId}`);
      pushLog(`Challenge for ${action}: ${response.challengeId}`);
    });

  const onRegisterIosKey = () =>
    withLoading(async () => {
      if (nativePlatform !== 'ios') {
        pushLog('iOS registration is only available when the app runs as iOS.');
        return;
      }

      const challenge = await createChallenge(apiBaseUrl, 'ios', 'login');
      const keyId = await ensureIosKeyId();
      const attestationObject = await createIosAttestationObject(
        challenge.challenge,
        keyId,
        integrityMode
      );
      const response = await registerIosKey(apiBaseUrl, {
        challengeId: challenge.challengeId,
        challenge: challenge.challenge,
        keyId,
        attestationObject,
      });
      pushLog(`Registered iOS key ${response.keyId}`);
    });

  const onAndroidLogin = () =>
    withLoading(async () => {
      const challenge = await createChallenge(apiBaseUrl, 'android', 'login');
      const bodyHashForLogin = await sha256Base64(
        `username=${username}\npassword=${password}`
      );
      const proof = await createAndroidProof(
        'POST',
        loginPath,
        bodyHashForLogin,
        challenge.challenge,
        integrityMode
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
      pushLog(`Android login token: ${response.accessToken}`);
    });

  const onIosLogin = () =>
    withLoading(async () => {
      const challenge = await createChallenge(apiBaseUrl, 'ios', 'login');
      const keyId = await ensureIosKeyId();
      const bodyHashForLogin = await sha256Base64(
        `username=${username}\npassword=${password}`
      );
      const assertion = await createIosAssertion(
        'POST',
        loginPath,
        bodyHashForLogin,
        challenge.challenge,
        keyId,
        integrityMode
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
      pushLog(`iOS login token: ${response.accessToken}`);
    });

  const onCollectVoucher = () =>
    withLoading(async () => {
      if (!token) {
        pushLog('Login first to get a bearer token.');
        return;
      }

      const actionPlatform = nativePlatform === 'ios' ? 'ios' : 'android';
      const challenge = await createChallenge(
        apiBaseUrl,
        actionPlatform,
        'collectVoucher'
      );
      const path = collectVoucherPath(voucherId);
      const emptyBodyHash = await sha256Base64('');
      let proof: string;

      if (actionPlatform === 'ios') {
        const keyId = await ensureIosKeyId();
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
        proof = await createAndroidProof(
          'POST',
          path,
          emptyBodyHash,
          challenge.challenge,
          integrityMode
        );
      }

      const response = await collectVoucher(apiBaseUrl, token, voucherId, {
        platform: actionPlatform,
        challengeId: challenge.challengeId,
        proof,
      });
      pushLog(`Voucher ${response.voucherId}: ${response.status}`);
    });

  const onGetProfile = () =>
    withLoading(async () => {
      if (!token) {
        pushLog('Login first to get a bearer token.');
        return;
      }

      const response = await getProfile(apiBaseUrl, token);
      pushLog(`Profile ${response.username} (${response.tier})`);
    });

  if (nativeRuntimeRequiredButMissing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.blockedScreen}>
          <View style={[styles.statusCard, styles.statusFallback]}>
            <Text style={styles.title}>Native Build Required</Text>
            <Text style={styles.statusText}>
              This app is configured to reject Expo Go. Install and open a
              native build created with `npm run ios` or `npm run android`.
            </Text>
            <Text style={styles.helperText}>
              Current runtime: Expo Go or another runtime without
              `ExpoAppIntegrity`
            </Text>
            <Text style={styles.helperText}>Target server: {apiBaseUrl}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>Mobile Integrity Demo</Text>
          <Text style={styles.subtitle}>
            Expo SDK 55 client with Android Play Integrity and iOS App Attest
            demo flows.
          </Text>
          <Text style={styles.meta}>
            Platform: {nativePlatform} | Mode: {integrityMode} | API:{' '}
            {apiBaseUrl}
          </Text>
          <Text style={styles.meta}>
            Integrity module: {integrityModuleAvailable ? 'native loaded' : 'mock only'}
          </Text>
          <Text style={styles.meta}>
            Native-build-only: {requireNativeRuntime ? 'enabled' : 'disabled'}
          </Text>
          <Text style={styles.meta}>
            Last challenge: {challengeSummary || 'none yet'}
          </Text>
        </View>

        <View
          style={[
            styles.statusCard,
            integrityModuleAvailable ? styles.statusReady : styles.statusFallback,
          ]}
        >
          <Text style={styles.statusTitle}>
            {integrityModuleAvailable
              ? 'Native integrity module detected'
              : 'Expo Go fallback active'}
          </Text>
          <Text style={styles.statusText}>
            {integrityModuleAvailable
              ? 'Real native integrity APIs are available in this runtime.'
              : integrityMode === 'mock'
                ? 'This runtime does not include ExpoAppIntegrity, so the app will keep working in mock mode.'
                : 'Real mode needs a rebuilt native app from npm run ios or npm run android.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Server</Text>
          <TextInput
            value={apiBaseUrlInput}
            onChangeText={setApiBaseUrlInput}
            style={styles.input}
            placeholder="http://192.168.1.10:8080"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helperText}>
            Active server: {apiBaseUrl}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Credentials</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            placeholder="Username"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder="Password"
            secureTextEntry
          />
          <TextInput
            value={voucherId}
            onChangeText={setVoucherId}
            style={styles.input}
            placeholder="Voucher ID"
          />
          <Text style={styles.meta}>
            Bearer token: {token || 'not logged in'}
          </Text>
        </View>

        <View style={styles.actions}>
          <ActionButton
            label="Get Challenge"
            onPress={() => onGetChallenge('login')}
          />
          <ActionButton
            label="Register iOS App Attest Key"
            onPress={onRegisterIosKey}
          />
          <ActionButton
            label="Android Login with Play Integrity"
            onPress={onAndroidLogin}
          />
          <ActionButton
            label="iOS Login with App Attest"
            onPress={onIosLogin}
          />
          <ActionButton label="Collect Voucher" onPress={onCollectVoucher} />
          <ActionButton label="Get Profile" onPress={onGetProfile} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          {loading ? <ActivityIndicator color="#0f766e" /> : null}
          {log.map((entry, index) => (
            <Text key={`${entry}-${index}`} style={styles.logLine}>
              {entry}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4efe7',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  blockedScreen: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: '#103c2f',
    borderRadius: 24,
    padding: 20,
  },
  title: {
    color: '#fff8ee',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#d4f3df',
    fontSize: 16,
    marginBottom: 12,
  },
  meta: {
    color: '#d2e3db',
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fffaf3',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5d6c4',
  },
  statusCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  statusReady: {
    backgroundColor: '#edfdf5',
    borderColor: '#86efac',
  },
  statusFallback: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#103c2f',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  helperText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#103c2f',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#c7b8a5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  actions: {
    gap: 10,
  },
  button: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  buttonText: {
    color: '#f6fffd',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
  },
  logLine: {
    color: '#3f3a35',
    marginTop: 8,
  },
});

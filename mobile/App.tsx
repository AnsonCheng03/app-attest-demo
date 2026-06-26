import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createChallenge, collectVoucher, getProfile, login, registerIosKey } from './src/api';
import { collectVoucherPath, loginPath, sha256Base64 } from './src/hash';
import { createAndroidProof, createIosAttestationObject, createIosAssertion, ensureIosKeyId, formatIosProof, getIntegrityMode, getNativePlatform } from './src/integrity';

type ActionName = 'login' | 'collectVoucher' | 'useWalletCode';

export default function App() {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('password123');
  const [voucherId, setVoucherId] = useState('voucher-001');
  const [token, setToken] = useState('');
  const [challengeSummary, setChallengeSummary] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  const integrityMode = getIntegrityMode();
  const nativePlatform = getNativePlatform();

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

  const onGetChallenge = (action: ActionName) => withLoading(async () => {
    const response = await createChallenge(apiBaseUrl, nativePlatform, action);
    setChallengeSummary(`${action}: ${response.challengeId}`);
    pushLog(`Challenge for ${action}: ${response.challengeId}`);
  });

  const onRegisterIosKey = () => withLoading(async () => {
    if (nativePlatform !== 'ios') {
      pushLog('iOS registration is only available when the app runs as iOS.');
      return;
    }
    const challenge = await createChallenge(apiBaseUrl, 'ios', 'login');
    const keyId = await ensureIosKeyId();
    const attestationObject = await createIosAttestationObject(challenge.challenge, keyId, integrityMode);
    const response = await registerIosKey(apiBaseUrl, {
      challengeId: challenge.challengeId,
      challenge: challenge.challenge,
      keyId,
      attestationObject,
    });
    pushLog(`Registered iOS key ${response.keyId}`);
  });

  const onAndroidLogin = () => withLoading(async () => {
    const challenge = await createChallenge(apiBaseUrl, 'android', 'login');
    const bodyHashForLogin = await sha256Base64(`username=${username}\npassword=${password}`);
    const proof = await createAndroidProof('POST', loginPath, bodyHashForLogin, challenge.challenge, integrityMode);
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

  const onIosLogin = () => withLoading(async () => {
    const challenge = await createChallenge(apiBaseUrl, 'ios', 'login');
    const keyId = await ensureIosKeyId();
    const bodyHashForLogin = await sha256Base64(`username=${username}\npassword=${password}`);
    const assertion = await createIosAssertion('POST', loginPath, bodyHashForLogin, challenge.challenge, keyId, integrityMode);
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

  const onCollectVoucher = () => withLoading(async () => {
    if (!token) {
      pushLog('Login first to get a bearer token.');
      return;
    }
    const actionPlatform = nativePlatform === 'ios' ? 'ios' : 'android';
    const challenge = await createChallenge(apiBaseUrl, actionPlatform, 'collectVoucher');
    const path = collectVoucherPath(voucherId);
    const emptyBodyHash = await sha256Base64('');
    let proof: string;
    if (actionPlatform === 'ios') {
      const keyId = await ensureIosKeyId();
      const assertion = await createIosAssertion('POST', path, emptyBodyHash, challenge.challenge, keyId, integrityMode);
      proof = formatIosProof(keyId, assertion, integrityMode);
    } else {
      proof = await createAndroidProof('POST', path, emptyBodyHash, challenge.challenge, integrityMode);
    }
    const response = await collectVoucher(apiBaseUrl, token, voucherId, {
      platform: actionPlatform,
      challengeId: challenge.challengeId,
      proof,
    });
    pushLog(`Voucher ${response.voucherId}: ${response.status}`);
  });

  const onGetProfile = () => withLoading(async () => {
    if (!token) {
      pushLog('Login first to get a bearer token.');
      return;
    }
    const response = await getProfile(apiBaseUrl, token);
    pushLog(`Profile ${response.username} (${response.tier})`);
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>Mobile Integrity Demo</Text>
          <Text style={styles.subtitle}>
            Expo SDK 55 client with Android Play Integrity and iOS App Attest demo flows.
          </Text>
          <Text style={styles.meta}>Platform: {nativePlatform} | Mode: {integrityMode} | API: {apiBaseUrl}</Text>
          <Text style={styles.meta}>Last challenge: {challengeSummary || 'none yet'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Credentials</Text>
          <TextInput value={username} onChangeText={setUsername} style={styles.input} placeholder="Username" />
          <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Password" secureTextEntry />
          <TextInput value={voucherId} onChangeText={setVoucherId} style={styles.input} placeholder="Voucher ID" />
          <Text style={styles.meta}>Bearer token: {token || 'not logged in'}</Text>
        </View>

        <View style={styles.actions}>
          <ActionButton label="Get Challenge" onPress={() => onGetChallenge('login')} />
          <ActionButton label="Register iOS App Attest Key" onPress={onRegisterIosKey} />
          <ActionButton label="Android Login with Play Integrity" onPress={onAndroidLogin} />
          <ActionButton label="iOS Login with App Attest" onPress={onIosLogin} />
          <ActionButton label="Collect Voucher" onPress={onCollectVoucher} />
          <ActionButton label="Get Profile" onPress={onGetProfile} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Activity Log</Text>
          {loading ? <ActivityIndicator color="#0f766e" /> : null}
          {log.map((entry, index) => (
            <Text key={`${entry}-${index}`} style={styles.logLine}>{entry}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
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

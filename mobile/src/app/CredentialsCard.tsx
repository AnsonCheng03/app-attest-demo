import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from './styles';

export function CredentialsCard({
  password,
  setPassword,
  setUsername,
  setVoucherId,
  token,
  username,
  voucherId,
}: {
  password: string;
  setPassword: (value: string) => void;
  setUsername: (value: string) => void;
  setVoucherId: (value: string) => void;
  token: string;
  username: string;
  voucherId: string;
}) {
  return (
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
      <Text style={styles.meta}>Bearer token: {token || 'not logged in'}</Text>
    </View>
  );
}

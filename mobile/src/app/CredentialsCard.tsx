import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from './styles';

export function CredentialsCard({
  notes,
  password,
  setPassword,
  setNotes,
  setUsername,
  token,
  username,
}: {
  notes: string;
  password: string;
  setPassword: (value: string) => void;
  setNotes: (value: string) => void;
  setUsername: (value: string) => void;
  token: string;
  username: string;
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
        value={notes}
        onChangeText={setNotes}
        style={styles.input}
        placeholder="Notes"
      />
      <Text style={styles.meta}>Bearer token: {token || 'not logged in'}</Text>
    </View>
  );
}

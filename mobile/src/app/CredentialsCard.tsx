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
      <Text style={styles.cardEyebrow}>Identity</Text>
      <Text style={styles.sectionTitle}>Credentials</Text>
      <Text style={styles.helperText}>
        Any username and password work in this demo. Notes are stored per signed
        user token.
      </Text>
      <Text style={styles.inputLabel}>Username</Text>
      <TextInput
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#7d8798"
      />
      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#7d8798"
        secureTextEntry
      />
      <Text style={styles.inputLabel}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, styles.notesInput]}
        placeholder="Notes"
        placeholderTextColor="#7d8798"
        multiline
        textAlignVertical="top"
      />
      <View style={styles.tokenCard}>
        <Text style={styles.tokenLabel}>Bearer token</Text>
        <Text style={styles.tokenValue}>{token || 'not logged in'}</Text>
      </View>
    </View>
  );
}

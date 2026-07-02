import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { styles } from './styles';

export function ServerCard({
  apiBaseUrl,
  apiBaseUrlInput,
  setApiBaseUrlInput,
}: {
  apiBaseUrl: string;
  apiBaseUrlInput: string;
  setApiBaseUrlInput: (value: string) => void;
}) {
  return (
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
      <Text style={styles.helperText}>Active server: {apiBaseUrl}</Text>
    </View>
  );
}

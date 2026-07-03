import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';

export function ServerCard({ apiBaseUrl }: { apiBaseUrl: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Server</Text>
      <Text style={styles.helperText}>Configured server: {apiBaseUrl}</Text>
    </View>
  );
}

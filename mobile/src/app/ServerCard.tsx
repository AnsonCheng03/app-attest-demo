import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';

export function ServerCard({ apiBaseUrl }: { apiBaseUrl: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardEyebrow}>Backend</Text>
      <Text style={styles.sectionTitle}>Server</Text>
      <Text style={styles.helperText}>
        Fixed by developer environment configuration.
      </Text>
      <View style={styles.serverPill}>
        <Text style={styles.serverPillText}>{apiBaseUrl}</Text>
      </View>
    </View>
  );
}

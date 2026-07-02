import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from './styles';

export function ActivityLogCard({
  loading,
  log,
  requestStatus,
}: {
  loading: boolean;
  log: string[];
  requestStatus: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Activity Log</Text>
      {loading ? (
        <View style={styles.requestStatusRow}>
          <ActivityIndicator color="#0f766e" />
          <Text style={styles.requestStatusText}>
            {requestStatus || 'Working...'}
          </Text>
        </View>
      ) : requestStatus ? (
        <Text style={styles.helperText}>{requestStatus}</Text>
      ) : null}
      {log.map((entry, index) => (
        <Text key={`${entry}-${index}`} style={styles.logLine}>
          {entry}
        </Text>
      ))}
    </View>
  );
}

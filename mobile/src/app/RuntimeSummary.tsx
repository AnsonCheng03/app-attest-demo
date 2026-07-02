import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';
import type { RuntimeSummaryProps } from './types';

export function RuntimeSummary({
  apiBaseUrl,
  challengeSummary,
  integrityMode,
  integrityModuleAvailable,
  nativePlatform,
  requireNativeRuntime,
}: RuntimeSummaryProps) {
  return (
    <View style={styles.hero}>
      <Text style={styles.title}>Mobile Integrity Demo</Text>
      <Text style={styles.subtitle}>
        Expo SDK 55 client with Android Play Integrity and iOS App Attest demo
        flows.
      </Text>
      <Text style={styles.meta}>
        Platform: {nativePlatform} | Mode: {integrityMode} | API: {apiBaseUrl}
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
  );
}

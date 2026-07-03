import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './styles';

export function BlockedRuntimeScreen({ apiBaseUrl }: { apiBaseUrl: string }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.blockedScreen}>
        <View style={[styles.card, styles.blockedCard, styles.statusFallback]}>
          <Text style={styles.cardEyebrow}>Runtime Blocked</Text>
          <Text style={styles.title}>Native Build Required</Text>
          <Text style={styles.statusText}>
            This runtime cannot provide the native Play Integrity or App Attest
            APIs required by the current app configuration.
          </Text>
          <Text style={styles.helperText}>
            Open a native build created with `npm run ios` or `npm run android`
            instead of Expo Go.
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

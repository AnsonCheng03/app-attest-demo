import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { styles } from './styles';

export function BlockedRuntimeScreen({ apiBaseUrl }: { apiBaseUrl: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.blockedScreen}>
        <View style={[styles.statusCard, styles.statusFallback]}>
          <Text style={styles.title}>Native Build Required</Text>
          <Text style={styles.statusText}>
            This app is configured to reject Expo Go. Install and open a native
            build created with `npm run ios` or `npm run android`.
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

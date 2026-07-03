import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../theme/styles';

export function BootstrapLoadingScreen({
  detail,
}: {
  detail?: string;
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.blockedScreen}>
        <View style={[styles.card, styles.blockedCard, styles.bootstrapCard]}>
          <Text style={styles.cardEyebrow}>Preparing Runtime</Text>
          <Text style={styles.title}>Setting Up App Attest</Text>
          <Text style={styles.statusText}>
            The app is loading the iOS integrity key and completing any required
            registration before the dashboard opens.
          </Text>
          <View style={styles.bootstrapSpinnerRow}>
            <ActivityIndicator color="#7dd3fc" />
            <Text style={styles.requestStatusText}>
              {detail || 'Starting secure device setup...'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

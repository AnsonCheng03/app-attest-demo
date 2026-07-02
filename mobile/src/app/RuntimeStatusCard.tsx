import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';

export function RuntimeStatusCard({
  integrityMode,
  integrityModuleAvailable,
}: {
  integrityMode: 'mock' | 'real';
  integrityModuleAvailable: boolean;
}) {
  return (
    <View
      style={[
        styles.statusCard,
        integrityModuleAvailable ? styles.statusReady : styles.statusFallback,
      ]}
    >
      <Text style={styles.statusTitle}>
        {integrityModuleAvailable
          ? 'Native integrity module detected'
          : 'Expo Go fallback active'}
      </Text>
      <Text style={styles.statusText}>
        {integrityModuleAvailable
          ? 'Real native integrity APIs are available in this runtime.'
          : integrityMode === 'mock'
            ? 'This runtime does not include ExpoAppIntegrity, so the app will keep working in mock mode.'
            : 'Real mode needs a rebuilt native app from npm run ios or npm run android.'}
      </Text>
    </View>
  );
}

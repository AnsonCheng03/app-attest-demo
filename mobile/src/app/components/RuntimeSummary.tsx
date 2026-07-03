import React from 'react';
import { Text, View } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { styles } from '../theme/styles';

export function RuntimeSummary() {
  const {
    apiBaseUrl,
    challengeSummary,
    integrityMode,
    integrityModuleAvailable,
    nativePlatform,
    requireNativeRuntime,
  } = useAppContext();

  return (
    <View style={styles.hero}>
      <View style={styles.heroOrbLarge} />
      <View style={styles.heroOrbSmall} />
      <Text style={styles.heroEyebrow}>Integrity Dashboard</Text>
      <Text style={styles.title}>Mobile Integrity Demo</Text>
      <Text style={styles.subtitle}>
        A polished sandbox for Play Integrity, App Attest, signed JWT login,
        and protected notes flows.
      </Text>
      <View style={styles.heroChipRow}>
        <View style={styles.heroChip}>
          <Text style={styles.heroChipLabel}>Platform</Text>
          <Text style={styles.heroChipValue}>{nativePlatform}</Text>
        </View>
        <View style={styles.heroChip}>
          <Text style={styles.heroChipLabel}>Mode</Text>
          <Text style={styles.heroChipValue}>{integrityMode}</Text>
        </View>
      </View>
      <View style={styles.heroMetaBlock}>
        <Text style={styles.meta}>API endpoint: {apiBaseUrl}</Text>
        <Text style={styles.meta}>
          Integrity module:{' '}
          {integrityModuleAvailable ? 'native loaded' : 'mock fallback'}
        </Text>
        <Text style={styles.meta}>
          Native-build-only: {requireNativeRuntime ? 'enabled' : 'disabled'}
        </Text>
        <Text style={styles.meta}>
          Last challenge: {challengeSummary || 'none yet'}
        </Text>
      </View>
    </View>
  );
}

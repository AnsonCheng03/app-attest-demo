import React from 'react';
import { Text, View } from 'react-native';
import { useAppContext } from './AppContext';
import { ActionButton } from './ActionButton';
import { styles } from './styles';

export function ActionList() {
  const { actions, nativePlatform } = useAppContext();

  return (
    <View style={styles.card}>
      <Text style={styles.cardEyebrow}>Actions</Text>
      <Text style={styles.sectionTitle}>Run the demo flow</Text>
      <Text style={styles.helperText}>
        Start with auth, then try an integrity-protected write, then read the
        stored data back.
      </Text>

      <View style={styles.actionSection}>
        <Text style={styles.actionSectionTitle}>Preparation</Text>
        <View style={styles.actions}>
          <ActionButton
            label="Get Challenge"
            subtitle="Fetch a one-time challenge from backend"
            onPress={() => actions.onGetChallenge('login')}
          />
          <ActionButton
            label="Check Backend Health"
            subtitle="Confirm the API is alive and reachable"
            onPress={actions.onCheckHealth}
          />
        </View>
      </View>

      {nativePlatform === 'ios' ? (
        <View style={styles.actionSection}>
          <Text style={styles.actionSectionTitle}>iOS Integrity</Text>
          <View style={styles.actions}>
            <ActionButton
              label="Register iOS App Attest Key"
              subtitle="Create and register the device attestation key"
              onPress={actions.onRegisterIosKey}
              variant="accent"
            />
            <ActionButton
              label="iOS Login with App Attest"
              subtitle="Sign in with an assertion bound to request data"
              onPress={actions.onIosLogin}
              variant="primary"
            />
          </View>
        </View>
      ) : null}

      {nativePlatform === 'android' ? (
        <View style={styles.actionSection}>
          <Text style={styles.actionSectionTitle}>Android Integrity</Text>
          <View style={styles.actions}>
            <ActionButton
              label="Android Login with Play Integrity"
              subtitle="Request a token and exchange it for a signed JWT"
              onPress={actions.onAndroidLogin}
              variant="primary"
            />
          </View>
        </View>
      ) : null}

      <View style={styles.actionSection}>
        <Text style={styles.actionSectionTitle}>Protected Data</Text>
        <View style={styles.actions}>
          <ActionButton
            label="Save Notes"
            subtitle="Send an integrity-protected write request"
            onPress={actions.onSaveNotes}
            variant="accent"
          />
          <ActionButton
            label="Get Data"
            subtitle="Fetch username and saved notes with your JWT"
            onPress={actions.onGetData}
          />
        </View>
      </View>
    </View>
  );
}

import React from 'react';
import { View } from 'react-native';
import { ActionButton } from './ActionButton';
import { styles } from './styles';
import type { AppActions } from './types';

export function ActionList({ actions }: { actions: AppActions }) {
  return (
    <View style={styles.actions}>
      <ActionButton
        label="Get Challenge"
        onPress={() => actions.onGetChallenge('login')}
      />
      <ActionButton
        label="Register iOS App Attest Key"
        onPress={actions.onRegisterIosKey}
      />
      <ActionButton
        label="Android Login with Play Integrity"
        onPress={actions.onAndroidLogin}
      />
      <ActionButton
        label="iOS Login with App Attest"
        onPress={actions.onIosLogin}
      />
      <ActionButton
        label="Check Backend Health"
        onPress={actions.onCheckHealth}
      />
      <ActionButton label="Collect Voucher" onPress={actions.onCollectVoucher} />
      <ActionButton label="Get Profile" onPress={actions.onGetProfile} />
    </View>
  );
}

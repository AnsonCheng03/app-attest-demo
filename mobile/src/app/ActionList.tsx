import React from 'react';
import { View } from 'react-native';
import type { PlatformName } from '../types';
import { ActionButton } from './ActionButton';
import { styles } from './styles';
import type { AppActions } from './types';

export function ActionList({
  actions,
  nativePlatform,
}: {
  actions: AppActions;
  nativePlatform: PlatformName;
}) {
  return (
    <View style={styles.actions}>
      <ActionButton
        label="Get Challenge"
        onPress={() => actions.onGetChallenge('login')}
      />
      {nativePlatform === 'ios' ? (
        <>
          <ActionButton
            label="Register iOS App Attest Key"
            onPress={actions.onRegisterIosKey}
          />
          <ActionButton
            label="iOS Login with App Attest"
            onPress={actions.onIosLogin}
          />
        </>
      ) : null}
      {nativePlatform === 'android' ? (
        <ActionButton
          label="Android Login with Play Integrity"
          onPress={actions.onAndroidLogin}
        />
      ) : null}
      <ActionButton
        label="Check Backend Health"
        onPress={actions.onCheckHealth}
      />
      <ActionButton label="Collect Voucher" onPress={actions.onCollectVoucher} />
      <ActionButton label="Get Profile" onPress={actions.onGetProfile} />
    </View>
  );
}

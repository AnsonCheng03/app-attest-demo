import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { ActionList } from './ActionList';
import { ActivityLogCard } from './ActivityLogCard';
import { CredentialsCard } from './CredentialsCard';
import { RuntimeStatusCard } from './RuntimeStatusCard';
import { RuntimeSummary } from './RuntimeSummary';
import { ServerCard } from './ServerCard';
import { styles } from './styles';
import type { AppScreenProps } from './types';

export function AppScreen({
  actions,
  apiBaseUrl,
  apiBaseUrlInput,
  challengeSummary,
  integrityMode,
  integrityModuleAvailable,
  loading,
  log,
  nativePlatform,
  password,
  requestStatus,
  requireNativeRuntime,
  setApiBaseUrlInput,
  setPassword,
  setUsername,
  setVoucherId,
  token,
  username,
  voucherId,
}: AppScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <RuntimeSummary
          apiBaseUrl={apiBaseUrl}
          challengeSummary={challengeSummary}
          integrityMode={integrityMode}
          integrityModuleAvailable={integrityModuleAvailable}
          nativePlatform={nativePlatform}
          requireNativeRuntime={requireNativeRuntime}
        />
        <RuntimeStatusCard
          integrityMode={integrityMode}
          integrityModuleAvailable={integrityModuleAvailable}
        />
        <ServerCard
          apiBaseUrl={apiBaseUrl}
          apiBaseUrlInput={apiBaseUrlInput}
          setApiBaseUrlInput={setApiBaseUrlInput}
        />
        <CredentialsCard
          password={password}
          setPassword={setPassword}
          setUsername={setUsername}
          setVoucherId={setVoucherId}
          token={token}
          username={username}
          voucherId={voucherId}
        />
        <ActionList actions={actions} nativePlatform={nativePlatform} />
        <ActivityLogCard
          loading={loading}
          log={log}
          requestStatus={requestStatus}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

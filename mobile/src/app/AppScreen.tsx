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
  challengeSummary,
  integrityMode,
  integrityModuleAvailable,
  loading,
  logGroups,
  nativePlatform,
  notes,
  password,
  requestStatus,
  requireNativeRuntime,
  setNotes,
  setPassword,
  setUsername,
  token,
  username,
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
        <ServerCard apiBaseUrl={apiBaseUrl} />
        <CredentialsCard
          notes={notes}
          password={password}
          setNotes={setNotes}
          setPassword={setPassword}
          setUsername={setUsername}
          token={token}
          username={username}
        />
        <ActionList actions={actions} nativePlatform={nativePlatform} />
        <ActivityLogCard
          loading={loading}
          logGroups={logGroups}
          requestStatus={requestStatus}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

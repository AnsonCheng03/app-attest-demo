import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionList } from './ActionList';
import { ActivityLogCard } from './ActivityLogCard';
import { CredentialsCard } from './CredentialsCard';
import { RuntimeStatusCard } from './RuntimeStatusCard';
import { RuntimeSummary } from './RuntimeSummary';
import { ServerCard } from './ServerCard';
import { styles } from './styles';

export function AppScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <RuntimeSummary />
        <RuntimeStatusCard />
        <ServerCard />
        <CredentialsCard />
        <ActionList />
        <ActivityLogCard />
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

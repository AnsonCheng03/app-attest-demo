import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ActionList } from '../components/ActionList';
import { ActivityLogCard } from '../components/ActivityLogCard';
import { CredentialsCard } from '../components/CredentialsCard';
import { RuntimeStatusCard } from '../components/RuntimeStatusCard';
import { RuntimeSummary } from '../components/RuntimeSummary';
import { ServerCard } from '../components/ServerCard';
import { styles } from '../theme/styles';

const activeTabStorageKey = 'integrity-demo-mobile-active-tab';

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    render: () => (
      <>
        <RuntimeSummary />
        <RuntimeStatusCard />
        <ServerCard />
      </>
    ),
  },
  {
    id: 'controls',
    label: 'Controls',
    render: () => (
      <>
        <CredentialsCard />
        <ActionList />
      </>
    ),
  },
  {
    id: 'activity',
    label: 'Activity',
    render: () => <ActivityLogCard />,
  },
] as const;

type AppTabId = (typeof tabs)[number]['id'];

export function AppScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AppTabId>('overview');

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(activeTabStorageKey)
      .then((savedTab) => {
        if (
          !cancelled &&
          savedTab &&
          tabs.some((tab) => tab.id === savedTab)
        ) {
          setActiveTab(savedTab as AppTabId);
        }
      })
      .catch((error) => {
        console.warn('Failed to load active mobile tab', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(activeTabStorageKey, activeTab).catch((error) => {
      console.warn('Failed to save active mobile tab', error);
    });
  }, [activeTab]);

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screenBackground}>
        <View style={styles.screenGlowTop} />
        <View style={styles.screenGlowBottom} />
      </View>
      <View style={styles.screenFrame}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                style={[
                  styles.tabButton,
                  isActive ? styles.tabButtonActive : null,
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isActive ? styles.tabButtonTextActive : null,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: Math.max(insets.bottom, 16) + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {currentTab.render()}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

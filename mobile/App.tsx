import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from './src/app/queryClient';
import {
  AppProvider,
  AppScreen,
  BootstrapLoadingScreen,
  BlockedRuntimeScreen,
  useAppContext,
} from './src/app';

function AppRoot() {
  const app = useAppContext();

  if (app.nativeRuntimeRequiredButMissing) {
    return (
      <>
        <StatusBar style="light" />
        <BlockedRuntimeScreen />
      </>
    );
  }

  if (app.bootstrapLoading) {
    return (
      <>
        <StatusBar style="light" />
        <BootstrapLoadingScreen detail={app.bootstrapStatus} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppScreen />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <AppRoot />
        </AppProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

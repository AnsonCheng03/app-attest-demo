import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  AppProvider,
  AppScreen,
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
      <AppProvider>
        <AppRoot />
      </AppProvider>
    </SafeAreaProvider>
  );
}

import { StatusBar } from 'expo-status-bar';
import React from 'react';
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
    <AppProvider>
      <AppRoot />
    </AppProvider>
  );
}

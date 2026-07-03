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
        <StatusBar style="dark" />
        <BlockedRuntimeScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
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

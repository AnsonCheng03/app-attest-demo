import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { AppScreen, BlockedRuntimeScreen } from './src/app';
import { useIntegrityDemo } from './src/app/useIntegrityDemo';

export default function App() {
  const app = useIntegrityDemo();

  if (app.nativeRuntimeRequiredButMissing) {
    return (
      <>
        <StatusBar style="dark" />
        <BlockedRuntimeScreen apiBaseUrl={app.apiBaseUrl} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppScreen {...app} />
    </>
  );
}

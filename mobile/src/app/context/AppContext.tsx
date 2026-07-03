import React, { createContext, useContext } from 'react';
import { useIntegrityDemo } from '../hooks/state/useIntegrityDemo';

type AppContextValue = ReturnType<typeof useIntegrityDemo>;

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const value = useIntegrityDemo();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider.');
  }
  return context;
}

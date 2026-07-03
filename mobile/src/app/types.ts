import type { IntegrityAction, PlatformName } from '../types';

export type AppActions = {
  onAndroidLogin: () => void;
  onCheckHealth: () => void;
  onGetData: () => void;
  onGetChallenge: (action: IntegrityAction) => void;
  onIosLogin: () => void;
  onRegisterIosKey: () => void;
  onSaveNotes: () => void;
};

export type LogEntry = {
  id: string;
  title: string;
  detail?: string;
  tone: 'info' | 'success' | 'error';
};

export type LogGroup = {
  id: string;
  title: string;
  flowTitle: string;
  status: 'running' | 'success' | 'error';
  entries: LogEntry[];
};

export type RuntimeSummaryProps = {
  apiBaseUrl: string;
  challengeSummary: string;
  integrityMode: 'mock' | 'real';
  integrityModuleAvailable: boolean;
  nativePlatform: PlatformName;
  requireNativeRuntime: boolean;
};

export type AppScreenProps = {
  actions: AppActions;
  apiBaseUrl: string;
  challengeSummary: string;
  integrityMode: 'mock' | 'real';
  integrityModuleAvailable: boolean;
  loading: boolean;
  logGroups: LogGroup[];
  nativePlatform: PlatformName;
  notes: string;
  password: string;
  requestStatus: string;
  requireNativeRuntime: boolean;
  setNotes: (value: string) => void;
  setPassword: (value: string) => void;
  setUsername: (value: string) => void;
  token: string;
  username: string;
};

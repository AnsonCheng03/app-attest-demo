import type { IntegrityAction, PlatformName } from '../types';

export type AppActions = {
  onAndroidLogin: () => void;
  onCheckHealth: () => void;
  onCollectVoucher: () => void;
  onGetChallenge: (action: IntegrityAction) => void;
  onGetProfile: () => void;
  onIosLogin: () => void;
  onRegisterIosKey: () => void;
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
  apiBaseUrlInput: string;
  challengeSummary: string;
  integrityMode: 'mock' | 'real';
  integrityModuleAvailable: boolean;
  loading: boolean;
  logGroups: LogGroup[];
  nativePlatform: PlatformName;
  password: string;
  requestStatus: string;
  requireNativeRuntime: boolean;
  setApiBaseUrlInput: (value: string) => void;
  setPassword: (value: string) => void;
  setUsername: (value: string) => void;
  setVoucherId: (value: string) => void;
  token: string;
  username: string;
  voucherId: string;
};

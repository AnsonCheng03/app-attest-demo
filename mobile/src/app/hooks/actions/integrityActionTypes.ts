import type { IntegrityMode } from '../../../config';
import type { IntegrityAction, PlatformName } from '../../../types';
import type { ReportStep } from '../utils/integrityDemoHelpers';

export type IntegrityActionsParams = {
  apiBaseUrl: string;
  integrityMode: IntegrityMode;
  nativePlatform: PlatformName;
  notes: string;
  password: string;
  token: string;
  username: string;
  setChallengeSummary: (value: string) => void;
  setToken: (value: string) => void;
  withLoading: (
    label: string,
    flowTitle: string,
    task: (report: ReportStep) => Promise<void>
  ) => Promise<void>;
};

export type IntegrityFlowContext = Pick<
  IntegrityActionsParams,
  | 'apiBaseUrl'
  | 'integrityMode'
  | 'nativePlatform'
  | 'notes'
  | 'password'
  | 'setChallengeSummary'
  | 'setToken'
  | 'token'
  | 'username'
>;

export type ChallengeActionHandler = (action: IntegrityAction) => Promise<void>;

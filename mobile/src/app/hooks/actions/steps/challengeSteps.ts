import { createChallenge } from '../../../../api';
import type {
  ChallengeResponse,
  IntegrityAction,
  PlatformName,
} from '../../../../types';
import { formatLogIO, type ReportStep } from '../../utils/integrityDemoHelpers';

type ChallengeParams = {
  action: IntegrityAction;
  apiBaseUrl: string;
  platform: PlatformName;
  prompt: string;
  report: ReportStep;
};

async function challenge({
  action,
  apiBaseUrl,
  platform,
  prompt,
  report,
}: ChallengeParams): Promise<ChallengeResponse> {
  const request = { platform, action };
  report(
    prompt,
    formatLogIO({
      function: 'createChallenge',
      baseUrl: apiBaseUrl,
      request,
    })
  );
  const response = await createChallenge(apiBaseUrl, platform, action);
  report('Backend returned the challenge', formatLogIO(request, response));
  return response;
}

export function requestActionChallenge(
  report: ReportStep,
  apiBaseUrl: string,
  platform: PlatformName,
  action: IntegrityAction
) {
  return challenge({
    action,
    apiBaseUrl,
    platform,
    prompt: 'Ask backend for a one-time challenge',
    report,
  });
}

export function requestAndroidLoginChallenge(
  report: ReportStep,
  apiBaseUrl: string
) {
  return challenge({
    action: 'login',
    apiBaseUrl,
    platform: 'android',
    prompt: 'Ask backend for a one-time login challenge',
    report,
  });
}

export function requestIosLoginChallenge(
  report: ReportStep,
  apiBaseUrl: string
) {
  return challenge({
    action: 'login',
    apiBaseUrl,
    platform: 'ios',
    prompt: 'Ask backend for a fresh assertion challenge',
    report,
  });
}

export function requestIosRegistrationChallenge(
  report: ReportStep,
  apiBaseUrl: string
) {
  return challenge({
    action: 'login',
    apiBaseUrl,
    platform: 'ios',
    prompt: 'Ask backend for a one-time registration challenge',
    report,
  });
}

export function requestProtectedNotesChallenge(
  report: ReportStep,
  apiBaseUrl: string,
  platform: PlatformName
) {
  return challenge({
    action: 'saveNotes',
    apiBaseUrl,
    platform,
    prompt: 'Ask backend for a fresh protected-request challenge',
    report,
  });
}

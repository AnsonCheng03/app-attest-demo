import { login } from '../../../../api';
import { loginPath } from '../../../../hash';
import {
  buildProtectedBodyHash,
  createAndroidProtectedProof,
  createIosProtectedProof,
  submitProtectedJsonRequest,
} from './protectedJsonRequestSteps';
import type { ReportStep } from '../../utils/integrityDemoHelpers';

export function buildLoginHash(
  report: ReportStep,
  username: string,
  password: string
) {
  return buildProtectedBodyHash({
    report,
    bodyForHash: `username=${username}\npassword=${password}`,
    path: loginPath,
    title: 'Build request-bound login hash',
  });
}

export function createAndroidLoginProof(
  report: ReportStep,
  integrityMode: Parameters<typeof createAndroidProtectedProof>[0]['integrityMode'],
  challenge: string,
  bodyHash: string
) {
  return createAndroidProtectedProof({
    report,
    integrityMode,
    challenge,
    bodyHash,
    path: loginPath,
  });
}

export function createIosLoginProof(
  report: ReportStep,
  integrityMode: Parameters<typeof createIosProtectedProof>[0]['integrityMode'],
  challenge: string,
  bodyHash: string
) {
  return createIosProtectedProof({
    report,
    integrityMode,
    challenge,
    bodyHash,
    path: loginPath,
  });
}

export async function submitAndroidLogin(
  report: ReportStep,
  apiBaseUrl: string,
  username: string,
  password: string,
  challengeId: string,
  proof: string
) {
  const request = {
    username,
    password,
    integrity: {
      platform: 'android' as const,
      challengeId,
      proof,
    },
  };
  return submitProtectedJsonRequest({
    report,
    apiBaseUrl,
    request,
    functionName: 'login',
    requestLabel: 'Send login request + integrity proof to backend',
    submit: (nextRequest) => login(apiBaseUrl, nextRequest),
    successTitle: 'Backend accepted the login',
  });
}

export async function submitIosLogin(
  report: ReportStep,
  apiBaseUrl: string,
  username: string,
  password: string,
  challengeId: string,
  proof: string
) {
  const request = {
    username,
    password,
    integrity: {
      platform: 'ios' as const,
      challengeId,
      proof,
    },
  };
  return submitProtectedJsonRequest({
    report,
    apiBaseUrl,
    request,
    functionName: 'login',
    requestLabel: 'Send login request + assertion to backend',
    submit: (nextRequest) => login(apiBaseUrl, nextRequest),
    successTitle: 'Backend accepted the login',
  });
}

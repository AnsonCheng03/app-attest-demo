import { useMutation } from '@tanstack/react-query';
import type { ReportStep } from '../utils/integrityDemoHelpers';
import type { IntegrityFlowContext } from './integrityActionTypes';
import {
  requestAndroidLoginChallenge,
  requestIosLoginChallenge,
} from './steps/challengeSteps';
import {
  buildLoginHash,
  createAndroidLoginProof,
  createIosLoginProof,
  submitAndroidLogin,
  submitIosLogin,
} from './steps/loginSteps';

type WithLoading = (
  label: string,
  flowTitle: string,
  task: (report: ReportStep) => Promise<void>
) => Promise<void>;

export function useLoginActions(
  context: IntegrityFlowContext,
  withLoading: WithLoading
) {
  async function runAndroidLogin(report: ReportStep) {
    const challenge = await requestAndroidLoginChallenge(
      report,
      context.apiBaseUrl
    );
    const bodyHash = await buildLoginHash(
      report,
      context.username,
      context.password
    );
    const proof = await createAndroidLoginProof(
      report,
      context.integrityMode,
      challenge.challenge,
      bodyHash
    );
    const response = await submitAndroidLogin(
      report,
      context.apiBaseUrl,
      context.username,
      context.password,
      challenge.challengeId,
      proof
    );
    context.setToken(response.accessToken);
  }

  async function runIosLogin(report: ReportStep) {
    const challenge = await requestIosLoginChallenge(report, context.apiBaseUrl);
    const bodyHash = await buildLoginHash(
      report,
      context.username,
      context.password
    );
    const proof = await createIosLoginProof(
      report,
      context.integrityMode,
      challenge.challenge,
      bodyHash
    );
    const response = await submitIosLogin(
      report,
      context.apiBaseUrl,
      context.username,
      context.password,
      challenge.challengeId,
      proof
    );
    context.setToken(response.accessToken);
  }

  const androidLoginMutation = useMutation({
    mutationFn: async () =>
      withLoading('Android login', 'Play Integrity Login', runAndroidLogin),
  });

  const iosLoginMutation = useMutation({
    mutationFn: async () =>
      withLoading('iOS login', 'App Attest Assertion Login', runIosLogin),
  });

  const onAndroidLogin = () =>
    androidLoginMutation.mutateAsync();

  const onIosLogin = () =>
    iosLoginMutation.mutateAsync();

  return {
    onAndroidLogin,
    onIosLogin,
  };
}

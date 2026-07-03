import { useMutation } from '@tanstack/react-query';
import type { ReportStep } from '../utils/integrityDemoHelpers';
import type { IntegrityFlowContext } from './integrityActionTypes';
import { requestIosRegistrationChallenge } from './steps/challengeSteps';
import {
  createRegistrationAttestation,
  submitIosKeyRegistration,
} from './steps/deviceIntegritySteps';

type WithLoading = (
  label: string,
  flowTitle: string,
  task: (report: ReportStep) => Promise<void>
) => Promise<void>;

export function useDeviceIntegrityActions(
  context: IntegrityFlowContext,
  withLoading: WithLoading
) {
  async function runRegisterIosKey(report: ReportStep) {
    if (context.nativePlatform !== 'ios') {
      throw new Error('This registration flow requires an iOS runtime.');
    }

    const challenge = await requestIosRegistrationChallenge(
      report,
      context.apiBaseUrl
    );
    const { attestationObject, keyId } = await createRegistrationAttestation(
      report,
      context.integrityMode,
      challenge.challenge
    );
    await submitIosKeyRegistration(
      report,
      context.apiBaseUrl,
      challenge,
      keyId,
      attestationObject
    );
  }

  const registerIosKeyMutation = useMutation({
    mutationFn: async () =>
      withLoading(
        'Register iOS App Attest key',
        'App Attest Registration',
        runRegisterIosKey
      ),
  });

  const onRegisterIosKey = () =>
    registerIosKeyMutation.mutateAsync();

  return { onRegisterIosKey };
}

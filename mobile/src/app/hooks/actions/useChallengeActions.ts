import { useMutation } from '@tanstack/react-query';
import { createChallenge } from '../../../api';
import type { IntegrityAction } from '../../../types';
import type { ReportStep } from '../utils/integrityDemoHelpers';
import type {
  ChallengeActionHandler,
  IntegrityFlowContext,
} from './integrityActionTypes';
import { requestActionChallenge } from './steps/challengeSteps';

export function useChallengeActions(
  context: IntegrityFlowContext,
  withLoading: (
    label: string,
    flowTitle: string,
    task: (report: ReportStep) => Promise<void>
  ) => Promise<void>
): { onGetChallenge: ChallengeActionHandler } {
  const mutation = useMutation({
    mutationFn: async (action: IntegrityAction) =>
      withLoading(
        `Get ${action} challenge`,
        'Challenge Request',
        async (report) => {
          const response = await requestActionChallenge(
            report,
            context.apiBaseUrl,
            context.nativePlatform,
            action
          );
          context.setChallengeSummary(`${action}: ${response.challengeId}`);
        }
      ),
  });

  const onGetChallenge = (action: IntegrityAction) =>
    mutation.mutateAsync(action);

  return { onGetChallenge };
}

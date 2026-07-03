import { useMutation } from '@tanstack/react-query';
import { checkHealth, getData, saveNotes } from '../../../api';
import { saveNotesPath } from '../../../hash';
import type { PlatformName } from '../../../types';
import {
  formatLogIO,
  type ReportStep,
} from '../utils/integrityDemoHelpers';
import type { IntegrityFlowContext } from './integrityActionTypes';
import { requestProtectedNotesChallenge } from './steps/challengeSteps';
import {
  buildProtectedBodyHash,
  createAndroidProtectedProof,
  createIosProtectedProof,
  submitProtectedJsonRequest,
} from './steps/protectedJsonRequestSteps';

type WithLoading = (
  label: string,
  flowTitle: string,
  task: (report: ReportStep) => Promise<void>
) => Promise<void>;

export function useDataActions(
  context: IntegrityFlowContext,
  withLoading: WithLoading
) {
  async function runSaveNotes(report: ReportStep) {
    if (!context.token) {
      throw new Error('Login first before saving notes.');
    }

    const actionPlatform: PlatformName =
      context.nativePlatform === 'ios' ? 'ios' : 'android';
    const challenge = await requestProtectedNotesChallenge(
      report,
      context.apiBaseUrl,
      actionPlatform
    );
    const bodyHash = await buildProtectedBodyHash({
      report,
      bodyForHash: `notes=${context.notes}`,
      path: saveNotesPath,
      title: 'Build request-bound notes hash',
    });
    const proof =
      actionPlatform === 'ios'
        ? await createIosProtectedProof({
            report,
            integrityMode: context.integrityMode,
            challenge: challenge.challenge,
            bodyHash,
            path: saveNotesPath,
          })
        : await createAndroidProtectedProof({
            report,
            integrityMode: context.integrityMode,
            challenge: challenge.challenge,
            bodyHash,
            path: saveNotesPath,
          });
    const request = {
      notes: context.notes,
      platform: actionPlatform,
      challengeId: challenge.challengeId,
      proof,
    };
    await submitProtectedJsonRequest({
      report,
      apiBaseUrl: context.apiBaseUrl,
      token: context.token,
      request,
      functionName: 'saveNotes',
      requestLabel: 'Send save-notes request + proof to backend',
      submit: (nextRequest) => saveNotes(context.apiBaseUrl, context.token, nextRequest),
      successTitle: 'Backend accepted the protected request',
    });
  }

  const saveNotesMutation = useMutation({
    mutationFn: async () =>
      withLoading(
        'Save notes',
        context.nativePlatform === 'ios'
          ? 'App Attest Protected Request'
          : 'Play Integrity Protected Request',
        runSaveNotes
      ),
  });

  const onSaveNotes = () =>
    saveNotesMutation.mutateAsync();

  const getDataMutation = useMutation({
    mutationFn: async () =>
      withLoading('Get data', 'Authenticated Data Read', async (report) => {
        if (!context.token) {
          throw new Error('Login first before requesting data.');
        }

        report(
          'Send authenticated data request',
          formatLogIO({
            function: 'getData',
            baseUrl: context.apiBaseUrl,
            token: context.token,
          })
        );
        report(
          'Backend returned the data',
          formatLogIO(
            { token: context.token },
            await getData(context.apiBaseUrl, context.token)
          ),
          'success'
        );
      }),
  });

  const onGetData = () =>
    getDataMutation.mutateAsync();

  const checkHealthMutation = useMutation({
    mutationFn: async () =>
      withLoading(
        'Check backend health',
        'Backend Health Check',
        async (report) => {
          report(
            'Send backend health request',
            formatLogIO({
              function: 'checkHealth',
              baseUrl: context.apiBaseUrl,
            })
          );
          const response = await checkHealth(context.apiBaseUrl);
          report(
            'Backend health response received',
            formatLogIO({ baseUrl: context.apiBaseUrl }, response),
            'success'
          );
        }
      ),
  });

  const onCheckHealth = () =>
    checkHealthMutation.mutateAsync();

  return {
    onCheckHealth,
    onGetData,
    onSaveNotes,
  };
}

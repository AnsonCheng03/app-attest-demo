import { registerIosKey } from '../../../../api';
import type { IntegrityMode } from '../../../../config';
import {
  createIosAttestationObject,
  ensureIosKeyId,
  resetIosKeyId,
} from '../../../../integrity';
import type { ChallengeResponse, IosRegisterResponse } from '../../../../types';
import {
  formatLogIO,
  isRecoverableIosRegistrationError,
  type ReportStep,
} from '../../utils/integrityDemoHelpers';

export async function resolveAppAttestKey(
  report: ReportStep,
  integrityMode: IntegrityMode
) {
  report(
    'Load or create the App Attest key',
    formatLogIO({
      function: 'ensureIosKeyId',
      integrityMode,
    })
  );
  const keyId = await ensureIosKeyId(integrityMode);
  report('Frontend resolved the App Attest key', formatLogIO({ integrityMode }, { keyId }));
  return keyId;
}

export async function createRegistrationAttestation(
  report: ReportStep,
  integrityMode: IntegrityMode,
  challenge: string
) {
  let keyId = await resolveAppAttestKey(report, integrityMode);
  let input = {
    function: 'createIosAttestationObject',
    challenge,
    keyId,
    integrityMode,
  };
  let attestationObject: string;

  try {
    attestationObject = await createIosAttestationObject(
      challenge,
      keyId,
      integrityMode
    );
  } catch (error) {
    if (integrityMode !== 'real' || !isRecoverableIosRegistrationError(error)) {
      throw error;
    }

    report(
      'Existing App Attest key looked stale; clear it and generate a fresh key',
      formatLogIO(
        { function: 'resetIosKeyId', previousKeyId: keyId },
        { retry: true }
      )
    );
    await resetIosKeyId();
    keyId = await ensureIosKeyId(integrityMode, { forceNew: true });
    report(
      'Frontend generated a fresh App Attest key',
      formatLogIO({ integrityMode, forceNew: true }, { keyId })
    );
    input = {
      function: 'createIosAttestationObject',
      challenge,
      keyId,
      integrityMode,
    };
    attestationObject = await createIosAttestationObject(
      challenge,
      keyId,
      integrityMode
    );
  }

  report(
    'Build the App Attest attestation object',
    formatLogIO(input, { attestationObject })
  );

  return { attestationObject, keyId };
}

export async function submitIosKeyRegistration(
  report: ReportStep,
  apiBaseUrl: string,
  challenge: ChallengeResponse,
  keyId: string,
  attestationObject: string
): Promise<IosRegisterResponse> {
  const request = {
    challengeId: challenge.challengeId,
    challenge: challenge.challenge,
    keyId,
    attestationObject,
  };
  report(
    'Send keyId + attestation object to backend',
    formatLogIO({
      function: 'registerIosKey',
      baseUrl: apiBaseUrl,
      request,
    })
  );
  const response = await registerIosKey(apiBaseUrl, request);
  report(
    'Backend registered the App Attest key',
    formatLogIO(request, response),
    'success'
  );
  return response;
}

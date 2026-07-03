import type { IntegrityMode } from '../../../../config';
import { sha256Base64 } from '../../../../hash';
import {
  createAndroidProof,
  createIosAssertion,
  ensureIosKeyId,
  formatIosProof,
} from '../../../../integrity';
import { formatLogIO, type ReportStep } from '../../utils/integrityDemoHelpers';

type BuildBodyHashParams = {
  report: ReportStep;
  bodyForHash: string;
  path: string;
  title: string;
};

type CreatePlatformProofParams = {
  report: ReportStep;
  integrityMode: IntegrityMode;
  challenge: string;
  bodyHash: string;
  path: string;
};

type SubmitJsonRequestParams<TRequest, TResponse> = {
  report: ReportStep;
  apiBaseUrl: string;
  token?: string;
  request: TRequest;
  functionName: string;
  requestLabel: string;
  submit: (request: TRequest) => Promise<TResponse>;
  successTitle: string;
};

export async function buildProtectedBodyHash({
  report,
  bodyForHash,
  path,
  title,
}: BuildBodyHashParams) {
  const bodyHash = await sha256Base64(bodyForHash);
  report(
    title,
    formatLogIO(
      {
        function: 'sha256Base64',
        input: bodyForHash,
      },
      {
        path,
        bodyHash,
      }
    )
  );
  return bodyHash;
}

export async function createIosProtectedProof({
  report,
  integrityMode,
  challenge,
  bodyHash,
  path,
}: CreatePlatformProofParams) {
  report(
    'Load the registered App Attest key',
    formatLogIO({
      function: 'ensureIosKeyId',
      integrityMode,
    })
  );
  const keyId = await ensureIosKeyId(integrityMode);
  report('Frontend resolved the App Attest key', formatLogIO({ integrityMode }, { keyId }));
  const assertionInput = {
    function: 'createIosAssertion',
    method: 'POST',
    path,
    bodyHash,
    challenge,
    keyId,
    integrityMode,
  };
  const assertion = await createIosAssertion(
    'POST',
    path,
    bodyHash,
    challenge,
    keyId,
    integrityMode
  );
  report(
    'Generate the App Attest assertion',
    formatLogIO(assertionInput, { assertion })
  );
  const proofInput = {
    function: 'formatIosProof',
    keyId,
    assertion,
    integrityMode,
  };
  const proof = formatIosProof(keyId, assertion, integrityMode);
  report('Format the iOS proof string', formatLogIO(proofInput, { proof }));
  return proof;
}

export async function createAndroidProtectedProof({
  report,
  integrityMode,
  challenge,
  bodyHash,
  path,
}: CreatePlatformProofParams) {
  const proofInput = {
    function: 'createAndroidProof',
    method: 'POST',
    path,
    bodyHash,
    challenge,
    integrityMode,
  };
  const proof = await createAndroidProof(
    'POST',
    path,
    bodyHash,
    challenge,
    integrityMode
  );
  report(
    'Request Play Integrity proof from the runtime',
    formatLogIO(proofInput, { proof })
  );
  return proof;
}

export async function submitProtectedJsonRequest<TRequest, TResponse>({
  report,
  apiBaseUrl,
  token,
  request,
  functionName,
  requestLabel,
  submit,
  successTitle,
}: SubmitJsonRequestParams<TRequest, TResponse>) {
  report(
    requestLabel,
    formatLogIO({
      function: functionName,
      baseUrl: apiBaseUrl,
      ...(token ? { token } : {}),
      request,
    })
  );
  const response = await submit(request);
  report(successTitle, formatLogIO(request, response), 'success');
  return response;
}

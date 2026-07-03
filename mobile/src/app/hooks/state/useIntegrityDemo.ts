import { useEffect, useState } from 'react';
import { mobileConfig } from '../../../config';
import {
  ensureIosKeyId,
  getIntegrityMode,
  getNativePlatform,
  isIntegrityModuleAvailable,
} from '../../../integrity';
import { useChallengeActions } from '../actions/useChallengeActions';
import { useDataActions } from '../actions/useDataActions';
import { useDeviceIntegrityActions } from '../actions/useDeviceIntegrityActions';
import { useLoginActions } from '../actions/useLoginActions';
import { requestIosRegistrationChallenge } from '../actions/steps/challengeSteps';
import {
  createRegistrationAttestation,
  submitIosKeyRegistration,
} from '../actions/steps/deviceIntegritySteps';
import { usePersistedDemoInputs } from './usePersistedDemoInputs';
import {
  loadRegisteredIosKeyId,
  saveRegisteredIosKey,
} from './iosRegistrationStore';
import { useRequestLog } from './useRequestLog';

export function useIntegrityDemo() {
  const apiBaseUrl = mobileConfig.apiBaseUrl;
  const requireNativeRuntime = mobileConfig.requireNativeRuntime;
  const [token, setToken] = useState('');
  const [challengeSummary, setChallengeSummary] = useState('');
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapStatus, setBootstrapStatus] = useState('');
  const { notes, password, setNotes, setPassword, setUsername, username } =
    usePersistedDemoInputs();
  const { loading, logGroups, requestStatus, withLoading } = useRequestLog();

  const integrityMode = getIntegrityMode();
  const nativePlatform = getNativePlatform();
  const integrityModuleAvailable = isIntegrityModuleAvailable();
  const nativeRuntimeRequiredButMissing =
    (requireNativeRuntime || integrityMode === 'real') &&
    !integrityModuleAvailable;

  useEffect(() => {
    let cancelled = false;

    async function bootstrapIosRegistration() {
      const shouldBootstrapIosRegistration =
        nativePlatform === 'ios' &&
        integrityMode === 'real' &&
        integrityModuleAvailable &&
        !nativeRuntimeRequiredButMissing;

      if (!shouldBootstrapIosRegistration) {
        return;
      }

      try {
        if (!cancelled) {
          setBootstrapLoading(true);
          setBootstrapStatus('Loading App Attest key...');
        }

        const keyId = await ensureIosKeyId(integrityMode);
        const registeredKeyId = await loadRegisteredIosKeyId();

        if (registeredKeyId === keyId) {
          return;
        }

        if (!cancelled) {
          setBootstrapStatus('Registering App Attest key...');
        }

        await withLoading(
          'Bootstrap iOS App Attest registration',
          'Startup Registration',
          async (report) => {
            const challenge = await requestIosRegistrationChallenge(
              report,
              apiBaseUrl
            );
            const { attestationObject, keyId: resolvedKeyId } =
              await createRegistrationAttestation(
                report,
                integrityMode,
                challenge.challenge
              );
            const response = await submitIosKeyRegistration(
              report,
              apiBaseUrl,
              challenge,
              resolvedKeyId,
              attestationObject
            );
            await saveRegisteredIosKey({
              deviceId: response.deviceId,
              keyId: response.keyId,
            });
          }
        );
      } catch (error) {
        console.warn('Failed during iOS App Attest bootstrap', error);
      } finally {
        if (!cancelled) {
          setBootstrapLoading(false);
          setBootstrapStatus('');
        }
      }
    }

    bootstrapIosRegistration();

    return () => {
      cancelled = true;
    };
  }, [
    apiBaseUrl,
    integrityMode,
    integrityModuleAvailable,
    nativePlatform,
    nativeRuntimeRequiredButMissing,
    withLoading,
  ]);

  const actionContext = {
    apiBaseUrl,
    integrityMode,
    nativePlatform,
    notes,
    password,
    token,
    username,
    setChallengeSummary,
    setToken,
  };

  const actions = {
    ...useChallengeActions(actionContext, withLoading),
    ...useDeviceIntegrityActions(actionContext, withLoading),
    ...useLoginActions(actionContext, withLoading),
    ...useDataActions(actionContext, withLoading),
  };

  return {
    actions,
    apiBaseUrl,
    bootstrapLoading,
    bootstrapStatus,
    challengeSummary,
    integrityMode,
    integrityModuleAvailable,
    loading,
    logGroups,
    nativePlatform,
    nativeRuntimeRequiredButMissing,
    notes,
    password,
    requestStatus,
    requireNativeRuntime,
    setNotes,
    setPassword,
    setUsername,
    token,
    username,
  };
}

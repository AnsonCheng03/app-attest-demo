import { useState } from 'react';
import { mobileConfig } from '../../../config';
import {
  getIntegrityMode,
  getNativePlatform,
  isIntegrityModuleAvailable,
} from '../../../integrity';
import { useChallengeActions } from '../actions/useChallengeActions';
import { useDataActions } from '../actions/useDataActions';
import { useDeviceIntegrityActions } from '../actions/useDeviceIntegrityActions';
import { useLoginActions } from '../actions/useLoginActions';
import { usePersistedDemoInputs } from './usePersistedDemoInputs';
import { useRequestLog } from './useRequestLog';

export function useIntegrityDemo() {
  const apiBaseUrl = mobileConfig.apiBaseUrl;
  const requireNativeRuntime = mobileConfig.requireNativeRuntime;
  const [token, setToken] = useState('');
  const [challengeSummary, setChallengeSummary] = useState('');
  const { notes, password, setNotes, setPassword, setUsername, username } =
    usePersistedDemoInputs();
  const { loading, logGroups, requestStatus, withLoading } = useRequestLog();

  const integrityMode = getIntegrityMode();
  const nativePlatform = getNativePlatform();
  const integrityModuleAvailable = isIntegrityModuleAvailable();
  const nativeRuntimeRequiredButMissing =
    (requireNativeRuntime || integrityMode === 'real') &&
    !integrityModuleAvailable;

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

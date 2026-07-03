import { useCallback, useState } from 'react';
import {
  formatErrorDetail,
  formatReportStepTitle,
  type ReportStep,
} from '../utils/integrityDemoHelpers';
import type { LogEntry, LogGroup } from '../../model/types';

export function useRequestLog() {
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');

  const appendLogEntry = useCallback((
    groupId: string,
    entry: Omit<LogEntry, 'id'>
  ) => {
    setLogGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              entries: [
                ...group.entries,
                { ...entry, id: `${groupId}-${group.entries.length + 1}` },
              ],
            }
          : group
      )
    );
  }, []);

  const startLogGroup = useCallback((title: string, flowTitle: string) => {
    const groupId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextGroup: LogGroup = {
      id: groupId,
      title,
      flowTitle,
      status: 'running',
      entries: [],
    };
    setLogGroups((current) => [nextGroup, ...current].slice(0, 12));
    return groupId;
  }, []);

  const setLogGroupStatus = useCallback((
    groupId: string,
    status: LogGroup['status']
  ) => {
    setLogGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, status } : group
      )
    );
  }, []);

  const updateRequestStatus = useCallback((title: string, detail?: string) => {
    setRequestStatus(detail ? `${title}: ${detail}` : title);
  }, []);

  const withLoading = useCallback(async (
    label: string,
    flowTitle: string,
    task: (report: ReportStep) => Promise<void>
  ) => {
    const groupId = startLogGroup(label, flowTitle);
    let lastStepTitle: string | undefined;
    let lastStepDetail: string | undefined;
    let stepNumber = 0;
    setLoading(true);
    updateRequestStatus(label, 'starting');
    try {
      await task((title, detail, tone = 'info') => {
        stepNumber += 1;
        const formattedTitle = formatReportStepTitle(stepNumber, title);
        lastStepTitle = formattedTitle;
        lastStepDetail = detail;
        updateRequestStatus(formattedTitle, detail);
        appendLogEntry(groupId, { title: formattedTitle, detail, tone });
      });
      appendLogEntry(groupId, {
        title: 'Completed',
        detail: `${label} finished successfully.`,
        tone: 'success',
      });
      setLogGroupStatus(groupId, 'success');
      updateRequestStatus(label, 'done');
    } catch (error) {
      appendLogEntry(groupId, {
        title: 'Request failed',
        detail: formatErrorDetail({
          stepTitle: lastStepTitle,
          stepDetail: lastStepDetail,
          error,
        }),
        tone: 'error',
      });
      setLogGroupStatus(groupId, 'error');
      updateRequestStatus(label, 'failed');
    } finally {
      setLoading(false);
    }
  }, [appendLogEntry, setLogGroupStatus, startLogGroup, updateRequestStatus]);

  return {
    loading,
    logGroups,
    requestStatus,
    withLoading,
  };
}

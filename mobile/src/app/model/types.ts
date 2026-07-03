export type LogEntry = {
  id: string;
  title: string;
  detail?: string;
  tone: 'info' | 'success' | 'error';
};

export type LogGroup = {
  id: string;
  title: string;
  flowTitle: string;
  status: 'running' | 'success' | 'error';
  entries: LogEntry[];
};

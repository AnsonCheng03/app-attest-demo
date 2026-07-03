import type { LogEntry } from '../../model/types';

export type ReportStep = (
  title: string,
  detail?: string,
  tone?: LogEntry['tone']
) => void;

export function formatReportStepTitle(stepNumber: number, title: string) {
  const normalizedTitle = title.replace(/^\d+\.\s*/, '');
  return `${stepNumber}. ${normalizedTitle}`;
}

export function previewValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length <= 80) {
      return value;
    }

    return `${value.slice(0, 32)}...${value.slice(-16)} (len=${value.length})`;
  }

  if (Array.isArray(value)) {
    return value.map(previewValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        previewValue(nestedValue),
      ])
    );
  }

  return value;
}

export function formatLogIO(input: unknown, output?: unknown) {
  const lines = [`Input: ${JSON.stringify(previewValue(input), null, 2)}`];

  if (output !== undefined) {
    lines.push(`Output: ${JSON.stringify(previewValue(output), null, 2)}`);
  }

  return lines.join('\n');
}

export function formatErrorDetail(context: {
  stepTitle?: string;
  stepDetail?: string;
  error: unknown;
}) {
  const message =
    context.error instanceof Error ? context.error.message : String(context.error);

  return [
    `Failed at: ${context.stepTitle ?? 'unknown step'}`,
    context.stepDetail ? `Last detail: ${context.stepDetail}` : undefined,
    `Error: ${message}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function isRecoverableIosRegistrationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /stale|invalidinput|invalid input|invalid key/i.test(message);
}

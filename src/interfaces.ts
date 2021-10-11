type milliseconds = number;

export type RTQTaskId = string;

export enum RTQStatus {
  NEW = 'NEW',
  QUEUED = 'QUEUED',
  INITIATED = 'INITIATED',
  RETRIED = 'RETRIED',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  AWAITING_RETRY = 'AWAITING_RETRY',
  AWAITING_NEXT_RUN = 'AWAITING_NEXT_RUN',
  SUCCEEDED = 'SUCCEEDED',
}

export interface RTQTask<O = {}> {
  id: RTQTaskId;
  status: RTQStatus;
  waitTimeBetweenRuns: milliseconds;
  taskName: string;
  maxRetries: number;
  retryCount: number;
  lastRun: Date;
  taskOptions: O;
}

export interface RTQQueueEntry {
  id: string;
  taskId: RTQTaskId;
  queuedAt: Date;
}

export interface RTQLogEntry {
  timestamp: Date;
  action: string;
  triggeredBy: string;
}

export type RTQTaskHandler<O = {}> = (taskOptions: O) => Promise<void>;

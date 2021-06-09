type milliseconds = number;

export type QueueonTaskId = string;

export enum QueueonStatus {
  NEW = 'NEW',
  QUEUED = 'QUEUED',
  INITIATED = 'INITIATED',
  RETRIED = 'RETRIED',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  AWAITING_RETRY = 'AWAITING_RETRY',
  SUCCEEDED = 'SUCCEEDED',
}

export interface QueueonTask<O> {
  id: QueueonTaskId;
  status: QueueonStatus;
  waitTimeBetweenRuns: milliseconds;
  timeout: milliseconds;
  taskName: string;
  maxRetries: number;
  retryCount: number;
  lastRun: Date;
  taskOptions: O;
}

export interface QueueonQueueEntry {
  id: string;
  taskId: QueueonTaskId;
  queuedAt: Date;
}

export interface QueueonLogEntry {
  timestamp: Date;
  action: string;
  triggeredBy: string;
}

// Run if: (lastRun) > minMsBetweenRuns 

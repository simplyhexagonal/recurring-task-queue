declare type milliseconds = number;
export declare type RTQTaskId = string;
export declare enum RTQStatusEnum {
    NEW = "NEW",
    QUEUED = "QUEUED",
    INITIATED = "INITIATED",
    RETRIED = "RETRIED",
    IN_PROGRESS = "IN_PROGRESS",
    FAILED = "FAILED",
    AWAITING_RETRY = "AWAITING_RETRY",
    AWAITING_NEXT_RUN = "AWAITING_NEXT_RUN",
    SUCCEEDED = "SUCCEEDED"
}
export interface RTQTask<O extends unknown> {
    id: RTQTaskId;
    status: RTQStatusEnum;
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
    reason: string;
    triggeredBy: string;
}
export declare type RTQTaskHandler<O extends unknown> = (taskOptions: O) => Promise<void>;
export {};

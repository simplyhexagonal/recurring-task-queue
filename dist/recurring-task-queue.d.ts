import ShortUniqueId from 'short-unique-id';
import { RTQLogEntry, RTQQueueEntry, RTQStatusEnum, RTQTask, RTQTaskHandler } from "./interfaces";
export * from "./interfaces";
export declare const RTQStatus: {
    NEW: RTQStatusEnum.NEW;
    QUEUED: RTQStatusEnum.QUEUED;
    INITIATED: RTQStatusEnum.INITIATED;
    RETRIED: RTQStatusEnum.RETRIED;
    IN_PROGRESS: RTQStatusEnum.IN_PROGRESS;
    FAILED: RTQStatusEnum.FAILED;
    AWAITING_RETRY: RTQStatusEnum.AWAITING_RETRY;
    AWAITING_NEXT_RUN: RTQStatusEnum.AWAITING_NEXT_RUN;
    SUCCEEDED: RTQStatusEnum.SUCCEEDED;
};
declare type RTQCustomErrorHandler = (error: any) => Promise<void>;
interface RTQOptions {
    fetchTasks: () => Promise<RTQTask<unknown>[]>;
    updateTask: (task: RTQTask<unknown>) => Promise<void>;
    createQueueEntry: (queueEntry: RTQQueueEntry) => Promise<void>;
    fetchQueueEntries: () => Promise<RTQQueueEntry[]>;
    removeQueueEntry: (queueEntry: RTQQueueEntry) => Promise<void>;
    logAction: (logEntry: RTQLogEntry) => Promise<void>;
    taskHandlers: {
        [k: string]: RTQTaskHandler<unknown>;
    };
    errorHandler?: RTQCustomErrorHandler;
    maxConcurrentTasks?: number;
}
export default class RTQ {
    static RTQStatus: {
        NEW: RTQStatusEnum.NEW;
        QUEUED: RTQStatusEnum.QUEUED;
        INITIATED: RTQStatusEnum.INITIATED;
        RETRIED: RTQStatusEnum.RETRIED;
        IN_PROGRESS: RTQStatusEnum.IN_PROGRESS;
        FAILED: RTQStatusEnum.FAILED;
        AWAITING_RETRY: RTQStatusEnum.AWAITING_RETRY;
        AWAITING_NEXT_RUN: RTQStatusEnum.AWAITING_NEXT_RUN;
        SUCCEEDED: RTQStatusEnum.SUCCEEDED;
    };
    options: RTQOptions;
    runningTasks: number;
    uid: ShortUniqueId;
    ticking: boolean;
    constructor(options: RTQOptions);
    changeTaskStatus({ task, status, reason, triggeredBy, retryCount, lastRun, }: {
        task: RTQTask<unknown>;
        status: RTQStatusEnum;
        reason?: string;
        triggeredBy?: string;
        retryCount?: number;
        lastRun?: Date;
    }): Promise<{
        status: RTQStatusEnum;
        retryCount: number;
        lastRun: Date;
        id: string;
        waitTimeBetweenRuns: number;
        taskName: string;
        maxRetries: number;
        taskOptions: unknown;
    } | null>;
    queueTask(task: RTQTask<unknown>, index: number, taskArray: RTQTask<unknown>[]): Promise<{
        status: RTQStatusEnum;
        retryCount: number;
        lastRun: Date;
        id: string;
        waitTimeBetweenRuns: number;
        taskName: string;
        maxRetries: number;
        taskOptions: unknown;
    } | null>;
    processTask(task: RTQTask<unknown>, index: number, taskArray: RTQTask<unknown>[]): Promise<void>;
    tick(): Promise<void>;
}

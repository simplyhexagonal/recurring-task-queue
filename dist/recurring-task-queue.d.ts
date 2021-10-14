import ShortUniqueId from 'short-unique-id';
import { RTQEvent, RTQQueueEntry, RTQStatusEnum, RTQActionEnum, RTQTask, RTQTaskHandler } from "./interfaces";
export * from "./interfaces";
export { version } from '../package.json';
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
export declare const RTQAction: {
    MODIFY_TASK_STATUS: RTQActionEnum.MODIFY_TASK_STATUS;
    MODIFY_QUEUE: RTQActionEnum.MODIFY_QUEUE;
};
declare type RTQCustomErrorHandler = (error: any) => Promise<void>;
interface RTQOptions {
    fetchTasks: () => Promise<RTQTask<unknown>[]>;
    updateTask: (task: RTQTask<unknown>) => Promise<void>;
    createQueueEntry: (queueEntry: RTQQueueEntry) => Promise<void>;
    fetchQueueEntries: () => Promise<RTQQueueEntry[]>;
    removeQueueEntry: (queueEntry: RTQQueueEntry) => Promise<void>;
    taskHandlers: {
        [k: string]: RTQTaskHandler<unknown>;
    };
    eventHandler: (event: RTQEvent) => Promise<void>;
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
    static version: string;
    options: RTQOptions;
    runningTasks: number;
    uid: ShortUniqueId;
    ticking: boolean;
    constructor(options: RTQOptions);
    modifyTaskStatus({ task, status, reason, triggeredBy, retryCount, lastRun, }: {
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

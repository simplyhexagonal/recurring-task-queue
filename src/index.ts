import {
  RTQEvent,
  RTQQueueEntry,
  RTQStatusEnum,
  RTQActionEnum,
  RTQTask,
  RTQTaskHandler,
} from "./interfaces";

// @ts-ignore
import { version } from '../package.json';

export * from "./interfaces";
// @ts-ignore
export { version } from '../package.json';

export const RTQStatus = { ...RTQStatusEnum };
export const RTQAction = { ...RTQActionEnum };


let ShortUniqueId: any;

if (typeof window !== 'undefined')  {
  ShortUniqueId = (window as any).ShortUniqueId;
} else {
  ShortUniqueId = require('short-unique-id');
}

type RTQCustomErrorHandler = (error: any) => Promise<void>;

interface RTQOptions {
  fetchTasks: () => Promise<RTQTask<unknown>[]>;
  updateTask: (task: RTQTask<unknown>) => Promise<void>;
  createQueueEntry: (queueEntry: RTQQueueEntry) => Promise<void>;
  fetchQueueEntries: () => Promise<RTQQueueEntry[]>;
  removeQueueEntry: (queueEntry: RTQQueueEntry) => Promise<void>;
  taskHandlers: {[k: string]: RTQTaskHandler<unknown>};
  eventHandler: (event: RTQEvent) => Promise<void>;
  errorHandler?: RTQCustomErrorHandler;
  maxConcurrentTasks?: number;
}

const defaultOptions: Partial<RTQOptions> = {
  maxConcurrentTasks: 0,
  errorHandler: async (e) => console.log(e),
}

export default class RTQ {
  static RTQStatus = RTQStatus;
  static version = version;

  options: RTQOptions;
  runningTasks: number = 0;
  uid: any;
  ticking: boolean = false;
  
  constructor(options: RTQOptions) {
    this.options = {
      ...defaultOptions,
      ...options,
    };

    this.uid = new ShortUniqueId();
  }

  async modifyTaskStatus({
    task,
    status,
    reason,
    triggeredBy,
    retryCount,
    lastRun,
  }: {
    task: RTQTask<unknown>;
    status: RTQStatusEnum;
    reason?: string;
    triggeredBy?: string;
    retryCount?: number;
    lastRun?: Date;
  }) {
    const {
      options: {
        updateTask,
        eventHandler,
        errorHandler,
      },
    } = this;

    const updatedTask = {
      ...task,
      status,
      retryCount: retryCount || task.retryCount,
      lastRun: lastRun || task.lastRun,
    };

    return await updateTask(updatedTask)
      .then(() => {
        eventHandler({
          timestamp: new Date(),
          action: RTQAction.MODIFY_TASK_STATUS,
          message: `changed status of ${task.taskName} to ${status}`,
          reason: reason || '',
          additionalData: {
            taskId: task.id,
            taskName: task.taskName,
            prevStatus: task.status,
            status,
          },
          triggeredBy: triggeredBy || 'RTQ',
        }).catch(errorHandler);

        return updatedTask;
      })
      .catch((e) => {
        (errorHandler as RTQCustomErrorHandler)(e);

        eventHandler({
          timestamp: new Date(),
          action: RTQAction.MODIFY_TASK_STATUS,
          message: `failed changing status of ${task.taskName} to ${status}`,
          reason: reason || '',
          additionalData: {
            taskId: task.id,
            taskName: task.taskName,
            prevStatus: task.status,
            status,
          },
          triggeredBy: triggeredBy || 'RTQ',
        }).catch(errorHandler);

        return null;
      });
  }

  async queueTask(
    task: RTQTask<unknown>,
    index: number,
    taskArray: RTQTask<unknown>[]
  ) {
    const {
      options: {
        createQueueEntry,
        eventHandler,
        errorHandler,
      },
    } = this;

    const queryEntry: RTQQueueEntry = {
      id: this.uid.stamp(16),
      taskId: task.id,
      queuedAt: new Date(),
    };

    const result = await createQueueEntry(queryEntry).then(() => {
      eventHandler({
        timestamp: new Date(),
        action: RTQAction.MODIFY_QUEUE,
        message: `added queue entry ${queryEntry.id} to queue`,
        reason: 'tick',
        additionalData: queryEntry,
        triggeredBy: 'RTQ',
      }).catch(errorHandler);
    }).catch(
      (e) => {
        (errorHandler as RTQCustomErrorHandler)(e);
        return null;
      }
    );

    if (result === null) {
      return null;
    }

    return await this.modifyTaskStatus({
      task,
      status: RTQStatus.QUEUED,
    });
  }

  async processTask(
    task: RTQTask<unknown>,
    index: number,
    taskArray: RTQTask<unknown>[]
  ) {
    this.runningTasks += 1;

    const {
      taskName,
      taskOptions,
      lastRun,
      waitTimeBetweenRuns,
      retryCount: taskRetryCount,
      maxRetries,
    } = task;

    const msSinceLastRun = (Date.now().valueOf() - lastRun.valueOf());

    if (msSinceLastRun < waitTimeBetweenRuns) {
      await this.modifyTaskStatus({
        task: task,
        status: RTQStatus.AWAITING_RETRY,
      });

      return;
    }

    const {
      options: {
        taskHandlers,
        errorHandler,
      },
    } = this;

    let status = RTQStatus.INITIATED;
    let retryCount = taskRetryCount;

    if (retryCount > 0) {
      status = RTQStatus.RETRIED;
    }

    let upToDateTask: RTQTask<unknown> | null = task;

    upToDateTask = await this.modifyTaskStatus({
      task: upToDateTask,
      status,
      retryCount,
    });

    if (upToDateTask === null) {
      return;
    }

    upToDateTask = await this.modifyTaskStatus({
      task: upToDateTask,
      status: RTQStatus.IN_PROGRESS,
      lastRun: new Date(),
    });

    if (upToDateTask === null) {
      return;
    }

    taskHandlers[taskName](taskOptions)
      .then(async () => {
        upToDateTask = await this.modifyTaskStatus({
          task: (upToDateTask as RTQTask<unknown>),
          status: RTQStatus.SUCCEEDED,
          retryCount: 0,
        });
      })
      .catch(async (e) => {
        if (errorHandler) {
          errorHandler(e).catch(console.log);
        }

        let status = RTQStatus.AWAITING_RETRY;

        if (retryCount >= maxRetries) {
          status = RTQStatus.FAILED;
        }

        retryCount += 1;

        upToDateTask = await this.modifyTaskStatus({
          task: (upToDateTask as RTQTask<unknown>),
          status,
          retryCount,
          reason: e.message || JSON.stringify(e),
        });
      })
      .finally(() => {
        this.runningTasks -= 1;
      });
  }

  async tick() {
    if (this.ticking) {
      return;
    }

    this.ticking = true;

    const {
      options: {
        fetchTasks,
        fetchQueueEntries,
        removeQueueEntry,
        maxConcurrentTasks,
        eventHandler,
        errorHandler,
      }
    } = this;

    let tasks = await fetchTasks().catch(errorHandler) as RTQTask<unknown>[];

    if (!Array.isArray(tasks)) {
      return;
    }

    const queueEntries = await fetchQueueEntries().catch(errorHandler);

    if (!Array.isArray(queueEntries)) {
      return;
    }

    const filteredEntries = queueEntries.sort((a, b) => {
      return (new Date(b.queuedAt).getTime()) - (new Date(a.queuedAt).getTime());
    }).reduce((a, b) => {
      if (maxConcurrentTasks === 0 || a.length < (maxConcurrentTasks as number)) {
        a.push(b);
      }

      return a;
    }, [] as RTQQueueEntry[]);

    await Promise.all(
      filteredEntries.map(
        async (q) => await removeQueueEntry(q).then(() => {
          eventHandler({
            timestamp: new Date(),
            action: RTQAction.MODIFY_QUEUE,
            message: `removed queue entry ${q.id} from queue`,
            reason: 'tick',
            additionalData: q,
            triggeredBy: 'RTQ',
          }).catch(errorHandler);
        }).catch((e) => {
          eventHandler({
            timestamp: new Date(),
            action: RTQAction.MODIFY_QUEUE,
            message: `failed removing queue entry ${q.id} from queue`,
            reason: e.message || JSON.stringify(e),
            additionalData: {error: e},
            triggeredBy: 'RTQ',
          }).catch(errorHandler);

          (errorHandler as RTQCustomErrorHandler)(e);
        })
      )
    ).catch(errorHandler);

    const tasksReadyToProcess = filteredEntries.map(
      (qe) => tasks.find((t) => t.id === qe.taskId)
    );

    const numOfTasksProcessed = tasksReadyToProcess.length;

    (tasksReadyToProcess as RTQTask<unknown>[]).forEach(
      (t, i, a) => this.processTask(t, i, a)
    );

    tasks = await fetchTasks().catch(errorHandler) as RTQTask<{}>[];

    if (!Array.isArray(tasks)) {
      return;
    }

    const tasksToBeQueued = tasks.filter(
      (t) => (
        (tasksReadyToProcess as RTQTask<unknown>[]).findIndex((tp) => t.id === tp.id) < 0
      )
    ).filter(
      (t) => (
        t.status === RTQStatus.NEW
        || t.status === RTQStatus.AWAITING_RETRY
        || t.status === RTQStatus.SUCCEEDED
      )
    );

    await Promise.all(
      tasksToBeQueued.map(
        async (t, i, a) => await this.queueTask(t, i, a).catch(
          (e) => {
            (errorHandler as RTQCustomErrorHandler)(e);
            return null;
          }
        )
      )
    ).then((a) => {
      this.ticking = false;

      if (
        numOfTasksProcessed < 1
        && tasksToBeQueued.length > 0
        && !a.includes(null)
      ) {
        this.tick();
      }
    }).catch(errorHandler);
  }
}

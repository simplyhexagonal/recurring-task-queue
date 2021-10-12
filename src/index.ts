import ShortUniqueId from 'short-unique-id';

import {
  RTQLogEntry,
  RTQQueueEntry,
  RTQStatusEnum,
  RTQTask,
  RTQTaskHandler,
} from "./interfaces";

export * from "./interfaces";

export const RTQStatus = {...RTQStatusEnum};

type RTQCustomErrorHandler = (error: any) => Promise<void>;

interface RTQOptions {
  fetchTasks: () => Promise<RTQTask<unknown>[]>;
  updateTask: (task: RTQTask<unknown>) => Promise<void>;
  createQueueEntry: (queueEntry: RTQQueueEntry) => Promise<void>;
  fetchQueueEntries: () => Promise<RTQQueueEntry[]>;
  removeQueueEntry: (queueEntry: RTQQueueEntry) => Promise<void>;
  logAction: (logEntry: RTQLogEntry) => Promise<void>;
  taskHandlers: {[k: string]: RTQTaskHandler<unknown>};
  errorHandler?: RTQCustomErrorHandler;
  maxConcurrentTasks?: number;
}

const defaultOptions: Partial<RTQOptions> = {
  maxConcurrentTasks: 0,
  errorHandler: async (e) => console.log(e),
}

export default class RTQ {
  static RTQStatus = RTQStatus;

  options: RTQOptions;
  runningTasks: number = 0;
  uid: ShortUniqueId;
  ticking: boolean = false;
  
  constructor(options: RTQOptions) {
    this.options = {
      ...defaultOptions,
      ...options,
    };

    this.uid = new ShortUniqueId();
  }

  async changeTaskStatus({
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
        logAction,
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
        logAction({
          timestamp: new Date(),
          action: `changed status of ${task.taskName} to ${status}`,
          reason: reason || '',
          triggeredBy: triggeredBy || 'RTQ',
        }).catch(errorHandler);

        return updatedTask;
      })
      .catch((e) => {
        (errorHandler as RTQCustomErrorHandler)(e);

        logAction({
          timestamp: new Date(),
          action: `failed changing status of ${task.taskName} to ${status}`,
          reason: reason || '',
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
        errorHandler,
      },
    } = this;

    const result = await createQueueEntry({
      id: this.uid.stamp(16),
      taskId: task.id,
      queuedAt: new Date(),
    }).catch(
      (e) => {
        (errorHandler as RTQCustomErrorHandler)(e);
        return null;
      }
    );

    if (result === null) {
      return null;
    }

    return await this.changeTaskStatus({
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
      await this.changeTaskStatus({
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

    upToDateTask = await this.changeTaskStatus({
      task: upToDateTask,
      status,
      retryCount,
    });

    if (upToDateTask === null) {
      return;
    }

    upToDateTask = await this.changeTaskStatus({
      task: upToDateTask,
      status: RTQStatus.IN_PROGRESS,
      lastRun: new Date(),
    });

    if (upToDateTask === null) {
      return;
    }

    taskHandlers[taskName](taskOptions)
      .then(async () => {
        upToDateTask = await this.changeTaskStatus({
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

        upToDateTask = await this.changeTaskStatus({
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
        logAction,
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
        async (q) => await removeQueueEntry(q).catch((e) => {
          (errorHandler as RTQCustomErrorHandler)(e);

          logAction({
            timestamp: new Date(),
            action: `failed removing queue entry ${q.id} from queue`,
            reason: e.message || JSON.stringify(e),
            triggeredBy: 'RTQ',
          }).catch(errorHandler);
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

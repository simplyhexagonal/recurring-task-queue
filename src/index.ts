import {
  RTQLogEntry,
  RTQQueueEntry,
  RTQStatus,
  RTQTask,
  RTQTaskHandler,
} from "./interfaces";

interface RTQOptions {
  fetchTasks: () => Promise<RTQTask[]>;
  updateTask: (task: RTQTask) => Promise<void>;
  createQueueEntry: (queueEntry: RTQQueueEntry) => Promise<void>;
  fetchQueueEntries: () => Promise<RTQQueueEntry[]>;
  removeQueueEntry: (queueEntry: RTQQueueEntry) => Promise<void>;
  logAction: (logEntry: RTQLogEntry) => Promise<void>;
  taskHandlers: {[k: string]: RTQTaskHandler};
  maxConcurrentTasks?: number;
}

const defaultOptions: Partial<RTQOptions> = {
  maxConcurrentTasks: 0,
}

export default class RTQ {
  options: RTQOptions;
  runningTasks: number = 0;
  
  constructor(options: RTQOptions) {
    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  async changeTaskStatus({
    task,
    status,
    triggeredBy,
    retryCount,
    lastRun,
  }: {
    task: RTQTask<unknown>;
    status: RTQStatus;
    triggeredBy?: string;
    retryCount?: number;
    lastRun?: Date;
  }) {
    const {
      options: {
        updateTask,
        logAction,
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
          triggeredBy: triggeredBy || 'RTQ',
        });

        return updatedTask;
      })
      .catch(() => {
        logAction({
          timestamp: new Date(),
          action: `failed changing status of ${task.taskName} to ${status}`,
          triggeredBy: triggeredBy || 'RTQ',
        });

        return task;
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
      },
    } = this;

    await createQueueEntry({
      id: task.id,
      taskId: task.id,
      queuedAt: new Date(),
    });

    await this.changeTaskStatus({
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
      },
    } = this;

    let status = RTQStatus.INITIATED;
    let retryCount = taskRetryCount;

    if (retryCount > 0) {
      status = RTQStatus.RETRIED;
      retryCount += 1;
    }

    let upToDateTask = task;

    upToDateTask = await this.changeTaskStatus({
      task: upToDateTask,
      status,
      retryCount,
    });

    upToDateTask = await this.changeTaskStatus({
      task: upToDateTask,
      status: RTQStatus.IN_PROGRESS,
      lastRun: new Date(),
    });

    taskHandlers[taskName](taskOptions)
      .then(async () => {
        upToDateTask = await this.changeTaskStatus({
          task: upToDateTask,
          status: RTQStatus.SUCCEEDED,
          retryCount: 0,
        });
      })
      .catch(async () => {
        let status = RTQStatus.AWAITING_RETRY;

        if (retryCount >= maxRetries) {
          status = RTQStatus.FAILED;
        }

        upToDateTask = await this.changeTaskStatus({
          task: upToDateTask,
          status,
        });
      })
      .finally(() => {
        this.runningTasks -= 1;
      });
  }

  async tick() {
    const {
      options: {
        fetchTasks,
        fetchQueueEntries,
        removeQueueEntry,
        maxConcurrentTasks,
        logAction,
      }
    } = this;

    let tasks = await fetchTasks();

    const queueEntries = (await fetchQueueEntries() || []).sort(function(a, b){
      return (new Date(b.queuedAt).getTime()) - (new Date(a.queuedAt).getTime());
    });

    const filteredEntries = queueEntries.reduce((a, b) => {
      if (maxConcurrentTasks === 0 || a.length < maxConcurrentTasks) {
        a.push(b);
      }

      return a;
    }, [] as RTQQueueEntry[]);

    await Promise.all(
      filteredEntries.map(
        async (q) => await removeQueueEntry(q).catch((e) => logAction({
          timestamp: new Date(),
          action: `failed removing queue entry ${q.id} from queue`,
          triggeredBy: 'RTQ',
        }))
      )
    );

    const tasksReadyToProcess = filteredEntries.map(
      (qe) => tasks.find((t) => t.id === qe.taskId)
    );

    tasksReadyToProcess.map(
      (t, i, a) => this.processTask(t, i, a)
    );

    tasks = await fetchTasks();
    await Promise.all(tasks.filter(
      (t) => (
        t.status === RTQStatus.NEW
        || t.status === RTQStatus.AWAITING_RETRY
        || t.status === RTQStatus.SUCCEEDED
      )
    ).map(async (t, i, a) => await this.queueTask(t, i, a)));
  }
}

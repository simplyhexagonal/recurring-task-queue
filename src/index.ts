import {
  QueueonLogEntry,
  QueueonQueueEntry,
  QueueonStatus,
  QueueonTask,
  QueueonTaskId,
} from "./interfaces";

interface QueueonOptions {
  fetchTasks: <O>() => Promise<QueueonTask<O>[]>;
  updateTask: <O>(task: QueueonTask<O>) => Promise<void>;
  createQueueEntry: (queueEntry: QueueonQueueEntry) => Promise<void>;
  fetchQueueEntries: () => Promise<QueueonQueueEntry[]>;
  removeQueueEntry: (queueEntry: QueueonQueueEntry) => Promise<void>;
  logAction: (logEntry: QueueonLogEntry) => Promise<void>;
  taskHandlers: {[k: string]: <O>(taskOptions: O) => Promise<void>};
  maxConcurrentTasks?: number;
}

const defaultOptions: Partial<QueueonOptions> = {
  maxConcurrentTasks: 0,
}

export default class Queueon {
  options: QueueonOptions;
  runningTasks: number = 0;
  
  constructor(options: QueueonOptions) {
    this.options = {
      ...defaultOptions,
      ...options,
    };
  }

  async changeTaskStatus(
    task: QueueonTask<unknown>,
    status: QueueonStatus,
    triggeredBy?: string,
  ) {
    const {
      options: {
        updateTask,
        logAction,
      },
    } = this;

    await updateTask({
      ...task,
    })
      .then(() => {
        logAction({
          timestamp: new Date(),
          action: '', // Changed status to ...
          triggeredBy: '', // Queueon
        });
      })
      .catch(() => {
        logAction({
          timestamp: new Date(),
          action: '', // Failed changing status to ...
          triggeredBy: '', // Queueon
        });
      });
  }

  async queueTask(
    task: QueueonTask<unknown>,
    index: number,
    taskArray: QueueonTask<unknown>[]
  ) {
    const {
      options: {
        createQueueEntry,
      },
      changeTaskStatus,
    } = this;

    await createQueueEntry({
      id: '',
      taskId: task.id,
      queuedAt: new Date(),
    });

    await changeTaskStatus
    // status: queued
  }

  async processTask(
    task: QueueonTask<unknown>,
    index: number,
    taskArray: QueueonTask<unknown>[]
  ) {
    this.runningTasks += 1;

    const {
      taskName,
      taskOptions,
    } = task;

    // if - < waitTimeBetweenRuns return;

    const {
      options: {
        taskHandlers,
      },
      changeTaskStatus,
    } = this;

    // Determine initiated, retried or failed

    await changeTaskStatus
    // status: initiated, retried or failed

    // if not failed
    await changeTaskStatus
    // status: in progress

    taskHandlers[taskName](taskOptions)
      .then(async () => {
        await changeTaskStatus
        // status: succeeded
      })
      .catch(async () => {
        // if < maxRetries
        await changeTaskStatus
        // status: awaiting retry
      })
      .finally(() => {});
  }

  async tick() {
    const {
      options: {
        fetchTasks,
        fetchQueueEntries,
        removeQueueEntry,
        maxConcurrentTasks,
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
    }, [] as QueueonQueueEntry[]);

    await Promise.all(filteredEntries.map(async (q) => await removeQueueEntry(q)));

    const queuedTasks = filteredEntries.map((qe) => tasks.find((t) => t.id === qe.taskId));

    queuedTasks.map(this.processTask).forEach((p) => p.finally(() => this.runningTasks -= 1));

    tasks = await fetchTasks();
    tasks.filter(
      (t) => (
        t.status === QueueonStatus.NEW
        || t.status === QueueonStatus.AWAITING_RETRY
        || t.status === QueueonStatus.SUCCEEDED
      )
    ).forEach(this.queueTask);
  }

  stop(
    taskId: QueueonTaskId,
    triggeredBy: string,
  ) {
    //...
  }

  abandon(
    taskId: QueueonTaskId,
    triggeredBy: string,
  ) {
    //...
  }

  delete(
    taskId: QueueonTaskId,
    triggeredBy: string,
  ) {
    //...
  }

  restart(
    taskId: QueueonTaskId,
    triggeredBy: string,
  ) {
    //...
  }
}

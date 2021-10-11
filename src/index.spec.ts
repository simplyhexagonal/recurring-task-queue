import RTQ from '.';
import {
  RTQLogEntry,
  RTQQueueEntry,
  RTQStatus,
  RTQTask,
  RTQTaskHandler,
} from './interfaces';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const taskRunCounts = {
  hello: 0,
  goodbye: 0,
  error: 0,
  errorOnce: 0,
};

interface helloTaskOptions {
  arrivingUser: string;
}

const helloTask: RTQTaskHandler = async (taskOptions: helloTaskOptions) => {
  await sleep(100);

  taskRunCounts.hello += 1;

  console.log(`
  👋 hello ${taskOptions.arrivingUser}
  `);
};

interface goodbyeTaskOptions {
  departingUser: string;
}

const goodbyeTask: RTQTaskHandler = async (taskOptions: goodbyeTaskOptions) => {
  await sleep(100);

  taskRunCounts.goodbye += 1;

  console.log(`
  🚀 goodbye ${taskOptions.departingUser}
  `);
};

const errorTask: RTQTaskHandler = async () => {
  await sleep(100);

  taskRunCounts.error += 1;

  throw new Error('this error will always happen');
};

let errorOnce = false;

const errorOnceTask: RTQTaskHandler = async () => {
  await sleep(100);

  taskRunCounts.errorOnce += 1;

  if (!errorOnce) {
    errorOnce = true;
    throw new Error('this error will happen once');
  }
};

type allTaskOptions = helloTaskOptions | goodbyeTaskOptions;

const tasks: RTQTask<allTaskOptions>[] = [
  {
    id: '1',
    status: RTQStatus.NEW,
    waitTimeBetweenRuns: 600,
    taskName: 'hello',
    maxRetries: 1,
    retryCount: 0,
    lastRun: new Date(0),
    taskOptions: {
      arrivingUser: 'you',
    },
  },
  {
    id: '2',
    status: RTQStatus.NEW,
    waitTimeBetweenRuns: 600,
    taskName: 'goodbye',
    maxRetries: 1,
    retryCount: 0,
    lastRun: new Date(0),
    taskOptions: {
      departingUser: 'you',
    },
  }
];

const queue: RTQQueueEntry[] = [];

const fetchTasks = async () => tasks;

const updateTask = async (task: RTQTask<allTaskOptions>) => {
  const i = tasks.findIndex((t) => t.id === task.id);

  tasks[i] = task;

  // console.log(tasks.map((t) => ({
  //   taskName: t.taskName,
  //   lastRun: t.lastRun,
  // })));
};

const createQueueEntry = async (queueEntry: RTQQueueEntry) => {
  queue.push(queueEntry);
};

const fetchQueueEntries = async () => queue;

const removeQueueEntry = async (queueEntry: RTQQueueEntry) => {
  const i = queue.findIndex((qe) => qe.id === queueEntry.id);
  if (i > -1) {
    queue.splice(i, 1);
  } else {
    throw new Error();
  }
};

const logAction = async (logEntry: RTQLogEntry) => {
  console.info(logEntry);
};

const taskHandlers: {[k: string]: RTQTaskHandler} = {
  hello: helloTask,
  goodbye: goodbyeTask,
  // error: errorTask,
  // errorOnce: errorOnceTask,
};

const recurring = new RTQ({
  fetchTasks,
  updateTask,
  createQueueEntry,
  fetchQueueEntries,
  removeQueueEntry,
  logAction,
  taskHandlers,
});

describe('Recurring Task Queue', () => {
  it('', async () => {
    expect(recurring.runningTasks).toBe(0);

    // this merely queues the tasks
    await recurring.tick();

    let tickPromise = recurring.tick();

    await sleep(100);

    expect(recurring.runningTasks).toBeGreaterThan(0);

    await tickPromise;

    await sleep(100);

    expect(taskRunCounts.hello).toBe(1);
    expect(taskRunCounts.goodbye).toBe(1);
    // expect(taskRunCounts.error).toBe(1);
    // expect(taskRunCounts.errorOnce).toBe(1);
  });
});

import RTQ, {
  RTQLogEntry,
  RTQQueueEntry,
  RTQStatus,
  RTQTask,
  RTQTaskHandler,
} from './';

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

const helloTask: RTQTaskHandler<helloTaskOptions> = async (taskOptions) => {
  await sleep(100);

  taskRunCounts.hello += 1;

  console.log(`
  👋 hello ${taskOptions.arrivingUser}
  `);
};

interface goodbyeTaskOptions {
  departingUser: string;
}

const goodbyeTask: RTQTaskHandler<goodbyeTaskOptions> = async (taskOptions) => {
  await sleep(100);

  taskRunCounts.goodbye += 1;

  console.log(`
  🚀 goodbye ${taskOptions.departingUser}
  `);
};

const errorMessage = 'this error will always happen';

const errorTask: RTQTaskHandler<{}> = async () => {
  taskRunCounts.error += 1;

  throw new Error(errorMessage);
};

let errorOnce = false;

const errorOnceMessage = 'this error will happen once';

const errorOnceTask: RTQTaskHandler<{}> = async () => {
  await sleep(100);

  taskRunCounts.errorOnce += 1;

  if (!errorOnce) {
    errorOnce = true;
    throw new Error(errorOnceMessage);
  }

  console.log(`
  😅 I only errored out the first time
  `);
};

type allTaskOptions = helloTaskOptions | goodbyeTaskOptions | any;

const allTasks: RTQTask<allTaskOptions>[] = [
  {
    id: '1',
    status: RTQStatus.NEW,
    waitTimeBetweenRuns: 200,
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
    waitTimeBetweenRuns: 200,
    taskName: 'goodbye',
    maxRetries: 1,
    retryCount: 0,
    lastRun: new Date(0),
    taskOptions: {
      departingUser: 'you',
    },
  },
  {
    id: '3',
    status: RTQStatus.NEW,
    waitTimeBetweenRuns: 200,
    taskName: 'error',
    maxRetries: 1,
    retryCount: 0,
    lastRun: new Date(0),
    taskOptions: {},
  },
  {
    id: '4',
    status: RTQStatus.NEW,
    waitTimeBetweenRuns: 200,
    taskName: 'errorOnce',
    maxRetries: 1,
    retryCount: 0,
    lastRun: new Date(0),
    taskOptions: {},
  }
];

const queue: RTQQueueEntry[] = [];

const fetchTasks = async () => allTasks;

const fetchMockTasks = async () => ([
  {
    id: '1',
    status: RTQStatus.NEW,
    waitTimeBetweenRuns: 200,
    taskName: 'hello',
    maxRetries: 1,
    retryCount: 0,
    lastRun: new Date(0),
    taskOptions: {
      arrivingUser: 'you',
    },
  }
]);

const updateTask = async (task: RTQTask<allTaskOptions>) => {
  const i = allTasks.findIndex((t) => t.id === task.id);

  allTasks[i] = task;
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

const taskHandlers: {[k: string]: RTQTaskHandler<allTaskOptions>} = {
  hello: helloTask,
  goodbye: goodbyeTask,
  error: errorTask,
  errorOnce: errorOnceTask,
};

const mockErrorHandler = jest.fn();

const errorHandler = async (error: any) => {
  console.log('😎 the error has been handled');

  mockErrorHandler(error.message);
};

describe('Recurring Task Queue', () => {
  it('properly queues and processes tasks on every tick', async () => {
    const recurring = new RTQ({
      fetchTasks,
      updateTask,
      createQueueEntry,
      fetchQueueEntries,
      removeQueueEntry,
      logAction,
      taskHandlers,
    });

    expect(recurring.runningTasks).toBe(0);

    let tickPromise = recurring.tick();

    await tickPromise;

    // Even though the tick has been awaited, the tasks are run completely
    // asynchronously, thus no results should be available yet
    expect(taskRunCounts.hello).toBe(0);
    expect(taskRunCounts.goodbye).toBe(0);
    expect(taskRunCounts.error).toBe(0);
    expect(taskRunCounts.errorOnce).toBe(0);

    await sleep(100);

    // At this point the tasks should've started running but not completed
    expect(recurring.runningTasks).toBeGreaterThan(0);

    await sleep(100);

    // Now tasks will have completed running, thus we have results
    expect(taskRunCounts.hello).toBe(1);
    expect(taskRunCounts.goodbye).toBe(1);
    expect(taskRunCounts.error).toBe(1);
    expect(taskRunCounts.errorOnce).toBe(1);

    expect(recurring.runningTasks).toBe(0);

    tickPromise = recurring.tick();

    await tickPromise;

    tickPromise = recurring.tick();

    await tickPromise;

    // Even though the tick has been awaited, the tasks are run completely
    // asynchronously, therefore no new results should be available
    expect(taskRunCounts.hello).toBe(1);
    expect(taskRunCounts.goodbye).toBe(1);
    expect(taskRunCounts.error).toBe(1);
    expect(taskRunCounts.errorOnce).toBe(1);

    await sleep(100);

    tickPromise = recurring.tick();

    await tickPromise;

    await sleep(300);

    // Regardless of calling tick 3 times, RTQ is smart enough to know
    // to never re-run tasks that are still running
    expect(taskRunCounts.hello).toBe(2);
    expect(taskRunCounts.goodbye).toBe(2);
    expect(taskRunCounts.error).toBe(2);
    expect(taskRunCounts.errorOnce).toBe(2);

    tickPromise = recurring.tick();

    await tickPromise;

    await sleep(300);

    // At this point error has already tried running the first time,
    // then retried once... since `maxRetries` is set to `1`,
    // `error` task was not processed a third time.
    expect(taskRunCounts.hello).toBe(3);
    expect(taskRunCounts.goodbye).toBe(3);
    expect(taskRunCounts.error).toBe(2); // NO MORE RETRIES
    expect(taskRunCounts.errorOnce).toBe(3);

    const [
      hello,
      goodbye,
      error,
      errorOnce,
    ] = allTasks;

    // The stored task status must match the final status after processing
    expect(hello.status).toBe(RTQStatus.SUCCEEDED);
    expect(goodbye.status).toBe(RTQStatus.SUCCEEDED);
    expect(error.status).toBe(RTQStatus.FAILED);
    expect(errorOnce.status).toBe(RTQStatus.SUCCEEDED);
  });

  it('can be instantiated with a custom error handler', async () => {
    const errorTasks: RTQTask<allTaskOptions>[] = [
      {
        id: '1',
        status: RTQStatus.NEW,
        waitTimeBetweenRuns: 200,
        taskName: 'error',
        maxRetries: 1,
        retryCount: 0,
        lastRun: new Date(0),
        taskOptions: {},
      },
    ];

    const errorQueue: RTQQueueEntry[] = [];

    const recurring = new RTQ({
      fetchTasks: async () => errorTasks,
      updateTask: async (t) => {errorTasks[0] = t;},
      createQueueEntry: async (qe) => {errorQueue.push(qe);},
      fetchQueueEntries: async () => errorQueue,
      removeQueueEntry: async () => {errorQueue.pop()},
      logAction,
      taskHandlers,
      errorHandler,
    });

    expect(mockErrorHandler).toHaveBeenCalledTimes(0);

    await recurring.tick();

    await sleep(100);

    expect(mockErrorHandler).toHaveBeenCalledWith(errorMessage);
  });

  it('can use custom error handler to handle internal errors', async () => {
    let errHandler = jest.fn();

    let recurring = new RTQ({
      fetchTasks: async () => {
        throw 'fetchTasks';
      },
      fetchQueueEntries,
      removeQueueEntry,
      logAction,
      updateTask,
      createQueueEntry,
      taskHandlers,
      errorHandler: errHandler,
    });

    expect(errHandler).toHaveBeenCalledTimes(0);

    await recurring.tick();

    expect(errHandler).toHaveBeenCalledWith('fetchTasks');

    errHandler = jest.fn();

    recurring = new RTQ({
      fetchTasks,
      fetchQueueEntries: async () => {
        throw 'fetchQueueEntries';
      },
      removeQueueEntry,
      logAction,
      updateTask,
      createQueueEntry,
      taskHandlers,
      errorHandler: errHandler,
    });

    await recurring.tick();

    expect(errHandler).toHaveBeenCalledWith('fetchQueueEntries');

    errHandler = jest.fn();

    recurring = new RTQ({
      fetchTasks,
      fetchQueueEntries,
      removeQueueEntry: async () => {
        throw 'removeQueueEntry';
      },
      logAction,
      updateTask,
      createQueueEntry,
      taskHandlers,
      errorHandler: errHandler,
    });

    await recurring.tick();

    await sleep(200);

    expect(errHandler).toHaveBeenCalledWith('removeQueueEntry');

    errHandler = jest.fn();

    recurring = new RTQ({
      fetchTasks,
      fetchQueueEntries,
      removeQueueEntry,
      logAction: async () => {
        throw 'logAction';
      },
      updateTask,
      createQueueEntry,
      taskHandlers,
      errorHandler: errHandler,
    });

    await recurring.tick();

    expect(errHandler).toHaveBeenCalledWith('logAction');

    errHandler = jest.fn();

    recurring = new RTQ({
      fetchTasks: fetchMockTasks,
      fetchQueueEntries,
      removeQueueEntry,
      logAction,
      updateTask: async () => {
        throw 'updateTask';
      },
      createQueueEntry,
      taskHandlers,
      errorHandler: errHandler,
    });

    await recurring.tick();

    expect(errHandler).toHaveBeenCalledWith('updateTask');

    await sleep(200);

    errHandler = jest.fn();

    recurring = new RTQ({
      fetchTasks: fetchMockTasks,
      fetchQueueEntries: async () => [],
      removeQueueEntry,
      logAction,
      updateTask,
      createQueueEntry: async () => {
        throw 'createQueueEntry';
      },
      taskHandlers,
      errorHandler: errHandler,
    });

    await recurring.tick();

    await sleep(200);

    expect(errHandler).toHaveBeenCalledWith('createQueueEntry');
  });
});

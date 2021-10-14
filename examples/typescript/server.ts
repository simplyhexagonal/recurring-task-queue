import { createServer, IncomingMessage, ServerResponse } from 'http';

import RTQ, {
  RTQEvent,
  RTQQueueEntry,
  RTQStatus,
  RTQTask,
  RTQTaskHandler,
} from '../../dist/recurring-task-queue';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface helloTaskOptions {
  arrivingUser: string;
}

const helloTask: RTQTaskHandler<helloTaskOptions> = async (taskOptions) => {
  await sleep(2000);
  console.log(`
  👋 hello ${taskOptions.arrivingUser}
  `);
};

interface goodbyeTaskOptions {
  departingUser: string;
}

const goodbyeTask: RTQTaskHandler<goodbyeTaskOptions> = async (taskOptions) => {
  await sleep(2000);
  console.log(`
  🚀 goodbye ${taskOptions.departingUser}
  `);
};

type allTaskOptions = helloTaskOptions | goodbyeTaskOptions | any;

const tasks: RTQTask<allTaskOptions>[] = [
  {
    id: '1',
    status: RTQStatus.NEW,
    waitTimeBetweenRuns: 6000,
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
    waitTimeBetweenRuns: 6000,
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

const eventHandler = async (event: RTQEvent) => {
  console.info(event);
};

const taskHandlers: {[k: string]: RTQTaskHandler<allTaskOptions>} = {
  hello: helloTask,
  goodbye: goodbyeTask,
};

const recurring = new RTQ({
  fetchTasks,
  updateTask,
  createQueueEntry,
  fetchQueueEntries,
  removeQueueEntry,
  eventHandler,
  taskHandlers,
});

const port = 5000;

const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  recurring.tick();

  response.end('Running tasks...');
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

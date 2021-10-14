const { createServer, IncomingMessage, ServerResponse } = require('http');

const RTQ = require('../../dist/recurring-task-queue');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const helloTask = async (taskOptions) => {
  await sleep(2000);
  console.log(`
  👋 hello ${taskOptions.arrivingUser}
  `);
};

const goodbyeTask = async (taskOptions) => {
  await sleep(2000);
  console.log(`
  🚀 goodbye ${taskOptions.departingUser}
  `);
};

const tasks = [
  {
    id: '1',
    status: 'NEW',
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
    status: 'NEW',
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

const queue = [];

const fetchTasks = async () => tasks;

const updateTask = async (task) => {
  const i = tasks.findIndex((t) => t.id === task.id);

  tasks[i] = task;
};

const createQueueEntry = async (queueEntry) => {
  queue.push(queueEntry);
};

const fetchQueueEntries = async () => queue;

const removeQueueEntry = async (queueEntry) => {
  const i = queue.findIndex((qe) => qe.id === queueEntry.id);
  if (i > -1) {
    queue.splice(i, 1);
  } else {
    throw new Error();
  }
};

const eventHandler = async (event) => {
  console.info(event);
};

const taskHandlers = {
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

console.log('About to start...');
setInterval(() => recurring.tick(), 1000);

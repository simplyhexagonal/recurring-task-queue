# Recurring Task Queue (RTQ)
![Tests](https://github.com/simplyhexagonal/recurring-task-queue/workflows/tests/badge.svg)
![Compatible with Typescript versions 4+](https://img.shields.io/badge/Typescript-4%2B-brightgreen)
![Compatible with Node versions 14+](https://img.shields.io/badge/Node-14%2B-brightgreen)

![Compatible with Chrome versions 60+](https://img.shields.io/badge/Chrome-60%2B-brightgreen)
![Compatible with Firefox versions 60+](https://img.shields.io/badge/Firefox-60%2B-brightgreen)
![Compatible with Safari versions 12+](https://img.shields.io/badge/Safari-12%2B-brightgreen)
![Compatible with Edge versions 18+](https://img.shields.io/badge/Edge-18%2B-brightgreen)

Versatile type-safe queueing library for a finite set of **recurring** user-editable tasks.

![](https://raw.githubusercontent.com/simplyhexagonal/recurring-task-queue/main/assets/task-status-cycle-1.0.png)

## Open source notice

This project is open to updates by its users, [I](https://github.com/jeanlescure) ensure that PRs are relevant to the community.
In other words, if you find a bug or want a new feature, please help us by becoming one of the
[contributors](#contributors-) ✌️ ! See the [contributing section](#contributing)

## Like this module? ❤

Please consider:

- [Buying me a coffee](https://www.buymeacoffee.com/jeanlescure) ☕
- Supporting Simply Hexagonal on [Open Collective](https://opencollective.com/simplyhexagonal) 🏆
- Starring this repo on [Github](https://github.com/simplyhexagonal/recurring-task-queue) 🌟

## Abstract

Let's say you have been put in charge of developing a recurring task which:

- runs every five minutes,
- loads all images uploaded in the past 5 minutes into memory and processes them
- has the ability to edit the path to the location of the images
- displays the status of each 5 minute run to measure performance and catch any failed attempts

The first two items on the list are pretty easy to solve for by setting up a CloudWatch Event that
every 5 minutes calls an end-point on your REST API which will perform the task.

In regards to the other two items your intuition dictates that to be able to allow the users to
edit the path to the location of the images, you should store the task definitions on the app's
database, which would also make sense to store the status and maybe even a log for each task run.

You also want to make sure that, in the future, when multiple recurring tasks are defined, they can
be queued and processed without any additional development.

With the previous in mind you end up with a diagram similar to this:

![](https://raw.githubusercontent.com/simplyhexagonal/recurring-task-queue/main/assets/mock-diagram.png)

Now you can specify the following sub-requirements to complete the task:

- define the structure of task definitions which will be stored
- track and store the status of each task
- make sure that no matter how many times the REST end-point is called, only one instance of the task will run at a time
- there needs to be proper error handling all the way to avoid having a situation where the app dies every 5 minutes due to an unforeseen error

Some nice-to-haves would be:

- having the tasks retry if they fail
- be able to set a max number of retries
- when more than one task is defined, on each call to the end-point any task that has completed will run again, and any task still running will be left as is
- if a task depends on a third-party API with strict rate limits, you can specify in the task definition a wait period between runs to avoid hitting said rate limit
- be able to send notifications when a task reaches the maximum number of retries and is flagged as `FAILED`

The good news is, `recurring-task-queue` (`RTQ`) handles all of the above for you!

## Setup

Install:

```sh
pnpm i @simplyhexagonal/recurring-task-queue

# or
yarn add @simplyhexagonal/recurring-task-queue

# or
npm install @simplyhexagonal/recurring-task-queue
```

Define a task handler:

```ts
import { RTQTaskHandler } from '@simplyhexagonal/recurring-task-queue';

interface imgProcTaskOptions {
  imgLocation: string;
}

const imgProcTaskHandler: RTQTaskHandler<imgProcTaskOptions>  = async (taskOptions) => {
  const rawImages = await loadImages(taskOptions.imgLocation);

  return await processImages(rawImages);
}
```

Store a task in a data source:

```ts
import {
  RTQTask,
  RTQStatus,
} from '@simplyhexagonal/recurring-task-queue';

// NOTE: in real-world scenarios this object would be
// generated from user input
const imgProcTaskDefinition: RTQTask<imgProcTaskOptions> = {
    id: uid(),
    status: RTQStatus.NEW,
    waitTimeBetweenRuns: 200,
    taskName: 'Image Processing',
    maxRetries: 1,
    retryCount: 0,
    // since the task has never run, simply set 
    // the lastRun date to 1970-01-01T00:00:00.000Z
    lastRun: new Date(0),
    taskOptions: {
      imgLocation: 'some/image/location/path',
    },
};

// This would be your custom function which handles
// saving tasks in your data source
createTask(imgProcTaskDefinition);
```

Now you will need to instantiate `RTQ`  with the appropriate options to access your stored
task/queue data, the task handler you defined, an event handler, and your
custom error handling:

```ts
import RTQ, {
  RTQOptions,
  RTQTask,
  RTQQueueEntry,
  RTQTaskHandler,
} from '@simplyhexagonal/recurring-task-queue';

const options = RTQOptions {
  fetchTasks: async () => { /* return RTQTask<imgProcTaskOptions>[] */ },
  updateTask: async (task: RTQTask<imgProcTaskOptions>) => { /* ... */},
  createQueueEntry: async (queueEntry: RTQQueueEntry) => { /* ... */},
  fetchQueueEntries: async () => { /* return RTQQueueEntry[] */ },
  removeQueueEntry: async (queueEntry: RTQQueueEntry) => { /* return RTQQueueEntry[] */ },
  taskHandlers: [
    imgProcTaskHandler,
  ],
  eventHandler: async (event: RTQEvent) => { /* ... */ },
  errorHandler: (error: any) => { /* ... */ },
  maxConcurrentTasks: 10, // leave undefined to have no limit
}

const recurring = new RTQ(options);
```

## Ticking

Based on the setup described in the previous section we ended up with the following RTQ instance:

```ts
const recurring = new RTQ(options);
```

It is important to remember that RTQ handles a queue of tasks which it processes using the task
handlers you define, nothing more. As such, to begin queuing and processing the tasks your must
run RTQ's `tick()` method.

We do NOT recomend using loops or intervals within your app to `tick` your task queue, but rather
set an end-point which can be periodically called by another process, for example:

```ts
const server = fastify();

server.route({
  method: 'GET',
  url: '/api/process-images',
  handler: async () => {
    recurring.tick(); // <= This is where the magic happens

    return 'Processing images...';
  },
});
```

## Event handling

There are two types of events defined by the actions RTQ performs on tasks and the queue:

```ts
enum RTQAction {
  MODIFY_TASK_STATUS = 'MODIFY_TASK_STATUS',
  MODIFY_QUEUE = 'MODIFY_QUEUE',
}
```

The event itself carries a lot more information about the action performed:

```ts
interface RTQEvent {
  timestamp: Date;
  action: RTQActionEnum;
  message: string;
  reason: string;
  additionalData: {[k: string]: any};
  triggeredBy: string;
}
```

The `additionalData` varies depending on the action:

```ts
// if (action === RTQAction.MODIFY_TASK_STATUS)
additionalData = {
  taskId,
  taskName,
  prevStatus,
  status,
}

// if (action === RTQAction.MODIFY_QUEUE)
additionalData = {
  id,
  taskId,
  queuedAt,
}
```

So, for example let's say you want to send a notification if a task's status changes to `FAILED`,
then you would define your event handler like this:

```ts
const eventHandler = async (event: RTQEvent) => {
  const {
    action,
    additionalData,
  } = event;

  if (
    action === RTQAction.MODIFY_TASK_STATUS
    && additionalData.status === RTQStatus.FAILED
  ) {
    makeSureTowelIsAtHand();
    dontPanic();
    notifyEveryLastOneOfUs();
  }
}
```

## WIP

- **Documentation**

In the mean-time you can see more detailed use cases in the [examples](https://github.com/simplyhexagonal/recurring-task-queue/tree/main/examples) and the [jest tests](https://github.com/simplyhexagonal/recurring-task-queue/blob/main/src/index.test.ts).

## Development

```
pnpm
pnpm dev
pnpm test
pnpm build
pnpm release
```

## Contributing

Yes, thank you! This plugin is community-driven, most of its features are from different authors.
Please update the tests and don't forget to add your name to the `package.json` file.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://jeanlescure.cr"><img src="https://avatars2.githubusercontent.com/u/3330339?v=4" width="100px;" alt=""/><br /><sub><b>Jean Lescure</b></sub></a><br /><a href="#maintenance-jeanlescure" title="Maintenance">🚧</a> <a href="https://github.com/simplyhexagonal/recurring-task-queue/commits?author=jeanlescure" title="Code">💻</a> <a href="#userTesting-jeanlescure" title="User Testing">📓</a> <a href="https://github.com/simplyhexagonal/recurring-task-queue/commits?author=jeanlescure" title="Tests">⚠️</a> <a href="#example-jeanlescure" title="Examples">💡</a> <a href="https://github.com/simplyhexagonal/recurring-task-queue/commits?author=jeanlescure" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

Copyright (c) 2021-Present [RTQ Contributors](https://github.com/simplyhexagonal/recurring-task-queue/#contributors-).<br/>
Licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

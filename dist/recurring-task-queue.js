var RTQ = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined")
      return require.apply(this, arguments);
    throw new Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    __markAsModule(target);
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    RTQAction: () => RTQAction,
    RTQActionEnum: () => RTQActionEnum,
    RTQStatus: () => RTQStatus,
    RTQStatusEnum: () => RTQStatusEnum,
    default: () => RTQ,
    version: () => version
  });

  // src/interfaces.ts
  var RTQStatusEnum;
  (function(RTQStatusEnum2) {
    RTQStatusEnum2["NEW"] = "NEW";
    RTQStatusEnum2["QUEUED"] = "QUEUED";
    RTQStatusEnum2["INITIATED"] = "INITIATED";
    RTQStatusEnum2["RETRIED"] = "RETRIED";
    RTQStatusEnum2["IN_PROGRESS"] = "IN_PROGRESS";
    RTQStatusEnum2["FAILED"] = "FAILED";
    RTQStatusEnum2["AWAITING_RETRY"] = "AWAITING_RETRY";
    RTQStatusEnum2["AWAITING_NEXT_RUN"] = "AWAITING_NEXT_RUN";
    RTQStatusEnum2["SUCCEEDED"] = "SUCCEEDED";
  })(RTQStatusEnum || (RTQStatusEnum = {}));
  var RTQActionEnum;
  (function(RTQActionEnum2) {
    RTQActionEnum2["MODIFY_TASK_STATUS"] = "MODIFY_TASK_STATUS";
    RTQActionEnum2["MODIFY_QUEUE"] = "MODIFY_QUEUE";
  })(RTQActionEnum || (RTQActionEnum = {}));

  // package.json
  var version = "1.0.1";

  // src/index.ts
  var RTQStatus = __spreadValues({}, RTQStatusEnum);
  var RTQAction = __spreadValues({}, RTQActionEnum);
  var ShortUniqueId;
  if (typeof window !== "undefined") {
    ShortUniqueId = window.ShortUniqueId;
  } else {
    ShortUniqueId = __require("short-unique-id");
  }
  var defaultOptions = {
    maxConcurrentTasks: 0,
    errorHandler: async (e) => console.log(e)
  };
  var RTQ = class {
    constructor(options) {
      this.runningTasks = 0;
      this.ticking = false;
      this.options = __spreadValues(__spreadValues({}, defaultOptions), options);
      this.uid = new ShortUniqueId();
    }
    async modifyTaskStatus({
      task,
      status,
      reason,
      triggeredBy,
      retryCount,
      lastRun
    }) {
      const {
        options: {
          updateTask,
          eventHandler,
          errorHandler
        }
      } = this;
      const updatedTask = __spreadProps(__spreadValues({}, task), {
        status,
        retryCount: retryCount || task.retryCount,
        lastRun: lastRun || task.lastRun
      });
      return await updateTask(updatedTask).then(() => {
        eventHandler({
          timestamp: new Date(),
          action: RTQAction.MODIFY_TASK_STATUS,
          message: `changed status of ${task.taskName} to ${status}`,
          reason: reason || "",
          additionalData: {
            taskId: task.id,
            taskName: task.taskName,
            prevStatus: task.status,
            status
          },
          triggeredBy: triggeredBy || "RTQ"
        }).catch(errorHandler);
        return updatedTask;
      }).catch((e) => {
        errorHandler(e);
        eventHandler({
          timestamp: new Date(),
          action: RTQAction.MODIFY_TASK_STATUS,
          message: `failed changing status of ${task.taskName} to ${status}`,
          reason: reason || "",
          additionalData: {
            taskId: task.id,
            taskName: task.taskName,
            prevStatus: task.status,
            status
          },
          triggeredBy: triggeredBy || "RTQ"
        }).catch(errorHandler);
        return null;
      });
    }
    async queueTask(task, index, taskArray) {
      const {
        options: {
          createQueueEntry,
          eventHandler,
          errorHandler
        }
      } = this;
      const queryEntry = {
        id: this.uid.stamp(16),
        taskId: task.id,
        queuedAt: new Date()
      };
      const result = await createQueueEntry(queryEntry).then(() => {
        eventHandler({
          timestamp: new Date(),
          action: RTQAction.MODIFY_QUEUE,
          message: `added queue entry ${queryEntry.id} to queue`,
          reason: "tick",
          additionalData: queryEntry,
          triggeredBy: "RTQ"
        }).catch(errorHandler);
      }).catch((e) => {
        errorHandler(e);
        return null;
      });
      if (result === null) {
        return null;
      }
      return await this.modifyTaskStatus({
        task,
        status: RTQStatus.QUEUED
      });
    }
    async processTask(task, index, taskArray) {
      this.runningTasks += 1;
      const {
        taskName,
        taskOptions,
        lastRun,
        waitTimeBetweenRuns,
        retryCount: taskRetryCount,
        maxRetries
      } = task;
      const msSinceLastRun = Date.now().valueOf() - lastRun.valueOf();
      if (msSinceLastRun < waitTimeBetweenRuns) {
        await this.modifyTaskStatus({
          task,
          status: RTQStatus.AWAITING_RETRY
        });
        return;
      }
      const {
        options: {
          taskHandlers,
          errorHandler
        }
      } = this;
      let status = RTQStatus.INITIATED;
      let retryCount = taskRetryCount;
      if (retryCount > 0) {
        status = RTQStatus.RETRIED;
      }
      let upToDateTask = task;
      upToDateTask = await this.modifyTaskStatus({
        task: upToDateTask,
        status,
        retryCount
      });
      if (upToDateTask === null) {
        return;
      }
      upToDateTask = await this.modifyTaskStatus({
        task: upToDateTask,
        status: RTQStatus.IN_PROGRESS,
        lastRun: new Date()
      });
      if (upToDateTask === null) {
        return;
      }
      taskHandlers[taskName](taskOptions).then(async () => {
        upToDateTask = await this.modifyTaskStatus({
          task: upToDateTask,
          status: RTQStatus.SUCCEEDED,
          retryCount: 0
        });
      }).catch(async (e) => {
        if (errorHandler) {
          errorHandler(e).catch(console.log);
        }
        let status2 = RTQStatus.AWAITING_RETRY;
        if (retryCount >= maxRetries) {
          status2 = RTQStatus.FAILED;
        }
        retryCount += 1;
        upToDateTask = await this.modifyTaskStatus({
          task: upToDateTask,
          status: status2,
          retryCount,
          reason: e.message || JSON.stringify(e)
        });
      }).finally(() => {
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
          errorHandler
        }
      } = this;
      let tasks = await fetchTasks().catch(errorHandler);
      if (!Array.isArray(tasks)) {
        return;
      }
      const queueEntries = await fetchQueueEntries().catch(errorHandler);
      if (!Array.isArray(queueEntries)) {
        return;
      }
      const filteredEntries = queueEntries.sort((a, b) => {
        return new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime();
      }).reduce((a, b) => {
        if (maxConcurrentTasks === 0 || a.length < maxConcurrentTasks) {
          a.push(b);
        }
        return a;
      }, []);
      await Promise.all(filteredEntries.map(async (q) => await removeQueueEntry(q).then(() => {
        eventHandler({
          timestamp: new Date(),
          action: RTQAction.MODIFY_QUEUE,
          message: `removed queue entry ${q.id} from queue`,
          reason: "tick",
          additionalData: q,
          triggeredBy: "RTQ"
        }).catch(errorHandler);
      }).catch((e) => {
        eventHandler({
          timestamp: new Date(),
          action: RTQAction.MODIFY_QUEUE,
          message: `failed removing queue entry ${q.id} from queue`,
          reason: e.message || JSON.stringify(e),
          additionalData: { error: e },
          triggeredBy: "RTQ"
        }).catch(errorHandler);
        errorHandler(e);
      }))).catch(errorHandler);
      const tasksReadyToProcess = filteredEntries.map((qe) => tasks.find((t) => t.id === qe.taskId));
      const numOfTasksProcessed = tasksReadyToProcess.length;
      tasksReadyToProcess.forEach((t, i, a) => this.processTask(t, i, a));
      tasks = await fetchTasks().catch(errorHandler);
      if (!Array.isArray(tasks)) {
        return;
      }
      const tasksToBeQueued = tasks.filter((t) => tasksReadyToProcess.findIndex((tp) => t.id === tp.id) < 0).filter((t) => t.status === RTQStatus.NEW || t.status === RTQStatus.AWAITING_RETRY || t.status === RTQStatus.SUCCEEDED);
      await Promise.all(tasksToBeQueued.map(async (t, i, a) => await this.queueTask(t, i, a).catch((e) => {
        errorHandler(e);
        return null;
      }))).then((a) => {
        this.ticking = false;
        if (numOfTasksProcessed < 1 && tasksToBeQueued.length > 0 && !a.includes(null)) {
          this.tick();
        }
      }).catch(errorHandler);
    }
  };
  RTQ.RTQStatus = RTQStatus;
  RTQ.version = version;
  return src_exports;
})();
//# sourceMappingURL=recurring-task-queue.js.map
'undefined'!=typeof module&&(module.exports=RTQ.default),'undefined'!=typeof window&&(RTQ=RTQ.default);
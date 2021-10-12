var RTQ = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __getProtoOf = Object.getPrototypeOf;
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
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    __markAsModule(target);
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __reExport = (target, module, desc) => {
    if (module && typeof module === "object" || typeof module === "function") {
      for (let key of __getOwnPropNames(module))
        if (!__hasOwnProp.call(target, key) && key !== "default")
          __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
    }
    return target;
  };
  var __toModule = (module) => {
    return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
  };

  // node_modules/.pnpm/short-unique-id@4.4.4/node_modules/short-unique-id/dist/short-unique-id.js
  var require_short_unique_id = __commonJS({
    "node_modules/.pnpm/short-unique-id@4.4.4/node_modules/short-unique-id/dist/short-unique-id.js"(exports, module) {
      var ShortUniqueId2 = (() => {
        var __defProp2 = Object.defineProperty;
        var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
        var __hasOwnProp2 = Object.prototype.hasOwnProperty;
        var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
        var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
        var __spreadValues2 = (a, b) => {
          for (var prop in b || (b = {}))
            if (__hasOwnProp2.call(b, prop))
              __defNormalProp2(a, prop, b[prop]);
          if (__getOwnPropSymbols2)
            for (var prop of __getOwnPropSymbols2(b)) {
              if (__propIsEnum2.call(b, prop))
                __defNormalProp2(a, prop, b[prop]);
            }
          return a;
        };
        var __markAsModule2 = (target) => __defProp2(target, "__esModule", { value: true });
        var __export2 = (target, all) => {
          __markAsModule2(target);
          for (var name in all)
            __defProp2(target, name, { get: all[name], enumerable: true });
        };
        var src_exports2 = {};
        __export2(src_exports2, {
          DEFAULT_UUID_LENGTH: () => DEFAULT_UUID_LENGTH,
          default: () => ShortUniqueId3
        });
        var version = "4.4.4";
        var DEFAULT_UUID_LENGTH = 6;
        var DEFAULT_OPTIONS = {
          dictionary: "alphanum",
          shuffle: true,
          debug: false,
          length: DEFAULT_UUID_LENGTH
        };
        var _ShortUniqueId = class extends Function {
          constructor(argOptions = {}) {
            super();
            this.dictIndex = 0;
            this.dictRange = [];
            this.lowerBound = 0;
            this.upperBound = 0;
            this.dictLength = 0;
            this._digit_first_ascii = 48;
            this._digit_last_ascii = 58;
            this._alpha_lower_first_ascii = 97;
            this._alpha_lower_last_ascii = 123;
            this._hex_last_ascii = 103;
            this._alpha_upper_first_ascii = 65;
            this._alpha_upper_last_ascii = 91;
            this._number_dict_ranges = {
              digits: [this._digit_first_ascii, this._digit_last_ascii]
            };
            this._alpha_dict_ranges = {
              lowerCase: [this._alpha_lower_first_ascii, this._alpha_lower_last_ascii],
              upperCase: [this._alpha_upper_first_ascii, this._alpha_upper_last_ascii]
            };
            this._alpha_lower_dict_ranges = {
              lowerCase: [this._alpha_lower_first_ascii, this._alpha_lower_last_ascii]
            };
            this._alpha_upper_dict_ranges = {
              upperCase: [this._alpha_upper_first_ascii, this._alpha_upper_last_ascii]
            };
            this._alphanum_dict_ranges = {
              digits: [this._digit_first_ascii, this._digit_last_ascii],
              lowerCase: [this._alpha_lower_first_ascii, this._alpha_lower_last_ascii],
              upperCase: [this._alpha_upper_first_ascii, this._alpha_upper_last_ascii]
            };
            this._alphanum_lower_dict_ranges = {
              digits: [this._digit_first_ascii, this._digit_last_ascii],
              lowerCase: [this._alpha_lower_first_ascii, this._alpha_lower_last_ascii]
            };
            this._alphanum_upper_dict_ranges = {
              digits: [this._digit_first_ascii, this._digit_last_ascii],
              upperCase: [this._alpha_upper_first_ascii, this._alpha_upper_last_ascii]
            };
            this._hex_dict_ranges = {
              decDigits: [this._digit_first_ascii, this._digit_last_ascii],
              alphaDigits: [this._alpha_lower_first_ascii, this._hex_last_ascii]
            };
            this.log = (...args) => {
              const finalArgs = [...args];
              finalArgs[0] = `[short-unique-id] ${args[0]}`;
              if (this.debug === true) {
                if (typeof console !== "undefined" && console !== null) {
                  return console.log(...finalArgs);
                }
              }
            };
            this.setDictionary = (dictionary2, shuffle2) => {
              let finalDict;
              if (dictionary2 && Array.isArray(dictionary2) && dictionary2.length > 1) {
                finalDict = dictionary2;
              } else {
                finalDict = [];
                let i;
                this.dictIndex = i = 0;
                const rangesName = `_${dictionary2}_dict_ranges`;
                const ranges = this[rangesName];
                Object.keys(ranges).forEach((rangeType) => {
                  const rangeTypeKey = rangeType;
                  this.dictRange = ranges[rangeTypeKey];
                  this.lowerBound = this.dictRange[0];
                  this.upperBound = this.dictRange[1];
                  for (this.dictIndex = i = this.lowerBound; this.lowerBound <= this.upperBound ? i < this.upperBound : i > this.upperBound; this.dictIndex = this.lowerBound <= this.upperBound ? i += 1 : i -= 1) {
                    finalDict.push(String.fromCharCode(this.dictIndex));
                  }
                });
              }
              if (shuffle2) {
                const PROBABILITY = 0.5;
                finalDict = finalDict.sort(() => Math.random() - PROBABILITY);
              }
              this.dict = finalDict;
              this.dictLength = this.dict.length;
              this.counter = 0;
            };
            this.seq = () => {
              return this.sequentialUUID();
            };
            this.sequentialUUID = () => {
              let counterDiv;
              let counterRem;
              let id = "";
              counterDiv = this.counter;
              do {
                counterRem = counterDiv % this.dictLength;
                counterDiv = Math.trunc(counterDiv / this.dictLength);
                id += this.dict[counterRem];
              } while (counterDiv !== 0);
              this.counter += 1;
              return id;
            };
            this.randomUUID = (uuidLength = this.uuidLength || DEFAULT_UUID_LENGTH) => {
              let id;
              let randomPartIdx;
              let j;
              if (uuidLength === null || typeof uuidLength === "undefined" || uuidLength < 1) {
                throw new Error("Invalid UUID Length Provided");
              }
              const isPositive = uuidLength >= 0;
              id = "";
              for (j = 0; j < uuidLength; j += 1) {
                randomPartIdx = parseInt((Math.random() * this.dictLength).toFixed(0), 10) % this.dictLength;
                id += this.dict[randomPartIdx];
              }
              return id;
            };
            this.availableUUIDs = (uuidLength = this.uuidLength) => {
              return parseFloat(Math.pow([...new Set(this.dict)].length, uuidLength).toFixed(0));
            };
            this.approxMaxBeforeCollision = (rounds = this.availableUUIDs(this.uuidLength)) => {
              return parseFloat(Math.sqrt(Math.PI / 2 * rounds).toFixed(20));
            };
            this.collisionProbability = (rounds = this.availableUUIDs(this.uuidLength), uuidLength = this.uuidLength) => {
              return parseFloat((this.approxMaxBeforeCollision(rounds) / this.availableUUIDs(uuidLength)).toFixed(20));
            };
            this.uniqueness = (rounds = this.availableUUIDs(this.uuidLength)) => {
              const score = parseFloat((1 - this.approxMaxBeforeCollision(rounds) / rounds).toFixed(20));
              return score > 1 ? 1 : score < 0 ? 0 : score;
            };
            this.getVersion = () => {
              return this.version;
            };
            this.stamp = (finalLength) => {
              if (typeof finalLength !== "number" || finalLength < 10) {
                throw new Error("Param finalLength must be number greater than 10");
              }
              const hexStamp = Math.floor(+new Date() / 1e3).toString(16);
              const idLength = finalLength - 9;
              const rndIdx = Math.round(Math.random() * (idLength > 15 ? 15 : idLength));
              const id = this.randomUUID(idLength);
              return `${id.substr(0, rndIdx)}${hexStamp}${id.substr(rndIdx)}${rndIdx.toString(16)}`;
            };
            this.parseStamp = (stamp) => {
              if (stamp.length < 10) {
                throw new Error("Stamp length invalid");
              }
              const rndIdx = parseInt(stamp.substr(stamp.length - 1, 1), 16);
              return new Date(parseInt(stamp.substr(rndIdx, 8), 16) * 1e3);
            };
            const options = __spreadValues2(__spreadValues2({}, DEFAULT_OPTIONS), argOptions);
            this.counter = 0;
            this.debug = false;
            this.dict = [];
            this.version = version;
            const {
              dictionary,
              shuffle,
              length
            } = options;
            this.uuidLength = length;
            this.setDictionary(dictionary, shuffle);
            this.debug = options.debug;
            this.log(this.dict);
            this.log(`Generator instantiated with Dictionary Size ${this.dictLength}`);
            return new Proxy(this, {
              apply: (target, that, args) => this.randomUUID(...args)
            });
          }
        };
        var ShortUniqueId3 = _ShortUniqueId;
        ShortUniqueId3.default = _ShortUniqueId;
        return src_exports2;
      })();
      typeof module != "undefined" && (module.exports = ShortUniqueId2.default), typeof window != "undefined" && (ShortUniqueId2 = ShortUniqueId2.default);
    }
  });

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    RTQStatus: () => RTQStatus,
    RTQStatusEnum: () => RTQStatusEnum,
    default: () => RTQ
  });
  var import_short_unique_id = __toModule(require_short_unique_id());

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

  // src/index.ts
  var RTQStatus = __spreadValues({}, RTQStatusEnum);
  var defaultOptions = {
    maxConcurrentTasks: 0,
    errorHandler: async (e) => console.log(e)
  };
  var RTQ = class {
    constructor(options) {
      this.runningTasks = 0;
      this.ticking = false;
      this.options = __spreadValues(__spreadValues({}, defaultOptions), options);
      this.uid = new import_short_unique_id.default();
    }
    async changeTaskStatus({
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
          logAction,
          errorHandler
        }
      } = this;
      const updatedTask = __spreadProps(__spreadValues({}, task), {
        status,
        retryCount: retryCount || task.retryCount,
        lastRun: lastRun || task.lastRun
      });
      return await updateTask(updatedTask).then(() => {
        logAction({
          timestamp: new Date(),
          action: `changed status of ${task.taskName} to ${status}`,
          reason: reason || "",
          triggeredBy: triggeredBy || "RTQ"
        }).catch(errorHandler);
        return updatedTask;
      }).catch((e) => {
        errorHandler(e);
        logAction({
          timestamp: new Date(),
          action: `failed changing status of ${task.taskName} to ${status}`,
          reason: reason || "",
          triggeredBy: triggeredBy || "RTQ"
        }).catch(errorHandler);
        return null;
      });
    }
    async queueTask(task, index, taskArray) {
      const {
        options: {
          createQueueEntry,
          errorHandler
        }
      } = this;
      const result = await createQueueEntry({
        id: this.uid.stamp(16),
        taskId: task.id,
        queuedAt: new Date()
      }).catch((e) => {
        errorHandler(e);
        return null;
      });
      if (result === null) {
        return null;
      }
      return await this.changeTaskStatus({
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
        await this.changeTaskStatus({
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
      upToDateTask = await this.changeTaskStatus({
        task: upToDateTask,
        status,
        retryCount
      });
      if (upToDateTask === null) {
        return;
      }
      upToDateTask = await this.changeTaskStatus({
        task: upToDateTask,
        status: RTQStatus.IN_PROGRESS,
        lastRun: new Date()
      });
      if (upToDateTask === null) {
        return;
      }
      taskHandlers[taskName](taskOptions).then(async () => {
        upToDateTask = await this.changeTaskStatus({
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
        upToDateTask = await this.changeTaskStatus({
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
          logAction,
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
      await Promise.all(filteredEntries.map(async (q) => await removeQueueEntry(q).catch((e) => {
        errorHandler(e);
        logAction({
          timestamp: new Date(),
          action: `failed removing queue entry ${q.id} from queue`,
          reason: e.message || JSON.stringify(e),
          triggeredBy: "RTQ"
        }).catch(errorHandler);
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
  return src_exports;
})();
//# sourceMappingURL=recurring-task-queue.js.map
'undefined'!=typeof module&&(module.exports=RTQ.default),'undefined'!=typeof window&&(RTQ=RTQ.default);
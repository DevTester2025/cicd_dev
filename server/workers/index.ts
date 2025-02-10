import * as IORedis from "ioredis";
import { Express } from "express";

const { ExpressAdapter } = require("@bull-board/express");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

import OrchScheduler from "./orch-scheduler";
import OrchRunner from "./orch-runner";
import { Queue } from "bullmq";
import { constants } from "../common/constants";

export default class Workers {
  private conn: IORedis.Redis;
  private app: Express;

  constructor(app: Express) {
    this.app = app;
  }

  init() {
    const connection = new IORedis({
      host: process.env.APP_REDIS_HOST,
      password: process.env.APP_REDIS_PASS,
      port: parseInt(process.env.APP_REDIS_PORT),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      db: parseInt(process.env.APP_REDIS_ORCH_DB),
    }).setMaxListeners(0);
    this.conn = connection;

    this.startWorkers();
    this.startBullBoard();
  }

  private startWorkers() {
    this.initOrchScheduler();
    this.initOrchRunner();
  }

  // Based on the runtype (Scheduled / Recurring) this worker responsible for pulling in
  // the instances and pushes to orchestration executor to do the actual job.
  private initOrchScheduler() {
    const scheduler = new OrchScheduler(this.conn);
    scheduler.initWorker();
  }

  // Worker actually executes the orchestration based on the configurations
  // and updates the logs table.
  private initOrchRunner() {
    const runner = new OrchRunner(this.conn);
    runner.initWorker();
  }

  private startBullBoard() {
    const orchRunnerQueue = new Queue(constants.QUEUE.ORCH_RUNNER, {
      connection: this.conn,
    });
    const orchSchedulerQueue = new Queue(constants.QUEUE.ORCH_RUN_SCHEDULER, {
      connection: this.conn,
    });
    createBullBoard({
      queues: [
        new BullMQAdapter(orchSchedulerQueue),
        new BullMQAdapter(orchRunnerQueue),
      ],
      serverAdapter: serverAdapter,
    });
    this.app.use("/admin/queues", serverAdapter.getRouter());
  }
}

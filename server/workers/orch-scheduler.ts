import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import { Redis } from "ioredis";

import { constants } from "../common/constants";
import { IOrchestrationSchedule } from "./interface";
import db from "../api/models/model";
import IORedis = require("ioredis");
import { Op } from "sequelize";
import LokiService from "../api/services/logging/loki.service";

export default class AppWorker {
  private conn: Redis;

  constructor(conn: Redis) {
    this.conn = conn;
    this.initWorkerForPendingInstance();
  }

  // Worker fetches all the instances based on the filter and pushes to the actual queue,
  // which run the orchestration.
  async initWorker() {
    console.log("✅ Orcherstration scheduler worker node initated.");
    await db.eventlog.create({
      tenantid: 7,
      module: "Orchestration",
      referencetype: "LOG",
      cloudprovider: constants.CLOUD_AWS,
      eventtype: "SCHEDULE",
      //"severity": "Normal",
      severity: "Medium",
      eventdate: new Date(),
      notes: "Orcherstration scheduler worker node initated.",
      createddt: new Date(),
      createdby: "System",
      status: constants.STATUS_ACTIVE,
    });
    new QueueScheduler(constants.QUEUE.ORCH_RUN_SCHEDULER, {
      connection: this.conn,
    });
    new Worker(
      constants.QUEUE.ORCH_RUN_SCHEDULER,
      async (job: Job<IOrchestrationSchedule>) => {
        try {
          console.log("Orcherstration scheduler worker node >>>>>>>>>>>>>>>");
          await db.eventlog.create({
            tenantid: job.data._tenant,
            module: "Orchestration",
            referencetype: "ORCH-SCHEDULER",
            cloudprovider: constants.CLOUD_AWS,
            eventtype: "SCHEDULE",
            //"severity": "Normal",
            severity: "Medium",
            eventdate: new Date(),
            notes: "## Scheduler worker node initiated.",
            createddt: new Date(),
            createdby: "System",
            status: constants.STATUS_ACTIVE,
          });

          let condition = {
            status: "Active",
            tenantid: job.data._tenant,
          } as any;
          const includes = [];
          const data = job.data;
          let schedule = await db.OrchestrationSchedule.findOne({ where: { id: data.id, status: constants.STATUS_ACTIVE }, attributes: ["title"] });
          if (!schedule) {
            console.log("The schedules are deleted");
            return;
          }
          if (data._account) {
            condition["accountid"] = data._account;
          }
          if (data._customer) {
            condition["customerid"] = data._customer;
          }
          if (data._tag) {
            const joinWhere = {
              tagid: data._tag,
              status: "Active",
            };

            if (data.tagvalue) {
              joinWhere["tagvalue"] = data.tagvalue;
            }

            const join = {
              model: db.TagValues,
              as: "tagvalues",
              paranoid: true,
              required: true,
              where: joinWhere,
              attributes: ["tagvalueid"],
            };

            includes.push(join);
          }

          if (data.instances) {
            console.log("Instances list found >>>>>>");
            condition = {
              status: "Active",
              tenantid: job.data._tenant,
              // instanceid: {
              //   [Op.in]: Object.keys(JSON.parse(data.instances)).map(
              //     (e) => JSON.parse(data.instances)[e]
              //   ),
              // },
              instancerefid: {
                [Op.in]: Object.keys(JSON.parse(data.instances)).map(
                  (e) => JSON.parse(data.instances)[e]
                ),
              },
            };
            console.log(condition);
          }
          let additionalParams = {};
          try {
            const instancesToProcess = await db.Instances.findAll({
              where: condition,
              attributes: [
                "instanceid",
                "instancename",
                "cloudprovider",
                "ssmsgentid",
                "platform",
                "customerid",
                "instancerefid",
                "tenantid",
                "publicipv4",
                "privateipv4",
              ],
              include: includes,
            })
            const instanceKeys = Object.keys(JSON.parse(data.instances));

            console.log("Instances to process 🔃🔃🔃🔃");
            console.log(JSON.stringify(instancesToProcess));
  
            instanceKeys.forEach((instance) => {
              const i = instancesToProcess.find((ii) => {
                return (
                  ii["dataValues"]["instancerefid"] ==
                  JSON.parse(data.instances)[instance]
                );
              });
              if (i) {
                if (i["instancename"] === undefined || i["instancename"] === null) {
                  console.log("Unable to find the instancename, Please retrigger the orchestration");
                  return;
                }
                additionalParams[
                  "sys_" +
                  instance.replace(/[^\w]/g, "").toLowerCase() +
                  "_ip_private"
                ] = i["privateipv4"];
                additionalParams[
                  "sys_" + instance.replace(/[^\w]/g, "").toLowerCase() + "_ip"
                ] = i["publicipv4"];
                additionalParams[
                  "sys_" + instance.replace(/[^\w]/g, "").toLowerCase() + "_provider"
                ] = i["cloudprovider"];
                additionalParams[
                  "sys_" + instance.replace(/[^\w]/g, "").toLowerCase() + "_ssmid"
                ] = i["ssmsgentid"];
                additionalParams[
                  "sys_" + instance.replace(/[^\w]/g, "").toLowerCase() + "_platform"
                ] = i["platform"];
                additionalParams[
                  "sys_" + instance.replace(/[^\w]/g, "").toLowerCase() + "_name"
                ] = i["instancename"];
                additionalParams["instancename"] = i["instancename"];
                additionalParams["tenantid"] = i["tenantid"];
                additionalParams[
                  "sys_" + instance.replace(/[^\w]/g, "").toLowerCase() + "_id"
                ] = i["instancerefid"];
              }
            });
          }catch (e) {
            console.log(e, "ErrorCatch...");
            const orchLogs = [
              {
                _tenant: data._tenant,
                _orchschedule: data.id,
                status: "Failed",
                createdby: data.createdby,
                createddt: new Date(),
                lastupdatedby: data.createdby,
                lastupdateddt: new Date(),
                params: JSON.stringify({
                  ...JSON.parse(data.params),
                  ...additionalParams,
                }),
              },
            ];
          const logs = await db.OrchestrationLog.bulkCreate(orchLogs);

             await db.eventlog.create({
              tenantid: job.data._tenant,
              module: "Orchestration",
              referencetype: "ORCH-SCHEDULER",
              cloudprovider: constants.CLOUD_AWS,
              eventtype: "SCHEDULE",
              severity: "Medium",
              eventdate: new Date(),
              notes: JSON.stringify({
                message: "## Unable to find the instance details, Please retrigger the orchestration"
              }),
              createddt: new Date(),
              createdby: "System",
              status: constants.STATUS_ACTIVE,
            });
          }

          const orchRunnerQueue = new Queue(constants.QUEUE.ORCH_RUNNER, {
            connection: this.conn,
          });

          const orchLogs = [
            {
              _tenant: data._tenant,
              _orchschedule: data.id,
              status: "Pending",
              createdby: data.createdby,
              createddt: new Date(),
              lastupdatedby: data.createdby,
              lastupdateddt: new Date(),
              params: JSON.stringify({
                ...JSON.parse(data.params),
                ...additionalParams,
              }),
            },
          ];

          const logs = await db.OrchestrationLog.bulkCreate(orchLogs);
          await db.sequelize.query(
            `UPDATE tbl_orch_schedule SET totalrun = totalrun + 1 WHERE id = ${data.id}`
          );

          const logEventsToPush = logs.map((l) => {
            return {
              name: l.dataValues["id"],
              data: l.dataValues,
              removeOnComplete: true,
            };
          });

          await db.eventlog.create({
            tenantid: job.data._tenant,
            module: "Orchestration",
            referencetype: "ORCH-SCHEDULER",
            cloudprovider: constants.CLOUD_AWS,
            eventtype: "SCHEDULE",
            //"severity": "Normal",
            severity: "Medium",
            eventdate: new Date(),
            notes: JSON.stringify({
              message: "## Scheduler worker node, configuring worker to run.",
              data: logEventsToPush,
            }),
            createddt: new Date(),
            createdby: "System",
            status: constants.STATUS_ACTIVE,
          });

          console.log("Going to push data to orch runner queue");
          console.log(logEventsToPush);

          await orchRunnerQueue.addBulk(logEventsToPush);
        } catch (error) {
          console.log("Error scheduling orchestrations");
          console.log(error);
          await db.eventlog.create({
            tenantid: 7,
            module: "Orchestration",
            referencetype: "ORCH-SCHEDULER",
            cloudprovider: constants.CLOUD_AWS,
            eventtype: "ERROR",
            //"severity": "Normal",
            severity: "Medium",
            eventdate: new Date(),
            notes: JSON.stringify({
              message: "Error while scheduling orchestration.",
              reference: "ORCH-SCHEDULER",
              tag: "ORCH-" + job.data.id,
            }),
            createddt: new Date(),
            createdby: "System",
            status: constants.STATUS_ACTIVE,
          });
        }

        return true;
      },
      {
        connection: this.conn,
        concurrency: 1,
      }
    ).setMaxListeners(0);
  }

  initWorkerForPendingInstance() {
    // setInterval(async () => {
    //   console.log("For every 15 seconds, fetches pending.....");
    //   const data = await db.OrchestrationLog.findAll({
    //     where: {
    //       status: "Pending",
    //     },
    //   });
    //   const conn = new IORedis({
    //     host: process.env.APP_REDIS_HOST,
    //     password: process.env.APP_REDIS_PASS,
    //     port: parseInt(process.env.APP_REDIS_PORT),
    //     maxRetriesPerRequest: null,
    //     enableReadyCheck: false,
    //   }).setMaxListeners(0);
    //   const orchRunnerQueue = new Queue(constants.QUEUE.ORCH_RUNNER, {
    //     connection: conn,
    //   });
    //   const logEventsToPush = data.map((l) => {
    //     return {
    //       name: l.dataValues["id"],
    //       data: l.dataValues,
    //     };
    //   });
    //   console.log("Pending schedules to push >>>>>>");
    //   console.log(logEventsToPush);
    //   await orchRunnerQueue.addBulk(logEventsToPush);
    // }, 900000);
  }
}
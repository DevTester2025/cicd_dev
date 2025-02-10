import { Job, Queue, QueueScheduler, Worker } from "bullmq";
import * as JWT from "jsonwebtoken";
import { Redis } from "ioredis";
import axios from "axios";
import { constants } from "../common/constants";
import {
  IInstance,
  IInstanceTag,
  IOrchestrationLog,
  IOrchestrationSchedule,
} from "./interface";
import db from "../api/models/model";
import CommonService from "../api/services/common.service";
import * as fs from "fs";
import { Orchestrate, VerifyScript } from "../api/services/orchestration";
import AppLogger from "../lib/logger";
import LokiService from "../api/services/logging/loki.service";
import logger, { ILogModules, ILogOperation } from "../logger";

interface OrcherstrationScript {
  scriptid: number;
  scriptname: string;
  exectype: "boottime" | "postboot";
}

const tUpdateTag = async (
  orchschedule: IOrchestrationSchedule,
  instance: IInstance
) => {
  try {
    if (instance.cloudprovider == "AWS") {
      const token = JWT.sign(
        { data: { userid: orchschedule.createdby } },
        constants.APP_SECRET,
        {
          expiresIn: "3m",
        }
      );

      const tags = await db.TagValues.findAll({
        where: {
          resourcetype: "ASSET_INSTANCE",
          resourcerefid: instance.instancerefid,
          status: "Active",
        },
        include: [
          {
            as: "tag",
            model: db.Tags,
            required: false,
          },
        ],
      });

      const availableTags = JSON.parse(JSON.stringify(tags)) as IInstanceTag[];

      const bodyData = {
        assets: [
          {
            id: instance.instanceid,
            refid: instance.instancerefid,
            region: instance.region,
            tnregionid: instance.tnregionid,
            customerid: instance.customerid,
          },
        ],
        tagvalues: [
          ...availableTags.map((t) => {
            return {
              tagid: t.tag.tagid,
              tagname: t.tag.tagname,
              tagvalue: t.tagvalue,
            };
          }),
          JSON.parse(orchschedule.trigger_meta),
        ],
        tenantid: instance.tenantid,
        cloudprovider: "AWS",
        resourcetype: "ASSET_INSTANCE",
        createdby: orchschedule.createdby,
        createddt: new Date(),
        region: instance.region,
        tnregionid: instance.tnregionid,
      };

      const url = constants.CM().AWS_TAG_UPDATE;

      const { data } = await axios.post(url, bodyData, {
        headers: {
          "x-auth-header": token,
        },
      });

      console.log("Response FROM API IS >>>>>>>>>>>>>>>");
      console.log(data);
    }
  } catch (error) {
    LokiService.createLog(
      {
        message: "Orchestration running.",
        reference: "ORCH-RUNNER",
        meta: JSON.stringify(orchschedule),
        error: String(error),
        tag: "ORCH-" + orchschedule.id,
      },
      "ERROR"
    );
  }
};

const downloadFile = (scriptname: string): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    CommonService.readS3File("Scripts/" + scriptname)
      .then((data) => {
        if (data) {
          fs.writeFile(
            process.cwd() + "/public/Scripts/" + scriptname,
            data,
            (err) => {
              if (err) {
                logger.error(
                  null,
                  ILogModules.Orchestration,
                  ILogOperation.Other,
                  {
                    notes: "Error obtaining file",
                    meta: {
                      path: "Scripts/" + scriptname,
                      err: String(err),
                    },
                  }
                );
                reject(err);
              } else {
                resolve(true);
              }
            }
          );
        } else {
          logger.error(null, ILogModules.Orchestration, ILogOperation.Other, {
            notes: "Error obtaining file",
            meta: {
              path: "Scripts/" + scriptname,
              err: String("No script file found."),
            },
          });
          reject(new Error("No script file found."));
        }
      })
      .catch((err) => {
        logger.error(null, ILogModules.Orchestration, ILogOperation.Other, {
          notes: "Error obtaining file",
          meta: {
            path: "Scripts/" + scriptname,
            err: String(err),
          },
        });
        reject(err);
      });
  });
};

export default class AppWorker {
  private conn: Redis;

  constructor(conn: Redis) {
    this.conn = conn;
  }

  // Worker actually executes the orchestration based on the configurations
  // and updates the logs table.
  async initWorker() {
    console.log("✅ Orcherstration runner worker node initated.");
    logger.verbose(null, ILogModules.Orchestration, ILogOperation.Other, {
      notes: "Orcherstration runner worker node initated.",
    });
    new QueueScheduler(constants.QUEUE.ORCH_RUNNER, {
      connection: this.conn,
    });
    new Worker(
      constants.QUEUE.ORCH_RUNNER,
      (job: Job<IOrchestrationLog>) => {
        return new Promise(async (resolve, reject) => {
          logger.verbose(null, ILogModules.Orchestration, ILogOperation.Other, {
            notes: "## Scheduler runner node, configuring logger to run.",
            meta: job.data,
          });

          try {
            let appLog = new AppLogger(
              process.cwd() + `/instances/${job.data.id}/`,
              job.data.id + ".log",
              {
                tag: "ORCH-" + job.data._orchschedule,
                writetoconsole: true,
                maskLogs: [
                  {
                    pattern: new RegExp(/("password"):("(.*?)")/g),
                    replacementValue: '$1:"########"',
                  },
                  {
                    pattern: new RegExp(/-p (.*\s)/g),
                    replacementValue: "-p ######## ",
                  },
                  {
                    pattern: new RegExp(/("secretAccessKey"):("(.*?)")/g),
                    replacementValue: '$1:"########"',
                  },
                  {
                    pattern: new RegExp(/("accessKeyId"):("(.*?)")/g),
                    replacementValue: '$1:"#########"',
                  }
                ],
              }
            );
            appLog.writeLogToFile(
              "info",
              "### Initiating base configurations for orchestration to run."
            );

            // Scripts attached to the orchestration, Used to create a copy on the local.
            const scripts = [];

            const orchSchedule = await db.OrchestrationSchedule.findById(
              job.data._orchschedule
            );

            if (!orchSchedule) {
              appLog.writeLogToFile(
                "error",
                "### Orchestration schedule not found. Closing orchestration"
              );
              appLog.closeLogger(job.data.id);
              reject();
              return;
            }

            // const instance = await db.Instances.findById(job.data._instance);
            const orch = await db.Orchestration.findById(
              orchSchedule.dataValues["_orch"]
            );
            const o = orch.dataValues;
            const params = job.data.params ? JSON.parse(job.data.params) : {};

            let s = (o["scripts"] ? JSON.parse(o["scripts"]) : null) as
              | null
              | OrcherstrationScript[];

            appLog.writeLogToFile(
              "info",
              "### Orchestration scripts are classified."
            );

            await db.OrchestrationLog.update(
              {
                status: "Inprogress",
                execution_start: new Date(),
                lastupdateddt: new Date(),
                lastupdatedby: "Worker",
              },
              {
                where: {
                  id: job.data.id,
                },
              }
            );

            appLog.writeLogToFile(
              "info",
              "### Orchestration running status updated."
            );

            if (s) {
              appLog.writeLogToFile(
                "info",
                "### Caching all the scripts used on orchestration 🔃"
              );
              const scriptDownloadResponses = await Promise.all(
                s.map((element) => downloadFile(element["scriptname"]))
              );

              appLog.writeLogToFile(
                "info",
                "### Cached all the scripts used on orchestration ✅"
              );

              s.forEach((element) => {
                scripts.push(
                  process.cwd() + "/public/Scripts/" + element["scriptname"]
                );
              });
            }

            appLog.writeLogToFile(
              "info",
              "### Orchestration runner starts in 5 seconds ⌛"
            );

            setTimeout(async function () {
              appLog.writeLogToFile(
                "info",
                "### Orchestration runner, verifying the scripts required to run ⌛"
              );
              await VerifyScript(scripts);
              appLog.writeLogToFile(
                "info",
                "### Orchestration runner, scripts verification complete ✅"
              );

              appLog.writeLogToFile(
                "info",
                "### Orchestration runner, replacing dynamic parameters passed."
              );

              const flow = JSON.parse(o["orchflow"]);
              const nodes = flow["nodes"] as Array<Record<string, any>>;

              const nodesParameterized = nodes.map((n) => {
                let data = {};
                let node = n;

                for (const key in n["params"]["data"]) {
                  if (
                    Object.prototype.hasOwnProperty.call(
                      n["params"]["data"],
                      key
                    )
                  ) {
                    const value = n["params"]["data"][key] as string;
                    if (value.includes("{{v_") && value.includes("}}")) {
                      data[key] = params[key];
                    } else {
                      data[key] = value;
                    }
                  }
                }

                node["params"]["data"] = data;

                return node;
              });

              appLog.writeLogToFile(
                "info",
                "### Orchestration runner, dynamic parameters configuration passed."
              );

              flow["nodes"] = nodesParameterized;

              appLog.writeLogToFile(
                "info",
                "### Orchestration runner, starting actual workflow with parameters ",
                JSON.stringify({
                  // sys_ip: instance.dataValues["publicipv4"],
                  // sys_ip_private: instance.dataValues["privateipv4"],
                  // sys_ts_ip: instance.dataValues["publicipv4"],
                  // sys_name: instance.dataValues["instancename"],
                  sys_host_ip: null,
                  sys_deploymentid: job.data.id as any,
                  ...params,
                })
              );

              let orch = new Orchestrate(
                flow,
                {
                  // sys_ip: instance.dataValues["publicipv4"],
                  // sys_ip_private: instance.dataValues["privateipv4"],
                  // sys_ts_ip: instance.dataValues["publicipv4"],
                  // sys_name: instance.dataValues["instancename"],
                  // sys_id: instance.dataValues["instancerefid"],
                  sys_host_ip: null,
                  headerid: orchSchedule.dataValues["scdlid"],
                  sys_deploymentid: job.data.id as any,
                  ...params,
                },
                {
                  logger: appLog,
                  onLifeCycleChange: async (lifecycle) => {
                    try {
                      // appLog.writeLogToFile(
                      //   "info",
                      //   "### Orchestration runner, updating lifecycle.",
                      //   JSON.stringify({
                      //     message: "Runner updating lifecycle.",
                      //     reference: "ORCH-RUNNER",
                      //     data: job.data,
                      //   })
                      // );
                      await db.OrchestrationLog.update(
                        {
                          lifecycle: JSON.stringify(lifecycle),
                        },
                        {
                          where: {
                            id: job.data.id,
                          },
                        }
                      );
                    } catch (error) {
                      appLog.writeLogToFile(
                        "info",
                        "### Orchestration runner, error updating lifecycle.",
                        JSON.stringify({
                          message: "Runner updating lifecycle.",
                          reference: "ORCH-RUNNER",
                          data: job.data,
                          error: String(error),
                        })
                      );
                    }
                  },
                },
                {
                  settings: {
                    autocloselogger: false,
                  },
                }
              );
              appLog.writeLogToFile(
                "info",
                "### Orchestration runner, handing over workflow to orchestration engine",
                JSON.stringify({
                  // sys_ip: instance.dataValues["publicipv4"],
                  // sys_ts_ip: instance.dataValues["publicipv4"],
                  // sys_name: instance.dataValues["instancename"],
                  sys_host_ip: null,
                  sys_deploymentid: job.data.id as any,
                  ...params,
                })
              );
              const orchStatus = await orch.start();
              await db.OrchestrationLog.update(
                {
                  status: orchStatus ? "Completed" : "Failed",
                  execution_end: new Date(),
                  lastupdateddt: new Date(),
                  lastupdatedby: "Worker",
                },
                {
                  where: {
                    id: job.data.id,
                  },
                }
              );

              appLog.writeLogToFile(
                "info",
                "### Orchestration runner, orchestration engine responded closure",
                JSON.stringify({
                  message: "Orchestration running completed.",
                  reference: "ORCH-RUNNER",
                  tag: "ORCH-" + job.data._orchschedule,
                  data: job.data,
                })
              );

              if (orchSchedule.dataValues["trigger"] == "UPDATE-TAG") {
                appLog.writeLogToFile(
                  "info",
                  "### Orchestration runner, Trigger found, updating TAG's",
                  JSON.stringify({
                    orchSchedule,
                    // instance,
                  })
                );
                // FIIXME: Triggers needs to be re-worked.
                // tUpdateTag(
                //   JSON.parse(JSON.stringify(orchSchedule)),
                //   JSON.parse(JSON.stringify(instance))
                // );
                appLog.writeLogToFile(
                  "info",
                  "### Orchestration runner, Trigger initiated, closing logger"
                );
                appLog.closeLogger(job.data.id);
              } else {
                appLog.closeLogger(job.data.id);
              }

              resolve("Completed.");
            }, 6000);
          } catch (error) {
            await db.OrchestrationLog.update(
              {
                status: "Failed",
                execution_end: new Date(),
                lastupdateddt: new Date(),
                lastupdatedby: "Worker",
              },
              {
                where: {
                  id: job.data.id,
                },
              }
            );
            logger.error(null, ILogModules.Orchestration, ILogOperation.Other, {
              notes: "## Error, starting the Orchestration runner.",
              meta: {
                data: job.data,
                error: String(error),
              },
            });
            reject(error);
          }
        });
      },
      {
        connection: this.conn,
        concurrency: 300,
      }
    ).setMaxListeners(0);
  }
}

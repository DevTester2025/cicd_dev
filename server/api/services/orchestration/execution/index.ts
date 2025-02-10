import sequelize = require("sequelize");
import * as moment from "moment";

import {
  Orchestration,
  Node,
  OrchestrationConfigs,
  OrchestrationUtils,
  OrchestrationSettings,
  OrchestrationMeta,
} from "../types";

import Store from "./store";
import * as Flow from "../flow";
import { Op } from "sequelize";
import * as fs from "fs";
import HandleSessionNode from "./handlers/sessionNode";
import ShellHandler from "./handlers/sshHandler";
import Shell from "./platforms/shell/executeshell";
import HandleScriptNode from "./handlers/scriptNode";
import HandleCopyNode from "./handlers/copyNode";
import HandleRestartNode from "./handlers/restartNode";
import HandleDecisionNode from "./handlers/decisionNode";
import HandlePatchNode from "./handlers/patchnode";
import sshHandler from "./handlers/sshHandler";
import { EventEmitter } from "events";
import db from "../../../models/model";
import { constants } from "../../../../common/constants";
import getAWSCredentials from "./platforms/awsParamsMngr/getCreds";

class State {
  private datas: { [key: string]: any } = {};

  constructor() {}

  setState(key: string, value: any) {
    this.datas[key] = value;
  }

  getState(key: string): any | null {
    return this.datas[key];
  }

  removeState(key: string) {
    delete this.datas[key];
  }
}

let state = new State();

export class Orchestrate {
  private orchestration: Orchestration;
  private orchestrationConfigs: OrchestrationConfigs;
  private orchestrationSettings: OrchestrationSettings;
  private orchestrationUtils: OrchestrationUtils;
  private orchStore: Store;

  private canRun: boolean = false;
  private orchRunState: EventEmitter;
  private orchLifecycle: EventEmitter;

  private lifecycle: any = {};
  private completed_nodes = {};

  constructor(
    orchestration: Orchestration,
    configs: OrchestrationConfigs,
    utils: OrchestrationUtils,
    options?: {
      settings?: OrchestrationSettings;
    }
  ) {
    this.orchestration = orchestration;
    this.orchestrationConfigs = configs;
    this.orchestrationUtils = utils;
    this.orchestrationSettings = options.settings
      ? options.settings
      : {
          autocloselogger: true,
        };
    this.orchStore = new Store(orchestration);

    this.orchRunState = new EventEmitter();
    this.orchLifecycle = new EventEmitter();

    this.orchStore.addMeta(OrchestrationMeta.STARTTIME, new Date());

    // Prefill lifecycle state.
    // this.orchestration.nodes.forEach((node) => {
    //   const identifier =
    //     node.params.id +
    //     "-###-" +
    //     (node.params.label.length > 0 ? node.params.label : node.name);
    //   this.lifecycle[identifier] = null;
    // });
    this.createLifeCycle();

    // Configs to run orchestra
    if (state.getState(configs.sys_deploymentid)) {
      this.canRun = false;
    } else {
      state.setState(configs.sys_deploymentid, {
        state: "Active",
        createddt: new Date(),
      });
      this.canRun = true;
    }
    utils.logger.writeOnConsole(true);
  }

  start(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.orchRunState.on("close", (success: boolean) => {
        resolve(success);
      });
      let updateObj = {
        starttime: new Date(),
        pendingrun: sequelize.literal("pendingrun - pendingrun"),
        inprogress: sequelize.literal("inprogress + totalrun"),
        status: constants.STATUS_INPROGRESS,
      };
      db.OrchestrationScheduleHdr.update(updateObj, {
        where: {
          starttime: { [Op.eq]: null },
          scdlid: this.orchestrationConfigs.headerid,
        },
      });
      if (this.canRun) {
        this.orchestrationUtils.logger.writeLogToFile(
          "info",
          "Orchestration execution started."
        );
        const startNode = Flow.GetStartNode(this.orchestration);
        this.updateLifecycle(startNode, "Completed", { message: "Completed" });
        this.identifyNextNode(startNode.params.id);
      } else {
        this.orchestrationUtils.logger.writeLogToFile(
          "warn",
          "Orchestration for same deployment is already running."
        );
        this.orchestrationUtils.logger.writeLogToFile(
          "warn",
          state.getState(this.orchestrationConfigs.sys_deploymentid)
        );
      }
    });
  }

  protected async createLifeCycle() {
    const orch = this.orchestration;
    const a = this;
    const startNode = Flow.GetStartNode(orch);
    const identifier =
      startNode.params.id +
      "-###-" +
      (startNode.params.label.length > 0
        ? startNode.params.label
        : startNode.name);
    this.lifecycle[identifier] = null;

    this.lifecycle["total_nodes"] = orch.nodes.length;
    try {
      for (const node of orch.nodes) {
        await db.OrchestrationNodeLifecycle.create({
          scdlid: this.orchestrationConfigs.headerid,
          refid: node.params.id,
          node: node.name,
          log: "",
          status: "Inprogress",
          message: null,
          createddt: new Date(),
          createdby: "ADMIN",
          updateddt: new Date(),
        });
      }
    } catch (error) {
      console.error("Error while creating lifecycle entry:", error);
    }
    // function moveToNextNode(currentNode: Node) {
    //   let nodes = Flow.GetNextNode(orch, currentNode.params.id);

    //   if (nodes.length > 0) {
    //     const node = nodes[0];
    //     const identifier =
    //       node.params.id +
    //       "-###-" +
    //       (node.params.label.length > 0 ? node.params.label : node.name);
    //     a.lifecycle[identifier] = null;
    //     moveToNextNode(node);
    //   }
    // }

    // moveToNextNode(startNode);
  }

  protected updateLifecycle(
    node: Node,
    state: "Inprogress" | "Completed" | "Pending" | "Failed" | "Skipped",
    meta?: {
      message?: string;
    }
  ) {
    let vmname;
    if (node.data && node.data["name"]) {
      vmname =
        this.orchestrationConfigs[
          `sys_${node.data["name"].replace(/[^\w]/g, "").toLowerCase()}_name`
        ];
    }
    let VmName;
    if (node.name === "SessionNode" && vmname !== undefined) {
      VmName = vmname;
    } else {
      if (node.name === "SessionNode") {
        VmName = `${node.params.label} (no input)`;
      } else {
        VmName = node.params.label;
      }
    }
    if (state == "Completed") this.completed_nodes[node.params.id] = state;
    const identifier =
      node.params.id +
      "-###-" +
      (node.params.label.length > 0 ? VmName : node.name);
    this.lifecycle[identifier] = meta
      ? { state, message: meta.message, timestamp: new Date() }
      : { state, timestamp: new Date() };
    this.orchestrationUtils.onLifeCycleChange(this.lifecycle);
  }

  protected identifyNextNode(currentNodeId: string) {
    let nodes = Flow.GetNextNode(this.orchestration, currentNodeId);
    this.orchestrationUtils.logger.writeLogToFile(
      "verbose",
      "Next node will be ---------------------------------"
    );
    this.orchestrationUtils.logger.writeLogToFile("verbose", nodes);

    if (nodes.length == 1) {
      let prevNodes = Flow.GetPreviousNode(
        this.orchestration,
        nodes[0].params.id
      );
      this.orchestrationUtils.logger.writeLogToFile(
        "verbose",
        "Pres node will be ---------------------------------"
      );
      this.orchestrationUtils.logger.writeLogToFile("verbose", prevNodes);
      this.orchestrationUtils.logger.writeLogToFile(
        "verbose",
        this.completed_nodes
      );
      let isValid = true;
      for (let pnode of prevNodes) {
        if (!this.completed_nodes[pnode.params.id]) {
          isValid = false;
        }
      }
      if (isValid) {
        if (nodes.length > 0) {
          for (let node of nodes) {
            if (node.name == "ActivityNode") {
              node.data.failedwaittime = node.data.failedwaittime
                ? node.data.failedwaittime
                : 30;
              node.data.failedretries = node.data.failedretries
                ? node.data.failedretries
                : 2;
              node.data.executedRetries = 0;
            }
            this.checksessionNode(node);
          }
        } else {
          this.closeOrchestration(true, "No more nodes to process.");
        }
      } else {
        this.orchestrationUtils.logger.writeLogToFile(
          "verbose",
          "Wait for previous node to get completed"
        );
      }
    } else {
      if (nodes.length > 0) {
        for (let node of nodes) {
          if (node.name == "ActivityNode") {
            node.data.failedwaittime = node.data.failedwaittime
              ? node.data.failedwaittime
              : 30;
            node.data.failedretries = node.data.failedretries
              ? node.data.failedretries
              : 1;
            node.data.executedRetries = 0;
          }
          this.checksessionNode(node);
        }
      } else {
        this.closeOrchestration(true, "No more nodes to process.");
      }
    }
  }

  protected async checksessionNode(node: Node) {
    if (
      node.name !== "SessionNode" &&
      node.name !== "EndNode" &&
      node.name !== "WaitNode"
    ) {
      let prevNodes = Flow.GetPreviousNode(this.orchestration, node.params.id);
      for (let pnode of prevNodes) {
        if (pnode.name === "SessionNode") {
          this.orchestrationUtils.logger.writeLogToFile(
            "info",
            `Session node is ${JSON.stringify(pnode)}`
          );
          let vmname =
            this.orchestrationConfigs[
              `sys_${pnode.data["name"]
                .replace(/[^\w]/g, "")
                .toLowerCase()}_name`
            ];
          let vmip =
            pnode["data"]["ipaddress"] &&
            pnode["data"]["ipaddress"].includes("{{") &&
            pnode["data"]["ipaddress"].includes("}}")
              ? this.orchestrationConfigs[
                  pnode["data"]["ipaddress"].replace("{{", "").replace("}}", "")
                ]
              : pnode["data"]["ipaddress"];
          if (vmname || vmip) {
            this.processNode(node);
          } else {
            this.orchestrationUtils.logger.writeLogToFile(
              "info",
              `Missing if VM name and IP ${vmname} ${vmip}`
            );
            this.updateLifecycle(node, "Completed", { message: "Completed" });
            this.identifyNextNode(node.params.id);
          }
        } else {
          this.updateLifecycle(node, "Failed", {
            message: "Session node missing",
          });
          this.identifyNextNode(node.params.id);
        }
      }
    } else {
      this.processNode(node);
    }
  }

  protected async processNode(node: Node) {
    try {
      this.orchestrationUtils.logger.writeLogToFile(
        "info",
        `Handling node ${node.name} : ${node.params.label}--------`
      );
      this.orchestrationUtils.logger.writeLogToFile(
        "info",
        `### Log Entry: ${node.params.data["logentry"]}`
      );
      this.orchestrationUtils.logger.writeLogToFile(
        "info",
        "###",
        node.name,
        node.params.label
      );
      this.updateLifecycle(node, "Inprogress");
      switch (node.name) {
        case "ActivityNode":
          let self = this;
          if (node.data.scripttype == "SH") {
            this.orchestrationUtils.logger.writeLogToFile(
              "info",
              "Executing Shell script"
            );
            ShellHandler.activityNode(
              node,
              this.orchestrationConfigs,
              this.orchestrationUtils,
              this.orchStore
            )
              .then((response: any) => {
                if (response.continue) {
                  this.updateLifecycle(node, "Completed", {
                    message: response ? JSON.stringify(response) : "Completed",
                  });
                  this.orchStore.addResponse(node.params.id, response);
                  this.identifyNextNode(node.params.id);
                }
              })
              .catch((err) => {
                if (node.data.failedretries == node.data.executedRetries) {
                  this.updateLifecycle(node, "Failed", {
                    message: err.toString(),
                  });
                  this.orchestrationUtils.logger.writeLogToFile(
                    "error",
                    `Error script node execution ${node.name}`
                  );
                  this.orchestrationUtils.logger.writeLogToFile("error", err);
                  this.closeOrchestration(false, err);
                } else {
                  this.orchestrationUtils.logger.writeLogToFile(
                    "error",
                    `Retrying script node execution for ${node.data.executedRetries} time`
                  );
                  node.data.executedRetries += 1;
                  self.processNode(node);
                }
              });
          } else {
            HandleScriptNode(
              node,
              this.orchestrationConfigs,
              this.orchestrationUtils,
              this.orchStore
            )
              .then((response) => {
                if (response.continue) {
                  this.updateLifecycle(node, "Completed", {
                    message: response ? JSON.stringify(response) : "Completed",
                  });
                  this.orchStore.addResponse(node.params.id, response);
                  this.identifyNextNode(node.params.id);
                }
              })
              .catch((err) => {
                if (node.data.failedretries == node.data.executedRetries) {
                  this.updateLifecycle(node, "Failed", {
                    message: err.toString(),
                  });
                  this.orchestrationUtils.logger.writeLogToFile("error", err);
                  this.closeOrchestration(false, err);
                } else {
                  node.data.executedRetries += 1;
                  this.orchestrationUtils.logger.writeLogToFile(
                    "error",
                    `Retrying script node execution for ${node.data.executedRetries} time`
                  );
                  self.processNode(node);
                }
              });
          }
          break;
        case "CopyNode":
          HandleCopyNode(
            node,
            this.orchestrationConfigs,
            this.orchestrationUtils,
            this.orchStore
          )
            .then((response) => {
              if (response.continue) {
                this.updateLifecycle(node, "Completed");
                this.orchStore.addResponse(node.params.id, response);
                this.identifyNextNode(node.params.id);
              }
            })
            .catch((err) => {
              this.updateLifecycle(node, "Failed", {
                message: err.toString(),
              });
              this.orchestrationUtils.logger.writeLogToFile(
                "error",
                `Error script node execution ${node.name}`
              );
              this.orchestrationUtils.logger.writeLogToFile("error", err);
              this.closeOrchestration(false, err);
            });
          break;
        case "DecisionNode":
          HandleDecisionNode(
            node,
            this.orchestrationConfigs,
            this.orchestrationUtils,
            this.orchStore
          )
            .then((response) => {
              if (response.continue) {
                this.updateLifecycle(node, "Completed", {
                  message: response ? JSON.stringify(response) : "Completed",
                });

                this.orchStore.addResponse(node.params.id, response);
                this.processNode(response.payload);
              }
            })
            .catch((err) => {
              this.updateLifecycle(node, "Failed", {
                message: err.toString(),
              });
              this.orchestrationUtils.logger.writeLogToFile(
                "error",
                `Error decision node execution ${node.name}`
              );
              this.orchestrationUtils.logger.writeLogToFile("error", err);
              this.closeOrchestration(false, err);
            });
          break;
        case "SessionNode":
          let vmname =
            this.orchestrationConfigs[
              `sys_${node.data["name"]
                .replace(/[^\w]/g, "")
                .toLowerCase()}_name`
            ];
          let vmip =
            node["data"]["ipaddress"].includes("{{") &&
            node["data"]["ipaddress"].includes("}}")
              ? this.orchestrationConfigs[
                  node["data"]["ipaddress"].replace("{{", "").replace("}}", "")
                ]
              : node["data"]["ipaddress"];
          if (vmname || vmip) {
            if (node.data.authentication_type == "aws_param_store") {
              let lookupQry = {
                where: {
                  lookupkey: constants.LOOKUPKEYS.AWS_PARAMS_STORE,
                  status: constants.STATUS_ACTIVE,
                  tenantid: this.orchestrationConfigs.tenantid,
                },
              };
              let params_config: any = await db.LookUp.findOne(lookupQry);
              let platform =
                this.orchestrationConfigs[
                  `sys_${node.data["name"]
                    .replace(/[^\w]/g, "")
                    .toLowerCase()}_platform`
                ];
              let provider =
                this.orchestrationConfigs[
                  `sys_${node.data["name"]
                    .replace(/[^\w]/g, "")
                    .toLowerCase()}_provider`
                ];
              if (params_config) {
                params_config = JSON.parse(params_config.keyvalue);
                let accountid: any = await db.CustomerAccount.findOne({
                  where: {
                    accountref: params_config.accountid,
                    tenantid: this.orchestrationConfigs.tenantid,
                  },
                  attributes: ["id"],
                });
                params_config.account_id = accountid.id;
                params_config.tenantid = this.orchestrationConfigs.tenantid;
                params_config.instancename =
                  this.orchestrationConfigs[
                    `sys_${node.data["name"]
                      .replace(/[^\w]/g, "")
                      .toLowerCase()}_name`
                  ];
                if (provider == constants.CLOUDPROVIDERS[2]) {
                  params_config.instancename = "BLUE-COMMON-SERVER";
                  if (constants.BLUE_PLATFORM.includes(platform))
                    params_config.username = params_config.ad_username;
                }                
                try {
                  let data = await getAWSCredentials(params_config);
                  node.params.data["userid"] = params_config.username;
                  node.params.data["password"] = data;
                  node.data["userid"] = params_config.username;
                  node.data["password"] = data;
                } catch (err) {
                  this.orchestrationUtils.logger.writeLogToFile(
                    "error",
                    `AWS Credentials missing in Param Store`
                  );
                  this.closeOrchestration(false, "Error in Session node");
                  return;
                }
              }
            }
            if (node.data.Type == "Node-SSH") {
              this.orchestrationUtils.logger.writeLogToFile("info", "");
              this.orchestrationUtils.logger.writeLogToFile(
                "info",
                "## Getting started with session node"
              );
              this.orchestrationUtils.logger.writeLogToFile(
                "info",
                "## " + JSON.stringify(this.orchestrationConfigs)
              );
              this.orchestrationUtils.logger.writeLogToFile(
                "info",
                "## " + JSON.stringify(node)
              );
              let param = {
                ip: vmip,
                username: node["data"]["userid"],
                password: node["data"]["password"],
              };
              this.orchestrationUtils.logger.writeLogToFile(
                "info",
                "Parameters are " + JSON.stringify(param)
              );
              Shell.executecmd(
                param,
                10,
                node["params"]["id"],
                this.orchestrationUtils
              )
                .then((res: any) => {
                  this.updateLifecycle(node, "Completed", {
                    message: "Completed",
                  });
                  this.orchestrationUtils.logger.writeLogToFile(
                    "info",
                    "Response are " +
                      node.params.id +
                      " ** " +
                      JSON.stringify(res)
                  );
                  Shell.storeSession(node.params.id, res);
                  this.identifyNextNode(node.params.id);
                })
                .catch((err) => {
                  this.updateLifecycle(node, "Failed", {
                    message: err.toString(),
                  });
                  this.orchestrationUtils.logger.writeLogToFile(
                    "error",
                    `Error obtaining session ${node.name}`
                  );
                  this.orchestrationUtils.logger.writeLogToFile("error", err);
                  this.closeOrchestration(false, err);
                });
            } else {
              this.orchestrationUtils.logger.writeLogToFile(
                "info",
                "## Getting started with session node"
              );
              this.orchestrationUtils.logger.writeLogToFile(
                "info",
                JSON.stringify({
                  node,
                  configs: this.orchestrationConfigs,
                  store: this.orchStore,
                })
              );
              HandleSessionNode(
                node,
                this.orchestrationConfigs,
                this.orchestrationUtils,
                this.orchStore
              )
                .then((response) => {
                  this.updateLifecycle(node, "Completed", {
                    message: "Completed",
                  });
                  this.orchestrationUtils.logger.writeLogToFile(
                    "info",
                    `Session node completed`
                  );
                  if (response.continue) {
                    this.orchStore.addResponse(node.params.id, response);
                    this.identifyNextNode(node.params.id);
                  }
                })
                .catch((err) => {
                  this.updateLifecycle(node, "Failed", {
                    message: err.toString(),
                  });
                  this.orchestrationUtils.logger.writeLogToFile(
                    "error",
                    `Error obtaining session ${node.name}`
                  );
                  this.orchestrationUtils.logger.writeLogToFile("error", err);
                  this.closeOrchestration(false, err);
                });
            }
          } else {
            this.updateLifecycle(node, "Completed", { message: "Completed" });
            this.identifyNextNode(node.params.id);
          }
          break;
        case "RestartNode":
          this.orchestrationUtils.logger.writeLogToFile(
            "info",
            "## Getting started with restart node"
          );
          if (node.data.Type == "Node-SSH") {
            sshHandler
              .restartNode(
                node,
                this.orchestrationConfigs,
                this.orchestrationUtils,
                this.orchStore
              )
              .then((res) => {
                this.updateLifecycle(node, "Completed", {
                  message: JSON.stringify(res),
                });
                this.identifyNextNode(node.params.id);
              })
              .catch((err) => {
                this.updateLifecycle(node, "Failed", {
                  message: err.toString(),
                });
                this.orchestrationUtils.logger.writeLogToFile(
                  "error",
                  `Error from restart node ${node.name}`
                );
                this.orchestrationUtils.logger.writeLogToFile("error", err);
                this.closeOrchestration(false, err);
              });
          } else {
            HandleRestartNode(
              node,
              this.orchestrationConfigs,
              this.orchestrationUtils,
              this.orchStore
            )
              .then((response) => {
                this.updateLifecycle(node, "Completed", {
                  message: response ? JSON.stringify(response) : "Completed",
                });
                if (response.continue) {
                  this.orchStore.addResponse(node.params.id, response);
                  this.identifyNextNode(node.params.id);
                }
              })
              .catch((err) => {
                this.updateLifecycle(node, "Failed", {
                  message: err.toString(),
                });
                this.orchestrationUtils.logger.writeLogToFile(
                  "error",
                  `Error from restart node ${node.name}`
                );
                this.orchestrationUtils.logger.writeLogToFile("error", err);
                this.closeOrchestration(false, err);
              });
          }
          break;
        case "WaitNode":
          this.orchestrationUtils.logger.writeLogToFile(
            "info",
            "## Getting started with wait node"
          );

          let waitTime = 30;

          if (node.params.data && node.params.data["waittime"]) {
            waitTime = node.params.data["waittime"];
          }

          this.orchestrationUtils.logger.writeLogToFile(
            "info",
            "## Orchestration is waiting for ",
            waitTime,
            " seconds."
          );
          setTimeout(() => {
            this.updateLifecycle(node, "Completed", { message: "Completed" });
            this.identifyNextNode(node.params.id);
          }, waitTime * 1000);
          break;
        case "PatchNode":
          this.orchestrationUtils.logger.writeLogToFile(
            "info",
            "## Getting started with Patch node"
          );
          this.orchestrationUtils.logger.writeLogToFile(
            "info",
            JSON.stringify({
              node,
              configs: this.orchestrationConfigs,
              store: this.orchStore,
            })
          );
          HandlePatchNode.start(
            node,
            this.orchestrationConfigs,
            this.orchestrationUtils,
            this.orchStore
          )
            .then((response) => {
              this.updateLifecycle(node, "Completed", {
                message: response ? JSON.stringify(response) : "Completed",
              });
              this.orchestrationUtils.logger.writeLogToFile(
                "info",
                `Patch node completed`
              );
              this.identifyNextNode(node.params.id);
            })
            .catch((err) => {
              this.updateLifecycle(node, "Failed", {
                message: err.toString(),
              });
              this.orchestrationUtils.logger.writeLogToFile(
                "error",
                `Error in executing patch node`
              );
              this.orchestrationUtils.logger.writeLogToFile("error", err);
              this.closeOrchestration(false, err);
            });
          break;
        case "EndNode":
          let prevNodes = Flow.GetPreviousNode(
            this.orchestration,
            node.params.id
          );
          this.orchestrationUtils.logger.writeLogToFile(
            "verbose",
            "Pres node will be ---------------------------------"
          );
          this.orchestrationUtils.logger.writeLogToFile("verbose", prevNodes);
          this.orchestrationUtils.logger.writeLogToFile(
            "verbose",
            this.completed_nodes
          );
          let isValid = true;
          for (let pnode of prevNodes) {
            if (!this.completed_nodes[pnode.params.id]) {
              isValid = false;
            }
          }
          if (isValid) {
            this.updateLifecycle(node, "Completed", { message: "Completed" });
            this.closeOrchestration(true, "Orchestration flow completed.");
          }
          break;
        default:
          break;
      }
    } catch (error) {
      this.orchestrationUtils.logger.writeLogToFile(
        "error",
        `Error in orchestration execution flow.`
      );
      this.orchestrationUtils.logger.writeLogToFile("error", error);
      this.closeOrchestration(
        false,
        "Unable to continue the flow.",
        null,
        error
      );
    }
  }

  writeToFile(name, string) {
    fs.writeFile(name, JSON.stringify(string), function (err) {
      if (err) {
        console.error(err);
      } else {
        console.log("done");
      }
    });
  }

  protected closeOrchestration(
    success: boolean,
    message: string,
    payload?: any,
    err?: any
  ) {
    this.updateExporter(success ? true : false);
    this.updateHeader(success ? true : false);
    state.removeState(this.orchestrationConfigs.sys_deploymentid);
    this.orchestrationUtils.logger.writeLogToFile(
      success ? "info" : "error",
      message
    );

    let startTime = this.orchStore.getMeta(OrchestrationMeta.STARTTIME);
    this.orchRunState.emit("close", success);
    this.orchRunState.removeAllListeners();
    this.orchestrationUtils.logger.writeLogToFile(
      "info",
      `Orchestration flow completed in ${moment().diff(
        startTime,
        "minutes"
      )} minutes`
    );

    if (err) this.orchestrationUtils.logger.writeLogToFile("error", err);

    if (this.orchestrationSettings.autocloselogger) {
      this.orchestrationUtils.logger.closeLogger(
        this.orchestrationConfigs.sys_deploymentid
      );
    }
  }
  async updateExporter(status: Boolean) {
    let schedulelog: any = await db.OrchestrationLog.find({
      where: { id: this.orchestrationConfigs.sys_deploymentid },
      attributes: ["_orchschedule"],
      include: [
        {
          model: db.OrchestrationSchedule,
          as: "schedule",
          attributes: ["exptrid"],
        },
      ],
    });
    schedulelog = JSON.parse(JSON.stringify(schedulelog));
    if (schedulelog && schedulelog.schedule && schedulelog.schedule.exptrid) {
      await db.ExptrMapping.update(
        {
          exptrstatus: status ? "Installed" : "Failed",
        },
        {
          where: {
            exptrid: schedulelog.schedule.exptrid,
          },
        }
      );
    }
  }
  async updateHeader(status: any) {
    let statusObj: any = {
      successrun: status
        ? sequelize.literal("successrun + 1")
        : sequelize.literal("successrun"),
      failedrun: status
        ? sequelize.literal("failedrun")
        : sequelize.literal("failedrun + 1"),
      cmpltdrun: sequelize.literal("cmpltdrun + 1"),
      inprogress: sequelize.literal("inprogress - 1"),
    };
    await db.OrchestrationScheduleHdr.update(statusObj, {
      where: { scdlid: this.orchestrationConfigs.headerid },
    });
    let hdrData: any = await db.OrchestrationScheduleHdr.find({
      where: { scdlid: this.orchestrationConfigs.headerid },
    });
    hdrData = JSON.parse(JSON.stringify(hdrData));
    let endtime = new Date();
    let duration = moment().diff(hdrData.starttime, "minutes");
    let updateObj: any = { duration };

    if (hdrData.inprogress == 0) {
      updateObj.endtime = endtime;
      updateObj.status = constants.STATUS_COMPLETED;
    }
    await db.OrchestrationScheduleHdr.update(updateObj, {
      where: { scdlid: this.orchestrationConfigs.headerid },
    });
  }
}

export default Orchestrate;

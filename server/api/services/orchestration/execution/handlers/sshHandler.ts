import * as fs from "fs";
import {
  Orchestration,
  Node,
  OrchestrationConfigs,
  OrchestrationUtils,
  WinrmSessionParams,
  OrchestrationNodeHandlerResponse,
} from "../../types";
import * as Flow from "../../flow";
import Store from "../store";
import Shell from "../platforms/shell/executeshell";

export class ShellHandler {
  activityNode(
    node: Node,
    orchConfigs: OrchestrationConfigs,
    orchUtils: OrchestrationUtils,
    orchstore
  ) {
    return new Promise((resolve, reject) => {
      try {
        orchUtils.logger.writeLogToFile("info", "SSH Handler called");
        if (
          node.params.data &&
          node.params.data.scriptexectype &&
          node.params.data.scriptexectype == "boottime"
        ) {
          orchUtils.logger.writeLogToFile(
            "info",
            "Boot script cannot be run at this time."
          );
          resolve({
            continue: true,
          });
        }
        if (
          node.params.data &&
          node.params.data.scriptexectype &&
          node.params.data.scriptexectype == "postboot"
        ) {
          let prevNodes = Flow.GetPreviousNode(
            orchstore.getOrchestration(),
            node.params.id
          );
          orchUtils.logger.writeLogToFile("info", "prevNodes");
          orchUtils.logger.writeLogToFile("info", prevNodes);
          if (prevNodes && prevNodes.length == 1) {
            let prevNode = prevNodes[0];

            if (prevNode.name == "SessionNode") {
              let session = Shell.getSession(prevNode.params.id);
              let arg = "";

              orchUtils.logger.writeLogToFile(
                "info",
                "session for " + prevNode.params.id
              );
              orchUtils.logger.writeLogToFile("info", session);
              orchstore.orchestration.nodes.forEach((e) => {
                if (
                  e.data &&
                  e.data.name == node.data.name &&
                  e.data.scriptexectype == "postboot"
                ) {
                  e.data.Params.forEach((element) => {
                    let isDynamicParameter =
                      element.value.includes("{{") &&
                        element.value.includes("}}")
                        ? true
                        : false;

                    element.value = element.value.replace(/{{/gi, "");
                    element.value = element.value.replace(/}}/gi, "");
                    if (isDynamicParameter) {
                      orchUtils.logger.writeLogToFile(
                        "info",
                        "Updating dynamic parameters"
                      );
                      arg +=
                        " -" +
                        element.key +
                        " " +
                        `'${orchConfigs[element.value]}'`;
                    } else {
                      arg += " -" + element.key + " " + `'${element.value}'`;
                    }
                  });
                }
              });
              orchUtils.logger.writeLogToFile(
                "info",
                node.params + " " + node.data.filename + " " + arg
              );
              setTimeout(() => {
                reject("Timeout");
              }, (node.data.failedwaittime * 60 * 1000));
              Shell.scriptExecution(
                session.params,
                node.params.id,
                orchUtils,
                node.data.filename,
                arg
              )
                .then((res) => {
                  resolve(res);
                })
                .catch((e) => {
                  orchUtils.logger.writeLogToFile(
                    "error",
                    "Erro in Shell Handler" + e
                  );
                  reject(e);
                });
            } else {
              orchUtils.logger.writeLogToFile(
                "info",
                "Script node must have input from session node"
              );
              reject("Script node must have input from session node.");
            }
          } else {
            orchUtils.logger.writeLogToFile(
              "info",
              "Script node can't have multiple inputs"
            );
            reject("Script node can't contain multiple inputs.");
          }
        }
      } catch (e) {
        orchUtils.logger.writeLogToFile(
          "error",
          "Erro in Shell Handler catch " + e
        );
        reject(e);
      }
    });
  }
  restartNode(
    node: Node,
    orchConfigs: OrchestrationConfigs,
    orchUtils: OrchestrationUtils,
    orchstore
  ) {
    return new Promise((resolve, reject) => {
      try {
        let prevNodes = Flow.GetPreviousNode(
          orchstore.getOrchestration(),
          node.params.id
        );
        orchUtils.logger.writeLogToFile("info", "prevNodes");
        orchUtils.logger.writeLogToFile("info", prevNodes);
        if (prevNodes && prevNodes.length == 1) {
          let prevNode = prevNodes[0];

          if (prevNode.name == "SessionNode") {
            let session = Shell.getSession(prevNode.params.id);
            Shell.restartRemoteMechine(
              session.params,
              node.params.id,
              orchUtils
            )
              .then((res) => {
                resolve(res);
              })
              .catch((e) => {
                orchUtils.logger.writeLogToFile(
                  "error",
                  "Erro in Shell Handler" + e
                );
                reject(e);
              });
          } else {
            orchUtils.logger.writeLogToFile(
              "info",
              "Restart Node must have input from session node"
            );
            reject("Restart Node must have input from session node.");
          }
        } else {
          orchUtils.logger.writeLogToFile(
            "info",
            "Restart Node can't have multiple inputs"
          );
          reject("Restart Node can't contain multiple inputs.");
        }
      } catch (e) {
        orchUtils.logger.writeLogToFile(
          "error",
          "Erro in Shell Handler catch " + e
        );
        reject(e);
      }
    });
  }
}
export default new ShellHandler();

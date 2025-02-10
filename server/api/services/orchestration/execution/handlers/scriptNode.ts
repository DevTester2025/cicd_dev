import {
  Orchestration,
  Node,
  OrchestrationConfigs,
  OrchestrationUtils,
  WinrmSessionParams,
  OrchestrationNodeHandlerResponse,
} from "../../types";

import Store from "../store";
import * as Flow from "../../flow";

import WinexeExecuteScript from "../platforms/winexe/executeScript";

export default function ScriptNodeHandler(
  node: Node,
  orchConfigs: OrchestrationConfigs,
  orchUtils: OrchestrationUtils,
  orchstore: Store
): Promise<OrchestrationNodeHandlerResponse> {
  return new Promise((resolve, reject) => {
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

      if (prevNodes && prevNodes.length == 1) {
        let prevNode = prevNodes[0];

        if (prevNode.name == "SessionNode") {
          let session = orchstore.getResponse(prevNode.params.id).payload;
          setTimeout(() => {
            reject("Timeout");
          }, (node.data.failedwaittime * 60 * 1000));
          WinexeExecuteScript(session, node, orchConfigs, orchUtils, orchstore)
            .then((complete) => {
              orchUtils.logger.writeLogToFile(
                "info",
                "Script execution completed from script handler"
              );
              orchUtils.logger.writeLogToFile("info", complete);
              resolve({
                continue: true,
                payload: complete,
              });
            })
            .catch((err) => {
              orchUtils.logger.writeLogToFile(
                "error",
                "Script execution failed"
              );
              orchUtils.logger.writeLogToFile("error", err);
              reject(err);
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
  });
}

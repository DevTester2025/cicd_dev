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
import { ChildProcess } from "child_process";

function restartInstance(
  session: any,
  node: Node,
  orchConfigs: OrchestrationConfigs,
  orchUtils: OrchestrationUtils,
  orchstore: Store
) {
  return new Promise((resolve, reject) => {
    let retried = 0;

    function retry() {
      orchUtils.logger.writeLogToFile("info", session);

      let execCmd =
        "powershell Write-Host 'Completed'; Start-Sleep -s 5; Restart-Computer -Force";

      orchUtils.logger.writeLogToFile(
        "info",
        "Restart Node started to execute"
      );
      orchUtils.logger.writeLogToFile("info", execCmd);

      let msg = "";

      let stream = session.run(
        execCmd,
        {
          timeout: 60000,
        },
        orchUtils.logger
      ) as ChildProcess;
      stream.stdout.on("data", (d) => {
        orchUtils.logger.writeLogToFile("info", "Data from restart node");
        orchUtils.logger.writeLogToFile("info", d);
        console.log("Data from restart node");
        console.log(d);
        msg += d + "\n";
        if (d.includes("Completed")) {
          stream.kill();
        }
      });
      stream.stderr.on("data", (d) => {
        orchUtils.logger.writeLogToFile(
          "info",
          "Data Error from winexe restart node execution"
        );
        orchUtils.logger.writeLogToFile("info", d);
        console.log("Data Error from winexe restart node execution");
        console.log(d);
      });
      stream.on("close", (d) => {
        if (msg.length <= 0 && retried < 6) {
          orchUtils.logger.writeLogToFile("info", `Retrying ${retried + 1}/6`);
          setTimeout(() => {
            retried += 1;
            retry();
          }, 15000);
        } else {
          orchUtils.logger.writeLogToFile("info", "Close from winexe");
          orchUtils.logger.writeLogToFile("info", d);
          console.log("Close from winexe");
          console.log(d);
          if (msg.length > 0) resolve(msg);
          else reject("Unable to execute restart node.");
        }
      });
    }

    retry();
  });
}

export default function RestartNodeHandler(
  node: Node,
  orchConfigs: OrchestrationConfigs,
  orchUtils: OrchestrationUtils,
  orchstore: Store
): Promise<OrchestrationNodeHandlerResponse> {
  return new Promise((resolve, reject) => {
    let prevNodes = Flow.GetPreviousNode(
      orchstore.getOrchestration(),
      node.params.id
    );

    if (prevNodes && prevNodes.length == 1) {
      let prevNode = prevNodes[0];

      orchUtils.logger.writeLogToFile("info", "Restart node inputs.");
      orchUtils.logger.writeLogToFile("info", prevNode);
      orchUtils.logger.writeLogToFile("info", "Current node.");
      orchUtils.logger.writeLogToFile("info", node);

      if (prevNode.name == "SessionNode") {
        let session = orchstore.getResponse(prevNode.params.id).payload;

        restartInstance(session, node, orchConfigs, orchUtils, orchstore)
          .then((restarted) => {
            resolve({
              continue: true,
            });
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        orchUtils.logger.writeLogToFile(
          "info",
          "Restart node must have input from session node"
        );
        orchUtils.logger.writeLogToFile(
          "info",
          "Previous node is ",
          prevNode.params.label
        );
        reject("Restart node must have input from session node.");
      }
    } else {
      orchUtils.logger.writeLogToFile(
        "info",
        "Restart node can't have multiple inputs"
      );
      reject("Restart node can't contain multiple inputs.");
    }
  });
}

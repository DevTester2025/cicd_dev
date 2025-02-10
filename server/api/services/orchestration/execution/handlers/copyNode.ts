import {
    Node,
    OrchestrationConfigs,
    OrchestrationUtils,
    OrchestrationNodeHandlerResponse,
  } from "../../types";
  
  import Store from "../store";
  import * as Flow from "../../flow";
    
  export default function CopyNodeHandler(
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
            console.log(session)
          } else {
            orchUtils.logger.writeLogToFile(
              "info",
              "Copy script node must have input from session node"
            );
            reject("Copy script node must have input from session node.");
          }
        } else {
          orchUtils.logger.writeLogToFile(
            "info",
            "Copy script node can't have multiple inputs"
          );
          reject("Copy script node can't contain multiple inputs.");
        }
      }
    });
  }
  
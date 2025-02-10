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
import { response } from "express";

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

      if (prevNode.name == "ActivityNode") {
        let responseFromPrevNode = orchstore.getResponse(prevNode.params.id)
          .payload as string | null;
        orchUtils.logger.writeLogToFile(
          "info",
          " Start of decision node execution "
        );

        // let nextNodes = Flow.GetNextNode(orchstore.getOrchestration(), node.params.id);
        if (responseFromPrevNode.includes("Completed")) {
          let nextNodes = Flow.GetNextNodebyPosition(
            orchstore.getOrchestration(),
            node.params.id,
            "top"
          );

          orchUtils.logger.writeLogToFile("info", " True nextnodes ");
          orchUtils.logger.writeLogToFile("info", nextNodes[0]);

          if (nextNodes && nextNodes.length > 0) {
            // FIXME: Conditional node can have multiple outputs,
            let nextNode = nextNodes[0];
            resolve({
              continue: true,
              payload: nextNode,
            });
          } else {
            reject("Conditional node is incomplete.");
          }
        } else {
          let nextNodes = Flow.GetNextNodebyPosition(
            orchstore.getOrchestration(),
            node.params.id,
            "bottom"
          );
          orchUtils.logger.writeLogToFile("info", " False nextnodes ");
          orchUtils.logger.writeLogToFile("info", nextNodes[0]);

          if (nextNodes && nextNodes.length > 0) {
            // FIXME: Conditional node can have multiple outputs,
            let nextNode = nextNodes[0];
            resolve({
              continue: true,
              payload: nextNode,
            });
          } else {
            reject("Conditional node is incomplete.");
          }
        }
      } else {
        orchUtils.logger.writeLogToFile(
          "info",
          "--------condition node must have input from script node--------"
        );
        reject("condition node must have input from script node.");
      }
    } else {
      orchUtils.logger.writeLogToFile(
        "info",
        "--------condition node can't have multiple inputs--------"
      );
      reject("condition node can't contain multiple inputs.");
    }
  });
}

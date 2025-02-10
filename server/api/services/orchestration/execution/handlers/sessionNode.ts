import {
  Orchestration,
  Node,
  OrchestrationConfigs,
  OrchestrationUtils,
  WinrmSessionParams,
  OrchestrationNodeHandlerResponse,
} from "../../types";

import getParams from "../../getParam";
import GetWinRMSession from "../platforms/winrm/getSession";
import GetWinExeSession from "../platforms/winexe/getSession";

import Store from "../store";

export default function SessionNodeHandler(
  node: Node,
  orchConfigs: OrchestrationConfigs,
  orchUtils: OrchestrationUtils,
  orchstore: Store
): Promise<OrchestrationNodeHandlerResponse> {
  return new Promise(async (resolve, reject) => {
    switch (node.params.data["Type"]) {
      case "Winrm":
        GetWinRMSession(
          node.params.data["userid"],
          node.params.data["password"],
          orchConfigs.sys_ip,
          node.params.data["retries"]
            ? parseInt(node.params.data["retries"])
            : 3,
          node.params.data["waittime"]
            ? parseInt(node.params.data["waittime"])
            : 15000,
          orchUtils.logger
        )
          .then((session) => {
            resolve({
              continue: true,
              payload: session,
            });
          })
          .catch((err) => {
            reject(err);
          });
        break;
      case "PAExec":
        orchUtils.logger.writeLogToFile(
          "info",
          "IP to connect to ",
          node &&
            node.data &&
            node.data["ipaddress"].includes("{{") &&
            node.data["ipaddress"].includes("}}")
            ? getParams(
                orchConfigs,
                node.data["ipaddress"].replace("{{", "").replace("}}", "")
              )
            : node.data["ipaddress"]
        );
        let session = new GetWinExeSession(
          node.data["userid"],
          node.data["password"],
          node &&
          node.data &&
          node.data["ipaddress"].includes("{{") &&
          node.data["ipaddress"].includes("}}")
            ? getParams(
                orchConfigs,
                node.data["ipaddress"].replace("{{", "").replace("}}", "")
              )
            : node.data["ipaddress"],
          true
        );
        resolve({
          continue: true,
          payload: session,
        });
        break;
      default:
        break;
    }
  });
}

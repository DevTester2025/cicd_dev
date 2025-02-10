import AppLogger from "../../../../../../lib/logger";
const winrm = require("nodejs-winrm");

import { WinrmSessionParams } from "../../../types";

export default function createShell(
  name: string,
  pwd: string,
  host: string,
  retries: number = 6,
  waittime: number = 3000,
  appLogger: AppLogger
): Promise<WinrmSessionParams | string> {
  return new Promise(async (resolve, reject) => {
    let retired = 0;

    async function getSession() {
      const _userName = name;
      const _password = pwd;
      const _host = host;
      const _port = 5985;

      const _auth =
        "Basic " +
        Buffer.from(_userName + ":" + _password, "utf8").toString("base64");
      const _params: WinrmSessionParams = {
        host: _host,
        port: _port,
        path: "/wsman",
        auth: _auth,
      };

      appLogger.writeLogToFile("info", "Trying to obtain winrm session");

      try {
        const shellId = await winrm.shell.doCreateShell(_params);
        _params.shellId = shellId;
        resolve(_params);
      } catch (e) {
        appLogger.writeLogToFile("error", "Error obtaining winrm session.");
        if (retired >= retries) {
          reject(e);
        } else {
          appLogger.writeLogToFile(
            "error",
            "Retrying to get session. Retries: " + (retired + 1) + `/${retries}`
          );
          retired += 1;
          setTimeout(() => {
            getSession();
          }, waittime);
        }
      }
    }

    getSession();
  });
}

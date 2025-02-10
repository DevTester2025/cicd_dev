const winrm = require("nodejs-winrm");
import doExecuteCommand from "./execute";

import { IWinRMParams } from "../interface";
import WriteLog from "../../../common/chalk";
import AppLogger from "../../logger";

export default async function copyScript(
  appLogger: AppLogger,
  params: IWinRMParams,
  scriptPath: string,
  copyLocation: string,
  execute?: boolean,
  args?: string[]
): Promise<any> {
  return new Promise((resolve, reject) => {
    const cmd =
      "Invoke-WebRequest -uri " + scriptPath + " -OutFile " + copyLocation;

    function executeScript() {
      try {
        const executeCmd =
          copyLocation + " " + (args && args.length > 0 ? args.join(" ") : " ");
        appLogger.writeLogToFile(
          "info",
          `Starting file execution from ${copyLocation}.`
        );
        doExecuteCommand(params, executeCmd, "ps")
          .then((executed) => {
            appLogger.writeLogToFile("info", `File execution completed.`);
            resolve(executed);
          })
          .catch((err) => {
            appLogger.writeLogToFile(
              "error",
              `Error in executing file ${scriptPath}.`
            );
            appLogger.writeLogToFile("error", err);
            reject(err);
          });
      } catch (e) {
        appLogger.writeLogToFile(
          "error",
          `Error in executing file ${copyLocation}.`
        );
        appLogger.writeLogToFile("error", e);
        reject(`Error in executing file ${copyLocation}.`);
      }
    }

    function copyScriptToServer() {
      try {
        appLogger.writeLogToFile(
          "info",
          `Starting to copy file from ${scriptPath} command.`
        );

        doExecuteCommand(params, cmd, "ps")
          .then((copied) => {
            appLogger.writeLogToFile("info", `File copied to ${copyLocation}.`);
            appLogger.writeLogToFile("info", copied);
            if (execute) {
              executeScript();
            }
          })
          .catch((err) => {
            appLogger.writeLogToFile(
              "error",
              `Error in copying file from ${scriptPath} to ${copyLocation}.`
            );
            appLogger.writeLogToFile("error", err);
            reject(err);
          });
      } catch (e) {
        appLogger.writeLogToFile(
          "error",
          `Error in copying file from ${scriptPath} to ${copyLocation}.`
        );
        appLogger.writeLogToFile("error", e);
        reject(`Error in copying file from ${scriptPath} to ${copyLocation}.`);
      }
    }

    copyScriptToServer();
  });
}

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
) {
  const cmd =
    "Invoke-WebRequest -Uri " + scriptPath + " -OutFile " + copyLocation;

  async function executeScript() {
    try {
      let executeCmd =
        "-ExecutionPolicy Bypass -File " +
        copyLocation +
        " " +
        (args && args.length > 0
          ? args
              .filter((s) => s != null && s != undefined && s && s.length > 0)
              .join(" ")
          : " ");
      appLogger.writeLogToFile(
        "info",
        `Starting file execution from ${copyLocation}.`
      );
      let copied = await doExecuteCommand(appLogger, params, executeCmd, "ps");
      appLogger.writeLogToFile(
        "info",
        `File execution complete of ${copyLocation}.`
      );
      appLogger.writeLogToFile("info", copied);

      return copied;
    } catch (e) {
      appLogger.writeLogToFile(
        "error",
        `Error in executing file ${copyLocation}.`
      );
      appLogger.writeLogToFile("error", e);
      return { status: false, message: e };
    }
  }

  async function copyScriptToServer() {
    try {
      appLogger.writeLogToFile(
        "info",
        `Starting to copy file from ${scriptPath} command.`
      );

      await doExecuteCommand(appLogger, params, cmd, "ps")
        .then(async (copied) => {
          if (execute) {
            appLogger.writeLogToFile("info", "File will start execution in 9s");
            setTimeout(async () => {
              return await executeScript();
            }, 9000);
          } else {
            return copied;
          }
        })
        .catch((err) => {
          appLogger.writeLogToFile(
            "error",
            `Error in copying file ${copyLocation}.`
          );
          appLogger.writeLogToFile("error", err);
          return { status: false, message: err };
        });
    } catch (e) {
      appLogger.writeLogToFile(
        "error",
        `Error in copying file from ${scriptPath} to ${copyLocation}.`
      );
      appLogger.writeLogToFile("error", e);
      return { status: false, message: e };
    }
  }

  return await copyScriptToServer();
}

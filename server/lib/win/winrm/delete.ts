const winrm = require("nodejs-winrm");
import { IWinRMParams } from "../interface";
import AppLogger from "../../logger";

export default async function createShell(
  params: IWinRMParams,
  appLogger: AppLogger
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      appLogger.writeLogToFile("info", "Winrm session to close:::::::::::::::");
      let closed = await winrm.shell.doDeleteShell(params);
      appLogger.writeLogToFile("info", "Closing winrm session:::::::::::::::");
      resolve(closed);
    } catch (error) {
      appLogger.writeLogToFile(
        "info",
        "Error Closing winrm session:::::::::::::::"
      );
      appLogger.writeLogToFile("info", error);
      reject(error);
    }
  });
}

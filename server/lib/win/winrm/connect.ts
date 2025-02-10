const winrm = require("nodejs-winrm");
import WriteLog from "../../../common/chalk";
import { IWinRMParams } from "../interface";
import AppLogger from "../../logger";

export default async function createShell(
  name: string,
  pwd: string,
  host: string,
  appLogger: AppLogger
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    const _userName = name;
    const _password = pwd;
    const _host = host;
    const _port = 5985;

    const _auth =
      "Basic " +
      Buffer.from(_userName + ":" + _password, "utf8").toString("base64");
    const _params: IWinRMParams = {
      host: _host,
      port: _port,
      path: "/wsman",
      auth: _auth,
    };

    appLogger.writeLogToFile("info", "Trying to get session");

    try {
      const shellId = await winrm.shell.doCreateShell(_params);
      _params.shellId = shellId;
      resolve(_params);
    } catch (e) {
      appLogger.writeLogToFile("error", "Error obtaining session");
      // WriteLog.error(e);
      reject("Error obtaining session");
    }
  });
}

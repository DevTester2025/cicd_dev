const winrm = require("nodejs-winrm");
import { IWinRMParams } from "../interface";
import WriteLog from "../../../common/chalk";

export default async function executCommand(
  params: IWinRMParams,
  command: string,
  type: "ps" | "cmd"
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      WriteLog.info(`Starting to execute ${type} command.`);
      WriteLog.info(`Executing command ${command}`);
      params.command = type === "ps" ? "powershell ".concat(command) : command;
      const commandId = await winrm.command.doExecuteCommand(params);
      params.commandId = commandId;
      resolve(winrm.command.doReceiveOutput(params));
    } catch (e) {
      WriteLog.error(`Error in ${type} executeion.`);
      WriteLog.error(e);
      reject(`Error in ${type} executeion.`);
    }
  });
}

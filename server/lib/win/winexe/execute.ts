import WriteLog from "../../../common/chalk";
import AppLogger from "../../logger";

export default async function executCommand(
  appLogger: AppLogger,
  params: any,
  command: string,
  type: "ps" | "cmd"
): Promise<any> {
  try {
    // WriteLog.info(`Starting to execute ${type} command.`)
    // WriteLog.info(`Executing command ${command}`)
    return new Promise((resolve, reject) => {
      command = type === "ps" ? "powershell ".concat(command) : command;
      params.run(command, (err: any, output: any, stderr: any) => {
        if (err || stderr) {
          // WriteLog.info('-------stderr-----');
          reject(err || stderr);
          WriteLog.error(err, stderr);
        } else {
          // WriteLog.info('-------output-----');
          resolve(output);
        }
      });
    });
  } catch (e) {
    WriteLog.error(`Error in ${type} executeion.`);
    WriteLog.error(e);
    throw e;
  }
}

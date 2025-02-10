import AppLogger from "../../logger";

const WinExe = require("winexe");

export default async function executCommand(
  userName: string,
  passWord: string,
  hostIp: string,
  appLogger: AppLogger
): Promise<any> {
  return new Promise((resolve, reject) => {
    // appLogger.writeLogToFile('info', "**************************");
    // appLogger.writeLogToFile('info', userName, passWord, hostIp);
    // appLogger.writeLogToFile('info', "**************************");
    const winexe = new WinExe({
      username: userName,
      password: passWord,
      host: hostIp,
      elevated: true,
      timeout: 60000,
    });
    // appLogger.writeLogToFile('info', "WINEXE OBJECT::::::::::::::::::::");
    // appLogger.writeLogToFile('info', winexe);
    resolve(winexe);
  });
}

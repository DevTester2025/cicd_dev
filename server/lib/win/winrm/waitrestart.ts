const winrm = require("nodejs-winrm");
import getSession from "./connect";

import AppLogger from "../../logger";

export default async function waitForRestart(
  name: string,
  pwd: string,
  host: string,
  waitdurationinms: number,
  retries: number,
  appLogger: AppLogger
): Promise<any> {
  return new Promise((resolve, reject) => {
    let i = 0;
    function tryConnection() {
      try {
        getSession(name, pwd, host, appLogger)
          .then((params) => {
            appLogger.writeLogToFile("info", `Connected to remote system`);
            resolve(params);
          })
          .catch((err) => {
            appLogger.writeLogToFile(
              "info",
              `Re-connecting to server ${i}`,
              err
            );
            setTimeout(() => {
              i += 1;
              if (i > retries) {
                reject(`Unable to connect to server after ${i} retries`);
              } else {
                appLogger.writeLogToFile(
                  "info",
                  `Re-connecting to server ${i}`
                );
                tryConnection();
              }
            }, waitdurationinms);
          });
      } catch (e) {
        appLogger.writeLogToFile("info", `Re-connecting to server ${i}`, e);
        setTimeout(() => {
          i += 1;
          if (i > retries) {
            reject(`Unable to connect to server after ${i} retries`);
          } else {
            appLogger.writeLogToFile("info", `Re-connecting to server ${i}`);
            tryConnection();
          }
        }, waitdurationinms);
      }
    }
    tryConnection();
  });
}

import getSession from "./connect";
import AppLogger from "../../logger";
import execute from "../winexe/execute";

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
      appLogger.writeLogToFile(
        "info",
        `Trying to connect remote system ${i} time`
      );
      getSession(name, pwd, host, appLogger)
        .then((params) => {
          execute(appLogger, params, "get-date", "ps")
            .then((p) => {
              resolve(params);
            })
            .catch((err) => {
              setTimeout(() => {
                i += 1;
                if (i > retries) {
                  reject(`Unable to connect to server after ${i} retries`);
                } else {
                  appLogger.writeLogToFile(
                    "info",
                    `Re-connecting to server ${i}`
                  );
                  console.log(err);
                  tryConnection();
                }
              }, waitdurationinms);
            });
        })
        .catch((err) => {
          setTimeout(() => {
            i += 1;
            if (i > retries) {
              reject(`Unable to connect to server after ${i} retries`);
            } else {
              appLogger.writeLogToFile("info", `Re-connecting to server ${i}`);
              console.log("********************", err);
              tryConnection();
            }
          }, waitdurationinms);
        });
    }
    tryConnection();
  });
}

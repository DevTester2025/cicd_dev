import getSession from "./connect";
import CopyScript from "./copy";

import deleteShell from "./delete";
import AppLogger from "../../logger";
import { reject } from "bluebird";

export default function waitForRestart(
  appLogger: AppLogger,
  name: string,
  pwd: string,
  host: string,
  client: string,
  waitdurationinms: number,
  retries: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    let i = 0;
    function tryConnection() {
      getSession(name, pwd, host, appLogger)
        .then((params) => {
          CopyScript(
            appLogger,
            params,
            "http://" +
              client +
              "/deployment_scripts/tms/3_check_dotnet_version.ps1",
            "C:/3_check_dotnet_version.ps1",
            true,
            []
          )
            .then((result) => {
              appLogger.writeLogToFile("info", result);
              const n = result.includes("4.8");
              appLogger.writeLogToFile("info", n);
              if (n) {
                deleteShell(params, appLogger)
                  .then((deleted) => {
                    resolve(true);
                  })
                  .catch((err) => {
                    reject(err);
                  });
              } else if (i !== retries) {
                setTimeout(() => {
                  appLogger.writeLogToFile(
                    "info",
                    `Re-connecting to server ${i}`
                  );
                  i += 1;
                  tryConnection();
                }, waitdurationinms);
              }
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
              tryConnection();
            }
          }, waitdurationinms);
        });
    }
    tryConnection();
  });
}

import { Node, OrchestrationConfigs, OrchestrationUtils } from "../../../types";
import { constants } from "../../../../../../common/constants";
import Store from "../../store";
import { ChildProcess, exec } from "child_process";
import WinExeSession from "./getSession";

function closeUMC(orchUtils: OrchestrationUtils) {
  return new Promise((resolve, reject) => {
    try {
      exec("net use * /delete /Y", (error, stdout, stderr) => {
        if (error) {
          resolve(error);
        }
        if (stderr) {
          resolve(stderr);
        }
        if (stdout) {
          resolve(stdout);
        }
      });
    } catch (error) {
      resolve(error);
    }
  });
}

function copyScript(
  session: WinExeSession,
  node: Node,
  orchConfigs: OrchestrationConfigs,
  orchUtils: OrchestrationUtils,
  orchstore: Store
): Promise<string> {
  return new Promise((resolve, reject) => {
    let retried = 0;
    let totalRetries;
    let waitTime;

    let canRetry =
      node.data && node.data["retries"] && node.data["retries"].length > 0
        ? true
        : false;
    totalRetries = canRetry ? parseInt(node.data["retries"]) : null;
    waitTime = canRetry ? parseInt(node.data["waittime"]) * 1000 : 60000;

    function retry() {
      orchUtils.logger.writeLogToFile("info", session);
      let encryptedfile = Buffer.from(node.data["filename"]).toString("base64");
      let scriptpath =
        process.env.ORCH_URL +
        "/cloudmatiq/aws/common/downloadfile/" +
        `${encryptedfile}`;
      const copyLocation = "C:/" + node.data["filename"];
      const cpCmd =
        "Invoke-WebRequest -Uri " +
        scriptpath +
        " -OutFile " +
        copyLocation +
        "; Write-Host 'Completed'";
      const copyCmd =
        node.data["scripttype"] == "PS1" ? "powershell ".concat(cpCmd) : cpCmd;

      orchUtils.logger.writeLogToFile("info", "Script started to copy");
      orchUtils.logger.writeLogToFile("info", copyCmd);

      let msg = "";

      // session.run(copyCmd, {
      //     timeout: waitTime
      // }, orchUtils.logger, (err, stdout, stderr) => {
      //     if (err) {
      //         orchUtils.logger.writeLogToFile("error", "Error copying script.");
      //         orchUtils.logger.writeLogToFile("error", err);
      //         reject("Unable to copy script.");
      //     }
      //     if (stderr) {
      //         orchUtils.logger.writeLogToFile("error", "stderr : Error running command.");
      //         orchUtils.logger.writeLogToFile("error", stderr);
      //     }
      //     if (stdout) {
      //         if (stdout.includes("Retry")) {
      //             retry();
      //             return;
      //         }
      //         if (canRetry && stdout.length <= 0 && retried < totalRetries) {
      //             orchUtils.logger.writeLogToFile("info", `Retrying ${retried + 1}/${totalRetries} wait time ${waitTime}s`);
      //             setTimeout(() => {
      //                 retried += 1;
      //                 retry();
      //             }, waitTime);
      //         } else {
      //             orchUtils.logger.writeLogToFile("info", "Close from winexe");
      //             orchUtils.logger.writeLogToFile("info", stdout);
      //             if (stdout.length > 0) resolve(stdout);
      //             else reject("Unable to copy script.");
      //         }
      //     }
      // });
      let stream = session.run(
        copyCmd,
        {
          timeout: waitTime,
        },
        orchUtils.logger
      );
      stream.stdout.on("data", (d: string) => {
        orchUtils.logger.writeLogToFile("info", "Data from winexe");
        orchUtils.logger.writeLogToFile("info", d);
        msg += d + "\n";
        if (d.includes("Completed")) {
          stream.kill();
        }
      });
      stream.stderr.on("data", (d) => {
        orchUtils.logger.writeLogToFile(
          "info",
          "Data Error from winexe copying scripts"
        );
        orchUtils.logger.writeLogToFile("info", d);
      });
      stream.on("close", (d) => {
        orchUtils.logger.writeLogToFile("info", "Close from winexe");
        orchUtils.logger.writeLogToFile("info", d);
        orchUtils.logger.writeLogToFile("info", msg);
        try {
          process.kill(stream.pid, "SIGKILL");
        } catch (e) {
          orchUtils.logger.writeLogToFile(
            "info",
            "Error killing process :::",
            stream.pid
          );
        }
        if (canRetry && msg.length <= 0 && retried < totalRetries) {
          orchUtils.logger.writeLogToFile(
            "info",
            `Retrying ${retried + 1}/${totalRetries} wait time ${waitTime}s`
          );
          setTimeout(() => {
            retried += 1;
            retry();
          }, waitTime);
        } else {
          closeUMC(orchUtils)
            .then((closed) => {
              if (closed) {
                orchUtils.logger.writeLogToFile(
                  "error",
                  `Error closing UMC services.`
                );
                orchUtils.logger.writeLogToFile("error", closed);
              }
              if (msg.length > 0) resolve(msg);
              else reject("Unable to copy script.");
            })
            .catch((err) => {
              if (msg.length > 0) resolve(msg);
              else reject("Unable to copy script.");
            });
        }
      });
    }

    retry();
  });
}

function execScript(
  session: WinExeSession,
  node: Node,
  orchConfigs: OrchestrationConfigs,
  orchUtils: OrchestrationUtils,
  orchstore: Store
): Promise<string> {
  return new Promise((resolve, reject) => {
    let retried = 0;
    let totalRetries;
    let waitTime;

    let canRetry =
      node.data && node.data["retries"] && node.data["retries"].length > 0
        ? true
        : false;
    totalRetries = canRetry ? parseInt(node.data["retries"]) : null;
    waitTime = canRetry ? parseInt(node.data["waittime"]) * 1000 : 60000;

    function retry() {
      orchUtils.logger.writeLogToFile("info", "COPY file started");
      orchUtils.logger.writeLogToFile("info", session);

      const copyLocation = "C:/" + node.data["filename"];
      let execCmd = copyLocation + " ";

      // Check for additional params and it's values.
      let params: { key: string; value: string }[] = node.data["Params"];
      let paramArgs = [];
      if (params && params.length > 0) {
        orchUtils.logger.writeLogToFile(
          "info",
          "Trying to parse and pass the parameters >>>>>"
        );
        orchUtils.logger.writeLogToFile("info", JSON.stringify(params));
        orchUtils.logger.writeLogToFile("info", JSON.stringify(orchConfigs));
        params.forEach((arg) => {
          let lookupKey = arg.value.replace("{{", "").replace("}}", "");
          if (orchConfigs[lookupKey]) {
            paramArgs.push(`-${arg["key"]}`);
            paramArgs.push(`'${orchConfigs[lookupKey].trim()}'`);
          }
        });
      }

      execCmd += paramArgs.join(" ");

      let copyCmd =
        node.data["scripttype"] == "PS1"
          ? `powershell C:/WINDOWS/sysnative/WindowsPowerShell/v1.0/powershell.exe -command \"Set-ExecutionPolicy Bypass;`
            .concat(execCmd)
            .concat(`\"`)
          : execCmd;

      if (process.platform == "linux" && node.data["scripttype"] == "PS1") {
        copyCmd = `powershell `.concat(execCmd).concat(`\"`);
      }

      orchUtils.logger.writeLogToFile("info", "Script started to execute");
      orchUtils.logger.writeLogToFile("info", copyCmd);

      let msg = "";
      let status = true;

      // session.run(copyCmd, {
      //     timeout: waitTime
      // }, orchUtils.logger, (err, stdout, stderr) => {
      //     if (err) {
      //         orchUtils.logger.writeLogToFile("error", "Error executing script.");
      //         orchUtils.logger.writeLogToFile("error", err);
      //         reject("Unable to execute script.");
      //     }
      //     if (stderr) {
      //         orchUtils.logger.writeLogToFile("error", "stderr : Error running command.");
      //         orchUtils.logger.writeLogToFile("error", stderr);
      //     }
      //     if (stdout) {
      //         if (stdout.includes("Retry")) {
      //             retry();
      //             return;
      //         }
      //         if (canRetry && stdout.length <= 0 && retried < totalRetries) {
      //             orchUtils.logger.writeLogToFile("info", `Retrying ${retried + 1}/${totalRetries} wait time ${waitTime}s`);
      //             setTimeout(() => {
      //                 retried += 1;
      //                 retry();
      //             }, waitTime);
      //         } else {
      //             orchUtils.logger.writeLogToFile("info", "Close from winexe");
      //             orchUtils.logger.writeLogToFile("info", stdout);
      //             if (stdout.length > 0) resolve(stdout);
      //             else reject("Unable to execute script.");
      //         }
      //     }
      // });

      let stream = session.run(
        copyCmd,
        {
          timeout: waitTime,
        },
        orchUtils.logger
      ) as ChildProcess;

      let removeCmd =
        node.data["scripttype"] == "PS1"
          ? `powershell del ${copyLocation}`
          : execCmd;

      orchUtils.logger.writeLogToFile("info", "Location of File");
      orchUtils.logger.writeLogToFile("info", copyLocation);
      stream.stdout.on("data", (d) => {
        orchUtils.logger.writeLogToFile(
          "info",
          "Data from winexe script execution"
        );
        orchUtils.logger.writeLogToFile("info", d);
        msg += d + "\n";
        // Failed for decision node.
        if (d.includes("Retry")) {
          msg = "";
          stream.kill();
        }
        if (d.includes("Completed") || d.includes("Failed")) {
          status = d.includes("Failed") ? false : true;
          let rm = session.run(
            removeCmd,
            {
              timeout: waitTime,
            },
            orchUtils.logger
          ) as ChildProcess;
          rm.stdout.on("data", (d) => {
            orchUtils.logger.writeLogToFile(
              "info",
              "File removed successfully"
            );
            orchUtils.logger.writeLogToFile("info", d);
            rm.kill();
          });
          rm.stderr.on("data", (d) => {
            orchUtils.logger.writeLogToFile(
              "info",
              "Error in removing the script file"
            );
            orchUtils.logger.writeLogToFile("info", d);
            rm.kill();
          });
          stream.kill();
        }
      });
      stream.stderr.on("data", (d) => {
        orchUtils.logger.writeLogToFile(
          "info",
          "Data Error from winexe script execution"
        );
        orchUtils.logger.writeLogToFile("info", d);
      });
      stream.on("close", (d) => {
        try {
          closeUMC(orchUtils);
          process.kill(stream.pid, "SIGKILL");
        } catch (e) {
          orchUtils.logger.writeLogToFile(
            "info",
            "Error killing process :::",
            stream.pid
          );
        }
        orchUtils.logger.writeLogToFile(
          "info",
          `Canretry : ${canRetry}, Message length : ${msg.length}, Retried ${retried} retries ${totalRetries}`
        );
        if (canRetry && msg.length <= 0 && retried < totalRetries) {
          orchUtils.logger.writeLogToFile(
            "info",
            `Retrying ${retried + 1}/${totalRetries} wait time : ${waitTime / 1000
            }s`
          );
          setTimeout(() => {
            retried += 1;
            retry();
          }, waitTime);
        } else {
          orchUtils.logger.writeLogToFile("info", "Close from winexe");
          orchUtils.logger.writeLogToFile("info", d);
          closeUMC(orchUtils)
            .then((closed) => {
              // if (closed) {
              //   orchUtils.logger.writeLogToFile(
              //     "error",
              //     `Error closing UMC services.`
              //   );
              //   orchUtils.logger.writeLogToFile("error", closed);
              // }
              if (msg.length > 0 && status) resolve(msg)
              else if (msg.length > 0 && !status) reject(msg)
              else reject("Unable to execute script.");
            })
            .catch((err) => {
              if (msg.length > 0 && status) resolve(msg)
              else if (msg.length > 0 && !status) reject(msg)
              else reject("Unable to execute script.");
            });
        }
      });
    }

    retry();
  });
}

export default function executeScript(
  session: any,
  node: Node,
  orchConfigs: OrchestrationConfigs,
  orchUtils: OrchestrationUtils,
  orchstore: Store
): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("Start execute script>>>>>>>>>>>");
    copyScript(session, node, orchConfigs, orchUtils, orchstore)
      .then((data) => {
        execScript(session, node, orchConfigs, orchUtils, orchstore)
          .then((data) => {
            resolve(data);
          })
          .catch((err) => {
            reject(err);
          });
      })
      .catch((err) => {
        reject(err);
      });
  });
}

import * as winRm from "../../../../lib/win/winrm";
import * as winexe from "../../../../lib/win/winexe";

import WriteLog from "../../../../common/chalk";
import { IWinRMParams } from "../../../../lib/win/interface";
import { constants } from "../../../../common/constants";
import AppLogger from "../../../../lib/logger";
import commonService from "../../common.service";
import db from "../../../models/model";

export class ScriptService {
  executeScript(deploymentid: string, data, appLogger: AppLogger) {
    appLogger.writeLogToFile("info", data);
    appLogger.writeLogToFile(
      "info",
      "TRYING TO ESTABLISH WINRM CONNECTION:::::::"
    );

    function updateDeploymentStatus(updated: boolean) {
      let condition = { ecl2deploymentid: deploymentid };
      commonService
        .update(
          condition,
          {
            status: updated ? "Deployed" : "Failed",
            lastupdateddt: new Date(),
          },
          db.ecl2deployments
        )
        .then((data: any) => {
          appLogger.writeLogToFile(
            "info",
            "------------------------------------------------"
          );
          appLogger.writeLogToFile(
            "info",
            `DeploymentID ${deploymentid} status deployed.`
          );
          appLogger.writeLogToFile(
            "info",
            "------------------------------------------------"
          );
        })
        .catch((error: Error) => {
          appLogger.writeLogToFile(
            "error",
            "------------------------------------------------"
          );
          appLogger.writeLogToFile(
            "error",
            "Unable to update deployment status"
          );
        });
    }

    try {
      winRm
        .WaitforConnection(
          data.username,
          data.password,
          data.host,
          20000,
          17,
          appLogger
        )
        .then((credentials) => {
          appLogger.writeLogToFile("info", "System back online before restart");
          winRm
            .ExecuteCommand(credentials, "Restart-Computer -Force", "ps")
            .then((restart1) => {
              setTimeout(() => {
                appLogger.writeLogToFile("info", "System restart  completed");
                winRm
                  .WaitforConnection(
                    data.username,
                    data.password,
                    data.host,
                    20000,
                    17,
                    appLogger
                  )
                  .then((one_credentials) => {
                    appLogger.writeLogToFile(
                      "info",
                      "System back online. Trying to copy first script."
                    );
                    winRm
                      .CopyScript(
                        appLogger,
                        one_credentials,
                        "http://" +
                          data.clientpath +
                          "/deployment_scripts/tms/1_pre_install.ps1",
                        "C:/1_pre_install.ps1",
                        true,
                        data["1_pre_install.ps1"].scriptparams
                      )
                      .then((output) => {
                        appLogger.writeLogToFile(
                          "info",
                          "Waiting for system restart."
                        );
                        setTimeout(() => {
                          winRm
                            .WaitforConnection(
                              data.username,
                              data.password,
                              data.host,
                              9000,
                              25,
                              appLogger
                            )
                            .then((two_credentials) => {
                              appLogger.writeLogToFile(
                                "info",
                                "System back online. Trying to copy second script."
                              );
                              data["2_install_dotnet.ps1"].scriptparams.push(
                                "http://" +
                                  data.clientpath +
                                  "/deployment_scripts/common/dotnetfile.exe"
                              );
                              winRm
                                .CopyScript(
                                  appLogger,
                                  two_credentials,
                                  "http://" +
                                    data.clientpath +
                                    "/deployment_scripts/tms/2_install_dotnet.ps1",
                                  "C:/2_install_dotnet.ps1",
                                  true,
                                  data["2_install_dotnet.ps1"].scriptparams
                                )
                                .then((o2) => {
                                  setTimeout(() => {
                                    winRm
                                      .checkversion(
                                        appLogger,
                                        data.username,
                                        data.password,
                                        data.host,
                                        data.clientpath,
                                        30000,
                                        30
                                      )
                                      .then((stat) => {
                                        // winRm.ExecuteCommand(two_credentials, "Restart-Computer -Force", "ps").then(d => {
                                        appLogger.writeLogToFile(
                                          "info",
                                          "Waiting for computer to clean session::::::::::::"
                                        );
                                        // setTimeout(() => {
                                        winexe
                                          .WaitforConnection(
                                            data.domainusername,
                                            data.domainpassword,
                                            data.sharedHost,
                                            5000,
                                            17,
                                            appLogger
                                          )
                                          .then((win_param) => {
                                            appLogger.writeLogToFile(
                                              "info",
                                              "connection established " +
                                                win_param +
                                                appLogger
                                            );
                                            // winexe.ExecuteCommand(appLogger, win_param, "icacls 'C:\\' /grant Users:F; icacls 'W:\\' /grant Users:F;", 'ps').then(response => {
                                            //     console.log('info', 'Disk permissions provided ' + response);
                                            //     winexe.ExecuteCommand(appLogger, win_param, "get-executionpolicy", 'ps').then(response => {
                                            //         appLogger.writeLogToFile('info', 'Copied execution policy');
                                            //         setTimeout(() => {
                                            winexe
                                              .CopyScript(
                                                appLogger,
                                                win_param,
                                                "http://" +
                                                  data.clientpath +
                                                  "/deployment_scripts/tms/4_install_tms.ps1",
                                                "C:/4_install_tms.ps1",
                                                true,
                                                data["4_install_tms.ps1"]
                                                  .scriptparams
                                              )
                                              .then((o3) => {
                                                appLogger.writeLogToFile(
                                                  "info",
                                                  "TMS Installation complete. Validation will start in 60s. "
                                                );

                                                var retries = 0;

                                                async function validateInstallation() {
                                                  ++retries;

                                                  appLogger.writeLogToFile(
                                                    "info",
                                                    `Validating installation for ${retries} time`
                                                  );

                                                  const cmd =
                                                    "powershell Invoke-WebRequest -Uri " +
                                                    ("http://" +
                                                      data.clientpath +
                                                      "/deployment_scripts/tms/5_verify_installations.ps1") +
                                                    " -OutFile " +
                                                    "C:/5_verify_installations.ps1";
                                                  win_param.run(
                                                    cmd,
                                                    (
                                                      err: any,
                                                      output: any,
                                                      stderr: any
                                                    ) => {
                                                      appLogger.writeLogToFile(
                                                        `info`,
                                                        `Execution for command ${cmd}`
                                                      );
                                                      appLogger.writeLogToFile(
                                                        output
                                                      );
                                                      win_param.run(
                                                        "powershell -ExecutionPolicy Bypass -File " +
                                                          "C:/5_verify_installations.ps1",
                                                        (
                                                          err: any,
                                                          output: any,
                                                          stderr: any
                                                        ) => {
                                                          appLogger.writeLogToFile(
                                                            `info`,
                                                            `Execution for command installations`
                                                          );
                                                          appLogger.writeLogToFile(
                                                            output
                                                          );
                                                          if (
                                                            typeof output ==
                                                              "string" &&
                                                            output.includes(
                                                              "true"
                                                            )
                                                          ) {
                                                            updateDeploymentStatus(
                                                              true
                                                            );
                                                            setTimeout(() => {
                                                              winexe
                                                                .CopyScript(
                                                                  appLogger,
                                                                  win_param,
                                                                  "http://" +
                                                                    data.clientpath +
                                                                    "/deployment_scripts/tms/6_http_config.ps1",
                                                                  "C:/6_http_config.ps1",
                                                                  false,
                                                                  []
                                                                )
                                                                .then(
                                                                  (o3: any) => {
                                                                    winexe
                                                                      .ExecuteCommand(
                                                                        appLogger,
                                                                        win_param,
                                                                        "C:\\WINDOWS\\sysnative\\WindowsPowerShell\\v1.0\\powershell.exe -command 'Set-ExecutionPolicy Bypass;C:/6_http_config.ps1'",
                                                                        "ps"
                                                                      )
                                                                      .then(
                                                                        (
                                                                          out
                                                                        ) => {
                                                                          // winexe.CopyScript(appLogger, win_param, ("http://" + data.clientpath + "/deployment_scripts/tms/7_InstallAdd.ps1"), 'C:/7_InstallAdd.ps1', true, []).then((o4: any) => {
                                                                          //     winexe.CopyScript(appLogger, win_param, ("http://" + data.clientpath + "/deployment_scripts/tms/8_windowsupdates.ps1"), 'C:/8_windowsupdates.ps1', true, []).then((o5: any) => {
                                                                          console.log(
                                                                            o3,
                                                                            out
                                                                          );
                                                                          //     });
                                                                          // });
                                                                        }
                                                                      );
                                                                  }
                                                                );
                                                            }, 120000);
                                                          } else {
                                                            if (retries < 120) {
                                                              setTimeout(() => {
                                                                validateInstallation();
                                                              }, 60000);
                                                            } else {
                                                              updateDeploymentStatus(
                                                                false
                                                              );
                                                            }
                                                          }
                                                        }
                                                      );
                                                    }
                                                  );

                                                  // appLogger.writeLogToFile('info', `Validating installation for ${retries} time`)
                                                  // let response = await winexe.CopyScript(appLogger, win_param, ("http://" + data.clientpath + "/deployment_scripts/tms/5_verify_installations.ps1"), 'C:/5_verify_installations.ps1', true, []) as any;
                                                  // appLogger.writeLogToFile('info', "TMS Installation Checking complete.")
                                                  // appLogger.writeLogToFile('info', response)
                                                  // if ((typeof response == 'string' ? response.toString().includes("true") : false) == true) {
                                                  //     updateDeploymentStatus(true);
                                                  // } else {
                                                  // if (retries < 60) {
                                                  //     setTimeout(() => {
                                                  //         validateInstallation();
                                                  //     }, 60000);
                                                  // } else {
                                                  //     updateDeploymentStatus(false);
                                                  // }
                                                  // }
                                                }

                                                setTimeout(() => {
                                                  validateInstallation();
                                                }, 60000);
                                              })
                                              .catch((err) => {
                                                appLogger.writeLogToFile(
                                                  "info",
                                                  "TMS Installation execution failed"
                                                );
                                                appLogger.writeLogToFile(
                                                  "error",
                                                  err
                                                );
                                              });
                                            //         }, 60000);
                                            //     }).catch(err => {
                                            //         appLogger.writeLogToFile('error', "Execution policy set to Remote");
                                            //         appLogger.writeLogToFile('error', err);
                                            //     });
                                            // }).catch(err => {
                                            //     appLogger.writeLogToFile('info', "Error in getting winexe connection after restart.");
                                            //     appLogger.writeLogToFile('error', err);
                                            // });
                                          })
                                          .catch((err) => {
                                            appLogger.writeLogToFile(
                                              "info",
                                              "Error in getting winexe connection after restart. 1"
                                            );
                                            appLogger.writeLogToFile(
                                              "error",
                                              err
                                            );
                                          });
                                        // }, 25000);
                                      })
                                      .catch((err) => {
                                        appLogger.writeLogToFile(
                                          "info",
                                          "Error in deleting second session."
                                        );
                                        appLogger.writeLogToFile("error", err);
                                      });
                                    // }).catch(err => {
                                    //     appLogger.writeLogToFile('error', "System not back online on time. Wait Timeout");
                                    //     appLogger.writeLogToFile('error', err);
                                    // })
                                  }, 50000);
                                })
                                .catch((err) => {
                                  appLogger.writeLogToFile(
                                    "info",
                                    "Error in execution"
                                  );
                                  appLogger.writeLogToFile("error", err);
                                });
                            })
                            .catch((err) => {
                              appLogger.writeLogToFile(
                                "error",
                                "System not back online on time for installing .net. Wait Timeout"
                              );
                              appLogger.writeLogToFile("error", err);
                            });
                        }, 240000);
                      })
                      .catch((err) => {
                        appLogger.writeLogToFile("info", "Error in execution");
                        appLogger.writeLogToFile("error", err);
                      });
                  })
                  .catch((err) => {
                    appLogger.writeLogToFile(
                      "error",
                      "System not back online on time for Active dir. Wait Timeout"
                    );
                    appLogger.writeLogToFile("error", err);
                  });
              }, 120000);
            })
            .catch((err) => {
              appLogger.writeLogToFile("error", "System restart not completed");
              appLogger.writeLogToFile("error", err);
            });
        })
        .catch((err) => {
          appLogger.writeLogToFile(
            "error",
            "System not back online on time for restart"
          );
          appLogger.writeLogToFile("error", err);
        });
    } catch (e) {
      appLogger.writeLogToFile(
        "error",
        "Failed with normal connection. Trying to execute default command"
      );
      appLogger.writeLogToFile("error", e);
    }
  }
}

export default new ScriptService().executeScript;

// data.scripts.forEach(element => {
//     //data[element.scriptname].scriptparams[0] = '1';
//     let username = data.username;
//     let password = data.password;
//     if (element.authtype == constants.PARAM_AUTHTYPE[0]) {
//         username = data.domainusername;
//         password = data.domainpassword;
//     }
//     if (element.conntype == constants.PARAM_CONNTYPE[0]) {
//         setTimeout(() => {
//             winRm.WaitforConnection(username, password, data.host, 5000, 17, (p: IWinRMParams) => {
//                 winRm.CopyScript(p, data.clientpath + constants.SCRIPTFILEPATH + element.scriptname, 'C:/' + element.scriptname, true, data[element.scriptname].scriptparams).then(output => {
//                     appLogger.writeLogToFile('info',"Waiting for system restart.");
//                 }).catch(err => {
//                     appLogger.writeLogToFile('info',"Error in execution");
//                     WriteLog.info(err);
//                 })
//             }).catch(err => {
//                 WriteLog.error("System not back online on time. Wait Timeout");
//                 WriteLog.error(err);
//             });
//         }, 250000);
//     } else if (element.conntype == constants.PARAM_CONNTYPE[1]) {
//         setTimeout(() => {
//             winexe.getUserParams(username, password, data.host, (p: IWinRMParams) => {
//                 winexe.CopyScript(p, data.clientpath + constants.SCRIPTFILEPATH + element.scriptname, 'C:/' + element.scriptname, true, data[element.scriptname].scriptparams).then(output => {
//                     appLogger.writeLogToFile('info',"Waiting for system restart.");
//                 }).catch(err => {
//                     appLogger.writeLogToFile('info',"Error in execution");
//                     WriteLog.info(err);
//                 })
//             }).catch(err => {
//                 WriteLog.error("System not back online on time. Wait Timeout");
//                 WriteLog.error(err);
//             });
//         }, 250000);
//     }
// });
// setTimeout(() => {
//     winRm.ExecuteCommand(p2, " Restart-Computer -Force", 'ps').then(restart => {
//         appLogger.writeLogToFile('error',restart);
//         appLogger.writeLogToFile('error',"Waiting for restart:::::::::::::::::::::");
//         setTimeout(() => {

//         }, 10000);
//     }).catch(err => {
//         appLogger.writeLogToFile('info',"Error in execution");
//         WriteLog.info(err);
//     });

// }, 1000)

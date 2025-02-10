import * as winRm from "../../../../lib/win/winrm";
import * as winexe from "../../../../lib/win/winexe";
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
                          "/deployment_scripts/groupshare/1_pre_install.ps1",
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
                            .then((credentials2) => {
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
                                .ExecuteCommand(
                                  credentials2,
                                  "set-executionpolicy bypass",
                                  "ps"
                                )
                                .then((restart1) => {
                                  winRm
                                    .CopyScript(
                                      appLogger,
                                      credentials2,
                                      "http://" +
                                        data.clientpath +
                                        "/deployment_scripts/groupshare/2_install_dotnet.ps1",
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
                                            appLogger.writeLogToFile(
                                              "info",
                                              "Waiting for computer to clean session::::::::::::"
                                            );
                                            winexe
                                              .WaitforConnection(
                                                data.domainusername,
                                                data.domainpassword,
                                                data.sharedHost,
                                                30000,
                                                17,
                                                appLogger
                                              )
                                              .then((win_param5) => {
                                                appLogger.writeLogToFile(
                                                  "info",
                                                  "connection established " +
                                                    win_param5 +
                                                    appLogger
                                                );
                                                winexe
                                                  .CopyScript(
                                                    appLogger,
                                                    win_param5,
                                                    "http://" +
                                                      data.clientpath +
                                                      "/deployment_scripts/groupshare/GroupsharePrereqW2016.ps1",
                                                    "C:/GroupsharePrereqW2016.ps1",
                                                    true,
                                                    []
                                                  )
                                                  .then((o3) => {
                                                    setTimeout(() => {
                                                      winexe
                                                        .WaitforConnection(
                                                          data.domainusername,
                                                          data.domainpassword,
                                                          data.sharedHost,
                                                          30000,
                                                          17,
                                                          appLogger
                                                        )
                                                        .then((win_param3) => {
                                                          appLogger.writeLogToFile(
                                                            "info",
                                                            "connection established " +
                                                              win_param3 +
                                                              appLogger
                                                          );
                                                          winexe
                                                            .CopyScript(
                                                              appLogger,
                                                              win_param3,
                                                              "http://" +
                                                                data.clientpath +
                                                                "/deployment_scripts/groupshare/4_util_install.ps1",
                                                              "C:/4_util_install.ps1",
                                                              true,
                                                              data[
                                                                "4_util_install.ps1"
                                                              ].scriptparams
                                                            )
                                                            .then((o3) => {
                                                              setTimeout(() => {
                                                                winexe
                                                                  .WaitforConnection(
                                                                    data.domainusername,
                                                                    data.domainpassword,
                                                                    data.sharedHost,
                                                                    30000,
                                                                    30,
                                                                    appLogger
                                                                  )
                                                                  .then(
                                                                    (
                                                                      win_param4
                                                                    ) => {
                                                                      appLogger.writeLogToFile(
                                                                        "info",
                                                                        "connection established " +
                                                                          win_param4 +
                                                                          appLogger
                                                                      );
                                                                      winexe
                                                                        .CopyScript(
                                                                          appLogger,
                                                                          win_param4,
                                                                          "http://" +
                                                                            data.clientpath +
                                                                            "/deployment_scripts/groupshare/4_extract_exe.ps1",
                                                                          "C:/4_extract_exe.ps1",
                                                                          true,
                                                                          []
                                                                        )
                                                                        .then(
                                                                          (
                                                                            o3
                                                                          ) => {
                                                                            setTimeout(
                                                                              () => {
                                                                                // winexe.WaitforConnection(data.username, data.password, data.host, 30000, 17, appLogger).then(credentials => {
                                                                                //     //winexe.ExecuteCommand(credentials, 'set-executionpolicy Unrestricted', 'ps').then(restart1 => {
                                                                                //     winexe.CopyScript(appLogger, credentials, "http://" + data.clientpath + "/deployment_scripts/groupshare/util_pwd_encrypt.ps1", 'C:/util_pwd_encrypt.ps1', true, []).then(output => {
                                                                                new ScriptService()
                                                                                  .getEncryptedPassword(
                                                                                    appLogger,
                                                                                    data.domainusername,
                                                                                    data.domainpassword,
                                                                                    data.host,
                                                                                    data.clientpath,
                                                                                    30000,
                                                                                    30
                                                                                  )
                                                                                  .then(
                                                                                    (
                                                                                      encyptedpwd
                                                                                    ) => {
                                                                                      console.log(
                                                                                        "Password Encryption --------------------------"
                                                                                      );
                                                                                      console.log(
                                                                                        encyptedpwd
                                                                                      );
                                                                                      console.log(
                                                                                        "Password Encryption --------------------------"
                                                                                      );

                                                                                      winexe
                                                                                        .WaitforConnection(
                                                                                          data.domainusername,
                                                                                          data.domainpassword,
                                                                                          data.sharedHost,
                                                                                          30000,
                                                                                          17,
                                                                                          appLogger
                                                                                        )
                                                                                        .then(
                                                                                          (
                                                                                            win_param6
                                                                                          ) => {
                                                                                            winexe
                                                                                              .CopyScript(
                                                                                                appLogger,
                                                                                                win_param6,
                                                                                                "http://" +
                                                                                                  data.clientpath +
                                                                                                  "/deployment_scripts/groupshare/5_install_groupshare.ps1",
                                                                                                "C:/5_install_groupshare.ps1",
                                                                                                true,
                                                                                                []
                                                                                              )
                                                                                              .then(
                                                                                                (
                                                                                                  o3
                                                                                                ) => {
                                                                                                  appLogger.writeLogToFile(
                                                                                                    "info",
                                                                                                    "Groupshare Installation complete. Validation will start in 60s. "
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
                                                                                                        "/deployment_scripts/groupshare/6_verify_installations.ps1") +
                                                                                                      " -OutFile " +
                                                                                                      "C:/6_verify_installations.ps1";
                                                                                                    win_param6.run(
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
                                                                                                        win_param6.run(
                                                                                                          "powershell -ExecutionPolicy Bypass -File " +
                                                                                                            "C:/6_verify_installations.ps1",
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
                                                                                                              ) &&
                                                                                                              retries >
                                                                                                                20
                                                                                                            ) {
                                                                                                              updateDeploymentStatus(
                                                                                                                true
                                                                                                              );
                                                                                                              setTimeout(
                                                                                                                () => {
                                                                                                                  winexe
                                                                                                                    .CopyScript(
                                                                                                                      appLogger,
                                                                                                                      win_param6,
                                                                                                                      "http://" +
                                                                                                                        data.clientpath +
                                                                                                                        "/deployment_scripts/groupshare/7_http_config.ps1",
                                                                                                                      "C:/7_http_config.ps1",
                                                                                                                      false,
                                                                                                                      data[
                                                                                                                        "7_http_config.ps1"
                                                                                                                      ]
                                                                                                                        .scriptparams
                                                                                                                    )
                                                                                                                    .then(
                                                                                                                      (
                                                                                                                        o3: any
                                                                                                                      ) => {
                                                                                                                        winexe
                                                                                                                          .ExecuteCommand(
                                                                                                                            appLogger,
                                                                                                                            win_param6,
                                                                                                                            "C:\\WINDOWS\\sysnative\\WindowsPowerShell\\v1.0\\powershell.exe -command 'Set-ExecutionPolicy Bypass;C:/7_http_config.ps1'",
                                                                                                                            "ps"
                                                                                                                          )
                                                                                                                          .then(
                                                                                                                            (
                                                                                                                              out
                                                                                                                            ) => {
                                                                                                                              console.log(
                                                                                                                                o3,
                                                                                                                                out
                                                                                                                              );
                                                                                                                            }
                                                                                                                          );
                                                                                                                      }
                                                                                                                    );
                                                                                                                },
                                                                                                                120000
                                                                                                              );
                                                                                                            } else {
                                                                                                              if (
                                                                                                                retries <
                                                                                                                25
                                                                                                              ) {
                                                                                                                setTimeout(
                                                                                                                  () => {
                                                                                                                    validateInstallation();
                                                                                                                  },
                                                                                                                  75000
                                                                                                                );
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
                                                                                                  }
                                                                                                  setTimeout(
                                                                                                    () => {
                                                                                                      validateInstallation();
                                                                                                    },
                                                                                                    120000
                                                                                                  );
                                                                                                }
                                                                                              )
                                                                                              .catch(
                                                                                                (
                                                                                                  err
                                                                                                ) => {
                                                                                                  appLogger.writeLogToFile(
                                                                                                    "info",
                                                                                                    "Groupshare Installation execution failed"
                                                                                                  );
                                                                                                  appLogger.writeLogToFile(
                                                                                                    "error",
                                                                                                    err
                                                                                                  );
                                                                                                }
                                                                                              );
                                                                                          }
                                                                                        )
                                                                                        .catch(
                                                                                          (
                                                                                            err
                                                                                          ) => {
                                                                                            appLogger.writeLogToFile(
                                                                                              "info",
                                                                                              "Groupshare Installation execution failed"
                                                                                            );
                                                                                            appLogger.writeLogToFile(
                                                                                              "error",
                                                                                              err
                                                                                            );
                                                                                          }
                                                                                        );
                                                                                    }
                                                                                  )
                                                                                  .catch(
                                                                                    (
                                                                                      err
                                                                                    ) => {
                                                                                      appLogger.writeLogToFile(
                                                                                        "info",
                                                                                        "Groupshare Installation execution failed"
                                                                                      );
                                                                                      appLogger.writeLogToFile(
                                                                                        "error",
                                                                                        err
                                                                                      );
                                                                                    }
                                                                                  );
                                                                                //     }).catch(err => {
                                                                                //         appLogger.writeLogToFile('info', "Groupshare Installation execution failed")
                                                                                //         appLogger.writeLogToFile('error', err)
                                                                                //     });
                                                                                //     // }).catch(err => {
                                                                                //     //     appLogger.writeLogToFile('info', "Groupshare Installation execution failed")
                                                                                //     //     appLogger.writeLogToFile('error', err)
                                                                                //     // });
                                                                                // }).catch(err => {
                                                                                //     appLogger.writeLogToFile('info', "Groupshare Installation execution failed")
                                                                                //     appLogger.writeLogToFile('error', err)
                                                                                // });
                                                                              },
                                                                              300000
                                                                            );
                                                                          }
                                                                        )
                                                                        .catch(
                                                                          (
                                                                            err
                                                                          ) => {
                                                                            appLogger.writeLogToFile(
                                                                              "info",
                                                                              "Groupshare Installation execution failed"
                                                                            );
                                                                            appLogger.writeLogToFile(
                                                                              "error",
                                                                              err
                                                                            );
                                                                          }
                                                                        );
                                                                    }
                                                                  )
                                                                  .catch(
                                                                    (err) => {
                                                                      appLogger.writeLogToFile(
                                                                        "info",
                                                                        "Error in getting winexe connection after restart. 1"
                                                                      );
                                                                      appLogger.writeLogToFile(
                                                                        "error",
                                                                        err
                                                                      );
                                                                    }
                                                                  );
                                                              }, 75000);
                                                            })
                                                            .catch((err) => {
                                                              appLogger.writeLogToFile(
                                                                "info",
                                                                "Groupshare Installation execution failed"
                                                              );
                                                              appLogger.writeLogToFile(
                                                                "error",
                                                                err
                                                              );
                                                            });
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
                                                    }, 120000);
                                                  })
                                                  .catch((err) => {
                                                    appLogger.writeLogToFile(
                                                      "info",
                                                      "Groupshare Installation execution failed"
                                                    );
                                                    appLogger.writeLogToFile(
                                                      "error",
                                                      err
                                                    );
                                                  });
                                              })
                                              .catch((err) => {
                                                appLogger.writeLogToFile(
                                                  "info",
                                                  "Groupshare Installation execution failed"
                                                );
                                                appLogger.writeLogToFile(
                                                  "error",
                                                  err
                                                );
                                              });
                                          })
                                          .catch((err) => {
                                            appLogger.writeLogToFile(
                                              "info",
                                              "Error in deleting second session."
                                            );
                                            appLogger.writeLogToFile(
                                              "error",
                                              err
                                            );
                                          });
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

  getEncryptedPassword(
    appLogger: AppLogger,
    username: string,
    password: string,
    host: string,
    clientpath: string,
    waitdurationinms: number,
    retries: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      winexe
        .WaitforConnection(username, password, host, 30000, 12, appLogger)
        .then((credentials) => {
          winexe
            .CopyScript(
              appLogger,
              credentials,
              "http://" +
                clientpath +
                "/deployment_scripts/groupshare/util_pwd_encrypt.ps1",
              "C:/util_pwd_encrypt.ps1",
              true,
              []
            )
            .then((output) => {
              winexe
                .WaitforConnection(
                  username,
                  password,
                  host,
                  30000,
                  5,
                  appLogger
                )
                .then((credentials) => {
                  winexe
                    .CopyScript(
                      appLogger,
                      credentials,
                      "http://" +
                        clientpath +
                        "/deployment_scripts/groupshare/util_get_password.ps1",
                      "C:/util_get_password.ps1",
                      true,
                      []
                    )
                    .then((output) => {
                      appLogger.writeLogToFile(
                        "info",
                        "Password Encryption --------------------------"
                      );
                      appLogger.writeLogToFile("info", output);
                      appLogger.writeLogToFile(
                        "info",
                        "Password Encryption --------------------------"
                      );
                      resolve(output);
                    })
                    .catch((err) => {
                      appLogger.writeLogToFile(
                        "error",
                        "System restart not completed"
                      );
                      appLogger.writeLogToFile("error", err);
                      reject(err);
                    });
                })
                .catch((err) => {
                  appLogger.writeLogToFile(
                    "error",
                    "System restart not completed"
                  );
                  appLogger.writeLogToFile("error", err);
                  reject(err);
                });
            })
            .catch((err) => {
              winexe
                .WaitforConnection(
                  username,
                  password,
                  host,
                  30000,
                  17,
                  appLogger
                )
                .then((credentials) => {
                  winexe
                    .CopyScript(
                      appLogger,
                      credentials,
                      "http://" +
                        clientpath +
                        "/deployment_scripts/groupshare/util_get_password.ps1",
                      "C:/util_get_password.ps1",
                      true,
                      []
                    )
                    .then((output) => {
                      appLogger.writeLogToFile(
                        "info",
                        "Password Encryption --------------------------"
                      );
                      appLogger.writeLogToFile("info", output);
                      appLogger.writeLogToFile(
                        "info",
                        "Password Encryption --------------------------"
                      );
                      resolve(output);
                    })
                    .catch((err) => {
                      appLogger.writeLogToFile(
                        "error",
                        "System restart not completed"
                      );
                      appLogger.writeLogToFile("error", err);
                      reject(err);
                    });
                })
                .catch((err) => {
                  appLogger.writeLogToFile(
                    "error",
                    "System restart not completed"
                  );
                  appLogger.writeLogToFile("error", err);
                  reject(err);
                });
            });
        })
        .catch((err) => {
          appLogger.writeLogToFile("error", "System restart not completed");
          appLogger.writeLogToFile("error", err);
          reject(err);
        });
    });
  }
}
export default new ScriptService().executeScript;

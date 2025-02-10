import db from "../../../models/model";
import { Request, Response } from "express";
import * as path from "path";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants, ECLApiURL } from "../../../../common/constants";
import * as fs from "fs";
import * as _ from "lodash";
import commonService from "../../../services/common.service";
import citrixService from "../../../services/citrix.service";
import * as ScriptService from "../../../services/deployments";
import { messages } from "../../../../common/messages";
import { AppError } from "../../../../common/appError";
import AppLogger from "../../../../lib/logger";
import NotificationService from "../../../services/notification.service";
import {
  VerifyScript,
  GetCloudInitScript,
  Orchestrate,
} from "../../../services/orchestration";
const cryptr = require("cryptr");

export class ECL2Controller {
  constructor() {
    // Empty constructor
  }
  deploySolution(req: Request, res: Response): void {
    let response = {};
    let cwd = process.cwd();
    let pstdout = process.stdout.write;
    let pstderr = process.stderr.write;

    try {
      // let C_FOLDER_PATH = cwd + '/instances/';

      let deployments: any = {};
      let ecl2solutionsobj = req.body.solution.ecl2solutions;

      deployments.solutionid = req.body.solutionid;
      deployments.tenantid = req.body.tenantid;
      deployments.requestid = req.body.requestid;
      deployments.zoneid = req.body.zoneid;
      deployments.clientid = req.body.clientid;
      deployments.notes = req.body.notes;
      deployments.status = "Active";
      deployments.cloudprovider = "ECL2";
      deployments.createdby = req.body.createdby;
      deployments.createddt = req.body.createddt;
      deployments.lastupdateddt = req.body.lastupdateddt;
      deployments.lastupdatedby = req.body.lastupdatedby;
      deployments.ecl2deployments = _.map(
        req.body.solution.ecl2solutions,
        function (item) {
          item.instancenumber = commonService.generateRandomNumber(4);
          if (req.body.solution.implementationname) {
            item.instancename = req.body.solution.implementationname;
          } else {
            let instancename =
              item.instancenumber +
              "_" +
              item.instancename +
              "_" +
              req.body.customername;
            instancename = instancename
              .substring(0, 50)
              .replace(new RegExp(" ", "g"), "-");
            item.instancename = instancename;
          }
          item.virtualipaddress = req.body.virtualipaddress;
          item.createdby = req.body.createdby;
          item.createddt = req.body.createddt;
          item.status = "Deploying";
          item.lastupdateddt = req.body.lastupdateddt;
          item.lastupdatedby = req.body.lastupdatedby;
          return item;
        }
      );
      let options = {
        include: [
          { model: db.ecl2deployments, as: "ecl2deployments" },
          { model: db.TagValues, as: "tagvalues" },
        ],
      };

      // Check if orchestration intervention required
      let orchids = [];
      ecl2solutionsobj.forEach((o) => {
        if (o["orchid"]) orchids.push(o["orchid"]);
      });

      let orchestrationsData: object[];

      if (orchids.length > 0) {
        commonService
          .executeQuery(
            `select * from tbl_bs_orchestration where orchid in (${orchids.join(
              ","
            )})`,
            { type: db.sequelize.QueryTypes.SELECT },
            db.sequelize
          )
          .then(async (orchestrations: object[]) => {
            let scripts = [];

            orchestrationsData = orchestrations;

            // Collect all scripts used in orchestration.
            orchestrations.forEach((o) => {
              let flow = JSON.parse(o["orchflow"]) as Map<string, any>;
              let nodes = flow["nodes"];

              let s = o["scripts"]
                ? JSON.parse(o["scripts"])
                : (null as string[] | null);
              if (s) {
                s.forEach((element) => {
                  scripts.push(
                    constants.FILEUPLOADPATH.SCRIPT_FILE + element["scriptname"]
                  );
                });
              }
            });

            try {
              await VerifyScript(scripts);
              startDeployment();
            } catch (error) {
              console.log(
                "Some of the scripts in orchestration not exists:::::::::::"
              );
              console.log(error);
              // customValidation.generateErrorMsg("Some of the scripts defined in orchestration not exists.", response, 200, req);
            }
          })
          .catch((err) => {
            console.log("Error getting orchestrations:::::::::::");
            console.log(err);
          });
      } else {
        startDeployment();
      }

      function startDeployment() {
        commonService
          .saveWithAssociation(deployments, options, db.deployments)
          .then((deploymentsdata: any) => {
            let appLog = new AppLogger(
              process.cwd() + `/instances/${deploymentsdata.deploymentid}/`,
              deploymentsdata.deploymentid + ".log"
            );

            customValidation.generateSuccessResponse(
              deploymentsdata,
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );

            let requesturl = constants.ECL2_CREATE_NOVA_SERVER;
            let requestheader = {
              Accept: "application/json",
              "Content-Type": "application/json",
            };

            let deploymentsdatalist = [] as any;

            for (
              let num: number = 0;
              num < Number(ecl2solutionsobj.length);
              num++
            ) {
              setTimeout(function () {
                let orchId = ecl2solutionsobj[num]["orchid"];
                let orchData;

                if (orchId) {
                  orchData = orchestrationsData.find(
                    (o) => o["orchid"] == orchId
                  );
                }

                deploymentsdatalist[num] =
                  deploymentsdata.ecl2deployments[num].dataValues;
                if (ecl2solutionsobj[num].volumes != null) {
                  let vrequesturl = constants.ECL2_CREATE_VOLUME_URL;
                  let vrequestheader = {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  };

                  let volumes: Promise<any>[] = [];

                  for (
                    let i = 0;
                    i < ecl2solutionsobj[num].volumes.length;
                    i++
                  ) {
                    let volume = ecl2solutionsobj[num].volumes[i];
                    let vrequestparams = {
                      volume: {
                        display_name: volume.volumename,
                        display_description: volume.description,
                        size: volume.size,
                        availability_zone: "zone1-groupa", // FIXME: Change volume zone.
                      },
                    };

                    function createVolume(): Promise<any> {
                      return new Promise((resolve, reject) => {
                        commonService
                          .callECL2Reqest(
                            "POST",
                            req.body.region,
                            req.body.tenantid,
                            vrequesturl,
                            vrequestheader,
                            vrequestparams,
                            req.body.ecl2tenantid,
                            appLog
                          )
                          .then((addvolume) => {
                            volume.volumeid = null;
                            volume.customerid = req.body.clientid;
                            volume.ecl2volumeid = addvolume.volume.id;
                            commonService
                              .create(volume, db.ecl2volumes)
                              .then((data) => {
                                // deploymentsdatalist[num].volumeid = data.dataValues.volumeid;
                                // if (i == ecl2solutionsobj[num].volumes.length - 1) {
                                //     setTimeout(() => {
                                // new ECL2Controller().getUserData(num, deploymentsdata, ecl2solutionsobj,
                                //     req, res, response, requesturl, requestheader, deploymentsdatalist, appLog, orchData);
                                //     }, 10000);
                                // }
                                resolve(data.dataValues.volumeid);
                              })
                              .catch((err) => {
                                console.log(
                                  "Error creating volumes:::::::::::::"
                                );
                                console.log(err);
                                reject("Error creating volume");
                              });
                          })
                          .catch((error: any) => {
                            console.log(
                              error,
                              "::::::::::::::::::::::::::::::::::::::::::::::::::::::::"
                            );
                            // deploymentsdatalist[num].instanceoutput = JSON.stringify(error.message);
                            // deploymentsdatalist[num].status = constants.STATUS_FAILED;

                            console.log(
                              "------------------------------------------------"
                            );
                            console.log(
                              "Additional Volume Creation Failed, VM Not Created..." +
                                deploymentsdata.ecl2deployments[num]
                                  .instancename
                            );
                            console.log(
                              "------------------------------------------------"
                            );
                            console.log(error);
                            reject("Error creating volume");
                          });
                      });
                    }

                    volumes.push(createVolume());
                  }

                  console.log(
                    "Inside vloume creation :::::::::::::::::::::::::::::::::::::::::::::"
                  );
                  Promise.all(volumes)
                    .then((volumeIds: number[]) => {
                      console.log("Volumes created::::::::::::");
                      console.log(volumeIds);

                      setTimeout(() => {
                        new ECL2Controller().getUserData(
                          num,
                          deploymentsdata,
                          ecl2solutionsobj,
                          req,
                          res,
                          response,
                          requesturl,
                          requestheader,
                          deploymentsdatalist,
                          appLog,
                          orchData
                        );
                      }, 15000);
                    })
                    .catch((err) => {
                      console.log("Error adding volumes:::::::::::::");
                      console.log(err);
                    });

                  // Duplicate code commented out
                  // if (num === Number(ecl2solutionsobj.length) - 1) {
                  //     new ECL2Controller().buildOutputData(num, deploymentsdata, ecl2solutionsobj, deploymentsdatalist, response, res, req, appLog, orchData);
                  // }
                } else {
                  appLog.writeLogToFile("info", "Started to deploy instance.");
                  console.log("called from 3 ::::::::::::::::::::::::::::::::");
                  new ECL2Controller().getUserData(
                    num,
                    deploymentsdata,
                    ecl2solutionsobj,
                    req,
                    res,
                    response,
                    requesturl,
                    requestheader,
                    deploymentsdatalist,
                    appLog,
                    orchData
                  );
                }
              }, 5000);
            }
          })
          .catch((error: Error) => {
            console.log(error);
          });
      }
    } catch (e) {
      console.log("Error in start of deployment::::::::::");
      console.log(e);
      // customValidation.generateAppError(e, response, res, req);
    }
  }
  async getUserData(
    num: number,
    deploymentsdata: any,
    ecl2solutionsobj: any,
    req: Request,
    res: Response,
    response: any,
    requesturl: any,
    requestheader: any,
    deploymentsdatalist: any,
    appLogger: AppLogger,
    orchData: any
  ) {
    try {
      // let scriptarray = [];
      // let userdata = '';
      // if (ecl2solutionsobj[num].script) {
      //     scriptarray.push(ecl2solutionsobj[num].script);
      // }
      // let cloudbasescript = scriptarray.find(function (element) {
      //     return element.conntype == constants.PARAM_CONNTYPE[2];
      // });

      function startDeployment(encoded?: string) {
        let requestparams = {
          server: {
            "OS-DCF:diskConfig": "MANUAL", // String (AUTO or MANUAL)
            flavorRef: ecl2solutionsobj[num].ecl2instancetype.instancetypename,
            imageRef: ecl2solutionsobj[num].ecl2images.ecl2imageid,
            max_count: "1",
            min_count: "1",
            name: deploymentsdata.ecl2deployments[num].instancename,
            availability_zone: ecl2solutionsobj[
              num
            ].ecl2zones.zonename.substring(
              4,
              ecl2solutionsobj[num].ecl2zones.zonename.length
            ),
            config_drive: true,
            //'key_name': '',
            user_data: encoded || "",
            block_device_mapping: [],
            block_device_mapping_v2: [],
            metadata: {},
            networks: [],
          },
        } as any;

        // Asset level tagvalues
        if (ecl2solutionsobj[num].tagvalues) {
          ecl2solutionsobj[num].tagvalues.forEach((element) => {
            requestparams.server.metadata[element.tag.tagname] =
              element.tagvalue;
          });
        }
        // Solution level tagvalues
        if (deploymentsdata.tagvalues) {
          deploymentsdata.tagvalues.forEach((element) => {
            requestparams.server.metadata[element.tag.tagname] =
              element.tagvalue;
          });
        }
        console.log(
          "::::::::::::::::::::::::::::::::::::::::::::::::::Volumes",
          ecl2solutionsobj[num].volumes
        );
        if (null != ecl2solutionsobj[num].volumes) {
          let devicename = "/dev/vdb";
          ecl2solutionsobj[num].volumes.forEach((element, i) => {
            requestparams.server.block_device_mapping.push({
              volume_id: element.ecl2volumeid.toString(),
              device_name: devicename + i, // Default value refer API doc
            });
          });
        }
        if (null != ecl2solutionsobj[num].blockdevicemappingv2) {
          requestparams.block_device_mapping_v2 =
            ecl2solutionsobj[num].blockdevicemappingv2;
        }

        for (
          let n: number = 0;
          n < Number(ecl2solutionsobj[num].ecl2networks.length);
          n++
        ) {
          requestparams.server.networks.push({
            uuid: ecl2solutionsobj[num].ecl2networks[n].ecl2networkid,
          });
        }

        appLogger.writeLogToFile(
          "info",
          "------------------------------------------------"
        );
        appLogger.writeLogToFile(
          "info",
          "VM Creation process started..." +
            deploymentsdata.ecl2deployments[num].instancename
        );
        appLogger.writeLogToFile(
          "info",
          "-------------------------------------------------"
        );
        commonService
          .callECL2Reqest(
            "POST",
            req.body.region,
            req.body.tenantid,
            requesturl,
            requestheader,
            requestparams,
            req.body.ecl2tenantid,
            appLogger
          )
          .then((ecl2responsedata) => {
            appLogger.writeLogToFile("info", deploymentsdatalist);
            appLogger.writeLogToFile("info", num);
            deploymentsdatalist[num].ecl2serverid = ecl2responsedata.server.id;
            deploymentsdatalist[num].ecl2serverpwd =
              ecl2responsedata.server.adminPass;
            deploymentsdatalist[num].instanceoutput =
              JSON.stringify(ecl2responsedata);
            appLogger.writeLogToFile("info", req.body.requestid);
            deploymentsdatalist[num].requestid = req.body.requestid;
            if (
              req.body &&
              req.body["scriptparams"] &&
              req.body["scriptparams"].length > 0 &&
              req.body["scriptparams"].findIndex((o) => o["scriptid"] != -1) !=
                -1
            ) {
            } else {
              deploymentsdatalist[num].status = constants.STATUS_DEPLOYED;
            }
            if (num === Number(ecl2solutionsobj.length) - 1) {
              new ECL2Controller().buildOutputData(
                num,
                deploymentsdata,
                ecl2solutionsobj,
                deploymentsdatalist,
                response,
                res,
                req,
                appLogger,
                orchData
              );
            }
          })
          .catch((error: Error) => {
            appLogger.writeLogToFile("error", error);
            deploymentsdatalist[num].instanceoutput = JSON.stringify(
              error.message
            );
            deploymentsdatalist[num].status = constants.STATUS_FAILED;

            if (num === Number(ecl2solutionsobj.length) - 1) {
              new ECL2Controller().buildOutputData(
                num,
                deploymentsdata,
                ecl2solutionsobj,
                deploymentsdatalist,
                response,
                res,
                req,
                appLogger,
                orchData
              );
            }
          });
      }

      if (orchData) {
        try {
          let encoded = await GetCloudInitScript(orchData);
          startDeployment(encoded);
        } catch (error) {
          console.log(error);
          console.log("Error parsing cloud init script:::::::::::::");
        }
      } else {
        startDeployment();
      }
    } catch (e) {
      console.log(e);
    }
  }

  createInstance(
    stream: any,
    num: number,
    deploymentsdata: any,
    ecl2solutionsobj: any,
    req: Request,
    res: Response,
    pstdout: any,
    pstderr: any,
    response: any,
    requesturl: any,
    requestheader: any,
    deploymentsdatalist: any,
    userdata: any
  ) {
    // ECL2
    let requestparams = {} as any;
    let encoded = Buffer.from(userdata).toString("base64");
    requestparams = {
      server: {
        "OS-DCF:diskConfig": "MANUAL", // String (AUTO or MANUAL)
        flavorRef: ecl2solutionsobj[num].ecl2instancetype.instancetypename,
        imageRef: ecl2solutionsobj[num].ecl2images.ecl2imageid,
        max_count: "1",
        min_count: "1",
        name: deploymentsdata.ecl2deployments[num].instancename,
        availability_zone: ecl2solutionsobj[num].ecl2zones.zonename.substring(
          4,
          ecl2solutionsobj[num].ecl2zones.zonename.length
        ),
        config_drive: true,
        //'key_name': '',
        user_data: encoded,
        block_device_mapping: [],
        block_device_mapping_v2: [],
        metadata: {},
        networks: [],
      },
    };

    // Asset level tagvalues
    if (ecl2solutionsobj[num].tagvalues) {
      ecl2solutionsobj[num].tagvalues.forEach((element) => {
        requestparams.server.metadata[element.tag.tagname] = element.tagvalue;
      });
    }
    // Solution level tagvalues
    if (deploymentsdata.tagvalues) {
      deploymentsdata.tagvalues.forEach((element) => {
        requestparams.server.metadata[element.tag.tagname] = element.tagvalue;
      });
    }

    console.log(ecl2solutionsobj[num].volumes);
    if (null != ecl2solutionsobj[num].volumes) {
      requestparams.server.block_device_mapping.push({
        volume_id: ecl2solutionsobj[num].volumes.ecl2volumeid,
        device_name: "/dev/vdb", // Default value refer API doc
      });
    }
    if (null != ecl2solutionsobj[num].blockdevicemappingv2) {
      requestparams.block_device_mapping_v2 =
        ecl2solutionsobj[num].blockdevicemappingv2;
    }

    for (
      let n: number = 0;
      n < Number(ecl2solutionsobj[num].ecl2networks.length);
      n++
    ) {
      requestparams.server.networks.push({
        uuid: ecl2solutionsobj[num].ecl2networks[n].ecl2networkid,
      });
    }

    console.log("------------------------------------------------");
    console.log(
      "VM Creation process started..." +
        deploymentsdata.ecl2deployments[num].instancename
    );
    console.log("-------------------------------------------------");
    commonService
      .callECL2Reqest(
        "POST",
        req.body.region,
        req.body.tenantid,
        requesturl,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2responsedata) => {
        console.log(deploymentsdatalist);
        console.log(num);
        deploymentsdatalist[num].ecl2serverid = ecl2responsedata.server.id;
        deploymentsdatalist[num].ecl2serverpwd =
          ecl2responsedata.server.adminPass;
        deploymentsdatalist[num].instanceoutput =
          JSON.stringify(ecl2responsedata);
        console.log(req.body.requestid);
        deploymentsdatalist[num].requestid = req.body.requestid;

        deploymentsdatalist[num].status = constants.STATUS_DEPLOYED;
      })
      .catch((error: Error) => {
        console.log(error);
        deploymentsdatalist[num].instanceoutput = JSON.stringify(error.message);
        deploymentsdatalist[num].status = constants.STATUS_FAILED;
      });
  }

  buildOutputData(
    index: any,
    deploymentsdata: any,
    ecl2solutionsobj: any,
    deploymentsdatalist: any,
    response: any,
    res: Response,
    req: Request,
    appLogger: AppLogger,
    orchData: any
  ) {
    console.log(
      ":::::::::::::::::::::::::::::::::::::::::",
      JSON.stringify(deploymentsdatalist)
    );
    for (let num: number = 0; num < Number(deploymentsdatalist.length); num++) {
      setTimeout(function () {
        deploymentsdatalist[num].ecl2images = ecl2solutionsobj[num].ecl2images
          ? ecl2solutionsobj[num].ecl2images
          : null;
        appLogger.writeLogToFile("info", deploymentsdatalist[num]);
        appLogger.writeLogToFile("info", "Processing, Please wait.....");

        let updatedeploymentsdata = deploymentsdatalist[num];
        updatedeploymentsdata.lastupdateddt = new Date();

        if (updatedeploymentsdata.status === constants.STATUS_FAILED) {
          let condition = {
            ecl2deploymentid: updatedeploymentsdata.ecl2deploymentid,
          };
          commonService
            .update(condition, updatedeploymentsdata, db.ecl2deployments)
            .then((data: any) => {
              let condition = {
                module: constants.NOTIFICATION_MODULES[3],
                event: constants.NOTIFICATION_EVENTS[13],
                tenantid: req.body.tenantid,
                status: constants.STATUS_ACTIVE,
              } as any;
              let dateFormat = constants.MOMENT_FORMAT[1];
              let mapObj = {
                "{{template_name}}": req.body.solution.solutionname,
                "{{templateid}}": req.body.solution.solutionid,
                "{{deployed_by}}": data.createdby,
                "{{cloud_provider}}": req.body.solution.cloudprovider,
                "{{region}}": req.body.region,
                "{{deployed_dt}}": commonService.formatDate(
                  new Date(data.createddt),
                  dateFormat,
                  false
                ),
              };
              NotificationService.getNotificationSetup(
                condition,
                mapObj,
                "SDL - Instance Deployed",
                "Instance Deployed"
              );
              appLogger.writeLogToFile(
                "info",
                "------------------------------------------------"
              );
              appLogger.writeLogToFile(
                "info",
                "VM Creation process failed..." +
                  deploymentsdata.ecl2deployments[num].instancename
              );
              appLogger.writeLogToFile("info", data);
              appLogger.writeLogToFile(
                "info",
                "------------------------------------------------"
              );
            })
            .catch((error: Error) => {
              appLogger.writeLogToFile(
                "info",
                "------------------------------------------------"
              );
              appLogger.writeLogToFile("error", error);
              appLogger.writeLogToFile(
                "info",
                "VM Creation process failed..." +
                  deploymentsdata.ecl2deployments[num].instancename
              );
            });
        } else {
          let requesturl = ECLApiURL.GET.SERVERS.replace(
            "{server_id}",
            updatedeploymentsdata.ecl2serverid
          );
          let requestheader = {
            Accept: "application/json",
            "Content-Type": "application/json",
          };
          let requestparams = {};
          commonService
            .callECL2Reqest(
              "GET",
              req.body.region,
              req.body.tenantid,
              requesturl,
              requestheader,
              requestparams,
              req.body.ecl2tenantid
            )
            .then((ecl2servers) => {
              appLogger.writeLogToFile("info", ecl2servers);

              // If tenantsharing enabled need to call the function once tenant sharing API's completed.
              // try {
              //     new ECL2Controller().saveInstance(req, res, deploymentsdata, deploymentsdatalist[num], ecl2servers.server, appLogger, orchData);
              // } catch (e) { appLogger.writeLogToFile('error', e); }
              let condition = {
                ecl2deploymentid: updatedeploymentsdata.ecl2deploymentid,
              };
              updatedeploymentsdata.lastupdateddt = new Date();
              commonService
                .update(condition, updatedeploymentsdata, db.ecl2deployments)
                .then((data: any) => {
                  let condition = {
                    module: constants.NOTIFICATION_MODULES[3],
                    event: constants.NOTIFICATION_EVENTS[12],
                    tenantid: req.body.tenantid,
                    status: constants.STATUS_ACTIVE,
                  } as any;
                  let dateFormat = constants.MOMENT_FORMAT[1];
                  let mapObj = {
                    "{{template_name}}": req.body.solution.solutionname,
                    "{{templateid}}": req.body.solution.solutionid,
                    "{{deployed_by}}": data.createdby,
                    "{{cloud_provider}}": req.body.solution.cloudprovider,
                    "{{region}}": req.body.region,
                    "{{deployed_dt}}": commonService.formatDate(
                      new Date(data.createddt),
                      dateFormat,
                      false
                    ),
                  };
                  NotificationService.getNotificationSetup(
                    condition,
                    mapObj,
                    "SDL - Instance Deployed",
                    "Instance Deployed"
                  );
                  appLogger.writeLogToFile(
                    "info",
                    "DEPLOY",
                    updatedeploymentsdata
                  );
                  appLogger.writeLogToFile(
                    "info",
                    "------------------------------------------------"
                  );
                  appLogger.writeLogToFile(
                    "info",
                    "----> VM Created <-----" +
                      deploymentsdata.ecl2deployments[num].instancename
                  );
                  appLogger.writeLogToFile(
                    "info",
                    "------------------------------------------------"
                  );
                  // ecl2solutionsobj[num].tenantsharing = true;
                  // ecl2solutionsobj[num].tenantsharingobj = [{
                  //     ecltenantconnrequestid: 'df2d9336-417f-11e9-af2c-525404060400',
                  //     tenantconnrequestid: 1174
                  // }];
                  if (
                    ecl2solutionsobj[num].tenantsharing === true &&
                    !_.isEmpty(ecl2solutionsobj[num].tenantsharingobj)
                  ) {
                    appLogger.writeLogToFile(
                      "info",
                      "Process Started : Inter Connectivity.........."
                    );
                    let requesturl = ECLApiURL.CREATE.TENANT_CONN;
                    ecl2solutionsobj[num].tenantsharingobj.forEach(
                      (element, index) => {
                        let requestparams = {
                          tenant_connection: {
                            tenant_connection_request_id:
                              element.ecltenantconnrequestid,
                            device_type: "ECL::Compute::Server",
                            name: updatedeploymentsdata.instancename,
                            device_id: updatedeploymentsdata.ecl2serverid,
                          },
                        } as any;
                        // Create tenant connection
                        commonService
                          .callECL2Reqest(
                            "POST",
                            req.body.region,
                            req.body.tenantid,
                            requesturl,
                            requestheader,
                            requestparams,
                            req.body.ecl2tenantid
                          )
                          .then((tenantconndata) => {
                            appLogger.writeLogToFile(
                              "info",
                              "Tenant Connection Created.........."
                            );
                            if (
                              !customValidation.isEmptyValue(
                                tenantconndata.tenant_connection
                              ) &&
                              !customValidation.isEmptyValue(
                                tenantconndata.tenant_connection.id
                              )
                            ) {
                              setTimeout(function () {
                                appLogger.writeLogToFile(
                                  "info",
                                  "Tenant Sharing enabled moving on to deployment.........."
                                );
                                let tenantconnurl =
                                  ECLApiURL.GET.TENANT_CONN.replace(
                                    "{tenant_connection_id}",
                                    tenantconndata.tenant_connection.id
                                  );
                                // Get available tenant connection list
                                commonService
                                  .callECL2Reqest(
                                    "GET",
                                    req.body.region,
                                    req.body.tenantid,
                                    tenantconnurl,
                                    requestheader,
                                    {},
                                    req.body.ecl2tenantid
                                  )
                                  .then((tenantconnlist) => {
                                    appLogger.writeLogToFile(
                                      "info",
                                      "Get Tenant Connection Details.........."
                                    );
                                    appLogger.writeLogToFile(
                                      "info",
                                      "Connection List",
                                      tenantconnlist.tenant_connection.port_id
                                    );
                                    let porturl =
                                      constants.ECL2_GET_PORT_URL.replace(
                                        "{port_id}",
                                        tenantconnlist.tenant_connection.port_id
                                      );
                                    // Get IP of the VM after attaching to tenant sharing.
                                    commonService
                                      .callECL2Reqest(
                                        "GET",
                                        req.body.region,
                                        req.body.tenantid,
                                        porturl,
                                        requestheader,
                                        {},
                                        req.body.ecl2tenantid
                                      )
                                      .then((portList: any) => {
                                        appLogger.writeLogToFile(
                                          "info",
                                          "Get Port Details.........."
                                        );
                                        appLogger.writeLogToFile(
                                          "info",
                                          "PORT Details",
                                          portList.port
                                        );
                                        appLogger.writeLogToFile(
                                          "info",
                                          portList.port.fixed_ips
                                        );
                                        updatedeploymentsdata.serveraddresses =
                                          [];
                                        updatedeploymentsdata.serveraddresses.push(
                                          portList.port.fixed_ips[0].ip_address
                                        );

                                        req.body.tenantsharingIP =
                                          portList.port.fixed_ips[0].ip_address;

                                        // If tenant sharing enabled. Will call the saveinstance only after tenant network created.
                                        let length =
                                          ecl2solutionsobj[num].tenantsharingobj
                                            .length;
                                        if (index == length - 1) {
                                          let restartrequest = {
                                            "os-stop": null,
                                          } as any;
                                          let restarturl =
                                            constants.ECL2_START_STOP_SERVER.replace(
                                              "{server_id}",
                                              updatedeploymentsdata.ecl2serverid
                                            );
                                          setTimeout(function () {
                                            commonService
                                              .callECL2Reqest(
                                                "POST",
                                                req.body.region,
                                                req.body.tenantid,
                                                restarturl,
                                                requestheader,
                                                restartrequest,
                                                req.body.ecl2tenantid
                                              )
                                              .then((tenantconndata) => {
                                                appLogger.writeLogToFile(
                                                  "info",
                                                  `Server Stopped..........${restarturl}`
                                                );
                                                setTimeout(function () {
                                                  commonService
                                                    .callECL2Reqest(
                                                      "POST",
                                                      req.body.region,
                                                      req.body.tenantid,
                                                      restarturl,
                                                      requestheader,
                                                      { "os-start": null },
                                                      req.body.ecl2tenantid
                                                    )
                                                    .then((tenantconndata) => {
                                                      appLogger.writeLogToFile(
                                                        "info",
                                                        "Server Started.........."
                                                      );
                                                      setTimeout(function () {
                                                        new ECL2Controller().saveInstance(
                                                          req,
                                                          res,
                                                          deploymentsdata,
                                                          deploymentsdatalist[
                                                            num
                                                          ],
                                                          ecl2servers.server,
                                                          appLogger,
                                                          orchData
                                                        );
                                                      }, 90000);
                                                    })
                                                    .catch((error: Error) => {
                                                      appLogger.writeLogToFile(
                                                        "error",
                                                        `Error in Starting server ${error}`
                                                      );
                                                    });
                                                }, 360000);
                                              })
                                              .catch((error: Error) => {
                                                appLogger.writeLogToFile(
                                                  "error",
                                                  `Error in stopping server ${error}`
                                                );
                                              });
                                          }, 90000);
                                        }

                                        appLogger.writeLogToFile(
                                          "info",
                                          updatedeploymentsdata.serveraddresses
                                        );
                                        let tenantconnectionparams = {
                                          tenantconnrequestid:
                                            element.tenantconnrequestid,
                                          eclttenantconnectionid:
                                            tenantconndata.tenant_connection.id,
                                          tenantid: req.body.tenantid,
                                          customerid: req.body.clientid,
                                          //deviceid: updatedeploymentsdata.ecl2deploymentid,
                                          name: tenantconnlist.tenant_connection
                                            .name,
                                          description:
                                            tenantconnlist.tenant_connection
                                              .description,
                                          devicetype:
                                            tenantconnlist.tenant_connection
                                              .device_type,
                                          deviceinterfaceid:
                                            tenantconnlist.tenant_connection
                                              .device_interface_id,
                                          ecl2tenantidother:
                                            tenantconnlist.tenant_connection
                                              .tenant_id_other,
                                          ecl2networkid:
                                            tenantconnlist.tenant_connection
                                              .network_id,
                                          ecl2deviceid:
                                            tenantconnlist.tenant_connection
                                              .device_id,
                                          ecl2portid:
                                            tenantconnlist.tenant_connection
                                              .port_id,
                                          status: constants.STATUS_ACTIVE,
                                          createdby: req.body.createdby,
                                          createddt: req.body.createddt,
                                          lastupdatedby: req.body.lastupdatedby,
                                          lastupdateddt: req.body.lastupdateddt,
                                        };
                                        commonService
                                          .create(
                                            tenantconnectionparams,
                                            db.ecl2tenantconnection
                                          )
                                          .then((data: any) => {
                                            appLogger.writeLogToFile(
                                              "info",
                                              "CloudMatiq : Tenant connection details updated",
                                              data
                                            );
                                            new ECL2Controller().updateserveraddress(
                                              num,
                                              deploymentsdata,
                                              ecl2solutionsobj,
                                              updatedeploymentsdata,
                                              response,
                                              res,
                                              req,
                                              appLogger
                                            );

                                            //Update deviceid
                                            let query = `UPDATE tbl_ecl2_tenantconnection a 
                                                                        set a.deviceid = (select c.instanceid from tbl_tn_instances c 
                                                                        where c.instancerefid=a.ecl2deviceid AND c.status=:status ORDER BY 1 DESC LIMIT 1)
                                                                        WHERE a.ecl2deviceid = :ecl2deviceid AND a.status=:status`;
                                            let params = {
                                              replacements: {
                                                tenantid: req.body.tenantid,
                                                status: constants.STATUS_ACTIVE,
                                                ecl2deviceid:
                                                  updatedeploymentsdata.ecl2serverid,
                                              },
                                            };
                                            commonService
                                              .executeQuery(
                                                query,
                                                params,
                                                db.sequelize
                                              )
                                              .then((list) => {})
                                              .catch((error: Error) => {
                                                appLogger.writeLogToFile(
                                                  "error",
                                                  error
                                                );
                                              });
                                          })
                                          .catch((error: Error) => {
                                            appLogger.writeLogToFile(
                                              "error",
                                              error
                                            );
                                          });
                                      })
                                      .catch((error: Error) => {
                                        appLogger.writeLogToFile(
                                          "error",
                                          error
                                        );
                                      });
                                  })
                                  .catch((error: Error) => {
                                    appLogger.writeLogToFile("error", error);
                                  });
                              }, 80000);
                            }
                          })
                          .catch((error: Error) => {
                            customValidation.generateAppError(
                              error,
                              response,
                              res,
                              req
                            );
                          });
                      }
                    );
                  } else {
                    let servers = _.map(
                      ecl2servers.server.addresses,
                      function (value, key) {
                        return value[0].addr;
                      }
                    );
                    updatedeploymentsdata.serveraddresses = servers;
                    new ECL2Controller().saveInstance(
                      req,
                      res,
                      deploymentsdata,
                      deploymentsdatalist[num],
                      ecl2servers.server,
                      appLogger,
                      orchData
                    );
                    new ECL2Controller().updateserveraddress(
                      num,
                      deploymentsdata,
                      ecl2solutionsobj,
                      updatedeploymentsdata,
                      response,
                      res,
                      req,
                      appLogger
                    );
                  }
                  appLogger.writeLogToFile(
                    "info",
                    updatedeploymentsdata.status
                  );
                  appLogger.writeLogToFile(
                    "info",
                    updatedeploymentsdata.serveraddresses
                  );
                })
                .catch((error: Error) => {
                  // if (ecl2solutionsobj.length === num + 1) {
                  //     // // appLogger.closeLogger();
                  //     // stream.end();
                  //     // process.stdout.write = pstdout;
                  //     // process.stderr.write = pstderr;
                  // }
                  new ECL2Controller().saveInstance(
                    req,
                    res,
                    deploymentsdata,
                    deploymentsdatalist[num],
                    ecl2servers.server,
                    appLogger,
                    orchData
                  );
                  appLogger.writeLogToFile("error", error);
                });
            })
            .catch((error: Error) => {
              // if (ecl2solutionsobj.length === num + 1) {
              //     // appLogger.closeLogger();
              //     // stream.end();
              //     // process.stdout.write = pstdout;
              //     // process.stderr.write = pstderr;
              // }
              appLogger.writeLogToFile("error", error);
            });
        }
      }, 80000);
    }
  }
  updateserveraddress(
    num: any,
    deploymentsdata: any,
    ecl2solutionsobj: any,
    updatedeploymentsdata: any,
    response: any,
    res: Response,
    req: Request,
    appLogger: AppLogger
  ): void {
    let requesturl = ECLApiURL.GET.SERVERS.replace(
      "{server_id}",
      updatedeploymentsdata.ecl2serverid
    );
    let requestheader = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    let requestparams = {};
    // Get server details
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        requesturl,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2servers) => {
        appLogger.writeLogToFile("info", ecl2servers);
        let servers = _.map(
          ecl2servers.server.addresses,
          function (value, key) {
            return value[0].addr;
          }
        );
        updatedeploymentsdata.serveraddresses = servers;

        let condition = {
          ecl2deploymentid: updatedeploymentsdata.ecl2deploymentid,
        };
        if (ecl2servers.server.status === "ERROR") {
          updatedeploymentsdata.status = constants.STATUS_FAILED;
        } else {
          updatedeploymentsdata.serveraddresses = servers;
        }
        updatedeploymentsdata.lastupdateddt = new Date();
        commonService
          .update(condition, updatedeploymentsdata, db.ecl2deployments)
          .then((data: any) => {
            appLogger.writeLogToFile("info", "VM Creation process updated...");
          })
          .catch((error: Error) => {
            appLogger.writeLogToFile("error", error);
          });

        // if (updatedeploymentsdata.status === 'Deployed' && !customValidation.isEmptyValue(updatedeploymentsdata.serveraddresses)) {
        //     new ECL2Controller().processAPIs(num, updatedeploymentsdata, ecl2solutionsobj, req, res, appLogger);
        // } else {
        //     appLogger.writeLogToFile('info', 'Firewall and loadbalancer configuration failed');
        //     if (ecl2solutionsobj.length === num + 1) {
        //         // stream.end();
        //         // process.stdout.write = pstdout;
        //         // process.stderr.write = pstderr;
        //     }
        // }
        if (
          updatedeploymentsdata.requestid != null &&
          updatedeploymentsdata.requestid !== -1
        ) {
          let srvreqObj = {
            progresspercent: 100,
            lastupdatedby: req.body.lastupdatedby,
            lastupdateddt: req.body.lastupdateddt,
            srstatus: "Deployed",
          };
          commonService
            .update(
              { srvrequestid: updatedeploymentsdata.requestid },
              srvreqObj,
              db.srmsr
            )
            .then((srdata: any) => {
              appLogger.writeLogToFile("info", "Service request updated");
              let sractions = {
                actiontype: "Progress",
                srstatus: "Deployed",
                notes: messages.DEPLOYMENT_NOTE,
                srvrequestid: srdata.dataValues.srvrequestid,
                lastupdatedby: req.body.lastupdatedby,
                lastupdateddt: req.body.lastupdateddt,
              };
              commonService
                .create(sractions, db.srmsractions)
                .then((srmdata) => {
                  appLogger.writeLogToFile("info", "Service Actions added");
                  if (ecl2solutionsobj.length === num + 1) {
                    // appLogger.closeLogger();
                    // stream.end();
                    // process.stdout.write = pstdout;
                    // process.stderr.write = pstderr;
                  }
                })
                .catch((error: Error) => {
                  if (ecl2solutionsobj.length === num + 1) {
                    // appLogger.closeLogger();
                    // stream.end();
                    // process.stdout.write = pstdout;
                    // process.stderr.write = pstderr;
                  }
                  throw error;
                });
            })
            .catch((error: Error) => {
              if (ecl2solutionsobj.length === num + 1) {
                // appLogger.closeLogger();
                // stream.end();
                // process.stdout.write = pstdout;
                // process.stderr.write = pstderr;
              }
              throw error;
            });
        }
      })
      .catch((error: Error) => {
        if (ecl2solutionsobj.length === num + 1) {
          // appLogger.closeLogger();
          // stream.end();
          // process.stdout.write = pstdout;
          // process.stderr.write = pstderr;
        }
        appLogger.writeLogToFile("error", error);
      });
  }
  processvsrxCalls(req: any, res: any): void {
    let response = {};
    try {
      if (customValidation.isEmptyValue(req.body.ecl2serverid)) {
        console.log("Invalid Parameters");
        customValidation.generateAppError(
          "",
          new AppError("Invalid Parameters"),
          res,
          req
        );
      } else {
        let requesturl = ECLApiURL.GET.SERVERS.replace(
          "{server_id}",
          req.body.ecl2serverid
        );
        let requestheader = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };
        let requestparams = {};
        commonService
          .callECL2Reqest(
            "GET",
            req.body.region,
            req.body.tenantid,
            requesturl,
            requestheader,
            requestparams,
            req.body.ecl2tenantid
          )
          .then((ecl2servers) => {
            if (customValidation.isEmptyValue(ecl2servers)) {
              console.log("There is no valid instance found");
            } else {
              let servers = _.map(
                ecl2servers.server.addresses,
                function (value, key) {
                  return value[0].addr;
                }
              );
              let parameters = {} as any;
              parameters.where = { ecl2solutionid: req.body.ecl2solutionid };
              parameters.include = [
                {
                  model: db.ecl2vsrx,
                  as: "ecl2vsrx",
                  required: false,
                  paranoid: false,
                  include: [
                    {
                      model: db.ecl2vsrxinterface,
                      as: "ecl2vsrxinterface",
                      required: false,
                      paranoid: false,
                    },
                  ],
                },
                {
                  model: db.ecl2internetgateways,
                  as: "ecl2internetgateways",
                  required: false,
                  paranoid: false,
                  include: [
                    {
                      model: db.ecl2iginterface,
                      as: "ecl2iginterface",
                      paranoid: false,
                      required: false,
                      include: [
                        {
                          model: db.ecl2networks,
                          as: "ecl2networks",
                          required: false,
                          paranoid: false,
                          include: [
                            {
                              model: db.ecl2subnets,
                              as: "ecl2subnets",
                              required: false,
                              paranoid: false,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ];
              commonService
                .getData(parameters, db.ecl2solutions)
                .then((data: any) => {
                  let deploymentdata: any;
                  deploymentdata = data;
                  let vsrxrequestparams: any;
                  let ipaddress = "localhost";
                  vsrxrequestparams = deploymentdata.ecl2vsrx;
                  let vsrxdata = _.find(
                    deploymentdata.ecl2vsrx.ecl2vsrxinterface,
                    function (item: any) {
                      if (
                        item.networkid ===
                        deploymentdata.ecl2internetgateways.ecl2iginterface[0]
                          .networkid
                      ) {
                        return item;
                      }
                    }
                  );
                  let subnetdetails =
                    deploymentdata.ecl2internetgateways.ecl2iginterface[0]
                      .ecl2networks.ecl2subnets[0];
                  if (!_.isEmpty(vsrxdata)) {
                    if (
                      customValidation.isEmptyValue(
                        subnetdetails.unallocatedips
                      )
                    ) {
                      console.log(
                        "There is no available ips to assign publicipv4"
                      );
                      let condition = {
                        ecl2deploymentid: req.body.ecl2deploymentid,
                      };
                      let parameters: any = { privateipv4: servers[0] };
                      parameters.lastupdateddt = new Date();
                      commonService
                        .update(condition, parameters, db.ecl2deployments)
                        .then((ecl2deploy) => {
                          console.log("publicipv4 updated... ");
                          customValidation.generateAppError(
                            new AppError(
                              "There is no available ips to assign publicipv4"
                            ),
                            response,
                            res,
                            req
                          );
                        })
                        .catch((error: Error) => {
                          console.log(error);
                          customValidation.generateAppError(
                            error,
                            response,
                            res,
                            req
                          );
                        });
                    } else {
                      ipaddress = vsrxdata.ipaddress;
                      let reqvsrxurl = constants.VSRX_RPC_URL.replace(
                        "{ip}",
                        ipaddress
                      );
                      vsrxrequestparams.vsrx =
                        '<load-configuration action="merge" format="xml"><configuration><security><nat> <destination><pool><name>' +
                        req.body.instancename +
                        "</name><address><ipaddr>" +
                        servers[0] +
                        "</ipaddr> </address> </pool><rule-set><name>incoming</name><from><zone>untrust</zone></from><rule><name>" +
                        req.body.instancename +
                        "</name><dest-nat-rule-match><destination-address><dst-addr>" +
                        subnetdetails.unallocatedips[0] +
                        "</dst-addr></destination-address></dest-nat-rule-match><then><destination-nat><pool><pool-name>" +
                        req.body.instancename +
                        "</pool-name></pool></destination-nat></then></rule></rule-set></destination> </nat> <policies><policy><from-zone-name>untrust</from-zone-name><to-zone-name>trust</to-zone-name><policy><name>" +
                        req.body.instancename +
                        "</name><match><source-address>any</source-address><destination-address>" +
                        servers[0] +
                        "</destination-address><application>junos-https</application><application>junos-ping</application></match> <then><permit></permit></then></policy></policy></policies><zones><security-zone><name>trust</name><address-book><address><name>" +
                        servers[0] +
                        "</name><ip-prefix>" +
                        servers[0] +
                        "</ip-prefix></address></address-book></security-zone></zones> </security></configuration></load-configuration><commit-configuration/>";
                      commonService
                        .callVSRX("POST", reqvsrxurl, "", vsrxrequestparams)
                        .then((result) => {
                          console.log("VSRX Configured", result);
                          if (result.status === true) {
                            let unusedips =
                              deploymentdata.ecl2internetgateways
                                .ecl2iginterface[0].ecl2networks.ecl2subnets[0]
                                .unallocatedips;
                            let condition = {
                              subnetid:
                                deploymentdata.ecl2internetgateways
                                  .ecl2iginterface[0].ecl2networks
                                  .ecl2subnets[0].subnetid,
                            };
                            let remainingunallocatedips = _.remove(
                              unusedips,
                              function (o: any) {
                                if (o === subnetdetails.unallocatedips[0]) {
                                  return o;
                                }
                              }
                            );
                            let allocatedips = [];
                            allocatedips = !_.isEmpty(
                              subnetdetails.allocatedips
                            )
                              ? subnetdetails.allocatedips
                              : [];
                            allocatedips.push(subnetdetails.unallocatedips[0]);
                            let parameters = {
                              unallocatedips: unusedips,
                              allocatedips: allocatedips,
                            };
                            let vsrxdestination = {
                              type: "DESTINATIONNAT",
                              vsrxid: vsrxrequestparams.vsrxid,
                              username: vsrxrequestparams.username,
                              password: vsrxrequestparams.password,
                              ipaddress: ipaddress,
                              rulename: deploymentdata.instancename,
                              fromzone: "untrust",
                              pooladdress: servers[0],
                              matchaddress: remainingunallocatedips[0],
                            };
                            let vsrxpolicy = {
                              type: "SECPOLICY",
                              vsrxid: vsrxrequestparams.vsrxid,
                              username: vsrxrequestparams.username,
                              password: vsrxrequestparams.password,
                              ipaddress: ipaddress,
                              rulename: deploymentdata.instancename,
                              advancedrule: "<permit></permit>",
                              sourcezone: "untrust",
                              sourceaddress: "any",
                              destinationaddress: servers[0],
                              destinationzone: "trust",
                            };
                            let existingdestinationNAT = !_.isEmpty(
                              JSON.parse(vsrxrequestparams.destinationnat)
                            )
                              ? JSON.parse(vsrxrequestparams.destinationnat)
                              : [];
                            let existingsecuritypolicy = !_.isEmpty(
                              JSON.parse(vsrxrequestparams.securitypolicy)
                            )
                              ? JSON.parse(vsrxrequestparams.securitypolicy)
                              : [];
                            existingdestinationNAT.push(vsrxdestination);
                            existingsecuritypolicy.push(vsrxpolicy);
                            let inputs = {
                              destinationnat: JSON.stringify(
                                existingdestinationNAT
                              ),
                              securitypolicy: JSON.stringify(
                                existingsecuritypolicy
                              ),
                            };
                            let vsrxcondition = {
                              vsrxid: vsrxrequestparams.vsrxid,
                            };
                            commonService
                              .update(vsrxcondition, inputs, db.ecl2vsrx)
                              .then((vsrxupdatedata) => {
                                console.log("VSRX updated");
                                commonService
                                  .update(condition, parameters, db.ecl2subnets)
                                  .then((result) => {
                                    console.log("Subnet updated");
                                    let condition = {
                                      ecl2deploymentid:
                                        req.body.ecl2deploymentid,
                                    };
                                    let parameters: any = {
                                      fwconflictstatus: "Active",
                                      publicipv4: remainingunallocatedips[0],
                                      privateipv4: req.body.serveraddresses[0],
                                    };
                                    console.log(
                                      "param",
                                      remainingunallocatedips[0]
                                    );
                                    parameters.lastupdateddt = new Date();
                                    commonService
                                      .update(
                                        condition,
                                        parameters,
                                        db.ecl2deployments
                                      )
                                      .then((ecl2deploy) => {
                                        console.log("Firewall status updated");
                                        customValidation.generateSuccessResponse(
                                          ecl2deploy,
                                          response,
                                          constants.RESPONSE_TYPE_UPDATE,
                                          res,
                                          req
                                        );
                                      })
                                      .catch((error: Error) => {
                                        console.log(error);
                                        customValidation.generateAppError(
                                          error,
                                          response,
                                          res,
                                          req
                                        );
                                      });
                                  })
                                  .catch((error: Error) => {
                                    console.log(error);
                                    customValidation.generateAppError(
                                      error,
                                      response,
                                      res,
                                      req
                                    );
                                  });
                              })
                              .catch((error: Error) => {
                                console.log(error);
                                customValidation.generateAppError(
                                  error,
                                  response,
                                  res,
                                  req
                                );
                              });
                          } else {
                            customValidation.generateAppError(
                              result,
                              response,
                              res,
                              req
                            );
                          }
                        })
                        .catch((error: Error) => {
                          customValidation.generateAppError(
                            error,
                            response,
                            res,
                            req
                          );
                        });
                    }
                  }
                })
                .catch((error: Error) => {
                  customValidation.generateAppError(error, response, res, req);
                });
            }
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      }
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }

  processAPIs(
    num: number,
    deploymentsdata: any,
    ecl2solutionsobj: any,
    req: Request,
    res: Response,
    appLogger: AppLogger
  ): void {
    try {
      if (
        ecl2solutionsobj[num].ecl2vsrx &&
        null != ecl2solutionsobj[num].ecl2vsrx
      ) {
        let inputparam = {};
        let vsrxrequestparams: any;
        let ipaddress = "localhost";
        vsrxrequestparams = ecl2solutionsobj[num].ecl2vsrx;
        let vsrxdata = _.find(
          ecl2solutionsobj[num].ecl2vsrx.ecl2vsrxinterface,
          function (item: any) {
            if (
              item.networkid ===
              ecl2solutionsobj[num].ecl2internetgateways.ecl2iginterface[0]
                .networkid
            ) {
              return item;
            }
          }
        );
        let subnetdetails =
          ecl2solutionsobj[num].ecl2internetgateways.ecl2iginterface[0]
            .ecl2networks.ecl2subnets[0];
        // console.log('VSRX', vsrxdata);
        appLogger.writeLogToFile("info", "------------------------------");
        appLogger.writeLogToFile(
          "info",
          num + 1 + " Firewall configuration started..."
        );
        appLogger.writeLogToFile("info", "------------------------------");

        if (!_.isEmpty(vsrxdata)) {
          if (customValidation.isEmptyValue(subnetdetails.unallocatedips)) {
            appLogger.writeLogToFile(
              "info",
              "There is no available ip to assign publicipv4"
            );
            if (ecl2solutionsobj.length === num + 1) {
              // stream.end();
              // process.stdout.write = pstdout;
              // process.stderr.write = pstderr;
            }
          } else {
            if (
              customValidation.isEmptyValue(
                deploymentsdata.serveraddresses[num]
              )
            ) {
              let condition = {
                ecl2deploymentid: deploymentsdata.ecl2deploymentid,
              };
              appLogger.writeLogToFile("info", subnetdetails.unallocatedips);
              let parameters: any = {
                fwconflictstatus: "Failed",
                lbconflictstatus: "Failed",
              };
              appLogger.writeLogToFile("info", parameters);
              parameters.lastupdateddt = new Date();
              commonService
                .update(condition, parameters, db.ecl2deployments)
                .then((ecl2deploy) => {
                  appLogger.writeLogToFile(
                    "info",
                    "Server adderss not yet received"
                  );
                  appLogger.writeLogToFile("info", "Firewall status : Failed");
                  appLogger.writeLogToFile(
                    "info",
                    "Loadbalancer status : Failed"
                  );
                  if (ecl2solutionsobj.length === num + 1) {
                    // stream.end();
                    // process.stdout.write = pstdout;
                    // process.stderr.write = pstderr;
                  }
                })
                .catch((error: Error) => {
                  appLogger.writeLogToFile("error", error);
                  if (ecl2solutionsobj.length === num + 1) {
                    // appLogger.closeLogger();
                    // stream.end();
                    // process.stdout.write = pstdout;
                    // process.stderr.write = pstderr;
                  }
                });
            } else {
              ipaddress = vsrxdata.ipaddress;
              appLogger.writeLogToFile(
                "info",
                "VSRX public IP address : " + ipaddress
              );
              appLogger.writeLogToFile(
                "info",
                "------------------------------"
              );
              appLogger.writeLogToFile(
                "info",
                "VM private IP address : " +
                  deploymentsdata.serveraddresses[num]
              );
              appLogger.writeLogToFile(
                "info",
                "VM public IP address : " + subnetdetails.unallocatedips[0]
              );
              appLogger.writeLogToFile(
                "info",
                "------------------------------"
              );

              let reqvsrxurl = constants.VSRX_RPC_URL.replace(
                "{ip}",
                ipaddress
              );
              vsrxrequestparams.vsrx =
                '<load-configuration action="merge" format="xml"><configuration><security><nat> <destination><pool><name>' +
                deploymentsdata.instancename +
                "</name><address><ipaddr>" +
                deploymentsdata.serveraddresses[num] +
                "</ipaddr> </address> </pool><rule-set><name>incoming</name><from><zone>untrust</zone></from><rule><name>" +
                deploymentsdata.instancename +
                "</name><dest-nat-rule-match><destination-address><dst-addr>" +
                subnetdetails.unallocatedips[0] +
                "</dst-addr></destination-address></dest-nat-rule-match><then><destination-nat><pool><pool-name>" +
                deploymentsdata.instancename +
                "</pool-name></pool></destination-nat></then></rule></rule-set></destination> </nat> <policies><policy><from-zone-name>untrust</from-zone-name><to-zone-name>trust</to-zone-name><policy><name>" +
                deploymentsdata.instancename +
                "</name><match><source-address>any</source-address><destination-address>" +
                deploymentsdata.serveraddresses[num] +
                "</destination-address><application>junos-https</application><application>junos-ping</application></match> <then><permit></permit></then></policy></policy></policies><zones><security-zone><name>trust</name><address-book><address><name>" +
                deploymentsdata.serveraddresses[num] +
                "</name><ip-prefix>" +
                deploymentsdata.serveraddresses[num] +
                "</ip-prefix></address></address-book></security-zone></zones> </security></configuration></load-configuration><commit-configuration/>";
              commonService
                .callVSRX("POST", reqvsrxurl, "", vsrxrequestparams)
                .then((result) => {
                  appLogger.writeLogToFile("info", "VSRX Configured", result);

                  if (result.status === true) {
                    appLogger.writeLogToFile(
                      "info",
                      "VSRX : Public ip allocated"
                    );
                    let unusedips =
                      ecl2solutionsobj[num].ecl2internetgateways
                        .ecl2iginterface[0].ecl2networks.ecl2subnets[0]
                        .unallocatedips;
                    let condition = {
                      subnetid:
                        ecl2solutionsobj[num].ecl2internetgateways
                          .ecl2iginterface[0].ecl2networks.ecl2subnets[0]
                          .subnetid,
                    };
                    let remainingunallocatedips = _.remove(
                      unusedips,
                      function (o: any) {
                        if (o === subnetdetails.unallocatedips[0]) {
                          return o;
                        }
                      }
                    );
                    let allocatedips = [];
                    allocatedips = !_.isEmpty(subnetdetails.allocatedips)
                      ? subnetdetails.allocatedips
                      : [];
                    allocatedips.push(subnetdetails.unallocatedips[0]);

                    let parameters = {
                      unallocatedips: unusedips,
                      allocatedips: allocatedips,
                    };
                    let vsrxdestination = {
                      type: "DESTINATIONNAT",
                      vsrxid: vsrxrequestparams.vsrxid,
                      username: vsrxrequestparams.username,
                      password: vsrxrequestparams.password,
                      ipaddress: ipaddress,
                      rulename: deploymentsdata.instancename,
                      fromzone: "untrust",
                      pooladdress: deploymentsdata.serveraddresses[num],
                      matchaddress: remainingunallocatedips[0],
                    };
                    let vsrxpolicy = {
                      type: "SECPOLICY",
                      vsrxid: vsrxrequestparams.vsrxid,
                      username: vsrxrequestparams.username,
                      password: vsrxrequestparams.password,
                      ipaddress: ipaddress,
                      rulename: deploymentsdata.instancename,
                      advancedrule: "<permit></permit>",
                      sourcezone: "untrust",
                      sourceaddress: "any",
                      destinationaddress: deploymentsdata.serveraddresses[num],
                      destinationzone: "trust",
                    };
                    let existingdestinationNAT = !_.isEmpty(
                      JSON.parse(vsrxrequestparams.destinationnat)
                    )
                      ? JSON.parse(vsrxrequestparams.destinationnat)
                      : [];
                    let existingsecuritypolicy = !_.isEmpty(
                      JSON.parse(vsrxrequestparams.securitypolicy)
                    )
                      ? JSON.parse(vsrxrequestparams.securitypolicy)
                      : [];
                    existingdestinationNAT.push(vsrxdestination);
                    existingsecuritypolicy.push(vsrxpolicy);
                    let inputs = {
                      destinationnat: JSON.stringify(existingdestinationNAT),
                      securitypolicy: JSON.stringify(existingsecuritypolicy),
                    };
                    let vsrxcondition = { vsrxid: vsrxrequestparams.vsrxid };
                    commonService
                      .update(vsrxcondition, inputs, db.ecl2vsrx)
                      .then((vsrxupdatedata) => {
                        appLogger.writeLogToFile(
                          "info",
                          "CloudMatiq : NAT and Secuirty policy details updated"
                        );
                        commonService
                          .update(condition, parameters, db.ecl2subnets)
                          .then((result) => {
                            appLogger.writeLogToFile(
                              "info",
                              "CloudMatiq : Subnet - Allocated and unallocated ips updated"
                            );
                            let condition = {
                              ecl2deploymentid:
                                deploymentsdata.ecl2deploymentid,
                            };
                            appLogger.writeLogToFile(
                              "info",
                              subnetdetails.unallocatedips
                            );
                            let parameters: any = {
                              fwconflictstatus: "Active",
                              privateipv4: deploymentsdata.serveraddresses[num],
                              publicipv4: remainingunallocatedips[0],
                            };
                            parameters.lastupdateddt = new Date();
                            commonService
                              .update(condition, parameters, db.ecl2deployments)
                              .then((ecl2deploy) => {
                                appLogger.writeLogToFile(
                                  "info",
                                  "-----> Firewall configuration completed <------- "
                                );

                                appLogger.writeLogToFile(
                                  "info",
                                  "------------------------------"
                                );
                                appLogger.writeLogToFile(
                                  "info",
                                  "Loadbalancer configuration started..."
                                );
                                appLogger.writeLogToFile(
                                  "info",
                                  "------------------------------"
                                );

                                if (
                                  _.isEmpty(req.body.solution.ecl2loadbalancers)
                                ) {
                                  appLogger.writeLogToFile(
                                    "info",
                                    "Info : No loadbalancer attached with this template"
                                  );
                                  appLogger.writeLogToFile(
                                    "info",
                                    "Loadbalancer configuration failed..."
                                  );
                                  if (ecl2solutionsobj.length === num + 1) {
                                    // appLogger.closeLogger();
                                    // stream.end();
                                    // process.stdout.write = pstdout;
                                    // process.stderr.write = pstderr;
                                  }
                                } else {
                                  // Compare both instance networks and lb interface networks
                                  let solutionnetwork = _.map(
                                    ecl2solutionsobj[num].ecl2networks,
                                    function (item: any) {
                                      return item.networkid;
                                    }
                                  );
                                  let eclLoadbalancers: any =
                                    req.body.solution.ecl2loadbalancers;
                                  let selectedloadbalancer: any;
                                  eclLoadbalancers.forEach((element) => {
                                    _.find(
                                      element.ecl2solutionid,
                                      function (item: any) {
                                        if (
                                          item ===
                                          ecl2solutionsobj[num].ecl2solutionid
                                        ) {
                                          selectedloadbalancer = element;
                                          return selectedloadbalancer;
                                        }
                                      }
                                    );
                                  });

                                  appLogger.writeLogToFile(
                                    "info",
                                    "lbobj",
                                    selectedloadbalancer
                                  );
                                  if (
                                    customValidation.isEmptyValue(
                                      selectedloadbalancer
                                    )
                                  ) {
                                    appLogger.writeLogToFile(
                                      "info",
                                      "The server is not attached in Loadbalancer"
                                    );
                                    if (ecl2solutionsobj.length === num + 1) {
                                      // appLogger.closeLogger();
                                      // stream.end();
                                      // process.stdout.write = pstdout;
                                      // process.stderr.write = pstderr;
                                    }
                                  } else {
                                    //   eclLoadbalancers.forEach(element => {
                                    let lbinterfaces = _.map(
                                      selectedloadbalancer.ecl2lbinterface,
                                      function (item: any) {
                                        return item.networkid;
                                      }
                                    );
                                    let commonnetwork = _.intersection(
                                      lbinterfaces,
                                      solutionnetwork
                                    );
                                    appLogger.writeLogToFile(
                                      "info",
                                      lbinterfaces
                                    );
                                    appLogger.writeLogToFile(
                                      "info",
                                      solutionnetwork
                                    );
                                    appLogger.writeLogToFile(
                                      "info",
                                      commonnetwork
                                    );
                                    if (_.isEmpty(commonnetwork)) {
                                      appLogger.writeLogToFile(
                                        "info",
                                        "Info : No common network in loadbalancer and solution or no network attached"
                                      );
                                      appLogger.writeLogToFile(
                                        "info",
                                        "Loadbalancer configuration failed..."
                                      );
                                      if (ecl2solutionsobj.length === num + 1) {
                                        // appLogger.closeLogger();
                                        // stream.end();
                                        // process.stdout.write = pstdout;
                                        // process.stderr.write = pstderr;
                                      }
                                    } else {
                                      if (
                                        _.isEmpty(
                                          selectedloadbalancer.defaultgwnetwork
                                        )
                                      ) {
                                        appLogger.writeLogToFile(
                                          "info",
                                          "No default gateway attached"
                                        );
                                        appLogger.writeLogToFile(
                                          "info",
                                          "Loadbalancer configuration failed..."
                                        );
                                        if (
                                          ecl2solutionsobj.length ===
                                          num + 1
                                        ) {
                                          // appLogger.closeLogger();
                                          // stream.end();
                                          // process.stdout.write = pstdout;
                                          // process.stderr.write = pstderr;
                                        }
                                      } else {
                                        let ipconfig: any;
                                        let vsrxipconfig: any;
                                        ipconfig = _.find(
                                          selectedloadbalancer.ecl2lbinterface,
                                          {
                                            networkid:
                                              selectedloadbalancer
                                                .defaultgwnetwork.networkid,
                                          }
                                        );
                                        appLogger.writeLogToFile(
                                          "info",
                                          ipconfig.ipaddress
                                        );
                                        deploymentsdata.ipconfig = ipconfig;
                                        let parameters = {} as any;
                                        parameters.where = {
                                          tenantid: req.body.tenantid,
                                        };
                                        commonService
                                          .getAllList(parameters, db.ecl2vsrx)
                                          .then((list: any) => {
                                            list.forEach((vsrxlist) => {
                                              if (
                                                !_.isEmpty(
                                                  vsrxlist.destinationnat
                                                )
                                              ) {
                                                let natObj = JSON.parse(
                                                  vsrxlist.destinationnat
                                                );
                                                _.map(
                                                  natObj,
                                                  function (item: any) {
                                                    if (
                                                      item.pooladdress ===
                                                      ipconfig.ipaddress
                                                    ) {
                                                      deploymentsdata.ipaddress =
                                                        item.matchaddress;
                                                      selectedloadbalancer.ecl2lbsettings =
                                                        req.body.solution.ecl2lbsettings[0];
                                                      try {
                                                        new ECL2Controller().executeCitrixCalls(
                                                          num,
                                                          "",
                                                          deploymentsdata,
                                                          selectedloadbalancer,
                                                          ecl2solutionsobj,
                                                          req,
                                                          res
                                                        );
                                                      } catch (e) {
                                                        console.log(e);
                                                        if (
                                                          ecl2solutionsobj.length ===
                                                          num + 1
                                                        ) {
                                                          // appLogger.closeLogger();
                                                          // stream.end();
                                                          // process.stdout.write = pstdout;
                                                          // process.stderr.write = pstderr;
                                                        }
                                                      }
                                                    }
                                                  }
                                                );
                                              } else {
                                                appLogger.writeLogToFile(
                                                  "info",
                                                  "Info : Loadbalancer can not be accessed"
                                                );
                                                appLogger.writeLogToFile(
                                                  "info",
                                                  "Loadbalancer configuration failed..."
                                                );
                                              }
                                            });
                                          })
                                          .catch((error: Error) => {
                                            appLogger.writeLogToFile(
                                              "info",
                                              error
                                            );
                                            if (
                                              ecl2solutionsobj.length ===
                                              num + 1
                                            ) {
                                              // appLogger.closeLogger();
                                              // stream.end();
                                              // process.stdout.write = pstdout;
                                              // process.stderr.write = pstderr;
                                            }
                                          });
                                      }
                                    }
                                    //  });
                                  }
                                }
                              })
                              .catch((error: Error) => {
                                appLogger.writeLogToFile("info", error);
                                if (ecl2solutionsobj.length === num + 1) {
                                  // appLogger.closeLogger();
                                  // stream.end();
                                  // process.stdout.write = pstdout;
                                  // process.stderr.write = pstderr;
                                }
                              });
                          })
                          .catch((error: Error) => {
                            appLogger.writeLogToFile("info", error);
                            if (ecl2solutionsobj.length === num + 1) {
                              // appLogger.closeLogger();
                              // stream.end();
                              // process.stdout.write = pstdout;
                              // process.stderr.write = pstderr;
                            }
                          });
                      })
                      .catch((error: Error) => {
                        appLogger.writeLogToFile("info", error);
                        if (ecl2solutionsobj.length === num + 1) {
                          // appLogger.closeLogger();
                          // stream.end();
                          // process.stdout.write = pstdout;
                          // process.stderr.write = pstderr;
                        }
                      });
                  } else {
                    appLogger.writeLogToFile(
                      "info",
                      "VSRX : Public ip allocation failed"
                    );
                  }
                })
                .catch((error: Error) => {
                  appLogger.writeLogToFile(
                    "info",
                    "VSRX : Public ip allocation failed"
                  );
                  appLogger.writeLogToFile("info", error);
                  if (ecl2solutionsobj.length === num + 1) {
                    // appLogger.closeLogger();
                    // stream.end();
                    // process.stdout.write = pstdout;
                    // process.stderr.write = pstderr;
                  }
                });
            }
          }
        } else {
          if (ecl2solutionsobj.length === num + 1) {
            // appLogger.closeLogger();
            // stream.end();
            // process.stdout.write = pstdout;
            // process.stderr.write = pstderr;
          }
        }
      }
    } catch (e) {
      appLogger.writeLogToFile("info", e);
      if (ecl2solutionsobj.length === num + 1) {
        // appLogger.closeLogger();
        // stream.end();
        // process.stdout.write = pstdout;
        // process.stderr.write = pstderr;
      }
    }
  }
  processCitrixCalls(req: Request, res: Response): void {
    console.log(req.body);
    let response = {};
    if (customValidation.isEmptyValue(req.body.ecl2serverid)) {
      console.log("Invalid Parameters");
      customValidation.generateAppError(
        "",
        new AppError("Invalid Parameters"),
        res,
        req
      );
    } else {
      let condition = {} as any;
      condition.where = { solutionid: req.body.solutionid };
      commonService
        .getData(condition, db.ecl2loadbalancers)
        .then((ecl2lbdata) => {
          if (customValidation.isEmptyValue(ecl2lbdata)) {
            customValidation.generateAppError(
              new AppError("No loadbalancer attached with this template"),
              response,
              res,
              req
            );
          } else {
            let requesturl = ECLApiURL.GET.SERVERS.replace(
              "{server_id}",
              req.body.ecl2serverid
            );
            let requestheader = {
              Accept: "application/json",
              "Content-Type": "application/json",
            };
            let requestparams = {};
            commonService
              .callECL2Reqest(
                "GET",
                req.body.region,
                req.body.tenantid,
                requesturl,
                requestheader,
                requestparams,
                req.body.ecl2tenantid
              )
              .then((ecl2servers) => {
                if (customValidation.isEmptyValue(ecl2servers)) {
                  console.log("There is no valid instance found");
                } else {
                  let parameters = {} as any;
                  let deploymentsdata = {} as any;
                  deploymentsdata = req.body;
                  let condition = { solutionid: req.body.solutionid };
                  parameters = { where: condition };
                  commonService
                    .getData(parameters, db.ecl2lbsettings)
                    .then((lbsettings) => {
                      parameters.include = [
                        {
                          model: db.ecl2lbinterface,
                          as: "ecl2lbinterface",
                          required: false,
                          paranoid: false,
                        },
                        {
                          model: db.ecl2networks,
                          as: "defaultgwnetwork",
                          required: false,
                          paranoid: false,
                        },
                      ];
                      commonService
                        .getAllList(parameters, db.ecl2loadbalancers)
                        .then((data) => {
                          console.log("Details", JSON.stringify(data));
                          let solutionnetwork = req.body.ecl2networks;
                          data.forEach((element) => {
                            let lbinterfaces = _.map(
                              element.ecl2lbinterface,
                              function (item: any) {
                                return item.networkid;
                              }
                            );
                            let commonnetwork = _.intersection(
                              lbinterfaces,
                              solutionnetwork
                            );
                            console.log(lbinterfaces);
                            console.log(solutionnetwork);
                            console.log(commonnetwork);
                            if (_.isEmpty(commonnetwork)) {
                              console.log(
                                "No common network in loadbalancer and solution or no network attached"
                              );
                              customValidation.generateAppError(
                                new AppError(
                                  "No common network in loadbalancer and solution or no network attached"
                                ),
                                response,
                                res,
                                req
                              );
                            } else {
                              if (_.isEmpty(element.defaultgwnetwork)) {
                                console.log("No default gateway attached");
                                customValidation.generateAppError(
                                  new AppError("No default gateway attached"),
                                  response,
                                  res,
                                  req
                                );
                              } else {
                                let ipconfig: any;
                                let vsrxipconfig: any;
                                ipconfig = _.find(element.ecl2lbinterface, {
                                  networkid: element.defaultgwnetwork.networkid,
                                });
                                console.log(ipconfig.ipaddress);
                                deploymentsdata.ipconfig = ipconfig;
                                let parameters = {} as any;
                                parameters.where = {
                                  tenantid: req.body.tenantid,
                                };
                                commonService
                                  .getAllList(parameters, db.ecl2vsrx)
                                  .then((list: any) => {
                                    list.forEach((vsrxlist) => {
                                      if (!_.isEmpty(vsrxlist.destinationnat)) {
                                        let natObj = JSON.parse(
                                          vsrxlist.destinationnat
                                        );
                                        _.map(natObj, function (item: any) {
                                          if (
                                            item.pooladdress ===
                                            ipconfig.ipaddress
                                          ) {
                                            deploymentsdata.ipaddress =
                                              item.matchaddress;
                                            element.ecl2lbsettings = lbsettings;
                                            new ECL2Controller().executeCitrixCalls(
                                              1,
                                              "RETRY",
                                              deploymentsdata,
                                              element,
                                              [0],
                                              req,
                                              res
                                            );
                                          }
                                        });
                                      }
                                    });
                                  })
                                  .catch((error: Error) => {
                                    console.log(error);
                                    customValidation.generateAppError(
                                      error,
                                      response,
                                      res,
                                      req
                                    );
                                  });
                              }
                            }
                          });
                        })
                        .catch((error: Error) => {
                          console.log(error);
                          customValidation.generateAppError(
                            error,
                            response,
                            res,
                            req
                          );
                        });
                    });
                }
              })
              .catch((error: Error) => {
                console.log(error);
                customValidation.generateAppError(error, response, res, req);
              });
          }
        })
        .catch((error: Error) => {
          console.log(error);
          // customValidation.generateAppError(error, response, res, req);
        });
    }
  }
  executeCitrixCalls(
    num: number,
    flag,
    deploymentsdata: any,
    lbObj: any,
    ecl2solutionsobj: any,
    req: Request,
    res: Response
  ): void {
    let ipaddress = deploymentsdata.ipaddress;
    let credentials = lbObj;
    let primaryinstance = true;
    console.log("LB No------>" + num);
    console.log("LB No------>" + lbObj.attachedservers);
    console.log(
      "LB No------>" + customValidation.isEmptyValue(lbObj.attachedservers)
    );

    if (num > 0 || !customValidation.isEmptyValue(lbObj.attachedservers)) {
      primaryinstance = false;
    }
    let serverattached = false;
    citrixService
      .enableFeatures(
        "",
        ipaddress,
        credentials,
        primaryinstance,
        serverattached
      )
      .then((responsedata) => {
        console.log("Citrix : Features enabled");
        if (responsedata.status) {
          citrixService
            .enableModes(
              "",
              ipaddress,
              credentials,
              primaryinstance,
              serverattached
            )
            .then((responsedata) => {
              console.log("Citrix :  Modes enabled");
              if (responsedata.status) {
                citrixService
                  .createVMAC(
                    JSON.parse(deploymentsdata.ipconfig.vmac),
                    ipaddress,
                    credentials,
                    primaryinstance,
                    serverattached
                  )
                  .then((responsedata) => {
                    console.log("Citrix : LB VMAC created");
                    if (responsedata.status) {
                      citrixService
                        .createIPs(
                          JSON.parse(deploymentsdata.ipconfig.ip),
                          ipaddress,
                          credentials,
                          primaryinstance,
                          serverattached
                        )
                        .then((responsedata) => {
                          if (responsedata.status) {
                            console.log("Citrix : IP created");
                            let lbserver = lbObj.ecl2lbsettings.lbserver;
                            lbserver.name = deploymentsdata.instancename;
                            lbserver.ipaddress =
                              deploymentsdata.serveraddresses[0];
                            citrixService
                              .createLBServer(
                                lbserver,
                                ipaddress,
                                credentials,
                                primaryinstance,
                                serverattached
                              )
                              .then((responsedata) => {
                                if (
                                  responsedata.status ||
                                  responsedata.errorcode === 273
                                ) {
                                  console.log("Citrix : LB server created");
                                  primaryinstance = true;
                                  citrixService
                                    .createLBServiceGroup(
                                      lbObj.ecl2lbsettings.servicegroup,
                                      ipaddress,
                                      credentials,
                                      primaryinstance,
                                      serverattached
                                    )
                                    .then((sgresponsedata: any) => {
                                      if (
                                        sgresponsedata.status ||
                                        sgresponsedata.errorcode === 273
                                      ) {
                                        console.log(
                                          "Citrix : service group created"
                                        );
                                        let servicegroupmemberbinding =
                                          lbObj.ecl2lbsettings
                                            .servicegroupmemberbindings;
                                        servicegroupmemberbinding.servername =
                                          lbserver.name;
                                        citrixService
                                          .createSGMemberBinding(
                                            servicegroupmemberbinding,
                                            ipaddress,
                                            credentials,
                                            primaryinstance,
                                            serverattached
                                          )
                                          .then((responsedata) => {
                                            if (
                                              responsedata.status ||
                                              responsedata.errorcode === 273
                                            ) {
                                              console.log(
                                                "Citrix : Service group member binding completed"
                                              );
                                              citrixService
                                                .createSGMonitorbinding(
                                                  lbObj.ecl2lbsettings
                                                    .servicegroupmonitorbindings,
                                                  ipaddress,
                                                  credentials,
                                                  primaryinstance,
                                                  serverattached
                                                )
                                                .then((responsedata) => {
                                                  if (
                                                    responsedata.status ||
                                                    responsedata.errorcode ===
                                                      2133
                                                  ) {
                                                    console.log(
                                                      "Citrix : Service group monitor binding completed"
                                                    );
                                                    let lbvserver =
                                                      lbObj.ecl2lbsettings
                                                        .lbvserver;
                                                    lbvserver.ipv46 =
                                                      !_.isEmpty(
                                                        deploymentsdata.virtualipaddress
                                                      )
                                                        ? deploymentsdata.virtualipaddress
                                                        : lbObj
                                                            .attachedservers[0];
                                                    primaryinstance = true;
                                                    citrixService
                                                      .createLBVServer(
                                                        lbvserver,
                                                        ipaddress,
                                                        credentials,
                                                        primaryinstance,
                                                        serverattached
                                                      )
                                                      .then((responsedata) => {
                                                        if (
                                                          responsedata.status ||
                                                          responsedata.errorcode ===
                                                            273
                                                        ) {
                                                          console.log(
                                                            "Citrix : LB Virtual server creation completed"
                                                          );
                                                          primaryinstance =
                                                            num > 0 ||
                                                            (!customValidation.isEmptyValue(
                                                              lbObj.attachedservers
                                                            ) &&
                                                              sgresponsedata.status)
                                                              ? true
                                                              : false;
                                                          citrixService
                                                            .createLBVSGBinding(
                                                              lbObj
                                                                .ecl2lbsettings
                                                                .lbvserversgbindings,
                                                              ipaddress,
                                                              credentials,
                                                              primaryinstance,
                                                              serverattached
                                                            )
                                                            .then(
                                                              (
                                                                responsedata
                                                              ) => {
                                                                if (
                                                                  responsedata.status ||
                                                                  responsedata.errorcode ===
                                                                    273
                                                                ) {
                                                                  console.log(
                                                                    "Citrix : LB Virtual server service group binding completed"
                                                                  );
                                                                  primaryinstance =
                                                                    num > 0 ||
                                                                    !customValidation.isEmptyValue(
                                                                      lbObj.attachedservers
                                                                    )
                                                                      ? false
                                                                      : true;
                                                                  citrixService
                                                                    .createLBVServerMethodbinding(
                                                                      lbObj
                                                                        .ecl2lbsettings
                                                                        .lbvservermethodbindings,
                                                                      ipaddress,
                                                                      credentials,
                                                                      primaryinstance,
                                                                      serverattached
                                                                    )
                                                                    .then(
                                                                      (
                                                                        responsedata
                                                                      ) => {
                                                                        console.log(
                                                                          "Citrix : LB Virtual server method binding completed"
                                                                        );
                                                                        setTimeout(
                                                                          function () {
                                                                            citrixService
                                                                              .saveConfig(
                                                                                "",
                                                                                ipaddress,
                                                                                credentials,
                                                                                primaryinstance,
                                                                                serverattached
                                                                              )
                                                                              .then(
                                                                                (
                                                                                  responsedata
                                                                                ) => {
                                                                                  console.log(
                                                                                    "Save all configs",
                                                                                    ecl2solutionsobj
                                                                                  );
                                                                                  let condition =
                                                                                    {
                                                                                      ecl2deploymentid:
                                                                                        deploymentsdata.ecl2deploymentid,
                                                                                    };
                                                                                  let parameters: any =
                                                                                    {
                                                                                      lbconflictstatus:
                                                                                        "Active",
                                                                                    };
                                                                                  console.log(
                                                                                    "param",
                                                                                    parameters
                                                                                  );
                                                                                  parameters.lastupdateddt =
                                                                                    new Date();
                                                                                  commonService
                                                                                    .update(
                                                                                      condition,
                                                                                      parameters,
                                                                                      db.ecl2deployments
                                                                                    )
                                                                                    .then(
                                                                                      (
                                                                                        ecl2deploy
                                                                                      ) => {
                                                                                        console.log(
                                                                                          "CloudMatiq : Loadbalancer conflict status = Active "
                                                                                        );
                                                                                        console.log(
                                                                                          "------------------------------"
                                                                                        );
                                                                                        console.log(
                                                                                          "Loadbalancer configuration completed..."
                                                                                        );
                                                                                        console.log(
                                                                                          "------------------------------"
                                                                                        );
                                                                                        if (
                                                                                          ecl2solutionsobj.length ===
                                                                                          num +
                                                                                            1
                                                                                        ) {
                                                                                          //
                                                                                          let condition =
                                                                                            {
                                                                                              loadbalancerid:
                                                                                                credentials.loadbalancerid,
                                                                                            };
                                                                                          let lbdata =
                                                                                            {
                                                                                              loadbalancerid:
                                                                                                credentials.loadbalancerid,
                                                                                              attachedservers:
                                                                                                credentials.attachedservers ==
                                                                                                null
                                                                                                  ? []
                                                                                                  : credentials.attachedservers,
                                                                                            };
                                                                                          lbdata.attachedservers.push(
                                                                                            lbvserver.ipv46
                                                                                          );
                                                                                          commonService
                                                                                            .update(
                                                                                              condition,
                                                                                              lbdata,
                                                                                              db.ecl2loadbalancers
                                                                                            )
                                                                                            .then(
                                                                                              (
                                                                                                data
                                                                                              ) => {
                                                                                                console.log(
                                                                                                  "Attached servers added"
                                                                                                );
                                                                                                // if (pstdout != null && pstderr != null) {
                                                                                                //     stream.end();
                                                                                                //     process.stdout.write = pstdout;
                                                                                                //     process.stderr.write = pstderr;
                                                                                                // }
                                                                                              }
                                                                                            )
                                                                                            .catch(
                                                                                              (
                                                                                                error: Error
                                                                                              ) => {
                                                                                                console.log(
                                                                                                  error
                                                                                                );
                                                                                                // if (pstdout != null && pstderr != null) {
                                                                                                //     stream.end();
                                                                                                //     process.stdout.write = pstdout;
                                                                                                //     process.stderr.write = pstderr;
                                                                                                // }
                                                                                              }
                                                                                            );
                                                                                        }
                                                                                        if (
                                                                                          flag ===
                                                                                          "RETRY"
                                                                                        ) {
                                                                                          let response =
                                                                                            {};
                                                                                          customValidation.generateSuccessResponse(
                                                                                            "",
                                                                                            response,
                                                                                            "Updated",
                                                                                            res,
                                                                                            req
                                                                                          );
                                                                                        }
                                                                                      }
                                                                                    )
                                                                                    .catch(
                                                                                      (
                                                                                        error: Error
                                                                                      ) => {
                                                                                        console.log(
                                                                                          error
                                                                                        );
                                                                                        // stream.end();
                                                                                        // process.stdout.write = pstdout;
                                                                                        // process.stderr.write = pstderr;
                                                                                      }
                                                                                    );
                                                                                }
                                                                              );
                                                                          },
                                                                          1000
                                                                        );
                                                                      }
                                                                    )
                                                                    .catch(
                                                                      (
                                                                        error: Error
                                                                      ) => {
                                                                        console.log(
                                                                          error
                                                                        );
                                                                        throw error;
                                                                      }
                                                                    );
                                                                }
                                                              }
                                                            )
                                                            .catch(
                                                              (
                                                                error: Error
                                                              ) => {
                                                                console.log(
                                                                  error
                                                                );
                                                                throw error;
                                                              }
                                                            );
                                                        }
                                                      })
                                                      .catch((error: Error) => {
                                                        console.log(error);
                                                        throw error;
                                                      });
                                                  }
                                                })
                                                .catch((error: Error) => {
                                                  console.log(error);
                                                  throw error;
                                                });
                                            }
                                          })
                                          .catch((error: Error) => {
                                            console.log(error);
                                            throw error;
                                          });
                                      }
                                    })
                                    .catch((error: Error) => {
                                      console.log(error);
                                      throw error;
                                    });
                                }
                              })
                              .catch((error: Error) => {
                                console.log(error);
                                throw error;
                              });
                          }
                        })
                        .catch((error: Error) => {
                          console.log(error);
                          throw error;
                        });
                    }
                  })
                  .catch((error: Error) => {
                    console.log(error);
                    throw error;
                  });
              }
            })
            .catch((error: Error) => {
              console.log(error);
              throw error;
            });
        }
      })
      .catch((error: Error) => {
        console.log(error);
        throw error;
      });
  }

  writeDeploymentLog(filepath: any, content: any, deploymentid: any): void {
    fs.appendFile(filepath + deploymentid + ".log", content, (err) => {
      console.log(err);
    });
  }

  updateSolution(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = constants.ECL2_UPDATE_NOVA_SERVER.replace(
        "{server_id}",
        req.body.ecl2serverid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        server: {},
      } as any;

      if (!customValidation.isEmptyValue(req.body.accessipv4)) {
        requestparams.server.accessIPv4 = req.body.accessipv4;
      }
      if (!customValidation.isEmptyValue(req.body.accessipv6)) {
        requestparams.server.accessIPv6 = req.body.accessipv6;
      }
      if (!customValidation.isEmptyValue(req.body.instancename)) {
        requestparams.server.name = req.body.instancename;
      }
      commonService
        .callECL2Reqest(
          "PUT",
          req.body.region,
          req.body.tenantid,
          requesturl,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          let condition = { ecl2deploymentid: req.body.ecl2deploymentid };
          commonService
            .update(condition, req.body, db.ecl2deployments)
            .then((data) => {
              customValidation.generateSuccessResponse(
                data,
                response,
                constants.RESPONSE_TYPE_UPDATE,
                res,
                req
              );
            })
            .catch((error: Error) => {
              customValidation.generateAppError(error, response, res, req);
            });
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  deleteSolution(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = constants.ECL2_DELETE_NOVA_SERVER.replace(
        "{server_id}",
        req.body.ecl2serverid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {} as any;

      commonService
        .callECL2Reqest(
          "DELETE",
          req.body.region,
          req.body.tenantid,
          requesturl,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          let condition = { ecl2deploymentid: req.body.ecl2deploymentid };
          commonService
            .update(condition, req.body, db.ecl2deployments)
            .then((data) => {
              customValidation.generateSuccessResponse(
                data,
                response,
                constants.RESPONSE_TYPE_DELETE,
                res,
                req
              );
            })
            .catch((error: Error) => {
              customValidation.generateAppError(error, response, res, req);
            });
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getVNCConsole(req: Request, res: Response): void {
    let response = {};
    try {
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {};
      let requesturl = "";
      if (req.body.ctype === "VSRX") {
        requesturl = ECLApiURL.GET.VNCCONSOLE.replace(
          "{console_id}",
          req.body.consoleid
        );
        requestparams = {
          "os-getVNCConsole": {
            tenant_id: "{tenant_id}",
            type: "novnc",
          },
        } as any;
      } else if (req.body.ctype === "SERVER") {
        requesturl = ECLApiURL.GET.SERVER_CONSOLE.replace(
          "{console_id}",
          req.body.consoleid
        );
        requestparams = {
          "os-getVNCConsole": {
            type: "novnc",
          },
        } as any;
      } else {
        customValidation.generateAppError(
          new AppError("Invalid Parameters"),
          response,
          res,
          req
        );
      }

      commonService
        .callECL2Reqest(
          "POST",
          req.body.region,
          req.body.tenantid,
          requesturl,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          if (
            !customValidation.isEmptyValue(ecl2data) &&
            ecl2data.console.url !== undefined
          ) {
            customValidation.generateSuccessResponse(
              ecl2data,
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
          } else {
            customValidation.generateSuccessResponse(
              ecl2data,
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
          }
        })
        .catch((error: Error) => {
          console.log(error);
          customValidation.generateAppError(
            new AppError("Specified operation not allowed for this appliance."),
            response,
            res,
            req
          );
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  saveInstance(
    req: Request,
    res: Response,
    deployment: any,
    deploymentdata: any,
    element: any,
    appLogger: AppLogger,
    orchData: any
  ): void {
    try {
      let tagvalues = [];
      let object = {
        tenantid: req.body.tenantid,
        customerid: deployment.clientid,
        deploymentid: deployment.deploymentid,
        cloudprovider: constants.CLOUD_ECL,
        instancerefid: element.id,
        instancename: element.name,
        zoneid: req.body.zoneid,
        region: req.body.region,
        imagerefid: element.image ? element.image.id : null,
        instancetyperefid: element.flavor ? element.flavor.id : null,
        networkrefid: JSON.stringify(
          _.map(element.addresses, function (item: any, key) {
            return key;
          })
        ),
        networkid: JSON.parse(deploymentdata.networkid),
        volumerefid:
          element["os-extended-volumes:volumes_attached"] &&
          element["os-extended-volumes:volumes_attached"][0]
            ? element["os-extended-volumes:volumes_attached"][0].id
            : null,
        keyrefid: element.key_name,
        //privateipv4: element.addresses[Object.keys(element.addresses)[0]][0].addr,
        privateipv4: "",
        monitoringyn: "Y",
        monitorutilyn: element.monitorutilyn,
        deletionprotectionyn: "N",
        lbstatus: "N",
        emailyn: "N",
        costyn: "Y",
        description: element.description,
        username: element.user_username,
        status: constants.STATUS_ACTIVE,
        createdby: element["OS-EXT-AZ:availability_zone"],
        createddt: new Date(element.created),
        lastupdatedby: req.body.createdby,
        lastupdateddt: new Date(element.created),
        tagvalues: [],
        platform: deploymentdata.ecl2images
          ? deploymentdata.ecl2images.platform
          : null,
      };
      try {
        object.privateipv4 = req.body.tenantsharingIP;
      } catch (e) {}
      appLogger.writeLogToFile("info", "Getting lookup data");
      let lookupparam = {
        where: {
          lookupkey: {
            $in: ["S_ADMIN_USERNAME", "S_ADMIN_PASSWORD", "FILE_PATH"],
          },
        },
      };
      commonService
        .getAllList(lookupparam, db.LookUp)
        .then((lookuplist) => {
          appLogger.writeLogToFile("info", "*******************************");
          appLogger.writeLogToFile("info", lookuplist);
          appLogger.writeLogToFile("info", req.body.solution.scriptparameters);
          appLogger.writeLogToFile("info", "*******************************");
          let username = _.find(lookuplist, function (data: any) {
            if (data.lookupkey === "S_ADMIN_USERNAME") {
              appLogger.writeLogToFile("info", data);
              return data;
            }
          });
          let password = _.find(lookuplist, function (data: any) {
            if (data.lookupkey === "S_ADMIN_PASSWORD") {
              appLogger.writeLogToFile("info", data);
              return data;
            }
          });
          let client_path = _.find(lookuplist, function (data: any) {
            if (data.lookupkey === "FILE_PATH") {
              appLogger.writeLogToFile("info", data);
              return data;
            }
          });
          let scriptObj: any = {};
          if (
            req.body.solution.scriptparameters &&
            null != req.body.solution.scriptparameters
          ) {
            scriptObj = req.body.solution.scriptparameters;
          }
          scriptObj.clientpath = client_path.keyvalue;
          scriptObj.username = username.keyvalue;
          scriptObj.password = password.keyvalue;
          scriptObj.hostname = element.name;
          scriptObj.host = object.privateipv4;

          // FIXME: Needs improvement
          scriptObj.sys_ip = object.privateipv4;
          let scripts = [];
          if (deploymentdata.script) {
            scripts.push(deploymentdata.script);
          }

          // scriptObj.scripts = scripts;
          appLogger.writeLogToFile("info", JSON.stringify(scriptObj));

          console.log("Place where orchestration takes over:::::::::::::");
          console.log(scriptObj);
          console.log("********************************************");
          console.log(orchData);
          console.log("********************************************");
          console.log(deploymentdata);

          let orchConfigs = {
            sys_ip: scriptObj.sys_ip,
            sys_ts_ip: req.body.tenantsharingIP,
            sys_name: req.body.solution.implementationname,
            sys_host_ip: scriptObj.clientpath,
            sys_deploymentid: deploymentdata["ecl2deploymentid"],
          };

          if (req.body.tenantsharingIP) {
            object["privateipv4"] = req.body.tenantsharingIP;
          }

          console.log("********************************************");
          console.log(orchConfigs);

          if (
            req.body &&
            req.body["orchparams"] &&
            req.body["orchparams"].length > 0
          ) {
            req.body["orchparams"].forEach((obj) => {
              orchConfigs[obj["key"]] = obj["value"];
            });
          }
          // if (element.monitorutilyn = 'Y') {
          //     let orchObj = {
          //         InstanceRef: element.id,
          //         Tenant: req.body.tenantid,
          //         Database: constants,
          //         ScriptURL: constants.FILEDWNLOADPATH.SCRIPT_FILE
          //     };
          //     if (deploymentdata.ecl2images.platform == "Windows") {
          //         commonService.getData({ where: { orchname: 'Data collection Windows' } }, db.Orchestration).then((orch) => {
          //             orch = JSON.parse(JSON.stringify(orch));
          //             let orchConfig = new Orchestrate(JSON.parse(orch['orchflow']), orchConfigs, { logger: appLogger });
          //             orchConfig.start();
          //         });
          //     } else {
          //         commonService.getData({ where: { orchname: 'Data collection Linux' } }, db.Orchestration).then((orch) => {
          //             orch = JSON.parse(JSON.stringify(orch));
          //             let orchConfig = new Orchestrate(JSON.parse(orch['orchflow']), orchConfigs, { logger: appLogger });
          //             orchConfig.start();
          //         });
          //     }
          // }
          if (orchData) {
            appLogger.writeLogToFile(
              "info",
              "Calling orchestra for execution. Deployment Id : " +
                deploymentdata["ecl2deploymentid"]
            );
            let orch = new Orchestrate(
              JSON.parse(orchData["orchflow"]),
              orchConfigs,
              { logger: appLogger }
            );
            orch.start();
          } else {
            appLogger.closeLogger();
          }

          // if (req.body && req.body['scriptparams'] && req.body['scriptparams'].length > 0 && (req.body['scriptparams'].findIndex(o => o['scriptid'] != -1) != -1)) {
          //     setTimeout(() => {
          //         console.log(req.body.scriptObj);
          //         scriptObj.sharedHost = req.body.tenantsharingIP ? req.body.tenantsharingIP : object.privateipv4;

          //         // commonService.getData({ where: { paramtype: 'Template', fieldname: 'Product', templateid: req.body.solutionid } }, db.CustomField).then((tempparameters) => {

          //         //     if (tempparameters && (tempparameters.fieldvalue.toUpperCase() === constants.ECL2_PRODUCTS[1]
          //         //         || tempparameters.fieldoptions.toUpperCase() === constants.ECL2_PRODUCTS[1])) {
          //         //         appLogger.writeLogToFile('info', '*******************************');
          //         //         appLogger.writeLogToFile('info', "PRODUCT");
          //         //         appLogger.writeLogToFile('info', constants.ECL2_PRODUCTS[1]);
          //         //         appLogger.writeLogToFile('info', "*******************************");

          //         //         ScriptService.InstallGroupShare(deploymentdata.ecl2deploymentid, scriptObj, appLogger);
          //         //     } else {
          //         //         appLogger.writeLogToFile('info', '*******************************');
          //         //         appLogger.writeLogToFile('info', "PRODUCT");
          //         //         appLogger.writeLogToFile('info', constants.ECL2_PRODUCTS[0]);
          //         //         appLogger.writeLogToFile('info', "*******************************");

          //                 ScriptService.InstallTMS(deploymentdata.ecl2deploymentid, scriptObj, appLogger);
          //             // }
          //         // }).catch((error: Error) => {
          //         //     console.log(error);
          //         // });
          //     }, 240000);
          // }
        })
        .catch((error: Error) => {
          appLogger.writeLogToFile("error", error);
        });

      new ECL2Controller().addTagValue(
        req,
        element.metadata,
        element.id,
        tagvalues,
        constants.RESOURCE_TYPES[0]
      );

      commonService
        .create(object, db.Instances)
        .then((listins) => {
          let query = `UPDATE tbl_tn_instances a 
                    set a.zoneid = (select b.zoneid from tbl_ecl2_zones b where b.zonename=CONCAT(:region,'-',a.createdby) LIMIT 1 ),
                    a.imageid = (select c.imageid from tbl_ecl2_images c 
                    where c.ecl2imageid=a.imagerefid AND c.status=:status AND c.customerid=:customerid LIMIT 1),
                    a.instancetypeid = (select c.instancetypeid from tbl_ecl2_instancetype c 
                    where c.instancetypename=a.instancetyperefid AND c.status=:status LIMIT 1),
                    a.volumeid = (select c.volumeid from tbl_ecl2_volumes c 
                    where c.ecl2volumeid=a.volumerefid AND c.status=:status AND c.customerid=:customerid LIMIT 1),
                    a.keyid = (select c.keyid from tbl_ecl2_keys c 
                    where c.keyname=a.keyrefid AND c.status=:status AND c.customerid=:customerid LIMIT 1),
                    a.createdby=:username
                    WHERE a.instanceid=:instanceid`;
          let params = {
            replacements: {
              tenantid: req.body.tenantid,
              customerid: deployment.clientid,
              region: req.body.region,
              username: req.body.createdby,
              status: constants.STATUS_ACTIVE,
              instanceid: JSON.parse(JSON.stringify(listins)).instanceid,
            },
          };
          commonService
            .executeQuery(query, params, db.sequelize)
            .then((list) => {
              let ilist = JSON.parse(JSON.stringify(listins));

              // Update Tag values
              let tquery = `UPDATE tbl_bs_tag_values a 
                        set a.tagid = (select c.tagid from tbl_bs_tags c 
                        where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                        a.resourceid = (select c.instanceid from tbl_tn_instances c 
                        where c.instancerefid=a.createdby AND c.status=:status AND c.customerid=:customerid LIMIT 1),
                        a.createdby=:username,
                        a.lastupdatedby=:username
                        WHERE a.tagid IS NULL AND a.resourcetype =:resourcetype`;

              new ECL2Controller().syncTagValues(
                req,
                res,
                deployment,
                tagvalues,
                tquery,
                constants.RESOURCE_TYPES[0]
              );
            })
            .catch((error: Error) => {
              appLogger.writeLogToFile("error", error);
            });

          //Save Script Parameters
          // if (req.body.solution && req.body.solution.scriptparameters) {
          //     if (req.body.solution.scriptparameters.length > 0) {
          //         let params = _.map(req.body.solution.scriptparameters, function (item) {
          //             item.cloudprovider = constants.CLOUD_ECL;
          //             item.refdeploymentid = deployment.deploymentid;
          //             item.templateid = -1;
          //             return item;
          //         });
          //         commonService.bulkCreate(params, db.CustomField).then((data) => {
          //         }).catch((error: Error) => {
          //         });
          //     }
          // }
        })
        .catch((error: Error) => {
          appLogger.writeLogToFile("error", error);
        });
    } catch (e) {
      appLogger.writeLogToFile("error", e);
    }
  }
  addTagValue(
    req: Request,
    metadata: any,
    refid: any,
    tagvalues: any,
    presourcetype: any
  ) {
    if (metadata) {
      for (var key in metadata) {
        if (metadata.hasOwnProperty(key)) {
          if (constants.DEFAULT_TAGS.indexOf(key) == -1) {
            let tag = {
              tenantid: req.body.tenantid,
              cloudprovider: constants.CLOUD_ECL,
              resourcetype: presourcetype,
              tagvalue: metadata[key],
              status: constants.STATUS_ACTIVE,
              createdby: refid,
              createddt: new Date(),
              lastupdatedby: key,
              lastupdateddt: new Date(),
            };
            tagvalues.push(tag);
          }
        }
      }
    }
  }

  syncTagValues(
    req: Request,
    res: Response,
    deployment: any,
    tagvalues: any,
    query: any,
    presourcetype: any
  ): void {
    commonService
      .bulkCreate(tagvalues, db.TagValues)
      .then((data) => {
        let params = {
          replacements: {
            tenantid: req.body.tenantid,
            customerid: deployment.clientid,
            region: req.body.region,
            username: req.body.createdby,
            resourcetype: presourcetype,
            status: constants.STATUS_ACTIVE,
          },
        };
        commonService
          .executeQuery(query, params, db.sequelize)
          .then((list) => {})
          .catch((error: Error) => {
            console.log(error);
          });
      })
      .catch((error: Error) => {
        console.log(error);
      });
  }

  ecl2ResizeInsType(req: any, res?) {
    if (req.body && req.body.length > 0) {
      let instanceList = req.body;
      let index = 0;
      iterateInstance(index);
      function iterateInstance(index) {
        console.log("---index-----", index);
        let element = instanceList[index];
        if (element != null) {
          try {
            let vrequesturl = constants.ECL2_UPDATE_NOVA_SERVER_RESIZE.replace(
              "{server_id}",
              element.instancerefid
            );
            let requestobj = {
              resize: {
                flavorRef: element.instancetype,
                "OS-DCF:diskConfig": "AUTO",
              },
            };
            commonService
              .callECL2Reqest(
                "POST",
                element.region,
                element.tenantid,
                vrequesturl,
                {},
                requestobj,
                element.ecl2tenantid
              )
              .then((ecl2data) => {
                console.log("Completed");
                commonService
                  .getData(
                    { where: { instancetypename: element.instancetype } },
                    db.ecl2instancetype
                  )
                  .then((resp) => {
                    if (resp) {
                      commonService.update(
                        { instanceid: element.instanceid },
                        {
                          instancetyperefid: element.instancetype,
                          instancetypeid: resp.dataValues.instancetypeid,
                        },
                        db.Instances
                      );
                    } else {
                      commonService.update(
                        { instanceid: element.instanceid },
                        { instancetyperefid: element.instancetype },
                        db.Instances
                      );
                    }
                    if (element.upgraderequestid) {
                      commonService.update(
                        { upgraderequestid: element.upgraderequestid },
                        {
                          reqstatus: constants.STATUS_SRM[1],
                          lastupdateddt: new Date(),
                          progresspercent: 100,
                        },
                        db.UpgradeRequest
                      );
                    }
                    index = index + 1;
                    if (index == instanceList.length) {
                      if (element.upgraderequestid) {
                        commonService.update(
                          { srvrequestid: element.srvrequestid },
                          {
                            srstatus: constants.STATUS_SRM[1],
                            progresspercent: 100,
                          },
                          db.srmsr
                        );
                      }
                      if (res)
                        customValidation.generateSuccessResponse(
                          {},
                          {},
                          constants.RESPONSE_TYPE_UPDATE,
                          res,
                          req
                        );
                    }
                    if (element.revert) {
                      let newUpgradeReq = {
                        tenantid: element.tenantid,
                        customerid: element.customerid,
                        cloudprovider: constants.CLOUD_ECL,
                        resourcetype: constants.RESOURCE_TYPES[0],
                        resourceid: element.instanceid,
                        resourcerefid: element.resourcerefid,
                        currplantype: element.currplantype,
                        upgradeplantype: element.upgradeplantype,
                        restartreq: "Y",
                        reqstatus: constants.STATUS_COMPLETED,
                        status: constants.STATUS_ACTIVE,
                        createdby: "Admin",
                        createddt: new Date(),
                        lastupdatedby: "Admin",
                        lastupdateddt: new Date(),
                      };
                      commonService.create(newUpgradeReq, db.UpgradeRequest);
                    }
                    let condition = {
                      module: constants.NOTIFICATION_MODULES[4],
                      event: constants.NOTIFICATION_EVENTS[10],
                      tenantid: element.tenantid,
                      status: constants.STATUS_ACTIVE,
                    } as any;
                    let dateFormat = constants.MOMENT_FORMAT[1];
                    let mapObj = {
                      "{{instance_name}}": element.instancename,
                      "{{changed_config}}": element.instancetype,
                      "{{updated_dt}}": commonService.formatDate(
                        new Date(),
                        dateFormat,
                        false
                      ),
                    };
                    NotificationService.getNotificationSetup(
                      condition,
                      mapObj,
                      "SDL - Instance Configurations Changed",
                      "Instance Configurations Changed"
                    );
                    iterateInstance(index);
                  });
              })
              .catch((error: any) => {
                console.log(error);
                if (res) {
                  if (error instanceof AppError) {
                    customValidation.generateErrorMsg(
                      error.message,
                      res,
                      200,
                      req
                    );
                  } else {
                    customValidation.generateErrorMsg(
                      "Unable to resize",
                      res,
                      200,
                      req
                    );
                  }
                }
              });
          } catch (error) {
            console.log("Unable to resize ", error);
            customValidation.generateErrorMsg(
              "Unable to resize",
              res,
              200,
              req
            );
          }
        }
      }
    } else {
      customValidation.generateErrorMsg("Unable to resize", res, 200, req);
    }
  }
}
export default new ECL2Controller();

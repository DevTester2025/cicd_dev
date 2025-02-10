import CommonService from "../../services/common.service";
import db from "../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../common/validation/customValidation";
import { constants } from "../../../common/constants";
import * as fs from "fs";
import * as _ from "lodash";
import commonService from "../../services/common.service";
import NotificationService from "../../services/notification.service";
import { messages } from "../../../common/messages";
import { AppError } from "../../../common/appError";
import AwsController from "./aws/common/controller";
import {
  GetCloudInitScript,
  Orchestrate,
  VerifyScript,
} from "../../services/orchestration";
import { OrchestrationData } from "../../services/orchestration/getCloudInitScript";
import AppLogger from "../../../lib/logger";

var AWS = require("aws-sdk");

export class Controller {
  constructor() {
    // Empty constructor
  }
  awsdeploy(req: Request, res: Response): void {
    let response = {};
    let cwd = process.cwd();
    let pstdout = process.stdout.write;
    let pstderr = process.stderr.write;
    try {
      let ecl2cloud = {};
      if (
        !_.isEmpty(req.body.solution.tenant) ||
        !_.isEmpty(req.body.solution.tenant.customfield)
      ) {
        let ecl2cloud = _.find(
          JSON.parse(
            commonService.decrypt(
              req.body.solution.tenant.customfield[0].fieldvalue
            )
          ),
          function (data: any) {
            if (data.cloudprovider === "AWS") {
              return data;
            }
          }
        );
        console.log(ecl2cloud);
        if (!_.isEmpty(ecl2cloud)) {
          let C_FOLDER_PATH = cwd + constants.DEPLOY_FOLDER_PATH;

          console.log(C_FOLDER_PATH);

          let deployments: any = {};
          let count = "1";
          count = req.body.solution.awssolutions.length;
          deployments.solutionid = req.body.solutionid;
          deployments.tenantid = req.body.tenantid;
          deployments.requestid = req.body.requestid;
          // deployments.zoneid = req.body.zoneid;
          deployments.tnregionid = req.body.zoneid;
          deployments.clientid = req.body.clientid;
          deployments.notes = req.body.notes;
          deployments.cloudprovider = constants.CLOUD_AWS;
          deployments.status = constants.STATUS_ACTIVE;
          deployments.createdby = req.body.createdby;
          deployments.createddt = req.body.createddt;
          deployments.lastupdateddt = req.body.lastupdateddt;
          deployments.lastupdatedby = req.body.lastupdatedby;
          deployments.awsdeployments = _.map(
            req.body.solution.awssolutions,
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
              { model: db.awsdeployments, as: "awsdeployments" },
              { model: db.TagValues, as: "tagvalues" },
            ],
          };

          let orchids = [];
          let orchestrationsData: object[];

          deployments.awsdeployments.forEach((o) => {
            if (o["orchid"]) orchids.push(o["orchid"]);
          });

          function startDeployment() {
            CommonService.saveWithAssociation(
              deployments,
              options,
              db.deployments
            )
              .then((deploymentsdata) => {
                let TERRFORM_FILE_PATH =
                  C_FOLDER_PATH + deploymentsdata.deploymentid + "/";

                // Check log path
                fs.exists(C_FOLDER_PATH, (exists) => {
                  if (exists != true) {
                    fs.mkdir(C_FOLDER_PATH, (path) => {
                      console.log(path);
                    });

                    fs.mkdirSync(TERRFORM_FILE_PATH, 0o777);
                  } else {
                    fs.mkdirSync(TERRFORM_FILE_PATH, 0o777);
                  }
                });

                let lookupparam = { where: { tenantid: -1 } };
                CommonService.getAllList(lookupparam, db.LookUp)
                  .then((lookuplist) => {
                    // console.log(req.body.solution.tenant.customfield);

                    customValidation.generateSuccessResponse(
                      deploymentsdata,
                      response,
                      constants.RESPONSE_TYPE_LIST,
                      res,
                      req
                    );
                    let awssolutionobj = req.body.solution.awssolutions;
                    console.log("------------");

                    let deployscript: any = {};
                    deployscript.deploymentid = deploymentsdata.deploymentid;
                    //deployscript.scriptcontent = result;
                    deployscript.createdby = req.body.createdby;
                    deployscript.createddt = req.body.createddt;
                    console.log("Deployed Scripts", deployscript);
                    CommonService.create(deployscript, db.DeployedScripts)
                      .then((scriptdata) => {
                        console.log("DeployedScripts Saved ");
                      })
                      .catch((error: Error) => {
                        new Controller().throwError(
                          error,
                          req,
                          res,
                          response,
                          pstdout,
                          pstderr,
                          cwd,
                          deploymentsdata
                        );
                      });
                    if (!fs.existsSync(TERRFORM_FILE_PATH)) {
                      fs.mkdirSync(TERRFORM_FILE_PATH);
                    }
                    let stream = fs.createWriteStream(
                      TERRFORM_FILE_PATH + deploymentsdata.deploymentid + ".log"
                    );
                    process.stdout.write = process.stderr.write =
                      stream.write.bind(stream);
                    stream.once("open", function (fd) {
                      console.log(
                        "--------------------- LOG START ------------------"
                      );

                      new Controller()
                        .createMasters(
                          req,
                          awssolutionobj,
                          ecl2cloud,
                          req.body.clientid,
                          deploymentsdata
                        )
                        .then((networkdata) => {
                          console.log("Master Create Process Completed...");
                          setTimeout(function () {
                            //console.log('<<<awssolutionobj >>>');
                            //console.log(awssolutionobj);
                            let p =
                              process.cwd() +
                              "/deployment_scripts/tms/0_cloud_init.ps1";
                            // fs.readFile(p, 'utf8', (err, data) => {
                            //     let encoded = undefined;
                            //     if (err) {
                            //         console.log('Error while reading 0_cloud_init.ps1...');
                            //     } else {
                            //         data = '<powershell>' + data + '</powershell>';
                            //         encoded = Buffer.from(data).toString('base64');
                            //         req.body.userdata = encoded;
                            //     }

                            // });
                            new Controller().createInstances(
                              req,
                              res,
                              awssolutionobj,
                              deploymentsdata,
                              TERRFORM_FILE_PATH,
                              cwd,
                              pstdout,
                              pstderr,
                              ecl2cloud,
                              orchestrationsData
                            );
                          }, 500);
                        })
                        .catch((error: Error) => {
                          console.log(
                            "Error on master creating",
                            deploymentsdata
                          );
                          new Controller().throwError(
                            error,
                            req,
                            res,
                            response,
                            pstdout,
                            pstderr,
                            cwd,
                            deploymentsdata
                          );
                        });
                    });
                  })
                  .catch((error: Error) => {
                    new Controller().throwError(
                      error,
                      req,
                      res,
                      response,
                      pstdout,
                      pstderr,
                      cwd,
                      deploymentsdata.dataValues
                    );
                  });
              })
              .catch((error: Error) => {
                new Controller().throwError(
                  error,
                  req,
                  res,
                  response,
                  pstdout,
                  pstderr,
                  cwd
                );
              });
          }

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
                    : null;
                  console.log("Scripts", s);
                  if (s) {
                    s.forEach((element) => {
                      CommonService.readS3File(
                        "Scripts/" + element["scriptname"]
                      )
                        .then((data) => {
                          console.log("Scripts data", data);
                          if (data) {
                            fs.writeFile(
                              process.cwd() +
                                "/public/Scripts/" +
                                element["scriptname"],
                              data,
                              function (err) {
                                if (err) {
                                  console.log("Error while creating file", err);
                                } else {
                                  console.log(
                                    "Successfully file created in local"
                                  );
                                }
                              }
                            );
                          }
                        })
                        .catch((err) => {
                          console.log(err);
                        });
                    });
                    s.forEach((element) => {
                      scripts.push(
                        process.cwd() +
                          "/public/Scripts/" +
                          element["scriptname"]
                      );
                    });
                  }
                });

                try {
                  setTimeout(async function () {
                    await VerifyScript(scripts);
                    startDeployment();
                  }, 2000);
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
        } else {
          customValidation.generateAppError(
            new AppError(
              "Tenant settings(AWS Cloud Authentication Key or Secret Key) empty"
            ),
            response,
            res,
            req
          );
        }
      } else {
        customValidation.generateAppError(
          new AppError(
            "Tenant settings(AWS Cloud Authentication Key or Secret Key) empty"
          ),
          response,
          res,
          req
        );
      }
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }

  createInstances(
    req: Request,
    res: Response,
    awssolutionobj,
    deploymentsdata: any,
    TERRFORM_FILE_PATH: any,
    cwd: any,
    pstdout: any,
    pstderr: any,
    ecl2cloud: any,
    orchdata: any
  ): void {
    //let stream = fs.createWriteStream(TERRFORM_FILE_PATH + deploymentsdata.deploymentid + '.log');
    //process.stdout.write = process.stderr.write = stream.write.bind(stream);
    //stream.once('open', function (fd) {

    let response = {};
    let condition = {
      where: { tnregionid: req.body.zoneid },
      include: [
        {
          as: "accountdata",
          model: db.CustomerAccount,
          required: false,
          attributes: ["rolename"],
          where: { status: constants.STATUS_ACTIVE },
        },
      ],
    };
    commonService.getData(condition, db.TenantRegion).then((regionData) => {
      regionData = JSON.parse(JSON.stringify(regionData));
      AwsController.getCrossAccountCredentials(
        ecl2cloud,
        req.body.zonename,
        regionData.tenantrefid,
        regionData.accountdata ? regionData.accountdata.rolename : null
      )
        .then(async (acl) => {
          console.log("Access keys >>", acl);
          AWS.config.region = req.body.zonename;
          AWS.config.update(acl);

          // Create EC2 service object
          var ec2service = new AWS.EC2({
            apiVersion: constants.AWS_EC2_APIVERSION,
          });

          // AMI is amzn-ami-2011.09.1.x86_64-ebs
          let instanceids = [];
          let networkids: any = [];
          let subnetids: any = [];
          let sgids: any = [];
          for (
            let num: number = 0;
            num < Number(awssolutionobj.length);
            num++
          ) {
            let orchestrationData;

            if (
              awssolutionobj[num]["orchid"] &&
              awssolutionobj[num]["orchid"] != -1
            ) {
              orchestrationData = orchdata.find(
                (o) => o["orchid"] == awssolutionobj[num]["orchid"]
              );

              try {
                let encoded = await GetCloudInitScript(orchestrationData, {
                  platform: "AWS",
                });
                startDeployment(encoded);
              } catch (error) {
                console.log(error);
                console.log("Error parsing cloud init script:::::::::::::");
                new Controller().buildOutputData(
                  req,
                  res,
                  instanceids,
                  awssolutionobj,
                  deploymentsdata,
                  ec2service,
                  orchestrationData
                );
                new Controller().throwError(
                  "Error parsing cloud init script.",
                  req,
                  res,
                  response,
                  pstdout,
                  pstderr,
                  cwd,
                  deploymentsdata
                );
              }
            } else {
              startDeployment();
            }

            function startDeployment(encoded?: string) {
              var instanceParams: any = {
                ImageId: awssolutionobj[num].awsami.awsamiid,
                InstanceType: awssolutionobj[num].awsinsttype.instancetypename,
                Monitoring: {
                  Enabled:
                    awssolutionobj[num].monitoringyn == "Y" ? true : false,
                },
                DisableApiTermination:
                  awssolutionobj[num].terminationprotectionyn == "Y"
                    ? true
                    : false,
                //KeyName: "my-key-pair",
                MaxCount: 1,
                MinCount: 1,
                SecurityGroupIds: [
                  awssolutionobj[num].awssg.awssecuritygroupid,
                ],
                SubnetId: awssolutionobj[num].awssubnet.awssubnetd,
                TagSpecifications: [
                  {
                    ResourceType: "instance",
                    Tags: [
                      {
                        Key: "Name",
                        // Value: awssolutionobj[num].instancename,
                        //this is commented since we deploying one instance with template
                        Value: req.body.solution.implementationname,
                      },
                    ],
                  },
                ],
              };
              if (awssolutionobj[num].arn) {
                instanceParams.IamInstanceProfile = {
                  Arn: awssolutionobj[num].arn,
                };
              }
              // Attach Cloudinit script.
              if (encoded) {
                instanceParams.UserData = encoded;
              }

              if (
                awssolutionobj[num].volumes &&
                awssolutionobj[num].volumes.length > 0
              ) {
                instanceParams.BlockDeviceMappings = [];
                let devicenames = [
                  "b",
                  "c",
                  "d",
                  "e",
                  "f",
                  "g",
                  "h",
                  "i",
                  "j",
                  "k",
                  "l",
                  "m",
                  "n",
                  "o",
                  "p",
                ];
                awssolutionobj[num].volumes.forEach((element, i) => {
                  instanceParams.BlockDeviceMappings.push({
                    DeviceName:
                      awssolutionobj[num].awsami.platform == "Windows"
                        ? `xvd${devicenames[i]}`
                        : `/dev/sdb${i + 1}`,
                    Ebs: {
                      VolumeSize: element.sizeingb,
                      Encrypted: element.encryptedyn == "Y" ? true : false,
                    },
                  });
                });
              }
              // Keys
              if (
                awssolutionobj[num].awskeys &&
                awssolutionobj[num].awskeys != null
              ) {
                instanceParams.KeyName = awssolutionobj[num].awskeys.keyname;
              }
              // Tags
              if (
                awssolutionobj[num].tagvalues &&
                awssolutionobj[num].tagvalues.length > 0
              ) {
                awssolutionobj[num].tagvalues.forEach((element) => {
                  //console.log(instanceParams.TagSpecifications[0].Tags)
                  instanceParams.TagSpecifications[0].Tags.push({
                    Key: element.tag.tagname,
                    Value: element.tagvalue,
                  });
                });
              }

              // Create a promise on an EC2 service object
              console.log("Input Parameters >>", instanceParams);
              var instancePromise = new AWS.EC2({ apiVersion: "2016-11-15" })
                .runInstances(instanceParams)
                .promise();

              // Handle promise's fulfilled/rejected states
              instancePromise
                .then((outputData) => {
                  console.log("OUTPUT >>>>", outputData);
                  // customValidation.generateSuccessResponse(outputData, response, constants.RESPONSE_TYPE_LIST, res, req);
                  var instanceId = outputData.Instances[0].InstanceId;
                  instanceids.push(outputData.Instances[0].InstanceId);
                  console.log(
                    "------------ > (" +
                      instanceId +
                      ") Instance Created <-----------"
                  );
                  if (awssolutionobj.length - 1 == num) {
                    setTimeout(function () {
                      new Controller().buildOutputData(
                        req,
                        res,
                        instanceids,
                        awssolutionobj,
                        deploymentsdata,
                        ec2service,
                        orchestrationData
                      );
                      setTimeout(function () {
                        new Controller().configureELB(
                          req,
                          ecl2cloud,
                          awssolutionobj,
                          deploymentsdata,
                          regionData
                        );
                      }, 1000);
                    }, 10000);
                    setTimeout(function () {
                      console.log(
                        "--------------------- LOG END ------------------"
                      );
                      process.stdout.write = pstdout;
                      process.stderr.write = pstderr;
                      process.chdir(cwd);
                      new Controller().uploadLog(deploymentsdata.deploymentid);
                    }, 12000);
                  }
                })
                .catch((err) => {
                  console.log("ERROR >>", err);
                  new Controller().buildOutputData(
                    req,
                    res,
                    instanceids,
                    awssolutionobj,
                    deploymentsdata,
                    ec2service,
                    orchestrationData
                  );
                  new Controller().throwError(
                    err,
                    req,
                    res,
                    response,
                    pstdout,
                    pstderr,
                    cwd,
                    deploymentsdata
                  );
                });
            }
          }
          // });
        })
        .catch((err) => {
          console.log("Error in create instance AWS::::::::::");
          console.log(err);
        });
    });
  }
  buildOutputData(
    req: Request,
    res: Response,
    instanceids: any,
    awssolutionobj: any,
    deploymentsdata: any,
    ec2service: any,
    orchdata: OrchestrationData
  ): void {
    console.log("InstanceIDs = ", instanceids);
    if (instanceids && instanceids.length > 0) {
      let awsarray = [];
      var params = {
        InstanceIds: instanceids,
      };
      console.log(".............. Fetch Instance Details..........");
      ec2service.describeInstances(params, function (err, data) {
        if (err) {
          console.log(err, err.stack);
        } else {
          for (let num: number = 0; num < Number(instanceids.length); num++) {
            console.log(data.Reservations[num].Instances[0]);
            let awsdeploymentObj = {} as any;
            awsdeploymentObj = deploymentsdata.awsdeployments[num].dataValues;
            awsdeploymentObj.publicipv4 =
              data.Reservations[num].Instances[0].PublicIpAddress;
            awsdeploymentObj.privateipv4 =
              data.Reservations[num].Instances[0].PrivateIpAddress;
            awsdeploymentObj.publicdns =
              data.Reservations[num].Instances[0].PublicDnsName;
            if (null != awssolutionobj[num].lbid) {
              awsdeploymentObj.lbdns = "";
            } else {
              awsdeploymentObj.lbdns = null;
            }
            awsdeploymentObj.instanceoutput = JSON.stringify(
              data.Reservations[num].Instances[0]
            );
            awsdeploymentObj.region = req.body.zonename;
            awsdeploymentObj.status = "Deployed";
            awsdeploymentObj.lastupdatedby = req.body.lastupdatedby;
            awsdeploymentObj.lastupdateddt = new Date();
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
              "{{deployed_by}}": req.body.lastupdatedby,
              "{{cloud_provider}}": req.body.solution.cloudprovider,
              "{{region}}": req.body.zonename,
              "{{deployed_dt}}": commonService.formatDate(
                new Date(),
                dateFormat,
                false
              ),
            };
            NotificationService.getNotificationSetup(
              condition,
              mapObj,
              "CM - Instance Deployed",
              "Instance Deployed"
            );
            awsarray.push(awsdeploymentObj);

            let orchConfigs = {};
            if (
              req.body &&
              req.body["orchparams"] &&
              req.body["orchparams"].length > 0
            ) {
              req.body["orchparams"].forEach((obj) => {
                orchConfigs[obj["key"]] = obj["value"];
              });
            }
            awsdeploymentObj.awsami = awssolutionobj[num].awsami
              ? awssolutionobj[num].awsami
              : null;
            new Controller().savaInstance(
              deploymentsdata,
              awsdeploymentObj,
              data.Reservations[num].Instances[0],
              orchdata,
              orchConfigs
            );
            if (
              awsarray.length === Number(deploymentsdata.awsdeployments.length)
            ) {
              new Controller().saveOutput(
                req,
                res,
                awsarray,
                awssolutionobj,
                deploymentsdata
              );
            }
          }
        }
      });
    } else {
      console.log("Output Is Empty");
      let awsarray = [];
      _.map(deploymentsdata.awsdeployments, function (item) {
        item.dataValues.status = "Failed";
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
          "{{deployed_by}}": req.body.lastupdatedby,
          "{{cloud_provider}}": req.body.solution.cloudprovider,
          "{{region}}": req.body.zonename,
          "{{deployed_dt}}": commonService.formatDate(
            new Date(),
            dateFormat,
            false
          ),
        };
        NotificationService.getNotificationSetup(
          condition,
          mapObj,
          "CM - Instance Deployed",
          "Instance Deployed"
        );
        item.dataValues.lastupdateddt = new Date();
        awsarray.push(item.dataValues);
      });
      new Controller().saveOutput(
        req,
        res,
        awsarray,
        awssolutionobj,
        deploymentsdata
      );
    }
  }

  saveOutput(
    req: Request,
    res: Response,
    awsarray: any,
    awssolutionobj: any,
    deploymentsdata: any
  ): void {
    try {
      let options = [
        "instancename",
        "publicipv4",
        "privateipv4",
        "publicdns",
        "lbdns",
        "instanceoutput",
        "status",
        "lastupdatedby",
        "lastupdateddt",
      ];
      CommonService.bulkUpdate(awsarray, options, db.awsdeployments)
        .then((data) => {
          if (
            deploymentsdata.requestid != null &&
            deploymentsdata.requestid !== -1 &&
            awsarray[0].status !== "Failed"
          ) {
            try {
              let srvreqObj = {
                progresspercent: 100,
                lastupdatedby: req.body.lastupdatedby,
                lastupdateddt: req.body.lastupdateddt,
                srstatus: awsarray[0].status,
              };
              CommonService.update(
                { srvrequestid: deploymentsdata.requestid },
                srvreqObj,
                db.srmsr
              )
                .then((data) => {
                  console.log("Service request updated");
                  let sractions = {
                    actiontype: "Progress",
                    srstatus: "Deployed",
                    notes: messages.DEPLOYMENT_NOTE,
                    srvrequestid: deploymentsdata.requestid,
                    lastupdatedby: req.body.lastupdatedby,
                    lastupdateddt: req.body.lastupdateddt,
                  };
                  CommonService.create(sractions, db.srmsractions)
                    .then((data) => {
                      console.log("Service Actions added");
                    })
                    .catch((error: Error) => {
                      throw error;
                    });
                })
                .catch((error: Error) => {
                  throw error;
                });
            } catch (e) {
              console.log(e);
            }
          }
          console.log("Output data stored in table");
        })
        .catch((error: Error) => {
          throw error;
        });
    } catch (e) {
      throw e;
    }
  }
  throwError(
    e: any,
    req: Request,
    res: Response,
    response: any,
    pstdout: any,
    pstderr: any,
    cwd: any,
    deploymentsdata?
  ): void {
    process.stdout.write = pstdout;
    process.stderr.write = pstderr;
    process.chdir(cwd);
    console.log(e);
    new Controller().uploadLog(deploymentsdata.deploymentid);
    customValidation.generateAppError(e, response, res, req);
  }

  savaInstance(
    deploymentsdata: any,
    awsdeploymentObj: any,
    instancesobj: any,
    orchdata: OrchestrationData,
    orchConf: { [key: string]: any }
  ): void {
    try {
      console.log("Insert Instances>>>>>>", awsdeploymentObj);
      let tagvalues = [];
      let object = {
        tenantid: deploymentsdata.tenantid,
        customerid: deploymentsdata.clientid,
        deploymentid: deploymentsdata.deploymentid,
        cloudprovider: constants.CLOUD_AWS,
        instancerefid: instancesobj.InstanceId,
        instancename: awsdeploymentObj.instancename,
        zoneid: deploymentsdata.zoneid,
        region: instancesobj.Placement.AvailabilityZone,
        imageid: awsdeploymentObj.amiid,
        imagerefid: instancesobj.ImageId,
        instancetypeid: awsdeploymentObj.instancetypeid,
        instancetyperefid: instancesobj.InstanceType,
        networkrefid: '["' + instancesobj.VpcId + '"]',
        networkid: [awsdeploymentObj.vpcid],
        keyid: awsdeploymentObj.keyid,
        keyrefid: instancesobj.KeyName,
        securitygroupid: awsdeploymentObj.securitygroupid,
        securitygrouprefid: instancesobj.SecurityGroups[0].GroupId,
        publicipv4: instancesobj.PublicIpAddress,
        privateipv4: instancesobj.PrivateIpAddress,
        publicdns: instancesobj.PublicDnsName,
        subnetid: awsdeploymentObj.subnetid,
        subnetrefid: instancesobj.SubnetId,
        volumeid:
          awsdeploymentObj.volumeid &&
          typeof awsdeploymentObj.volumeid != "string" &&
          awsdeploymentObj.volumeid.length > 0
            ? awsdeploymentObj.volumeid[0]
            : -1,
        volumerefid:
          instancesobj.BlockDeviceMappings &&
          instancesobj.BlockDeviceMappings[0] &&
          instancesobj.BlockDeviceMappings[0].Ebs
            ? instancesobj.BlockDeviceMappings[0].Ebs.VolumeId
            : null,
        monitoringyn: "Y",
        monitorutilyn: instancesobj.monitorutilyn,
        deletionprotectionyn: "N",
        lbstatus: "N",
        emailyn: "N",
        costyn: "Y",
        description: awsdeploymentObj.notes,
        status: constants.STATUS_ACTIVE,
        createdby: awsdeploymentObj.lastupdatedby,
        createddt: new Date(),
        lastupdatedby: awsdeploymentObj.lastupdatedby,
        lastupdateddt: new Date(),
        tagvalues: [],
        platform: awsdeploymentObj.awsami
          ? awsdeploymentObj.awsami.platform
          : null,
      };
      if (instancesobj.Tags && instancesobj.Tags.length > 0) {
        instancesobj.Tags.forEach((element) => {
          if (constants.DEFAULT_TAGS.indexOf(element.Key) == -1) {
            let tag = {
              tenantid: deploymentsdata.tenantid,
              cloudprovider: constants.CLOUD_AWS,
              resourcetype: constants.RESOURCE_TYPES[0],
              //resourceid: iobj.instanceid,
              tagvalue: element.Value,
              status: constants.STATUS_ACTIVE,
              createdby: element.Key,
              createddt: new Date(),
              lastupdatedby: awsdeploymentObj.lastupdatedby,
              lastupdateddt: new Date(),
            };
            object.tagvalues.push(tag);
          }
        });
      }
      let attachments = [];
      if (
        instancesobj.BlockDeviceMappings &&
        instancesobj.BlockDeviceMappings.length > 0
      ) {
        instancesobj.BlockDeviceMappings.forEach((element) => {
          let obj = {
            tenantid: deploymentsdata.tenantid,
            customerid: deploymentsdata.clientid,
            //tnregionid: req.body.tnregionid,
            instancerefid: instancesobj.InstanceId,
            status: constants.STATUS_ACTIVE,
            createdby: element.Ebs.VolumeId,
            createddt: new Date(),
            lastupdatedby: instancesobj.InstanceId,
            lastupdateddt: new Date(),
          };
          attachments.push(obj);
        });
      }
      let query = {} as any;
      query.include = [{ model: db.TagValues, as: "tagvalues" }];

      let orchConfigs = {
        sys_ip: instancesobj.PublicIpAddress,
        sys_ts_ip: instancesobj.PublicIpAddress,
        sys_name: awsdeploymentObj.instancename,
        sys_host_ip: null,
        sys_deploymentid: deploymentsdata.deploymentid,
        ...orchConf,
      };

      console.log("********************************************");
      console.log(orchConfigs);
      console.log("Orch Data::::::::::::::::::::::");
      console.log(orchdata);
      let appLog = new AppLogger(
        process.cwd() + `/instances/${deploymentsdata.deploymentid}/`,
        deploymentsdata.deploymentid + ".log"
      );

      // if (deploymentsdata.monitorutilyn = 'Y') {
      //     let orchObj = {
      //         InstanceRef: instancesobj.InstanceId,
      //         Tenant: deploymentsdata.tenantid,
      //         Database: constants,
      //         ScriptURL: constants.FILEDWNLOADPATH.SCRIPT_FILE
      //     };
      //     if (awsdeploymentObj.awsami.platform == "Windows") {
      //         CommonService.getData({ where: { orchname: 'Data collection Windows' } }, db.Orchestration).then((orch) => {
      //             orch = JSON.parse(JSON.stringify(orch));
      //             let orchConfig = new Orchestrate(JSON.parse(orch['orchflow']), orchConfigs, { logger: appLog });
      //             orchConfig.start();
      //         });
      //     } else {
      //         CommonService.getData({ where: { orchname: 'Data collection Linux' } }, db.Orchestration).then((orch) => {
      //             orch = JSON.parse(JSON.stringify(orch));
      //             let orchConfig = new Orchestrate(JSON.parse(orch['orchflow']), orchConfigs, { logger: appLog });
      //             orchConfig.start();
      //         });
      //     }
      // }
      if (orchdata) {
        console.log("orch >>>>>>>>>>>>>>>>>>>");
        console.log(JSON.stringify(JSON.parse(orchdata["orchflow"])));
        console.log(JSON.stringify(orchConfigs));
        let orch = new Orchestrate(
          JSON.parse(orchdata["orchflow"]),
          orchConfigs,
          { logger: appLog }
        );
        setTimeout(function () {
          orch.start();
        }, 6000);
      } else {
        appLog.closeLogger(deploymentsdata.deploymentid);
      }

      commonService
        .saveWithAssociation(object, query, db.Instances)
        .then((iobj) => {
          let params = {
            replacements: {
              tenantid: deploymentsdata.tenantid,
              username: awsdeploymentObj.lastupdatedby,
              resourcetype: constants.RESOURCE_TYPES[0],
              status: constants.STATUS_ACTIVE,
            },
          };
          let query = `UPDATE tbl_bs_tag_values a 
                set a.tagid = (select c.tagid from tbl_bs_tags c 
                where c.tagname=a.createdby AND c.tenantid=:tenantid LIMIT 1),
                a.createdby=:username
                WHERE a.tenantid=:tenantid AND a.tagid IS NULL AND a.resourcetype =:resourcetype`;
          commonService
            .executeQuery(query, params, db.sequelize)
            .then((list) => {})
            .catch((error: Error) => {
              console.log(error);
            });
          if (attachments.length > 0) {
            commonService
              .bulkCreate(attachments, db.awsvolumeattachment)
              .then((data) => {})
              .catch((error: Error) => {
                // customValidation.generateAppError(error, response, res, req);
              });
          }
        })
        .catch((error: Error) => {
          console.log(error);
        });
    } catch (e) {
      console.log(e);
    }
  }

  configureELB(
    req: Request,
    ecl2cloud: any,
    awssolutionobj: any,
    deploymentsdata: any,
    regionData: any
  ): void {
    try {
      console.log(
        "-------------- ELB Configuration Started -------------------"
      );
      for (let num: number = 0; num < Number(awssolutionobj.length); num++) {
        if (awssolutionobj[num].lb && awssolutionobj[num].lb != null) {
          console.log("ELB Details >>", awssolutionobj[num].lb);
          new Controller()
            .createElbToSG(
              req,
              ecl2cloud,
              awssolutionobj,
              deploymentsdata,
              num,
              regionData
            )
            .then((awssgid) => {
              AwsController.getCrossAccountCredentials(
                ecl2cloud,
                req.body.zonename,
                regionData.tenantrefid,
                regionData.accountdata ? regionData.accountdata.rolename : null
              ).then(async (acl) => {
                console.log("Access keys >>", acl);
                AWS.config.region = req.body.zonename;
                AWS.config.update(acl);

                var elb = new AWS.ELB({
                  apiVersion: constants.AWS_ELB_APIVERSION_V1,
                });
                var params = {
                  Scheme: "internal",
                  //Type: "application",
                  Listeners: [
                    {
                      InstancePort: 80,
                      InstanceProtocol: "HTTP",
                      LoadBalancerPort: 80,
                      Protocol: "HTTP",
                    },
                  ],
                  SecurityGroups: [],
                  Subnets: [],
                  LoadBalancerName:
                    awssolutionobj[num].lb.lbname +
                    deploymentsdata.deploymentid,
                };

                params.SecurityGroups.push(awssgid);
                params.Subnets.push(awssolutionobj[num].awssubnet.awssubnetd);

                if (
                  awssolutionobj[num].lb.listeners &&
                  awssolutionobj[num].lb.listeners.length > 0
                ) {
                  params.Listeners = [] as any;
                  params.Listeners = awssolutionobj[num].lb.listeners;
                  params.Listeners.forEach((element: any) => {
                    if (element.Protocol == "HTTPS") {
                      element.SSLCertificateId =
                        awssolutionobj[num].lb.certificatearn;
                    }
                  });
                }

                console.log("ELB Parameters >>", params);
                elb.createLoadBalancer(params, function (err, data) {
                  console.log("Error :", err);
                  console.log("LB Data :", data);
                  if (err) {
                    console.log(err, err.stack); // an error occurred
                  } else {
                    console.log(data); // successful response
                  }
                });
              });
            });
        } else {
          console.log(
            "Info : No ELB attached with this solution(" + num + 1 + ")"
          );
        }
      }
    } catch (e) {
      console.log("Error ELB :", e);
    }
  }

  createElbToSG(
    req: Request,
    ecl2cloud: any,
    awssolutionobj: any,
    deploymentsdata: any,
    num: any,
    regionData: any
  ): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      try {
        if (
          awssolutionobj[num].lb.lbsecuritygroup.securitygroupname ==
            "Auto Create" ||
          awssolutionobj[num].lb.lbsecuritygroup.awssecuritygroupid ==
            awssolutionobj[num].lb.lbsecuritygroup.securitygroupid
        ) {
          console.log("Auto create LB security group >> TRUE");
          CommonService.getById(
            awssolutionobj[num].lb.lbsubnet.vpcid,
            db.awsvpc
          )
            .then((vpcdata) => {
              console.log("LB VPC Data >>", vpcdata);

              if (vpcdata) {
                vpcdata = JSON.parse(JSON.stringify(vpcdata));
                AwsController.getCrossAccountCredentials(
                  ecl2cloud,
                  req.body.zonename,
                  regionData.tenantrefid,
                  regionData.accountdata
                    ? regionData.accountdata.rolename
                    : null
                ).then(async (acl) => {
                  console.log("LB SG Temp Credentials >>", acl);

                  AWS.config.region = req.body.zonename;
                  AWS.config.update(acl);

                  var ec2service = new AWS.EC2({
                    apiVersion: constants.AWS_EC2_APIVERSION,
                  });

                  var params = {
                    Description: req.body.solution.implementationname,
                    GroupName:
                      req.body.solution.implementationname +
                      "_" +
                      deploymentsdata.deploymentid,
                    VpcId: vpcdata.awsvpcid,
                  };
                  ec2service.createSecurityGroup(params, function (err, data) {
                    if (err) {
                      console.log("Error while create LB security group");
                      console.log(err, err.stack); // an error occurred
                      resolve(awssolutionobj[num].awssg.awssecuritygroupid);
                    } else {
                      console.log("LB security group created >>", data);
                      resolve(data.GroupId);
                      //awssolutionobj[num].awssg.awssecuritygroupid = data.GroupId;
                      let condition = {} as any;
                      condition.where = {
                        securitygroupid:
                          awssolutionobj[num].lb.lbsecuritygroup
                            .securitygroupid,
                      };
                      condition.include = [
                        {
                          model: db.awssgrules,
                          as: "awssgrules",
                          where: { status: "Active" },
                        },
                      ];
                      CommonService.getData(condition, db.awssg).then(
                        (sgresult) => {
                          if (sgresult) {
                            let obj = sgresult.dataValues;
                            console.log("LB security group rules", obj);
                            delete obj["securitygroupid"];
                            obj.awssecuritygroupid = data.GroupId;
                            obj.createddt = new Date();
                            obj.createdby = "SYSTEM";
                            obj.securitygroupname =
                              "ELB_" +
                              req.body.solution.implementationname +
                              "_" +
                              deploymentsdata.deploymentid;
                            CommonService.create(obj, db.awssg)
                              .then((result) => {
                                //awssolutionobj[num].awssg.securitygroupid = result.securitygroupid;
                                // ingress call
                                if (
                                  sgresult.dataValues.awssgrules &&
                                  sgresult.dataValues.awssgrules.length > 0
                                ) {
                                  let params = {
                                    GroupId: data.GroupId,
                                    IpPermissions: [],
                                  };
                                  for (
                                    let i = 0;
                                    i < sgresult.dataValues.awssgrules.length;
                                    i++
                                  ) {
                                    let rule = {
                                      FromPort:
                                        sgresult.dataValues.awssgrules[i]
                                          .portrange,
                                      IpProtocol:
                                        sgresult.dataValues.awssgrules[i]
                                          .protocol,
                                      ToPort:
                                        sgresult.dataValues.awssgrules[i]
                                          .portrange,
                                    } as any;
                                    if (
                                      sgresult.dataValues.awssgrules[i]
                                        .sourcetype == null ||
                                      sgresult.dataValues.awssgrules[i]
                                        .sourcetype == "IP"
                                    ) {
                                      rule.IpRanges = [
                                        {
                                          CidrIp:
                                            sgresult.dataValues.awssgrules[i]
                                              .source,
                                        },
                                      ];
                                    } else if (
                                      sgresult.dataValues.awssgrules[i]
                                        .sourcetype == "SG"
                                    ) {
                                      rule.UserIdGroupPairs = [
                                        {
                                          GroupId:
                                            sgresult.dataValues.awssgrules[i]
                                              .source,
                                        },
                                      ];
                                    }
                                    params.IpPermissions.push(rule);
                                  }
                                  console.log("SG Rules >>", params);
                                  ec2service.authorizeSecurityGroupIngress(
                                    params,
                                    function (err, data) {
                                      if (err) {
                                        console.log(err); // an error occurred
                                        //reject(err);
                                      } else {
                                        console.log("Rules created");
                                      }
                                    }
                                  );
                                }
                                new Controller().updateTag(
                                  ec2service,
                                  data.GroupId,
                                  obj.securitygroupname
                                );
                              })
                              .catch((error: Error) => {
                                console.log(error);
                                //resolve(data.GroupId);
                              });
                          }
                        }
                      );
                    }
                  });
                });
              } else {
                resolve(awssolutionobj[num].awssg.awssecuritygroupid);
              }
            })
            .catch((error: Error) => {
              console.log(error);
              resolve(awssolutionobj[num].awssg.awssecuritygroupid);
            });
        } else {
          console.log("Note : ELB SecurityGroup already created.......");
          resolve(awssolutionobj[num].awssg.awssecuritygroupid);
        }
      } catch (e) {
        console.log("Error on LB creation >> ", e);
        resolve(awssolutionobj[num].awssg.awssecuritygroupid);
      }
    });

    return promise;
  }
  createMasters(
    req: any,
    awssolutionobj: any,
    ecl2cloud: any,
    customerid: any,
    deploymentsdata
  ): Promise<any> {
    console.log("Create VPC Function Calling.......");
    let vpcids: any = [];
    let prevvpc: any = [];

    for (let num: number = 0; num < Number(awssolutionobj.length); num++) {
      if (
        false === prevvpc.indexOf(awssolutionobj[num].vpcid) > -1 &&
        awssolutionobj[num].awsvpc.awsvpcid == awssolutionobj[num].vpcid
      ) {
        vpcids.push(awssolutionobj[num].awsvpc);
        prevvpc.push(awssolutionobj[num].vpcid);
      }
    }

    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      let condition = {
        where: { tnregionid: req.body.zoneid },
        include: [
          {
            as: "accountdata",
            model: db.CustomerAccount,
            required: false,
            attributes: ["rolename"],
            where: { status: constants.STATUS_ACTIVE },
          },
        ],
      };
      commonService.getData(condition, db.TenantRegion).then((regionData) => {
        regionData = JSON.parse(JSON.stringify(regionData));
        AwsController.getCrossAccountCredentials(
          ecl2cloud,
          req.body.zonename,
          regionData.tenantrefid,
          regionData.accountdata ? regionData.accountdata.rolename : null
        ).then(async (acl) => {
          AWS.config.region = req.body.zonename;
          AWS.config.update(acl);
          // Create EC2 service object
          var ec2service = new AWS.EC2({
            apiVersion: constants.AWS_EC2_APIVERSION,
          });
          if (vpcids.length > 0) {
            for (let num: number = 0; num < Number(vpcids.length); num++) {
              var params = {
                CidrBlock: vpcids[num].ipv4cidr,
              };
              ec2service.createVpc(params, function (err, data) {
                if (err) {
                  console.log(err, err.stack); // an error occurred
                  // reject(err);
                  new Controller().uploadLog(deploymentsdata.deploymentid);
                } else {
                  console.log(data);
                  vpcids[num].awsvpcid = data.Vpc.VpcId;
                  CommonService.update(
                    { vpcid: vpcids[num].vpcid },
                    { awsvpcid: data.Vpc.VpcId },
                    db.awsvpc
                  )
                    .then((result) => {
                      CommonService.update(
                        { awsvpcid: vpcids[num].vpcid },
                        { awsvpcid: data.Vpc.VpcId },
                        db.awssolution
                      );
                      new Controller().updateTag(
                        ec2service,
                        data.Vpc.VpcId,
                        vpcids[num].vpcname
                      );
                      new Controller().createInternetGateway(
                        ec2service,
                        data.Vpc.VpcId
                      );
                    })
                    .catch((error: Error) => {
                      console.log(error);
                    });
                  if (vpcids.length == num + 1) {
                    console.log(vpcids);
                    for (
                      let i: number = 0;
                      i < Number(awssolutionobj.length);
                      i++
                    ) {
                      if (
                        awssolutionobj[i].awsvpc.awsvpcid ==
                        awssolutionobj[i].awsvpc.vpcid
                      ) {
                        let vpc = _.find(vpcids, function (o) {
                          return o.vpcid == awssolutionobj[i].awsvpc.vpcid;
                        });
                        if (vpc) {
                          awssolutionobj[i].awsvpc.awsvpcid = vpc.awsvpcid;
                        }
                      }
                      if (Number(awssolutionobj.length) == i + 1) {
                        setTimeout(function () {
                          new Controller()
                            .createSubnet(
                              req,
                              awssolutionobj,
                              ecl2cloud,
                              customerid,
                              regionData,
                              deploymentsdata
                            )
                            .then((networkdata) => {
                              resolve(vpcids);
                            })
                            .catch((error: Error) => {
                              console.log(error);
                            });
                        }, 500);
                      }
                    }
                  }
                }
              });
            }
          } else {
            console.log("Note : VPC(s) already created.......");
            new Controller()
              .createSubnet(
                req,
                awssolutionobj,
                ecl2cloud,
                customerid,
                regionData,
                deploymentsdata
              )
              .then((networkdata) => {
                resolve([]);
              })
              .catch((error: Error) => {
                console.log(error);
              });
          }
        });
      });
    });
    return promise;
  }

  createSubnet(
    req: any,
    awssolutionobj: any,
    ecl2cloud: any,
    customerid: any,
    regionData: any,
    deploymentsdata?
  ): Promise<any> {
    console.log("Create Subnet Function Calling.......");
    let subnetids: any = [];
    let prevsubnet: any = [];

    for (let num: number = 0; num < Number(awssolutionobj.length); num++) {
      if (
        false === prevsubnet.indexOf(awssolutionobj[num].subnetid) > -1 &&
        awssolutionobj[num].awssubnet.awssubnetd ==
          awssolutionobj[num].awssubnet.subnetid
      ) {
        awssolutionobj[num].awssubnet.awsvpcid =
          awssolutionobj[num].awsvpc.awsvpcid;
        subnetids.push(awssolutionobj[num].awssubnet);
        prevsubnet.push(awssolutionobj[num].subnetid);
      }
    }

    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      AwsController.getCrossAccountCredentials(
        ecl2cloud,
        req.body.zonename,
        regionData.tenantrefid,
        regionData.accountdata ? regionData.accountdata.rolename : null
      ).then(async (acl) => {
        AWS.config.region = req.body.zonename;
        AWS.config.update(acl);
        // Create EC2 service object
        var ec2service = new AWS.EC2({
          apiVersion: constants.AWS_EC2_APIVERSION,
        });

        if (subnetids.length > 0) {
          for (let num: number = 0; num < Number(subnetids.length); num++) {
            var params = {
              CidrBlock: subnetids[num].ipv4cidr,
              VpcId: subnetids[num].awsvpcid,
            };
            ec2service.createSubnet(params, function (err, data) {
              if (err) {
                console.log(err, err.stack); // an error occurred
                // reject(err);
                new Controller().uploadLog(deploymentsdata.deploymentid);
              } else {
                console.log(data);
                subnetids[num].awssubnetd = data.Subnet.SubnetId;
                CommonService.update(
                  { subnetid: subnetids[num].subnetid },
                  { awssubnetd: data.Subnet.SubnetId },
                  db.awssubnet
                )
                  .then((result) => {
                    CommonService.update(
                      { awssubnetd: subnetids[num].vpcid },
                      { awssubnetd: data.Subnet.SubnetId },
                      db.awssolution
                    );
                    new Controller().updateTag(
                      ec2service,
                      data.Subnet.SubnetId,
                      subnetids[num].subnetname
                    );
                  })
                  .catch((error: Error) => {
                    console.log(error);
                  });
                if (subnetids.length == num + 1) {
                  console.log(subnetids);
                  for (
                    let i: number = 0;
                    i < Number(awssolutionobj.length);
                    i++
                  ) {
                    if (
                      awssolutionobj[i].awssubnet.awssubnetd ==
                      awssolutionobj[i].awssubnet.subnetid
                    ) {
                      let subnet = _.find(subnetids, function (o) {
                        return (
                          o.subnetid == awssolutionobj[i].awssubnet.subnetid
                        );
                      });

                      if (subnet) {
                        awssolutionobj[i].awssubnet.awssubnetd =
                          subnet.awssubnetd;
                      }
                    }
                    if (Number(awssolutionobj.length) == i + 1) {
                      setTimeout(function () {
                        new Controller()
                          .createSecurityGroup(
                            req,
                            awssolutionobj,
                            ecl2cloud,
                            customerid,
                            regionData,
                            deploymentsdata
                          )
                          .then((networkdata) => {
                            resolve(subnetids);
                          })
                          .catch((error: Error) => {
                            console.log(error);
                          });
                      }, 500);
                    }
                  }
                }
              }
            });
          }
        } else {
          console.log("Note : Subnet(s) already created.......");
          new Controller()
            .createSecurityGroup(
              req,
              awssolutionobj,
              ecl2cloud,
              customerid,
              regionData,
              deploymentsdata
            )
            .then((networkdata) => {
              resolve(subnetids);
            })
            .catch((error: Error) => {
              console.log(error);
            });
        }
      });
    });

    return promise;
  }
  createSecurityGroup(
    req: any,
    awssolutionobj: any,
    ecl2cloud: any,
    customerid: any,
    regionData: any,
    deploymentsdata?
  ): Promise<any> {
    console.log("Create Security Group Function Calling.......");
    let sgids: any = [];
    let prevsg: any = [];

    // Create EC2 service object
    for (let num: number = 0; num < Number(awssolutionobj.length); num++) {
      if (
        false === prevsg.indexOf(awssolutionobj[num].securitygroupid) > -1 &&
        (awssolutionobj[num].awssg.securitygroupname == "Auto Create" ||
          awssolutionobj[num].awssg.awssecuritygroupid ==
            awssolutionobj[num].awssg.securitygroupid)
      ) {
        awssolutionobj[num].awssg.awsvpcid =
          awssolutionobj[num].awsvpc.awsvpcid;
        awssolutionobj[num].awssg.awssubnetd =
          awssolutionobj[num].awssubnet.awssubnetd;
        sgids.push(awssolutionobj[num].awssg);
        prevsg.push(awssolutionobj[num].securitygroupid);
      }
    }

    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      if (sgids.length > 0) {
        AwsController.getCrossAccountCredentials(
          ecl2cloud,
          req.body.zonename,
          regionData.tenantrefid,
          regionData.accountdata ? regionData.accountdata.rolename : null
        ).then(async (acl) => {
          AWS.config.region = req.body.zonename;
          AWS.config.update(acl);

          var ec2service = new AWS.EC2({
            apiVersion: constants.AWS_EC2_APIVERSION,
          });

          console.log("Create Security Group Count......." + sgids.length);
          for (let num: number = 0; num < Number(sgids.length); num++) {
            var params = {
              Description: sgids[num].securitygroupname,
              GroupName:
                sgids[num].securitygroupname +
                "_" +
                req.body.solution.implementationname,
              // VpcId: sgids[num].awsvpcid
              VpcId: awssolutionobj[num].awsvpc.awsvpcid,
            };
            ec2service.createSecurityGroup(params, function (err, data) {
              if (err) {
                console.log(err, err.stack); // an error occurred
                // reject(err);
                new Controller().uploadLog(deploymentsdata.deploymentid);
              } else {
                console.log(data);
                sgids[num].awssecuritygroupid = data.GroupId;
                // CommonService.update({ securitygroupid: sgids[num].securitygroupid }, { awssecuritygroupid: data.GroupId }, db.awssg).then((result) => {
                //     new Controller().updateTag(ec2service, data.GroupId, sgids[num].securitygroupname + '_' + req.body.solution.implementationname);
                // }).catch((error: Error) => {
                //     console.log(error);
                // });
                let condition = {} as any;
                condition.where = {
                  securitygroupid: sgids[num].securitygroupid,
                };
                condition.include = [
                  {
                    model: db.awssgrules,
                    as: "awssgrules",
                    where: { status: "Active" },
                  },
                ];
                CommonService.getData(condition, db.awssg).then((sgresult) => {
                  if (sgresult) {
                    let obj = sgresult.dataValues;
                    delete obj["securitygroupid"];
                    obj.awssecuritygroupid = data.GroupId;
                    obj.createddt = new Date();
                    obj.createdby = "SYSTEM";
                    obj.securitygroupname =
                      sgids[num].securitygroupname +
                      "_" +
                      req.body.solution.implementationname;
                    CommonService.create(obj, db.awssg)
                      .then((result) => {
                        sgids[num].securitygroupid = result.securitygroupid;
                        // ingress call
                        if (
                          sgresult.dataValues.awssgrules &&
                          sgresult.dataValues.awssgrules.length > 0
                        ) {
                          let params = {
                            GroupId: data.GroupId,
                            IpPermissions: [],
                          };
                          for (
                            let i = 0;
                            i < sgresult.dataValues.awssgrules.length;
                            i++
                          ) {
                            let rule = {
                              FromPort:
                                sgresult.dataValues.awssgrules[i].portrange,
                              IpProtocol:
                                sgresult.dataValues.awssgrules[i].protocol,
                              ToPort:
                                sgresult.dataValues.awssgrules[i].portrange,
                            } as any;
                            if (
                              sgresult.dataValues.awssgrules[i].sourcetype ==
                                null ||
                              sgresult.dataValues.awssgrules[i].sourcetype ==
                                "IP"
                            ) {
                              rule.IpRanges = [
                                {
                                  CidrIp:
                                    sgresult.dataValues.awssgrules[i].source,
                                },
                              ];
                            } else if (
                              sgresult.dataValues.awssgrules[i].sourcetype ==
                              "SG"
                            ) {
                              rule.UserIdGroupPairs = [
                                {
                                  GroupId:
                                    sgresult.dataValues.awssgrules[i].source,
                                },
                              ];
                            }
                            params.IpPermissions.push(rule);
                          }
                          console.log("SG Rules >>", params);
                          ec2service.authorizeSecurityGroupIngress(
                            params,
                            function (err, data) {
                              if (err) {
                                console.log(err); // an error occurred
                                // reject(err);
                              } else {
                                console.log("Rules created");
                              }
                            }
                          );
                        }

                        new Controller().updateTag(
                          ec2service,
                          data.GroupId,
                          sgids[num].securitygroupname +
                            "_" +
                            req.body.solution.implementationname
                        );
                      })
                      .catch((error: Error) => {
                        console.log(error);
                      });
                  }
                });
                if (sgids.length == num + 1) {
                  console.log(sgids);
                  for (
                    let i: number = 0;
                    i < Number(awssolutionobj.length);
                    i++
                  ) {
                    if (
                      awssolutionobj[i].awssg.awssecuritygroupid ==
                      awssolutionobj[i].awssg.securitygroupid
                    ) {
                      let sg = _.find(sgids, function (o) {
                        return (
                          o.securitygroupid ==
                          awssolutionobj[i].awssg.securitygroupid
                        );
                      });
                      if (sg) {
                        awssolutionobj[i].awssg.awssecuritygroupid =
                          sg.awssecuritygroupid;
                      }
                    }
                    if (Number(awssolutionobj.length) == i + 1) {
                      setTimeout(function () {
                        resolve(sgids);
                      }, 500);
                    }
                  }
                }
              }
            });
          }
        });
      } else {
        console.log("Note : SecurityGroup(s) already created.......");
        resolve([]);
      }
    });

    return promise;
  }
  updateTag(ec2service: any, resourceid: any, resourcename: any): void {
    try {
      var params = {
        Resources: [resourceid],
        Tags: [
          {
            Key: "Name",
            Value: resourcename,
          },
        ],
      };
      ec2service.createTags(params, function (err, data) {});
    } catch (e) {}
  }

  createInternetGateway(ec2service: any, resourceid: any): void {
    try {
      ec2service.createInternetGateway({}, function (err, data) {
        console.log(err);
        if (data) {
          console.log("Internet gateway created....");
          var params = {
            InternetGatewayId: data.InternetGateway.InternetGatewayId,
            VpcId: resourceid,
          };
          ec2service.attachInternetGateway(params, function (err, data) {
            console.log("VPC attached with internetgateway....");
          });
        }
        console.log(data);
      });
    } catch (e) {
      console.log(e);
    }
  }

  awsResizeInsType(req: any, res?) {
    let response = {};
    if (req.body && req.body.length > 0) {
      let instanceList = req.body;
      let index = 0;
      iterateInstance(index);
      function iterateInstance(index) {
        console.log("---index-----", index);
        let element = instanceList[index];
        if (null != element) {
          let parameters = {
            where: {
              tenantid: element.tenantid,
              status: constants.STATUS_ACTIVE,
              fieldlabel: { $in: ["CLOUD_DETAILS"] },
            },
          };
          commonService.getAllList(parameters, db.CustomField).then((list) => {
            if (null == list || list.size === 0) {
              if (res)
                customValidation.generateAppError(
                  new AppError(
                    constants.AWS_INVALID_CREDENTIALS.replace(
                      "{region}",
                      req.body.region
                    )
                  ),
                  response,
                  res,
                  req
                );
            }
            let clouddetails = _.find(list, function (data: any) {
              if (data.fieldlabel === "CLOUD_DETAILS") {
                data.fieldvalue = commonService.decrypt(data.fieldvalue);
                return data;
              }
            });
            if (_.isEmpty(clouddetails) || _.isEmpty(clouddetails.fieldvalue)) {
              if (res)
                customValidation.generateAppError(
                  new AppError(
                    constants.AWS_INVALID_CREDENTIALS.replace(
                      "{region}",
                      req.body.region
                    )
                  ),
                  response,
                  res,
                  req
                );
            } else {
              let ecl2cloud = _.find(
                JSON.parse(clouddetails.fieldvalue),
                function (data: any) {
                  if (data.cloudprovider === constants.CLOUD_AWS) {
                    return data;
                  }
                }
              );
              if (
                _.isEmpty(ecl2cloud) ||
                _.isEmpty(ecl2cloud.cloudauthkey) ||
                _.isEmpty(ecl2cloud.cloudseckey)
              ) {
                if (res)
                  customValidation.generateAppError(
                    new AppError(
                      constants.AWS_INVALID_CREDENTIALS.replace(
                        "{region}",
                        req.body.region
                      )
                    ),
                    response,
                    res,
                    req
                  );
              } else {
                new Controller().resizeInstance(
                  element,
                  ecl2cloud,
                  element.customerid
                );
                setTimeout(function () {
                  commonService
                    .getData(
                      { where: { instancetypename: element.instancetype } },
                      db.awsinsttype
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
                    });
                  if (element.upgraderequestid) {
                    commonService.update(
                      { upgraderequestid: element.upgraderequestid },
                      { reqstatus: constants.STATUS_SRM[1] },
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
                      currplantype: element.upgradeplantype,
                      upgradeplantype: element.currplantype,
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
                    "CM - Instance Configurations Changed",
                    "Instance Configurations Changed"
                  );
                  iterateInstance(index);
                }, 25000);
              }
            }
          });
        }
      }
    } else {
      if (res)
        customValidation.generateErrorMsg("Unable to resize", res, 200, req);
    }
  }

  resizeInstance(element: any, ecl2cloud: any, customerid: any): void {
    let response = {};
    try {
      AwsController.obtainCrossAccountCredentials(
        ecl2cloud,
        element.region,
        customerid
      ).then(async (acl) => {
        AWS.config.region = element.region;
        AWS.config.update(acl);
        // Create EC2 service object
        var ec2 = new AWS.EC2({ apiVersion: constants.AWS_EC2_APIVERSION });
        let parameters = { InstanceIds: [element.instancerefid] };
        ec2.stopInstances(parameters, function (err, data) {
          if (err) {
            console.log(err, err.stack); // an error occurred
          } else {
            setTimeout(function () {
              var params = {
                InstanceId: element.instancerefid,
                InstanceType: {
                  Value: element.instancetype,
                },
              };
              ec2.modifyInstanceAttribute(params, function (err, data) {
                if (err) {
                  console.log(err, err.stack); // an error occurred
                  //customValidation.generateAppError(err, response, res, req);
                } else {
                  console.log(data);
                  ec2.startInstances(parameters, function (err, data) {}); // successful response
                }
              });
            }, 150000);
          }
        });
      });
    } catch (e) {
      console.log(e);
    }
  }

  uploadLog(deploymentid) {
    console.log("Upload log to S3>>>>>");
    CommonService.uploadFiletoS3(
      process.cwd() +
        "/instances/" +
        deploymentid +
        "/" +
        deploymentid +
        ".log",
      "Instances/" + deploymentid + ".log"
    );
  }
}
export default new Controller();

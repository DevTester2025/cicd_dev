import CommonService from "../../services/common.service";
import db from "../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../common/validation/customValidation";
import { constants } from "../../../common/constants";
import * as fs from "fs";
import * as _ from "lodash";
import * as shell from "shelljs";
import logger from "../../../common/logger";
import commonService from "../../services/common.service";
import { Tail } from "tail";
import { messages } from "../../../common/messages";
import { AppError } from "../../../common/appError";
import ecl2controller from "./ecl2/common/controller";
import awscontroller from "./aws/common/controller";
var AWS = require("aws-sdk");
import { AssetListTemplate } from "../../../reports/templates";
import { CommonHelper } from "../../../reports";
import DownloadService from "../../services/download.service";
export class Controller {
  constructor() {
    // Empty constructor
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {
        where: req.body,
        include: [
          {
            model: db.Solutions,
            as: "solution",
            required: false,
            paranoid: false,
          },
          {
            model: db.awszones,
            as: "zone",
            attributes: ["zonename", "zoneid"],
            required: false,
            paranoid: false,
          },
          {
            model: db.TenantRegion,
            as: "tnregion",
            attributes: ["region"],
            required: false,
            paranoid: false,
          },
          {
            model: db.Customer,
            as: "client",
            attributes: ["customername", "customerid"],
          },
          {
            model: db.awsdeployments,
            as: "awsdeployments",
            required: false,
            paranoid: false,
            include: [
              {
                model: db.awsvpc,
                as: "awsvpc",
                attributes: ["vpcname", "awsvpcid", "vpcid"],
                required: false,
                paranoid: false,
              },
              {
                model: db.awssg,
                as: "awssg",
                required: false,
                paranoid: false,
                attributes: [
                  "securitygroupname",
                  "awssecuritygroupid",
                  "securitygroupid",
                ],
              },
              {
                model: db.awssubnet,
                as: "awssubnet",
                required: false,
                paranoid: false,
                attributes: ["subnetname", "awssubnetd", "subnetid"],
              },
              {
                model: db.awssolution,
                as: "awssolution",
                required: false,
                paranoid: false,
                include: [
                  {
                    model: db.awslb,
                    as: "lb",
                    required: false,
                    paranoid: false,
                  },
                ],
              },
              {
                model: db.TagValues,
                as: "tagvalues",
                paranoid: true,
                required: false,
                where: {
                  status: "Active",
                  cloudprovider: "AWS",
                  resourcetype: "DEPLOYMENT_ASSET",
                },
                include: [
                  {
                    model: db.Tags,
                    as: "tag",
                    paranoid: false,
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
        order: [["lastupdateddt", "desc"]],
      };
      if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.deployments)
          .then((list) => {
            let template = {
              content: AssetListTemplate,
              engine: "handlebars",
              helpers: CommonHelper,
              recipe: "html-to-xlsx",
            };
            let data = { lists: list, headers: req.body.headers };
            DownloadService.generateFile(data, template, (result) => {
              customValidation.generateSuccessResponse(
                result,
                response,
                constants.RESPONSE_TYPE_LIST,
                res,
                req
              );
            });
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      }
      else {
      CommonService.getAllList(parameters, db.deployments)
        .then((list) => {
          customValidation.generateSuccessResponse(
            list,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  allecl2(req: any, res: any): void {
    const response = {};
    try {
      let parameters = {
        where: req.body,
        include: [
          {
            model: db.Solutions,
            as: "solution",
            required: false,
            paranoid: false,
            include: [
              {
                model: db.ecl2loadbalancers,
                as: "ecl2lb",
                required: false,
                paranoid: false,
              },
            ],
          },
          {
            model: db.ecl2zones,
            as: "ecl2zone",
            attributes: ["zonename", "zoneid"],
            required: false,
            paranoid: false,
          },
          {
            model: db.Customer,
            as: "client",
            attributes: [
              "customername",
              "customerid",
              "ecl2tenantid",
              "ecl2region",
            ],
          },
          {
            model: db.ecl2deployments,
            as: "ecl2deployments",
            required: false,
            paranoid: false,
            include: [
              {
                model: db.ecl2solutions,
                as: "ecl2solution",
                required: false,
                paranoid: false,
              },
              {
                model: db.TagValues,
                as: "tagvalues",
                paranoid: true,
                required: false,
                where: {
                  status: "Active",
                  cloudprovider: "ECL2",
                  resourcetype: "DEPLOYMENT_ASSET",
                },
                include: [
                  {
                    model: db.Tags,
                    as: "tag",
                    paranoid: false,
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
        order: [["lastupdateddt", "desc"]],
      };
      CommonService.getAllList(parameters, db.deployments)
        .then((list: any) => {
          customValidation.generateSuccessResponse(
            list,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  byId(req: Request, res: Response): void {
    let response = {};
    try {
      CommonService.getById(req.params.id, db.deployments)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  create(req: Request, res: Response): void {
    let response = {};
    try {
      let options = {
        include: [
          { model: db.awsdeployments, as: "awsdeployments" },
          { model: db.TagValues, as: "tagvalues" },
        ],
      };
      CommonService.saveWithAssociation(req.body, options, db.deployments)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = {};
    try {
      let condition = { deploymentid: req.body.deploymentid };
      CommonService.update(condition, req.body, db.deployments)
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  resyncassets(req: Request, res: Response): void {
    let response = {};
    try {
      let condition = { where: { status: constants.STATUS_ACTIVE } } as any;
      condition.include = [
        {
          model: db.TenantRegion,
          as: "tenantregion",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
        },
      ];
      condition.group = ["tenantrefid", "region"];
      CommonService.getAllList(condition, db.Customer)
        .then((data) => {
          data = JSON.parse(JSON.stringify(data));
          new Controller().startsyncassets(data, res);
          customValidation.generateSuccessResponse(
            {},
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  startsyncassets(data, res) {
    let awsData = [];
    let ecl2Data = [];
    data.forEach((customer) => {
      if (
        customer &&
        customer.tenantregion &&
        customer.tenantregion.length > 0
      ) {
        try {
          customer.tenantregion.forEach((element) => {
            if (element) {
              if (
                element.tenantrefid ||
                customer.awsaccountid ||
                customer.ecl2tenantid
              ) {
                let obj = {} as any;
                obj.isJob = true;
                if (element.cloudprovider == "ECL2") {
                  obj.customerid = customer.customerid;
                  obj.ecl2tenantid = element.tenantrefid;
                  obj.id = element.tenantrefid;
                  obj.region = element.region;
                  obj.tenantid = element.tenantid;
                  obj.tnregionid = element.tnregionid;
                  ecl2Data.push(obj);
                } else {
                  obj.customerid = customer.customerid;
                  obj.awsaccountid =
                    element.tenantrefid || customer.awsaccountid;
                  obj.region = element.region;
                  obj._accountid = element._accountid;
                  obj.tenantid = element.tenantid;
                  obj.tnregionid = element.tnregionid;
                  obj.createdby = element.createdby;
                  awsData.push(obj);
                }
              }
            }
          });
        } catch (e) {
          console.log(e);
        }
      }
    });
    new Controller().syncAWSAssets(awsData, ecl2Data, res);
  }
  syncecl2Asset(array, res) {
    let i = 0;
    function startsync() {
      let obj = array[i];
      if (obj) {
        try {
          let response = {};
          let requestheader = {
            Accept: "application/json",
            "Content-Type": "application/json",
          };
          let requestparams = {};
          let username = "DATASYNC";
          let defaultstatus = "ACTIVE";
          setTimeout(() => {
            console.log("Moving to next item");
            i++;
            startsync();
            ecl2controller.initSync(
              { body: obj } as any,
              res,
              response,
              requestheader,
              requestparams,
              defaultstatus,
              username
            );
          }, 50000);
        } catch (e) {
          console.log(e);
          i++;
          startsync();
        }
      }
    }
    startsync();
  }
  syncAWSAssets(array, ecl2Data, res) {
    let i = 0;
    function startsync() {
      let obj = array[i];
      console.log(obj);
      if (obj) {
        try {
          let parameters = {} as any;
          let response = {};
          let username = "DATASYNC";
          setTimeout(() => {
            if (obj.awsaccountid) {
              commonService
                .update(
                  { customerid: obj.customerid },
                  { awsaccountid: obj.awsaccountid, awsregion: obj.region },
                  db.Customer
                )
                .then((result) => {
                  console.log(result);
                })
                .catch((error: Error) => {
                  console.log(error);
                });
            } else {
              console.log("Account ID Not found");
            }
            parameters = {
              where: {
                tenantid: obj.tenantid,
                status: constants.STATUS_ACTIVE,
                fieldlabel: { $in: ["CLOUD_DETAILS"] },
              },
            };
            if (obj.region) {
              commonService
                .getAllList(parameters, db.CustomField)
                .then((list) => {
                  if (null == list || list.size === 0) {
                    console.log(
                      new AppError(
                        constants.AWS_INVALID_CREDENTIALS.replace(
                          "{region}",
                          obj.region
                        )
                      )
                    );
                  }
                  let clouddetails = _.find(list, function (data: any) {
                    if (data.fieldlabel === "CLOUD_DETAILS") {
                      data.fieldvalue = commonService.decrypt(data.fieldvalue);
                      return data;
                    }
                  });
                  if (
                    _.isEmpty(clouddetails) ||
                    _.isEmpty(clouddetails.fieldvalue)
                  ) {
                    console.log(
                      new AppError(
                        constants.AWS_INVALID_CREDENTIALS.replace(
                          "{region}",
                          obj.region
                        )
                      )
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
                      console.log(
                        new AppError(
                          constants.AWS_INVALID_CREDENTIALS.replace(
                            "{region}",
                            obj.region
                          )
                        )
                      );
                    } else {
                      parameters.where = {
                        tenantid: obj.tenantid,
                        status: constants.STATUS_ACTIVE,
                        lookupkey: constants.LOOKUPKEY[0],
                      };
                      commonService
                        .getData(parameters, db.LookUp)
                        .then((result) => {
                          result = JSON.parse(JSON.stringify(result));
                          obj.region = [
                            {
                              awszoneid: obj.region,
                            },
                          ];
                          awscontroller.synchronization(
                            { body: obj } as any,
                            res
                          );
                          if (i == array.length) {
                            new Controller().syncecl2Asset(ecl2Data, res);
                          }
                        })
                        .catch((error: Error) => {
                          console.log(error);
                        });
                    }
                  }
                });
            } else {
              console.log(new AppError("Region is mandatory"));
            }
            i++;
            startsync();
          }, 50000);
        } catch (e) {
          console.log(e);
        }
      }
    }
    startsync();
  }
  deploySolution(req: Request, res: Response): void {
    let response = {};
    let cwd = process.cwd();
    let pstdout = process.stdout.write;
    let pstderr = process.stderr.write;
    try {
      console.log(cwd);
      let ecl2cloud = {};
      if (
        !_.isEmpty(req.body.solution.tenant) ||
        !_.isEmpty(req.body.solution.tenant.customfield)
      ) {
        let ecl2cloud = _.find(
          JSON.parse(req.body.solution.tenant.customfield[0].fieldvalue),
          function (data: any) {
            if (data.cloudprovider === "AWS") {
              return data;
            }
          }
        );
        console.log(ecl2cloud);
        if (!_.isEmpty(ecl2cloud)) {
          let C_FOLDER_PATH = cwd + "/instances/";

          console.log(C_FOLDER_PATH);

          let deployments: any = {};
          let count = "1";
          if (Array.isArray(req.body.solution.awssolutions)) {
            count = req.body.solution.awssolutions.length;
          }
          deployments.solutionid = req.body.solutionid;
          deployments.tenantid = req.body.tenantid;
          deployments.requestid = req.body.requestid;
          deployments.zoneid = req.body.zoneid;
          deployments.clientid = req.body.clientid;
          deployments.notes = req.body.notes;
          deployments.cloudprovider = "AWS";
          deployments.status = "Active";
          deployments.createdby = req.body.createdby;
          deployments.createddt = req.body.createddt;
          deployments.lastupdateddt = req.body.lastupdateddt;
          deployments.lastupdatedby = req.body.lastupdatedby;
          deployments.awsdeployments = _.map(
            req.body.solution.awssolutions,
            function (item) {
              item.instancenumber = commonService.generateRandomNumber(4);
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
          CommonService.saveWithAssociation(
            deployments,
            options,
            db.deployments
          )
            .then((deploymentsdata) => {
              let TERRFORM_FILE_PATH =
                C_FOLDER_PATH + deploymentsdata.deploymentid + "/";
              fs.mkdirSync(TERRFORM_FILE_PATH, 0o777);

              let modulename =
                "r_ec2-node_" +
                req.body.solutionid +
                "_" +
                deploymentsdata.deploymentid;
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

                  let result = new Controller().buildInputData(
                    req,
                    res,
                    awssolutionobj,
                    deploymentsdata,
                    lookuplist,
                    modulename,
                    ecl2cloud
                  );

                  let deployscript: any = {};
                  deployscript.deploymentid = deploymentsdata.deploymentid;
                  deployscript.scriptcontent = result;
                  deployscript.createdby = req.body.createdby;
                  deployscript.createddt = req.body.createddt;

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
                        cwd
                      );
                    });
                  fs.appendFile(
                    TERRFORM_FILE_PATH + "main.tf",
                    result,
                    "utf8",
                    function (e) {
                      if (e) {
                        throw e;
                      }

                      // new Controller().writeLog(TERRFORM_FILE_PATH, deploymentsdata);

                      new Controller().exeTerraform(
                        req,
                        res,
                        awssolutionobj,
                        deploymentsdata,
                        TERRFORM_FILE_PATH,
                        cwd,
                        pstdout,
                        pstderr
                      );
                    }
                  );
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
      new Controller().throwError(e, req, res, response, pstdout, pstderr, cwd);
    }
  }
  exeTerraform(
    req: Request,
    res: Response,
    awssolutionobj,
    deploymentsdata: any,
    TERRFORM_FILE_PATH: any,
    cwd: any,
    pstdout: any,
    pstderr: any
  ): void {
    let response = {};
    try {
      if (!fs.existsSync(TERRFORM_FILE_PATH)) {
        fs.mkdirSync(TERRFORM_FILE_PATH);
      }
      let stream = fs.createWriteStream(
        TERRFORM_FILE_PATH + deploymentsdata.deploymentid + ".log"
      );
      process.stdout.write = process.stderr.write = stream.write.bind(stream);
      stream.once("open", function (fd) {
        let tail = new Tail(
          TERRFORM_FILE_PATH + deploymentsdata.deploymentid + ".log"
        );
        tail.watch();
        tail.on("line", (data) => {
          (global as any).io.emit(deploymentsdata.deploymentid, data);
        });

        console.log(TERRFORM_FILE_PATH);
        logger.info(TERRFORM_FILE_PATH);
        console.log(cwd);
        process.chdir(TERRFORM_FILE_PATH);
        // (global as any).io.emit(deploymentsdata.deploymentid, TERRFORM_FILE_PATH);

        shell.exec("terraform --version", function (err, stdout, stderr) {
          if (err) {
            process.chdir(cwd);
            process.stdout.write = pstdout;
            process.stderr.write = pstderr;
          }
          console.log(stdout);
          // (global as any).io.emit(deploymentsdata.deploymentid, stdout);
          // (global as any).io.emit(deploymentsdata.deploymentid, stderr);
          console.log(stderr);
          shell.exec(
            "terraform init " + TERRFORM_FILE_PATH,
            function (err2, stdout2, stderr2) {
              if (err2) {
                process.chdir(cwd);
                process.stdout.write = pstdout;
                process.stderr.write = pstderr;
              }
              console.log(stdout2);
              console.log(stderr2);
              // (global as any).io.emit(deploymentsdata.deploymentid, stdout2);
              // (global as any).io.emit(deploymentsdata.deploymentid, stderr2);
              shell.exec(
                "terraform apply -input=false -auto-approve",
                function (err4, stdout4, stderr4) {
                  if (err4) {
                    process.chdir(cwd);
                    process.stdout.write = pstdout;
                    process.stderr.write = pstderr;
                  }
                  console.log(stdout4);
                  console.log(stderr4);
                  // (global as any).io.emit(deploymentsdata.deploymentid, stdout4);
                  // (global as any).io.emit(deploymentsdata.deploymentid, stderr4);
                  // Read output
                  fs.readFile(
                    TERRFORM_FILE_PATH + "terraform.tfstate",
                    function (err, fileData: any) {
                      if (err) {
                        process.chdir(cwd);
                        process.stdout.write = pstdout;
                        process.stderr.write = pstderr;
                      }
                      if (fileData) {
                        let moduleData = _.find(
                          JSON.parse(fileData).modules,
                          function (o: any) {
                            return o;
                          }
                        );
                        console.log("--- output ---");
                        stream.end();
                        process.stdout.write = pstdout;
                        process.stderr.write = pstderr;
                        process.chdir(cwd);
                        if (moduleData) {
                          new Controller().buildOutputData(
                            req,
                            res,
                            moduleData,
                            awssolutionobj,
                            deploymentsdata
                          );
                        }
                      } else {
                        console.error("Terraform output file is empty.");
                        let awsarray = [];
                        _.map(deploymentsdata.awsdeployments, function (item) {
                          item.dataValues.status = "Failed";
                          awsarray.push(item.dataValues);
                        });
                        new Controller().saveOutput(
                          req,
                          res,
                          awsarray,
                          {},
                          awssolutionobj,
                          deploymentsdata
                        );
                      }
                    }
                  );
                }
              );
            }
          );
        });
      });
    } catch (e) {
      process.stdout.write = pstdout;
      process.stderr.write = pstderr;
      process.chdir(cwd);
      customValidation.generateAppError(e, response, res, req);
    }
  }

  buildInputData(
    req: Request,
    res: Response,
    awssolutionobj: any,
    deploymentsdata: any,
    lookuplist: any,
    modulename: any,
    ecl2cloud: any
  ): any {
    let filestring = "";
    let prevsubnet = [];
    let prevsg = [];
    let prevvpc = [];
    let prelb = [];
    try {
      let username = _.find(lookuplist, function (data: any) {
        if (data.lookupkey === "OS_USERNAME") {
          return data;
        }
      });
      let password = _.find(lookuplist, function (data: any) {
        if (data.lookupkey === "OS_PASSWORD") {
          return data;
        }
      });

      filestring = filestring + ' provider "aws" { \n';
      filestring =
        filestring + ('   access_key = "' + ecl2cloud.cloudauthkey + '" \n');
      filestring =
        filestring + ('   secret_key = "' + ecl2cloud.cloudseckey + '" \n');
      filestring =
        filestring + ('   region     = "' + req.body.zonename + '" \n');
      filestring = filestring + " } \n";
      if (Array.isArray(awssolutionobj)) {
      for (let num: number = 0; num < Number(awssolutionobj.length); num++) {
        filestring =
          filestring +
          (' resource "aws_instance" "r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '" { \n');
        filestring =
          filestring +
          (' ami                                  = "' +
            awssolutionobj[num].awsami.awsamiid +
            '"\n');
        filestring =
          filestring +
          (' instance_type                        = "' +
            awssolutionobj[num].awsinsttype.instancetypename +
            '"\n');

        if (!_.isEmpty(awssolutionobj[num].awssg.awssecuritygroupid)) {
          filestring =
            filestring +
            (' vpc_security_group_ids               = ["' +
              awssolutionobj[num].awssg.awssecuritygroupid +
              '"]\n');
        } else {
          filestring =
            filestring +
            (' vpc_security_group_ids               = ["${aws_security_group.r_sg_' +
              awssolutionobj[num].securitygroupid +
              '.id}"]\n');
        }
        if (
          null != awssolutionobj[num].subnetid &&
          !_.isEmpty(awssolutionobj[num].awssubnet.awssubnetd)
        ) {
          filestring =
            filestring +
            (' subnet_id                            = "' +
              awssolutionobj[num].awssubnet.awssubnetd +
              '"\n');
        } else {
          filestring =
            filestring +
            (' subnet_id                            = "${aws_subnet.r_public-subnet_' +
              awssolutionobj[num].subnetid +
              '.id}"\n');
        }

        filestring =
          filestring +
          (' associate_public_ip_address          = "' +
            (awssolutionobj[num].publicipyn === "Y" ? 1 : 0) +
            '"\n');
        filestring =
          filestring +
          (' instance_initiated_shutdown_behavior =  "' +
            awssolutionobj[num].shutdownbehaviour +
            '"\n');
        filestring =
          filestring +
          (' disable_api_termination              =  "' +
            (awssolutionobj[num].terminationprotectionyn === "Y" ? 1 : 0) +
            '"\n');
        filestring =
          filestring +
          (' monitoring                           =  "' +
            (awssolutionobj[num].monitoringyn === "Y" ? 1 : 0) +
            '"\n');
        filestring =
          filestring + ' key_name                             =  "aws"\n';

        filestring = filestring + "\n tags { \n";
        filestring =
          filestring + 'Name = "' + awssolutionobj[num].instancename + '" \n';
        if (
          null != awssolutionobj[num].tags &&
          awssolutionobj[num].tags.length > 0
        ) {
          for (
            let c: number = 0;
            c < Number(awssolutionobj[num].tags.length);
            c++
          ) {
            filestring =
              filestring +
              awssolutionobj[num].tags[c].tagkey +
              ' = "' +
              awssolutionobj[num].tags[c].tagvalue +
              '" \n';
          }
        }
        filestring = filestring + " }\n";

        if (
          null != awssolutionobj[num].scriptid &&
          -1 !== awssolutionobj[num].scriptid
        ) {
          let paramData = {} as any;
          paramData = _.find(req.body.scriptparams, {
            scriptid: Number(awssolutionobj[num].scriptid),
          });
          let params = "";
          if (paramData !== undefined) {
            params = paramData.paramstring;
          }
          filestring = filestring + ' provisioner "remote-exec" { \n';
          filestring = filestring + "    inline = [  \n";
          filestring =
            filestring +
            '    "powershell.exe Set-ExecutionPolicy RemoteSigned -force", \n';
          filestring =
            filestring +
            ('    "powershell.exe -version 4 -ExecutionPolicy Bypass -File ' +
              params +
              '", \n'); //  tbl_parameter.allparams
          filestring = filestring + "    ] \n";

          filestring = filestring + "    connection { \n";
          filestring = filestring + '    type     = "winrm"  \n';
          filestring =
            filestring + ('    user     = "' + username.keyvalue + '"  \n');
          filestring =
            filestring + ('    password = "' + password.keyvalue + '"  \n');
          filestring = filestring + "    insecure = true  \n";
          filestring = filestring + "    }  \n";
          filestring = filestring + " }  \n";
        }
        filestring = filestring + " }\n";

        if (
          false === prevsubnet.indexOf(awssolutionobj[num].subnetid) > -1 &&
          _.isEmpty(awssolutionobj[num].awssubnet.awssubnetd)
        ) {
          filestring =
            filestring +
            ('    resource "aws_subnet" "r_public-subnet_' +
              awssolutionobj[num].subnetid +
              '" { \n');
          if (_.isEmpty(awssolutionobj[num].awsvpc.awsvpcid)) {
            filestring =
              filestring +
              ('    vpc_id            = " ${aws_vpc.r_vpc_' +
                awssolutionobj[num].vpcid +
                '.id}" \n');
          } else {
            filestring =
              filestring +
              ('    vpc_id            = "' +
                awssolutionobj[num].awsvpc.awsvpcid +
                '" \n');
          }
          filestring =
            filestring +
            ('    cidr_block        = "' +
              awssolutionobj[num].awssubnet.ipv4cidr +
              '" \n');
          if (null != awssolutionobj[num].awssubnet.zoneid) {
            filestring =
              filestring +
              ('    availability_zone = "' + req.body.zonename + '"\n');
          }
          filestring = filestring + "    tags { \n";
          filestring = filestring + '        Name = "public-subnet" \n';
          filestring = filestring + "    } \n";
          filestring = filestring + "    }\n";
        }
        if (
          false === prevvpc.indexOf(awssolutionobj[num].vpcid) > -1 &&
          _.isEmpty(awssolutionobj[num].awsvpc.awsvpcid)
        ) {
          filestring =
            filestring +
            (' resource "aws_vpc" "r_vpc_' +
              awssolutionobj[num].vpcid +
              '" { \n');
          filestring =
            filestring +
            (' cidr_block           = "' +
              awssolutionobj[num].awsvpc.ipv4cidr +
              '" \n');
          filestring = filestring + " enable_dns_hostnames = true \n";

          filestring = filestring + " tags { \n";
          filestring = filestring + '    Name = "vpc" \n';
          filestring = filestring + " } \n";
          filestring = filestring + " } \n";

          filestring =
            filestring +
            ('resource "aws_internet_gateway" "r_igw_' +
              awssolutionobj[num].vpcid +
              '" { \n');
          filestring =
            filestring +
            ('vpc_id = "${aws_vpc.r_vpc_' +
              awssolutionobj[num].vpcid +
              '".id}" \n');

          filestring = filestring + "    tags { \n";
          filestring = filestring + '        Name = "igw" \n';
          filestring = filestring + "    } \n";
          filestring = filestring + "} \n";

          filestring =
            filestring +
            ('resource "aws_route_table" "r_web-public-rt_' +
              awssolutionobj[num].vpcid +
              '" { \n');
          filestring =
            filestring +
            ('vpc_id = "${aws_vpc.r_vpc_' +
              awssolutionobj[num].vpcid +
              '".id}" \n');

          filestring = filestring + "route { \n";
          filestring =
            filestring +
            ('    cidr_block = "' +
              awssolutionobj[num].awsvpc.ipv4cidr +
              '" \n');
          filestring =
            filestring +
            ('    gateway_id = "${aws_internet_gateway.r_igw_' +
              awssolutionobj[num].vpcid +
              '".id}" \n');
          filestring = filestring + "} \n";

          filestring = filestring + "tags { \n";
          filestring = filestring + '    Name = "route" \n';
          filestring = filestring + "} \n";
          filestring = filestring + "} \n";

          filestring =
            filestring +
            ('resource "aws_route_table_association" "r_web-public-rt_' +
              awssolutionobj[num].vpcid +
              '" { \n');
          filestring =
            filestring +
            ('    subnet_id      = "${aws_subnet.r_public-subnet_' +
              awssolutionobj[num].subnetid +
              '".id}" \n');
          filestring =
            filestring +
            ('    route_table_id = "${aws_route_table.r_web-public-rt_' +
              awssolutionobj[num].subnetid +
              '".id}" \n');
          filestring = filestring + "} \n";
        }

        if (
          false === prevsg.indexOf(awssolutionobj[num].securitygroupid) > -1 &&
          _.isEmpty(awssolutionobj[num].awssg.awssecuritygroupid)
        ) {
          filestring =
            filestring +
            (' resource "aws_security_group" "r_sg_' +
              awssolutionobj[num].securitygroupid +
              '" { \n');
          filestring =
            filestring +
            (' name        = "' +
              awssolutionobj[num].awssg.securitygroupname +
              '" \n');

          if (_.isEmpty(awssolutionobj[num].awsvpc.awsvpcid)) {
            filestring =
              filestring +
              ('     vpc_id      = "${aws_vpc.r_vpc_"' +
                awssolutionobj[num].vpcid +
                '".id}" \n');
          } else {
            filestring =
              filestring +
              ('     vpc_id = "' +
                awssolutionobj[num].awsvpc.awsvpcid +
                '" \n');
          }

          for (
            let c: number = 0;
            c < Number(awssolutionobj[num].awssg.awssgrules.length);
            c++
          ) {
            filestring = filestring + "     ingress { \n";
            filestring =
              filestring +
              ('         from_port   = "' +
                awssolutionobj[num].awssg.awssgrules[c].portrange +
                '" \n');
            filestring =
              filestring +
              ('         to_port     = "' +
                awssolutionobj[num].awssg.awssgrules[c].portrange +
                '" \n');
            filestring =
              filestring +
              ('         protocol    = "' +
                awssolutionobj[num].awssg.awssgrules[c].protocol +
                '" \n');
            filestring =
              filestring +
              ('         cidr_blocks = ["' +
                awssolutionobj[num].awsvpc.ipv4cidr +
                '"] \n');
            filestring = filestring + "     } \n";
          }

          filestring = filestring + "     egress { \n";
          filestring = filestring + "         from_port   = 0 \n";
          filestring = filestring + "         to_port     = 0 \n";
          filestring = filestring + '         protocol    = "-1" \n';
          filestring =
            filestring +
            ('         cidr_blocks = ["' +
              awssolutionobj[num].awsvpc.ipv4cidr +
              '"] \n');
          filestring = filestring + "     } \n";

          filestring = filestring + "     tags { \n";
          filestring = filestring + '         Name = "sg" \n';
          filestring = filestring + "     } \n";
          filestring = filestring + " } \n";
        }
        // load balancer

        if (
          false === prelb.indexOf(awssolutionobj[num].lbid) > -1 &&
          null != awssolutionobj[num].lbid
        ) {
          filestring =
            filestring +
            ('  resource "aws_load_balancer_listener_policy" "r_listener-policies-443_' +
              awssolutionobj[num].lbid +
              '" { \n');
          filestring =
            filestring +
            ('  load_balancer_name = "${aws_elb.r_elb_' +
              awssolutionobj[num].lbid +
              '.name}"\n');
          filestring = filestring + "  load_balancer_port = 443\n";

          filestring = filestring + "  policy_names = [\n";
          filestring =
            filestring +
            ('      "' + awssolutionobj[num].lb.securitypolicy + '",\n');
          filestring = filestring + "  ]\n";
          filestring = filestring + "  }\n";

          filestring =
            filestring +
            ('  resource "aws_elb" "r_elb_' +
              awssolutionobj[num].lbid +
              '" { \n');
          let lbname =
            awssolutionobj[num].instancenumber +
            "-" +
            awssolutionobj[num].lb.lbname +
            "-" +
            req.body.customername;

          filestring =
            filestring +
            ('  name            = "' +
              lbname.substring(0, 30).replace(new RegExp(" ", "g"), "-") +
              '" \n');

          if (!_.isEmpty(awssolutionobj[num].awssubnet.awssubnetd)) {
            filestring =
              filestring +
              (' subnets                            = ["' +
                awssolutionobj[num].awssubnet.awssubnetd +
                '"] \n');
          } else {
            filestring =
              filestring +
              (' subnets                            = ["${aws_subnet.r_public-subnet_' +
                awssolutionobj[num].subnetid +
                '.id}"] \n');
          }
          if (!_.isEmpty(awssolutionobj[num].awssg.awssecuritygroupid)) {
            filestring =
              filestring +
              (' security_groups               = ["' +
                awssolutionobj[num].awssg.awssecuritygroupid +
                '"] \n');
          } else {
            filestring =
              filestring +
              (' security_groups               = ["${aws_security_group.r_sg_' +
                awssolutionobj[num].securitygroupid +
                '.id}"] \n');
          }

          if (awssolutionobj[num].lb.listeners.indexOf(80) > -1) {
            filestring = filestring + "  listener {\n";
            filestring = filestring + "      instance_port     = 80\n";
            filestring = filestring + '      instance_protocol = "tcp"\n';
            filestring = filestring + "      lb_port           = 80\n";
            filestring = filestring + '      lb_protocol       = "tcp"\n';
            filestring = filestring + "  }\n";
          }
          if (awssolutionobj[num].lb.listeners.indexOf(443) > -1) {
            filestring = filestring + "  listener {\n";
            filestring = filestring + "      instance_port      = 80 \n";
            filestring = filestring + '      instance_protocol  = "tcp" \n';
            filestring = filestring + "      lb_port            = 443 \n";
            filestring = filestring + '      lb_protocol        = "ssl" \n';
            filestring =
              filestring +
              ('      ssl_certificate_id = "' +
                awssolutionobj[num].lb.certificatearn +
                '" \n');
            filestring = filestring + "  }\n";
          }

          filestring = filestring + "  health_check = [\n";
          filestring = filestring + "      {\n";
          filestring =
            filestring +
            ('     target              = "tcp:' +
              awssolutionobj[num].lb.hcport +
              '" \n');
          filestring =
            filestring +
            ('      interval            = "' +
              awssolutionobj[num].lb.hcinterval +
              '" \n');
          filestring =
            filestring +
            ('      healthy_threshold   = "' +
              awssolutionobj[num].lb.hchealthythreshold +
              '"  \n');
          filestring =
            filestring +
            ('      unhealthy_threshold = "' +
              awssolutionobj[num].lb.hcunhealthythreshold +
              '" \n');
          filestring =
            filestring +
            ('      timeout             = "' +
              awssolutionobj[num].lb.hctimeout +
              '" \n');
          filestring = filestring + "      },\n";
          filestring = filestring + "  ]\n";

          filestring =
            filestring +
            ('  instances                   = ["${aws_instance.r_ec2-node_' +
              awssolutionobj[num].awssolutionid +
              "_" +
              deploymentsdata.deploymentid +
              '.id }"]\n');
          filestring = filestring + "  cross_zone_load_balancing   = true\n";
          filestring = filestring + "  idle_timeout                = 60\n";
          filestring = filestring + "  connection_draining         = false\n";
          filestring = filestring + "  connection_draining_timeout = 300\n";

          filestring = filestring + "  tags = {\n";
          filestring =
            filestring +
            ('      Customer    = "' + req.body.customername + '"\n');
          filestring = filestring + "  }\n";
          filestring = filestring + "  }\n";
        }

        // Output
        filestring =
          filestring +
          ('output "instance_id_' +
            awssolutionobj[num].awssolutionid +
            '" {   \n');
        filestring =
          filestring + '    description = "List of IDs of instances"   \n';
        filestring =
          filestring +
          ('    value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.id}"]   \n');
        filestring = filestring + "  }   \n";

        filestring =
          filestring +
          ('output "availability_zone_' +
            awssolutionobj[num].awssolutionid +
            '" {  \n');
        filestring =
          filestring +
          '    description = "List of availability zones of instances"  \n';
        filestring =
          filestring +
          ('    value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.availability_zone}"]  \n');
        filestring = filestring + " }  \n";

        filestring =
          filestring +
          ('output "key_name_' + awssolutionobj[num].awssolutionid + '" {  \n');
        filestring =
          filestring + '    description = "List of key names of instances"  \n';
        filestring =
          filestring +
          ('    value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.key_name}"]  \n');
        filestring = filestring + "  }  \n";

        filestring =
          filestring +
          ('output "public_dns_' +
            awssolutionobj[num].awssolutionid +
            '" {   \n');
        filestring =
          filestring +
          '    description = "List of public DNS names assigned to the instances. For EC2-VPC, this is only available if you have enabled DNS hostnames for your VPC"  \n';
        filestring =
          filestring +
          ('    value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.public_dns}"]   \n');
        filestring = filestring + "  }  \n";

        filestring =
          filestring +
          ('output "public_ip_' +
            awssolutionobj[num].awssolutionid +
            '" {   \n');
        filestring =
          filestring +
          '    description = "List of public IP addresses assigned to the instances, if applicable"  \n';
        filestring =
          filestring +
          ('    value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.public_ip}"]   \n');
        filestring = filestring + "  }  \n";

        filestring =
          filestring +
          ('output "network_interface_id_' +
            awssolutionobj[num].awssolutionid +
            '" { \n');
        filestring =
          filestring +
          '   description = "List of IDs of the network interface of instances" \n';
        filestring =
          filestring +
          ('    value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.network_interface_id}"] \n');
        filestring = filestring + "  } \n";

        filestring =
          filestring +
          ('output "primary_network_interface_id_' +
            awssolutionobj[num].awssolutionid +
            '" { \n');
        filestring =
          filestring +
          '   description = "List of IDs of the primary network interface of instances" \n';
        filestring =
          filestring +
          ('   value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.primary_network_interface_id}"] \n');
        filestring = filestring + "  } \n";

        filestring =
          filestring +
          ('output "private_dns_' +
            awssolutionobj[num].awssolutionid +
            '" { \n');
        filestring =
          filestring +
          '   description = "List of private DNS names assigned to the instances. Can only be used inside the Amazon EC2, and only available if you have enabled DNS hostnames for your VPC" \n';
        filestring =
          filestring +
          ('   value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.private_dns}"] \n');
        filestring = filestring + " } \n";

        filestring =
          filestring +
          ('output "private_ip_' +
            awssolutionobj[num].awssolutionid +
            '" { \n');
        filestring =
          filestring +
          '    description = "List of private IP addresses assigned to the instances" \n';
        filestring =
          filestring +
          ('    value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.private_ip}"] \n');
        filestring = filestring + "  } \n";

        filestring =
          filestring +
          ('output "security_groups_' +
            awssolutionobj[num].awssolutionid +
            '" { \n');
        filestring =
          filestring +
          '    description = "List of associated security groups of instances" \n';
        filestring =
          filestring +
          ('    value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.security_groups}"] \n');
        filestring = filestring + "  } \n";

        filestring =
          filestring +
          ('output "vpc_security_group_ids_' +
            awssolutionobj[num].awssolutionid +
            '" { \n');
        filestring =
          filestring +
          '   description = "List of associated security groups of instances, if running in non-default VPC" \n';
        filestring =
          filestring +
          ('   value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.vpc_security_group_ids}"] \n');
        filestring = filestring + "  } \n";

        filestring =
          filestring +
          ('output "subnet_id_' +
            awssolutionobj[num].awssolutionid +
            '" {  \n');
        filestring =
          filestring +
          '   description = "List of IDs of VPC subnets of instances" \n';
        filestring =
          filestring +
          ('   value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.subnet_id}"] \n');
        filestring = filestring + "  } \n";

        filestring =
          filestring +
          ('output "tags_' + awssolutionobj[num].awssolutionid + '" { \n');
        filestring =
          filestring + '    description = "List of tags of instances" \n';
        filestring =
          filestring +
          ('    value       = ["${aws_instance.r_ec2-node_' +
            awssolutionobj[num].awssolutionid +
            "_" +
            deploymentsdata.deploymentid +
            '.tags}"] \n');
        filestring = filestring + "  } \n";

        if (awssolutionobj[num].lbid != null) {
          filestring =
            filestring +
            ('output "elb_dns_name_' +
              awssolutionobj[num].awssolutionid +
              '" { \n');
          filestring =
            filestring +
            '    description = "The DNS name of the load balancer" \n';
          filestring =
            filestring +
            ('    value       = ["${aws_elb.r_elb_' +
              awssolutionobj[num].lbid +
              '.*.dns_name}"] \n');
          filestring = filestring + "  } \n";
        }
        prevsubnet[num] = awssolutionobj[num].subnetid;
        prevsg[num] = awssolutionobj[num].securitygroupid;
        prevvpc[num] = awssolutionobj[num].vpcid;
        prelb[num] = awssolutionobj[num].lbid;
      }
    }
      console.log(prevsubnet);
      console.log(prevsg);
      console.log(prevvpc);
      console.log(prelb);

      return filestring;
    } catch (e) {
      console.log(e);
      return filestring;
    }
  }

  buildOutputData(
    req: Request,
    res: Response,
    moduleData: any,
    awssolutionobj: any,
    deploymentsdata: any
  ): void {
    console.log(moduleData.outputs);

    if (null != moduleData.outputs && false === _.isEmpty(moduleData.outputs)) {
      let awsarray = [];
      for (
        let num: number = 0;
        num < Number(deploymentsdata.awsdeployments.length);
        num++
      ) {
        let awsdeploymentObj = {} as any;
        awsdeploymentObj = deploymentsdata.awsdeployments[num].dataValues;
        // console.log(awsdeploymentObj);
        // awsdeploymentObj.tfmoduleid = 'r_ec2-node_' + awsdeploymentObj.awssolutionid + '_' + deploymentsdata.deploymentid; // module name
        awsdeploymentObj.publicipv4 = _.get(
          moduleData.outputs,
          "public_ip_" + awsdeploymentObj.awssolutionid
        ).value[0];
        awsdeploymentObj.privateipv4 = _.get(
          moduleData.outputs,
          "private_ip_" + awsdeploymentObj.awssolutionid
        ).value[0];
        awsdeploymentObj.publicdns = _.get(
          moduleData.outputs,
          "public_dns_" + awsdeploymentObj.awssolutionid
        ).value[0];
        if (null != awssolutionobj[num].lbid) {
          awsdeploymentObj.lbdns = _.get(
            moduleData.outputs,
            "elb_dns_name_" + awsdeploymentObj.awssolutionid
          ).value[0];
        } else {
          awsdeploymentObj.lbdns = null;
        }
        awsdeploymentObj.instanceoutput = JSON.stringify(moduleData.outputs);
        awsdeploymentObj.status = "Deployed";
        awsdeploymentObj.lastupdatedby = req.body.lastupdatedby;
        awsdeploymentObj.lastupdateddt = req.body.lastupdateddt;
        awsarray.push(awsdeploymentObj);
        if (awsarray.length === Number(deploymentsdata.awsdeployments.length)) {
          // console.log(JSON.stringify(awsarray.awsdeployments));
          new Controller().saveOutput(
            req,
            res,
            awsarray,
            moduleData,
            awssolutionobj,
            deploymentsdata
          );
        }
      }
    } else {
      console.log("Terraform output is empty");
      let awsarray = [];
      _.map(deploymentsdata.awsdeployments, function (item) {
        item.dataValues.status = "Failed";
        awsarray.push(item.dataValues);
      });
      new Controller().saveOutput(
        req,
        res,
        awsarray,
        moduleData,
        awssolutionobj,
        deploymentsdata
      );
    }
  }

  saveOutput(
    req: Request,
    res: Response,
    awsarray: any,
    moduleData: any,
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
          console.log("Terraform data stored in table");
          // customValidation.generateSuccessMsg('Process Completed', data, res, '200', req);
        })
        .catch((error: Error) => {
          throw error;
        });
        if (Array.isArray(awssolutionobj)) {
      if (!_.isEmpty(moduleData.outputs)) {
        for (let num: number = 0; num < Number(awssolutionobj.length); num++) {
          if (
            awssolutionobj[num].awsvpc != null &&
            awssolutionobj[num].awsvpc.awsvpcid == null
          ) {
            let vpccondition = { vpcid: awssolutionobj[num].vpcid };
            let awsvpc = awssolutionobj[num].awsvpc;
            awsvpc.awsvpcid = _.get(
              moduleData.outputs,
              "vpc_security_group_ids_" + awssolutionobj[num].awssolutionid
            ).value[0];
            CommonService.update(vpccondition, awsvpc, db.awsvpc)
              .then((data) => {
                console.log("AWS VPC Updated");
              })
              .catch((error: Error) => {
                throw error;
              });
          }
          if (
            awssolutionobj[num].awssg != null &&
            awssolutionobj[num].awssg.awssecuritygroupid == null
          ) {
            let sgcondition = {
              securitygroupid: awssolutionobj[num].securitygroupid,
            };
            let awssg = awssolutionobj[num].awssg;
            awssg.awssecuritygroupid = _.get(
              moduleData.outputs,
              "vpc_security_group_ids_" + awssolutionobj[num].awssolutionid
            ).value[0];
            CommonService.update(sgcondition, awssg, db.awssg)
              .then((data) => {
                console.log("AWS Security Group Updated");
              })
              .catch((error: Error) => {
                throw error;
              });
          }
          if (awssolutionobj[num].awssubnet.awssubnetd == null) {
            let subnetcondition = { subnetid: awssolutionobj[num].subnetid };
            let awssubnet = awssolutionobj[num].awssubnet;
            awssubnet.awssubnetd = _.get(
              moduleData.outputs,
              "subnet_id_" + awssolutionobj[num].awssolutionid
            ).value[0];
            CommonService.update(subnetcondition, awssubnet, db.awssubnet)
              .then((data) => {
                console.log("AWS Subnet Updated");
              })
              .catch((error: Error) => {
                throw error;
              });
          }
        }
      }
    }
    } catch (e) {
      throw e;
    }
  }

  writeLog(path: any, deploymentsdata: any): void {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    let access = fs.createWriteStream(
      path + deploymentsdata.deploymentid + ".log"
    );
    process.stdout.write = process.stderr.write = access.write.bind(access);

    process.on("uncaughtException", function (err) {
      console.error(err && err.stack ? err.stack : err);
    });
  }

  throwError(
    e: any,
    req: Request,
    res: Response,
    response: any,
    pstdout: any,
    pstderr: any,
    cwd: any
  ): void {
    process.stdout.write = pstdout;
    process.stderr.write = pstderr;
    process.chdir(cwd);
    console.log(e);
    customValidation.generateAppError(e, response, res, req);
  }

  readFileLog(req: any, res: any) {
    let response = {};
    let cwd = process.cwd();
    // let C_FOLDER_PATH = cwd + "/instances/";
    // let TERRFORM_FILE_PATH =
    //   C_FOLDER_PATH +
    //   req.body.deploymentid +
    //   "/" +
    //   req.body.deploymentid +
    //   ".log";
    if (req.query.islocal) {
      let id = req.body.deploymentid;
      let logPath = cwd + `/instances/${id}/${id}.log`;
      CommonService.readFile(logPath, req.body)
        .then((result: any) => {
          customValidation.generateSuccessResponse(
            result,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } else {
      const rootFolder =
        req.body && req.body.folder ? req.body.folder : "Instances";

      CommonService.readS3File(
        rootFolder + "/" + req.body.deploymentid + ".log"
      )
        .then((result: any) => {
          customValidation.generateSuccessResponse(
            result,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    }
  }
}
export default new Controller();

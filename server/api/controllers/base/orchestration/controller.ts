import { NodeSSH } from "node-ssh";
import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import { modules } from "../../../../common/module";
import { ChildProcess, exec } from "child_process";
import GetWinExeSession from "../../../services/orchestration/execution/platforms/winexe/getSession";
import getAWSCredentials from "../../../services/orchestration/execution/platforms/awsParamsMngr/getCreds";
import * as _ from "lodash";
import commonService from "../../../services/common.service";
export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    let response = { reference: modules.ORCHESTATION };
    try {
      let parameters: any = {
        where: req.body,
        order: [["lastupdateddt", "DESC"]],
        include: [{
          model: db.Catalog,
          required: false,
          as: "catalog",
          attributes: ["catalogid","referenceid","referencetype","publishstatus","status"],
          where: { status: constants.STATUS_ACTIVE },
        }],
        distinct: true,
      };
      let order = req.query.order as any
      if(typeof order === "string" || order) {
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      };
      if (req.body.startdate && req.body.enddate) {
        parameters["where"]["createddt"] = {
          $between: [req.body.startdate, req.body.enddate],
        };
        parameters["where"] = _.omit(req.body, ["startdate", "enddate"]);
      }
      if (req.query.limit) {
        parameters["limit"] = req.query.limit;
      }
      if (req.query.offset) {
        parameters["offset"] = req.query.offset;
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["orchname"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      parameters.where = _.omit(parameters.where, ["order"]);
      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.Orchestration)
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
      } else {
        CommonService.getAllList(parameters, db.Orchestration)
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

  byId(req: Request, res: Response): void {
    let response = { reference: modules.ORCHESTATION };
    try {
      CommonService.getById(req.params.id, db.Orchestration)
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
    let response = { reference: modules.ORCHESTATION };
    try {
      CommonService.create(req.body, db.Orchestration)
        .then((data) => {
          try {
            commonService.create(
              {
                resourcetypeid: data["orchid"],
                resourcetype: constants.RESOURCETYPE[2],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[4],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: data["createdby"],
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          }catch(error) {
                console.log(`Failed to updating history`, error)
          }
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
    let response = { reference: modules.ORCHESTATION };
    try {
      let condition = { orchid: req.body.orchid };
      CommonService.update(condition, req.body, db.Orchestration)
        .then((data) => {
            try {
              commonService.create(
                {
                  resourcetypeid: data["orchid"],
                  resourcetype: constants.RESOURCETYPE[2],
                  _tenantid: data["tenantid"],
                  new: constants.HISTORYCOMMENTS[5],
                  affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                  status: constants.STATUS_ACTIVE,
                  createdby: data["lastupdatedby"],
                  createddt: new Date(),
                  updatedby: null,
                  updateddt: null,
                },
                db.History
              );
            }catch(error) {
                  console.log(`Failed to updating history`, error)
            }
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
  async checkConnectivity(req: Request, res: Response) {
    let response = { reference: modules.ORCHESTATION };
    try {
      let lookupQry = {
        where: {
          lookupkey: constants.LOOKUPKEYS.AWS_PARAMS_STORE,
          status: constants.STATUS_ACTIVE,
          tenantid: req.body.tenantid,
        },
      };
      let params_config: any = await db.LookUp.findOne(lookupQry);
      let cloudprovider = req.body.cloudprovider;
      let platform = req.body.platform;
      if (params_config) {
        params_config = JSON.parse(params_config.keyvalue);
        let accountid: any = await db.CustomerAccount.findOne({
          where: {
            accountref: params_config.accountid,
            tenantid: req.body.tenantid,
          },
          attributes: ["id"],
        });
        params_config.account_id = accountid.id;
        params_config.tenantid = req.body.tenantid;
        params_config.instancename = req.body.instancename;
        if (cloudprovider == constants.CLOUDPROVIDERS[2]) {
          params_config.instancename = "BLUE-COMMON-SERVER";
          if (constants.BLUE_PLATFORM.includes(platform)) params_config.username = params_config.ad_username;
        };
        await getAWSCredentials(params_config)
          .then((data) => {
            if (constants.BLUE_PLATFORM.includes(platform)) {
              let session = new GetWinExeSession(
                params_config.username,
                data,
                req.body.privateipv4,
                true
              );
              let stream = session.run("Hostname", {
                timeout: 20000,
              });
              let index = 0;
              stream.stdout.on("data", (d: string) => {
                stream.kill();
                if (index == 0) {
                  customValidation.generateSuccessResponse(
                    d,
                    response,
                    constants.RESPONSE_TYPE_UPDATE,
                    res,
                    req
                  );
                  updateStatus("Connected", d, req.body.instancerefid);
                }
                index++;
              });
              stream.stderr.on("data", (d) => {
                if (index == 0) {
                  customValidation.generateErrorMsg(
                    d,
                    res,
                    constants.STATUES_CODES[3],
                    req
                  );
                  updateStatus("Not Connected", d, req.body.instancerefid);
                }
                index++;
              });
            } else {
              const ssh = new NodeSSH();
              ssh
                .connect({
                  host: req.body.privateipv4,
                  username: params_config.username,
                  password: data,
                })
                .then(function () {
                  ssh
                    .execCommand("ifconfig")
                    .then(function (result) {
                      console.log(result, "color:green;");
                      if (result.stdout) {
                        customValidation.generateSuccessResponse(
                          result.stdout,
                          response,
                          constants.RESPONSE_TYPE_UPDATE,
                          res,
                          req
                        );
                        updateStatus("Connected", JSON.stringify(result.stdout), req.body.instancerefid);
                      } else if (result.stderr) {
                        customValidation.generateErrorMsg(
                          result.stderr,
                          res,
                          constants.STATUES_CODES[3],
                          req
                        );
                        updateStatus("Not Connected", JSON.stringify(result.stderr), req.body.instancerefid);
                      } else {
                        customValidation.generateSuccessResponse(
                          result.stdout,
                          response,
                          constants.RESPONSE_TYPE_UPDATE,
                          res,
                          req
                        );
                        updateStatus("Connected", JSON.stringify(result.stdout), req.body.instancerefid);
                      }
                    })
                    .catch((e) => {
                      customValidation.generateErrorMsg(
                        "Connectivity failed",
                        res,
                        constants.STATUES_CODES[3],
                        req
                      );
                      updateStatus("Not Connected", e, req.body.instancerefid);
                    });
                })
                .catch((e) => {
                  customValidation.generateErrorMsg(
                    "Connectivity failed",
                    res,
                    constants.STATUES_CODES[3],
                    req
                  );
                  updateStatus("Not Connected", e, req.body.instancerefid);
                });
            }
          })
          .catch((err) => {
            customValidation.generateErrorMsg(
              err,
              res,
              constants.STATUES_CODES[3],
              req
            );
            updateStatus("Not Connected Catch", err, req.body.instancerefid);
          });
      }
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
      updateStatus("Not Connected", e, req.body.instancerefid);
    }
    function updateStatus(status, logs, insatnceID) {
      db.Instances.update(
        {
          orchstatus: status,
          orchstatuslog: JSON.stringify(logs),
          lastupdateddt: new Date()
        },
        {
          where: {
            instancerefid: insatnceID,
          },
        }
      );
    }
  }
}
export default new Controller();

import CommonService from "../../services/common.service";
import db from "../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../common/validation/customValidation";
import { constants } from "../../../common/constants";
import { messages } from "../../../common/messages";
import _ = require("lodash");
import commonService from "../../services/common.service";
import { AppError } from "../../../common/appError";
import {AssetListTemplate} from "../../../reports/templates";
import {CommonHelper} from "../../../reports";
import DownloadService from "../../services/download.service";

export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      if (req.query.order && typeof req.query.order === "string") {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
          parameters["order"] = [splittedOrder];
      }
      if (req.query.limit) {
        parameters["limit"] = Number(req.query.limit);
      }
      if (req.query.offset) {
        parameters["offset"] = Number(req.query.offset);
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["tenantname"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["contactemail"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["pphoneno"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }

      parameters.where = _.omit(parameters.where, ["order"]);
      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.Tenant)
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
      } else if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["order", "headers"]);
        CommonService.getAllList(parameters, db.Tenant)
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
      } else {
        CommonService.getAllList(parameters, db.Tenant).then((list) => {
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
    let response = {};
    try {
      let query = {} as any;
      query.where = { tenantid: req.params.id };
      query.include = [
        {
          model: db.CustomField,
          as: "parameters",
          where: { paramtype: "Tenant" },
        },
        {
          model: db.LookUp,
          as: "providers",
          required: false,
          where: {
            status: constants.STATUS_ACTIVE,
            lookupkey: "CLOUDPROVIDER",
          },
        },
        {
          model: db.TenantSettings,
          as: "tenantsetting",
          where: {
            status: constants.STATUS_ACTIVE,
          },
        },
      ];
      CommonService.getData(query, db.Tenant)
        .then((data) => {
          if (!_.isEmpty(data.dataValues.parameters)) {
            _.map(data.dataValues.parameters, function (obj: any) {
              if (obj.fieldlabel === "EMAIL_PASSWORD") {
                obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
                  ? commonService.decrypt(obj.fieldvalue)
                  : "";
              }
              if (obj.fieldlabel === "SMS_PASSWORD") {
                obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
                  ? commonService.decrypt(obj.fieldvalue)
                  : "";
              }
              if (obj.fieldlabel === "LDAP_PASSWORD") {
                obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
                  ? commonService.decrypt(obj.fieldvalue)
                  : "";
              }
              try {
                if (obj.fieldlabel === "CLOUD_DETAILS") {
                  obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
                    ? commonService.decrypt(obj.fieldvalue)
                    : "";
                }
              } catch (e) {}
              return obj;
            });
          }
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

  create(req: any, res: any): void {
    let response = {};
    try {
      let request = {} as any;
      if (!customValidation.isEmptyValue(req.body.formData)) {
        request = JSON.parse(req.body.formData);
        request.user.password = CommonService.encrypt(constants.PASSWORD);
      }
      let clouddetails = _.find(request.parameters, function (obj: any) {
        if (obj.fieldlabel === "CLOUD_DETAILS") {
          return obj;
        }
      });
      if (request.isconfirmed) {
        new Controller().saveTenantDetails(req, res, request, response);
      } else {
        new Controller()
          .isDuplicateCloudDetails(clouddetails, request.tenantid, "SAVE")
          .then((data) => {
            console.log(data);
            new Controller().saveTenantDetails(req, res, request, response);
            try {
               CommonService.create(
                {
                  resourcetypeid: data["tenantid"],
                  resourcetype: constants.RESOURCETYPE[3],
                  _tenantid: data["tenantid"],
                  new: constants.HISTORYCOMMENTS[6],
                  affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                  status: constants.STATUS_ACTIVE,
                  createdby: request.user.username,
                  createddt: new Date(),
                  updatedby: null,
                  updateddt: null,
                },
                db.History
              );
            } catch (error) {
              console.log(`Failed to create history`, error);
            }
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      }
    }
     catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: any, res: any): void {
    let response = {};
    try {
      let request = {} as any;
      if (!customValidation.isEmptyValue(req.body.formData)) {
        request = JSON.parse(req.body.formData);
      }
      let clouddetails = _.find(request.parameters, function (obj: any) {
        if (obj.fieldlabel === "CLOUD_DETAILS") {
          return obj;
        }
      });
      if (request.isconfirmed) {
        new Controller().updateTenantDetails(req, res, request, response);
      } else {
        new Controller()
          .isDuplicateCloudDetails(clouddetails, request.tenantid, "UPDATE")
          .then((data) => {
            console.log(data);
            new Controller().updateTenantDetails(req, res, request, response);
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  dashboard(req: any, res: Response): void {
    const response = {};
    try {
      let sequelize = req.sequelize;
      // let query = "select s.solutionname,s.cloudprovider,s.status,count(a.instancename) as servers from csdmdb.tbl_solutions s left join csdmdb.tbl_aws_solution a  on s.solutionid = a.solutionid where s.status ='Active' and s.tenantid = :tenantid group by s.solutionid,  a.solutionid";
      let query = `SELECT
                    d.instanceid  solutionid,
                    d.instancename solutionname,
                    d.cloudprovider,
                    d.status,
                    1 as noofservers,
                    DATE_FORMAT(d.createddt, '%b') AS month
                FROM
                    tbl_tn_instances d where d.status = "Active" and d.tenantid = :tenantid
                ORDER BY
                    d.createddt DESC
            `;
      let params = {
        replacements: {
          tenantid: req.body.tenantid,
        },
      };
      CommonService.executeQuery(query, params, db.sequelize)
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  isDuplicateCloudDetails(
    clouddetails: any,
    ptenantid: any,
    operation: any
  ): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      let cloud = JSON.parse(clouddetails.fieldvalue);
      _.map(cloud, function (obj: any) {
        let cusidsubquery = "";
        let updatesubquery = "";
        if (!_.isEmpty(obj.customerid)) {
          cusidsubquery = " OR fieldvalue LIKE ('%" + obj.customerid + "%')";
        }
        if (operation === "UPDATE") {
          updatesubquery = " AND tenantid !=" + ptenantid;
        }
        let query =
          "SELECT * FROM tbl_bs_customfield WHERE fieldname = 'CLOUD_DETAILS' {updatesubquery} AND (fieldvalue LIKE ('%" +
          obj.cloudauthkey +
          "%') OR fieldvalue LIKE ('%" +
          obj.cloudseckey +
          "%') {cusidsubquery}) LIMIT 1";
        query = query.replace(
          new RegExp("{cusidsubquery}", "g"),
          cusidsubquery
        );
        query = query.replace(
          new RegExp("{updatesubquery}", "g"),
          updatesubquery
        );
        let params = {};
        console.log(query);
        CommonService.executeQuery(query, params, db.sequelize)
          .then((list: any) => {
            if (!customValidation.isEmptyArray(list[0])) {
              throw new AppError("Warning");
            } else {
              resolve(true);
            }
          })
          .catch((error: Error) => {
            reject(error);
          });
      });
    });
    return promise;
  }

  saveTenantDetails(req: any, res: any, request: any, response: any) {
    let condition = {} as any;
    let usercondition = {} as any;

    if (!customValidation.isEmptyValue(req.files.logofile)) {
      let filename = _.get(req.files.logofile, "name");
      request.tenant_logo = filename;
      CommonService.fileUpload(
        req.files.logofile.path,
        constants.FILEUPLOADPATH.TENANT_LOGO + filename
      );
    }
    condition.where = { contactemail: request.contactemail };
    usercondition.where = { email: request.contactemail };
    let parameters = {} as any;
    if (!customValidation.isEmptyValue(request.parameters)) {
      _.map(request.parameters, function (obj: any) {
        if (obj.fieldlabel === "EMAIL_PASSWORD") {
          obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
            ? commonService.encrypt(obj.fieldvalue)
            : "";
        }
        if (obj.fieldlabel === "SMS_PASSWORD") {
          obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
            ? commonService.encrypt(obj.fieldvalue)
            : "";
        }
        if (obj.fieldlabel === "LDAP_PASSWORD") {
          obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
            ? commonService.encrypt(obj.fieldvalue)
            : "";
        }
        if (obj.fieldlabel === "CLOUD_DETAILS") {
          obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
            ? commonService.encrypt(obj.fieldvalue)
            : "";
        }

        return obj;
      });
    }
    parameters.include = [
      { model: db.CustomField, as: "parameters" },
      { model: db.LookUp, as: "providers" },
      { model: db.User, as: "user" },
    ];
    CommonService.getData(condition, db.Tenant)
      .then((tenantdata) => {
        if (tenantdata != null) {
          customValidation.generateErrorMsg(
            messages.TENANT_EXIST,
            res,
            201,
            req
          );
        } else {
          CommonService.getData(usercondition, db.User)
            .then((userdata) => {
              if (userdata != null) {
                customValidation.generateErrorMsg(
                  messages.USER_EXISTS,
                  res,
                  201,
                  req
                );
              } else {
                CommonService.saveWithAssociation(
                  request,
                  parameters,
                  db.Tenant
                ).then((result) => {
                  customValidation.generateSuccessResponse(
                    result,
                    response,
                    constants.RESPONSE_TYPE_SAVE,
                    res,
                    req
                  );
                });
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

  updateTenantDetails(req: any, res: any, request: any, response: any) {
    if (!customValidation.isEmptyValue(req.files.logofile)) {
      let filename = _.get(req.files.logofile, "name");
      request.tenant_logo = filename;
      CommonService.fileUpload(
        req.files.logofile.path,
        constants.FILEUPLOADPATH.TENANT_LOGO + filename
      );
    }
    let condition = { tenantid: request.tenantid };
    CommonService.update(condition, request, db.Tenant)
      .then(async (data) => {
        try {
          await CommonService.create(
            {
              resourcetypeid: data["tenantid"],
              resourcetype: constants.RESOURCETYPE[3],
              _tenantid: data["tenantid"],
              new: constants.HISTORYCOMMENTS[7],
              affectedattribute: constants.AFFECTEDATTRIBUTES[0],
              status: constants.STATUS_ACTIVE,
              createdby: data["lastupdatedby"],
              createddt: new Date(),
              updatedby: null,
              updateddt: null,
            },
            db.History
          );
        } catch (error) {
          console.log("Failed to update history", error);
        }
        if (!customValidation.isEmptyValue(request.parameters)) {
          _.map(request.parameters, function (obj: any) {
            if (obj.fieldlabel === "EMAIL_PASSWORD") {
              obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
                ? commonService.encrypt(obj.fieldvalue)
                : "";
            }
            if (obj.fieldlabel === "SMS_PASSWORD") {
              obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
                ? commonService.encrypt(obj.fieldvalue)
                : "";
            }
            if (obj.fieldlabel === "LDAP_PASSWORD") {
              obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
                ? commonService.encrypt(obj.fieldvalue)
                : "";
            }
            if (obj.fieldlabel === "CLOUD_DETAILS") {
              obj.fieldvalue = !_.isEmpty(obj.fieldvalue)
                ? commonService.encrypt(obj.fieldvalue)
                : "";
            }
            return obj;
          });
          commonService
            .bulkUpdate(
              request.parameters,
              ["fieldvalue", "status"],
              db.CustomField
            )
            .then((result: any) => {
              if (request.providers) {
                commonService.bulkUpdate(
                  request.providers,
                  ["keyname", "keyvalue"],
                  db.LookUp
                );
              }
              //customValidation.generateSuccessResponse(result, response, constants.RESPONSE_TYPE_UPDATE, res, req);
            });
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
  }
}

export default new Controller();

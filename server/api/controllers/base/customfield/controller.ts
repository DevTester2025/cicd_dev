import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import { AppError } from "../../../../common/appError";
import _ = require("lodash");
import { modules } from "../../../../common/module";
const cryptr = require("cryptr");
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = {
      reference: modules.CUSTOMFIELD
    };
    try {
      let parameters = {} as any;
      if ( Array.isArray(req.body.scriptlist) &&
        req.body.scriptlist.length > 0 &&
        !_.isEmpty(req.body.scriptlist) &&
        !_.isUndefined(req.body.scriptlist)
      ) {
        req.body.scriptid = { $in: req.body.scriptlist };
        req.body = _.omit(req.body, "scriptlist");
      }
      if  (Array.isArray(req.body.scriptlist) &&  req.body.scriptlist.length <= 0) {
        req.body = _.omit(req.body, "scriptlist");
      }
      if (
        !_.isEmpty(req.body.paramtypes) &&
        !_.isUndefined(req.body.paramtypes) && Array.isArray(req.body.paramtypes) &&
        req.body.paramtypes.length > 0
      ) {
        req.body.paramtype = { $in: req.body.paramtypes };
        req.body = _.omit(req.body, "paramtypes");
      }
      if (req.body.fieldoption) {
        req.body.fieldoptions = { $ne: req.body.fieldoption };
        req.body = _.omit(req.body, "fieldoption");
      }
      parameters = {
        where: req.body,
        include: [
          // { model: db.Tenant, as: 'tenant', required: false, paranoid: false },
          // { model: db.Customer, as: 'customer', required: false, paranoid: false },
          // { model: db.Scripts, as: 'script', required: false, paranoid: false },
          // { model: db.Solutions, as: 'template', required: false, paranoid: false },
          {
            model: db.CustomField,
            as: "variable",
            required: false,
            on: {
              "$CustomField.tenantid$": {
                $col: "variable.tenantid",
              },
              "$CustomField.fieldvalue$": {
                $col: "variable.fieldname",
              },
            },
          },
        ],
        order: [["lastupdateddt", "desc"]],
      };
      if (req.query.count) {
        if (req.body.searchText) {
          parameters.where = parameters.where
          let searchparams: any = {
            fieldname: {
              $like: `%${req.body.searchText}%`, 
            },
          };
          parameters.where.$or = [searchparams];
        }
        parameters.where = _.omit(req.body, ["headers"]);
        parameters.where = _.omit(req.body, ["searchText", "headers"]);

        CommonService.getCountAndList(parameters, db.CustomField)
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
      else if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.CustomField)
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
            console.log("Error fetching list", error);
            customValidation.generateAppError(error, response, res, req);
          });
      } else {
        parameters.where = _.omit(req.body, ["headers"]);
        CommonService.getAllList(parameters, db.CustomField)
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
    let response = { reference: modules.CUSTOMFIELD };
    try {
      CommonService.getById(req.params.id, db.CustomField)
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
    let response = { reference: modules.CUSTOMFIELD };
    try {
      let condition = {} as any;
      let errormsg = "";
      if (req.body.unique && req.body.unique == "Y") {
        condition.fieldname = req.body.fieldname;
        condition.fieldvalue = req.body.fieldvalue;
        errormsg =
          req.body.fieldname + "(" + req.body.fieldvalue + ") already exist";
      } else if (
        req.body.paramtype == "Script" &&
        _.includes(req.body.fieldvalue, "{{") &&
        _.includes(req.body.fieldvalue, "}}")
      ) {
        condition.tenantid = req.body.tenantid;
        condition.paramtype = req.body.paramtype;
        let querstr;
        if (typeof req.body.fieldvalue === 'string') {
          querstr = req.body.fieldvalue.replace("{{", "").replace("}}", "");
      }
        condition.fieldname = { $like: "%" + querstr + "%" };
        condition.scriptid = req.body.scriptid;
        errormsg = "Entered Variable not exist";
      } else {
        condition.tenantid = req.body.tenantid;
        condition.fieldname = req.body.fieldname;
        condition.fieldvalue = req.body.fieldvalue;

        if (req.body.scriptid) {
          condition.scriptid = req.body.scriptid;
        }

        errormsg = "Parameter already exist";
      }
      if (req.body.datatype == "password") {
        req.body.fieldvalue = new cryptr(constants.APP_SECRET).encrypt(
          req.body.fieldvalue as string
        );
      }
      CommonService.getOrSave(condition, req.body, db.CustomField, [])
        .then((data) => {
          if (data != null && data[1] === false) {
            throw new AppError(errormsg);
          } else {
  try {
    CommonService.create(
      {
        resourcetypeid: data[0]["customfldid"],
        resourcetype: constants.RESOURCETYPE[19],
        _tenantid: data[0]["tenantid"],
        new: constants.HISTORYCOMMENTS[38],
        affectedattribute: constants.AFFECTEDATTRIBUTES[0],
        status: constants.STATUS_ACTIVE,
        createdby: data[0]["createdby"],
        createddt: new Date(),
        updatedby: null,
        updateddt: null,
      },
      db.History
    );
  }catch(error) {
  console.log("Failed to update history", error)
  }
            customValidation.generateSuccessResponse(
              data[0],
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = { reference: modules.CUSTOMFIELD };
    try {
      let condition = { customfldid: req.body.customfldid };
      if (req.body.datatype == "password") {
        req.body.fieldvalue = new cryptr(constants.APP_SECRET).encrypt(
          req.body.fieldvalue as string
        );
      }
      CommonService.update(condition, req.body, db.CustomField)
        .then((data) => {
          try {
            CommonService.create(
              {
                resourcetypeid: data["customfldid"],
                resourcetype: constants.RESOURCETYPE[19],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[39],
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
          console.log("Failed to update history", error)
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
}
export default new Controller();

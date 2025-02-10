import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import { modules } from "../../../../common/module";
import _ = require("lodash");
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.NOTIFICATION };
    try {
      let parameters = {
        where: req.body,
        order: [["lastupdateddt", "desc"]],
      } as any;
      let order = req.query.order as any;
      if (order) {
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      }
      if (req.query.limit) {
        parameters["limit"] = req.query.limit;
      }
      if (req.query.offset) {
        parameters["offset"] = req.query.offset;
      }
      if (req.body.ntftypes) {
        parameters["where"]["ntftype"] = { $in: req.body.ntftypes };
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["event"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["notes"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["lastupdatedby"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["module"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["event"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      parameters.where = _.omit(parameters.where, ["order", "ntftypes", "headers"]);

      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.notificationsetup)
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
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.notificationsetup).then(
          (list) => {
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
            }).catch((error: Error) => {
              customValidation.generateAppError(error, response, res, req);
            });
          }
        );
      } else {
        CommonService.getAllList(parameters, db.notificationsetup)
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
    let response = { reference: modules.NOTIFICATION };
    try {
      CommonService.getById(req.params.id, db.notificationsetup)
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
    let response = { reference: modules.NOTIFICATION };
    try {
      let condition = {
        module: req.body.module,
        event: req.body.event,
        template: req.body.template,
        tenantid: req.body.tenantid,
        ntftype: req.body.ntftype,
        status: constants.STATUS_ACTIVE,
      } as any;
      CommonService.getOrSave(condition, req.body, db.notificationsetup, "")
        .then((data) => {
          if (data != null && data[1] === false) {
            customValidation.generateErrorMsg(
              "Setup Already Exist",
              res,
              201,
              req
            );
          } else if (data != null) {
            customValidation.generateSuccessResponse(
              data,
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
    let response = { reference: modules.NOTIFICATION };
    try {
      let condition = { ntfcsetupid: req.body.ntfcsetupid };
      CommonService.update(condition, req.body, db.notificationsetup)
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
}
export default new Controller();

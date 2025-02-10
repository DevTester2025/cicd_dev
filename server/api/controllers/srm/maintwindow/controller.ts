import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import AlertService from "../../../services/grafana-alert.service";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
import { AssetListTemplate } from "../../../../reports/templates";


export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body };
      // #OP_B627
      if (req.query.order && typeof req.query.order === "string") {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      };
      parameters.where = _.omit(parameters.where, ["order"]);
      if (!req.query.daterange) {
        parameters.where.startdate = {
          $lte: new Date(),
        };
        parameters.where.enddate = {
          $gte: new Date(),
        };
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["windowname"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["cloudprovider"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["region"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.MaintWindow)
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
      CommonService.getAllList(parameters, db.MaintWindow)
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
      CommonService.getAllList(parameters, db.MaintWindow)
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
    let response = {};
    try {
      CommonService.getById(req.params.id, db.MaintWindow)
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
      CommonService.create(req.body, db.MaintWindow)
        .then((data) => {
          try {
            CommonService.create(
              {
                resourcetypeid: data["maintwindowid"],
                resourcetype: constants.RESOURCETYPE[16],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[32],
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
                console.log("Failed to update window", error)
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
  bulkCreate(req: Request, res: Response): void {
    let response = {};
    try {
      CommonService.bulkCreate(req.body, db.MaintWindow)
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
      let condition = { maintwindowid: req.body.maintwindowid };
      CommonService.update(condition, req.body, db.MaintWindow)
        .then(async (data: any) => {
          try {
            CommonService.create(
              {
                resourcetypeid: data["maintwindowid"],
                resourcetype: constants.RESOURCETYPE[16],
                _tenantid: 7,
                new: constants.HISTORYCOMMENTS[33],
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
          if (data.dataValues.status == constants.STATUS_ACTIVE) {
            let window_list = await CommonService.getAllList({
              where: {
                maintwindowid: data.dataValues.maintwindowid, status: constants.STATUS_ACTIVE
              }
            }, db.MaintwindowMap);
            window_list = JSON.parse(JSON.stringify(window_list));
            if (window_list) updateMapping(0);
            async function updateMapping(index) {
              let cur_window = window_list[index];
              if (cur_window && constants.MAINT_WINDW_TYPES.includes(cur_window.txntype)) {
                await AlertService.deleteSilence(cur_window.id);
                await CommonService.update({ id: cur_window.id }, { notes: '' }, db.MaintwindowMap);
                await AlertService.createSilence(cur_window.txnid, cur_window.txntype);
              };
            }
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

  bulkUpdate(req: Request, res: Response): void {
    let response = {};
    try {
      let updateattributes = [
        "windowname",
        "cloudprovider",
        "region",
        "startdate",
        "enddate",
        "duration",
        "status",
        "createdby",
        "createddt",
        "lastupdatedby",
        "lastupdateddt",
      ];
      CommonService.bulkUpdate(req.body, updateattributes, db.MaintWindow)
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

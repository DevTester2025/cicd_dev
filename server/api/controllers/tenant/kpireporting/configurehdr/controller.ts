import CommonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import { modules } from "../../../../../common/module";
import * as _ from "lodash";
import {AssetListTemplate} from "../../../../../reports/templates";
import {CommonHelper} from "../../../../../reports";
import DownloadService from "../../../../services/download.service";

export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    let response = { reference: modules.KPIREPORT };
    try {
      let parameters = { where: req.body, include: [] } as any;
      if (_.isUndefined(req.body.status)) {
        parameters["where"]["status"] = { $ne: "Deleted" };
      }
      if (req.query.limit) {
        parameters["limit"] = req.query.limit;
      }
      if (req.query.offset) {
        parameters["offset"] = req.query.offset;
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["title"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["description"] = {
          $like: "%" + req.body.searchText + "%",
        };

        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      // #OP_B627
      if (req.query.order && typeof req.query.order === "string") {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      };
      parameters.where = _.omit(parameters.where, ["order"]);
      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.KPIReportConfigHdr)
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
        parameters.where = _.omit(req.body, ["headers","order"]);
        CommonService.getAllList(parameters, db.KPIReportConfigHdr)
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

        CommonService.getAllList(parameters, db.KPIReportConfigHdr)
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
      let parameters = {} as any;
      parameters.where = { id: req.params.id };
      parameters.include = [
        {
          model: db.KPIReportConfigDtl,
          as: "configdetail",
          where: { status: "Active" },
        },
      ];
      CommonService.getData(parameters, db.KPIReportConfigHdr)
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
        include: [{ model: db.KPIReportConfigDtl, as: "configdetail" }],
      };
      CommonService.saveWithAssociation(
        req.body,
        options,
        db.KPIReportConfigHdr
      )
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
      let condition = { id: req.body.id };
      CommonService.update(condition, req.body, db.KPIReportConfigHdr)
        .then((data) => {
          if (Array.isArray(req.body.configdetail) && req.body.configdetail.length > 0) {
            CommonService.bulkUpdate(
              req.body.configdetail,
              [
                "tenantid",
                "reporttype",
                "seriesname",
                "startdate",
                "enddate",
                "_confighdrid",
                "duration",
                "groupby",
                "filterby",
                "charttype",
                "settings",
                "status",
                "lastupdateddt",
                "lastupdatedby",
              ],
              db.KPIReportConfigDtl
            ).then((res) => {
              console.log("KPI report details updated");
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  delete(req: Request, res: Response): void {
    let response = {};
    try {
      let condition = { id: req.params.id };
      CommonService.update(
        condition,
        { status: "Deleted" },
        db.KPIReportConfigHdr
      )
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

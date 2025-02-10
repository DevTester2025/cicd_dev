import * as _ from "lodash";
import db from "../../../../models/model";
import { customValidation } from "../../../../../common/validation/customValidation";
import CommonService from "../../../../services/common.service";
import { constants } from "../../../../../common/constants";
import { Request, Response } from "express";
import { modules } from "../../../../../common/module";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = {
      reference: modules.CUSTOMER_DASHBOARD
    };
    try {
      let parameters = { where: req.body } as any;

      parameters.include = [
        {
          model: db.Instances,
          as: "instances",
          attributes: ["instancerefid", "instancename"],
          required: false,
        },
      ];
      if (req.query.include == "header") {
        parameters.include.push({
          model: db.DashboardConfigHdr,
          as: "dashboardconfig",
          where: { status: { $ne: "Deleted" } },
          attributes: ["sectionname"],
        });
      }
      if (req.body.confighdrids) {
        parameters.where["confighdrid"] = {
          $in: req.body.confighdrids,
        };
        parameters.where = _.omit(parameters.where, "confighdrids");
      }
      CommonService.getAllList(parameters, db.DashboardConfigDtl)
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

  byId(req: Request, res: Response): void {
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      CommonService.getById(req.params.configdtlid, db.DashboardConfigDtl)
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
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      CommonService.create(req.body, db.DashboardConfigDtl)
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
  bulkupdate(req: Request, res: Response): void {
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      CommonService.bulkUpdate(
        req.body.configdetail,
        ["displayorder", "lastupdateddt", "lastupdatedby"],
        db.DashboardConfigDtl
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

  update(req: Request, res: Response): void {
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      let condition = { configdtlid: req.body.configdtlid };
      CommonService.update(condition, req.body, db.DashboardConfigDtl)
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
  delete(req: Request, res: Response): void {
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      let condition = { configdtlid: req.params.configdtlid };
      CommonService.update(
        condition,
        { status: "Deleted" },
        db.DashboardConfigDtl
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

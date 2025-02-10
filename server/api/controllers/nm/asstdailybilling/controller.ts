import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import reportService from "../../../services/report.service";
import { queries } from "../../../../common/query";
import sequelize = require("sequelize");

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters = { where: req.body, order: [["billingdt", "asc"]] };
      parameters.include = [];
      if (req.body.billingdates && req.body.billingdates.length > 0) {
        parameters.where["billingdt"] = { $between: req.body.billingdates };
        delete parameters.where["billingdates"];
      }
      if (req.query.customer) {
        parameters.include.push({
          model: db.Customer,
          as: "customer",
          attributes: ["customername", "customerid"],
          required: false,
          where: { status: constants.STATUS_ACTIVE },
        });
      }
      if (req.query.instance) {
        parameters.include.push({
          model: db.Instances,
          as: "instance",
          attributes: ["instancename", "instanceid"],
          required: false,
          include: [],
          where: { status: constants.STATUS_ACTIVE },
        });
      }
      CommonService.getAllList(parameters, db.AssetDailyBilling)
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
    let response = {};
    try {
      let query = {} as any;
      query.where = {
        billingdailyid: req.params.id,
      };

      CommonService.getData(query, db.AssetDailyBilling)
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

  create(req: any, res: Response): void {
    let response = {};
    try {
      CommonService.create(req.body, db.AssetDailyBilling)
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

  update(req: any, res: Response): void {
    let response = {};
    try {
      let condition = { billingdailyid: req.body.billingdailyid };
      CommonService.update(condition, req.body, db.AssetDailyBilling)
        .then((data: any) => {
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

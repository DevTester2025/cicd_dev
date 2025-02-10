import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import * as _ from "lodash";
import ExptrService from "../../../services/exporters.service";

export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body, include: [] };
      CommonService.getAllList(parameters, db.ExptrMapping)
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
      CommonService.getById(req.params.id, db.ExptrMapping)
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
      CommonService.create(req.body, db.ExptrMapping)
        .then((data) => {
          ExptrService.installExporter(data.dataValues, true).then((alert) => {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
          });
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
      let condition = { exptrid: req.body.exptrid };
      CommonService.update(condition, req.body, db.ExptrMapping)
        .then((data: any) => {
          ExptrService.installExporter(data.dataValues).then((alert) => {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
          });
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

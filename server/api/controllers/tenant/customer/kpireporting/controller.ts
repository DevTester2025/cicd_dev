import CommonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import { AppError } from "../../../../../common/appError";
import { modules } from "../../../../../common/module";
export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    let response = { reference: modules.KPIREPORT };
    try {
      let parameters = {
        where: req.body,
      } as any;

      parameters.include = [
        {
          model: db.KPIReportConfigHdr,
          as: "kpiconfighdr",
          where: { status: constants.STATUS_ACTIVE },
          include: [
            {
              model: db.KPIReportConfigDtl,
              as: "configdetail",
              where: { status: constants.STATUS_ACTIVE },
            },
          ],
        },
      ];
      CommonService.getAllList(parameters, db.CustomerKPI)
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
    let condition = {} as any;
    condition.where = { id: req.params.id };
    try {
      CommonService.getData(condition, db.CustomerKPI)
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

  bulkcreate(req: Request, res: Response): void {
    let response = {};
    try {
      CommonService.bulkCreate(req.body.kpireports, db.CustomerKPI)
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
      CommonService.update(condition, req.body, db.CustomerKPI)
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

  bulkupdate(req: Request, res: Response): void {
    let response = {};
    try {
      CommonService.bulkUpdate(
        req.body.kpireports,
        [
          "tenantid",
          "_customerid",
          "_reportid",
          "startdt",
          "enddt",
          "publishyn",
          "status",
          "lastupdateddt",
          "lastupdatedby",
        ],
        db.CustomerKPI
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

import CommonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import { AppError } from "../../../../../common/appError";
import AlertService from "../../../../services/grafana-alert.service";

export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters: any = { where: req.body };
      parameters.include = [
        {
          model: db.MaintWindow,
          as: "maintwindow",
        },
      ];
      CommonService.getAllList(parameters, db.MaintwindowMap)
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
      CommonService.getById(req.params.id, db.MaintwindowMap)
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
      CommonService.getOrSave(
        {
          tenantid: req.body.tenantid,
          maintwindowid: req.body.maintwindowid,
          txnid: req.body.txnid,
          txntype: req.body.txntype,
          status: constants.STATUS_ACTIVE,
        },
        req.body,
        db.MaintwindowMap
      )
        .then((data) => {
          if (data != null && data[1] === false) {
            throw new AppError("Duplicate Maintenance Window selected");
          } else {
            if (constants.MAINT_WINDW_TYPES.includes(req.body.txntype)) {
              AlertService.createSilence(req.body.txnid, req.body.txntype);
            };
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
  bulkCreate(req: Request, res: Response): void {
    let response = {};
    try {
      CommonService.bulkCreate(req.body, db.MaintwindowMap)
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
      CommonService.update(condition, req.body, db.MaintwindowMap)
        .then((data: any) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_UPDATE,
            res,
            req
          );
          console.log(data);
          if (req.body.status == "Deleted" && constants.MAINT_WINDW_TYPES.includes(data.dataValues.txntype)) {
            AlertService.deleteSilence(req.body.id);
          }
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

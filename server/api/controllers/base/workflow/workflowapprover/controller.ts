import { constants } from "../../../../../common/constants";
import { customValidation } from "../../../../../common/validation/customValidation";
import db from "../../../../models/model";
import CommonService from "../../../../services/common.service";
import { Request, Response } from "express";
import { Op } from "sequelize";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
      try {
        let parameters = { where: {
          ...req.body,
          reqid: { [Op.eq]: null },
        },
      } as any;
      CommonService.getAllList(parameters, db.TNWorkFlowApprover)
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

  byId(req: any, res: Response): void {
    let response = {};
    try {
      CommonService.getById(req.params.id, db.TNWorkFlowApprover)
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
      CommonService.create(req.body, db.TNWorkFlowApprover)
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
      let condition = { wrkflowaprvrid: req.body.wrkflowaprvrid };
      CommonService.update(condition, req.body, db.TNWorkFlowApprover)
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
  bulkUpdate(req: Request, res: Response): void {
    let response = {  };
    try {
      let updateattributes = [
        "aprvrseqid",
        "completion_status",
        "rejection_status",
        "notes",
        "userid",
        "status",
        "lastupdatedby",
        "lastupdateddt",
      ];
      CommonService.bulkUpdate(req.body.approvers, updateattributes, db.TNWorkFlowApprover)
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

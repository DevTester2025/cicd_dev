import CommonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body } as any;
      parameters.include = [
        {
          model: db.Tenant,
          as: "tenant",
          attributes: ["tenantname"],
        },
        {
          model: db.Instances,
          as: "instance",
          attributes: ["instancename"],
        },
        {
          model: db.schedulerequestdetail,
          as: "requestdetails",
          where: { status: constants.STATUS_ACTIVE },
        },
      ];
      CommonService.getAllList(parameters, db.schedulerequest)
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
      CommonService.getById(req.params.id, db.schedulerequest)
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
      let query = {} as any;
      query.include = [
        { model: db.schedulerequestdetail, as: "requestdetails" },
      ];
      CommonService.saveWithAssociation(req.body, query, db.schedulerequest)
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
      let condition = { scheduledreqhdrid: req.body.scheduledreqhdrid };
      CommonService.update(condition, req.body, db.schedulerequest)
        .then((data) => {
          CommonService.bulkUpdate(
            req.body.requestdetails,
            [
              "upgradeplantype",
              "reqstarttime",
              "reqendtime",
              "status",
              "lastupdatedby",
              "lastupdateddt",
            ],
            db.schedulerequestdetail
          );
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

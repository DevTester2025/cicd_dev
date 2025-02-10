import CommonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import commonService from "../../../../services/common.service";

export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters.where = req.body;
      parameters.include = [
        {
          model: db.alitags,
          as: "alitags",
          paranoid: false,
          required: false,
          where: { status: "Active", resourcetype: "Alibaba" },
        },
      ];
      CommonService.getAllList(parameters, db.alisolution)
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
      CommonService.getById(req.params.id, db.alisolution)
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
        include: [{ model: db.alitags, as: "alitags" }],
      };
      CommonService.saveWithAssociation(req.body, options, db.alisolution)
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
      let condition = { alisolutionid: req.body.alisolutionid };
      CommonService.update(condition, req.body, db.alisolution)
        .then((data: any) => {
          if (!customValidation.isEmptyValue(req.body.alitags)) {
            let updateattributes = [
              "tagkey",
              "tagvalue",
              "status",
              "resourceid",
              "lastupdatedby",
              "lastupdateddt",
            ];
            commonService
              .bulkUpdate(req.body.alitags, updateattributes, db.alitags)
              .then((result: any) => {
                //
              })
              .catch((error: Error) => {
                customValidation.generateAppError(error, response, res, req);
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
}
export default new Controller();

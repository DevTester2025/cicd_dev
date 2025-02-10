import CommonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";

export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      parameters.include = [
        {
          model: db.alisgrules,
          as: "alisgrules",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
      ];
      CommonService.getAllList(parameters, db.alisecuritygroup)
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
      CommonService.getById(req.params.id, db.alisecuritygroup)
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
      let parameters = {} as any;
      parameters.include = [{ model: db.alisgrules, as: "alisgrules" }];
      CommonService.saveWithAssociation(
        req.body,
        parameters,
        db.alisecuritygroup
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
      let condition = { securitygroupid: req.body.securitygroupid };
      CommonService.update(condition, req.body, db.alisecuritygroup)
        .then((data) => {
          if (!customValidation.isEmptyValue(req.body.alisgrules)) {
            let updateattributes = [
              "tenantid",
              "securitygroupid",
              "sgrulename",
              "nictype",
              "direction",
              "ipprotocol",
              "policy",
              "portrange",
              "priority",
              "notes",
              "status",
              "createdby",
              "createddt",
              "lastupdatedby",
              "lastupdateddt",
            ];
            CommonService.bulkUpdate(
              req.body.alisgrules,
              updateattributes,
              db.alisgrules
            )
              .then((result: any) => {
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
          } else {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_UPDATE,
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
}
export default new Controller();

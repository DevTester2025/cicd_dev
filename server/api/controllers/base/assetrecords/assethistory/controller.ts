import { Request, Response } from "express";
import * as _ from "lodash";
import { constants } from "../../../../../common/constants";
import { modules } from "../../../../../common/module";
import { customValidation } from "../../../../../common/validation/customValidation";
import db from "../../../../models/model";
import commonService from "../../../../services/common.service";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = { reference: modules.CMDBHISTORY };
    try {
      let parameters = { where: req.body };
      parameters["order"] = [["createddt", "desc"]];
      commonService
        .getAllList(parameters, db.AssetsHistory)
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
  create(req: Request, res: Response): void {
    let response = { reference: modules.CMDBHISTORY };
    try {
      commonService
        .create(req.body, db.AssetsHistory)
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
    let response = { reference: modules.CMDBHISTORY };
    try {
      let condition = { id: req.body.id };
      commonService
        .update(condition, req.body, db.AssetsHistory)
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

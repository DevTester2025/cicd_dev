import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { messages } from "../../../../common/messages";
import { constants } from "../../../../common/constants";

import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import _ = require("lodash");
import { modules } from "../../../../common/module";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.SCREENACT };
    try {
      let parameters = {} as any;
      parameters = { where: req.body };
      parameters.include = [{ model: db.Screens, as: "screens" }];
      CommonService.getAllList(parameters, db.ScreenActions)
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
    let response = { reference: modules.SCREENACT };
    try {
      CommonService.getById(req.params.id, db.ScreenActions)
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
    let response = { reference: modules.SCREENACT };
    try {
      CommonService.create(req.body, db.ScreenActions)
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
    let response = { reference: modules.SCREENACT };
    try {
      let condition = { actionid: req.body.actionid };
      CommonService.update(condition, req.body, db.ScreenActions)
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

import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import * as _ from "lodash";
import { modules } from "../../../../common/module";

export class Controller {
  all(req: Request, res: Response): void {
    let response = { reference: modules.ORCHESTATION };
    try {
      let parameters = { where: req.body };
      CommonService.getAllList(parameters, db.ContactPoints)
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
    let response = { reference: modules.ORCHESTATION };
    try {
      CommonService.create(req.body, db.ContactPoints)
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
          customValidation.generateAppError(
            error,
            response,
            res,
            req
          );
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = { reference: modules.ORCHESTATION };
    try {
      let condition;
      if(req.body.module === constants.MODULE[0]){
        condition = { refid: req.body.refid }
      }else {
        condition =  { id: req.body.id }
      }
      CommonService.update(condition, req.body, db.ContactPoints)
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
          customValidation.generateAppError(
            error,
            response,
            res,
            req
          );
        });
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }

  byId(req: Request, res: Response): void {
    let response = { reference: modules.ORCHESTATION };
    try {
      let parameters = {} as any;
      parameters.where = {
        refid: req.params.id
      }
      CommonService.getData(parameters, db.ContactPoints)
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
}
export default new Controller();

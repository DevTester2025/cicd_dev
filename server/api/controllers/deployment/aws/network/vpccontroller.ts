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
      let parameters = { where: req.body };
      parameters["include"] = [{
        model: db.TenantRegion,
        as: "tenantregion",
        attributes: ["region"],
        where: { status: "Active" }
      }];
      parameters.where["tnregionid"] = { $ne: null };
      CommonService.getAllList(parameters, db.awsvpc)
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
      CommonService.getById(req.params.id, db.awsvpc)
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
      CommonService.create(req.body, db.awsvpc)
        .then((data) => {
          data.dataValues["awsvpcid"] = data.dataValues["vpcid"].toString();
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
          CommonService.update(
            { vpcid: data.dataValues["vpcid"] },
            { awsvpcid: data.dataValues["awsvpcid"] },
            db.awsvpc
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
      let condition = { vpcid: req.body.vpcid };
      CommonService.update(condition, req.body, db.awsvpc)
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

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
      if (customValidation.isEmptyValue(req.body.status)) {
        req.body.status = { $ne: "Deleted" };
      }
      let parameters: any = {
        where: req.body,
        order: [["lastupdateddt", "desc"]],
      };

      if (req.query.distinct) {
        parameters["group"] = ["platform"];
      }
      // parameters.where["tnregionid"] = { $ne: null };
      parameters.include = [
        {
          model: db.TenantRegion,
          as: "tnregion",
          attributes: ["region"],
          where: { status: "Active" },
          required: false,
          paranoid: false,
        },
      ];

      CommonService.getAllList(parameters, db.awsami)
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
      CommonService.getById(req.params.id, db.awsami)
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
      CommonService.create(req.body, db.awsami)
        .then((data) => {
          data.dataValues["awsamiid"] = data.dataValues["amiid"].toString();
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
          CommonService.update(
            { amiid: data.dataValues["amiid"] },
            { awsamiid: data.dataValues["awsamiid"] },
            db.awsami
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
      let condition = { amiid: req.body.amiid };
      CommonService.update(condition, req.body, db.awsami)
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

import CommonService from "../../../services/common.service";

import db from "../../../models/model";

import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import { modules } from "../../../../common/module";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {
      reference: modules.CLOUD_ASSET
    };
    try {
      let parameters = {} as any;
      parameters.where = req.body;
      parameters.include = [
        {
          as: "tenantregion",
          model: db.TenantRegion,
          required: false,
          attributes: ["region"],
        },
      ];
      CommonService.getAllList(parameters, db.CloudAsset)
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
    let response = {
      reference: modules.CLOUD_ASSET
    };
    try {
      CommonService.getById(req.params.id, db.CloudAsset)
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
    let response = {
      reference: modules.CLOUD_ASSET
    };
    try {
      CommonService.create(req.body, db.CloudAsset)
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
    let response = {
      reference: modules.CLOUD_ASSET
    };
    try {
      let condition = { assetid: req.body.assetid };
      CommonService.update(condition, req.body, db.CloudAsset)
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
  bulkCreate(req: Request, res: Response): void {
    let response = {
      reference: modules.CLOUD_ASSET
    };
    try {
      CommonService.bulkCreate(req.body, db.CloudAsset)
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
}
export default new Controller();

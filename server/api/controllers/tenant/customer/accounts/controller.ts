import CommonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import { AppError } from "../../../../../common/appError";

export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {
        include: [
          {
            model: db.TenantRegion,
            as: "regions",
            where: { status: "Active" },
            paranoid: false,
            required: false,
          },
        ],
        where: req.body,
      } as any;
      if (req.query.customer) {
        parameters.include.push({
          model: db.Customer,
          as: "customer",
        });
      }
      CommonService.getAllList(parameters, db.CustomerAccount)
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
    let condition = {} as any;
    condition.where = { id: req.params.id };
    try {
      CommonService.getData(condition, db.CustomerAccount)
        .then((data) => {
          if (data.cloudprovider == constants.CLOUD_SENTIA || data.cloudprovider == constants.CLOUD_EQUINIX) {
            data.accountref = CommonService.decrypt(data.accountref);
          }
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
      if (req.query.encryption) {
        req.body.accountref = CommonService.encrypt(req.body.accountref);
      }
      CommonService.create(req.body, db.CustomerAccount)
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
      let condition = { id: req.body.id };
      if (req.query.encryption) {
        req.body.accountref = CommonService.encrypt(req.body.accountref);
      }
      CommonService.update(condition, req.body, db.CustomerAccount)
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

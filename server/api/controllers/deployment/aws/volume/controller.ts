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
      CommonService.getAllList(parameters, db.awsvolumes)
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
      let parameters = {} as any;
      parameters.where = { volumeid: req.params.id };
      if (req.query.plantype) {
        parameters.include = [
          {
            model: db.Instances,
            as: "instance",
            attributes: ["instancename", "instancetyperefid"],
          },
          {
            model: db.TenantRegion,
            as: "tenantregion",
            required: false,
            attributes: ["region"],
          },
          {
            model: db.CostVisual,
            as: "costvisual",
            required: false,
            where: {
              status: constants.STATUS_ACTIVE,
              cloudprovider: "AWS",
              plantype: req.query.plantype,
            },
          },
        ];
      }
      CommonService.getData(parameters, db.awsvolumes)
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
      CommonService.create(req.body, db.awsvolumes)
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
      let condition = { volumeid: req.body.volumeid };
      CommonService.update(condition, req.body, db.awsvolumes)
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

  bulkupdate(req: Request, res: Response): void {
    let response = {};
    try {
      let updateattributes = [
        "awssolutionid",
        "volumetype",
        "sizeingb",
        "delontermination",
        "encryptedyn",
        "notes",
        "status",
        "lastupdatedby",
        "lastupdateddt",
        "tenantid",
      ];
      CommonService.bulkUpdate(req.body, updateattributes, db.awsvolumes)
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

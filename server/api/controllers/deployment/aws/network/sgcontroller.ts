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
      let parameters: any = { where: req.body };
      parameters.include = [{ model: db.awssgrules, as: "awssgrules" }];
      parameters.include.push({
        model: db.TenantRegion,
        as: "tenantregion",
        attributes: ["region"],
        where: { status: "Active" }
      });
      parameters.where["tnregionid"] = { $ne: null };
      CommonService.getAllList(parameters, db.awssg)
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
    let query = {} as any;
    try {
      query.where = {
        securitygroupid: req.params.id,
      };
      query.include = [{ model: db.awssgrules, as: "awssgrules" }];
      CommonService.getData(query, db.awssg)
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
        include: [{ model: db.awssgrules, as: "awssgrules" }],
      };
      CommonService.saveWithAssociation(req.body, options, db.awssg)
        .then((data) => {
          data.dataValues["awssecuritygroupid"] =
            data.dataValues["securitygroupid"].toString();
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
          CommonService.update(
            { securitygroupid: data.dataValues["securitygroupid"] },
            { awssecuritygroupid: data.dataValues["awssecuritygroupid"] },
            db.awssg
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
      CommonService.update(condition, req.body, db.awssg)
        .then((data) => {
          if (!customValidation.isEmptyArray(req.body.awssgrules)) {
            let updateattributes;
            updateattributes = [
              "type",
              "protocol",
              "portrange",
              "source",
              "sourcetype",
              "notes",
              "status",
              "lastupdatedby",
              "lastupdateddt",
            ];
            CommonService.bulkUpdate(
              req.body.awssgrules,
              updateattributes,
              db.awssgrules
            ).then((updateddata) => {
              customValidation.generateSuccessResponse(
                updateddata,
                response,
                constants.RESPONSE_TYPE_UPDATE,
                res,
                req
              );
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

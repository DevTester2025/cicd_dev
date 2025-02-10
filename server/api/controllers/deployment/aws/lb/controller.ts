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
      let parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      CommonService.getAllList(parameters, db.awslb)
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
      let query = {} as any;
      query.where = { lbid: req.params.id };
      query.include = [
        {
          model: db.awssubnet,
          as: "lbsubnet",
          attributes: ["subnetname", "subnetid"],
          required: false,
          paranoid: false,
        },
        {
          model: db.awssg,
          as: "lbsecuritygroup",
          attributes: ["securitygroupname", "securitygroupid"],
          required: false,
          paranoid: false,
        },
        {
          model: db.awssolution,
          as: "awssolution",
          attributes: ["instancename", "lbid"],
          required: false,
          paranoid: false,
        },
      ];
      CommonService.getData(query, db.awslb)
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
      CommonService.create(req.body, db.awslb)
        .then((data) => {
          try {
            CommonService.create(
              {
                resourcetypeid: data["solutionid"],
                resourcetype: constants.RESOURCETYPE[18],
                _tenantid: process.env.ON_PREM_TENANTID,
                new: constants.HISTORYCOMMENTS[42],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: data["createdby"],
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          }catch(error) {
          console.log("Failed to update history", error)
          }
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
      let condition = { lbid: req.body.lbid };
      CommonService.update(condition, req.body, db.awslb)
        .then((data) => {
          try {
            CommonService.create(
              {
                resourcetypeid: data["solutionid"],
                resourcetype: constants.RESOURCETYPE[18],
                _tenantid: process.env.ON_PREM_TENANTID,
                new: constants.HISTORYCOMMENTS[43],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: data["lastupdatedby"],
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          }catch(error) {
          console.log("Failed to update history", error)
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

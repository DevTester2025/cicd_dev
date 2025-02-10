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
      let parameters = {} as any;
      parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      parameters.include = [
        {
          model: db.awsvpc,
          as: "awsvpc",
          attributes: ["vpcname", "awsvpcid", "vpcid"],
          required: false,
          paranoid: false,
        },
        //{ model: db.awssolution, as: 'awssolution', attributes: ['instancename', 'awssolutionid'], required: false, paranoid: false },
        {
          model: db.deployments,
          as: "deployments",
          required: false,
          paranoid: false,
          include: [
            {
              model: db.awszones,
              as: "zone",
              attributes: ["zonename", "zoneid"],
              required: false,
              paranoid: false,
            },
            {
              model: db.Customer,
              as: "client",
              attributes: ["customername", "customerid"],
              required: false,
              paranoid: false,
            },
          ],
        },
        {
          model: db.Solutions,
          as: "solution",
          required: false,
          paranoid: false,
        },
        {
          model: db.awssg,
          as: "awssg",
          required: false,
          paranoid: false,
          attributes: [
            "securitygroupname",
            "awssecuritygroupid",
            "securitygroupid",
          ],
        },
        {
          model: db.awssubnet,
          as: "awssubnet",
          required: false,
          paranoid: false,
          attributes: ["subnetname", "awssubnetd", "subnetid"],
        },
        {
          model: db.awssolution,
          as: "awssolution",
          required: false,
          paranoid: false,
          include: [
            {
              model: db.awslb,
              as: "lb",
              required: false,
              paranoid: false,
            },
          ],
        },
      ];
      CommonService.getAllList(parameters, db.awsdeployments)
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
      CommonService.getById(req.params.id, db.awsdeployments)
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
      CommonService.create(req.body, db.awsdeployments)
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
      let condition = { awsdeploymentid: req.body.awsdeploymentid };
      CommonService.update(condition, req.body, db.awsdeployments)
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

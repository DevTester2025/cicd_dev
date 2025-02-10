import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body } as any;
      parameters.include = [
        {
          model: db.Tenant,
          as: "tenant",
          attributes: ["tenantname"],
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.Instances,
          as: "instance",
          attributes: [
            "instancename",
            "region",
            "instanceid",
            "instancename",
            "instancerefid",
          ],
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.MaintWindow,
          as: "maintwindow",
          attributes: ["startdate", "enddate", "windowname"],
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.Customer,
          as: "customer",
          attributes: ["ecl2tenantid", "customername", "customerid"],
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.CostVisual,
          as: "upgradeplan",
          attributes: [
            "unit",
            "plantype",
            "priceperunit",
            "currency",
            "pricingmodel",
          ],
          required: false,
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.CostVisual,
          as: "currentplan",
          attributes: [
            "unit",
            "plantype",
            "priceperunit",
            "currency",
            "pricingmodel",
          ],
          required: false,
          where: { status: constants.STATUS_ACTIVE },
        },
      ];
      parameters.group = ["resourcerefid"];
      if (req.body.daterange) {
        parameters.where["lastupdateddt"] = {
          $between: [
            CommonService.formatDate(
              new Date(req.body.daterange[0]),
              "yyyy-MM-d",
              false
            ),
            CommonService.formatDate(
              new Date(req.body.daterange[1]),
              "yyyy-MM-d",
              false
            ),
          ],
        };
        delete parameters.where["daterange"];
      }

      CommonService.getAllList(parameters, db.UpgradeRequest)
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
      CommonService.getById(req.params.id, db.UpgradeRequest)
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
      // if (req.body.servicerequest) {
      // CommonService.saveWithAssociation(req.body, [{ model: db.srmsr, as: 'servicerequest' }], db.UpgradeRequest).then((data) => {
      //     customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
      // }).catch((error: Error) => {
      //     customValidation.generateAppError(error, response, res, req);
      // });
      // } else {
      CommonService.create(req.body, db.UpgradeRequest)
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
      // }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  bulkCreate(req: Request, res: Response): void {
    let response = {};
    try {
      CommonService.bulkCreate(req.body, db.UpgradeRequest)
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
      let condition = { upgraderequestid: req.body.upgraderequestid };
      CommonService.update(condition, req.body, db.UpgradeRequest)
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

  bulkUpdate(req: Request, res: Response): void {
    let response = {};
    try {
      let updateattributes = [
        "srvrequestid",
        "cloudprovider",
        "resourcetype",
        "resourceid",
        "currplantype",
        "upgradeplantype",
        "maintwindowid",
        "restartreq",
        "reqstatus",
        "notes",
        "status",
        "createdby",
        "createddt",
        "lastupdatedby",
        "lastupdateddt",
      ];
      CommonService.bulkUpdate(req.body, updateattributes, db.UpgradeRequest)
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

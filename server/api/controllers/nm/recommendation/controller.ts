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
      let parameters = { where: req.body, include: [] };

      if (req.body.cloudprovider == "ECL2") {
        parameters.include = [
          {
            model: db.ecl2instancetype,
            as: "ecl2currentplan",
            required: false,
          },
          {
            model: db.ecl2instancetype,
            as: "ecl2recommendedplanone",
            required: false,
          },
          {
            model: db.ecl2instancetype,
            as: "ecl2recommendedplantwo",
            required: false,
          },
          {
            model: db.ecl2instancetype,
            as: "ecl2recommendedplanthree",
            required: false,
          },
        ];
      }
      if (req.body.cloudprovider == "AWS") {
        parameters.include = [
          { model: db.CostVisual, as: "awscurrentplan", required: false },
          {
            model: db.CostVisual,
            as: "awsrecommendedplanone",
            required: false,
          },
          {
            model: db.CostVisual,
            as: "awsrecommendedplantwo",
            required: false,
          },
          {
            model: db.CostVisual,
            as: "awsrecommendedplanthree",
            required: false,
          },
        ];
      }

      CommonService.getAllList(parameters, db.Recommendation)
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
      CommonService.getById(req.params.id, db.Recommendation)
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
      CommonService.create(req.body, db.Recommendation)
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
  bulkCreate(req: Request, res: Response): void {
    let response = {};
    try {
      CommonService.bulkCreate(req.body, db.Recommendation)
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
      let condition = { recommendationid: req.body.recommendationid };
      CommonService.update(condition, req.body, db.Recommendation)
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
        "cloudprovider",
        "resourcetype",
        "plantype",
        "utilrangemin",
        "utilrangemax",
        "recommendedplantype",
        "status",
        "createdby",
        "createddt",
        "lastupdatedby",
        "lastupdateddt",
      ];
      CommonService.bulkUpdate(req.body, updateattributes, db.Recommendation)
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

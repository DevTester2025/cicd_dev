import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants, ECLApiURL } from "../../../../../common/constants";
import * as _ from "lodash";
import { AppError } from "../../../../../common/appError";

export class Controller {
  constructor() {
    //
  }

  assetdetail(req: Request, res: Response): void {
    let response = {};
    try {
      let query = ``;
      //if (req.body.resourcetype && constants.RESOURCE_TYPES.includes(req.body.resourcetype)) {
      if (req.body.resourcetype == constants.RESOURCE_TYPES[0]) {
        query = ``;
      } else if (req.body.resourcetype == constants.RESOURCE_TYPES[1]) {
        query = ``;
      }
      let params = {
        replacements: {
          tenantid: req.body.tenantid,
          customerid: req.body.customerid,
          region: req.body.region,
          resourcetype: req.body.resourcetype,
        },
        type: db.sequelize.QueryTypes.SELECT,
      };
      commonService
        .executeQuery(query, params, db.sequelize)
        .then((list) => {})
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
      // } else {
      //     customValidation.generateAppError(new AppError('Invalid asset type'), response, res, req);
      // }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}

export default new Controller();

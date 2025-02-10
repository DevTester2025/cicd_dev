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
    let response = { reference: modules.LOOKUP };
    try {
      let parameters = {} as any;
      if (!_.isUndefined(req.body.keylist) && req.body.keylist.length > 0) {
        req.body.lookupkey = { $in: req.body.keylist };
        req.body = _.omit(req.body, "keylist");
      }
      if (!_.isUndefined(req.body.tenantids) && req.body.tenantids.length > 0) {
        req.body.tenantid = { $in: req.body.tenantids };
        req.body = _.omit(req.body, "tenantids");
      }
      parameters.where = req.body;
      if (req.body.searchText) {
        let searchparams: any = {};
        req.body.headers.forEach((element) => {
          if (element.field === "keyname") {
            searchparams["keyname"] = {
              $like: "%" + req.body.searchText + "%",
            };
          }
        });
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      CommonService.getAllList(parameters, db.LookUp)
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
    let response = { reference: modules.LOOKUP };
    try {
      CommonService.getById(req.params.id, db.LookUp)
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
    let response = { reference: modules.LOOKUP };
    try {
      CommonService.create(req.body, db.LookUp)
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
    let response = { reference: modules.LOOKUP };
    try {
      let condition = { lookupid: req.body.lookupid };
      CommonService.update(condition, req.body, db.LookUp)
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

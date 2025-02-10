import CommonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import _ = require("lodash");
export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      parameters.include = [
        {
          model: db.alilblistener,
          as: "alilblistener",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
      ];
      CommonService.getAllList(parameters, db.alilb)
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
      let options = {} as any;
      options.include = [
        {
          model: db.alivswitch,
          as: "alivswitch",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.alilblistener,
          as: "alilblistener",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
      ];
      options.where = { lbid: req.params.id };
      CommonService.getData(options, db.alilb)
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
      let options = {} as any;
      options = {
        include: [{ model: db.alilblistener, as: "alilblistener" }],
      };
      CommonService.saveWithAssociation(req.body, options, db.alilb)
        .then((data) => {
          if (!customValidation.isEmptyValue(req.body.alisolution)) {
            req.body.alisolution = _.map(
              req.body.alisolution,
              function (item: any) {
                item.lbid = data.lbid;
                return item;
              }
            );
            let updateattributes = ["lbid", "lastupdatedby", "lastupdateddt"];
            CommonService.bulkUpdate(
              req.body.alisolution,
              updateattributes,
              db.alisolution
            ).then((updateddata) => [
              //
            ]);
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
      CommonService.update(condition, req.body, db.alilb)
        .then((data) => {
          if (!customValidation.isEmptyValue(req.body.alilblistener)) {
            CommonService.update(
              { lblistenerid: req.body.alilblistener.lblistenerid },
              req.body.alilblistener,
              db.alilblistener
            ).then((updateddata) => [
              //
            ]);
          }
          if (!customValidation.isEmptyValue(req.body.alisolution)) {
            let updateattributes = ["lbid", "lastupdatedby", "lastupdateddt"];
            CommonService.bulkUpdate(
              req.body.alisolution,
              updateattributes,
              db.alisolution
            ).then((updateddata) => [
              //
            ]);
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

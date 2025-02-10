import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import * as _ from "lodash";
import { modules } from "../../../../common/module";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = {
      reference: modules.COSTVISUAL,
    };
    try {
      let parameters = { where: req.body } as any;
      parameters.order = [["lastupdateddt", "desc"]];
      if (req.body.plantypes) {
        parameters.where["plantype"] = { $in: req.body.plantypes };
        delete parameters.where["plantypes"];
      }
      if (req.body.resourcetypes) {
        parameters.where["resourcetype"] = { $in: req.body.resourcetypes };
        delete parameters.where["resourcetypes"];
      }
      if (req.body.statuses) {
        parameters.where["status"] = { $in: req.body.statuses };
        delete parameters.where["statuses"];
      }
      CommonService.getAllList(parameters, db.CostVisual)
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
    let response = { reference: modules.COSTVISUAL };
    try {
      CommonService.getById(req.params.id, db.CostVisual)
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
    let response = { reference: modules.COSTVISUAL };
    try {
      CommonService.create(req.body, db.CostVisual)
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
    let response = { reference: modules.COSTVISUAL };
    try {
      CommonService.bulkCreate(req.body, db.CostVisual)
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
    let response = { reference: modules.COSTVISUAL };
    try {
      let condition = { costvisualid: req.body.costvisualid };
      CommonService.update(condition, req.body, db.CostVisual)
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
    let response = { reference: modules.COSTVISUAL };
    try {
      let updateattributes = [
        "cloudprovider",
        "region",
        "resourcetype",
        "plantype",
        "unit",
        "priceperunit",
        "image",
        "currency",
        "status",
        "createdby",
        "createddt",
        "lastupdatedby",
        "lastupdateddt",
      ];
      CommonService.bulkUpdate(req.body, updateattributes, db.CostVisual)
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
  estimate(req: Request, res: Response): void {
    let response = { reference: modules.COSTVISUAL };
    try {
      let resourcetypes = [];
      let plantypes = [];
      if (req.body.assets && req.body.assets.length > 0) {
        req.body.assets.forEach((element) => {
          resourcetypes.push(element.resourcetype);
          plantypes.push(element.plantype);
        });
      }

      let parameters = {
        where: {
          cloudprovider: req.body.cloudprovider,
          region: req.body.region,
          resourcetype: { $in: resourcetypes },
          plantype: { $in: plantypes },
        },
      };
      CommonService.getAllList(parameters, db.CostVisual)
        .then((list) => {
          list = JSON.parse(JSON.stringify(list));
          console.log(list);
          let estimatedvalue = 0;
          list.forEach((element) => {
            let assetcost = _.find(req.body.assets, function (data: any) {
              if (
                data.resourcetype === element.resourcetype &&
                data.plantype === element.plantype
              ) {
                if (data.resourcetype === constants.RESOURCE_TYPES[0]) {
                  if (element.image === req.body.image) {
                    return data;
                  }
                } else {
                  return data;
                }
              }
            });
            console.log(assetcost);
            if (assetcost) {
              estimatedvalue =
                estimatedvalue + element.priceperunit * assetcost.usage;
            }
          });
          setTimeout(function () {
            let result = {
              estimatedvalue: estimatedvalue,
              currency:
                list && list.length > 0
                  ? list[0].currency
                  : constants.DEFALULT_CURRENCY_SYMBOL,
            };
            customValidation.generateSuccessResponse(
              result,
              response,
              constants.RESPONSE_TYPE_LIST,
              res,
              req
            );
          }, 100);
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

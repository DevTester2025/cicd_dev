/*
 * @Author: Vidhya M
 * @Date: 2020-07-23 12:17:16
 * @Last Modified by:   Vidhya M
 * @Last Modified time: 2020-07-23 12:17:16
 */

import CommonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import * as _ from "lodash";
import sequelize = require("sequelize");

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let provider = req.body.cloudprovider;
      let parameters = { where: req.body } as any;
      delete parameters["where"]["cloudprovider"];
      if (provider == "ECL2") {
        parameters.include = [
          {
            model: db.ecl2solutions,
            as: "ecl2solutions",
            required: false,
            where: {
              resourcetype: sequelize.literal(
                '`SolutionCosts`.`resourcetype` = "ASSET_INSTANCE"'
              ),
            },
            attributes: ["instancename"],
            include: [
              {
                model: db.ecl2instancetype,
                as: "ecl2instancetype",
                required: false,
                attributes: ["instancetypename"],
              },
            ],
          },
          {
            model: db.ecl2volumes,
            as: "ecl2volumes",
            required: false,
            where: {
              resourcetype: sequelize.literal(
                '`SolutionCosts`.`resourcetype` = "ASSET_VOLUME"'
              ),
            },
            attributes: ["volumename"],
          },
          // {
          //     model: db.ecl2networks, as: 'ecl2networks', required: false, where: {
          //         resourcetype: sequelize.literal('`SolutionCosts`.`resourcetype` = "ASSET_NETWORK"')
          //     }, attributes: ['networkname']
          // },
          {
            model: db.ecl2loadbalancers,
            as: "ecl2loadbalancers",
            required: false,
            where: {
              resourcetype: sequelize.literal(
                '`SolutionCosts`.`resourcetype` = "ASSET_LB"'
              ),
            },
            attributes: ["lbname"],
          },
          {
            model: db.ecl2vsrx,
            as: "ecl2vsrx",
            required: false,
            where: {
              resourcetype: sequelize.literal(
                '`SolutionCosts`.`resourcetype` = "ASSET_FIREWALL"'
              ),
            },
            attributes: ["vsrxname"],
          },
        ];
      }

      if (provider == "AWS") {
        parameters.include = [
          {
            model: db.awssolution,
            as: "awssolution",
            required: false,
            where: {
              resourcetype: sequelize.literal(
                '`SolutionCosts`.`resourcetype` = "ASSET_INSTANCE"'
              ),
            },
            attributes: ["instancename"],
            include: [
              {
                model: db.awsinsttype,
                as: "awsinsttype",
                required: false,
                attributes: ["instancetypename"],
              },
            ],
          },
          {
            model: db.awsvolumes,
            as: "awsvolumes",
            required: false,
            where: {
              resourcetype: sequelize.literal(
                '`SolutionCosts`.`resourcetype` = "ASSET_VOLUME"'
              ),
            },
            attributes: ["volumetype"],
          },
          {
            model: db.awsvpc,
            as: "awsvpc",
            required: false,
            where: {
              resourcetype: sequelize.literal(
                '`SolutionCosts`.`resourcetype` = "ASSET_NETWORK"'
              ),
            },
            attributes: ["vpcname"],
          },
          {
            model: db.awslb,
            as: "awslb",
            required: false,
            where: {
              resourcetype: sequelize.literal(
                '`SolutionCosts`.`resourcetype` = "ASSET_LB"'
              ),
            },
            attributes: ["lbname"],
          },
        ];
      }
      parameters.include.push({
        model: db.CostVisual,
        as: "costvisual",
        attributes: ["currency", "pricingmodel", "priceperunit"],
      });

      CommonService.getAllList(parameters, db.SolutionCosts)
        .then((list) => {
          if (provider == "ECL2") {
            _.map(list, function (item: any) {
              item = item.dataValues;
              if (item.ecl2solutions && item.ecl2solutions.ecl2instancetype) {
                item.assetname =
                  item.ecl2solutions.ecl2instancetype.instancetypename;
              }
              if (item.ecl2volumes) {
                item.assetname = item.ecl2volumes.volumename;
              }
              if (item.ecl2vsrx) {
                item.assetname = item.ecl2vsrx.vsrxname;
              }
              // if (item.ecl2networks) {
              //     item.assetname = item.ecl2networks.networkname;
              // }
              if (item.ecl2loadbalancers) {
                item.assetname = item.ecl2loadbalancers.lbname;
              }
              if (item.costtype != "Asset") {
                item.assetname = item.costtype;
              }
              return item;
            });
            list = [...list];
          }
          if (provider == "AWS") {
            _.map(list, function (item: any) {
              item = item.dataValues;
              if (item.awssolution && item.awssolution.awsinsttype) {
                item.assetname = item.awssolution.awsinsttype.instancetypename;
              }
              if (item.awsvolumes) {
                item.assetname = item.awsvolumes.volumetype;
              }
              // if (item.awsvpc) {
              //     item.assetname = item.awsvpc.vpcname;
              // }
              if (item.awslb) {
                item.assetname = item.awslb.lbname;
              }
              if (item.costtype != "Asset") {
                item.assetname = item.costtype;
              }
              return item;
            });
            list = [...list];
          }
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
      CommonService.getById(req.params.id, db.SolutionCosts)
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
      CommonService.create(req.body, db.SolutionCosts)
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
      CommonService.bulkCreate(req.body, db.SolutionCosts)
        .then((data) => {
          try {
            CommonService.create(
              {
                resourcetypeid: data[0]["solutionid"],
                resourcetype: constants.RESOURCETYPE[18],
                _tenantid: process.env.ON_PREM_TENANTID,
                new: constants.HISTORYCOMMENTS[44],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: data[0]["createdby"],
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
      let condition = { solutioncostid: req.body.solutioncostid };
      CommonService.update(condition, req.body, db.SolutionCosts)
        .then((data) => {
          try {
            CommonService.create(
              {
                resourcetypeid: data["solutionid"],
                resourcetype: constants.RESOURCETYPE[18],
                _tenantid: process.env.ON_PREM_TENANTID,
                new: constants.HISTORYCOMMENTS[45],
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

  // bulkUpdate(req: Request, res: Response): void {
  //     let response = {};
  //     try {
  //         let updateattributes = ['cloudprovider', 'region', 'resourcetype', 'plantype', 'unit', 'priceperunit',
  //             'image', 'currency', 'status', 'createdby', 'createddt', 'lastupdatedby', 'lastupdateddt'];
  //         CommonService.bulkUpdate(req.body, updateattributes, db.CostVisual).then((data) => {
  //             customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_UPDATE, res, req);
  //         }).catch((error: Error) => {
  //             customValidation.generateAppError(error, response, res, req);
  //         });
  //     } catch (e) {
  //         customValidation.generateAppError(e, response, res, req);
  //     }
  // }
}
export default new Controller();

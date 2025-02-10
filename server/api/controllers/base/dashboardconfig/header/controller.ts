import * as _ from "lodash";
import db from "../../../../models/model";
import { customValidation } from "../../../../../common/validation/customValidation";
import CommonService from "../../../../services/common.service";
import { constants } from "../../../../../common/constants";
import { Request, Response } from "express";
import { modules } from "../../../../../common/module";
import sequelize = require("sequelize");

export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      let parameters = { where: req.body } as any;
      if (req.query.include == "detail") {
        parameters.include = [
          {
            model: db.DashboardConfigDtl,
            as: "dashboardconfigdetails",
            where: { status: { $ne: "Deleted" } },
            paranoid: false,
            include: [
              {
                model: db.Instances,
                as: "instances",
                where: { status: "Active" },
              },
            ],
          },
          {
            model: db.TagValues,
            as: 'assets',
            required: false,
            where: {
              cloudprovider: { $ne: null },
              resourcetype: { $in: ["ASSET_INSTANCE", "VIRTUAL_MACHINES"] },
              tagvalue: { $eq: sequelize.col('Dashboard-ConfigsHdr.tagvalue') },
              status: 'Active'
              // resourcerefid: {
              //   $ne: sequelize.literal(
              //     '`resourcerefid` in (select `instancerefid` from `tbl_bs_dashboardconfigdtl` where status="Active" and customerid=' +
              //     req.body.customerid +
              //     ")"
              //   ),
              // }
            },
            include: [{
              model: db.Instances,
              as: "instances",
              where: {
                status: "Active",
                instancerefid: sequelize.literal(
                  '`assets->instances`.`instancerefid` in (select `resourcerefid` from `tbl_tn_assetmappings` where status="Active" and cloudprovider is not null and resourcetype in ("ASSET_INSTANCE","VIRTUAL_MACHINES") and customerid=' +
                  req.body.customerid +
                  ")"
                ),
              },
            }]
          }
        ];
      }
      if (req.query.include == "tag") {
        parameters.include = [
          {
            model: db.Tags,
            as: "tag",
            attributes: ["tagname"],
          },
        ];
      }
      CommonService.getAllList(parameters, db.DashboardConfigHdr)
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
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      CommonService.getById(req.params.confighdrid, db.DashboardConfigHdr)
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
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      let options = {
        include: [
          { model: db.DashboardConfigDtl, as: "dashboardconfigdetails" },
        ],
      };
      CommonService.saveWithAssociation(
        req.body.grouplist,
        options,
        db.DashboardConfigHdr
      )
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

  bulkupdate(req: Request, res: Response): void {
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      CommonService.bulkUpdate(
        req.body.grouplist,
        ["confighdrid", "displayorder", "lastupdateddt", "lastupdatedby"],
        db.DashboardConfigHdr
      )
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
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      let condition = { confighdrid: req.body.grouplist.confighdrid };
      CommonService.update(condition, req.body.grouplist, db.DashboardConfigHdr)
        .then((data) => {
          if (req.body.grouplist.dashboardconfigdetails) {
            // let attributes = [
            //   "displayname",
            //   "referenceid",
            //   "tenantid",
            //   "reportyn",
            //   "uptime",
            //   "status",
            //   "lastupdateddt",
            //   "lastupdatedby",
            // ];
            CommonService.delete(
              { confighdrid: req.body.grouplist.confighdrid },
              db.DashboardConfigDtl
            )
              .then((data) => {
                CommonService.bulkCreate(
                  req.body.grouplist.dashboardconfigdetails,
                  db.DashboardConfigDtl
                )
                  .then((dtdata) => {
                    customValidation.generateSuccessResponse(
                      dtdata,
                      response,
                      constants.RESPONSE_TYPE_UPDATE,
                      res,
                      req
                    );
                  })
                  .catch((error: Error) => {
                    customValidation.generateAppError(
                      error,
                      response,
                      res,
                      req
                    );
                  });
              })
              .catch((error: Error) => {
                customValidation.generateAppError(error, response, res, req);
              });
          } else {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }
  delete(req: Request, res: Response): void {
    let response = { reference: modules.CUSTOMER_DASHBOARD };
    try {
      let condition = { confighdrid: req.params.id };
      CommonService.delete(condition, db.DashboardConfigHdr)
        .then((data) => {
          CommonService.delete(condition, db.DashboardConfigDtl);
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

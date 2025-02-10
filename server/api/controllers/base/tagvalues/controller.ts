import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import sequelize = require("sequelize");
import { AppError } from "../../../../common/appError";
import { modules } from "../../../../common/module";
import LokiService from "../../../services/logging/loki.service";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.TAG_VALUE };
    try {
      let parameters = { where: req.body, include: [] } as any;
      parameters.include = [{ model: db.Tags, as: "tag" }];
      if (req.body.resourcetypes && req.body.resourcetypes.length > 0) {
        parameters.where["resourcetype"] = { $in: req.body.resourcetypes };
      }
      if (req.body.tagids && req.body.tagids.length > 0) {
        parameters.where["tagid"] = { $in: req.body.tagids };
      }
      if (req.body && req.body.resourcerefid) {
        parameters.include[0].where = { status: "Active" };
      }
      parameters.where = _.omit(parameters.where, ["resourcetypes", "tagids"]);
      if (req.query.distinct == "tagvalue") {
        parameters.attributes = ["tagvalue"];
        parameters.group = ["tagvalue"];
      }
      if (req.query.distinct == "resourcetype") {
        parameters.attributes = ["resourcetype"];
        parameters.group = ["resourcetype"];
      }
      if (req.query.include == "instance") {
        parameters.include = [
          {
            model: db.Instances,
            as: "instances",
            where: {
              status: "Active",
              customerid: req.query.customerid,
            },
          },
        ];
      }
      if (req.query.include == "assetmapping") {
        parameters.where["cloudprovider"] = {$ne : null}
        parameters.where["resourcetype"] = {
          $in: ["ASSET_INSTANCE", "VIRTUAL_MACHINES"],
        };
        parameters.include = [
          {
            model: db.Instances,
            as: "instances",
            where: {
              status: "Active",
              instancerefid: sequelize.literal(
                '`instancerefid` in (select `resourcerefid` from `tbl_tn_assetmappings` where status="Active" and cloudprovider is not null and resourcetype in ("ASSET_INSTANCE","VIRTUAL_MACHINES") and customerid=' +
                  req.query.customerid +
                  ")"
              ),
            },
          },
        ];
      }

      if (req.body.searchText) {
        let searchparams: any = {};
        req.body.headers.forEach((element) => {
          if (element.field === "tagvalue") {
            searchparams["tagvalue"] = {
              $like: "%" + req.body.searchText + "%",
            };
          }
        });
        req.body.headers.forEach((element) => {
          if (element.field === "resourcetype") {
            searchparams["resourcetype"] = {
              $like: "%" + req.body.searchText + "%",
            };
          }
        });
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }

      if (req.query.assetcount) {
        parameters.include = [
          {
            model: db.AssetMapping,
            as: "assets",
            where: {
              status: "Active",
            },
            required: false,
          },
        ];
        parameters.attributes = [
          "tagid",
          "resourcetype",
          "cloudprovider",
          [
            sequelize.fn(
              "count",
              sequelize.fn("DISTINCT", sequelize.col("TagValues.resourceid"))
            ),
            "assetcount",
          ],
        ];
        parameters.group = req.body.group
          ? req.body.group
          : ["resourcetype", "cloudprovider"];
        delete parameters.where.group;
        parameters.where.resourcetype = { $in: constants.RESOURCE_TYPES };
        parameters.where.resourceid = { $ne: null };
        parameters.where.status = constants.STATUS_ACTIVE;
      }
      CommonService.getAllList(parameters, db.TagValues)
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
    let response = { reference: modules.TAG_VALUE };
    try {
      CommonService.getById(req.params.id, db.TagValues)
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
    let response = { reference: modules.TAG_VALUE };
    try {
      CommonService.create(req.body, db.TagValues)
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
    let response = { reference: modules.TAG_VALUE };
    try {
      CommonService.bulkCreate(req.body, db.TagValues)
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
    let response = { reference: modules.TAG_VALUE };
    try {
      let condition = { tagvalueid: req.body.tagvalueid };
      CommonService.update(condition, req.body, db.TagValues)
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

  async bulkUpdate(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.TAG_VALUE };
    try {
      let updateattributes = [
        "cloudprovider",
        "tenantid",
        "resourcetype",
        "resourceid",
        "tagid",
        "tagvalue",
        "status",
        "createdby",
        "createddt",
        "lastupdatedby",
        "lastupdateddt",
      ];
      if (req.query.resourceid) {
        CommonService.update(
          { resourceid: Number(req.query.resourceid) },
          { status: constants.DELETE_STATUS },
          db.TagValues
        ).then((data) => {
          CommonService.bulkUpdate(req.body, updateattributes, db.TagValues)
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
        });
      } else if (req.query.vmware) {
        let i = 0;
        function createTag() {
          CommonService.getOrSave(
            {
              tagid: req.body[i].tagid,
              tagvalue: req.body[i].tagvalue,
              status: { $ne: "Deleted" },
              resourceid: req.body[i].resourceid,
              resourcetype: req.body[i].resourcetype,
              tenantid: req.body[i].tenantid,
              cloudprovider: req.body[i].cloudprovider,
            },
            req.body[i],
            db.TagValues
          ).then((data) => {
            if (data != null && data[1] === false) {
              customValidation.generateAppError(
                new AppError("Duplicate tags found"),
                response,
                res,
                req
              );
            } else {
              i++;
              if (i == req.body.length) {
                customValidation.generateSuccessResponse(
                  data,
                  response,
                  constants.RESPONSE_TYPE_SAVE,
                  res,
                  req
                );
              } else {
                createTag();
              }
            }
          });
        }
        createTag();
      } else if (req.query.isCMDB) {
        let tagids = [];
        _.map(req.body, (itm) => {
          tagids.push(itm.tagid);
          return itm;
        });
        let _previousDataValues = await db.TagValues.findAll({
          where: {
            resourcerefid: req.body[0].resourcerefid,
            resourcetype: "ASSET_RECORD",
            tagid: { $in: tagids },
            status: "Active",
            // tagvalueid: { $ne: itm.tagvalueid },
          },
        });
        CommonService.bulkUpdate(req.body, updateattributes, db.TagValues)
          .then((data) => {
            _.map(data, async (itm) => {
              let bodyContent: any = _.find(req.body, { tagid: itm.tagid });
              let _previousDataValue = _.find(_previousDataValues, {
                tagid: itm.tagid,
              });
              const existingRecord: any = await db.TagValues.findOne({
                where: {
                  resourcerefid: itm.resourcerefid,
                  resourcetype: "ASSET_RECORD",
                  tagid: itm.tagid,
                  status: "Active",
                  // tagvalueid: { $ne: itm.tagvalueid },
                },
              });
              let oldvalue = _previousDataValue
                ? _previousDataValue["tagvalue"]
                : "";
              let newvalue = existingRecord
                ? existingRecord.dataValues["tagvalue"]
                : itm["tagvalue"];
              let newstatus = existingRecord
                ? existingRecord.dataValues["status"]
                : itm["status"];
              let oldstatus = _previousDataValue
                ? _previousDataValue["status"]
                : "";
              let historyObj = {
                type: 2,
                old: oldvalue,
                new: newvalue,
                status: "Active",
                createdby: req.body[0]["lastupdatedby"],
                createddt: new Date(),
                lastupdatedby: req.body[0]["lastupdatedby"],
                lastupdateddt: req.body[0]["lastupdateddt"],
                meta: "",
                tenantid: req.body[0]["tenantid"],
                resourceid: req.body[0].resourcerefid,
                affectedattribute:
                  "Tag" +
                  (oldvalue == "" ? " Added : " : " updated : ") +
                  bodyContent.tag.tagname,
              } as any;
              if (oldvalue != newvalue && newstatus != "Inactive") {
                await CommonService.create(historyObj, db.AssetsHistory).catch(
                  (error: Error) => {
                    LokiService.createLog(error, "ERROR");
                  }
                );
              } else if (oldstatus != newstatus) {
                historyObj.old = "";
                historyObj.new = "";
                historyObj.affectedattribute =
                  "Tag Removed : " + bodyContent.tag.tagname;
                await CommonService.create(historyObj, db.AssetsHistory).catch(
                  (error: Error) => {
                    LokiService.createLog(error, "ERROR");
                  }
                );
              }
            });
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
          })
          .catch((error: Error) => {
            console.error(error);
            customValidation.generateAppError(error, response, res, req);
          });
      } else {
        CommonService.bulkUpdate(req.body, updateattributes, db.TagValues)
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
            console.error(error);
            customValidation.generateAppError(error, response, res, req);
          });
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();

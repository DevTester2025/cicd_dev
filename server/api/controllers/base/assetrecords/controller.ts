import { Request, Response } from "express";
import _ = require("lodash");
import sequelize = require("sequelize");
import { constants } from "../../../../common/constants";
import { modules } from "../../../../common/module";
import { customValidation } from "../../../../common/validation/customValidation";
import CommonService from "../../../services/common.service";

import db from "../../../models/model";
import { AppError } from "../../../../common/appError";
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
import { queries } from "../../../../common/query";
import * as moment from "moment";
import WorkflowService from "../../../services/workflow.service";
import workflowService from "../../../services/workflow.service";
import { messages } from "../../../../common/messages";
import notificationWatchListService from "../../../services/watchlist.service";
export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      let parameters = { where: req.body } as any;
      if (_.isUndefined(req.body.status)) {
        parameters["where"]["status"] = { $ne: "Deleted" };
      }
      if (!_.isUndefined(req.query.searchtext)) {
        let searchparams = {} as any;
        searchparams["fieldname"] = { $like: "%" + req.query.searchtext + "%" };
        searchparams["fieldtype"] = { $like: "%" + req.query.searchtext + "%" };
        parameters.where["$or"] = searchparams;
      }
      if (req.body.ids) {
        delete parameters["where"]["ids"];
        parameters["where"]["id"] = { in: req.body.ids };
      }
      if (req.query.chart) {
        let query = queries.KPI_DATAMANAGEMENT;
        let subquery = "";
        let params = {
          replacements: req.body,
          type: db.sequelize.QueryTypes.SELECT,
        } as any;
        params.replacements["durationquery"] = "";
        params.replacements["subquery"] = "";
        if (req.body.duration) {
          if (req.body.duration == "Daily") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(createddt,'%d-%M-%Y') AS x"
            );
          }
          if (req.body.duration == "Weekly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "CONCAT('Week ', 1 + DATE_FORMAT(createddt, '%U')) AS x"
            );
          }
          if (req.body.duration == "Monthly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(LAST_DAY(createddt),'%M-%Y') AS x"
            );
          }
        }

        if (req.body.filters && req.body.filters.length > 0) {
          for (let i = 0; i < req.body.filters.length; i++) {
            if (req.body.filters[i].resourcetype) {
              const resourcetype = req.body.filters[i].resourcetype.map(
                (d) => `'${d.title}'`
              );
              subquery =
                subquery + ` AND resourcetype IN (${resourcetype.join(",")})`;
            }
            if (req.body.filters[i].fieldtype) {
              const fieldtype = req.body.filters[i].fieldtype.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND fieldtype IN (${fieldtype.join(",")})`;
            }
            if (req.body.filters[i].readonly) {
              const readonly = req.body.filters[i].readonly.map(
                (d) => `${Number(d.value)}`
              );
              subquery = subquery + ` AND readonly IN (${readonly.join(",")})`;
            }
            if (i + 1 == req.body.filters.length) {
              query = query.replace(new RegExp(":subquery", "g"), subquery);
            }
          }
        }

        if (req.body.groupby) {
          query =
            query + ` GROUP BY x, ${req.body.groupby} ORDER BY createddt ASC`;
        } else {
          query = query + ` GROUP BY x ORDER BY createddt ASC`;
        }

        CommonService.executeQuery(query, params, db.sequelize)
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
            console.log("err", error);
            customValidation.generateAppError(error, response, res, req);
          });
      } else {
        CommonService.getAllList(parameters, db.AssetsHdr)
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
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  beforeRecordCreate(req: Request, res: Response, next: any): void {
    const response = {
      reference: modules.CMDB,
    } as any;
    const parentcrn = req.body.parentcrn;
    const relation_name = req.body.resourcetype;
    if (req.body.isrecordtype) {
      let condition = {
        tenantid: req.body.tenantid,
        status: { $ne: "Deleted" },
        resourcetype: req.body.resourcetype,
      };
      CommonService.getOrSave(condition, req.body, db.AssetsHdr, [])
        .then((data) => {
          if (data != null && data[1] === false) {
            throw new AppError(
              "Duplicate Resource type, Please try with another value"
            );
          } else {
            if (req.body.defaultattributes) {
              console.log(req.body.defaultattributes);
              CommonService.bulkCreate(
                req.body.defaultattributes,
                db.AssetsHdr
              ).then((data) => {
                if (req.body.module == "workpack") {
                  const relationDtl = JSON.parse(JSON.stringify(data[0]));
                  let request = {
                    ref_key: relationDtl.crn,
                    parentref_key: parentcrn,
                    relation_name: relation_name,
                    tenantid: relationDtl.tenantid,
                    positionno: 0,
                    module: "workpack",
                    status: "Active"
                  }
                  WorkflowService.createWorkflowRelations(request);
                }
              });
            }
            customValidation.generateSuccessResponse(
              data[0],
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } else {
      next();
    }
  }
  beforeUpdate(req: Request, res: Response, next: any): void {
    const response = {
      reference: modules.CMDB,
    } as any;
    if (req.body.isrecordtype) {
      let condition = {
        where: {
          tenantid: req.body.tenantid,
          status: { $ne: "Deleted" },
          fieldname: "Key",
          $or: {
            resourcetype: req.body.resourcetype,
            crn: req.body.crn,
          },
        },
      };
      if (req.body.oldcrn != req.body.crn) {
        CommonService.getData(condition, db.AssetsHdr)
          .then((data) => {
            if (data != null) {
              throw new AppError(
                "Duplicate Resource type, Please try with another value"
              );
            } else {
              next();
            }
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      } else {
        next();
      }
    } else {
      let condition = {
        where: {
          tenantid: req.body.tenantid,
          status: { $ne: "Deleted" },
          resourcetype: req.body.resourcetype,
          crn: req.body.crn,
          fieldname: req.body.fieldname,
          fieldtype: req.body.fieldtype,
          id: { $ne: req.body.id },
        },
      };
      CommonService.getData(condition, db.AssetsHdr)
        .then((data) => {
          if (data != null) {
            throw new AppError(
              "Duplicate Attribute Value, Please enter correct value"
            );
          } else {
            next();
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    }
  }
  async create(req: Request, res: Response) {
    console.log("create resoruce type");
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      let parameters = { where: {} } as any;
      parameters.where = {
        crn: req.body.crn,
        status: constants.STATUS_ACTIVE,
      };
      let count: any = await CommonService.getCount(parameters, db.AssetsHdr);
      if (req.body.attributes) {
        CommonService.bulkCreate(req.body.attributes, db.AssetsHdr)
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
      } else {
        let condition = {
          tenantid: req.body.tenantid,
          fieldname: req.body.fieldname,
          fieldtype: req.body.fieldtype,
          status: { $ne: "Deleted" },
          resourcetype: req.body.resourcetype,
        } as any;
        if (count > 0) {
          condition.ordernumber = count + 1;
        }
        if (req.body.isrecordtype) {
          condition["identifier"] = 1;
        }
        CommonService.getOrSave(condition, req.body, db.AssetsHdr, [])
          .then((data) => {
            if (data != null && data[1] === false) {
              throw new AppError(
                "Duplicate Attribute Value, Please enter correct value"
              );
            } else {
              customValidation.generateSuccessResponse(
                data[0],
                response,
                constants.RESPONSE_TYPE_SAVE,
                res,
                req
              );
            }
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      let condition = {} as any;
      if (req.body.status == "Deleted") {
        if (!_.isUndefined(req.body.id) && !_.isNull(req.body.id)) {
          condition["id"] = req.body.id;
        }
        if (!_.isUndefined(req.body.ids) && !_.isNull(req.body.ids)) {
          condition["id"] = req.body.ids;
        }
        if (!_.isUndefined(req.body.crn) && !_.isNull(req.body.crn)) {
          condition["crn"] = req.body.crn;
        }
        if (
          !_.isUndefined(req.body.referenceid) &&
          !_.isNull(req.body.referenceid)
        ) {
          condition["referenceid"] = req.body.referenceid;
        }
        CommonService.update(condition, req.body, db.AssetsHdr)
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
      } else {
        if (_.isUndefined(req.body.id) || _.isNull(req.body.id)) {
          condition["crn"] = req.body.crn;
          if (req.body.oldcrn) {
            condition["crn"] = req.body.oldcrn;
          }
          condition["tenantid"] = req.body.tenantid;
        }
        if (!_.isUndefined(req.body.id) && !_.isNull(req.body.id)) {
          condition["id"] = req.body.id;
        }
        let spreadcondition = {
          crn: req.body.crn,
          tenantid: req.body.tenantid,
        };
        if (req.body.identifier == 1) {
          CommonService.update(
            {
              crn: req.body.crn,
              identifier: 1,
            },
            { identifier: 0 },
            db.AssetsHdr
          )
            .then((firstdata) => {
              CommonService.update(
                condition,
                req.body,
                db.AssetsHdr,
                spreadcondition
              )
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
            })
            .catch((error: Error) => {
              customValidation.generateAppError(error, response, res, req);
            });
        } else {
          CommonService.update(
            condition,
            req.body,
            db.AssetsHdr,
            spreadcondition
          )
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
        }
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  async assetHdrBulkCreate(req: Request, res: Response): Promise<void> {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      await _.map(req.body.assetheaders, async (itm, idx) => {
        let condition = {} as any;
        if (!_.isUndefined(itm.id) && !_.isNull(itm.id)) {
          condition["id"] = itm.id;
          let spreadcondition: any = {};
          if (!_.isUndefined(itm.crn) && !_.isNull(itm.crn)) {
            spreadcondition.crn = itm.crn;
          }
          if (!_.isUndefined(itm.tenantid) && !_.isNull(itm.tenantid)) {
            spreadcondition.tenantid = itm.tenantid;
          }
          await CommonService.update(
            condition,
            itm,
            db.AssetsHdr,
            spreadcondition
          ).catch((error: Error) => {
            console.log(error);
          });
          if (
            Array.isArray(req.body.assetheaders) ||
            req.body.assetheaders.length > 0
          ) {
            if (idx + 1 === req.body.assetheaders.length) {
              customValidation.generateSuccessResponse(
                { updated: true },
                response,
                constants.RESPONSE_TYPE_UPDATE,
                res,
                req
              );
            }
          }
        }
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  assetDtlAll(req: Request, res: Response): void {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      let parameters: any = { where: req.body };
      if (req.query.header) {
        parameters.include = [
          {
            model: db.AssetsDtl,
            as: "assetdetail",
          },
        ];
        parameters["where"]["identifier"] = 1;
        CommonService.getAllList(parameters, db.AssetsHdr)
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
      } else {
        if (req.body.crns) {
          parameters["where"]["crn"] = { $in: req.body.crns };
          parameters["where"] = _.omit(req.body, ["crns"]);
          parameters["where"]["fieldkey"] = { $like: "%/fk:name" };
          if (req.body.fieldkey)
            parameters["where"]["fieldkey"] = req.body.fieldkey;
          console.log(parameters["where"]);
        }
        if (req.body.ids) {
          parameters["where"]["id"] = { $in: req.body.ids };
          delete parameters["where"]["ids"];
        }
        CommonService.getAllList(parameters, db.AssetsDtl)
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
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async assetBeforeCreate(req: Request, res: Response) {
    try {
      let autoGenList = [];
      let updateList = [];
      if (Array.isArray(req.body.assetdetails) || req.body.assetdetails.length > 0) {
        req.body.assetdetails.map((asst) => {
          if (asst.fieldtype == "AUTOGEN") autoGenList.push(asst.fieldkey);
        });
      }
      if (autoGenList.length > 0) {
        let hdrList = await CommonService.getAllList(
          {
            // where: { id: { $in: autoGenList } },
            where: { fieldkey: { $in: autoGenList } },
            attributes: ["id", "curseq", "prefix", "fieldkey"],
          },
          db.AssetsHdr
        );
        hdrList = JSON.parse(JSON.stringify(hdrList));
        let i = 0;
        let currentseq;
        let autogenlen = autoGenList.length;
        for (const asset of req.body.assetdetails) {
          i++;
          if (asset.fieldtype == "AUTOGEN") {
            let seq = hdrList.find((rec) => {
              return rec.fieldkey === asset.fieldkey;
            });
            if (seq) {
              if (currentseq == undefined) currentseq = seq.curseq;
              asset.fieldvalue = `${seq.prefix}${currentseq}`;
              updateList.push({
                id: asset.hdrid ? asset.hdrid : hdrList[0].id,
                curseq: await getSeq(Number(currentseq)),
                resourcetype: "",
              });
              autogenlen--;
              if (autogenlen != 0) {
                currentseq = Number(currentseq) + 1;
              }
            }
          }
          if (i == req.body.assetdetails.length) {
            req.body.updateList = updateList;
            new Controller().assetDtlBulkCreate(req, res);
          }
        }
        function getSeq(seqNo) {
          let currseq = parseInt(seqNo);
          let newSeq: any = currseq + 1;
          let currLength = seqNo.length - newSeq.toString().length;
          for (let i = 0; i < currLength; i++) {
            newSeq = "0" + newSeq;
          }
          return newSeq;
        }
      } else {
        new Controller().assetDtlBulkCreate(req, res);
      }
    } catch (e) {
      console.log("catch", e);
    }
  }

  assetDtlBulkCreate(req: Request, res: Response): void {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      CommonService.bulkCreate(req.body.assetdetails, db.AssetsDtl)
        .then(
          async (
            data: {
              id: number;
              tenantid: number;
              crn: string;
              fieldkey: string;
              fieldvalue: string;
              resourceid: string;
              status: string;
              createdby: string;
              createddt: Date;
              lastupdatedby: string;
              lastupdateddt: Date;
            }[]
          ) => {
            if (req.body.taskDetails) {
              let taskDetails = _.map(req.body.taskDetails, (d) => {
                d.refkey = data[0]["resourceid"];
                return d;
              });
              // txn --> task resource id
              // reference --> task crn
              // refkey --> workpack resource id
              //  notes --> workpack crn
              // module workpack-task
              await CommonService.bulkUpdate(
                taskDetails,
                [
                  "txn",
                  "reference",
                  "refkey",
                  "notes",
                  "status",
                  "createddt",
                  "createdby",
                ],
                db.TxnRefModel
              );
            }
            if (req.body.ntfcsetupid !== undefined && req.body.ntfcsetupid !== null) {
              try {
                notificationWatchListService.createWatchListWP(req.body.ntfcsetupid, data);
              } catch (error) {
                console.log("Error getting notification details", error);
              }
            }
            await CommonService.create(
              {
                type: 1,
                old: null,
                new: "New record created",
                affectedattribute: null,
                status: "Active",
                createdby: data[0]["createdby"],
                createddt: data[0]["createddt"],
                lastupdatedby: null,
                lastupdateddt: null,
                meta: "",
                tenantid: data[0]["tenantid"],
                resourceid: data[0]["resourceid"],
                crn: data[0]["crn"],
              },
              db.AssetsHistory
            );
            CommonService.bulkUpdate(
              req.body.updateList,
              ["curseq"],
              db.AssetsHdr
            );
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
          }
        )
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  assetDtlCreate(req: Request, res: Response): void {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      CommonService.create(req.body, db.AssetsDtl)
        .then(async (data) => {
          let value = null;

          try {
            const v = JSON.parse(req.body.fieldvalue);
            console.log(v);
            value = v.map((_) => _["name"]).join(", ");
          } catch (error) {
            value = req.body.fieldvalue;
          }
          let affectedAttribute = null;

          if (req.body["fieldkey"] && typeof req.body["fieldkey"] === 'string') {
            const parts = req.body["fieldkey"].split("fk:");
            if (parts.length > 1) {
              affectedAttribute = parts[1];
            }
          }
          await CommonService.create(
            {
              type: 1,
              old: null,
              new: value,
              affectedattribute: affectedAttribute,
              attributetype: "",
              status: "Active",
              createdby: req.body["lastupdatedby"],
              createddt: new Date(),
              lastupdatedby: req.body["lastupdatedby"],
              lastupdateddt: req.body["lastupdateddt"],
              meta: "",
              tenantid: req.body["tenantid"],
              resourceid: req.body["resourceid"],
              crn: req.body["crn"],
            },
            db.AssetsHistory
          );
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
  async bulkUpdateDtl(req: Request, res: Response): Promise<void> {
    let isWorkflowNotification = false;
    let updatedassetDetails: any[] = [];
    const response = {
      reference: modules.CMDB,
    } as any;

    try {
      if (req.query && req.query.isWorkflowNotification == "true") {
        isWorkflowNotification = true;
        if (req.body.ntfcsetupid !== undefined && req.body.ntfcsetupid !== null) {
          try {
            await notificationWatchListService.createWatchListWP(req.body.ntfcsetupid, req.body.assetdetails);
          } catch (error) {
            console.log("Error getting notification details", error);
          }
        }
      }


      if (Array.isArray(req.body.assetdetails) || req.body.assetdetails) {
        await Promise.all(
          req.body.assetdetails.map(async (itm, idx) => {
            let condition = { id: itm.id, resourceid: itm.resourceid, status: constants.STATUS_ACTIVE };
            let existingRecord = await db.AssetsDtl.findOne({
              where: condition,
              include: [
                {
                  model: db.AssetsHdr,
                  as: "assethdr",
                  where: { status: constants.STATUS_ACTIVE },
                  attributes: ["fieldtype"],
                  required: false,
                },
              ],
            });
            let oldvalue = existingRecord ? existingRecord.dataValues["fieldvalue"] : "";
            if (existingRecord && existingRecord.dataValues["dtl_operationtype"] != itm.dtl_operationtype) {
              await db.AssetsDtl.update(
                { dtl_operationtype: itm["dtl_operationtype"] },
                { returning: true, where: { id: itm.id } }
              );
            }
            let newvalue = itm["fieldvalue"];
            if (!existingRecord) {
              delete itm["id"];
              await db.AssetsDtl.create(itm).then((data) => {
                if (
                  itm["fieldtype"] == "Password"
                ) {
                  newvalue = "*****";
                }
                existingRecord = data;
                oldvalue = "New record created";
                newvalue = itm.fieldvalue;
              });
            } else if (oldvalue != newvalue) {
              await db.AssetsDtl.update(
                { fieldvalue: itm["fieldvalue"] },
                { returning: true, where: { id: itm.id } }
              ).then(async (data) => {
                if (
                  existingRecord.dataValues["assethdr"] &&
                  existingRecord.dataValues["assethdr"]["fieldtype"] == "Password"
                ) {
                  oldvalue = "*****";
                  newvalue = "*****";
                }
              });
            }
            if (isWorkflowNotification) {
              updatedassetDetails.push({
                type: 2,
                old: oldvalue,
                new: newvalue,
                affectedattribute: existingRecord.dataValues["fieldkey"].split("fk:")[1],
                attributetype: existingRecord.dataValues["assethdr"]
                  ? existingRecord.dataValues["assethdr"]["fieldtype"]
                  : "",
                status: "Active",
                createdby: existingRecord.dataValues["lastupdatedby"] || "SYSTEM",
                createddt: new Date(),
                lastupdatedby: existingRecord.dataValues["lastupdatedby"] || "SYSTEM",
                lastupdateddt: existingRecord.dataValues["lastupdateddt"],
                meta: "",
                tenantid: existingRecord.dataValues["tenantid"],
                resourceid: existingRecord.dataValues["resourceid"],
                crn: existingRecord.dataValues["crn"],
                ntfcsetupid: req.body.ntfcsetupid
              });
            }
            if (oldvalue != newvalue) {
              await db.AssetsHistory.create({
                type: 2,
                old: oldvalue,
                new: newvalue,
                affectedattribute: existingRecord.dataValues["fieldkey"].split("fk:")[1],
                attributetype: existingRecord.dataValues["assethdr"]
                  ? existingRecord.dataValues["assethdr"]["fieldtype"]
                  : "",
                status: "Active",
                createdby: existingRecord.dataValues["lastupdatedby"] || "SYSTEM",
                createddt: new Date(),
                lastupdatedby: existingRecord.dataValues["lastupdatedby"] || "SYSTEM",
                lastupdateddt: existingRecord.dataValues["lastupdateddt"],
                meta: "",
                tenantid: existingRecord.dataValues["tenantid"],
                resourceid: existingRecord.dataValues["resourceid"],
                crn: existingRecord.dataValues["crn"],
              });
            }
          })
        );
      } else {
        console.error("Invalid assetdetails format");
      }



      if (req.body.taskDetails) {
        // let upcondition = { refkey: req.body.taskDetails[0].refkey };
        await CommonService.bulkUpdate(
          req.body.taskDetails,
          ["txn", "reference", "refkey", "notes", "status", "createddt", "createdby"],
          db.TxnRefModel
        ).catch(error => {
          throw error;
        });
      }

      await CommonService.bulkUpdate(
        req.body.txnDetails,
        ["txnid", "txnref", "reference", "status", "createddt", "createdby"],
        db.TxnRefModel
      );

      // Send success response once after all updates are done
      if (updatedassetDetails.length > 0 && isWorkflowNotification) {
        await new Controller().SendWorkflowNotification(req.body, updatedassetDetails)
          .catch(error => {
            throw error;
          });
      }

      customValidation.generateSuccessResponse(
        { updated: updatedassetDetails.length > 0 },
        response,
        constants.RESPONSE_TYPE_UPDATE,
        res,
        req
      );

    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }


  async assetDtlUpdate(req: Request, res: Response): Promise<void> {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      let condition: any = {};
      // condition = { actionsid: req.body.id };
      if (req.body.resourceid) {
        condition = {
          resourceid: req.body.resourceid,
        };
      }
      let exeParse: any;
      await db.TNWorkFlowAction.findAll({
        where: condition,
      }).then((data) => {
        exeParse = JSON.parse(JSON.stringify(data))
      }).catch((e) => {
        customValidation.generateErrorMsg(
          messages.EMPTY_LIST,
          res,
          constants.STATUES_CODES[0],
          req
        );
      });
      if (exeParse) {
        let pendingStatus = false;
        exeParse.forEach((e) => {
          if (e.workflow_status === constants.STATUS_PENDING) {
            pendingStatus = true;
          }
        })
        if (req.query.skipApproval) pendingStatus = false;
        if (pendingStatus && req.body.status != constants.DELETE_STATUS) {
          customValidation.generateErrorMsg(
            messages.WORKFLOW_STATUS,
            res,
            constants.STATUES_CODES[0],
            req
          );
        } else {
          if (req.body.fieldkey) {
            condition.fieldkey = req.body.fieldkey;
          }
          const existingRecord = await db.AssetsDtl.findOne({
            where: condition,
            include: [
              {
                model: db.AssetsHdr,
                as: "assethdr",
                where: { status: constants.STATUS_ACTIVE },
                attributes: ["fieldtype"],
                required: false,
              },
            ],
          });

          CommonService.update(condition, req.body, db.AssetsDtl)
            .then(async (data) => {
              console.log("Updated data >>>>>>>>>>>>>>>");
              console.log(JSON.stringify(data));
              let oldvalue = existingRecord.dataValues["fieldvalue"];
              let newvalue = data["fieldvalue"];
              if (
                existingRecord.dataValues["assethdr"] &&
                existingRecord.dataValues["assethdr"]["fieldtype"] &&
                existingRecord.dataValues["assethdr"]["fieldtype"] == "Password"
              ) {
                oldvalue = "*****";
                newvalue = "*****";
              }
              if (oldvalue != newvalue) {
                await CommonService.create(
                  {
                    type: 2,
                    old: oldvalue,
                    new: newvalue,
                    affectedattribute:
                      existingRecord.dataValues["fieldkey"].split("fk:")[1],
                    attributetype: existingRecord.dataValues["assethdr"]
                      ? existingRecord.dataValues["assethdr"]["fieldtype"]
                      : "",
                    status: "Active",
                    createdby: data["lastupdatedby"],
                    createddt: new Date(),
                    lastupdatedby: data["lastupdatedby"],
                    lastupdateddt: data["lastupdateddt"],
                    meta: "",
                    tenantid: data["tenantid"],
                    resourceid: data["resourceid"],
                    crn: data["crn"],
                  },
                  db.AssetsHistory
                );
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
        }
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async getResourceType(req: Request, res: Response): Promise<void> {
    let condition = req.body;
    if (req.body.searchText) {
      condition["resourcetype"] = { $like: "%" + req.body.searchText + "%" };
      delete condition["searchText"];
    }
    if (req.body.parentcrn) {
      condition["parentcrn"] = { $eq: req.body.parentcrn };
    }
    if (req.body.module) {
      condition["module"] = { $eq: req.body.module };
    }
    const data = await db.AssetsHdr.findAll({
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("resourcetype")), "resource"],
        "crn",
        "parentcrn",
      ],
      where: condition,
    });

    if (req.query.relation && req.query.relation == "true") {
      let query = `select DISTINCT(resourcetype),crn from tbl_assets_hdr where crn in (select relation from tbl_assets_hdr where crn = '{crn}') and status = 'Active'`;
      query = query.replace("{crn}", req.body.crn);
      const list = await db.sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
      });
      res.send(list);
    } else {
      const data = await db.AssetsHdr.findAll({
        attributes: [
          [sequelize.fn("DISTINCT", sequelize.col("resourcetype")), "resource"],
          "crn",
          "parentcrn",
        ],
        where: condition,
      });
      res.send(data);
    }
  }

  async getResource(req: Request, res: Response): Promise<void> {
    const data = await db.AssetsHdr.findAll({
      where: {
        status: "Active",
        crn: req.params.type,
        tenantid: req.body.tenantid,
      },
    });
    res.send(data);
  }

  getResourceByFilter(req: Request, res: Response) {
    let condition: any = { where: { status: constants.STATUS_ACTIVE } };
    if (Array.isArray(req.body.filters) || req.body.filters) {
      req.body.filters.forEach((element) => {
        if (element && element.key !== undefined) {
          condition.where[element.key] = element.value;
        }
      });
    }

    if (req.body.crn) {
      condition["where"]["fieldkey"] = { $like: `%${req.body.crn}%` };
    }
    db.AssetsDtl.find(condition)
      .then((data) => {
        customValidation.generateSuccessResponse(
          data,
          {},
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      })
      .catch((e) => {
        customValidation.generateAppError(e, {}, res, req);
      });
  }

  async getResourceDetails(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        crn: string;
        tenantid: string;
        tag: string | null;
        tagvalue: string | null;
        fields: {
          fieldkey: string;
          fieldname: string;
          fieldtype: string;
          assettype: string;
          linkid: string;
          referencekey: string;
        }[];
        columns: {
          fieldkey: string;
          fieldname: string;
          fieldtype: string;
          assettype: string;
          linkid: string;
          referencekey: string;
        }[];
        filters: Record<string, Record<string, boolean>>;
        attrfilters: Array<string | Record<string, Record<string, boolean>>>;
        limit?: number;
        offset?: number;
        // search?: { fieldkey: string; fieldname: string; value: string }[]; // Used for column level search
        search?: string;
        sortkey?: string;
        sortorder?: string;
        download?: boolean;
        status?: string;
        headers?: Array<string | Record<string, Record<string, boolean>>>;
        combineTxn?: boolean;
        operationtype?: Array<string>;
        workpackDownload?: boolean;
      };

      let resourceIdsToFilter = [];

      if (body.tag) {
        let tagValueQuery = `
        select
          resourcerefid 
        from
          tbl_bs_tag_values tbtv
        where
          tbtv.tagid = ${body.tag}
          and tbtv.resourcetype = "ASSET_RECORD"
          {tagvalue}
      `;

        if (body.tagvalue) {
          tagValueQuery = tagValueQuery.replace(
            "{tagvalue}",
            `and tbtv.tagvalue = '${body.tagvalue}'`
          );
        } else {
          tagValueQuery = tagValueQuery.replace("{tagvalue}", "");
        }

        const tagResourceId: { resourcerefid: string }[] =
          await db.sequelize.query(tagValueQuery, {
            type: sequelize.QueryTypes.SELECT,
          });

        if (tagResourceId.length > 0) {
          tagResourceId.forEach((o) => {
            resourceIdsToFilter.push(o.resourcerefid);
          });
        }
      }

      let q = `
      select
        *
      from
        (
        select
          tad.resourceid resource,
          tad.dtl_operationtype,
          {fields}
        from
          tbl_assets_dtl tad
          {join}
        where
          tad.crn in ('${body.crn}') {status} {whereResourceId} {search} {operationtype}
        group by
          tad.resourceid order by tad.id) a {where} {searchqry} {sort}
    `;

      if (resourceIdsToFilter.length > 0) {
        q = q.replace(
          "{whereResourceId}",
          ` and tad.resourceid in ('${resourceIdsToFilter.join("','")}')`
        );
      } else if (body.tag && resourceIdsToFilter.length <= 0) {
        res.send({
          count: 0,
          rows: [],
        });
        return;
      } else {
        q = q.replace("{whereResourceId}", "");
      }
      let searchqry = "";
      let f: any = body.fields.map((f, i) => {
        let o: any;
        let fieldkey = _.includes(f.fieldkey, "[")
          ? JSON.parse(f.fieldkey.replace(/'/g, '"')).join(".")
          : _.includes(f.fieldkey, "region")
            ? "t.region"
            : f.fieldkey;
        let regionqry =
          "INNER JOIN tbl_tn_regions t ON t.tnregionid = i.tnregionid ";
        let customerqry =
          "LEFT JOIN tbl_tn_customers customer ON customer.customerid = i.customerid ";
        let awsinstanceqry =
          "LEFT JOIN tbl_aws_instancetype awsinstance ON awsinstance.instancetypeid = i.instancetypeid ";
        let awszoneqry =
          "LEFT JOIN tbl_aws_zones awszones ON awszones.zoneid = i.zoneid ";

        if (f.fieldtype != "Reference Asset") {
          if (body.attrfilters) {
            return (
              `MAX(case when tad.fieldkey = '${f.fieldkey
              }' then tad.fieldvalue end) '${f.fieldname.replace(/ /g, "$")}'` +
              (i + 1 == body.fields.length ? "" : ",")
            );
          } else {
            return (
              `MAX(case when tad.fieldkey = '${f.fieldkey}' then tad.fieldvalue end) '${f.fieldname}'` +
              (i + 1 == body.fields.length ? "" : ",")
            );
          }
        } else if (f.fieldtype == "Reference Asset") {
          if (f.assettype == "ASSET_INSTANCE") {
            if (_.includes(fieldkey, "volume")) {
              let key = _.includes(fieldkey, "sizeingb")
                ? "group_concat(v.awsvolumeid , ' - ',v.sizeingb SEPARATOR ',<br/>') sizeingb"
                : "group_concat(v.awsvolumeid , ' - ',v.volumetype SEPARATOR ',<br/>') volumetype";
              o =
                `(select ${key} from tbl_aws_volumeattachments i JOIN tbl_aws_volumes v on v.volumeid = i.volumeid where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid and map.resourcetype = "ASSET_INSTANCE" and map.status='Active') group by i.instancerefid ) '${f.referencekey}'` +
                (i + 1 == body.fields.length ? "" : ",");
              return o;
            } else if (_.includes(fieldkey, "costs")) {
              o =
                `(SELECT 
                CONCAT(c.currency,
                        ' ',
                        ROUND((c.priceperunit / (SELECT 
                                keyvalue AS monthly
                            FROM
                                tbl_bs_lookup
                            WHERE
                                lookupkey = 'PRICING_MODEL'
                                    AND status = 'Active'
                                    AND keyname = c.pricingmodel)), 2) * ROUND((SELECT 
                                keyvalue AS monthly
                            FROM
                                tbl_bs_lookup
                            WHERE
                                lookupkey = 'PRICING_MODEL'
                                    AND status = 'Active'
                                    AND keyname = 'Monthly'), 2)) costs
            FROM
                tbl_tn_instances i
                    JOIN
                tbl_bs_costvisual c ON (c.plantype = i.instancetyperefid
                    AND i.region = c.region
                    AND c.resourcetype = 'ASSET_INSTANCE' AND i.status='Active' AND c.status='Active')
            WHERE
                i.status = 'Active' AND i.tenantid = ${body.tenantid}
                    AND i.instancerefid = (SELECT 
                        resourcerefid
                    FROM
                        tbl_tn_assetmappings map
                    WHERE
                        tad.resourceid = map.crnresourceid AND map.resourcetype = "ASSET_INSTANCE" and map.status='Active') limit 1) '${f.referencekey}'` +
                (i + 1 == body.fields.length ? "" : ",");

              return o;
            } else {
              o =
                `(select ${fieldkey} from tbl_tn_instances i {customerqry} {awsinstance} {awszone} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid AND map.resourcetype = "ASSET_INSTANCE" and map.status='Active') limit 1) '${f.referencekey}'` +
                (i + 1 == body.fields.length ? "" : ",");
              return _.includes(fieldkey, "customername")
                ? o.replace("{customerqry}", customerqry)
                : _.includes(fieldkey, "awsinstance")
                  ? o.replace("{awsinstance}", awsinstanceqry)
                  : _.includes(fieldkey, "awszones")
                    ? o.replace("{awszone}", awszoneqry)
                    : o;
            }
          }
          if (f.assettype == "VIRTUAL_MACHINES") {
            o =
              `(select ${fieldkey} from tbl_tn_instances i {regionqry} {customerqry} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid AND map.resourcetype = "VIRTUAL_MACHINES" and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "customername")
              ? o.replace("{customerqry}", customerqry)
              : _.includes(fieldkey, "region")
                ? o.replace("{regionqry}", regionqry)
                : o;
          }
          if (f.assettype == "CLUSTERS") {
            o =
              `(select ${fieldkey} from tbl_vc_cluster i {customerqry} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid AND map.resourcetype = "CLUSTERS" and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "customername")
              ? o.replace("{customerqry}", customerqry)
              : o;
          }
          if (f.assettype == "VM_HOSTS") {
            o =
              `(select ${fieldkey} from tbl_vc_hosts i {customerqry} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid AND map.resourcetype = "VM_HOSTS" and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "customername")
              ? o.replace("{customerqry}", customerqry)
              : o;
          }
          if (f.assettype == "DATACENTERS") {
            o =
              `(select ${fieldkey} from tbl_vc_datacenter i {customerqry} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid AND map.resourcetype = "DATACENTERS" and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "customername")
              ? o.replace("{customerqry}", customerqry)
              : o;
          }
          if (f.assettype == "ASSET_VPC") {
            o =
              `(select ${fieldkey} from tbl_aws_vpc i {regionqry} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid and map.resourcetype='ASSET_VPC' and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "region")
              ? o.replace("{regionqry}", regionqry)
              : o;
          }
          if (f.assettype == "ASSET_SUBNET") {
            o =
              `(select ${fieldkey} from tbl_aws_subnet i {regionqry} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid and map.resourcetype='ASSET_SUBNET' and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "region")
              ? o.replace("{regionqry}", regionqry)
              : o;
          }
          if (f.assettype == "ASSET_SECURITYGROUP") {
            o =
              `(select ${fieldkey} from tbl_aws_securitygroup i {regionqry} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid and map.resourcetype='ASSET_SECURITYGROUP' and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "region")
              ? o.replace("{regionqry}", regionqry)
              : o;
          }
          if (f.assettype == "ASSET_LB") {
            o =
              `(select ${fieldkey} from tbl_aws_loadbalancer i {regionqry} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid and map.resourcetype='ASSET_LB' and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "region")
              ? o.replace("{regionqry}", regionqry)
              : o;
          }
          if (f.assettype == "ASSET_IG") {
            o =
              `(select ${fieldkey} from tbl_aws_internetgateways {regionqry} i where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid and map.resourcetype='ASSET_IG' and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "region")
              ? o.replace("{regionqry}", regionqry)
              : o;
          }
          if (
            f.assettype == "ASSET_S3" ||
            f.assettype == "ASSET_ECS" ||
            f.assettype == "ASSET_RDS" ||
            f.assettype == "ASSET_EKS"
          ) {
            o =
              `(select ${fieldkey} from tbl_tn_cloudassets i {regionqry} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid and map.resourcetype='${f.assettype}' and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "region")
              ? o.replace("{regionqry}", regionqry)
              : o;
          }
          if (f.assettype == "ASSET_VOLUME") {
            o =
              `(select ${fieldkey} from tbl_aws_volumes i {regionqry} where i.status ='Active' and i.tenantid = ${body.tenantid}  and  ${f.linkid} = (select resourcerefid from tbl_tn_assetmappings map where tad.resourceid = map.crnresourceid and map.resourcetype='${f.assettype}' and map.status='Active') limit 1) '${f.referencekey}'` +
              (i + 1 == body.fields.length ? "" : ",");
            return _.includes(fieldkey, "region")
              ? o.replace("{regionqry}", regionqry)
              : o;
          }
        }
      });
      if (body.attrfilters) {
        let q = "";
        let fieldvalues = queries.CMDB_FIELD_QUERY;
        body.attrfilters.map((itm: any, i) => {
          if (itm[`group${i}`] && itm[`group${i}`].length > 0) {
            console.log(itm[`group${i}`]);
            itm[`group${i}`].map((g) => {
              g["filters"].map((e) => {
                let fvalue: any = _.find(fieldvalues, {
                  fieldtype: e.fieldtype,
                });
                if (e.fieldtype == "DateTime")
                  fvalue.query = ` STR_TO_DATE(tad.fieldvalue ,"%d/%b/%y %l:%i %p")`;
                q = `, MAX(case when tad.fieldkey = "${e.fieldkey}" then ${fvalue != undefined ? fvalue.query : "tad.fieldvalue"
                  } end) as '${e.fieldname.replace(/ /g, "$")}_condition'`;
                f.push(q);
              });
            });
          }
        });
        f = _.uniq(f);
        console.log("Fieldq", f);
        // body.attrfilters.map((e: any) => {
        //   let fvalue: any = _.find(fieldvalues, {
        //     fieldtype: e.fieldtype,
        //   });
        //   if (e.fieldtype == 'DateTime') fvalue.query = ` STR_TO_DATE(tad.fieldvalue ,"%d/%b/%y %l:%i %p")`;
        //   q = `, MAX(case when tad.fieldkey = "${e.fieldkey
        //     }" then ${fvalue != undefined ? fvalue.query : "tad.fieldvalue"
        //     } end) as '${e.fieldname.replace(/ /g, "$")}_condition'`;
        //   f.push(q);
        // });

        // f = f + q;
      }
      q = q.replace("{join}", "");
      q = q.replace("{tenantid}", body.tenantid);
      q = q.replace("{fields}", f.join(" "));
      q = q.replace(new RegExp("{customerqry}", "g"), "");
      q = q.replace(new RegExp("{awsinstance}", "g"), "");
      q = q.replace(new RegExp("{awszone}", "g"), "");
      q = q.replace(new RegExp("{regionqry}", "g"), "");
      let w = "where 1=1";

      if (body.filters) {
        let filterCounter = 0;
        for (const key in body.filters) {
          if (Object.prototype.hasOwnProperty.call(body.filters, key)) {
            const values = body.filters[key];
            const filters = Object.keys(values).filter((o) => {
              if (values[o]) {
                return o;
              }
            });
            //if (filterCounter > 0) w += " and ";
            // if (filterCounter == 0) w += "where ";
            w += " and ";
            w += `\`${key}\` in ('${filters.join("','")}') `;
            filterCounter += 1;
          }
        }
      }

      if (body.attrfilters) {
        body.attrfilters.map((itm: any, i) => {
          // w += " and ";
          if (itm[`group${i}`] && itm[`group${i}`].length > 0) {
            itm[`group${i}`].map((g) => {
              console.log("group>>>", g);
              if (g.groupcondition) {
                w += ` ${g.groupcondition} (`;
              }
              if (g.filters) {
                g.filters.map((e, j) => {
                  if (j != 0) w += " and ";
                  if (e.formula == "BETWEEN") {
                    w += ` a.${e.fieldname.replace(/ /g, "$")}_condition ${e.formula
                      } '${e.fieldvalue[0]}' AND '${e.fieldvalue[1]}'`;
                  } else if (
                    e.fieldtype == "DateTime" &&
                    (e.formula == "<" || e.formula == ">" || e.formula == "=")
                  ) {
                    w += ` a.${e.fieldname.replace(/ /g, "$")}_condition ${e.formula
                      } '${moment(e.fieldvalue).format("YYYY-MM-DD HH:mm:ss")}'`;
                  } else if (
                    e.fieldtype != "DateTime" &&
                    (e.formula == "<" || e.formula == ">" || e.formula == "=")
                  ) {
                    w += ` a.${e.fieldname.replace(
                      / /g,
                      "$"
                    )}_condition != '' AND a.${e.fieldname.replace(
                      / /g,
                      "$"
                    )}_condition ${e.formula} ${e.fieldvalue}`;
                  } else {
                    if (typeof e.fieldvalue == "object") {
                      e.fieldvalue = e.fieldvalue.map((e) => {
                        return `'${e}'`;
                      });
                      console.log("fieldva", e.fieldvalue);
                      e.fieldvalue = e.fieldvalue.join(",");
                    }
                    w += ` a.${e.fieldname.replace(/ /g, "$")}_condition ${e.formula
                      } (${e.fieldvalue})`;
                  }
                });
              }
            });
            w += `) `;
          }
        });
      }

      // Search only on selected columns. Removed since all column search is required.
      // Global search implementations are done below.
      // if (body.search) {
      //   let searchConditions =
      //     w.length > 0 ? " and ({conditions})" : " where {conditions}";
      //   let conditions = "";

      //   body.search.forEach((s, index) => {
      //     if (index > 0) conditions += " or ";
      //     conditions += `\`${s.fieldname}\` like '%${s.value}%' `;
      //   });

      //   w += searchConditions.replace("{conditions}", conditions);
      // }

      if (body && typeof body === 'object') {
        if (body.search) {
          // q = q.replace(
          //   "{search}",
          //   `
          //     and tad.resourceid in (
          //       select
          //         tad2.resourceid
          //       from
          //         tbl_assets_dtl tad2
          //       where
          //         tad2.fieldvalue like "%${body.search}%" and tad2.tenantid = ${body.tenantid})`
          // );

          const s = body.fields.map((f, i) => {
            let searchkey = f.assettype ? f.referencekey : f.fieldname;
            if (i > 0) {
              searchqry =
                searchqry + " OR `" + searchkey + "` LIKE '%" + body.search + "%'";
            } else {
              searchqry = "AND `" + searchkey + "` LIKE '%" + body.search + "%'";
            }
          });
        }
      }

      q = q.replace("{search}", "");
      q = q.replace("{searchqry}", searchqry);
      if (body.sortkey) {
        q = q.replace(
          "{sort}",
          " order by a.`" + body.sortkey + "` " + body.sortorder || "ASC"
        );
      } else {
        q = q.replace("{sort}", "");
      }
      if (body.operationtype) {
        let inc = ``;
        _.each(body.operationtype, (v, idx) => {
          if (idx === body.operationtype.length - 1) {
            inc = inc + `'${v}'`;
          } else {
            inc = inc + `'${v}',`;
          }
        });
        if (inc != "") {
          q = q.replace(
            "{operationtype}",
            ` and tad.dtl_operationtype in (${inc}) `
          );
        } else {
          q = q.replace("{operationtype}", " ");
        }
      } else {
        q = q.replace("{operationtype}", " ");
      }
      q = q.replace("{where}", w);

      q = q.replace(
        "{status}",
        body.status ? ` and tad.status= "${body.status}"` : ""
      );
      const count = await db.sequelize.query(
        `select count(*) count from (${q}) r`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      q += ` limit ${body.offset || 0},${body.limit || 500}`;
      let data: any;

      try {
        data = await db.sequelize.query(q, {
          type: sequelize.QueryTypes.SELECT,
        });
      } catch (e) {
        console.error("error:", e);
        res
          .status(500)
          .send({ error: constants.RESOURCE_DETAILS_ERROR });
        return;
      }
      if (body.attrfilters) {
        data = _.map(data, function (e) {
          const obj = {};
          Object.keys(e).map((k) => {
            let exist = _.find(body.fields, { fieldname: k.replace(/\$/g, " ") });
            if (exist) {
              obj[k.replace(/\$/g, " ").replace(/\_condition/g, "")] = e[k];
            }
            if (k == "resource") {
              obj[k] = e[k];
            }
          });
          e = obj;
          return e;
        });
      }
      if (body.workpackDownload) {
        return data;
      }
      if (body.download) {
        _.each(body.fields, function (h: any) {
          if (h.fieldtype == "REFERENCE") {
            _.map(data, function (value) {
              Object.keys(value).forEach((element) => {
                if (element == h.fieldname) {
                  if (value[element] != "" && value[element] != undefined) {
                    value[element] = _.map(
                      JSON.parse(value[element]),
                      function (e) {
                        return e.name;
                      }
                    ).join(",");
                  }
                }
              });
              return value;
            });
          }
        });

        let template = {
          content: AssetListTemplate,
          engine: "handlebars",
          helpers: CommonHelper,
          recipe: "html-to-xlsx",
        };
        let d = { lists: data, headers: body.headers };
        DownloadService.generateFile(d, template, (result) => {
          res.send({
            data: result,
          });
        });
      } else {
        res.send({
          count: count && count.length > 0 ? count[0]["count"] : 0,
          rows: data,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: messages.INTERNAL_ERROR
      });

    }
  }
  async getDistinctFieldKeyValues(req: Request, res: Response): Promise<void> {
    const body = req.body as {
      fieldkey: string;
      tenantid: string;
      search: string;
    };

    let q = `
      select
        DISTINCT tad.fieldvalue,
        tad.fieldkey fieldkey,
        tad.resourceid resourceid
      from
        tbl_assets_dtl tad
      where
        tad.fieldkey = '${body.fieldkey}' {search}
      limit 500
    `;

    if (body.search) {
      q = q.replace("{search}", `and tad.fieldvalue like "%${body.search}%"`);
    } else {
      q = q.replace("{search}", "");
    }

    const data = await db.sequelize.query(q, {
      type: sequelize.QueryTypes.SELECT,
    });

    res.send(_.uniqBy(data, "fieldvalue"));
  }


  async getResourceById(req: Request, res: Response): Promise<void> {
    const query = req.params as {
      id: string;
    };
    const resourceId = Buffer.from(query.id, "base64").toString();
    const crn = resourceId.split("/")[0];
    const resource = resourceId.split("/")[1];
    let dtlCondition: any = {
      where: {
        status: "Active",
        resourceid: resourceId,
      },

      include: [
        {
          model: db.WatchList,
          as: "notificationwatchlistWP",
          required: false,
          where: {
            refid: resourceId,
            status: constants.STATUS_ACTIVE
          },
          include: [
            {
              model: db.notificationsetup,
              as: "notificationSetup",
              required: false,
              include: [
                {
                  model: db.Templates,
                  as: "templates",
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    };

    if (req.query.tagdetails) {
      dtlCondition.include = [
        {
          as: "attached_rsc",
          model: db.Tags,
          required: false,
          attributes: ["tagname", "tagid"],
          where: { status: constants.STATUS_ACTIVE },
          include: [
            {
              as: "tagvalues",
              model: db.TagValues,
              required: false,
              on: {
                $attributerefid$: {
                  $col: "Assets-DTL.resourceid",
                },
                "$attached_rsc.tagvalues.tagid$": {
                  $col: "attached_rsc.tagid",
                },
              },
              attributes: [
                "resourcetype",
                "resourcerefid",
                "tagvalue",
                "tnregionid",
              ],
              where: {
                status: constants.STATUS_ACTIVE,
                resourcetype: { $in: ["ASSET_INSTANCE", "VIRTUAL_MACHINES"] },
              },
              include: [
                {
                  as: "instances",
                  model: db.Instances,
                  required: false,
                  where: { status: constants.STATUS_ACTIVE },
                  attributes: [
                    "cloudprovider",
                    "instancename",
                    "tenantid",
                    "region",
                    "platform",
                    "tnregionid",
                    "customerid",
                    "instanceid",
                  ],
                  on: {
                    "$attached_rsc.tagvalues.instances.instancerefid$": {
                      $col: "attached_rsc.tagvalues.resourcerefid",
                    },
                  },
                },
              ],
            },
          ],
        },
      ];
    }
    const data = await db.AssetsDtl.findAll(dtlCondition);
    const referringassets = await db.AssetMapping.findAll({
      where: {
        status: "Active",
        crnresourceid: Buffer.from(query.id, "base64").toString(),
      },
    });
    const inbound = await db.sequelize.query(
      `select
          *
        from
          tbl_assets_dtl tad2
        left join tbl_assets_hdr tah on
          tah.fieldkey = tad2.fieldkey
        where
          resourceid in (
          select
            tad.resourceid
          from
            tbl_assets_dtl tad
          where
            tad.fieldkey in (
            select
              fieldkey
            from
              tbl_assets_hdr
            where
              relation in ('${crn}'))
              and tad.fieldvalue like '%:${resource}}%')`,
      {
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    res.send({
      data,
      inbound,
      referringassets,
    });
  }

  async getCMDBKPI(req: Request, res: Response) {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      let query = queries.KPI_CMDB;
      query = query.replace("{tenantid}", req.body.tenantid);
      query = query.replace("{startdt}", req.body.startdt);
      query = query.replace("{enddt}", req.body.enddt);
      if (req.body.duration) {
        if (req.body.duration == "Daily") {
          query = query.replace(
            "{durationquery}",
            "DATE_FORMAT(tad.createddt,'%d-%M-%Y') AS x"
          );
        }
        if (req.body.duration == "Weekly") {
          query = query.replace(
            "{durationquery}",
            "CONCAT('Week ', 1 + DATE_FORMAT(tad.createddt, '%U')) AS x"
          );
        }
        if (req.body.duration == "Monthly") {
          query = query.replace(
            "{durationquery}",
            "DATE_FORMAT(LAST_DAY(tad.createddt),'%M-%Y') AS x"
          );
        }
      }
      let resourceIdsToFilter = [];

      if (req.body.filters && req.body.filters["tagid"]) {
        if (req.body.filters["tagid"]) {
          let tagValueQuery = `
            select
              resourcerefid 
            from
              tbl_bs_tag_values tbtv
            where
              tbtv.tagid IN (${req.body.filters["tagid"].join(",")})
              and tbtv.resourcetype = "ASSET_RECORD"
              {tagvalue}
          `;

          if (req.body.filters["tagvalue"]) {
            tagValueQuery = tagValueQuery.replace(
              "{tagvalue}",
              `and tbtv.tagvalue IN (${_.map(
                req.body.filters["tagvalue"],
                function (i) {
                  return `'${i}'`;
                }
              ).join(",")})`
            );
          } else {
            tagValueQuery = tagValueQuery.replace("{tagvalue}", "");
          }

          const tagResourceId: { resourcerefid: string }[] =
            await db.sequelize.query(tagValueQuery, {
              type: sequelize.QueryTypes.SELECT,
            });

          if (tagResourceId.length > 0) {
            tagResourceId.forEach((o) => {
              resourceIdsToFilter.push(o.resourcerefid);
            });
          }
        }
        console.log(resourceIdsToFilter);
      }


      if (req.body.filters) {
        _.map(req.body.filters, function (value, key) {
          if (key == "crn") {
            value = _.map(value, function (itm) {
              return `'${itm}'`;
            });
            query = query + ` AND tad.crn IN ` + `(${value})`;
          }

          if (key == "tagid" && resourceIdsToFilter.length > 0) {
            value = _.map(resourceIdsToFilter, function (e) {
              return `'${e}'`;
            }).join(",");
            query = query + ` AND tad.resourceid IN ` + `(${value})`;
          }
        });
      }
    } catch (e) { }
  }

  async getCustomizedKPI(req: Request, res: Response) {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      let fieldvalues = queries.CMDB_FIELD_QUERY;
      let query = `SELECT a.x AS x,{yaxis} FROM {subquery} {conditions}`;

      // tag
      let resourceIdsToFilter = [];

      if (
        req.body.filters &&
        req.body.filters["tagid"] &&
        req.body.filters["tagvalue"]
      ) {
        if (req.body.filters["tagid"]) {
          let tagValueQuery = `
          select
            resourcerefid 
          from
            tbl_bs_tag_values tbtv
          where
            tbtv.tagid IN (${req.body.filters["tagid"].join(",")})
            and tbtv.resourcetype = "ASSET_RECORD"
            {tagvalue}
        `;

          if (req.body.filters["tagvalue"]) {
            tagValueQuery = tagValueQuery.replace(
              "{tagvalue}",
              `and tbtv.tagvalue IN (${_.map(
                req.body.filters["tagvalue"],
                function (i) {
                  return `'${i}'`;
                }
              ).join(",")})`
            );
          } else {
            tagValueQuery = tagValueQuery.replace("{tagvalue}", "");
          }

          const tagResourceId: { resourcerefid: string }[] =
            await db.sequelize.query(tagValueQuery, {
              type: sequelize.QueryTypes.SELECT,
            });

          if (tagResourceId.length > 0) {
            tagResourceId.forEach((o) => {
              resourceIdsToFilter.push(o.resourcerefid);
            });
          }
        }
      }

      if (req.body.charttype == "rangeBar") {
        query = queries.TIMELINE_Q;
        let tenantid = `${req.body.tenantid}`;
        let crn = `${req.body.filters["crn"][0]}`;
        let startdt = `${req.body.startdt}`;
        let enddt = `${req.body.enddt}`;
        let fieldquery = "";
        let conditions = "";
        let additionalFields = [];
        if (req.body.attributes) {
          additionalFields = additionalFields.concat(req.body.attributes);
        }
        if (req.body.settings) {
          let xaxis = _.clone(req.body.settings["yaxis"]);
          xaxis.fieldtype = "Text";
          xaxis.fieldname = "x";
          additionalFields.push(xaxis);

          if (req.body.settings["xaxisList"]) {
            req.body.settings["xaxisList"].map((e, i) => {
              e.xaxis.fieldname = "y" + i;
              additionalFields.push(e.xaxis);
            });
          }
        }
        if (additionalFields.length > 0) {
          additionalFields.map((element, i) => {
            // To add attributes as fields
            element.fieldname = element.fieldname.replace(/\s/g, "");
            let fvalue: any = _.find(fieldvalues, {
              fieldtype: element.fieldtype,
            });
            fieldquery = `${fieldquery} MAX(case when tad.fieldkey = "${element.fieldkey
              }" then ${fvalue != undefined ? fvalue.query : "tad.fieldvalue"
              } end) as '${element.fieldname}'`;

            if (i != additionalFields.length - 1) {
              fieldquery = fieldquery + ",";
            }

            // To add attributes as where conditions
            if (element.value && element.value != "") {
              conditions = conditions != "" ? conditions + " AND " : " AND ";
              if (
                element.fieldtype == "Text" ||
                element.fieldtype == "Textarea" ||
                element.fieldtype == "Select" ||
                element.fieldtype == "Boolean" ||
                element.fieldtype == "STATUS" ||
                element.fieldtype == "REFERENCE"
              ) {
                let value = element.value.map((o) => {
                  return `'${o}'`;
                });
                conditions =
                  conditions +
                  ` a.${element.fieldname} is not null and a.${element.fieldname} IN (${value})`;
              }
              if (
                element.fieldtype == "Date" ||
                element.fieldtype == "DateTime"
              ) {
                if (element.operation == "BETWEEN") {
                  conditions =
                    conditions +
                    ` a.${element.fieldname} ${element.operation} '${moment(
                      element.value[0]
                    ).format("YYYY-MM-DD hh:mm:ss")}' AND '${moment(
                      element.value[1]
                    ).format("YYYY-MM-DD hh:mm:ss")}'`;
                } else {
                  conditions =
                    conditions +
                    ` a.${element.fieldname} ${element.operation} '${element.value}'`;
                }
              }
              if (
                element.fieldtype == "Integer" ||
                element.fieldtype == "Float" ||
                element.fieldtype == "AUTOGEN"
              ) {
                conditions =
                  conditions +
                  ` a.${element.fieldname} is not null and a.${element.fieldname} ${element.operation} ${element.value}`;
              }
              conditions = conditions + ` AND a.x is not null`;
            }
          });
        }
        if (
          req.body.filters &&
          req.body.filters["tagid"] &&
          req.body.filters["tagvalue"] &&
          resourceIdsToFilter.length > 0
        ) {
          let value = _.map(resourceIdsToFilter, function (e) {
            return `'${e}'`;
          }).join(",");
          conditions = conditions + ` AND a.resourceid IN ` + `(${value})`;
        }
        query = query.replace("{tenantid}", tenantid);
        query = query.replace("{crn}", crn);
        query = query.replace("{startdt}", startdt);
        query = query.replace("{enddt}", enddt);
        query = query.replace("{condition}", conditions);
        query = query.replace("{fields}", fieldquery);
      } else {
        let subquery = `(select 
      tad.resourceid AS resourceid,
      {fields}
      from tbl_assets_dtl tad 
      where tad.status = 'Active' and 
      tenantid = ${req.body.tenantid} 
      {subcondition}
      GROUP by tad.resourceid)a`;
        let cumulative_q = `select 
        x,{c_fields}
        from ({subquery})t JOIN (SELECT@running_total := 0) r`;
        let conditions = "";
        let fieldquery = "";
        let subcondition = "";
        let yaxis = "";
        let c_fields = "";
        // Filters

        if (req.body.filters) {
          _.map(req.body.filters, function (value, key) {
            if (key == "crn") {
              value = _.map(value, function (itm) {
                return `'${itm}'`;
              });
              subcondition = ` AND tad.crn IN ` + `(${value})`;
            }
            if (key == "tagid" && resourceIdsToFilter.length > 0) {
              value = _.map(resourceIdsToFilter, function (e) {
                return `'${e}'`;
              }).join(",");
              query = query + ` AND a.resourceid IN ` + `(${value})`;
            }
          });
        }
        if (req.body.startdt && req.body.enddt) {
          subcondition =
            subcondition +
            ` AND tad.createddt BETWEEN '${req.body.startdt}' AND '${req.body.enddt}'`;
        }
        subquery = subquery.replace("{subcondition}", subcondition);

        let additionalFields = [];
        if (req.body.attributes) {
          additionalFields = additionalFields.concat(req.body.attributes);
        }
        if (req.body.settings) {
          let xaxis = _.clone(req.body.settings["xaxis"]);
          // let yaxis = _.clone(req.body.settings["yaxis"]);
          // xaxis.fieldtype = "Text";
          xaxis.fieldname = "x";
          // yaxis.fieldtype = "Text";
          // yaxis.fieldname = "y";
          additionalFields.push(xaxis);
          // additionalFields.push(yaxis);

          if (req.body.settings["yaxisList"]) {
            req.body.settings["yaxisList"].map((e, i) => {
              e.yaxis.fieldname = "y" + i;
              additionalFields.push(e.yaxis);
            });
          }
        }

        if (additionalFields.length > 0) {
          additionalFields.map((element, i) => {
            // To add attributes as fields
            element.fieldname = element.fieldname.replace(/\s/g, "");
            let fvalue: any = _.find(fieldvalues, {
              fieldtype: element.fieldtype,
            });
            if (element.fieldtype == "DateTime") {
              fvalue.query = `STR_TO_DATE(tad.fieldvalue ,"%d/%b/%y")`;
            }
            fieldquery = `${fieldquery} MAX(case when tad.fieldkey = "${element.fieldkey
              }" then ${fvalue != undefined ? fvalue.query : "tad.fieldvalue"
              } end) as '${element.fieldname}'`;

            if (i != additionalFields.length - 1) {
              fieldquery = fieldquery + ",";
            }

            // To add attributes as where conditions
            if (element.value && element.value != "") {
              conditions = conditions != "" ? conditions + " AND " : " WHERE ";
              if (
                element.fieldtype == "Text" ||
                element.fieldtype == "Textarea" ||
                element.fieldtype == "Select" ||
                element.fieldtype == "Boolean" ||
                element.fieldtype == "STATUS" ||
                element.fieldtype == "REFERENCE"
              ) {
                let value = element.value.map((o) => {
                  return `'${o}'`;
                });
                conditions =
                  conditions +
                  ` a.${element.fieldname} is not null and a.${element.fieldname} IN (${value})`;
              }
              if (
                element.fieldtype == "Date" ||
                element.fieldtype == "DateTime"
              ) {
                if (element.operation == "BETWEEN") {
                  conditions =
                    conditions +
                    ` a.${element.fieldname} ${element.operation} '${moment(
                      element.value[0]
                    ).format("YYYY-MM-DD hh:mm:ss")}' AND '${moment(
                      element.value[1]
                    ).format("YYYY-MM-DD hh:mm:ss")}'`;
                } else {
                  conditions =
                    conditions +
                    ` a.${element.fieldname} ${element.operation} '${element.value}'`;
                }
              }
              if (
                element.fieldtype == "Integer" ||
                element.fieldtype == "Float" ||
                element.fieldtype == "AUTOGEN"
              ) {
                conditions =
                  conditions +
                  ` a.${element.fieldname} is not null and a.${element.fieldname} ${element.operation} ${element.value}`;
              }
              conditions = conditions + ` AND a.x is not null`;
            }
          });
        }
        if (conditions == "") {
          conditions = conditions + ` WHERE a.x is not null`;
        }
        subquery = subquery.replace("{fields}", fieldquery);
        query = query.replace("{subquery}", subquery);

        query = query + ` GROUP BY a.x`;
        let cumsum = false;
        if (req.body.settings["yaxisList"]) {
          let orders = "";
          req.body.settings["yaxisList"].map((o, i) => {
            if (
              o.aggregate &&
              o.aggregate != null &&
              o.aggregate != undefined
            ) {
              if (o.aggregate == "AVG") {
                yaxis = yaxis + ` ROUND(${o.aggregate}(y${i})) AS y${i}`;
                c_fields = c_fields + ` y${i}`;
              } else if (o.aggregate == "cum_count") {
                yaxis = yaxis + ` COUNT(y${i}) AS count`;
                c_fields =
                  c_fields +
                  `count, @running_total := @running_total + count AS y${i} `;
                cumsum = true;
              } else if (o.aggregate == "cum_sum") {
                yaxis = yaxis + ` SUM(y${i}) AS sumt`;
                c_fields =
                  c_fields +
                  `sumt, @running_total := @running_total + sumt AS y${i} `;
                cumsum = true;
              } else {
                yaxis = yaxis + ` ${o.aggregate}(y${i}) AS y${i}`;
                c_fields = c_fields + ` y${i}`;
              }
            } else {
              yaxis = yaxis + ` y${i}`;
              c_fields = c_fields + ` y${i}`;
            }
            conditions = conditions + ` AND a.y${i} is not null`;
            orders = orders + `y${i}`;
            if (i != req.body.settings["yaxisList"].length - 1) {
              yaxis = yaxis + ",";
              c_fields = c_fields + ",";
              orders = orders + ",";
            }
          });
          query = query.replace("{yaxis}", yaxis);
          query = query.replace("{conditions}", conditions);
          if (cumsum) {
            let q = cumulative_q;
            q = q.replace("{subquery}", query);
            q = q.replace("{c_fields}", c_fields);
            query = q;
          }
          if (req.body.settings["order"]) {
            query = query + ` ORDER BY x,y0 ${req.body.settings.order}`;
          }
        }

        if (
          req.body.settings &&
          req.body.settings.limit &&
          req.body.settings.limit > 0
        ) {
          query = query + ` LIMIT ${req.body.settings.limit}`;
        }
        query = query.replace("{yaxis}", yaxis);
      }
      const list = await db.sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
      });
      if (list) {
        customValidation.generateSuccessResponse(
          list,
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      }
    } catch (e) { }
  }

  externalRefList(req: Request, res: Response): void {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      let parameters: any = { where: req.body };
      // const data = await db.sequelize.query(q, {
      //   type: sequelize.QueryTypes.SELECT,
      // });
      CommonService.getAllList(parameters, db.ReferenceModelTbl)
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

  async querybuilder(req: Request, res: Response) {
    if (req.body) {
      let query = `select * from ({subquery})a where 1=1`;
      let subquery = "";
      let wherequery = "";
      let wherequery1 = "";
      let fieldq = "";
      if (req.body.type) {
        wherequery = wherequery + ` d.type IN ('${req.body.type}')`;
      }
      if (req.body.resourcetype) {
        let r = _.map(req.body.resourcetype, function (e) {
          return `'${e}'`;
        });
        wherequery = wherequery + ` AND d.resourcetype IN (${r.join(",")})`;
      }
      if (req.body.fields) {
        let f = _.map(req.body.fields, function (e) {
          return `'${e.fieldkey}'`;
        });
        wherequery = wherequery + ` AND d.field_key IN (${f.join(",")})`;
        if (req.body.resourcetype.length > 1) {
          wherequery = wherequery + `AND d.referenceid IS NOT NULL `;
        }
        req.body.fields.map((e, i) => {
          if (
            e.filters &&
            !_.isEmpty(e.filters) &&
            e.resourcetype == req.body.type
          ) {
            if (e.filters.operation == "BETWEEN") {
              wherequery1 =
                wherequery1 +
                ` AND ${e.header.replace(/ /g, "$")}_condition ${e.filters.operation
                } '${e.filters.value[0]}' AND '${e.filters.value[1]}'`;
            } else if (
              e.fieldtype == "DateTime" &&
              (e.filters.operation == "<" ||
                e.filters.operation == ">" ||
                e.filters.operation == "=")
            ) {
              wherequery1 =
                wherequery1 +
                ` AND ${e.header.replace(/ /g, "$")}_condition ${e.filters.operation
                } '${e.filters.value[0]}'`;
            } else if (
              e.fieldtype != "DateTime" &&
              (e.filters.operation == "<" ||
                e.filters.operation == ">" ||
                e.filters.operation == "=")
            ) {
              wherequery1 =
                wherequery1 +
                ` AND (${e.header.replace(/ /g, "$")}_condition ${e.filters.operation
                } '${e.filters.value.fieldvalue}')`;
            } else {
              let v = e.filters.value.map((e) => `'${e.fieldvalue}'`);
              let resourceid = e.filters.value.map((e) => `'${e.resourceids}'`);
              wherequery1 =
                wherequery1 +
                ` AND (${e.header.replace(/ /g, "$")}_condition ${e.filters.operation
                } (${v.join(",")}))`;
            }
          } else {
            if (
              e.resourcetype != req.body.type &&
              e.filters &&
              !_.isEmpty(e.filters)
            ) {
              let condition;
              if (e.filters.operation == "BETWEEN") {
                condition = ` field_value ${e.filters.operation} '${e.filters.value[0]}' AND '${e.filters.value[1]}'`;
              } else if (
                e.fieldtype == "DateTime" &&
                (e.filters.operation == "<" ||
                  e.filters.operation == ">" ||
                  e.filters.operation == "=")
              ) {
                condition = ` field_value ${e.filters.operation} '${e.filters.value[0]}'`;
              } else if (
                e.fieldtype != "DateTime" &&
                (e.filters.operation == "<" ||
                  e.filters.operation == ">" ||
                  e.filters.operation == "=")
              ) {
                condition = ` field_value ${e.filters.operation} '${e.filters.value.fieldvalue}'`;
              } else {
                let v = e.filters.value.map((e) => `'${e.fieldvalue}'`);
                condition = ` field_value ${e.filters.operation} (${v.join(
                  ","
                )})`;
              }
              let subq = `AND d.resource IN (select resource from asset_dtl_view adv where {condition})`;
              subq = subq.replace("{condition}", condition);
              wherequery = wherequery + subq;
            }
          }
          if (e.resourcetype == req.body.type) {
            fieldq =
              fieldq +
              `ifnull(max(case when d.field_key='${e.fieldkey
              }' then d.field_value end),(select field_value from asset_dtl_view adv2 where adv2.field_key='${e.fieldkey
              }' and adv2.resourcetype='${e.resourcetype
              }' and adv2.resource = d.resource LIMIT 1)) as '${e.header.replace(
                / /g,
                "$"
              )}_condition',`;
          } else {
            fieldq =
              fieldq +
              `max(case when d.field_key='${e.fieldkey
              }' then d.field_value end) as '${e.header.replace(
                / /g,
                "$"
              )}_condition',`;
          }
        });
        subquery = `select {fieldq}d.resource,d.resourcetype,d.type from asset_dtl_view d where {whereq} group by d.resource,d.referenceid `;
        subquery = subquery.replace("{fieldq}", fieldq);
      }
      subquery = subquery.replace("{whereq}", wherequery);

      query = query.replace("{subquery}", subquery);
      console.log("q", query);
      let countq = `select count(*) as count from ({subquery})a where 1=1`;
      countq = countq.replace("{subquery}", subquery);
      if (wherequery1 != "") countq = countq + wherequery1;
      const count = await db.sequelize.query(countq, {
        type: sequelize.QueryTypes.SELECT,
      });
      if (count) {
        if (wherequery1 != "") query = query + wherequery1;
        if (
          req.query.limit &&
          req.query.offset &&
          req.query.isdownload == undefined
        ) {
          query = query + ` limit ${req.query.offset},${req.query.limit}`;
        }
        let data = await db.sequelize.query(query, {
          type: sequelize.QueryTypes.SELECT,
        });
        data = _.map(data, function (e) {
          const obj = {};
          Object.keys(e).map((k) => {
            obj[k.replace(/\$/g, " ").replace(/\_condition/g, "")] = e[k];
            if (k == "resource") {
              obj[k] = e[k];
            }
          });
          e = obj;
          return e;
        });
        // data = _.map(data, function (e) {
        //   if (e.resourcetype != e.type) {
        //     let h = _.find(data, function (i) { return i.resource == e.resource && i.type == req.body.type });
        //     req.body.fields.map((f) => {
        //       if (f.resourcetype == req.body.type) {
        //         e[f['header']] = h[f['header']];
        //       }
        //       if (f['header'] == e[f['header']] && f.fieldtype == "REFERENCE") {
        //         let val = JSON.parse(e[f['header']]);
        //         e[f['header']] = (val && val.length > 0) ? _.map(val, function (i) { return i.name }) : val;
        //       }
        //     })
        //   }

        //   return e;
        // })

        if (req.query.isdownload) {
          let template = {
            content: AssetListTemplate,
            engine: "handlebars",
            helpers: CommonHelper,
            recipe: "html-to-xlsx",
          };
          let d = { lists: data, headers: req.body.headers };
          DownloadService.generateFile(d, template, (result) => {
            res.send({
              data: result,
            });
          });
        } else {
          res.send({
            count: count && count.length > 0 ? count[0]["count"] : 0,
            rows: data,
          });
        }
      }
    }
  }

  async reportquerybuilder(req: Request, res: Response) {
    try {
      console.log("query initiated");
      let q = `select * from ({mainq})a`;
      let query = `select * from ({joinquery}) WHERE 1=1`;
      let joinquery = "";
      let mainsubquery = `(select {fieldquery}d.resource from asset_record_view1 d where crn IN ({crn}) and field_key IN ({fieldkeys}) and referenceid IS NULL GROUP BY d.resource ORDER BY d.resource ASC)tmp1`;
      let fieldquery = "";
      let wherecondition = "";
      let searchquery = "";
      let groupedresources: any = _.groupBy(req.body.fields, "resourcetype");
      let i = 1;
      _.map(groupedresources, function (value, key) {
        i = i + 1;
        fieldquery = "";
        value.map((e, i) => {
          if (e.filters && !_.isEmpty(e.filters)) {
            if (e.filters.operation == "BETWEEN") {
              wherecondition =
                wherecondition +
                ` AND ${e.header.replace(/ /g, "$")}_condition ${e.filters.operation
                } '${e.filters.value[0]}' AND '${e.filters.value[1]}'`;
            } else if (
              e.fieldtype == "DateTime" &&
              (e.filters.operation == "<" ||
                e.filters.operation == ">" ||
                e.filters.operation == "=")
            ) {
              wherecondition =
                wherecondition +
                ` AND ${e.header.replace(/ /g, "$")}_condition ${e.filters.operation
                } '${e.filters.value[0]}'`;
            } else if (
              e.fieldtype != "DateTime" &&
              (e.filters.operation == "<" ||
                e.filters.operation == ">" ||
                e.filters.operation == "=")
            ) {
              wherecondition =
                wherecondition +
                ` AND (${e.header.replace(/ /g, "$")}_condition ${e.filters.operation
                } '${e.filters.value.fieldvalue}')`;
            } else {
              let v = e.filters.value.map((e) => `'${e.fieldvalue}'`);
              wherecondition =
                wherecondition +
                ` AND (${e.header.replace(/ /g, "$")}_condition ${e.filters.operation
                } (${v.join(",")}))`;
            }
          }

          // Search condition
          if (req.body.searchText) {
            searchquery =
              searchquery +
              (searchquery == ""
                ? `${e.header.replace(/ /g, "$")}_condition like '%${req.body.searchText
                }%' `
                : ` OR ${e.header.replace(/ /g, "$")}_condition like '%${req.body.searchText
                }%'`);
          }

          fieldquery =
            fieldquery +
            `max(case when d.field_key='${e.fieldkey
            }' then d.field_value end) as '${e.header.replace(
              / /g,
              "$"
            )}_condition',`;
        });
        let idx = i;
        if (req.body.type == key) {
          mainsubquery = mainsubquery.replace(
            "{fieldkeys}",
            value.map((e) => {
              return `'${e.fieldkey}'`;
            })
          );
          mainsubquery = mainsubquery.replace("{crn}", `'${value[0].crn}'`);
          mainsubquery = mainsubquery.replace("{fieldquery}", fieldquery);
          joinquery = joinquery + mainsubquery;
        } else {
          let subquery = `(select {fieldquery}d.resource as {resourcename} from asset_record_view1 d where crn IN ({crn}) and field_key IN ({fieldkeys}) GROUP BY d.resource,d.referenceid){alias}`;
          subquery = subquery.replace(
            "{fieldkeys}",
            value.map((e) => {
              return `'${e.fieldkey}'`;
            })
          );
          subquery = subquery.replace("{crn}", `'${value[0].crn}'`);
          subquery = subquery.replace("{fieldquery}", fieldquery);
          subquery = subquery.replace("{resourcename}", `resource${idx}`);
          subquery = subquery.replace("{alias}", `tmp${idx}`);
          joinquery =
            joinquery +
            ` LEFT JOIN ` +
            subquery +
            ` ON tmp1.resource = tmp${idx}.resource${idx}`;
        }
      });
      if (req.body.searchText) {
        wherecondition = wherecondition + ` AND (${searchquery})`;
      }
      query = query.replace("{joinquery}", joinquery);
      if (wherecondition != "") {
        query = query + ` {whereq}`;
        query = query.replace("{whereq}", wherecondition);
      }
      query = query + ` ORDER BY resource ASC `;
      q = q.replace("{mainq}", query);
      if (
        req.query.limit &&
        req.query.offset &&
        req.query.isdownload == undefined
      ) {
        q = q + ` LIMIT ${req.query.offset},${req.query.limit}`;
      }
      let data = await db.sequelize.query(q, {
        type: sequelize.QueryTypes.SELECT,
      });
      data = _.map(data, function (e) {
        const obj = {};
        Object.keys(e).map((k) => {
          obj[k.replace(/\$/g, " ").replace(/\_condition/g, "")] = e[k];
          if (k == "resource") {
            obj[k] = e[k];
          }
        });
        e = obj;
        return e;
      });
      if (req.query.count) {
        let q = `select count(*) as 'count' from (` + query + `)r`;
        let c = await db.sequelize.query(q, {
          type: sequelize.QueryTypes.SELECT,
        });
        res.send({
          count: c && c.length > 0 ? c[0]["count"] : 0,
        });
      } else {
        if (req.query.isdownload) {
          let template = {
            content: AssetListTemplate,
            engine: "handlebars",
            helpers: CommonHelper,
            recipe: "html-to-xlsx",
          };
          let d = { lists: data, headers: req.body.headers };
          DownloadService.generateFile(d, template, (result) => {
            res.send({
              data: result,
            });
          });
        } else {
          res.send({
            count: 0,
            rows: data,
          });
        }
      }
    } catch (e) { }
  }

  async transactionrefUpdate(req: Request, res: Response) {
    let countq = `select
    COUNT(d.id) count
  from
    tbl_assets_dtl d
  join tbl_assets_hdr h on
    h.fieldkey = d.fieldkey
    and h.status = 'Active'`;
    let countd: any = await db.sequelize.query(countq, {
      type: sequelize.QueryTypes.SELECT,
    });
    let count = countd[0]["count"];
    let qu = `select
    d.id 'dtlid',
    d.*,
    h.*
  from
    tbl_assets_dtl d
  join tbl_assets_hdr h on
    h.fieldkey = d.fieldkey
    and h.status = 'Active'`;
    let limit = 1000;
    let index = 1;
    let offset = 0;
    if (count > 0) startTxnUpdate();
    async function startTxnUpdate() {
      if (count > 0) {
        let asstq = qu + ` LIMIT ${offset},${limit}`;
        let data: any = await db.sequelize.query(asstq, {
          type: sequelize.QueryTypes.SELECT,
        });
        if (data) {
          let assetdtls = [];
          _.map(data, function (itm) {
            if (itm.fieldtype == "REFERENCE") {
              if (itm.fieldvalue != "") {
                let val = JSON.parse(itm.fieldvalue);
                if (val.length > 0) {
                  val.map(async (e) => {
                    if (e && e.crn) {
                      let q = `select * from tbl_assets_dtl where resourceid IN ({resourceid})`;
                      q = q.replace(
                        "{resourceid}",
                        `'${e.crn}/${e.resourceid}'`
                      );
                      let refdetails = await db.sequelize.query(q, {
                        type: sequelize.QueryTypes.SELECT,
                      });

                      if (refdetails && refdetails.length > 0) {
                        refdetails.map((r) => {
                          let obj = {
                            txnid: r.id,
                            txn: r.fieldkey,
                            reference: `${e.crn}/${e.resourceid}`,
                            refkey: itm.resourceid,
                            notes: "Referenced resource",
                            status: "Active",
                            createddt: new Date(),
                            createdby: "SYSTEM",
                          };
                          assetdtls.push(obj);
                        });
                      }
                      // let obj = {
                      //   txnid: itm.dtlid,
                      //   txn: itm.fieldkey,
                      //   reference: e.crn,
                      //   refkey: `${e.crn}/${e.resourceid}`,
                      //   notes: `${e.crn}/${e.resourceid}`,
                      //   status: 'Active',
                      //   createddt: new Date(),
                      //   createdby: 'SYSTEM'
                      // }

                      // let mainobj = {
                      //   txnid: itm.dtlid,
                      //   txn: itm.fieldkey,
                      //   reference: itm.crn,
                      //   refkey: itm.resourceid,
                      //   notes: `${e.crn}/${e.resourceid}`,
                      //   status: 'Active',
                      //   createddt: new Date(),
                      //   createdby: 'SYSTEM'
                      // }
                      // assetdtls.push(mainobj);
                    }
                  });
                }
              }
            } else {
              let obj = {
                txnid: itm.dtlid,
                txn: itm.fieldkey,
                reference: null,
                refkey: itm.resourceid,
                notes: "Parent resource",
                status: "Active",
                createddt: new Date(),
                createdby: "SYSTEM",
              };
              assetdtls.push(obj);
            }
          });
          console.log("data", assetdtls);
          CommonService.bulkUpdate(
            assetdtls,
            [
              "txnid",
              "txnref",
              "reference",
              "status",
              "createddt",
              "createdby",
            ],
            db.TxnRefModel
          ).then((r) => {
            console.log("Records updated", count);
            count = count - limit;
            index = index + 1;
            offset = index * limit - limit;
            if (count > 0) {
              startTxnUpdate();
            }
          });
        }
      } else {
        console.log("All records updated");
      }
    }
  }
  async copyResourceDetails(req: Request, res: Response) {
    try {
      let reqDta: any = req.body;
      const response = {
        reference: modules.CMDB,
      } as any;
      let createres = await new Controller().formatResourceDetails(reqDta);
      if (createres) {
        let inserted = await new Controller().resourceDetailsBulkCreate(
          createres
        );
        let ins_resourceid, ins_crn;
        if (inserted) {
          if (inserted.length > 0) {
            let insertedItesm = inserted;
            ins_resourceid = insertedItesm[0]["resourceid"];
            let resource_title = "";
            let headerData = _.find(insertedItesm, (f) => {
              let fieldkey: string = f.fieldkey;
              return (
                fieldkey.indexOf("fk:name") > -1 ||
                fieldkey.indexOf("fk:title") > -1 ||
                fieldkey.indexOf("fk:script_id") > -1
              );
            });
            if (headerData) {
              resource_title = headerData.fieldvalue;
            }
            let cloneRefReq = {
              resourceId: reqDta.resourceId,
              new_resourceId: ins_resourceid,
            };
            new Controller().workpackTxnRefBulkCreate(
              cloneRefReq
            );
            customValidation.generateSuccessResponse(
              inserted,
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
          }
        }
      }
    } catch (e) {
      console.log("catch", e);
    }
  }
  async formatResourceDetails(reqDta: any): Promise<any> {
    try {
      let resourceId = reqDta.resourceId;
      let crn = resourceId.split("/")[0];
      let query = `select
                  tad .crn,
                  tad .fieldkey,
                  tah .fieldtype,
                  tah .id  as hdrid,
                  tad .fieldvalue,
                  tad .resourceid,
                  tad .dtl_operationtype,
                  tad .status 
                from
                  tbl_assets_dtl tad
                left join tbl_assets_hdr tah on
                  tad .crn = tah .crn
                  and 
                  tad .fieldkey = tah .fieldkey
                where
                  tah .crn = '${crn}'
                  and 
                  tad .resourceid ='${resourceId}' `;
      let resourcedetailsData = await db.sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
      });
      let autoGenList = [];
      let updateList = [];
      resourcedetailsData.map((asst) => {
        if (asst.fieldtype == "AUTOGEN") autoGenList.push(asst.fieldkey);
      });
      if (autoGenList.length > 0) {
        let hdrList = await CommonService.getAllList(
          {
            // where: { id: { $in: autoGenList } },
            where: { fieldkey: { $in: autoGenList } },
            attributes: ["id", "curseq", "prefix", "fieldkey"],
          },
          db.AssetsHdr
        );
        hdrList = JSON.parse(JSON.stringify(hdrList));
        let i = 0;
        let currentseq;
        let autogenlen = autoGenList.length;
        const resourceTimeStamp = Date.now().toString();
        let crnresourceid = (crn + "/" + resourceTimeStamp).toString();
        for (const asset of resourcedetailsData) {
          asset.createdby = reqDta.createdby;
          asset.createddt = reqDta.createddt;
          asset.lastupdatedby = reqDta.lastupdatedby;
          asset.lastupdatedby = reqDta.lastupdatedby;
          asset.lastupdateddt = reqDta.lastupdateddt;
          asset.tenantid = reqDta.tenantid;
          asset.resourceid = crnresourceid;
          i++;
          if (asset.fieldtype == "AUTOGEN") {
            let seq = hdrList.find((rec) => {
              return rec.fieldkey === asset.fieldkey;
            });
            if (seq) {
              if (currentseq == undefined) currentseq = seq.curseq;
              asset.fieldvalue = `${seq.prefix}${currentseq}`;
              updateList.push({
                id: asset.hdrid ? asset.hdrid : hdrList[0].id,
                curseq: await getSeq(Number(currentseq)),
                resourcetype: "",
              });
              autogenlen--;
              if (autogenlen != 0) {
                currentseq = Number(currentseq) + 1;
              }
            }
          }

          if (i == resourcedetailsData.length) {
            reqDta.updateList = updateList;
            reqDta.assetdetails = resourcedetailsData;
            return reqDta;
          }
        }
        function getSeq(seqNo) {
          let currseq = parseInt(seqNo);
          let newSeq: any = currseq + 1;
          let currLength = seqNo.length - newSeq.toString().length;
          for (let i = 0; i < currLength; i++) {
            newSeq = "0" + newSeq;
          }
          return newSeq;
        }
      } else {
        new Controller().resourceDetailsBulkCreate(reqDta);
      }
    } catch (e) {
      return;
    }
  }
  async resourceDetailsBulkCreate(reqDta: any): Promise<any> {
    try {
      let resData: {
        id: number;
        tenantid: number;
        crn: string;
        fieldkey: string;
        fieldvalue: string;
        resourceid: string;
        status: string;
        createdby: string;
        createddt: Date;
        lastupdatedby: string;
        lastupdateddt: Date;
      }[] = await CommonService.bulkCreate(reqDta.assetdetails, db.AssetsDtl);

      await CommonService.create(
        {
          type: 1,
          old: null,
          new: "New record created",
          affectedattribute: null,
          status: "Active",
          createdby: resData[0]["createdby"],
          createddt: resData[0]["createddt"],
          lastupdatedby: null,
          lastupdateddt: null,
          meta: "",
          tenantid: resData[0]["tenantid"],
          resourceid: resData[0]["resourceid"],
          crn: resData[0]["crn"],
        },
        db.AssetsHistory
      );
      await CommonService.bulkUpdate(
        reqDta.updateList,
        ["curseq"],
        db.AssetsHdr
      );
      return resData;
    } catch (e) {
      return e;
    }
  }
  txnList(req: Request, res: Response): void {
    let response = {};
    let reqDta: any = req.body;
    let parameters = { where: req.body };
    try {
      CommonService.getAllList(parameters, db.TxnRefModel).then((list) => {
        customValidation.generateSuccessResponse(
          list,
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  updateTxn(req: Request, res: Response): void {
    let response = {};
    let parameters: any = {};
    if (req.body.condition) {
      parameters = req.body.condition;
      delete req.body["condition"];
    }
    if (req.body.id) {
      parameters.id = req.body.id;
    }
    try {
      CommonService.update(parameters, req.body, db.TxnRefModel).then((data) => {
        customValidation.generateSuccessResponse(
          data,
          response,
          constants.RESPONSE_TYPE_UPDATE,
          res,
          req
        );
      });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  async workpackTxnRefBulkCreate(req: any): Promise<any> {
    let parameters = { where: {} } as any;
    let resourceId = req.resourceId;
    let txnList = [];
    let txnCreateData = [];
    try {
      if (resourceId) {
        let newRsrcId = req.new_resourceId.split("/")[1];
        parameters.where = {
          refkey: resourceId,
          status: constants.STATUS_ACTIVE,
        };
        let list = await CommonService.getAllList(parameters, db.TxnRefModel);
        list = JSON.parse(JSON.stringify(list));
        list.forEach(async (element, i) => {
          if (!txnList.includes(element.txn)) {
            txnList.push(element.txn);
            let taskList = await CommonService.getAllList(
              { where: { resourceid: element.txn, status: constants.STATUS_ACTIVE } },
              db.AssetsDtl
            );
            if (taskList) {
              taskList = JSON.parse(JSON.stringify(taskList));
              let taskData = taskList.map((t) => {
                delete t["id"];
                return {
                  ...t,
                  refkey: req.new_resourceId,
                  resourceid: element.txn ? `${element.txn.split("/")[0]}/${i}${newRsrcId}` : null
                };
              });
              let taskRef = await CommonService.bulkCreate(
                taskData,
                db.AssetsDtl
              );
              taskRef = JSON.parse(JSON.stringify(taskRef));
              if (taskRef && taskRef.length > 0) {
                delete element["id"];
                let reqDta = {
                  ...element,
                  createdby: element.createdby ? element.createdby : constants.ADMIN,
                  createddt: new Date(),
                  refkey: req.new_resourceId,
                  txn: taskData[0].resourceid,
                  order: i
                };
                txnCreateData.push(reqDta);
                if (list.length == i + 1) {
                  txnCreateData = _.sortBy(txnCreateData, "order");
                  await CommonService.bulkCreate(
                    txnCreateData,
                    db.TxnRefModel
                  );
                }
              }
            }
          }
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
  async SendWorkflowNotification(req, updatedData: any[]): Promise<any> {
    return new Promise(async (resolve, reject) => {
      // let workflowService = new WorkflowService();
      // let resouceid = req.resourceid.replace("/wflow","");
      if (updatedData.length > 0) {
        // let resourceid = updatedData[0]["resourceid"];
        // workflowService.sendCommentsNotification(
        //   resourceid,
        //   updatedData,
        //   "field-updates"
        // );
      }
      resolve(true);
    });
  }
}

export default new Controller();

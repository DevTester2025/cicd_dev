import * as _ from "lodash";
import db from "../../../models/model";
import { customValidation } from "../../../../common/validation/customValidation";
import CommonService from "../../../services/common.service";
import { constants } from "../../../../common/constants";
import { Request, Response, response } from "express";
import { queries } from "../../../../common/query";
import servicenowService from "../../../services/servicenow.service";
import { modules } from "../../../../common/module";
import pagerDutyService, { PagerDutyService } from "../../../services/pager-duty.service";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
import { AssetListTemplate } from "../../../../reports/templates";

export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    let response = { reference: modules.INC };
    try {
      let parameters = {
        where: req.body
      } as any;
      if (req.query.order && typeof req.query.order === "string") {
        let order : any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
        if(splittedOrder[0] == 'customername'){
          parameters.order = [
            [{ model: db.Customer, as: "customer" }, "customername", splittedOrder[1]],
          ];
        }
      }
      if (req.query.limit) {
        parameters["limit"] = Number(req.query.limit);
      }
      if (req.query.offset) {
        parameters["offset"] = Number(req.query.offset);
      }
      if (req.body.startdate && req.body.enddate) {
        parameters["where"]["incidentdate"] = {
          $between: [req.body.startdate, req.body.enddate],
        };
        parameters["where"] = _.omit(req.body, ["startdate", "enddate"]);
      }
      if (req.query.customer) {
        parameters.include = [
          {
            model: db.Customer,
            as: "customer",
            attributes: ["customername"],
          },
        ];
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        parameters["subQuery"] = false;
        if (Array.isArray(req.body.headers) && req.body.headers.length > 0) {
        req.body.headers.forEach((element) => {
          if (element.field === "customername") {
            searchparams["$customer.customername$"] = {
              $like: "%" + req.body.searchText + "%",
            };
          } else {
            searchparams[element.field] = {
              $like: "%" + req.body.searchText + "%",
            };
          }
        });
      }
        parameters.where["$or"] = searchparams;
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
      }
      parameters.where = _.omit(parameters.where, ["order"]);
      if (req.query.chart) {
        let query = queries.KPI_TICKET;
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
              "DATE_FORMAT(i.incidentdate,'%d-%M-%Y') AS x"
            );
          }
          if (req.body.duration == "Weekly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "CONCAT('Week ', 1 + DATE_FORMAT(i.incidentdate, '%U')) AS x"
            );
          }
          if (req.body.duration == "Monthly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(LAST_DAY(i.incidentdate),'%M-%Y') AS x"
            );
          }
        }

        if (Array.isArray(req.body.filters) && req.body.filters.length > 0) {
          for (let i = 0; i < req.body.filters.length; i++) {
            if (req.body.filters[i].customerid) {
              let customerids = _.map(
                req.body.filters[i].customerid,
                function (e) {
                  return e.value;
                }
              );
              subquery = subquery + ` AND i.customerid IN (${customerids})`;
            }
            if (req.body.filters[i].severity) {
              const severity = req.body.filters[i].severity.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND i.severity IN (${severity.join(",")})`;
            }
            if (req.body.filters[i].category) {
              const category = req.body.filters[i].category.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND i.category IN (${category.join(",")})`;
            }
            if (req.body.filters[i].publishyn) {
              const publishyn = req.body.filters[i].publishyn.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND i.publishyn IN (${publishyn.join(",")})`;
            }
            if (req.body.filters[i].incidentstatus) {
              const incidentstatus = req.body.filters[i].incidentstatus.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery +
                ` AND i.incidentstatus IN (${incidentstatus.join(",")})`;
            }
            if (i + 1 == req.body.filters.length) {
              query = query.replace(new RegExp(":subquery", "g"), subquery);
            }
          }
        }

        if (req.body.groupby) {
          query =
            query +
            ` GROUP BY x, i.${req.body.groupby} ORDER BY i.incidentdate ASC`;
        } else {
          query = query + ` GROUP BY x ORDER BY i.incidentdate ASC`;
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
        } else if (req.query.isdownload) {
          parameters.where = _.omit(req.body, ["headers", "order","startdate","enddate"]);
          CommonService.getAllList(parameters, db.Incident)
            .then((list) => {
              let template = {
                content: AssetListTemplate,
                engine: "handlebars",
                helpers: CommonHelper,
                recipe: "html-to-xlsx",
              };
              let data = { lists: list, headers: req.body.headers };
              DownloadService.generateFile(data, template, (result) => {
                customValidation.generateSuccessResponse(
                  result,
                  response,
                  constants.RESPONSE_TYPE_LIST,
                  res,
                  req
                );
              });
            })
            .catch((error: Error) => {
              customValidation.generateAppError(error, response, res, req);
            });
      } else {
        CommonService.getCountAndList(parameters, db.Incident)
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

  byId(req: Request, res: Response): void {
    let response = { reference: modules.INC };
    try {
      CommonService.getById(req.params.id, db.Incident)
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
    let response = { reference: modules.INC };
    try {
      servicenowService.createSNOWTicket(req.body).then((sdata) => {
        console.log("Servicenow ticket created");
        if (sdata) {
          req.body.snow_id = sdata.result.sys_id;
          req.body.incidentno = sdata.result.number;
          req.body.lastupdatedby = sdata.result.sys_updated_by;
          CommonService.create(req.body, db.Incident)
            .then((data) => {
              if (req.body.addCategory) {
                let obj = {
                  tenantid: -1,
                  lookupkey: constants.LOOKUPKEY[1],
                  keyname: req.body.category,
                  keydesc: "",
                  datatype: "string",
                  keyvalue: req.body.category,
                  status: constants.STATUS_ACTIVE,
                  createddt: req.body.createddt,
                  createdby: req.body.createdby,
                };
                CommonService.create(obj, db.LookUp);
              }
              try {
                CommonService.create(
                  {
                    resourcetypeid: data["id"],
                    resourcetype: constants.RESOURCETYPE[14],
                    _tenantid: data["tenantid"],
                    new: constants.HISTORYCOMMENTS[28],
                    affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                    status: constants.STATUS_ACTIVE,
                    createdby: data["createdby"],
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
        } else {
          customValidation.generateAppError(sdata, response, res, req);
        }
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = { reference: modules.INC };
    try {
      let condition = { id: req.body.id };
      CommonService.update(condition, req.body, db.Incident)
        .then((data) => {
          if (req.body.addCategory) {
            let obj = {
              tenantid: -1,
              lookupkey: constants.LOOKUPKEY[1],
              keyname: req.body.category,
              keydesc: "",
              datatype: "string",
              keyvalue: req.body.category,
              status: constants.STATUS_ACTIVE,
              createddt: req.body.lastupdateddt,
              createdby: req.body.lastupdatedby,
            };
            CommonService.create(obj, db.LookUp);
          }
          try {
            CommonService.create(
              {
                resourcetypeid: data["id"],
                resourcetype: constants.RESOURCETYPE[14],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[29],
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
  delete(req: Request, res: Response): void {
    let response = { reference: modules.INC };
    try {
      let condition = { id: req.params.id };
      CommonService.update(condition, { status: "Deleted" }, db.Incident)
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
export async function pagerduty(req: Request, res: Response) {
  let data = req.body;
  const a = data.alerts[0].labels.alertname;

  const alertid = data.commonLabels.id || data.commonLabels.alertname || a;
  const alert = await db.AlertConfigs.findById(alertid, {
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
      },
      {
        as: "customer",
        model: db.Customer,
        required: false,
        where: { status: constants.STATUS_ACTIVE },
      },
      {
        as: "account",
        model: db.CustomerAccount,
        required: false,
        where: { status: constants.STATUS_ACTIVE },
      },
    ],
  });
  const alertData = JSON.parse(JSON.stringify(alert));
  try{
    await  pagerDutyService.createIncident(req.body,alertData)
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
  catch (e) {
    customValidation.generateAppError(e, response, res, req);
  }
  }
export default new Controller();

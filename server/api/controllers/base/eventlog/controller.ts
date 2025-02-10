import * as IORedis from "ioredis";
import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import * as _ from "lodash";
import * as bullmq from "bullmq";
import { queries } from "../../../../common/query";
import { modules } from '../../../../common/module';
import LokiService from "../../../services/logging/loki.service";
import { Op } from "sequelize";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
import { AssetListTemplate } from "../../../../reports/templates";

export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    let response = { reference: modules.EVENTLOG };
    //#OP_768
    try {
      if (req.body.modules) {
        req.body.module = { $in: req.body.modules };
      }
      if (req.body.severities) {
        req.body.severity = { $in: req.body.severities };
      }

      req.body = _.omit(req.body, ['modules', 'severities']);

      let parameters = {
        where: req.body,
        order: [["createddt", "DESC"]],
      } as any;

      if (req.query.order && typeof req.query.order === "string") {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      }
      if (req.query.limit) {
        parameters["limit"] = req.query.limit;
      }
      if (req.query.offset) {
        parameters["offset"] = req.query.offset;
      }
      if (req.body.startdt && req.body.enddt) {
        parameters["where"]["eventdate"] = {
          $between: [req.body.startdt, req.body.enddt],
        };
        parameters["where"] = _.omit(req.body, ["startdt", "enddt"]);
      }
      if (req.body.eventtypes) {
        parameters["where"]["eventtype"] = {
          $in: req.body.eventtypes,
        };
        parameters["where"] = _.omit(req.body, ["eventtypes"]);
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["module"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["eventtype"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["severity"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, [
          "searchText",
          "headers",
        ]);
        parameters.where["$or"] = searchparams;
      }
      parameters.where = _.omit(parameters.where, ["order"]);
      if (req.query.chart) {
        let query = queries.KPI_MONITORING;
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
              "DATE_FORMAT(i.eventdate,'%d-%M-%Y') AS x"
            );
          }
          if (req.body.duration == "Weekly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "CONCAT('Week ', 1 + DATE_FORMAT(i.eventdate, '%U')) AS x"
            );
          }
          if (req.body.duration == "Monthly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(LAST_DAY(i.eventdate),'%M-%Y') AS x"
            );
          }
        }

        if (Array.isArray(req.body.filters) && req.body.filters.length > 0) {
          for (let i = 0; i < req.body.filters.length; i++) {
            if (req.body.filters[i]._customer) {
              let customerids = _.map(
                req.body.filters[i]._customer,
                function (e) {
                  return e.value;
                }
              );
              subquery =
                subquery +
                ` AND i._customer IN (${customerids})`;
            }
            if (req.body.filters[i].severity) {
              const severity = req.body.filters[i].severity.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery +
                ` AND i.severity IN (${severity.join(",")})`;
            }
            if (req.body.filters[i].referencetype) {
              const referencetype = req.body.filters[
                i
              ].referencetype.map((d) => `'${d.value}'`);
              subquery =
                subquery +
                ` AND i.referencetype IN (${referencetype.join(
                  ","
                )})`;
            } else {
              let referencetypes = [
                "System",
                "Security",
                "SSL",
                "Synthetics",
              ];
              subquery =
                subquery +
                ` AND i.referencetype IN (${referencetypes.map(
                  (e) => `'${e}'`
                )})`;
            }

            if (req.body.filters[i].level) {
              const levels = req.body.filters[i].level.map(
                (d) => `${d.value}`
              );
              subquery =
                subquery +
                ` AND tba.level IN (${levels.join(",")})`;
            }
            if (req.body.filters[i].metric) {
              const metric = req.body.filters[i].metric.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery +
                ` AND tba.metric IN (${metric.join(",")})`;
            }
            if (req.body.filters[i].tagvalue) {
              const tagvalues = req.body.filters[i].tagvalue.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery +
                ` AND i.providerrefid in (
                SELECT
                  tbtv.resourcerefid
                FROM
                  tbl_bs_tag_values tbtv
                WHERE
                tbtv.status = 'Active'
                 and tbtv.tagvalue in (${tagvalues.join(",")}) 
                    )`;
            }

            if (i + 1 == req.body.filters.length) {
              query = query.replace(
                new RegExp(":subquery", "g"),
                subquery
              );
            }
          }
        } else {
          let referencetypes = [
            "System",
            "Security",
            "SSL",
            "Synthetics",
          ];
          subquery =
            subquery +
            ` AND i.referencetype IN (${referencetypes.map(
              (e) => `'${e}'`
            )})`;
          query = query.replace(
            new RegExp(":subquery", "g"),
            subquery
          );
        }

        if (req.body.groupby) {
          if (
            req.body.groupby == "level" ||
            req.body.groupby == "metric"
          ) {
            query =
              query +
              ` GROUP BY x, tba.${req.body.groupby} ORDER BY i.eventdate ASC`;
          } else {
            query =
              query +
              ` GROUP BY x, i.${req.body.groupby} ORDER BY i.eventdate ASC`;
          }
        } else {
          query = query + ` GROUP BY x ORDER BY i.eventdate ASC`;
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
            customValidation.generateAppError(
              error,
              response,
              res,
              req
            );
          });
      } else {
        if (req.query.count) {
          CommonService.getCountAndList(parameters, db.eventlog)
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
              customValidation.generateAppError(
                error,
                response,
                res,
                req
              );
            });
          } else if (req.query.isdownload) {
            parameters.where = _.omit(req.body, ["headers", "order","enddt","startdt"]);
            CommonService.getAllList(parameters, db.eventlog)
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
          CommonService.getAllList(parameters, db.eventlog)
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
              customValidation.generateAppError(
                error,
                response,
                res,
                req
              );
            });
        }
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  byId(req: Request, res: Response): void {
    let response = { reference: modules.EVENTLOG };
    try {
      CommonService.getById(req.params.id, db.eventlog)
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
          customValidation.generateAppError(
            error,
            response,
            res,
            req
          );
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  create(req: Request, res: Response): void {
    let response = { reference: modules.EVENTLOG };
    try {
      CommonService.create(req.body, db.eventlog)
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
          customValidation.generateAppError(
            error,
            response,
            res,
            req
          );
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  getAlerts(req: Request, res: Response): void {
    let response = {} as any;
    try {
      console.log("Response from grafana>>>>>>>>>>>>>>>>");
      console.log("request", JSON.stringify(req.body));
      CommonService.create(
        {
          tenantid: 7,
          module: "Alert Config",
          referencetype: "Synthetic",
          eventdate: new Date(),
          notes: "Grafana alert testing",
          meta: JSON.stringify(req.body),
          createddt: new Date(),
          createdby: "SYSTEM",
          status: "Active",
        },
        db.eventlog
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
          customValidation.generateAppError(
            error,
            response,
            res,
            req
          );
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  storeEvents(req: Request, res: Response): void {
    let response = {} as any;
    try {
      // Eventlog - to be removed
      CommonService.create(
        {
          tenantid: 7,
          module: "AWS Watcher",
          referenceid: null,
          referencetype: "Lamda",
          eventtype: "job",
          eventdate: new Date(),
          severity: "Normal",
          notes: JSON.stringify(req.body),
          createddt: new Date(),
          createdby: "SYSTEM",
          status: "Active",
        },
        db.eventlog
      );
      CommonService.getData(
        {
          where: {
            keyvalue: req.headers.authorization,
            lookupkey: constants.LOOKUPKEYS.EC2_LAMBDA_KEY,
            status: constants.STATUS_ACTIVE,
          },
        },
        db.LookUp
      )
        .then((data) => {
          if (data) {
            const connection = new IORedis({
              host: process.env.APP_REDIS_HOST,
              password: process.env.APP_REDIS_PASS,
              port: parseInt(process.env.APP_REDIS_PORT),
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
            }).setMaxListeners(0);
            const queue = new bullmq.Queue(
              constants.EC2_EVENTS_QUEUE,
              {
                connection,
              }
            );
            queue.add(new Date().toDateString(), { ...req.body });
            LokiService.createLog(
              {
                message: "STORE EVENTS>>> DATA PUSHED TO QUEUE",
                data: { ...req.body },
              },
              "INFO"
            );
          }
          response.message = "Store Events>>> API : INITIATED";
          response.reference = "LAMBDA";
          customValidation.generateSuccessResponse(
            {},
            response,
            constants.RESPONSE_TYPE_CUSTOM,
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = { reference: modules.EVENTLOG };
    try {
      let condition = { id: req.body.id };
      CommonService.update(condition, req.body, db.eventlog)
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
          customValidation.generateAppError(
            error,
            response,
            res,
            req
          );
        });
    } catch (e) {
      console.log("Error in UPDATE >>>>>>>>>>>>>>>>>>>>>>");
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }
  delete(req: Request, res: Response): void {
    let response = { reference: modules.EVENTLOG };
    try {
      let condition = { id: req.params.id };
      CommonService.update(condition, { status: "Deleted" }, db.eventlog)
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
          customValidation.generateAppError(
            error,
            response,
            res,
            req
          );
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();

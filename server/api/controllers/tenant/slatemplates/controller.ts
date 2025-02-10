import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { Constants, constants } from "../../../../common/constants";
import * as _ from "lodash";
import { AppError } from "../../../../common/appError";
import { queries } from "../../../../common/query";
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";

export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body, include: [] };
      if (_.isUndefined(req.body.status)) {
        parameters["where"]["status"] = { $ne: "Deleted" };
      }
      if (_.includes(req.query.include, "slaparameters")) {
        parameters.include.push({
          model: db.Sla,
          as: "slaparameters",
        });
      }
      if (_.includes(req.query.include, "incidentsla")) {
        parameters.include.push({
          model: db.IncidentSla,
          as: "incidentsla",
        });
      }
      if (_.includes(req.query.include, "servicecredits")) {
        parameters.include.push({
          model: db.ServiceCredits,
          as: "servicecredits",
        });
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["slaname"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["notes"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      console.log('req')
      if (req.query.chart) {
        let query = queries.KPI_SLA;
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
              "DATE_FORMAT(tts.createddt,'%d-%M-%Y') AS x"
            );
          }
          if (req.body.duration == "Weekly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "CONCAT('Week ', 1 + DATE_FORMAT(tts.createddt, '%U')) AS x"
            );
          }
          if (req.body.duration == "Monthly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(LAST_DAY(tts.createddt),'%M-%Y') AS x"
            );
          }
        }

        if (Array.isArray(req.body.filters) && req.body.filters.length > 0) {
          for (let i = 0; i < req.body.filters.length; i++) {
            if (req.body.filters[i].customerid) {
              const customerid = req.body.filters[i].customerid.map((d) => `'${d.value}'`);
              subquery = subquery + ` AND ttc.customerid IN (${customerid.join(",")})`;
            }
            if (req.body.filters[i].slaname) {
              const slaname = req.body.filters[i].slaname.map((d) => `'${d.title}'`);
              subquery =
                subquery + ` AND tts.slaname IN (${slaname.join(",")})`;
            }
            if (i + 1 == req.body.filters.length) {
              query = query.replace(new RegExp(":subquery", "g"), subquery);
            }
          }
        }

        if (req.body.groupby) {
          query =
            query +
            ` GROUP BY x, ${req.body.groupby} ORDER BY tts.createddt ASC`;
        } else {
          query = query + ` GROUP BY x ORDER BY tts.createddt ASC`;
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
      } else if (req.query.count) {
        CommonService.getCountAndList(parameters, db.SlaTemplates)
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
      } else if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.SlaTemplates)
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
      } 
      else {
        CommonService.getAllList(parameters, db.SlaTemplates)
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
    let response = {};
    try {
      let parameters = {
        where: { id: req.params.id },
        include: [],
      } as any;
      if (_.includes(req.query.include, "slaparameters")) {
        parameters.include.push({
          model: db.Sla,
          as: "slaparameters",
        });
      }
      if (_.includes(req.query.include, "incidentsla")) {
        parameters.include.push({
          model: db.IncidentSla,
          as: "incidentsla",
        });
      }
      if (_.includes(req.query.include, "servicecredits")) {
        parameters.include.push({
          model: db.ServiceCredits,
          as: "servicecredits",
        });
      }

      CommonService.getData(parameters, db.SlaTemplates)
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
      let condition = {
        tenantid: req.body.tenantid,
        slaname: req.body.slaname,
        status: { $ne: "Deleted" },
      };
      console.log(req.body);
      CommonService.getOrSave(condition, req.body, db.SlaTemplates)
        .then((data) => {
          if (data != null && data[1] === false) {
            throw new AppError("Already exist, please enter another sla name");
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = {};
    try {
      let condition = { id: req.body.id };
      if (req.body.isParam) {
        let condition = { id: req.body.slatemplateid };
        CommonService.update(condition, req.body, db.SlaTemplates)
          .then((data) => {
            if (req.body.slaparameters) {
              let attributes = [
                "tenantid",
                "slatemplateid",
                "uptimeprcnt",
                "rpo",
                "rto",
                "notes",
                "status",
                "lastupdateddt",
                "lastupdatedby",
              ];
              CommonService.bulkUpdate(
                req.body.slaparameters,
                attributes,
                db.Sla
              );
            }
            if (req.body.incidentsla) {
              let attributes = [
                "tenantid",
                "slatemplateid",
                "priority",
                "responsetime",
                "resolutiontime",
                "notes",
                "status",
                "lastupdateddt",
                "lastupdatedby",
              ];
              CommonService.bulkUpdate(
                req.body.incidentsla,
                attributes,
                db.IncidentSla
              );
            }
            if (req.body.servicecredits) {
              let attributes = [
                "tenantid",
                "slatemplateid",
                "utmin",
                "utmax",
                "servicecredit",
                "notes",
                "status",
                "lastupdateddt",
                "lastupdatedby",
              ];
              CommonService.bulkUpdate(
                req.body.servicecredits,
                attributes,
                db.ServiceCredits
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
      } else {
        CommonService.update(condition, req.body, db.SlaTemplates)
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  delete(req: Request, res: Response): void {
    let response = {};
    try {
      let condition = { id: req.params.id };
      CommonService.update(condition, { status: "Deleted" }, db.SlaTemplates)
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

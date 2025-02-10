import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import * as _ from "lodash";
import { modules } from "../../../../common/module";
import sequelize = require("sequelize");
import { queries } from "../../../../common/query";
import { AppError } from "../../../../common/appError";
import commonService from "../../../services/common.service";
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";

export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    let response = { reference: modules.TAGS };
    try {
      let parameters: any = {
        where: req.body,
        include: [],
        order: [["lastupdateddt", "desc"]],
      };
      if (req.body.tagids) {
        parameters["where"]["tagid"] = { $in: req.body.tagids };
        parameters["where"] = _.omit(parameters["where"], ["tagids"]);
      }
      if (req.query.limit) parameters["limit"] = Number(req.query.limit);
      if (req.query.offset) parameters["offset"] = Number(req.query.offset);
      //#OP_B903
      if (req.body.searchText) {
        let searchparams: any = {};
            searchparams["tagname"] = {
              $like: "%" + req.body.searchText + "%",
            };
            searchparams["lastupdatedby"] = {
              $like: "%" + req.body.searchText + "%",
            };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      //#OP_B627
      if (req.query.order && typeof req.query.order === "string") {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      };
      parameters.where = _.omit(parameters.where, ["order"])
      if (req.query.assetcount) {
        CommonService.getCountAndList(parameters, db.Tags)
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
      } else if (req.query.chart) {
        let query = queries.KPI_TAGS;
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
              "DATE_FORMAT(tbt.createddt,'%d-%M-%Y') AS x"
            );
          }
          if (req.body.duration == "Weekly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "CONCAT('Week ', 1 + DATE_FORMAT(tbt.createddt, '%U')) AS x"
            );
          }
          if (req.body.duration == "Monthly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(LAST_DAY(tbt.createddt),'%M-%Y') AS x"
            );
          }
        }

        if (Array.isArray(req.body.filters) && req.body.filters.length > 0) {
          for (let i = 0; i < req.body.filters.length; i++) {
            if (req.body.filters[i].resource) {
              const resource = req.body.filters[i].resource.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND tbtv.resourcetype IN (${resource.join(",")})`;
            }
            if (req.body.filters[i].cloudprovider) {
              const cloudprovider = req.body.filters[i].cloudprovider.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND tbt.cloudprovider IN (${cloudprovider.join(",")})`;
            }
            if (req.body.filters[i].tagtype) {
              const tagtype = req.body.filters[i].tagtype.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND tbt.tagtype IN (${tagtype.join(",")})`;
            }
            if (i + 1 == req.body.filters.length) {
              query = query.replace(new RegExp(":subquery", "g"), subquery);
            }
          }
        }

        if (req.body.groupby) {
          query =
            query +
            ` GROUP BY x, ${req.body.groupby} ORDER BY tbt.createddt ASC`;
        } else {
          query = query + ` GROUP BY x ORDER BY tbt.createddt ASC`;
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
      } else  if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.Tags)
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
          CommonService.getAllList(parameters, db.Tags)
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
    let response = { reference: modules.TAGS };
    try {
      CommonService.getById(req.params.id, db.Tags)
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
    let response = { reference: modules.TAGS };
    try {
      let condition = {
        tenantid: req.body.tenantid,
        tagname: req.body.tagname,
        status: constants.STATUS_ACTIVE,
      }
      CommonService.getOrSave(condition, req.body, db.Tags)
        .then((data) => {
          if (data !== null && data[1] === false){
            throw new AppError(
              "Already exist, please enter another tag name"
            );
          }else{
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
    let response = { reference: modules.TAGS };
    try {
      let condition = { 
        tagid: req.body.tagid,
      };
      commonService.getData(
        {
        where: {
        tagname: req.body.tagname,
        tagid:  { $ne: req.body.tagid},
        tenantid: req.body.tenantid,
        status: constants.STATUS_ACTIVE,
      }
    }, db.Tags)
      .then((data)=> {
        if (data != null) {
          throw new AppError(
            "Already exist, please enter another tag name"
          );
        }else{
          CommonService.update(condition, req.body, db.Tags)
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
      })
      .catch((e) => {
        customValidation.generateAppError(e, response, res, req);
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();

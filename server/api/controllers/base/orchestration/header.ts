import { Request, Response } from "express";
import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { modules } from "../../../../common/module";
import * as _ from "lodash";
import DownloadService from "../../../services/download.service";
import { constants } from "../../../../common/constants";
import { SHTemplate } from "../../../../reports/templates";
import * as moment from "moment";
import { CommonHelper } from "../../../../reports";
import { customValidation } from "../../../../common/validation/customValidation";

export async function getHeaders(req: Request, res: Response) {
  let response = { reference: modules.ORCHESTATION_SCDL };
  try {
    let parameters: any = {
      where: req.body,
      order: [["lastupdateddt", "DESC"]],
      include: [
        {
          model: db.Orchestration,
          as: "orchestration",
          attributes: ["orchname"],
          required: false,
        }
      ]
    };
    if(req.query.recentorch){
      parameters["limit"] = 10; 
    }
    if (req.query.download) {
      parameters.include.push(
        {
          model: db.OrchestrationSchedule,
          as: "schedules",
          attributes: ["instances", "title"],
          required: false,
          include: [{
            model: db.OrchestrationLog,
            as: "logs",
            required: false
          }]
        })
    };
    let order = req.query.order as any
    if (order) {
      let splittedOrder = order.split(",");
      parameters["order"] = [splittedOrder];
      if(splittedOrder[0] == 'orchname'){
        parameters.order = [
          [{ model: db.Orchestration, as: "orchestration" }, "orchname", splittedOrder[1]],
        ];
      }
    };
    if (req.body.startdate && req.body.enddate) {
      parameters["where"]["createddt"] = {
        $between: [req.body.startdate, req.body.enddate],
      };
      parameters["where"] = _.omit(req.body, ["startdate", "enddate"]);
    }
    if (req.query.limit) {
      parameters["limit"] = Number(req.query.limit);
    }
    if (req.query.offset) {
      parameters["offset"] = Number(req.query.offset);
    }
    if (req.body.searchText) {
      let searchparams: any = {};
      searchparams["title"] = {
        $like: "%" + req.body.searchText + "%",
      };
      searchparams["$orchestration.orchname$"] = {
        $like: "%" + req.body.searchText + "%",
      };
      searchparams["status"] = {
        $like: "%" + req.body.searchText + "%",
      };
      parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
      parameters.where["$or"] = searchparams;
    }
    parameters.where = _.omit(parameters.where, ["order"]);

    CommonService.getCountAndList(parameters, db.OrchestrationScheduleHdr)
      .then((list) => {
        if (req.query.download) {
          let headerList = JSON.parse(JSON.stringify(list));
          let tableData = [];
          if (headerList && headerList.rows[0].schedules) {
            let reportData = [];
            for (let header of headerList.rows[0].schedules) {
              const lifecycle = JSON.parse(header.logs.lifecycle);
              let orchLifeCycle = [];
              for (const key in lifecycle) {
                if (key !== "total_nodes") {
                  if (Object.prototype.hasOwnProperty.call(lifecycle, key)) {
                    const value = lifecycle[key];
                    if (!tableData.includes(key.split("-###-").reverse()[0])) {
                      tableData.push(key.split("-###-").reverse()[0]);
                    }
                    orchLifeCycle.push({
                      title: key.split("-###-").reverse()[0],
                      status: value != null ? value["state"] : "",
                      timestamp: value != null ? value["timestamp"] : "",
                    });
                  }
                }
              }
              reportData.push({
                ...header.logs,
                title: header.title,
                instances: header.instances,
                params: JSON.parse(header.logs.params),
                lifecycle: orchLifeCycle,
                execution_start: moment(header.logs.execution_start).format("DD-MM-YYYY HH:mm:ss"),
                execution_end: moment(header.logs.execution_end).format("DD-MM-YYYY HH:mm:ss")
              });
              if (headerList.rows[0].schedules.length == reportData.length) {
                let input = {
                  list: reportData,
                  headers: tableData
                };
                let template = {
                  content: SHTemplate,
                  engine: "handlebars",
                  helpers: CommonHelper,
                  recipe: "html-to-xlsx",
                };
                DownloadService.generateFile(input, template, (result) => {
                  res.send({
                    data: { result, title: headerList.rows[0].title },
                  });
                });
              }
            }
          } else {
            customValidation.generateFailureResponse(
              response,
              constants.RESPONSE_TYPE_LIST,
              res,
              req
            );
          }
        } else {
          customValidation.generateSuccessResponse(
            list,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        }
      })
      .catch((error: Error) => {
        customValidation.generateAppError(error, response, res, req);
      });
  } catch (error) {
    customValidation.generateErrorMsg(
      error,
      res,
      constants.RESPONSE_TYPE_SAVE,
      req
    );
  }
}

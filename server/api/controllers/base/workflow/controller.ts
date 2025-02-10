import { constants } from "../../../../common/constants";
import { customValidation } from "../../../../common/validation/customValidation";
import db from "../../../models/model";
import CommonService from "../../../services/common.service";
import { Request, Response } from "express";
import * as _ from "lodash";
import { Op } from "sequelize";
import {AssetListTemplate} from "../../../../reports/templates";
import {CommonHelper} from "../../../../reports";
import DownloadService from "../../../services/download.service";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body } as any;
      parameters.order = [["lastupdateddt", "desc"]];
      if (_.includes(req.query.include, "approver")) {
        parameters.include.push({
          model: db.TNWorkFlowApprover,
          as: "tnapprovers",
        });
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["wrkflowname"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      if (req.body.module) {
        parameters.where["module"] = req.body.module;
      }
      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.TNWorkFlow)
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
      else if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers","module"]);
        CommonService.getAllList(parameters, db.TNWorkFlow)
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
      else{
        CommonService.getAllList(parameters, db.TNWorkFlow)
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

  async byId(req: any, res: Response): Promise<void> {
    let response = {};
    try {
      let query: any = {};
      query.where = {
        wrkflowid: req.params.id,
      };
      query.include = [
        {
          model: db.TNWorkFlowApprover,
          as: "tnapprovers",
          required: true,
          where: {
            reqid: { [Op.eq]: null }
          }
        },
      ];
      let data = await CommonService.getData(query, db.TNWorkFlow);
      if (data == null) {
        data = await CommonService.getById(req.params.id, db.TNWorkFlow);
      }
      customValidation.generateSuccessResponse(
        data,
        response,
        constants.RESPONSE_TYPE_LIST,
        res,
        req
      );
    } catch (error) {
      console.log(error);
      customValidation.generateAppError(error, response, res, req);
    }
  }

  create(req: Request, res: Response): void {
    let response = {};
    try {
      let query = {} as any;
      query.include = [{ model: db.TNWorkFlowApprover, as: "tnapprovers" }];
      CommonService.saveWithAssociation(req.body, query, db.TNWorkFlow)
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
    let response = {};
    try {
      let condition = { wrkflowid: req.body.wrkflowid };
      CommonService.update(condition, req.body, db.TNWorkFlow)
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

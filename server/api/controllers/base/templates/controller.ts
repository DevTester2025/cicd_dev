import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import { modules } from "../../../../common/module";
import _ = require("lodash");
import { messages } from "../../../../common/messages";
import mjml2html = require("mjml");

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.TEMPLATES };
    try {
      let parameters = {
        where: req.body,
        order: [["lastupdateddt", "desc"]],
      } as any;
      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.Templates)
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
        CommonService.getAllList(parameters, db.Templates)
          .then((list) => {
            console.log(list, "listlist");
            const templates = list.map((item: any) => item.dataValues);

            const processedTemplates = templates.map((template: any) => {
              const mjmlContent = template.template;
              let htmlContent = "";
              try {
                htmlContent = mjml2html(mjmlContent).html;
              } catch (error) {
                console.error("Error converting MJML to HTML:", error);
              }
              return { ...template, html: htmlContent };
            });

            console.log(processedTemplates, "templateteamplate");
            customValidation.generateSuccessResponse(
              processedTemplates,
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
    let response = { reference: modules.TEMPLATES };
    try {
      CommonService.getById(req.params.id, db.Templates)
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
    let response = { reference: modules.TEMPLATES };
    try {
      let condition = {
        tenantid: req.body.tenantid,
        status: constants.STATUS_ACTIVE,
      } as any;
      CommonService.getOrSave(condition, req.body, db.Templates)
        .then((data) => {
          if (data != null && data[1] === false) {
            customValidation.generateErrorMsg(
              messages.TEMPLATE_EXIST,
              res,
              201,
              req
            );
          } else if (data) {
            customValidation.generateSuccessResponse(
              data,
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
    let response = { reference: modules.TEMPLATES };
    try {
      let condition = { tenantid: req.body.tenantid };
      CommonService.update(condition, req.body, db.Templates)
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

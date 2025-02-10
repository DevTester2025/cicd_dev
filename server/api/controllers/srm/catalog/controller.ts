import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import NotificationService from "../../../services/notification.service";
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      parameters.include = [
        {
          model: db.Solutions,
          as: "solution",
          attributes: ["solutionname", "cloudprovider"],
          include: [
            {
              as: "zone",
              model: db.ecl2zones,
              required: false,
              attributes: ["zonename"],
            },
          ],
        },
        { model: db.LookUp, as: "group", attributes: ["keyvalue"] },
      ];
      if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.srmcatalog)
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
            console.log("Error fetching list", error);
            customValidation.generateAppError(error, response, res, req);
          });
      }
      else{
        CommonService.getAllList(parameters, db.srmcatalog)
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
      let query = {} as any;
      query.where = {
        catalogid: req.params.id,
      };
      query.include = [
        { model: db.Solutions, as: "solution" },
        { model: db.TNWorkFlow, as: "workflow" },
        { model: db.LookUp, as: "group" },
        {
          model: db.srmcatalogaprvr,
          as: "srmcatalogaprvr",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          include: [
            {
              model: db.User,
              as: "approver",
              required: false,
              paranoid: false,
              attributes: ["fullname", "email", "userid"],
            },
          ],
        },
      ];
      CommonService.getData(query, db.srmcatalog)
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

  create(req: any, res: Response): void {
    let response = {};
    try {
      let options = {} as any;
      options = {
        include: [
          // { model: db.srmsr, as: 'servicerequest' }
        ],
      };
      let request = {} as any;
      if (!customValidation.isEmptyValue(req.body.formData)) {
        request = JSON.parse(req.body.formData);
      }

      if (!customValidation.isEmptyValue(req.files.serviceimgfile)) {
        let filename = _.get(req.files.serviceimgfile, "name");
        request.catalogimage = filename;
        CommonService.fileUpload(
          req.files.serviceimgfile.path,
          constants.FILEUPLOADPATH.SERVICE_IMG + filename
        );
      }
      if (!customValidation.isEmptyValue(req.files.olaimgfile)) {
        let filename = _.get(req.files.olaimgfile, "name");
        request.catalogola = filename;
        CommonService.fileUpload(
          req.files.olaimgfile.path,
          constants.FILEUPLOADPATH.OLA_IMG + filename
        );
      }
      if (!customValidation.isEmptyValue(req.files.archictectureimgfile)) {
        let filename = _.get(req.files.archictectureimgfile, "name");
        request.archdiagram = filename;
        CommonService.fileUpload(
          req.files.archictectureimgfile.path,
          constants.FILEUPLOADPATH.ARCH_IMG +
            req.files.archictectureimgfile.name
        );
      }
      if (request.approvalyn === "Y") {
        options.include.push({
          model: db.srmcatalogaprvr,
          as: "srmcatalogaprvr",
        });
      }
      CommonService.saveWithAssociation(request, options, db.srmcatalog)
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

  update(req: any, res: Response): void {
    let response = {};
    try {
      let request = {} as any;
      if (!customValidation.isEmptyValue(req.body.formData)) {
        request = JSON.parse(req.body.formData);
      }
      if (!customValidation.isEmptyValue(req.files.serviceimgfile)) {
        let filename = _.get(req.files.serviceimgfile, "name");
        request.catalogimage = filename;
        CommonService.fileUpload(
          req.files.serviceimgfile.path,
          constants.FILEUPLOADPATH.SERVICE_IMG + filename
        );
      }
      if (!customValidation.isEmptyValue(req.files.olaimgfile)) {
        let filename = _.get(req.files.olaimgfile, "name");
        request.catalogola = filename;
        CommonService.fileUpload(
          req.files.olaimgfile.path,
          constants.FILEUPLOADPATH.OLA_IMG + filename
        );
      }
      if (!customValidation.isEmptyValue(req.files.archictectureimgfile)) {
        let filename = _.get(req.files.archictectureimgfile, "name");
        request.archdiagram = filename;
        CommonService.fileUpload(
          req.files.archictectureimgfile.path,
          constants.FILEUPLOADPATH.ARCH_IMG +
            req.files.archictectureimgfile.name
        );
      }
      let condition = { catalogid: request.catalogid };
      CommonService.update(condition, request, db.srmcatalog)
        .then((data: any) => {
          if (!customValidation.isEmptyValue(request.srmcatalogaprvr)) {
            let attributes = [
              "catalogid",
              "userid",
              "approverlevel",
              "status",
              "lastupdatedby",
              "lastupdateddt",
            ];
            CommonService.bulkUpdate(
              request.srmcatalogaprvr,
              attributes,
              db.srmcatalogaprvr
            )
              .then((data) => {})
              .catch((error: Error) => {
                customValidation.generateAppError(error, response, res, req);
              });
          }
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_UPDATE,
            res,
            req
          );
          let event;
          if (request.publishstatus == constants.NOTIFICATION_EVENTS[6]) {
            event = constants.NOTIFICATION_EVENTS[6];
          } else if (
            request.publishstatus == constants.NOTIFICATION_EVENTS[7]
          ) {
            event = constants.NOTIFICATION_EVENTS[7];
          } else {
            event = constants.NOTIFICATION_EVENTS[8];
          }
          // if (event) {
          //   CommonService.getData(
          //     { where: { solutionid: data.solutionid } },
          //     db.Solutions
          //   ).then((solution: any) => {
          //     let condition = {
          //       module: constants.NOTIFICATION_MODULES[5],
          //       event: event,
          //       tenantid: request.tenantid,
          //       status: constants.STATUS_ACTIVE,
          //     } as any;
          //     let dateFormat = constants.MOMENT_FORMAT[1];
          //     let mapObj = {
          //       "{{catalog_name}}": solution.solutionname,
          //       "{{catelogid}}": solution.solutionid,
          //       "{{published_by}}": data.lastupdatedby,
          //       "{{published_dt}}": CommonService.formatDate(
          //         new Date(data.publishdate),
          //         dateFormat,
          //         false
          //       ),
          //       "{{unpublished_by}}": data.lastupdatedby,
          //       "{{unpublished_dt}}": CommonService.formatDate(
          //         new Date(data.lastupdateddt),
          //         dateFormat,
          //         false
          //       ),
          //       "{{changed_by}}": data.lastupdatedby,
          //       "{{changed_dt}}": CommonService.formatDate(
          //         new Date(data.lastupdateddt),
          //         dateFormat,
          //         false
          //       ),
          //     };
          //     NotificationService.getNotificationSetup(
          //       condition,
          //       mapObj,
          //       "CM - Catalog Created",
          //       "Catalog Created"
          //     );
          //   });
          // }
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

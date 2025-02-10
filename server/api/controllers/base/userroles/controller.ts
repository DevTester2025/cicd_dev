import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { constants } from "../../../../common/constants";
import NotificationService from "../../../services/notification.service";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import _ = require("lodash");
import { modules } from "../../../../common/module";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
import { AssetListTemplate } from "../../../../reports/templates";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.USER_ROLE };
    try {
      if (!customValidation.isEmptyValue(req.body.tenantList)) {
        req.body.tenantid = { $in: req.body.tenantList };
        req.body = _.omit(req.body, "tenantList");
      }
      let parameters = {} as any;
      parameters = { where: req.body };
      // order: [["lastupdateddt", "desc"]] };
      // parameters.include = [{
      //     model: db.RoleAccess, as: 'roleaccess', include: [{
      //         model: db.ScreenActions, as: 'screenactions'
      //     }]
      // }];
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

      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["rolename"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["createdby"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["createddt"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      parameters.where = _.omit(parameters.where, ["order"]);
      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.UserRoles)
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
        CommonService.getAllList(parameters, db.UserRoles)
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
        CommonService.getAllList(parameters, db.UserRoles)
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
    let response = { reference: modules.USER_ROLE };
    try {
      let parameters = {} as any;
      parameters.where = { roleid: req.params.id };
      parameters.include = [
        {
          model: db.RoleAccess,
          as: "roleaccess",
          // include: [{
          //     model: db.ScreenActions, as: 'screenactions',
          //     include: [{ model: db.Screens, as: 'screens' }]
          // },
          //     { model: db.Screens, as: 'screens' }
          // ]
        },
      ];
      CommonService.getData(parameters, db.UserRoles)
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
    let response = { reference: modules.USER_ROLE };
    try {
      let query = {} as any;
      query.include = [{ model: db.RoleAccess, as: "roleaccess" }];
      CommonService.saveWithAssociation(req.body, query, db.UserRoles)
        .then(async (data: any) => {
          try {
            await CommonService.create(
              {
                resourcetypeid: data["roleid"],
                resourcetype: constants.RESOURCETYPE[4],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[8],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: data["createdby"],
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          } catch (error) {
            console.log("Failed to create history", error);
          }
          if (!customValidation.isEmptyValue(data.roleaccess)) {
            let access: any;
            access = _.map(data.roleaccess, function (obj: any) {
              return obj.accessid;
            });
            let condition = { roleid: data.roleid };
            req.body.accessid = access;
            CommonService.update(condition, req.body, db.UserRoles).then(
              (roledata) => {
                customValidation.generateSuccessResponse(
                  roledata,
                  response,
                  constants.RESPONSE_TYPE_SAVE,
                  res,
                  req
                );
                let condition = {
                  module: constants.NOTIFICATION_MODULES[1],
                  event: constants.NOTIFICATION_EVENTS[0],
                  tenantid: req.body.tenantid,
                  status: constants.STATUS_ACTIVE,
                } as any;
                let dateFormat = constants.MOMENT_FORMAT[1];
                let mapObj = {
                  "{{role_name}}": data.rolename,
                  "{{roleid}}": data.roleid,
                  "{{created_by}}": data.createdby,
                  "{{created_dt}}": CommonService.formatDate(
                    new Date(data.createddt),
                    dateFormat,
                    false
                  ),
                };
                NotificationService.getNotificationSetup(
                  condition,
                  mapObj,
                  "CM - Role Created",
                  "Role Created"
                );
              }
            );
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
      } catch (e) {
        customValidation.generateAppError(e, response, res, req);
      }
      // CommonService.getOrSave({ rolename: req.body.rolename }, req.body, db.UserRoles, '').then((data) => {
      //     if (data != null && data[1] === false) {
      //         customValidation.generateErrorMsg(messages.ROLE_EXIST, res, 201, req);
      //     } else if (data != null) {
      //         customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
      //     }
      // }).catch((error: Error) => {
      //     customValidation.generateAppError(error, response, res, req);
      // });
  }

  update(req: Request, res: Response): void {
    let response = { reference: modules.USER_ROLE };
    try {
      let condition = { roleid: req.body.roleid };
      CommonService.update(condition, req.body, db.UserRoles)
        .then(async (data: any) => {
          try {
            await CommonService.create(
              {
                resourcetypeid: data["roleid"],
                resourcetype: constants.RESOURCETYPE[4],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[9],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: data["lastupdatedby"],
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          } catch (error) {
            console.log("Failed to update history", error);
          }
          if (!customValidation.isEmptyValue(req.body.roleaccess)) {
            let updateattribute = [
              "screenid",
              "roleid",
              "actions",
              "status",
              "lastupdatedby",
              "lastupdateddt",
            ];
            CommonService.bulkUpdate(
              req.body.roleaccess,
              updateattribute,
              db.RoleAccess
            ).then((roledata) => {
              customValidation.generateSuccessResponse(
                data,
                response,
                constants.RESPONSE_TYPE_UPDATE,
                res,
                req
              );
            });
          } else {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
          }
          let event =
            req.body.status == constants.DELETE_STATUS
              ? constants.NOTIFICATION_EVENTS[2]
              : constants.NOTIFICATION_EVENTS[3];
          let condition = {
            module: constants.NOTIFICATION_MODULES[1],
            event: event,
            tenantid: req.body.tenantid,
            status: constants.STATUS_ACTIVE,
          } as any;
          let dateFormat = constants.MOMENT_FORMAT[1];
          let mapObj = {
            "{{role_name}}": data.rolename,
            "{{roleid}}": data.roleid,
            "{{updated_by}}": data.lastupdatedby,
            "{{updated_dt}}": CommonService.formatDate(
              new Date(data.lastupdateddt),
              dateFormat,
              false
            ),
            "{{deleted_by}}": data.lastupdatedby,
            "{{deleted_dt}}": CommonService.formatDate(
              new Date(data.lastupdateddt),
              dateFormat,
              false
            ),
          };
          NotificationService.getNotificationSetup(
            condition,
            mapObj,
            "CM - Role Updated",
            "Role Updated"
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

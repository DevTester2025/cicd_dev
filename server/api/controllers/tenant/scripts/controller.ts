import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response, query } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import { AppError } from "../../../../common/appError";
let fs = require("fs");
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
import { AssetListTemplate } from "../../../../reports/templates";
import commonService from "../../../services/common.service";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
    let params = {} as any;
    try {
      if (customValidation.isEmptyValue(req.body.status)) {
        req.body.status = { $ne: "Deleted" };
      }
      if (!customValidation.isEmptyValue(req.body.scriptlist)) {
        req.body.scriptid = { $in: req.body.scriptlist };
        req.body = _.omit(req.body, "scriptlist");
      }
      let parameters = {
        where: req.body,
        order: [["lastupdateddt", "desc"]],
        include: [
          {
            model: db.CustomField,
            as: "parameters",
            where: { status: "Active" },
            paranoid: false,
            required: false,
          },
        ],
      } as any;
      if (req.query.order && typeof req.query.order === "string") {
        let splittedOrder = req.query.order.split(",");
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
        searchparams["scriptname"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["scripttype"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      parameters.where = _.omit(parameters.where, ["order"]);

      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.Scripts)
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
          CommonService.getAllList(parameters, db.Scripts)
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
        CommonService.getAllList(parameters, db.Scripts)
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
      CommonService.getById(req.params.id, db.Scripts)
        .then((data) => {
          if (req.query.download) {
            CommonService.readS3File("Scripts/" + data.filename)
              .then((d) => {
                customValidation.generateSuccessResponse(
                { content: d, filename: data.filename },
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
            customValidation.generateSuccessResponse(
              data,
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  create(req: any, res: Response): void {
    let response = {};
    try {
      let request = {} as any;
      if (!customValidation.isEmptyValue(req.body.formData)) {
        request = JSON.parse(req.body.formData);
      }
      let condition = {
        tenantid: request.tenantid,
        scriptname: request.scriptname,
        status: constants.STATUS_ACTIVE,
      };
      let filename = "";
      if (!customValidation.isEmptyValue(req.files.file)) {
        filename =
          request["scriptname"] + "." + _.get(req.files.file, "extension");
        request.filename = filename;
      }
      CommonService.getOrSave(condition, request, db.Scripts)
        .then((data) => {
          if (data[1] === false) {
            throw new AppError(
              "Already exist, please enter another script name"
            );
          } else {
            if (filename != "") {
              CommonService.uploadFiletoS3(
                req.files.file.path,
                "Scripts/" + request.filename
              );
            }
          try {
            commonService.create(
              {
                resourcetypeid: data[0].dataValues["scriptid"],
                resourcetype: constants.RESOURCETYPE[12],
                _tenantid: data[0].dataValues["tenantid"],
                new: constants.HISTORYCOMMENTS[24],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: data[0].dataValues["createdby"],
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          }catch(error) {
                console.log(`Failed to updating history`, error)
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
      // if (!_.isEmpty(req.files) && !_.isEmpty(req.files.file)) {
      //     fs.readFile(req.files.file.path, function (err, data) {
      //         let filename = constants.SCRIPTFILEPATH + req.files.file.originalname;
      //         fs.writeFile(filename, data, function (err) {
      //             if (err) {
      //                 console.error(err);
      //                 customValidation.generateAppError(err, response, res, req);
      //             } else {
      //                 console.info('File Uploaded Successfully');
      //                 let file = req.files.file.originalname.split('.');
      //                 request.filename = new Date() + '.' + file[1];

      //             }
      //         });
      //     });
      // } else {
      //     CommonService.create(request, db.Scripts).then((data) => {
      //         customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
      //     }).catch((error: Error) => {
      //         customValidation.generateAppError(error, response, res, req);
      //     });
      // }
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
      let condition = { scriptid: request.scriptid };
      let filename = "";
      if (!customValidation.isEmptyValue(req.files.file)) {
        filename =
          request["scriptname"] + "." + _.get(req.files.file, "extension");
        request.filename = filename;
      }
      CommonService.getData(
        {
          where: {
            scriptname: request.scriptname,
            scriptid: { $ne: request.scriptid },
            tenantid: request.tenantid,
            status: constants.STATUS_ACTIVE,
          },
        },
        db.Scripts
      )
        .then((data) => {
          if (data) {
            throw new AppError(
              "Already exist, please enter another script name"
            );
          } else {
            if (filename != "") {
              CommonService.uploadFiletoS3(
                req.files.file.path,
                "Scripts/" + request.filename 
              );
            }
            CommonService.update(condition, request, db.Scripts)
              .then((data) => {
                try {
                  commonService.create(
                    {
                      resourcetypeid: data["scriptid"],
                      resourcetype: constants.RESOURCETYPE[12],
                      _tenantid: data["tenantid"],
                      new: constants.HISTORYCOMMENTS[25],
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
                      console.log(`Failed to updating history`, error)
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
        })
        .catch((e) => {
          customValidation.generateAppError(e, response, res, req);
        });
      // if (!_.isEmpty(req.files) && !_.isEmpty(req.files.file)) {
      //     fs.readFile(req.files.file.path, function (err, data) {
      //         let filename = constants.SCRIPTFILEPATH + req.files.file.originalname;
      //         fs.writeFile(filename, data, function (err) {
      //             if (err) {
      //                 console.error(err);
      //                 customValidation.generateAppError(err, response, res, req);
      //             } else {
      //                 console.info('File Uploaded Successfully');
      //                 let file = req.files.file.originalname.split('.');
      //                 request.filename = new Date() + '.' + file[1];
      //                 CommonService.update(condition, request, db.Scripts).then((data) => {
      //                     customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_UPDATE, res, req);
      //                 }).catch((error: Error) => {
      //                     customValidation.generateAppError(error, response, res, req);
      //                 });
      //             }
      //         });
      //     });
      // } else {
      //     CommonService.update(condition, request, db.Scripts).then((data) => {
      //         customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_UPDATE, res, req);
      //     }).catch((error: Error) => {
      //         customValidation.generateAppError(error, response, res, req);
      //     });
      // }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();

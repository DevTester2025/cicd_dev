import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import sequelize = require("sequelize");
import { modules } from "../../../../common/module";
import _ = require("lodash");
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.TAG_GROUP };
    try {
      let parameters: any = {
        where: req.body,
        order: [["lastupdateddt", "desc"]],
        include: [
          {
            model: db.TagValues,
            as: "tagvalues",
            paranoid: true,
            required: false,
            where: { status: "Active", resourcetype: "Group" },
            include: [
              { model: db.Tags, as: "tag", paranoid: false, required: false },
            ],
          },
        ],
      };
      //#OP_B627
      if (req.query.limit) parameters["limit"] = Number(req.query.limit);
      if (req.query.offset) parameters["offset"] = Number(req.query.offset);
      //#OP_B903
      if (req.body.searchText) {
        let searchparams: any = {};
            searchparams["groupname"] = {
              $like: "%" + req.body.searchText + "%",
            };
            searchparams["lastupdatedby"] = {
              $like: "%" + req.body.searchText + "%",
            };

        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      if (req.query.order as any) {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      };
      parameters.where = _.omit(parameters.where, ["order"])
      parameters.distinct = true; 
      if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.TagGroup)
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
        CommonService.getCountAndList(parameters, db.TagGroup)
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
    let response = { reference: modules.TAG_GROUP };
    try {
      let parameters = {} as any;
      parameters.where = { taggroupid: req.params.id };
      parameters.include = [
        {
          model: db.TagValues,
          as: "tagvalues",
          paranoid: true,
          required: false,
          where: { status: "Active", resourcetype: "Group" },
          include: [
            { model: db.Tags, as: "tag", paranoid: false, required: false },
          ],
        },
      ];
      CommonService.getData(parameters, db.TagGroup)
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
    let response = { reference: modules.TAG_GROUP };
    try {
      let query = {} as any;
      query.include = [{ model: db.TagValues, as: "tagvalues" }];
      CommonService.saveWithAssociation(req.body, query, db.TagGroup)
        .then((tgdata) => {
          let taggroupid = tgdata.dataValues.taggroupid;

          CommonService.getAllList(
            {
              where: {
                lookupkey: constants.LOOKUPKEYS.TAG_GROUP_STRUCTURE,
                tenantid: req.body.tenantid,
                status: "Active",
              },
            },
            db.LookUp
          )
            .then((data) => {
              if (data != null && data.length > 0) {
                let structure = data[0]["dataValues"]["keyvalue"];

                let formattedStructure =
                  structure != null ? JSON.parse(structure) : null;

                if (formattedStructure == null) {
                  CommonService.update(
                    { lookupid: data[0]["dataValues"]["lookupid"] },
                    {
                      keyvalue: JSON.stringify([
                        {
                          name: tgdata.dataValues.groupname,
                          id: taggroupid,
                        },
                      ]),
                    },
                    db.LookUp
                  );
                } else {
                  let struct = formattedStructure;
                  struct.push({
                    name: tgdata.dataValues.groupname,
                    id: taggroupid,
                  });

                  CommonService.update(
                    { lookupid: data[0]["dataValues"]["lookupid"] },
                    {
                      keyvalue: JSON.stringify(struct),
                    },
                    db.LookUp
                  );
                }
              } else {
                CommonService.create(
                  {
                    lookupkey: constants.LOOKUPKEYS.TAG_GROUP_STRUCTURE,
                    tenantid: req.body.tenantid,
                    status: "Active",
                    keyvalue: JSON.stringify([
                      {
                        name: tgdata.dataValues.groupname,
                        id: taggroupid,
                      },
                    ]),
                    createddt: new Date(),
                    createdby: "SYSTEM",
                  },
                  db.LookUp
                );
              }
              // customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
            })
            .catch((error: Error) => {
              console.log("ERROR::::::::::::::");
              console.log(error);
              // customValidation.generateAppError(error, response, res, req);
            });

          customValidation.generateSuccessResponse(
            tgdata,
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
    let response = { reference: modules.TAG_GROUP };
    try {
      let condition = { taggroupid: req.body.taggroupid };
      CommonService.update(condition, req.body, db.TagGroup)
        .then((data) => {
          if (req.body.tagvalues) {
            let updateattributes = [
              "cloudprovider",
              "tenantid",
              "category",
              "resourcetype",
              "resourceid",
              "tagid",
              "tagvalue",
              "tagorder",
              "status",
              "createdby",
              "createddt",
              "lastupdatedby",
              "lastupdateddt",
            ];
            CommonService.bulkUpdate(
              req.body.tagvalues,
              updateattributes,
              db.TagValues
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

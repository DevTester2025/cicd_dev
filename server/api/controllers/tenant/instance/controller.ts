import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import sequelize = require("sequelize");
import { queries } from "../../../../common/query";
import * as _ from "lodash";
import { AssetListTemplate } from "../../../../reports/templates";
import DownloadService from "../../../services/download.service";
import { CommonHelper } from "../../../../reports";

export class Controller {
  constructor() { }
  all(req: any, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body } as any;
      if (req.query.limit) {
        parameters["limit"] = req.query.limit;
      }
      if (req.query.offset) {
        parameters["offset"] = req.query.offset;
      }
      if (req.query.acntData) {
        parameters.include = [
          {
            model: db.CustomerAccount,
            as: "accountdata",
            required: true,
            attributes: ["name", "accountref"]
          },
        ];
      }
      if (req.body.tagid && req.body.tagvalue) {
        parameters.include = [
          {
            model: db.TagValues,
            as: "tagvalues",
            paranoid: true,
            required: true,
            where: {
              resourcetype: "ASSET_INSTANCE",
              status: constants.STATUS_ACTIVE,
              tagid: { $ne: null },
              tagvalue: { $in: req.body.tagvalue },
            },
            include: [
              {
                model: db.Tags,
                as: "tag",
              },
            ],
          },
        ];
        delete parameters.where["tagvalue"];
        delete parameters.where["tagid"];
      }
      if (req.body.attributes) {
        parameters.attributes = [...req.body.attributes];
        parameters.where = _.omit(parameters.where, ["attributes"]);
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["instancename"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["instancerefid"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["platform"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      let headers = [];
      if (req.body.headers) {
        headers = req.body.headers;
        parameters["where"] = _.omit(parameters["where"], ["headers"]);
      }
      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.Instances)
          .then((list) => {
            if (req.query.isdownload) {
              let template = {
                content: AssetListTemplate,
                engine: "handlebars",
                helpers: CommonHelper,
                recipe: "html-to-xlsx",
              };
              let result = _.map(list, (itm) => {
                itm = _.merge(itm, JSON.parse(itm.ssmagent));
                return itm;
              });
              let d = { lists: result, headers: req.body.headers };
              DownloadService.generateFile(d, template, (result) => {
                res.send({
                  data: result,
                });
              });
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
      } else {
        CommonService.getAllList(parameters, db.Instances)
          .then((list) => {
            if (req.query.isdownload) {
              let template = {
                content: AssetListTemplate,
                engine: "handlebars",
                helpers: CommonHelper,
                recipe: "html-to-xlsx",
              };
              let d = { lists: list, headers: req.body.headers };
              DownloadService.generateFile(d, template, (result) => {
                res.send({
                  data: result,
                });
              });
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
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  byId(req: Request, res: Response): void {
    let response = {};
    try {
      let parameters = {} as any;
      parameters.where = { instanceid: req.params.id };
      parameters.include = [
        {
          model: db.ecl2images,
          as: "image",
          attributes: ["imageid", "imagename", "region"],
          required: false,
          paranoid: false,
          where: { "$Instances.cloudprovider$": constants.CLOUD_ECL },
        },
        {
          model: db.awsami,
          as: "awsimage",
          attributes: ["amiid", "awsamiid", "aminame"],
          required: false,
          paranoid: false,
          where: { "$Instances.cloudprovider$": constants.CLOUD_AWS },
        },
        {
          model: db.CostVisual,
          as: "costvisual",
          attributes: [
            "costvisualid",
            "cloudprovider",
            "region",
            "resourcetype",
            "plantype",
            "unit",
            "priceperunit",
            "image",
            "currency",
            "pricingmodel",
          ],
          required: false,
          paranoid: false,
          where: {
            status: constants.STATUS_ACTIVE,
            cloudprovider: { $col: "Instances.cloudprovider" },
            plantype: { $col: "Instances.instancetyperefid" },
            region: { $col: "Instances.region" },
          },
        },
        {
          model: db.Customer,
          as: "customer",
          required: false,
          attributes: [
            "customername",
            "ecl2tenantid",
            "awsaccountid",
            "ecl2region",
            "awsregion",
          ],
          include: [
            { model: db.Tenant, as: "tenant", attributes: ["tenantname"] },
          ],
        },
      ];
      if (req.query.asstdtls) {
        parameters.include = [];
        parameters.include = [
          {
            model: db.Customer,
            as: "customer",
            attributes: [
              "customername",
              "ecl2tenantid",
              "awsaccountid",
              "ecl2region",
              "awsregion",
            ],
            // include: [
            //   { model: db.Tenant, as: "tenant", attributes: ["tenantname"] },
            // ],
          },
        ];
        let resourcetype =
          req.query.cloudprovider &&
            (req.query.cloudprovider != constants.CLOUDPROVIDERS[0])
            ? constants.RESOURCE_TYPES[15]
            : constants.RESOURCE_TYPES[0];

        if (req.query.cloudprovider == "ECL2") {
          parameters.include.push(
            {
              model: db.ecl2zones,
              as: "ecl2zones",
              attributes: ["zonename"],
            },
            {
              model: db.ecl2images,
              as: "image",
              attributes: ["imagename", "ecl2imageid", "platform", "notes"],
            },
            {
              model: db.ecl2instancetype,
              as: "instance",
              attributes: ["vcpu", "memory"],
            },
            {
              model: db.ecl2volumeattachment,
              as: "ecl2attachedvolumes",
              required: false,
              where: { status: "Active" },
              attributes: ["instanceid", "volumeid"],
              include: [
                {
                  model: db.ecl2volumes,
                  required: false,
                  as: "volume",
                  where: { status: "Active" },
                },
              ],
            }
          );
        }
        if (req.query.cloudprovider == "AWS") {
          parameters.include.push(
            {
              model: db.awszones,
              as: "awszones",
              attributes: ["zonename"],
            },
            {
              model: db.awsami,
              as: "awsimage",
              attributes: ["aminame", "awsamiid", "platform", "notes"],
            },
            {
              model: db.awsinsttype,
              as: "awsinstance",
              attributes: ["vcpu", "memory"],
            },
            {
              model: db.awsvolumeattachment,
              as: "attachedvolumes",
              required: false,
              where: { status: "Active" },
              attributes: ["instanceid", "volumeid"],
              include: [
                {
                  model: db.awsvolumes,
                  as: "volume",
                  attributes: [
                    "volumeid",
                    "volumetype",
                    "awsvolumeid",
                    "sizeingb",
                    "encryptedyn",
                    "notes",
                  ],
                  required: false,
                  where: { status: "Active" },
                },
              ],
            }
            // {
            //   model: db.awssg,
            //   as: "awssgs",
            //   required: false,
            //   attributes: ["securitygroupid", "tenantid", "securitygroupname", "awssecuritygroupid", "vpcid", "notes", "tnregionid"],
            //   paranoid: false,
            //   include: [
            //     {
            //       model: db.awssgrules,
            //       as: "awssgrules",
            //       attributes: ["type", "protocol", "portrange", "sourcetype", "source"],
            //       required: false,
            //       paranoid: false,
            //     },
            //   ],
            // }
          );
        }
        if (req.query.tagyn) {
          let tagModel = {
            model: db.TagValues,
            as: "tagvalues",
            paranoid: false,
            required: false,
            where: {
              cloudprovider: req.query.cloudprovider,
              resourcetype: resourcetype,
              status: constants.STATUS_ACTIVE,
              tagid: { $ne: null },
            },
            include: [
              {
                model: db.Tags,
                as: "tag",
                required: false,
              },
            ],
          };
          if (req.query.tenantid) {
            tagModel["where"]["tenantid"] = req.query.tenantid;
          }
          parameters.include.push(tagModel);
          console.log(tagModel);
        }
        parameters.include.push({
          model: db.AssetMapping,
          as: "assetmapping",
          required: false,
          attributes: ["assetmappingid", "customerid"],
          where: {
            status: constants.STATUS_ACTIVE,
            resourcetype: resourcetype,
          },
        });
      }
      if (req.query.costyn) {
        parameters.include.push({
          model: db.CostVisual,
          as: "costvisual",
          attributes: [
            "costvisualid",
            "cloudprovider",
            "region",
            "resourcetype",
            "plantype",
            "unit",
            "priceperunit",
            "image",
            "currency",
            "pricingmodel",
          ],
          required: false,
          paranoid: false,
          where: {
            status: constants.STATUS_ACTIVE,
            cloudprovider: { $col: "Instances.cloudprovider" },
            plantype: { $col: "Instances.instancetyperefid" },
            region: { $col: "Instances.region" },
          },
        });
      }
      if (req.query.tenantid) {
        parameters["where"]["tenantid"] = req.query.tenantid;
      }
      // Utilized in Serverdetail component.
      if (req.query.getbycolumn) {
        delete parameters["where"]["instanceid"];
        parameters["where"][req.query.getbycolumn as string] = req.params.id;
        parameters["where"]["status"] = "Active";
      }
      CommonService.getData(parameters, db.Instances)
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
      CommonService.create(req.body, db.Instances)
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
      let condition = { instanceid: req.body.instanceid };
      CommonService.update(condition, req.body, db.Instances)
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

  getAssetChart(req: Request, res: Response): void {
    let response = {};
    try {
      let subquery = "";
      let query = queries.KPI_ASSETS;
      let params = {
        replacements: req.body,
        type: db.sequelize.QueryTypes.SELECT,
      } as any;
      params.replacements["durationquery"] = "";
      params.replacements["subquery"] = "";
      params.replacements["attributes"] = "";

      if (req.body.duration) {
        if (req.body.duration == "Daily") {
          query = query.replace(
            new RegExp(":durationquery", "g"),
            "DATE_FORMAT(i.createddt,'%d-%M-%Y') AS x"
          );
        }
        if (req.body.duration == "Weekly") {
          query = query.replace(
            new RegExp(":durationquery", "g"),
            "CONCAT('Week ', 1 + DATE_FORMAT(i.createddt, '%U')) AS x"
          );
        }
        if (req.body.duration == "Monthly") {
          query = query.replace(
            new RegExp(":durationquery", "g"),
            "DATE_FORMAT(LAST_DAY(i.createddt),'%M-%Y') AS x"
          );
        }
      }
      if (req.body.filters && req.body.filters.length > 0) {
        for (let i = 0; i < req.body.filters.length; i++) {
          if (req.body.filters[i].cloudprovider) {
            const cloudprovider = req.body.filters[i].cloudprovider.map((d) => `"${d.value}"`);
            subquery = subquery + ` AND i.cloudprovider IN (${cloudprovider.join(",")})`;
          }
          if (req.body.filters[i].instancetyperefid) {
            const instancetyperefid = req.body.filters[i].instancetyperefid.map((d) => `'${d.value}'`);
            subquery = subquery + ` AND i.instancetyperefid IN (${instancetyperefid.join(",")})`;
          }
          if (req.body.filters[i].cloudstatus) {
            const cloudstatus = req.body.filters[i].cloudstatus.map((d) => `'${d.value}'`);
            subquery = subquery + ` AND i.cloudstatus IN (${cloudstatus.join(",")})`;
          }
          if (req.body.filters[i].region) {
            const region = req.body.filters[i].region.map((d) => `'${d.value}'`);
            subquery = subquery + ` AND i.region IN (${region.join(",")})`;
          }
          if (req.body.filters[i].customerid) {
            const customerid = req.body.filters[i].customerid.map((d) => `'${d.value}'`);
            subquery = subquery + ` AND i.customerid IN (${customerid.join(",")})`;
          }
          if (i + 1 == req.body.filters.length) {
            query = query.replace(new RegExp(":subquery", "g"), subquery);
          }
        }
      }
      let groupquery = ` GROUP BY x  ORDER BY i.createddt ASC`;
      if (req.body.groupby) {
        query = query.replace(
          new RegExp(":attributes", "g"),
          `, ${req.body.groupby == "customerid"
            ? "ttc.customername"
            : "i." + req.body.groupby
          }`
        );
        groupquery = ` GROUP BY x,i.${req.body.groupby} ORDER BY i.createddt ASC`;
      } else {
        query = query.replace(new RegExp(":attributes", "g"), "");
      }
      query = query + groupquery;

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
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();

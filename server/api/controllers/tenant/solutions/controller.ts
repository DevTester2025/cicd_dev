import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import sequelize = require("sequelize");
import NotificationService from "../../../services/notification.service";
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";

export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      if (
        !_.isEmpty(req.body.statusList) &&
        !_.isUndefined(req.body.statusList) &&
        req.body.statusList.length > 0 && 
        Array.isArray(req.body.statusList)
      ) {
        req.body.status = { $in: req.body.statusList };
        req.body = _.omit(req.body, "statusList");
      }
      parameters = {
        where: req.body,
        order: [["lastupdateddt", "desc"]],
      };
      parameters.include = [
        {
          model: db.Sla,
          as: "slas",
          where: { status: "Active" },
          paranoid: false,
          required: false,
        },
        {
          model: db.notification,
          as: "notifications",
          where: { status: "Active" },
          paranoid: false,
          required: false,
        },
        {
          model: db.ecl2zones,
          as: "zone",
          where: { status: "Active" },
          paranoid: false,
          required: false,
        },
        {
          model: db.SolutionCosts,
          as: "costsummary",
          paranoid: false,
          required: false,
          attributes: ["baseprice", "solutioncostid", "costtype"],
          include: [
            {
              model: db.CostVisual,
              as: "costvisual",
              attributes: ["currency"],
              required: false,
            },
          ],
        },
        {
          model: db.srmcatalog,
          required: false,
          as: "catalogdetails",
          attributes: ["referenceid","referencetype","publishstatus","catalogid","status"],
          where: { status: constants.STATUS_ACTIVE },
        },
      ];
      if (req.body.cloudprovider === "AWS") {
        parameters.include.push({
          model: db.awssolution,
          as: "awssolutions",
          where: { status: "Active" },
          include: [
            {
              model: db.Scripts,
              as: "script",
              //where: { status: 'Active' },
              paranoid: false,
              required: false,
            },
            {
              model: db.awsami,
              as: "awsami",
              //where: { status: 'Active' },
              paranoid: false,
              required: false,
            },
          ],
          paranoid: false,
          required: false,
        });
      }
      if (req.body.cloudprovider === "ECL2") {
        parameters.include.push({
          model: db.ecl2solutions,
          as: "ecl2solutions",
          where: { status: "Active" },
          paranoid: false,
          required: false,
          include: [
            {
              model: db.Scripts,
              as: "ecl2script",
              //where: { status: 'Active' },
              paranoid: false,
              required: false,
            },
            {
              model: db.ecl2images,
              as: "ecl2images",
              //where: { status: 'Active' },
              paranoid: false,
              required: false,
            },
          ],
        });
        parameters.include.push({
          model: db.ecl2loadbalancers,
          as: "ecl2loadbalancers",
          where: { status: "Active" },
          paranoid: false,
          required: false,
        });
      }
      if (req.body.cloudprovider === "Alibaba") {
        parameters.include.push({
          model: db.alisolution,
          as: "alisolution",
          where: { status: "Active" },
          include: [
            {
              model: db.Scripts,
              as: "script",
              where: { status: "Active" },
              paranoid: false,
              required: false,
            },
            {
              model: db.aliimage,
              as: "aliimage",
              where: { status: "Active" },
              paranoid: false,
              required: false,
            },
          ],
          paranoid: false,
          required: false,
        });
        parameters.include.push({
          model: db.alilb,
          as: "alilb",
          where: { status: "Active" },
          paranoid: false,
          required: false,
        });
      }
      if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.Solutions)
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
        CommonService.getAllList(parameters, db.Solutions)
        .then((list) => {
          _.map(list, function (item: any) {
            item = item.dataValues;
            item.totalprice = 0;
            item.totalprice = item.totalprice.toFixed(2);
            if (!_.isEmpty(item.costsummary)) {
              item.totalprice = _.sumBy(item.costsummary, function (o: any) {
                return Number(o.baseprice);
              });
              item.totalprice = item.totalprice.toFixed(2);
              let assetObj: any = _.find(item.costsummary, {
                costtype: "Asset",
              });
              if (assetObj && assetObj.costvisual) {
                let currency = assetObj.costvisual.currency;
                item.totalprice = currency + " " + item.totalprice;
              }
            }
          });
          list = [...list];
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

  getecl2Id(req: Request, res: Response): void {
    let response = {};
    try {
      let parameters = {} as any;
      parameters.where = {
        solutionid: req.params.id,
        // status: 'Active'
      };
      parameters.include = [
        {
          model: db.ecl2solutions,
          as: "ecl2solutions",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          include: [
            {
              model: db.Scripts,
              as: "script",
              required: false,
              paranoid: false,
              include: [
                {
                  model: db.CustomField,
                  as: "parameters",
                  required: false,
                  paranoid: false,
                },
              ],
            },
            {
              model: db.Orchestration,
              as: "orchestration",
              attributes: ["scripts"],
              required: false,
              paranoid: false,
            },
            {
              model: db.ecl2internetgateways,
              as: "ecl2internetgateways",
              paranoid: false,
              required: false,
              where: { status: "Active" },
              include: [
                {
                  model: db.ecl2iginterface,
                  as: "ecl2iginterface",
                  required: false,
                  paranoid: false,
                  where: { status: "Active" },
                  include: [
                    {
                      model: db.ecl2networks,
                      as: "ecl2networks",
                      required: false,
                      paranoid: false,
                      include: [
                        {
                          model: db.ecl2subnets,
                          as: "ecl2subnets",
                          required: false,
                          paranoid: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              model: db.ecl2vsrx,
              as: "ecl2vsrx",
              paranoid: false,
              required: false,
              where: { status: "Active" },
              include: [
                {
                  model: db.ecl2vsrxplan,
                  as: "ecl2vsrxplan",
                  attributes: ["vsrxplanname"],
                  paranoid: false,
                  required: false,
                },
                {
                  model: db.ecl2vsrxinterface,
                  as: "ecl2vsrxinterface",
                  paranoid: false,
                  required: false,
                },
              ],
            },
            {
              model: db.ecl2volumes,
              as: "volumes",
              required: false,
              paranoid: false,
              where: { status: "Active" },
            },
            {
              model: db.ecl2instancetype,
              as: "ecl2instancetype",
              required: false,
              paranoid: false,
            },
            {
              model: db.ecl2images,
              as: "ecl2images",
              required: false,
              paranoid: false,
            },
            {
              model: db.ecl2zones,
              as: "ecl2zones",
              required: false,
              paranoid: false,
            },
          ],
        },
        {
          model: db.notification,
          as: "notifications",
          where: { status: "Active" },
          paranoid: false,
          required: false,
        },
        {
          model: db.Sla,
          as: "slas",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2loadbalancers,
          as: "ecl2loadbalancers",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          include: [
            {
              model: db.ecl2zones,
              as: "ecl2zones",
              required: false,
              paranoid: false,
              attributes: ["region", "zoneid"],
            },
            {
              model: db.ecl2lbinterface,
              as: "ecl2lbinterface",
              required: false,
              paranoid: false,
            },
            {
              model: db.ecl2networks,
              as: "defaultgwnetwork",
              required: false,
              paranoid: false,
              where: { status: "Active" },
            },
          ],
        },
        {
          model: db.ecl2lbsettings,
          as: "ecl2lbsettings",
          where: { status: "Active" },
          paranoid: false,
          required: false,
        },
        {
          model: db.TagValues,
          as: "tagvalues",
          required: false,
          paranoid: false,
          where: { status: "Active", resourcetype: "SOLUTION" },
          include: [
            { model: db.Tags, as: "tag", paranoid: false, required: false },
          ],
        },
        {
          model: db.Tenant,
          as: "tenant",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          include: [
            {
              model: db.CustomField,
              as: "customfield",
              required: false,
              paranoid: false,
              where: {
                status: "Active",
                fieldname: "Product",
              },
            },
          ],
        },
      ];
      CommonService.getData(parameters, db.Solutions)
        .then((data: any) => {
          let parameters = {} as any;
          data = JSON.parse(JSON.stringify(data)) as any;
          if (!_.isEmpty(data.ecl2solutions)) {
            let length = data.ecl2solutions.length;
            let i = 0;
            let loadbalancers = [] as any;
            for (var element of data.ecl2solutions) {
              if (element.volumeid) {
                let commonData = {
                  where: {
                    volumeid: { $in: element.volumeid },
                  },
                };
                CommonService.getAllList(commonData, db.ecl2volumes).then(
                  (result: any) => {
                    data.ecl2solutions[i].volumes = result;
                    element.volumes = result;
                  }
                );
              }
              parameters.where = {
                networkid: { $in: element.networkid },
              };
              parameters.include = [
                {
                  model: db.ecl2subnets,
                  as: "ecl2subnets",
                  paranoid: false,
                  required: false,
                  where: { status: "Active" },
                },
                {
                  model: db.ecl2ports,
                  as: "ecl2ports",
                  paranoid: false,
                  required: false,
                  where: { status: "Active" },
                },
              ];
              CommonService.getAllList(parameters, db.ecl2networks).then(
                (result: any) => {
                  data.ecl2solutions[i].ecl2networks = result;
                  if (element.loadbalancerid != null) {
                    loadbalancers[i] = element.loadbalancerid;
                  }
                  if (i + 1 === data.ecl2solutions.length) {
                    if (!customValidation.isEmptyValue(loadbalancers)) {
                      loadbalancers = _.uniq(loadbalancers);
                      let params = {} as any;
                      params.loadbalancerid = { $in: loadbalancers };
                      parameters.where = params;
                      parameters.include = [
                        {
                          model: db.ecl2zones,
                          as: "ecl2zones",
                          required: false,
                          paranoid: false,
                          attributes: ["region", "zoneid"],
                        },
                        {
                          model: db.ecl2lbinterface,
                          as: "ecl2lbinterface",
                          required: false,
                          paranoid: false,
                        },
                        {
                          model: db.ecl2networks,
                          as: "defaultgwnetwork",
                          required: false,
                          paranoid: false,
                          where: { status: "Active" },
                        },
                      ];
                      CommonService.getAllList(parameters, db.ecl2loadbalancers)
                        .then((lbdata: any) => {
                          if (
                            customValidation.isEmptyValue(
                              data.ecl2loadbalancers
                            )
                          ) {
                            let j = 0;
                            lbdata.forEach((element) => {
                              data.ecl2loadbalancers[j] = element;
                              j++;
                              if (j + 1 === lbdata.length) {
                                j++;
                              }
                            });
                          }
                          customValidation.generateSuccessResponse(
                            data,
                            response,
                            constants.RESPONSE_TYPE_LIST,
                            res,
                            req
                          );
                        })
                        .catch((error: Error) => {
                          customValidation.generateAppError(
                            error,
                            response,
                            res,
                            req
                          );
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
                  }
                  i++;
                }
              );
            }
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

  byId(req: Request, res: Response): void {
    let response = {};
    try {
      let parameters = {} as any;
      parameters.where = {
        solutionid: req.params.id,
        // status: 'Active'
      };
      parameters.include = [
        {
          model: db.awssolution,
          as: "awssolutions",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          include: [
            {
              model: db.Scripts,
              as: "script",
              required: false,
              paranoid: false,
              include: [
                {
                  model: db.CustomField,
                  as: "parameters",
                  required: false,
                  paranoid: false,
                },
              ],
            },
            {
              model: db.awsvolumes,
              as: "volumes",
              required: false,
              paranoid: false,
              where: { status: "Active" },
            },
            {
              model: db.awskeys,
              as: "awskeys",
              required: false,
              paranoid: false,
              attributes: ["keyid", "keyname"],
              where: { status: "Active" },
            },
            {
              model: db.awstags,
              as: "tags",
              required: false,
              paranoid: false,
              where: { status: "Active" },
            },
            {
              model: db.awssubnet,
              as: "awssubnet",
              required: false,
              paranoid: false,
              include: [
                {
                  model: db.awszones,
                  as: "zone",
                  required: false,
                  paranoid: false,
                },
              ],
            },
            {
              model: db.Orchestration,
              as: "orchestration",
              attributes: ["scripts"],
              required: false,
              paranoid: false,
            },
            {
              model: db.awsvpc,
              as: "awsvpc",
              required: false,
              paranoid: false,
            },
            {
              model: db.awsinsttype,
              as: "awsinsttype",
              required: false,
              paranoid: false,
            },
            {
              model: db.awsami,
              as: "awsami",
              required: false,
              paranoid: false,
            },
            {
              model: db.awssg,
              as: "awssg",
              required: false,
              paranoid: false,
              include: [
                {
                  model: db.awssgrules,
                  as: "awssgrules",
                  required: false,
                  paranoid: false,
                },
              ],
            },
            {
              model: db.awslb,
              as: "lb",
              required: false,
              paranoid: false,
              where: {
                status: "Active",
              },
              include: [
                {
                  model: db.awssubnet,
                  as: "lbsubnet",
                  required: false,
                  paranoid: false,
                },
                {
                  model: db.awssg,
                  as: "lbsecuritygroup",
                  required: false,
                  paranoid: false,
                  include: [
                    {
                      model: db.awssgrules,
                      as: "awssgrules",
                      required: false,
                      paranoid: false,
                    },
                  ],
                },
              ],
            },
            {
              model: db.TagValues,
              as: "tagvalues",
              required: false,
              paranoid: false,
              where: {
                cloudprovider: constants.CLOUD_AWS,
                status: "Active",
                resourcetype: "SOLUTION_ASSET",
              },
              include: [
                { model: db.Tags, as: "tag", paranoid: false, required: false },
              ],
            },
          ],
        },
        {
          model: db.Customer,
          as: "client",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          attributes: ["customerid", "ecl2tenantid", "ecl2region"],
        },
        {
          model: db.ecl2zones,
          as: "zone",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          attributes: ["zoneid", "region"],
        },
        {
          model: db.Sla,
          as: "slas",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.awslb,
          as: "lb",
          required: false,
          paranoid: false,
          where: {
            status: "Active",
          },
        },
        {
          model: db.TagValues,
          as: "tagvalues",
          required: false,
          paranoid: false,
          where: {
            cloudprovider: constants.CLOUD_AWS,
            status: "Active",
            resourcetype: "SOLUTION",
          },
          include: [
            { model: db.Tags, as: "tag", paranoid: false, required: false },
          ],
        },
        {
          model: db.notification,
          as: "notifications",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.Tenant,
          as: "tenant",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          include: [
            {
              model: db.CustomField,
              as: "customfield",
              required: false,
              paranoid: false,
              where: {
                status: "Active",
                fieldlabel: "CLOUD_DETAILS",
              },
            },
          ],
        },
      ];
      CommonService.getData(parameters, db.Solutions)
        .then((data: any) => {
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
      let options = {};
      options = {
        include: [
          { model: db.Sla, as: "slas" },
          { model: db.notification, as: "notifications" },
        ],
      };
      CommonService.saveWithAssociation(req.body, options, db.Solutions).then(
        (data) => {
          
          try {
            CommonService.create(
              {
                resourcetypeid: data["solutionid"],
                resourcetype: constants.RESOURCETYPE[18],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[36],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: data["createdby"],
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          }catch(error) {
          console.log("Failed to update history", error)
          }
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
          let condition = {
            module: constants.NOTIFICATION_MODULES[2],
            event: constants.NOTIFICATION_EVENTS[0],
            tenantid: req.body.tenantid,
            status: constants.STATUS_ACTIVE,
          } as any;
          let dateFormat = constants.MOMENT_FORMAT[1];
          let mapObj = {
            "{{template_name}}": data.solutionname,
            "{{templateid}}": req.body.solution.solutionid,
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
            "CM - template Created",
            "Template Created"
          );
        }
      );
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  update(req: Request, res: Response): void {
    let response = {};
    try {
      let condition = { solutionid: req.body.solutionid };
      CommonService.update(condition, req.body, db.Solutions)
        .then(async (data: any) => {
          try {
            CommonService.create(
              {
                resourcetypeid: data["solutionid"],
                resourcetype: constants.RESOURCETYPE[18],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[37],
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
          console.log("Failed to update history", error)
          }
          if (!customValidation.isEmptyValue(req.body.awslb)) {
            await CommonService.upsert(req.body.awslb, db.awslb);
          }
          if (!customValidation.isEmptyValue(req.body.notifications)) {
            await CommonService.update(
              { notificationid: req.body.notifications.notificationid },
              req.body.notifications,
              db.notification
            );
          }
          if (!customValidation.isEmptyValue(req.body.slas)) {
            let options = [
              "priority",
              "responsetimemins",
              "uptimeprcnt",
              "workinghrs",
              "creditsprcnt",
              "replacementhrs",
              "notes",
              "status",
              "lastupdatedby",
              "lastupdateddt",
            ];
            await CommonService.bulkUpdate(req.body.slas, options, db.Sla);
          }
          if (!customValidation.isEmptyValue(req.body.awssolution)) {
            await CommonService.update(
              { awssolutionid: req.body.awssolution.awssolutionid },
              req.body.awssolution,
              db.awssolution
            ).then((data) => {
              customValidation.generateSuccessResponse(
                data,
                response,
                constants.RESPONSE_TYPE_UPDATE,
                res,
                req
              );
              return;
            });
          } else {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
            return;
          }
          let event =
            req.body.status == constants.DELETE_STATUS
              ? constants.NOTIFICATION_EVENTS[2]
              : constants.NOTIFICATION_EVENTS[3];
          let condition = {
            module: constants.NOTIFICATION_MODULES[2],
            event: event,
            tenantid: req.body.tenantid,
            status: constants.STATUS_ACTIVE,
          } as any;
          let dateFormat = constants.MOMENT_FORMAT[1];
          let mapObj = {
            "{{template_name}}": data.solutionname,
            "{{templateid}}": req.body.solution.solutionid,
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
            "CM - template Updated",
            "Template Updated"
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
          return;
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
      return;
    }
  }
  getgraph(req: Request, res: Response): void {
    let response = {};
    try {
      let parameters = {} as any;
      parameters.where = {
        solutionid: req.params.id,
        // status: 'Active'
      };
      parameters.include = [
        {
          model: db.awslb,
          as: "lb",
          attributes: ["lbname", "lbid"],
          required: false,
          paranoid: false,
          where: { status: "Active" },
          include: [
            {
              model: db.awssubnet,
              as: "lbsubnet",
              required: false,
              paranoid: false,
              attributes: ["subnetname", "subnetid"],
            },
            {
              model: db.awsvpc,
              as: "lbvpc",
              required: false,
              paranoid: false,
              attributes: ["vpcname", "vpcid"],
            },
            {
              model: db.awssolution,
              as: "awssolution",
              attributes: ["instancename", "awssolutionid"],
              required: false,
              paranoid: false,
              include: [
                {
                  model: db.awssubnet,
                  as: "awssubnet",
                  attributes: ["subnetname", "subnetid"],
                  required: false,
                  paranoid: false,
                },
                {
                  model: db.awsvpc,
                  as: "awsvpc",
                  attributes: ["vpcname", "vpcid"],
                  required: false,
                  paranoid: false,
                },
              ],
            },
          ],
        },
        {
          model: db.awssolution,
          as: "awssolutions",
          attributes: ["instancename", "awssolutionid"],
          where: { status: "Active" },
          required: false,
          paranoid: false,
          include: [
            {
              model: db.awssubnet,
              as: "awssubnet",
              attributes: ["subnetname", "subnetid"],
              required: false,
              paranoid: false,
            },
            {
              model: db.awsvpc,
              as: "awsvpc",
              attributes: ["vpcname", "vpcid"],
              required: false,
              paranoid: false,
            },
          ],
        },
      ];
      CommonService.getData(parameters, db.Solutions)
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

  // Clone Template
  clone(req: Request, res: Response): void {
    let response = {};
    try {
      // clone
      let options = {} as any;
      let solutionid = req.body.solutionid;
      let map = {} as any;

      req.body = _.omit(req.body, "solutionid");
      req.body.solutionname = req.body.solutionname + "_COPY";
      req.body.createddt = new Date();
      req.body.lastupdateddt = new Date();
      req.body.notifications = _.omit(req.body.notifications, [
        "notificationid",
        "solutionid",
      ]);
      req.body.notifications.createddt = new Date();
      req.body.notifications.lastupdateddt = new Date();
      req.body.slas = _.map(req.body.slas, function (item) {
        item = _.omit(item, ["slaid", "solutionid"]);
        item.createddt = new Date();
        item.lastupdateddt = new Date();
        return item;
      });
      options = {
        include: [
          { model: db.Sla, as: "slas" },
          { model: db.notification, as: "notifications" },
        ],
      };

      if (req.body.cloudprovider === constants.CLOUD_AWS) {
        if (!customValidation.isEmptyValue(req.body.awssolutions)) {
          options.include.push({ model: db.awssolution, as: "awssolutions" });
          req.body.awssolutions = _.map(
            req.body.awssolutions,
            function (entry) {
              entry = _.omit(entry, ["awssolutionid", "solutionid"]);
              entry.createddt = new Date();
              entry.lastupdateddt = new Date();
              return entry;
            }
          );
        }
      } else if (req.body.cloudprovider === constants.CLOUD_ECL) {
        if (!customValidation.isEmptyValue(req.body.ecl2solutions)) {
          options.include.push({
            model: db.ecl2solutions,
            as: "ecl2solutions",
          });
          req.body.ecl2solutions = _.map(
            req.body.ecl2solutions,
            function (entry) {
              entry = _.omit(entry, ["ecl2solutionid", "solutionid"]);
              entry.createddt = new Date();
              entry.lastupdateddt = new Date();
              return entry;
            }
          );
        }
      } else if (req.body.cloudprovider === constants.CLOUD_ALIBABA) {
        if (!customValidation.isEmptyValue(req.body.alisolution)) {
          options.include.push({ model: db.alisolution, as: "alisolution" });
          req.body.alisolution = _.map(req.body.alisolution, function (entry) {
            entry = _.omit(entry, ["alisolutionid", "solutionid"]);
            entry.createdby = new Date();
            entry.lastupdateddt = new Date();
            return entry;
          });
        }

        if (!customValidation.isEmptyValue(req.body.alilb)) {
          options.include.push({ model: db.alilb, as: "alilb" });
          req.body.alilb = _.map(req.body.alilb, function (item) {
            item = _.omit(item, ["lbid", "solutionid"]);
            item.createddt = new Date();
            item.lastupdateddt = new Date();
            return item;
          });
        }
      }

      CommonService.saveWithAssociation(req.body, options, db.Solutions)
        .then((data) => {
 
          try {
            CommonService.create(
              {
                resourcetypeid: data["solutionid"],
                resourcetype: constants.RESOURCETYPE[18],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[36],
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
          console.log("Failed to update history", error)
          }
          // Clone Template Params
          let parameters = {} as any;
          parameters.where = {
            templateid: solutionid,
            status: constants.STATUS_ACTIVE,
            tenantid: req.body.tenantid,
          };
          console.log("prams", parameters);
          CommonService.getAllList(parameters, db.CustomField)
            .then((params: any) => {
              if (!customValidation.isEmptyValue(params)) {
                params = _.map(params, function (item) {
                  item = item.dataValues;
                  item = _.omit(item, "customfldid");
                  item.templateid = data.solutionid;
                  item.createdby = req.body.createdby;
                  item.lastupdatedby = req.body.createdby;
                  item.createddt = new Date();
                  item.lastupdateddt = new Date();
                  return item;
                });
                CommonService.bulkCreate(params, db.CustomField)
                  .then((customfields) => {
                    //
                    console.log("Parameters updated");
                  })
                  .catch((error: Error) => {
                    customValidation.generateAppError(
                      error,
                      response,
                      res,
                      req
                    );
                  });
              }
              // ECL2 loadbalancer settings clone
              if (req.body.cloudprovider === constants.CLOUD_ECL) {
                CommonService.getData(
                  { where: { solutionid: solutionid } },
                  db.ecl2lbsettings
                ).then((lbsetting: any) => {
                  if (!customValidation.isEmptyValue(lbsetting)) {
                    lbsetting = lbsetting.dataValues;
                    lbsetting = _.omit(lbsetting, "lbsettingid");
                    lbsetting.createdby = data.createdby;
                    lbsetting.createddt = new Date();
                    lbsetting.lastupdatedby = data.lastupdatedby;
                    lbsetting.lastupdateddt = new Date();
                    lbsetting.lbserver = JSON.parse(lbsetting.lbserver);
                    lbsetting.servicegroup = JSON.parse(lbsetting.servicegroup);
                    lbsetting.servicegroup.servicegroupname = data.solutionname;
                    lbsetting.servicegroupmemberbindings = JSON.parse(
                      lbsetting.servicegroupmemberbindings
                    );
                    lbsetting.servicegroupmemberbindings.servicegroupname =
                      lbsetting.servicegroup.servicegroupname;
                    lbsetting.lbvserver = JSON.parse(lbsetting.lbvserver);
                    lbsetting.lbvserver.name = data.solutionname;
                    lbsetting.lbvserversgbindings = JSON.parse(
                      lbsetting.lbvserversgbindings
                    );
                    lbsetting.lbvserversgbindings.servicegroupname =
                      lbsetting.servicegroup.servicegroupname;
                    lbsetting.servicegroupmonitorbindings = JSON.parse(
                      lbsetting.servicegroupmonitorbindings
                    );
                    lbsetting.servicegroupmonitorbindings.servicegroupname =
                      lbsetting.servicegroup.servicegroupname;
                    lbsetting.lbvservermethodbindings = JSON.parse(
                      lbsetting.lbvservermethodbindings
                    );
                    lbsetting.lbvservermethodbindings.name = data.solutionname;
                    lbsetting.solutionid = data.solutionid;
                    CommonService.create(lbsetting, db.ecl2lbsettings).then(
                      (result) => {
                        customValidation.generateSuccessResponse(
                          data,
                          response,
                          constants.RESPONSE_TYPE_SAVE,
                          res,
                          req
                        );
                      }
                    );
                  } else {
                    customValidation.generateSuccessResponse(
                      data,
                      response,
                      constants.RESPONSE_TYPE_SAVE,
                      res,
                      req
                    );
                  }
                });
              } else if (
                req.body.cloudprovider === constants.CLOUD_AWS &&
                !customValidation.isEmptyValue(data.awssolutions)
              ) {
                // AWS loadbalancer clone
                let loadbalancers: any;
                let existingDetails: any;
                existingDetails = _.map(
                  data.awssolutions,
                  function (item: any) {
                    let obj = {} as any;
                    obj.awssolutionid = item.awssolutionid;
                    obj.oldlbid = item.lbid;
                    obj.lastupdateddt = new Date();
                    obj.lastupdatedby = item.lastupdatedby;
                    obj.lbid = null;
                    return obj;
                  }
                );
                loadbalancers = _.map(existingDetails, function (obj: any) {
                  return obj.oldlbid;
                });
                loadbalancers = _.uniq(loadbalancers);
                let i = 1;
                loadbalancers.forEach((lb) => {
                  CommonService.getData({ where: { lbid: lb } }, db.awslb).then(
                    (lbobj: any) => {
                      if (!customValidation.isEmptyValue(lbobj)) {
                        lbobj = lbobj.dataValues;
                        lbobj = _.omit(lbobj, "lbid");
                        lbobj.solutionid = data.solutionid;
                        lbobj.createddt = new Date();
                        lbobj.lastupdateddt = new Date();
                        CommonService.create(lbobj, db.awslb).then((lbdata) => {
                          _.map(existingDetails, function (item: any) {
                            if (item !== undefined && item.oldlbid == lb) {
                              item.lbid = lbdata.dataValues.lbid;
                              return item;
                            }
                          });
                          if (i === loadbalancers.length) {
                            existingDetails = _.map(
                              existingDetails,
                              function (item) {
                                item = _.omit(item, "oldlbid");
                                return item;
                              }
                            );
                            let updateattributes = [
                              "lbid",
                              "lastupdateddt",
                              "lastupdatedby",
                            ];
                            CommonService.bulkUpdate(
                              existingDetails,
                              updateattributes,
                              db.awssolution
                            )
                              .then((result: any) => {
                                //
                                console.log("Update");
                                customValidation.generateSuccessResponse(
                                  data,
                                  response,
                                  constants.RESPONSE_TYPE_SAVE,
                                  res,
                                  req
                                );
                              })
                              .catch((error: Error) => {
                                customValidation.generateAppError(
                                  error,
                                  response,
                                  res,
                                  req
                                );
                              });
                          }
                          i++;
                        });
                      } else {
                        customValidation.generateSuccessResponse(
                          data,
                          response,
                          constants.RESPONSE_TYPE_SAVE,
                          res,
                          req
                        );
                      }
                    }
                  );
                });
              } else {
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
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getaliId(req: Request, res: Response): void {
    let response = {};
    try {
      let parameters = {} as any;
      parameters.where = {
        solutionid: req.params.id,
      };
      parameters.include = [
        {
          model: db.alisolution,
          as: "alisolution",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          include: [
            {
              model: db.Scripts,
              as: "script",
              required: false,
              paranoid: false,
              include: [
                {
                  model: db.CustomField,
                  as: "parameters",
                  required: false,
                  paranoid: false,
                },
              ],
            },
            {
              model: db.alivolume,
              as: "alivolume",
              required: false,
              paranoid: false,
              where: { status: "Active" },
            },
            {
              model: db.alivswitch,
              as: "alivswitch",
              required: false,
              paranoid: false,
            },
            {
              model: db.alivpc,
              as: "alivpc",
              required: false,
              paranoid: false,
            },
            {
              model: db.aliinstancetype,
              as: "aliinstancetype",
              required: false,
              paranoid: false,
            },
            {
              model: db.aliimage,
              as: "aliimage",
              required: false,
              paranoid: false,
            },
            {
              model: db.alisecuritygroup,
              as: "alisecuritygroup",
              required: false,
              paranoid: false,
              include: [
                {
                  model: db.alisgrules,
                  as: "alisgrules",
                  required: false,
                  paranoid: false,
                },
              ],
            },
          ],
        },
        {
          model: db.Sla,
          as: "slas",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.notification,
          as: "notifications",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.alilb,
          as: "alilb",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          include: [
            {
              model: db.alilblistener,
              as: "alilblistener",
              required: false,
              paranoid: false,
              where: { status: "Active" },
            },
          ],
        },
      ];
      CommonService.getData(parameters, db.Solutions)
        .then((data: any) => {
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
}
export default new Controller();

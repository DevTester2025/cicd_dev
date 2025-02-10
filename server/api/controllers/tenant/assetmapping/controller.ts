import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import * as _ from "lodash";
import { modules } from "../../../../common/module";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.ASSETMAP };
    try {
      let parameters = { where: req.body } as any;
      parameters.attributes = [
        "tenantid",
        "cloudprovider",
        "resourcetype",
        "resourceid",
        "customerid",
        "status",
      ];
      parameters.include = [
        {
          model: db.Instances,
          as: "instance",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": {
              $in: [constants.RESOURCE_TYPES[0], constants.RESOURCE_TYPES[15]],
            },
            "$AssetMapping.resourceid$": { $col: "instance.instanceid" },
          },
          attributes: [
            "tenantid",
            "customerid",
            "cloudprovider",
            "region",
            "instancename",
            "instancerefid",
            "instancetyperefid",
            "imageid",
          ],
          include: [
            {
              model: db.ecl2images,
              as: "image",
              required: false,
              include: [
                {
                  model: db.CostVisual,
                  as: "costvisual",
                  required: false,
                  where: {
                    status: constants.STATUS_ACTIVE,
                    cloudprovider: constants.CLOUD_ECL,
                    plantype: { $col: "instance.instancetyperefid" },
                    region: { $col: "instance.region" },
                  },
                },
              ],
            },
            {
              model: db.awsami,
              as: "awsimage",
              required: false,
              include: [
                {
                  model: db.CostVisual,
                  as: "costvisual",
                  required: false,
                  where: {
                    status: constants.STATUS_ACTIVE,
                    cloudprovider: constants.CLOUD_AWS,
                    plantype: { $col: "instance.instancetyperefid" },
                    region: { $col: "instance.region" },
                  },
                },
              ],
            },
          ],
        },
        {
          model: db.ecl2loadbalancers,
          as: "ecl2lb",
          required: false,
          where: {
            status: constants.STATUS_ACTIVE,
            "$AssetMapping.cloudprovider$": constants.CLOUD_ECL,
          },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[4],
            "$AssetMapping.resourceid$": { $col: "ecl2lb.loadbalancerid" },
          },
          attributes: [
            "tenantid",
            "customerid",
            "lbname",
            "availablesubnets",
            "ecl2loadbalancerid",
          ],
          include: [
            {
              model: db.ecl2lbplan,
              as: "ecl2lbplan",
              required: false,
              include: [
                {
                  model: db.CostVisual,
                  as: "costvisual",
                  required: false,
                  where: {
                    status: constants.STATUS_ACTIVE,
                    region: { $col: "ecl2lb.ecl2lbplan.region" },
                  },
                },
              ],
            },
          ],
        },
        {
          model: db.ecl2vsrx,
          as: "ecl2vsrx",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[7],
            "$AssetMapping.resourceid$": { $col: "ecl2vsrx.vsrxid" },
          },
          attributes: ["tenantid", "customerid", "vsrxname", "ecl2vsrxid"],
          include: [
            {
              model: db.ecl2vsrxplan,
              as: "ecl2vsrxplan",
              required: false,
              include: [
                {
                  model: db.CostVisual,
                  as: "costvisual",
                  required: false,
                  where: {
                    status: constants.STATUS_ACTIVE,
                    region: { $col: "ecl2vsrx.ecl2vsrxplan.region" },
                  },
                },
              ],
            },
          ],
        },
        {
          model: db.ecl2networks,
          as: "ecl2networks",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[1],
            "$AssetMapping.resourceid$": { $col: "ecl2networks.networkid" },
          },
          attributes: [
            "tenantid",
            "customerid",
            "networkname",
            "ecl2networkid",
          ],
        },
        {
          model: db.vmwarevm,
          as: "virmachines",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[15],
            "$AssetMapping.resourceid$": { $col: "virmachines.vmid" },
          },
        },
        {
          model: db.vmclusters,
          as: "clusters",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[16],
            "$AssetMapping.resourceid$": { $col: "clusters.clusterid" },
          },
        },
        {
          model: db.vmwaredc,
          as: "datacenter",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[17],
            "$AssetMapping.resourceid$": { $col: "datacenter.dcid" },
          },
        },
        {
          model: db.vmwarehosts,
          as: "hosts",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[18],
            "$AssetMapping.resourceid$": { $col: "hosts.hostid" },
          },
        },
        {
          model: db.ecl2internetgateways,
          as: "ecl2ig",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[8],
            "$AssetMapping.resourceid$": { $col: "ecl2ig.internetgatewayid" },
          },
          attributes: [
            "tenantid",
            "customerid",
            "gatewayname",
            "ecl2internetgatewayid",
          ],
          include: [
            {
              model: db.ecl2qosoptions,
              as: "ecl2qosoptions",
              required: false,
              include: [
                {
                  model: db.CostVisual,
                  as: "costvisual",
                  required: false,
                  where: {
                    status: constants.STATUS_ACTIVE,
                    region: { $col: "ecl2ig.ecl2qosoptions.region" },
                  },
                },
              ],
            },
          ],
        },
        {
          model: db.ecl2commonfunctiongateway,
          as: "ecl2cfg",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[9],
            "$AssetMapping.resourceid$": { $col: "ecl2cfg.cfgatewayid" },
          },
          attributes: [
            "tenantid",
            "customerid",
            "cfgatewayname",
            "ecl2cfgatewayid",
          ],
        },
        {
          model: db.awsvolumes,
          as: "awsvolumes",
          required: false,
          where: {
            status: constants.STATUS_ACTIVE,
            "$AssetMapping.cloudprovider$": constants.CLOUD_AWS,
          },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[2],
            "$AssetMapping.resourceid$": { $col: "awsvolumes.volumeid" },
          },
          attributes: ["tenantid", "volumetype", "sizeingb", "awsvolumeid"],
          include: [
            {
              model: db.CostVisual,
              as: "costvisual",
              required: false,
              where: { status: constants.STATUS_ACTIVE },
            },
          ],
        },
        {
          model: db.ecl2volumes,
          as: "ecl2volumes",
          required: false,
          where: {
            status: constants.STATUS_ACTIVE,
            "$AssetMapping.cloudprovider$": constants.CLOUD_ECL,
          },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[2],
            "$AssetMapping.resourceid$": { $col: "ecl2volumes.volumeid" },
          },
          attributes: ["tenantid", "volumename", "size", "ecl2volumeid"],
          include: [
            {
              model: db.ecl2zones,
              as: "ecl2zones",
              required: false,
            },
            {
              model: db.CostVisual,
              as: "costvisual",
              required: false,
              where: {
                status: constants.STATUS_ACTIVE,
                region: { $col: "ecl2volumes.ecl2zones.region" },
              },
            },
          ],
        },
        {
          model: db.awsvpc,
          as: "awsvpc",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[5],
            "$AssetMapping.resourceid$": { $col: "awsvpc.vpcid" },
          },
          attributes: ["tenantid", "vpcname", "awsvpcid"],
        },
        {
          model: db.awssubnet,
          as: "awssubnet",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[6],
            "$AssetMapping.resourceid$": { $col: "awssubnet.subnetid" },
          },
          attributes: ["tenantid", "subnetname", "awssubnetd"],
        },
        {
          model: db.awssg,
          as: "awssg",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[3],
            "$AssetMapping.resourceid$": { $col: "awssg.securitygroupid" },
          },
          attributes: ["tenantid", "securitygroupname", "awssecuritygroupid"],
        },
        {
          model: db.awslb,
          as: "awslb",
          required: false,
          where: {
            status: constants.STATUS_ACTIVE,
            "$AssetMapping.cloudprovider$": constants.CLOUD_AWS,
          },
          on: {
            "$AssetMapping.resourcetype$": constants.RESOURCE_TYPES[4],
            "$AssetMapping.resourceid$": { $col: "awslb.lbid" },
          },
          attributes: ["tenantid", "lbname", "securitypolicy"],
        }, 
      ];
      if (req.query.list) {
        parameters.include = [];
        parameters.where = req.body;
        parameters = _.omit(parameters, ["attributes"]);
      }
      if (req.query.list && req.query.customer ) {
        parameters.include = [{
          model: db.Customer,
          as : "customerdetail",
          required: false,
        }];
        parameters.where = req.body;
        parameters = _.omit(parameters, ["attributes"]);
      }
      CommonService.getAllList(parameters, db.AssetMapping)
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

  byId(req: Request, res: Response): void {
    let response = { reference: modules.ASSETMAP };
    try {
      CommonService.getById(req.params.id, db.AssetMapping)
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
    let response = { reference: modules.ASSETMAP };
    try {
      CommonService.create(req.body, db.AssetMapping)
        .then(async (data) => {
          if (req.body.isRecord) {
            let value = req.body.resourcerefid;
            await CommonService.create(
              {
                type: 1,
                old: null,
                new: value,
                affectedattribute:
                  "Referring Assets - " +
                  req.body.cloudprovider +
                  "-" +
                  req.body.resourcetype,
                attributetype: "",
                status: "Active",
                createdby: req.body["lastupdatedby"],
                createddt: new Date(),
                lastupdatedby: req.body["lastupdatedby"],
                lastupdateddt: req.body["lastupdateddt"],
                meta: JSON.stringify(data),
                tenantid: req.body["tenantid"],
                resourceid: req.body["crnresourceid"],
                crn: req.body["crnresourceid"].split("/")[0],
              },
              db.AssetsHistory
            );
          }
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
  bulkcreate(req: Request, res: Response): void {
    let response = { reference: modules.ASSETMAP };
    try {
      CommonService.bulkCreate(req.body.mappinglist, db.AssetMapping)
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
  async update(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.ASSETMAP };
    try {
      let condition = { assetmappingid: req.body.assetmappingid };
      if (req.body.isRecord) {
        const existingRecord = await db.AssetMapping.findOne({
          where: {
            crnresourceid: req.body.crnresourceid,
          },
        });
        CommonService.update(condition, req.body, db.AssetMapping).then(
          async (data) => {
            let oldvalue = existingRecord.dataValues["resourcerefid"];
            let newvalue = data["resourcerefid"];
            await CommonService.create(
              {
                type: 2,
                old: oldvalue,
                new: newvalue,
                affectedattribute:
                  "Referring Assets - " +
                  existingRecord.dataValues["cloudprovider"] +
                  "-" +
                  existingRecord.dataValues["resourcetype"],
                attributetype: "",
                status: "Active",
                createdby: data["lastupdatedby"],
                createddt: new Date(),
                lastupdatedby: data["lastupdatedby"],
                lastupdateddt: data["lastupdateddt"],
                meta: "",
                tenantid: data["tenantid"],
                resourceid: data["crnresourceid"],
                crn: data["crnresourceid"].split("/")[0],
              },
              db.AssetsHistory
            );
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
          }
        );
      } else {
        CommonService.update(condition, req.body, db.AssetMapping)
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  bulkupdate(req: Request, res: Response): void {
    let response = { reference: modules.ASSETMAP };
    try {
      let updateattributes = [
        "tenantid",
        "cloudprovider",
        "resourcetype",
        "resourceid",
        "customerid",
        "status",
        "lastupdatedby",
        "lastupdateddt",
      ];
      CommonService.bulkUpdate(req.body, updateattributes, db.AssetMapping)
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

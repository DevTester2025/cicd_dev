import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { messages } from "../../../../common/messages";
import { constants } from "../../../../common/constants";

import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import _ = require("lodash");
import sequelize = require("sequelize");
import commonService from "../../../services/common.service";
import { queries } from "../../../../common/query";
import * as moment from "moment";
import influxDbService from "../../../services/influxdb";
import { influxQueries } from "../../../../common/influxqueries";
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
import AssetService from "../../../services/asset.service";
import { modules } from "../../../../common/module";
import AWSService from "../../../services/providers/aws.service";
import { AppError } from "../../../../common/appError";
import AWS = require("aws-sdk");
// import { Kapacitor } from 'kapacitor';
// const kapacitor = new Kapacitor({
//     host: '13.233.63.159',
//     port: 8086,
//     protocol: 'http'
// });
const Op = sequelize.Op;

interface AssetFilters {
  provider: "ECL2" | "AWS" | "Sentia" | "Equinix";
  asset:
  | "ASSET_LB"
  | "ASSET_FIREWALL"
  | "ASSET_NETWORK"
  | "ASSET_IG"
  | "ASSET_CFG"
  | "ASSET_VOLUME"
  | "ASSET_INSTANCE"
  | "ASSET_ECS"
  | "ASSET_EKS"
  | "ASSET_S3"
  | "ASSET_RDS"
  | "ASSET_SUBNET"
  | "ASSET_SECURITYGROUP";
  zone: number[];
  customers: number[];
  accounts: number[];
  tagid: number;
  instanceid: number;
  instancerefid: string;
  tagvalue: string;
  data: {
    tenantid: number;
  };
  datacollection?: string;
  rightsize?: string;
  promagentstat?: string;
  orchstatus?: string;
  ssmagentstatus?: string;
  agentid?: string;
}

const tagResourceTypeMapping = {
  FIREWALL: "FIREWALL",
  NETWORK: "NETWORK",
  ASSET_LB: "ASSET_LB",
  IG: "IG",
  ASSET_INSTANCE: "ASSET_INSTANCE",
  ASSET_CFG: "ASSET_CFG",
};

const assetTableMaps = {
  ECL2: {
    ASSET_LB: db.ecl2loadbalancers,
    ASSET_FIREWALL: db.ecl2vsrx,
    ASSET_NETWORK: db.ecl2networks,
    ASSET_IG: db.ecl2internetgateways,
    ASSET_CFG: db.ecl2commonfunctiongateway,
    ASSET_VOLUME: db.ecl2volumes,
    ASSET_INSTANCE: db.Instances,
  },
  AWS: {
    ASSET_INSTANCE: db.Instances,
    ASSET_VOLUME: db.awsvolumes,
    ASSET_VPC: db.awsvpc,
    ASSET_SUBNET: db.awssubnet,
    ASSET_SECURITYGROUP: db.awssg,
    ASSET_LB: db.awslb,
    ASSET_IG: db.awsinternetgateway,
    ASSET_S3: db.CloudAsset,
    ASSET_RDS: db.CloudAsset,
    ASSET_ECS: db.CloudAsset,
    ASSET_EKS: db.CloudAsset,
  },
  Sentia: {
    VIRTUAL_MACHINES: db.Instances,
  },
  Equinix: {
    VIRTUAL_MACHINES: db.Instances,
  },
  Nutanix: {
    VIRTUAL_MACHINES: db.Instances,
  },
};

const ecl2TableKeyMaps = {
  ASSET_LB: "loadbalancerid",
  ASSET_FIREWALL: "vsrxid",
  ASSET_NETWORK: "networkid",
  ASSET_IG: "internetgatewayid",
  ASSET_CFG: "cfgatewayid",
  ASSET_VOLUME: "volumeid",
  ASSET_INSTANCE: "instanceid",
};

const awsTableKeyMaps = {
  ASSET_INSTANCE: "instanceid",
  ASSET_VOLUME: "volumeid",
  ASSET_VPC: "vpcid",
  ASSET_SUBNET: "subnetid",
  ASSET_SECURITYGROUP: "securitygroupid",
  ASSET_LB: "lbid",
};

const vmwareTableKeyMaps = {
  VIRTUAL_MACHINES: "instanceid",
};

const ecl2ColumnNameMaps = {
  ecl2networkid: "Network Id",
  ecl2loadbalancerid: "Loadbalancer Id",
  ecl2vsrxid: "VSRX Id",
  instancetyperefid: "Instance Type",
  ecl2internetgatewayid: "Gateway Id",
  ecl2volumeid: "Volume Id",
  instancerefid: "Instance Id",
  ecl2cfgatewayid: "CFG Id",
  instancename: "Instance Name",
  networkname: "Network Name",
  plane: "Plane",
  lbname: "LB Name",
  availabilityzone: "Available Zone",
  cfgatewayname: "Name",
  vsrxname: "VSRX Name",
  gatewayname: "Gateway Name",
  volumename: "Volume Name",
  size: "Size (GB)",
  virtualstorageid: "Storage Id",
  zone: "Region",
  customer: "Customer",
  lastupdateddt: "Updated On",
  lastupdatedby: "Updated By",
};
const awsColumnNameMaps = {
  // 'volumeid': "Id",
  // 'vpcid': "Id",
  // 'subnetid': "Id",
  // 'securitygroupid': "Id",
  // 'lbid': "Id",
  instancerefid: { field: "Instance Id", filter: true },
  instancename: { field: "Instance Name", filter: true },
  instancetyperefid: { field: "Instance Type", filter: true },
  networkname: { field: "Network Name", filter: true },
  plane: { field: "Plane" },
  vpcname: { field: "VPC Name", filter: true },
  assetname: { field: "Asset Name", filter: true },
  // assetdata: { field: "Asset Details", filter: true },
  awsvpcid: { field: "VPC Id", filter: true },
  ipv4cidr: { field: "IPV4 CIDR" },
  subnetname: { field: "Subnet Name", filter: true },
  awssubnetd: { field: "Subnet Id", filter: true },
  awssecuritygroupid: { field: "Security Group Id", filter: true },
  securitygroupname: { field: "Security Group", filter: true },
  lbname: { field: "LB Name", filter: true },
  // 'listeners': "Listeners",
  // 'certificatearn': "ARN",
  securitypolicy: { field: "Security Policy", filter: true },
  // 'hcport': "Security Port",
  hcinterval: { field: "Interval" },
  hctimeout: { field: "Timeout" },
  availabilityzone: { field: "Available Zone" },
  cfgatewayname: { field: "Name" },
  vsrxname: { field: "VSRX Name" },
  gatewayname: { field: "Gateway Name", filter: true },
  volumename: { field: "Volume Name", filter: true },
  awsvolumeid: { field: "Volume Id", filter: true },
  sizeingb: { field: "Size (GB)", filter: true },
  encryptedyn: { field: "Encrypted" },
  virtualstorageid: { field: "Storage Id" },
  zone: { field: "Zone", filter: true },
  customer: { field: "Customer" },
  lastupdateddt: { field: "Updated On" },
  lastupdatedby: { field: "Updated By" },
  awsinternetgatewayid: { field: "AWS Gateway Id", filter: true },
};

export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    const response = {
      reference: modules.INSTANCE,
    };
    try {
      let parameters = { where: req.body };
      CommonService.getAllList(parameters, db.Instances)
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
  getMonitoringInstances(req: any, res: Response): void {
    let response = {
      reference: modules.INSTANCE,
    };
    try {
      let condition = influxDbService.formInfluxWhere(req.body);
      let query = influxQueries.getActiveInstanceList(condition);
      influxDbService
        .executeQuery(query)
        .then((data) => {
          let condition = {
            where: {
              instancerefid: req.body.instancerefid,
              status: "Active",
            },
          } as any;
          commonService
            .getData(condition, db.Instances)
            .then((list) => {
              let result = { datacollected: false } as any;
              if (
                data &&
                data.length > 0 &&
                data[0].instancerefid == req.body.instancerefid
              ) {
                result = {
                  datacollected: true,
                  data: list,
                };
              } else {
                result = {
                  datacollected: false,
                  data: list,
                };
              }
              customValidation.generateSuccessResponse(
                result,
                response,
                constants.RESPONSE_TYPE_LIST,
                res,
                req
              );
            })
            .catch((e) => {
              console.log(e);
              customValidation.generateAppError(e, response, res, req);
            });
          // let refidArray = [];
          // data.forEach(element => {
          //     refidArray.push(element.instancerefid);
          // });
          // console.log(JSON.stringify(data));
          // let condition = {
          //     where: {
          //         status: 'Active',
          //         instancerefid: req.body.instancerefid ? req.body.instancerefid : { $notIn: refidArray },
          //         ...req['body']
          //     }, attributes: ['instancerefid', 'instancename', 'instanceid', 'tenantid', 'region']
          // } as any;
          // commonService.getAllList(condition, db.Instances).then((missinginstances) => {
          //     condition.where.instancerefid = { $in: refidArray }
          //     commonService.getAllList(condition, db.Instances).then((instances) => {
          //         let list = { instances, missinginstances };
          //         customValidation.generateSuccessResponse(list, response, constants.RESPONSE_TYPE_LIST, res, req);
          //     }).catch((e) => {
          //         customValidation.generateAppError(e, response, res, req);
          //     });
          // }).catch((e) => {
          //     customValidation.generateAppError(e, response, res, req);
          // });
        })
        .catch((e) => {
          customValidation.generateAppError(e, response, res, req);
        });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  getTotalCost(req: Request, res: Response): void {
    let response = {
      reference: modules.INSTANCE,
    };
    try {
      let q = queries.ASSET_COST_CHART;
      let startdate = moment().startOf("month").format("YYYY-MM-DD");
      let enddate = moment().endOf("month").format("YYYY-MM-DD");
      let params = {
        replacements: {
          tenantid: req.query.tenantid,
          startdt: startdate,
          enddt: enddate,
          cloudprovider: req.query.cloudprovider,
        },
        type: db.sequelize.QueryTypes.SELECT,
      };
      commonService
        .executeQuery(q, params, db.sequelize)
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
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  getAssetsByFilter(req: Request, res: Response): void {
    const response = {
      reference: modules.ASSET_MANAGEMENT,
    };
    try {
      let filters = req.body as AssetFilters;
      let parameters = {} as any;
      let cloudprovider = filters.provider;
      parameters = {
        where: req.body.data,
        order: [["lastupdateddt", "desc"]],
        include: [],
      };
      if (
        constants.RESOURCE_TYPES[2] == filters.asset ||
        constants.RESOURCE_TYPES[3] == filters.asset ||
        constants.RESOURCE_TYPES[4] == filters.asset ||
        constants.RESOURCE_TYPES[5] == filters.asset ||
        constants.RESOURCE_TYPES[6] == filters.asset ||
        constants.RESOURCE_TYPES[8] == filters.asset ||
        constants.RESOURCE_TYPES[11] == filters.asset ||
        constants.RESOURCE_TYPES[12] == filters.asset
      ) {
        delete parameters["where"]["cloudprovider"];
      }

      if (filters.asset == constants.RESOURCE_TYPES[19]) {
        customValidation.generateSuccessResponse(
          { assets: [], headers: [] },
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
        return;
      }
      if (req.body.order) {
        let order = req.body.order;
        parameters.order = [req.body.order];
        if (filters.asset == constants.RESOURCE_TYPES[0]) {
          if (order[0] == "vcpu") {
            parameters.order = [
              [{ model: db.awsinsttype, as: "awsinstance" }, "vcpu", order[1]],
            ];
          }
          if (order[0] == "memory") {
            parameters.order = [
              [
                { model: db.awsinsttype, as: "awsinstance" },
                "memory",
                order[1],
              ],
            ];
          }
        }
        if (filters.asset == constants.RESOURCE_TYPES[4]) {
          if (order[0] == "awssubnetd") {
            parameters.order = [
              [{ model: db.awssubnet, as: "lbsubnet" }, "awssubnetd", order[1]],
            ];
          }
          if (order[0] == "awssecuritygroupid") {
            parameters.order = [
              [
                { model: db.awssg, as: "lbsecuritygroup" },
                "awssecuritygroupid",
                order[1],
              ],
            ];
          }
        }
        if (
          filters.asset == constants.RESOURCE_TYPES[6] ||
          filters.asset == constants.RESOURCE_TYPES[3]
        ) {
          if (order[0] == "awsvpcid") {
            parameters.order = [
              [{ model: db.awsvpc, as: "awsvpc" }, "awsvpcid", order[1]],
            ];
          }
        }
        if (filters.asset == constants.RESOURCE_TYPES[2]) {
          if (order[0] == "instancetyperefid") {
            parameters.order = [
              [
                { model: db.Instances, as: "instance" },
                "instancetyperefid",
                order[1],
              ],
            ];
          }
          if (order[0] == "instancename") {
            parameters.order = [
              [
                { model: db.Instances, as: "instance" },
                "instancename",
                order[1],
              ],
            ];
          }
        }
        if (order[0] == "customer") {
          parameters.order = [
            [{ model: db.Customer, as: "customer" }, "customername", order[1]],
          ];
        }
        if (order[0] == "zone") {
          parameters.order = [
            [
              { model: db.awszones, as: "awszones" },
              "zonename",
              req.body.order[1],
            ],
          ];
        }
        if (
          (filters.asset == constants.RESOURCE_TYPES[11] ||
            filters.asset == constants.RESOURCE_TYPES[12] ||
            filters.asset == constants.RESOURCE_TYPES[13] ||
            filters.asset == constants.RESOURCE_TYPES[14]) &&
          order[0] === "region"
        ) {
          parameters.order = [
            [
              { model: db.TenantRegion, as: "tenantregion" },
              "region",
              req.body.order[1],
            ],
          ];
        }
        if (order[0] == "costs") {
          parameters.order = [
            [
              { model: db.awsinsttype, as: "awsinstance" },
              { model: db.CostVisual, as: "costvisual" },
              "priceperunit",
              req.body.order[1],
            ],
          ];
        }
      }
      // If Customers list provided
      // if (!_.isEmpty(filters.customers) && !_.isUndefined(filters.customers) && filters.customers.length > 0) {
      //     parameters.where = { '$assetmapping.customerid$': { $in: filters.customers } };
      // }
      let domain = assetTableMaps[filters.provider][filters.asset];
      // Get Zone detail & Customer detail joined.
      if (filters.provider == "ECL2") {
        // if (_.isEmpty(filters.customers)) {
        //     parameters.include.push({
        //         model: db.Customer, as: 'customer', attributes: ['customername', 'customerid']
        //     });
        // }
        // if (_.isEmpty(filters.zone)) {
        //     parameters.include.push({
        //         model: db.ecl2zones, as: 'ecl2zones', attributes: ['zonename', 'region']
        //     });
        // }

        if (filters.asset == "ASSET_INSTANCE") {
          parameters["where"]["cloudprovider"] = cloudprovider;
          parameters.attributes = [
            "instancename",
            "zoneid",
            "region",
            "instancetyperefid",
            "lastupdateddt",
            "instancerefid",
            "lastupdatedby",
            "tnregionid",
            "instanceid",
          ];
          if (filters.rightsize && filters.rightsize != "Resized") {
            parameters["where"]["rightsizeyn"] = filters.rightsize;
          }
          if (filters.instanceid) {
            parameters["where"]["instanceid"] = filters.instanceid;
          }
          if (filters.instancerefid) {
            parameters["where"]["instancerefid"] = filters.instancerefid;
          }
          if (filters.promagentstat) {
            parameters["where"]["promagentstat"] = filters.promagentstat;
          }
          if (filters.ssmagentstatus) {
            parameters["where"]["ssmagentstatus"] = filters.ssmagentstatus;
          }
          if (filters.orchstatus) {
            parameters["where"]["orchstatus"] = filters.orchstatus;
          }
          if (filters.agentid) {
            parameters["where"]["agentid"] = filters.agentid;
          }
          parameters.include.push({
            model: db.ecl2zones,
            as: "ecl2zones",
            attributes: ["zonename", "region"],
          });
          // parameters.include.push({
          //     model: db.ecl2images, as: 'image', attributes: ['imagename', 'ecl2imageid', 'platform', 'notes']
          // });
          parameters.include.push({
            model: db.CostVisual,
            as: "costvisual",
            required: false,
            where: {
              status: constants.STATUS_ACTIVE,
              cloudprovider: cloudprovider,
              plantype: { $col: "Instances.instancetyperefid" },
              region: { $col: "Instances.region" },
            },
            order: [["lastupdateddt", "desc"]],
            attributes: ["pricingmodel", "priceperunit", "currency"],
          });
          // parameters.include.push({
          //     model: db.ecl2volumes, as: 'volume',
          // });
          // parameters.include.push({
          //     model: db.ecl2volumeattachment, as: 'ecl2attachedvolumes', required: false, where: { status: 'Active' }, attributes: ['instanceid', 'volumeid'], include: [{ model: db.ecl2volumes, required: false, as: 'volume', where: { status: 'Active' } }]
          // });
        }
        if (filters.asset == "ASSET_VOLUME") {
          // parameters.include.push({
          //     model: db.Instances, as: 'instance'
          // });
          // parameters.include.push({
          //     model: db.CostVisual, as: 'costvisual', required: false, where: {
          //         status: constants.STATUS_ACTIVE, cloudprovider: cloudprovider,
          //         plantype: { $col: 'ecl2volumes.size' },
          //         region: { $col: 'ecl2zones.region' }
          //     }
          // });
        }
        if (filters.asset == "ASSET_LB") {
          // parameters.include.push(
          //     {
          //         model: db.CostVisual, as: 'costvisual', required: false, where: {
          //             status: constants.STATUS_ACTIVE, cloudprovider: cloudprovider,
          //             plantype: { $col: 'ecl2loadbalancers.loadbalancerplan' },
          //             region: { $col: 'ecl2zones.region' }
          //         }
          //     });
        }
        if (filters.asset == "ASSET_FIREWALL") {
          // parameters.include.push(
          //     {
          //         model: db.ecl2vsrxplan, as: 'ecl2vsrxplan', attributes: ['vsrxplanid'], include: [{
          //             model: db.CostVisual, as: 'costvisual', required: false, where: {
          //                 status: constants.STATUS_ACTIVE, cloudprovider: cloudprovider,
          //                 plantype: { $col: 'ecl2vsrxplan.vsrxplanname' },
          //                 region: { $col: 'ecl2zones.region' }
          //             }
          //         }]
          //     }
          // );
        }
      }

      if (filters.provider == "AWS") {
        if (filters.asset == constants.RESOURCE_TYPES[0]) {
          // if (_.isEmpty(filters.customers)) {
          //     parameters.include.push({
          //         model: db.Customer, as: 'customer', attributes: ['customername', 'customerid']
          //     });
          // }
          parameters["where"]["cloudprovider"] = cloudprovider;
          // parameters.attributes = [
          //   "instancename",
          //   "zoneid",
          //   "region",
          //   "customerid",
          //   "instancetyperefid",
          //   "securitygrouprefid"
          //   "instancetypeid",
          //   "lastupdateddt",
          //   "instancerefid",
          //   "lastupdatedby",
          //   "tnregionid",
          //   "instanceid",
          // ];
          if (filters.rightsize && filters.rightsize != "Resized") {
            parameters["where"]["rightsizeyn"] = filters.rightsize;
          }
          if (filters.instanceid) {
            parameters["where"]["instanceid"] = filters.instanceid;
          }
          if (filters.instancerefid) {
            parameters["where"]["instancerefid"] = filters.instancerefid;
          }
          
          parameters["include"].push({
            model: db.CustomerAccount, as: 'accountdata', attributes: ['accountref']
          });
          // if (_.isEmpty(filters.zone)) {
          parameters.include.push({
            model: db.awszones,
            where: {},
            as: "awszones",
            order: [["lastupdateddt", "desc"]],
            attributes: ["zonename"],
            required: false,
          });
          // }
          parameters.include.push(
            {
              model: db.awsinsttype,
              as: "awsinstance",
              attributes: ["instancetypename", "vcpu", "memory"],
              include: [
                {
                  model: db.CostVisual,
                  as: "costvisual",
                  required: false,
                  where: {
                    status: constants.STATUS_ACTIVE,
                    cloudprovider: cloudprovider,
                    plantype: { $col: "awsinstance.instancetypename" },
                    region: { $col: "awszones.zonename" },
                  },
                  attributes: ["pricingmodel", "priceperunit", "currency"],
                },
              ],
            }
            //  {
            //   model: db.awssg, as: 'awssgs', required: false, paranoid: false, include: [{ model: db.awssgrules, as: 'awssgrules', required: false, paranoid: false, where: { status: constants.STATUS_ACTIVE } }]
            // }
          );
          parameters.include.push(
            // {
            //   model: db.awsami,
            //   as: "awsimage",
            //   attributes: ["aminame", "notes", "platform"],
            //   required: false,
            //   paranoid: false
            // },
            {
              model: db.Customer,
              as: "customer",
              attributes: ["customername", "customerid"],
              required: false,
              paranoid: false,
            }
          );
          // parameters.include = [
          // {
          //     model: db.awszones, as: 'awszones'
          // }
          // {
          //     model: db.awsinsttype, as: 'awsinstance',
          //     include: [{
          //         model: db.CostVisual, as: 'costvisual', required: false, where: {
          //             status: constants.STATUS_ACTIVE, cloudprovider: cloudprovider,
          //             plantype: { $col: 'awsinstance.instancetypename' },
          //             region: { $col: 'awszones.zonename' }
          //         }
          //     }]
          // },
          // {
          //     model: db.awsvolumes, as: 'awsvolume'
          // },
          // {
          //     model: db.awssg, as: 'awssgs', required: false, paranoid: false, include: [{ model: db.awssgrules, as: 'awssgrules', required: false, paranoid: false }]
          // },
          // {
          //     model: db.awsami, as: 'awsimage',
          // }, {
          //     model: db.awsvolumeattachment, as: 'attachedvolumes', required: false, where: { status: 'Active' }, attributes: ['instanceid', 'volumeid'], include: [{ model: db.awsvolumes, as: 'volume', required: false, where: { status: 'Active' } }]
          // }
          // ];
        }
        if (filters.asset == constants.RESOURCE_TYPES[2]) {
          // parameters.include = [{
          //     model: db.Instances, as: 'instance', attributes: ['instancename', 'instancetyperefid']
          // }, {
          //     model: db.TenantRegion, as: 'tenantregion', required: false, attributes: ['region']
          // }, {
          //     model: db.CostVisual, as: 'costvisual', required: false, where: {
          //         status: constants.STATUS_ACTIVE, cloudprovider: cloudprovider,
          //         plantype: { $col: 'awsvolumes.sizeingb' }
          //     }
          // }];
          parameters.include.push({
            model: db.Instances,
            as: "instance",
            attributes: ["instancename", "instancetyperefid"],
          });
        }
        if (filters.asset == constants.RESOURCE_TYPES[3]) {
          parameters.include = [
            {
              model: db.awssgrules,
              as: "awssgrules",
              required: false,
              paranoid: false,
              where: { status: constants.STATUS_ACTIVE },
            },
          ];
        }
        if (filters.asset == constants.RESOURCE_TYPES[4]) {
          parameters.include = [
            {
              model: db.awssolution,
              as: "awssolution",
              required: false,
              paranoid: false,
            },
            {
              model: db.awssubnet,
              as: "lbsubnet",
              required: false,
              paranoid: false,
              where: { status: constants.STATUS_ACTIVE },
            },
            {
              model: db.awssg,
              as: "lbsecuritygroup",
              required: false,
              paranoid: false,
              where: { status: constants.STATUS_ACTIVE },
              include: [
                {
                  model: db.awssgrules,
                  as: "awssgrules",
                  required: false,
                  paranoid: false,
                  where: { status: constants.STATUS_ACTIVE },
                },
              ],
            },
            {
              model: db.CostVisual,
              as: "costvisual",
              required: false,
              where: {
                status: constants.STATUS_ACTIVE,
                cloudprovider: cloudprovider,
                plantype: { $col: "awslb.securitypolicy" },
              },
            },
          ];
        }
        if (filters.asset == constants.RESOURCE_TYPES[5]) {
          parameters.include = [
            {
              model: db.awssubnet,
              as: "subnets",
              attributes: ["subnetname", "awssubnetd", "ipv4cidr"],
              required: false,
              where: { status: constants.STATUS_ACTIVE },
            },
            {
              model: db.awsinternetgateway,
              as: "gateway",
              attributes: ["gatewayname", "awsinternetgatewayid", "notes"],
              required: false,
              where: { status: constants.STATUS_ACTIVE },
            },
          ];
        }
        if (filters.asset == constants.RESOURCE_TYPES[8]) {
          parameters.include = [
            {
              model: db.awsvpc,
              as: "vpc",
              attributes: ["vpcname", "awsvpcid"],
              required: false,
              where: { status: constants.STATUS_ACTIVE },
            },
          ];
        }
        if (
          filters.asset == constants.RESOURCE_TYPES[6] ||
          filters.asset == constants.RESOURCE_TYPES[3]
        ) {
          parameters.include.push({
            model: db.awsvpc,
            as: "awsvpc",
            attributes: ["vpcname", "awsvpcid"],
            required: false,
          });
        }
        if (
          filters.asset == constants.RESOURCE_TYPES[11] ||
          filters.asset == constants.RESOURCE_TYPES[12] ||
          filters.asset == constants.RESOURCE_TYPES[13] ||
          filters.asset == constants.RESOURCE_TYPES[14]
        ) {
          if (filters.asset == constants.RESOURCE_TYPES[11]) {
            parameters.where.assettype = "S3";
          } else if (filters.asset == constants.RESOURCE_TYPES[12]) {
            parameters.where.assettype = "RDS";
          } else if (filters.asset == constants.RESOURCE_TYPES[13]) {
            parameters.where.assettype = "ECS";
          } else {
            parameters.where.assettype = "EKS";
          }
        }
      }
      if (filters.asset == "ASSET_INSTANCE" && filters.rightsize == "Resized") {
        parameters.include.push({
          model: db.UpgradeRequest,
          as: "resizedata",
          where: { reqstatus: constants.STATUS_SRM[1] },
          attributes: ["resourcetype"],
          include: [
            {
              model: db.CostVisual,
              as: "upgradeplan",
              attributes: ["plantype", "unit"],
            },
            {
              model: db.CostVisual,
              as: "currentplan",
              attributes: ["plantype", "unit"],
            },
          ],
        });
      }
      if (filters.datacollection && filters.datacollection == "Y") {
        parameters.include.push({
          model: db.AsstUtlDaily,
          as: "dailycollection",
          required: true,
          attributes: ["instanceid", "instancerefid"],
          where: {
            date: {
              $between: [
                moment().subtract(1, "days").format("YYYY-MM-DD"),
                moment().subtract(1, "days").format("YYYY-MM-DD"),
              ],
            },
          },
        });
        parameters["group"] = ["Instances.instancerefid"];
      }
      if (filters.datacollection && filters.datacollection == "N") {
        parameters.include.push({
          model: db.AsstUtlDaily,
          as: "dailycollection",
          required: false,
          paranoid: false,
          attributes: ["instanceid", "instancerefid"],
          where: {
            date: {
              $notIn: [moment().subtract(1, "days").format("YYYY-MM-DD")],
            },
          },
        });
        parameters["group"] = ["Instances.instancerefid"];
      }
      if (
        filters.provider == constants.CLOUDPROVIDERS[0]
      ) {
        let regionJoin: any = {
          model: db.TenantRegion,
          as: "tenantregion",
          attributes: ["customerid", "region"],
          where: {
            cloudprovider: filters.provider,
          },
        };
        parameters.include.push(regionJoin);

        if (filters.customers) {
          regionJoin.where.customerid = { $in: filters.customers };
        }
        if (filters.accounts) {
          regionJoin.where._accountid = { $in: filters.accounts };
        }
        if (filters.zone) {
          regionJoin.where.region = { $in: filters.zone };
        }
      }
      if (
        filters.provider != constants.CLOUDPROVIDERS[0]
      ) {
        if (filters.customers) {
          parameters.where.customerid = { $in: filters.customers };
        }
        if (filters.accounts) {
          parameters.where.accountid = { $in: filters.accounts };
        }
        parameters.include = [
          {
            model: db.Customer,
            as: "customer",
            required: false,
            attributes: ["customername"],
            seperate: true,
          },
        ];
      }
      // let assetMapJoin = {
      //     model: db.AssetMapping, as: 'assetmapping', required: false, attributes: ['assetmappingid', 'customerid'],
      //     where: { status: constants.STATUS_ACTIVE, resourcetype: filters.asset }
      // } as any;
      // if (filters.customers) {
      //     assetMapJoin.where.customerid = { $in: filters.customers };
      //     assetMapJoin.required = true;
      //     assetMapJoin.paranoid = true;
      //     // parameters.where['$assetmapping.customerid$'] = { $in: filters.customers };
      // }

      if (filters.promagentstat) {
        parameters["where"]["promagentstat"] = filters.promagentstat;
      }
      if (filters.agentid) {
        parameters["where"]["agentid"] = filters.agentid;
      }
      if (filters.ssmagentstatus) {
        parameters["where"]["ssmagentstatus"] = filters.ssmagentstatus;
      }
      if (filters.orchstatus) {
        parameters["where"]["orchstatus"] = filters.orchstatus;
      }
      // Search
      if (req.body.searchText && req.body.headers) {
        let searchparams: any = {};
        parameters["subQuery"] = false;
        if (Array.isArray(req.body.headers) && req.body.headers.length > 0) {
          req.body.headers.forEach((element) => {
            if (element.field != "lastupdateddt") {
              if (element.field === "customer") {
                searchparams["$customer.customername$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
              } else if (filters.provider == "ECL2" && element.field === "zone") {
                searchparams["$ecl2zones.zonename$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
              } else if (filters.provider == "AWS" && element.field === "zone") {
                if (req.body.group) parameters.group = ["zonename"];
                searchparams["$awszones.zonename$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
              } else if (
                filters.asset == constants.RESOURCE_TYPES[0] &&
                (element.field === "memory" || element.field === "vcpu")
              ) {
                searchparams["$awsinstance.memory$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
                searchparams["$awsinstance.vcpu$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
              } else if (
                (filters.asset == constants.RESOURCE_TYPES[3] ||
                  filters.asset == constants.RESOURCE_TYPES[6]) &&
                element.field === "awsvpcid"
              ) {
                searchparams["$awsvpc.awsvpcid$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
              } else if (
                filters.asset == constants.RESOURCE_TYPES[2] &&
                (element.field === "instancename" ||
                  element.field === "instancetyperefid")
              ) {
                searchparams["$instance.instancename$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
                searchparams["$instance.instancetyperefid$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
              } else if (
                filters.asset == constants.RESOURCE_TYPES[4] &&
                (element.field === "awssubnetd" ||
                  element.field === "awssecuritygroupid")
              ) {
                searchparams["$lbsubnet.awssubnetd$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
                searchparams["$lbsecuritygroup.awssecuritygroupid$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
              } else if (
                (filters.asset == constants.RESOURCE_TYPES[11] ||
                  filters.asset == constants.RESOURCE_TYPES[12] ||
                  filters.asset == constants.RESOURCE_TYPES[13] ||
                  filters.asset == constants.RESOURCE_TYPES[14]) &&
                element.field === "region"
              ) {
                searchparams["$tenantregion.region$"] = {
                  $like: "%" + req.body.searchText + "%",
                };
              } else {
                searchparams[element.field] = {
                  $like: "%" + req.body.searchText + "%",
                };
                if (req.body.group) parameters.group = [element.field];
              }
            }
          });
        }
        delete searchparams["costs"];
        parameters.where["$or"] = searchparams;
        parameters.where = _.omit(parameters.where, [
          "searchText",
          "headers",
          "group",
        ]);
      }

      if (Array.isArray(req.body.filterby) && req.body.filterby.length > 0) {
        req.body.filterby.forEach((element) => {
          if (element.key == "zonename") {
            let zoneindex = parameters.include.findIndex((el) => {
              return el.as == "awszones";
            });
            parameters.include[zoneindex].where["zonename"] = {
              $in: element.value,
            };
          } else {
            parameters.where[element.key] = { $in: element.value };
          }
        });
        parameters.where = _.omit(parameters.where, ["filterby"]);
      }

      if (req.body.tagcompliance) {
        if (
          filters.asset == constants.RESOURCE_TYPES[0] ||
          filters.asset == constants.RESOURCE_TYPES[1] ||
          filters.asset == constants.RESOURCE_TYPES[3] ||
          filters.asset == constants.RESOURCE_TYPES[4] ||
          filters.asset == constants.RESOURCE_TYPES[5] ||
          filters.asset == constants.RESOURCE_TYPES[6] ||
          filters.asset == constants.RESOURCE_TYPES[15]
        ) {
          parameters.include.push({
            model: db.TagValues,
            as: "tagvalues",
            paranoid: false,
            required: false,
            where: {
              cloudprovider: cloudprovider,
              resourcetype: filters.asset,
              status: constants.STATUS_ACTIVE,
              tagid: { [Op.ne]: null },
            },
            include: [
              {
                model: db.Tags,
                as: "tag",
              },
            ],
          });
        }
      }

      let headers = [];

      if (filters.tagid) {
        getTagResource();
      } else {
        getAssets();
      }

      // tslint:disable-next-line:no-inner-declarations
      function getTagResource() {
        let tagCndtn = {
          tagid: filters.tagid,
          status: "Active",
          cloudprovider: filters.provider,
          resourceType: filters.asset,
        };

        if (filters.tagvalue) {
          tagCndtn["tagvalue"] = filters.tagvalue;
        }

        CommonService.getAllList(
          {
            where: tagCndtn,
          },
          db.TagValues
        )
          .then((assets) => {
            if (assets && assets.length > 0) {
              let resourceIds = [];
              assets.forEach((o) => {
                if (
                  o.dataValues["resourceid"] &&
                  o.dataValues["resourceid"] != null
                )
                  resourceIds.push(o.dataValues["resourceid"]);
              });
              if (resourceIds && resourceIds.length > 0 && filters.tagvalue) {
                if (filters.provider == "ECL2") {
                  req.body.data[ecl2TableKeyMaps[filters.asset]] = {
                    $in: resourceIds,
                  };
                }
                if (filters.provider == "AWS") {
                  req.body.data[awsTableKeyMaps[filters.asset]] = {
                    $in: resourceIds,
                  };
                }
                if (
                  filters.provider != constants.CLOUDPROVIDERS[0]
                ) {
                  req.body.data[vmwareTableKeyMaps[filters.asset]] = {
                    $in: resourceIds,
                  };
                }
              }
              if (resourceIds && resourceIds.length > 0 && !filters.tagvalue) {
                if (filters.provider == "ECL2") {
                  req.body.data[ecl2TableKeyMaps[filters.asset]] = {
                    [Op.notIn]: resourceIds,
                  };
                }
                if (filters.provider == constants.CLOUDPROVIDERS[0]) {
                  req.body.data[awsTableKeyMaps[filters.asset]] = {
                    $in: resourceIds,
                  };
                }
                if (
                  filters.provider != constants.CLOUDPROVIDERS[0]
                ) {
                  req.body.data[vmwareTableKeyMaps[filters.asset]] = {
                    $in: resourceIds,
                  };
                }
              }
              getAssets();
            } else {
              if (filters.tagvalue) {
                customValidation.generateSuccessResponse(
                  { assets: [], headers: [] },
                  response,
                  constants.RESPONSE_TYPE_LIST,
                  res,
                  req
                );
              } else getAssets();
            }
          })
          .catch((err) => {
            console.log(err);
            customValidation.generateAppError(err, response, res, req);
          });
      }
      // tslint:disable-next-line:no-inner-declarations
      function getAssets() {
        if (req.query.limit && !req.query.download)
          parameters.limit = req.query.limit;
        if (req.query.offset && !req.query.download)
          parameters.offset = req.query.offset;
        let countqueryparams = { ...parameters };
        if (filters.datacollection) {
          countqueryparams.distinct = true;
          countqueryparams.col = "instanceid";
          delete countqueryparams["group"];
          // countqueryparams.attributes = [sequelize.fn('COUNT', (sequelize.fn('DISTINCT', sequelize.col('Instances.instanceid'))))]
        }
        let tagModel = countqueryparams.include.findIndex((el) => {
          return el.as == "tagvalues";
        });
        if (tagModel && tagModel != -1) {
          countqueryparams.include = [...countqueryparams.include];
          countqueryparams.include.splice(tagModel, 1);
        }
        if (req.query.assetonly) {
          parameters.include = parameters.include;
          parameters.where = {
            ...req.body.data,
            ...req.body.query,
          };
          CommonService.getAllList(parameters, domain)
            .then((list) => {
              if (list && list.length > 0) {
                let d = list.map((obj) => {
                  let o = obj.dataValues;
                  if (o["accountdata"]) {
                    o["accountref"] = o["accountdata"]["accountref"];
                  }
                  if (o["awsimage"]) {
                    o["aminame"] = o["awsimage"]["aminame"];
                    o["notes"] = o["awsimage"]["notes"];
                  }
                  if (o["awsvpc"]) {
                    o["awsvpcid"] = o["awsvpc"]["awsvpcid"];
                  }
                  if (o["lbsubnet"]) {
                    o["awssubnetd"] = o["lbsubnet"]["awssubnetd"];
                  }
                  if (o["lbsecuritygroup"]) {
                    o["awssecuritygroupid"] =
                      o["lbsecuritygroup"]["awssecuritygroupid"];
                  }
                  if (o["awsinstance"]) {
                    o["vcpu"] = o["awsinstance"]["vcpu"];
                    o["memory"] = o["awsinstance"]["memory"];
                  }
                  if (o["instance"]) {
                    o["instancename"] = o["instance"]["instancename"];
                    o["instancetyperefid"] = o["instance"]["instancetyperefid"];
                  }
                  if (o["ecl2zones"]) {
                    o["zone"] = o["ecl2zones"]["zonename"];
                  }
                  if (o["awszones"]) {
                    o["zone"] = o["awszones"]["zonename"];
                  }
                  if (o["tenantregion"]) {
                    o["region"] = o["tenantregion"]["region"];
                  }
                  if (o["customer"]) {
                    o["customerdetail"] = o["customer"];
                    o["customer"] = o["customer"]["customername"];
                  }
                  o["lastupdatedby"] = o["lastupdatedby"];
                  o["lastupdateddt"] = o["lastupdateddt"];
                  return o;
                });
                let keys = Object.keys(d[0]);
                function array_move(arr, old_index, new_index) {
                  if (new_index >= arr.length) {
                    var k = new_index - arr.length + 1;
                    while (k--) {
                      arr.push(undefined);
                    }
                  }
                  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
                  return arr; // for testing
                }
                customValidation.generateSuccessResponse(
                  { assets: d, count: 0 },
                  response,
                  constants.RESPONSE_TYPE_LIST,
                  res,
                  req
                );
              } else {
                customValidation.generateSuccessResponse(
                  { assets: [], headers: [], count: 0 },
                  response,
                  constants.RESPONSE_TYPE_LIST,
                  res,
                  req
                );
              }
            })
            .catch((error: Error) => {
              console.log(error);
              customValidation.generateAppError(error, response, res, req);
            });
        } else {
          countqueryparams.distinct = true;
          CommonService.getCount(countqueryparams, domain).then((count) => {
            parameters.include.map((itm) => {
              itm["seperate"] = true;
              return itm;
            });
            CommonService.getAllList(parameters, domain)
              .then((list) => {
                if (list && list.length > 0) {
                  let d = list.map((obj) => {
                    let o = obj.dataValues;
                    if (o["accountdata"]) {
                      o["accountref"] = o["accountdata"]["accountref"];
                    }
                    if (o["awsimage"]) {
                      o["aminame"] = o["awsimage"]["aminame"];
                      o["notes"] = o["awsimage"]["notes"];
                    }
                    if (o["awsvpc"]) {
                      o["awsvpcid"] = o["awsvpc"]["awsvpcid"];
                    }
                    if (o["lbsubnet"]) {
                      o["awssubnetd"] = o["lbsubnet"]["awssubnetd"];
                    }
                    if (o["lbsecuritygroup"]) {
                      o["awssecuritygroupid"] =
                        o["lbsecuritygroup"]["awssecuritygroupid"];
                    }
                    if (o["awsinstance"]) {
                      o["vcpu"] = o["awsinstance"]["vcpu"];
                      o["memory"] = o["awsinstance"]["memory"];
                    }
                    if (o["instance"]) {
                      o["instancename"] = o["instance"]["instancename"];
                      o["instancetyperefid"] =
                        o["instance"]["instancetyperefid"];
                    }
                    if (o["ecl2zones"]) {
                      o["zone"] = o["ecl2zones"]["zonename"];
                    }
                    if (o["awszones"]) {
                      o["zone"] = o["awszones"]["zonename"];
                    }
                    if (o["tenantregion"]) {
                      o["region"] = o["tenantregion"]["region"];
                    }
                    if (o["customer"]) {
                      o["customerdetail"] = o["customer"];
                      o["customer"] = o["customer"]["customername"];
                    }
                    o["lastupdatedby"] = o["lastupdatedby"];
                    o["lastupdateddt"] = o["lastupdateddt"];
                    return o;
                  });
                  let keys = Object.keys(d[0]);
                  function array_move(arr, old_index, new_index) {
                    if (new_index >= arr.length) {
                      var k = new_index - arr.length + 1;
                      while (k--) {
                        arr.push(undefined);
                      }
                    }
                    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
                    return arr; // for testing
                  }
                  // for (let index = 0; index < keys.length; index++) {
                  //   if (filters.provider == "ECL2") {
                  //     if (ecl2ColumnNameMaps[keys[index]]) {
                  //       headers.push({
                  //         field: keys[index],
                  //         header: ecl2ColumnNameMaps[keys[index]],
                  //         datatype:
                  //           keys[index] == "lastupdateddt"
                  //             ? "timestamp"
                  //             : "string",
                  //       });
                  //       if (
                  //         index == keys.length - 1 &&
                  //         filters.asset == "ASSET_INSTANCE"
                  //       ) {
                  //         let i: any = headers.findIndex(function (d: any) {
                  //           if (d.field == "zone") {
                  //             return d;
                  //           }
                  //         });
                  //         headers = array_move(headers, i, 1);
                  //         // cost header
                  //         headers.push({
                  //           field: "costs",
                  //           header: "Cost (Monthly)",
                  //           datatype: "number",
                  //         });
                  //         let costindex: any = headers.findIndex(function (
                  //           d: any
                  //         ) {
                  //           if (d.field == "costs") {
                  //             return d;
                  //           }
                  //         });
                  //         headers = array_move(headers, costindex, 4);
                  //       }
                  //     }
                  //   }
                  //   if (filters.provider == "AWS") {
                  //     if (awsColumnNameMaps[keys[index]]) {
                  //       headers.push({
                  //         field: keys[index],
                  //         header: awsColumnNameMaps[keys[index]].field,
                  //         isfilter: awsColumnNameMaps[keys[index]].filter,
                  //         datatype:
                  //           keys[index] == "lastupdateddt"
                  //             ? "timestamp"
                  //             : "string",
                  //       });
                  //       if (
                  //         index == keys.length - 1 &&
                  //         filters.asset == "ASSET_INSTANCE"
                  //       ) {
                  //         let i: any = headers.findIndex(function (d: any) {
                  //           if (d.field == "zone") {
                  //             return d;
                  //           }
                  //         });
                  //         headers = array_move(headers, i, 1);
                  //         // cost header
                  //         headers.push({
                  //           field: "costs",
                  //           header: "Cost (Monthly)",
                  //           datatype: "number",
                  //         });
                  //         let costindex: any = headers.findIndex(function (
                  //           d: any
                  //         ) {
                  //           if (d.field == "costs") {
                  //             return d;
                  //           }
                  //         });
                  //         headers = array_move(headers, costindex, 4);
                  //       }
                  //     }
                  //   }
                  // }
                  if (req.query.download) {
                    if (filters.asset == "ASSET_INSTANCE") {
                      CommonService.getAllList(
                        {
                          where: {
                            lookupkey: "PRICING_MODEL",
                            status: "Active",
                          },
                        },
                        db.LookUp
                      ).then((pricings) => {
                        if (pricings) {
                          d.map((i) => {
                            i.costs = 0;
                            if (
                              i.awsinstance &&
                              i.awsinstance.costvisual &&
                              i.awsinstance.costvisual.length > 0
                            ) {
                              i.costs = AssetService.getMonthlyPrice(
                                pricings,
                                i.awsinstance.costvisual[0].pricingmodel,
                                i.awsinstance.costvisual[0].priceperunit,
                                i.awsinstance.costvisual[0].currency
                              );
                            }
                            if (i.costvisual && i.costvisual.length > 0) {
                              i.costs = AssetService.getMonthlyPrice(
                                pricings,
                                i.costvisual[0].pricingmodel,
                                i.costvisual[0].priceperunit,
                                i.costvisual[0].currency
                              );
                            }
                          });
                          let template = {
                            content: AssetListTemplate,
                            engine: "handlebars",
                            helpers: CommonHelper,
                            recipe: "html-to-xlsx",
                          };
                          let data = { lists: d, headers: req.body.headers };
                          DownloadService.generateFile(
                            data,
                            template,
                            (result) => {
                              customValidation.generateSuccessResponse(
                                result,
                                response,
                                constants.RESPONSE_TYPE_LIST,
                                res,
                                req
                              );
                            }
                          );
                        }
                      });
                    } else {
                      let template = {
                        content: AssetListTemplate,
                        engine: "handlebars",
                        helpers: CommonHelper,
                        recipe: "html-to-xlsx",
                      };
                      let data = { lists: d, headers: req.body.headers };
                      DownloadService.generateFile(data, template, (result) => {
                        customValidation.generateSuccessResponse(
                          result,
                          response,
                          constants.RESPONSE_TYPE_LIST,
                          res,
                          req
                        );
                      });
                    }
                  } else {
                    customValidation.generateSuccessResponse(
                      { assets: d, count: count },
                      response,
                      constants.RESPONSE_TYPE_LIST,
                      res,
                      req
                    );
                  }
                } else {
                  customValidation.generateSuccessResponse(
                    { assets: [], headers: [], count: 0 },
                    response,
                    constants.RESPONSE_TYPE_LIST,
                    res,
                    req
                  );
                }
              })
              .catch((error: Error) => {
                console.log(error);
                customValidation.generateAppError(error, response, res, req);
              });
          });
        }
      }
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }

  getAssetsCount(req: Request, res: Response): void {
    let response = {
      reference: modules.ASSET_MANAGEMENT,
    };
    try {
      let query = `(select 'ECL2' as cloudprovider,'Instance' as assettype,count(instanceid) as value 
            from tbl_tn_instances where tenantid=:tenantid AND cloudprovider='ECL2' and status='Active')
            UNION (select 'ECL2' as cloudprovider,'Network' as assettype,count(networkid) as value 
            from tbl_ecl2_networks where tenantid=:tenantid and status='Active')
            UNION (select 'ECL2' as cloudprovider,'LB' as assettype,count(loadbalancerid) as value 
            from tbl_ecl2_loadbalancers where tenantid=:tenantid and status='Active')
            UNION (select 'ECL2' as cloudprovider,'Security Groups' as assettype,count(vsrxid) as value 
            from tbl_ecl2_vsrx where tenantid=:tenantid and status='Active')
            UNION (select 'ECL2' as cloudprovider,'Internet Gateway' as assettype,count(internetgatewayid) as value 
            from tbl_ecl2_internetgateways where tenantid=:tenantid and status='Active')
            UNION (select 'ECL2' as cloudprovider,'Volume' as assettype,count(volumeid) as value 
            from tbl_ecl2_volumes where tenantid=:tenantid and status='Active')
            UNION (select 'ECL2' as cloudprovider,'REGION' as assettype,GROUP_CONCAT(DISTINCT region) as value 
            from tbl_tn_regions where tenantid=:tenantid and region is not null and length(region) > 0 and status='Active')
            UNION (select 'AWS' as cloudprovider,'Instance' as assettype,count(instanceid) as value 
            from tbl_tn_instances where tenantid=:tenantid AND cloudprovider='AWS' and status='Active')
            UNION (select 'AWS' as cloudprovider,'Network' as assettype,count(vpcid) as value 
            from tbl_aws_vpc where tenantid=:tenantid and status='Active')
            UNION (select 'AWS' as cloudprovider,'LB' as assettype,count(lbid) as value 
            from tbl_aws_loadbalancer where tenantid=:tenantid and status='Active')
            UNION (select 'AWS' as cloudprovider,'Security Groups' as assettype,count(securitygroupid) as value 
            from tbl_aws_securitygroup where tenantid=:tenantid and status='Active')
            UNION (select 'AWS' as cloudprovider,'Internet Gateway' as assettype,0 as value)
            UNION (select 'AWS' as cloudprovider,'Volume' as assettype,count(volumeid) as value 
            from tbl_aws_volumes where tenantid=:tenantid and status='Active')
            UNION (select 'AWS' as cloudprovider,'REGION' as assettype,GROUP_CONCAT(DISTINCT region) as value 
            from tbl_tn_regions where tenantid=:tenantid and region is not null and length(region) > 0 and status='Active') `;
      let params = {
        replacements: {
          tenantid: req.query.tenantid,
        },
        type: db.sequelize.QueryTypes.SELECT,
      };
      commonService
        .executeQuery(query, params, db.sequelize)
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
      // } else {
      //     customValidation.generateAppError(new AppError('Invalid asset type'), response, res, req);
      // }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  processInstance(req: Request, res: Response): void {
    let response = {
      reference: modules.ASSET_MANAGEMENT,
      message: "",
    };
    try {
      if (req.params.action != undefined && req.params.action != null) {
        let instancerefid = req.body.instancerefid; // req.body.instancerefid
        let instanceQry = {
          where: {
            instancerefid: instancerefid,
            status: constants.STATUS_ACTIVE,
            tenantid: req.body.tenantid,
          },
          include: [
            {
              model: db.TenantRegion,
              as: "tenantregion",
              include: [
                {
                  as: "accountdata",
                  model: db.CustomerAccount,
                  required: false,
                  attributes: ["rolename"],
                  where: { status: constants.STATUS_ACTIVE },
                },
              ],
            },
          ],
        };
        db.Instances.findOne(instanceQry).then((instance: any) => {
          if (instance != null) {
            if (instance["dataValues"]["cloudprovider"] == "AWS") {
              AWS.config.region =
                instance["dataValues"]["tenantregion"][0]["region"];
              AWSService.getCredentials(
                instance["dataValues"]["tenantregion"][0],
                req.body.tenantid
              )
                .then((awsCredentials: any) => {
                  AWS.config.update(awsCredentials);
                  let ec2 = new AWS.EC2({
                    apiVersion: constants.AWS_EC2_APIVERSION,
                  });
                  AWSService.vmAction(
                    req.params.action,
                    ec2,
                    instance["dataValues"],
                    req.body
                  )
                    .then((result) => {
                      response.message = result.message;
                      if (req.params.action == "snapshot" && result.status) {
                        _.map(result.data.Snapshots, (itm) => {
                          let obj = {
                            tenantid: req.body.tenantid,
                            _accountid:
                              instance["dataValues"]["tenantregion"][0][
                              "_accountid"
                              ],
                            _customer: instance["dataValues"]["customerid"],
                            module: "OPERATION",
                            referenceid: instance["dataValues"]["instanceid"],
                            referencetype: "ASSET_INSTANCE",
                            cloudprovider: constants.CLOUD_AWS,
                            eventtype: "VM_" + req.params.action.toUpperCase(),
                            severity: "Medium",
                            eventdate: new Date(),
                            providerrefid:
                              instance["dataValues"]["instancerefid"],
                            references: req.body.SnapshotId ? req.body.SnapshotId : itm.SnapshotId,
                            meta: JSON.stringify(itm),
                            notes: result.status
                              ? result.message
                              : result.notes,
                            createddt: new Date(),
                            createdby: req.body.updatedby,
                            status: constants.STATUS_ACTIVE,
                          };
                          db.eventlog.create(obj);
                        });
                      } else {
                        db.eventlog.create({
                          tenantid: req.body.tenantid,
                          _accountid:
                            instance["dataValues"]["tenantregion"][0][
                            "_accountid"
                            ],
                          _customer: instance["dataValues"]["customerid"],
                          regionid:
                            instance["dataValues"]["tenantregion"][0][
                            "tnregionid"
                            ],
                          module: "OPERATION",
                          referencetype: "ASSET_INSTANCE",
                          cloudprovider: constants.CLOUD_AWS,
                          eventtype: "VM_" + req.params.action.toUpperCase(),
                          severity: "Medium",
                          eventdate: new Date(),
                          providerrefid:
                            instance["dataValues"]["instancerefid"],
                          references: req.body.SnapshotId,
                          meta: JSON.stringify(result),
                          notes: result.status ? result.message : result.notes,
                          createddt: new Date(),
                          createdby: req.body.updatedby,
                          status: constants.STATUS_ACTIVE,
                        });
                      }
                      customValidation.generateSuccessResponse(
                        result,
                        response,
                        constants.RESPONSE_TYPE_CUSTOM,
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
                })
                .catch((error: Error) => {
                  customValidation.generateAppError(error, response, res, req);
                });
            } else {
              customValidation.generateAppError(
                new AppError("Invalid Action"),
                response,
                res,
                req
              );
            }
          } else {
            customValidation.generateAppError(
              new AppError("Instance Not Found"),
              response,
              res,
              req
            );
          }
        });
      } else {
        customValidation.generateAppError(
          new AppError("Please define any action"),
          response,
          res,
          req
        );
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  productlist(req: Request, res: Response): void {
    let response = {
      reference: modules.ASSET_MANAGEMENT,
      message: "",
    };
    try {
      let parameters: any = { where: req.body };
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["productcode"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["productname"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["servertype"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.Product)
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
        CommonService.getAllList(parameters, db.Product)
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
  async bulkcreateTxnref(req: Request, res: Response): Promise<void> {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      // let condition = { 
      //   refkey: req.body.refkey,
      //     module:constants.CMDB_OPERATIONTYPE[7]
      // };
      // await CommonService.update(condition ,
      // {
      //   status: constants.STATUS_InACTIVE,
      // }, db.TxnRefModel)
      CommonService.bulkCreate(req.body.list, db.TxnRefModel)
      .then((list) => {
        customValidation.generateSuccessResponse(
          list,
          response,
          constants.RESPONSE_TYPE_SAVE,
          res,
          req
        );
      })
      .catch((error: Error) => {
        customValidation.generateAppError(error, response, res, req);
      });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
  addProduct(req: Request, res: Response): void {
    let response = {
      reference: modules.ASSET_MANAGEMENT,
      message: "",
    };
    try {
      CommonService.create(req.body, db.Product)
      .then((data) => {
        try {
          commonService.create(
            {
              resourcetypeid: data["productid"],
              resourcetype: constants.RESOURCETYPE[13],
              _tenantid: data["tenantid"],
              new: constants.HISTORYCOMMENTS[26],
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
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  updateProduct(req: Request, res: Response): void {
    let response = {};
    try {
      let condition = { productid: req.body.productid };
      CommonService.update(condition, req.body, db.Product)
        .then((data) => {
          try {
            commonService.create(
              {
                resourcetypeid: data["productid"],
                resourcetype: constants.RESOURCETYPE[13],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[27],
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

import * as _ from "lodash";
import { queries } from "../../common/query";
import db from "../models/model";
import commonService from "./common.service";
import { constants } from "../../common/constants";
import { assetConstant } from "../../common/asset.constant";
import * as fs from "fs";
import LokiService from "../services/logging/loki.service";
import { modules } from "../../common/module";

const filename = `${process.cwd()}/logs/assethistory.json`;

const assetData = [];

const ASSET_TABLES = [
  {
    type: "ASSET_INSTANCE",
    value: db.Instances,
    resourcerefid: "instancerefid",
  },
  { type: "ASSET_NETWORK", value: db.awsvpc, resourcerefid: "awsvpcid" },
  { type: "ASSET_VPC", value: db.awsvpc, resourcerefid: "awsvpcid" },
  {
    type: "ASSET_VOLUME",
    value: db.awsvolumes,
    resourcerefid: "awsvolumeid",
  },
  {
    type: "ASSET_SECURITYGROUP",
    value: db.awssg,
    resourcerefid: "awssecuritygroupid",
  },
  { type: "ASSET_LB", value: db.awslb, resourcerefid: "lbid" },
  {
    type: "ASSET_SUBNET",
    value: db.awssubnet,
    resourcerefid: "awssubnetd",
  },
  {
    type: "ASSET_IG",
    value: db.awsinternetgateway,
    resourcerefid: "awsinternetgatewayid",
  },
  { type: "ASSET_RDS", value: db.CloudAsset, resourcerefid: "assetid" },
  { type: "ASSET_ECS", value: db.CloudAsset, resourcerefid: "assetid" },
  { type: "ASSET_EKS", value: db.CloudAsset, resourcerefid: "assetid" },
  { type: "ASSET_S3", value: db.CloudAsset, resourcerefid: "assetid" },
  {
    type: "VIRTUAL_MACHINES",
    value: db.Instances,
    resourcerefid: "instancerefid",
  },
  { type: "CLUSTERS", value: db.vmclusters, resourcerefid: "clusterrefid" },
  { type: "DATACENTERS", value: db.vmwaredc, resourcerefid: "dcrefid" },
  { type: "VM_HOSTS", value: db.vmwarehosts, resourcerefid: "hostrefid" },
];
export class AssetHistoryService {
  constructor() {
    let dir = `${process.cwd()}/logs`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  }

  getAssets(condition) {
    try {
      return new Promise((resolve, reject) => {
        fs.writeFile(filename, JSON.stringify(assetData), (err) => {
          if (err) {
            console.error(err);
            LokiService.createLog(
              {
                message: "Error on creating temp json file",
                code: constants.STATUES_CODES[2],
                error: err,
                reference: modules.CMDBHISTORY,
              },
              "ERROR"
            );
            return;
          }
        });
        let query = `SELECT * FROM tbl_tn_assetmappings tta where resourcerefid is not NULL and crnresourceid is not NULL and status = 'Active' and tenantid = ${condition.tenantid} and cloudprovider = '${condition.cloudprovider}'`;
        if (condition.refid) {
          query = query + ` AND resourcerefid = '${condition.refid}'`;
        }
        if (condition.resourcetype) {
          query = query + ` AND resourcetype = '${condition.resourcetype}'`;
        }
        let params = {
          replacements: {
            tenantid: condition.tenantid,
            cloudprovider: condition.cloudprovider,
          },
        };
        commonService
          .executeQuery(query, params, db.sequelize)
          .then((assets) => {
            assets = JSON.parse(JSON.stringify(assets));
            assets = assets[0];
            let i = 0;
            if (assets && assets.length > 0) {
              function getdetail() {
                new AssetHistoryService()
                  .getDetails(assets[i])
                  .then((data) => {
                    i++;
                    if (i != assets.length) {
                      getdetail();
                    } else {
                      resolve(true);
                    }
                  })
                  .catch((err) => {
                    reject(err);
                    LokiService.createLog(
                      {
                        message: "Error on getting detail",
                        code: constants.STATUES_CODES[2],
                        error: err,
                        reference: modules.CMDBHISTORY,
                      },
                      "ERROR"
                    );
                  });
              }
              getdetail();
            } else {
              resolve(true);
            }
          })
          .catch((err) => {
            LokiService.createLog(
              {
                message: "Error on getting Assets",
                code: constants.STATUES_CODES[2],
                error: err,
                reference: modules.CMDBHISTORY,
              },
              "ERROR"
            );
          });
      });
    } catch (e) {
      LokiService.createLog(
        {
          message: "Error catched",
          code: constants.STATUES_CODES[2],
          error: e,
          reference: modules.CMDBHISTORY,
        },
        "ERROR"
      );
    }
  }

  getDetails(asset) {
    try {
      return new Promise((resolve, reject) => {
        let table = _.find(ASSET_TABLES, function (itm) {
          return itm.type === asset.resourcetype;
        });
        if (table) {
          let condition = {};
          condition[table.resourcerefid] = asset.resourcerefid;
          condition["tenantid"] = asset.tenantid;
          condition["status"] = constants.STATUS_ACTIVE;
          commonService
            .getData(
              {
                where: condition,
              },
              table.value
            )
            .then((data) => {
              if (data) {
                data["dataValues"]["crnresourceid"] = asset.crnresourceid;
                data["dataValues"]["resourcetype"] = asset.resourcetype;
                data["dataValues"]["assetmappingid"] = asset.assetmappingid;
                assetData.push(data);
                fs.writeFileSync(filename, JSON.stringify(assetData));
                resolve(true);
              } else {
                resolve(false);
              }
            });
        }
      });
    } catch (e) {
      LokiService.createLog(
        {
          message: "Error catched",
          code: constants.STATUES_CODES[2],
          error: e,
          reference: modules.CMDBHISTORY,
        },
        "ERROR"
      );
    }
  }

  getHistory(tenantid, resourcetype?) {
    try {
      let assetDatas = fs.readFileSync(filename, { encoding: "utf8" });
      let prevRecords = JSON.parse(assetDatas);
      if (resourcetype) {
        prevRecords = _.filter(prevRecords, function (e) {
          return e.resourcetype == resourcetype;
        });
      }
      let comments = [];
      let i = 0;
      if (prevRecords.length > 0) {
        checkattributes();
      }

      function checkattributes() {
        db.AssetsHdr.findAll({
          where: {
            crn: prevRecords[i].crnresourceid.split("/")[0],
            status: constants.STATUS_ACTIVE,
            tenantid: tenantid,
            fieldtype: "Reference Asset",
          },
        })
          .then((d) => {
            if (d && d.length > 0) {
              let refassets;
              _.map(d, (element) => {
                let referenceasset = JSON.parse(element["referenceasset"]);
                if (
                  referenceasset &&
                  referenceasset.assettype == resourcetype
                ) {
                  refassets = referenceasset;
                }
              });
              let condition = {};
              let table = _.find(ASSET_TABLES, function (e) {
                return e.type === resourcetype;
              });
              condition[table.resourcerefid] =
                prevRecords[i][table.resourcerefid];
              condition["status"] = constants.STATUS_ACTIVE;
              condition["tenantid"] = tenantid;
              if (table) {
                commonService
                  .getData({ where: condition }, table.value)
                  .then((d) => {
                    if (d) {
                      let newrecord = d.dataValues;
                      for (let key in newrecord) {
                        if (_.includes(refassets.attribute, key)) {
                          if (newrecord[key] === prevRecords[i][key]) {
                            // console.log("Not updated");
                          } else {
                            let field = _.find(
                              assetConstant.COLUMNS[resourcetype],
                              (e) => {
                                return e.field == key;
                              }
                            );
                            let obj = {
                              type: 2,
                              old: prevRecords[i][key],
                              new: newrecord[key],
                              affectedattribute:
                                "Referring Assets - (" +
                                refassets.assetname +
                                ") - " +
                                field.header,
                              meta: JSON.stringify({
                                assetmappingid:
                                  prevRecords[i]["assetmappingid"],
                              }),
                              status: "Active",
                              createdby: "System",
                              createddt: new Date(),
                              lastupdatedby: "System",
                              lastupdateddt: new Date(),
                              tenantid: prevRecords[i].tenantid,
                              resourceid: prevRecords[i].crnresourceid,
                              crn: prevRecords[i].crnresourceid.split("/")[0],
                            };
                            comments.push(obj);
                          }
                        }
                      }
                      i++;
                      if (i != prevRecords.length) {
                        checkattributes();
                      } else {
                        db.AssetsHistory.bulkCreate(comments);
                        // fs.unlinkSync(filename);
                        LokiService.createLog(
                          {
                            message: "CMDB History created for " + resourcetype,
                            reference: modules.CMDBHISTORY,
                          },
                          "INFO"
                        );
                      }
                    }
                  })
                  .catch((err) => {
                    LokiService.createLog(
                      {
                        message: "Error on getting synchronized asset",
                        code: constants.STATUES_CODES[2],
                        error: err,
                        reference: modules.CMDBHISTORY,
                      },
                      "ERROR"
                    );
                  });
              }
            }
          })
          .catch((err) => {
            LokiService.createLog(
              {
                message: "Error on getting reference asset attributes",
                code: constants.STATUES_CODES[2],
                error: err,
                reference: modules.CMDBHISTORY,
              },
              "ERROR"
            );
          });
      }
    } catch (e) {
      LokiService.createLog(
        {
          message: "Error catched",
          code: constants.STATUES_CODES[2],
          error: e,
          reference: modules.CMDBHISTORY,
        },
        "ERROR"
      );
    }
  }
}
export default new AssetHistoryService();

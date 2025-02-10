import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import * as _ from "lodash";
import axios from "axios";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
const https = require("https");
import { queries } from "../../../../../common/query";
import { AssetListTemplate } from "../../../../../reports/templates";
import { CommonHelper } from "../../../../../reports";
import DownloadService from "../../../../services/download.service";
import AppLogger from "../../../../../lib/logger";
import AssetHistoryService from "../../../../services/assethistory.service";
import sequelize = require("sequelize");
import SyncVMwareIpsService from "../../../../services/providers/syncvmwareips.service";
const models = {
  VIRTUAL_MACHINES: db.vmwarevm,
  CLUSTERS: db.vmclusters,
  DATACENTERS: db.vmwaredc,
  VM_HOSTS: db.vmwarehosts,
};
const tables = {
  VIRTUAL_MACHINES: "tbl_tn_instances",
  CLUSTERS: "tbl_vc_cluster",
  DATACENTERS: "tbl_vc_datacenter",
  VM_HOSTS: "tbl_vc_hosts",
};
const REFERENCE = {
  VIRTUAL_MACHINES: {
    refid: "instancerefid",
    foreignkey: "instanceid",
  },
  CLUSTERS: {
    refid: "clusterrefid",
    foreignkey: "clusterid",
  },
  DATACENTERS: {
    refid: "dcrefid",
    foreignkey: "dcid",
  },
  VM_HOSTS: {
    refid: "hostrefid",
    foreignkey: "hostid",
  },
};
export class Controller {
  constructor() {
    //
  }

  filterAssets(req: Request, res: Response) {
    let response = {};
    let parameters: any = {};
    parameters.where = req.body.filters;
    if (req.query.limit && !req.query.download)
      parameters.limit = Number(req.query.limit);
    if (req.query.offset && !req.query.download)
      parameters.offset = Number(req.query.offset);
    let domain = models[req.body.assettype];
    parameters.include = [
      {
        model: db.Customer,
        as: "customer",
        required: false,
        attributes: ["customername"],
      },
    ];
    if (req.body.searchText && req.body.headers) {
      let searchparams: any = {};
      req.body.headers.forEach((element) => {
        if (element.field == "customername") {
          parameters["subQuery"] = false;
          searchparams["$customer.customername$"] = {
            $like: "%" + req.body.searchText + "%",
          };
        } else if (element.field != "lastupdateddt") {
          searchparams[element.field] = {
            $like: "%" + req.body.searchText + "%",
          };
          if (req.body.group) parameters.group = [element.field];
        }
      });
      parameters.where["$or"] = searchparams;
    }

    if (req.body.filterby && req.body.filterby.length > 0) {
      req.body.filterby.forEach((element) => {
        parameters.where[element.key] = { $in: element.value };
      });
    }

    if (req.body.order) {
      parameters.order = [req.body.order];
    }

    commonService
      .getCount(parameters, domain)
      .then((count) => {
        parameters.include = [
          {
            as: "tagvalues",
            model: db.TagValues,
            required: false,
            where: { resourcetype: req.body.assettype },
            include: [
              {
                as: "tag",
                model: db.Tags,
                required: false,
              },
            ],
          },
          {
            model: db.Customer,
            as: "customer",
            required: false,
            attributes: ["customername"],
          },
        ];
        commonService
          .getAllList(parameters, domain)
          .then((resp) => {
            resp.map((el) => {
              let o = el.dataValues;
              if (o["customer"]) {
                o.customername = o["customer"]["customername"];
              }
              return o;
            });
            if (req.query.download) {
              let template = {
                content: AssetListTemplate,
                engine: "handlebars",
                helpers: CommonHelper,
                recipe: "html-to-xlsx",
              };
              let data = { lists: resp, headers: req.body.headers };
              DownloadService.generateFile(data, template, (result) => {
                customValidation.generateSuccessResponse(
                  result,
                  {},
                  constants.RESPONSE_TYPE_LIST,
                  res,
                  req
                );
              });
            } else {
              customValidation.generateSuccessResponse(
                { assets: resp, count },
                {},
                constants.RESPONSE_TYPE_LIST,
                res,
                req
              );
            }
          })
          .catch((e) => {
            customValidation.generateAppError(e, response, res, req);
          });
      })
      .catch((e) => {
        customValidation.generateAppError(e, response, res, req);
      });
  }

  synchronization(req: any, res: Response): void {
    require("https").globalAgent.options.ca = require("ssl-root-cas").create();
    let filename =
      req.body.provider +
      "_sync_assets" +
      commonService.generateRandomNumber(10) +
      ".log";
    let logger = new AppLogger(process.cwd() + `/logs/`, filename);
    const asstcondition = {
      tenantid: req.body.tenantid,
      cloudprovider: req.body.provider,
    };
    if (req.body.resourcetype)
      asstcondition["resourcetype"] = req.body.resourcetype;
    if (req.body.refid) asstcondition["refid"] = req.body.refid;
    //disable ssl verification
    const instance = axios.create({
      timeout: 60000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    // AssetHistoryService.getAssets(asstcondition)
    //   .then((d) => {
    commonService
      .getById(req.body.id, db.CustomerAccount)
      .then((account) => {
        if (account) {
          account = JSON.parse(JSON.stringify(account));
          let cred = JSON.parse(commonService.decrypt(account.accountref));
          let session = Buffer.from(
            `${cred.username}:${cred.password}`
          ).toString("base64");
          //get session
          new Controller()
            .getSession(cred, session, account.apiversion)
            .then((token) => {
              new Controller()
                .getVersionURL(account.apiversion, cred.domain)
                .then((urlobj) => {
                  customValidation.generateSuccessResponse(
                    {},
                    {},
                    constants.RESPONSE_TYPE_LIST,
                    res,
                    req
                  );
                  let reqData = {
                    tenantid: req.body.tenantid,
                    customerid: req.body.customerid,
                    username: req.body.createdby,
                    cloudprovider: req.body.provider,
                    version: account.apiversion,
                    token:
                      token.data && token.data.value
                        ? token.data.value
                        : token.data,
                    _accountid: req.body.id,
                    domain: cred.domain,
                    region: cred.region,
                    session,
                    urlobj,
                  };
                  new Controller().deleteExist(reqData).then((suc) => {
                    let synccluster = new Controller().syncClusters;
                    let syncdc = new Controller().syncDC;
                    let synchost = new Controller().syncHosts;
                    let promiseArray = [synccluster, syncdc, synchost];

                    //start sync the assets
                    startSync(0);
                    function startSync(i) {
                      let promise = promiseArray[i];
                      if (promise) {
                        promise(instance, reqData, logger, filename)
                          .then((data) => {
                            logger.writeLogToFile(
                              "info",
                              `Successfully synced ${req.body.provider} ${cred.domain} ${cred.region} (${account.apiversion})`
                            );
                            startSync(i + 1);
                          })
                          .catch((e) => {
                            logger.writeLogToFile(
                              "error",
                              `Error in ${req.body.provider} ${cred.domain} ${cred.region} (${account.apiversion})`
                            );
                            startSync(i + 1);
                          });
                      } else {
                        commonService.uploadLog(
                          filename,
                          req.body.tenantid,
                          "Asset Sync",
                          "Asset Sync",
                          "S3",
                          "Medium"
                        );
                      }
                    }
                  });
                });
            })
            .catch((e) => {
              logger.writeLogToFile(
                "error",
                constants.VMWARE_INVALID_CREDENTIALS.replace(
                  "{url}",
                  cred.domain
                )
              );
              commonService.uploadLog(
                filename,
                req.body.tenantid,
                "Asset Sync",
                "Asset Sync",
                "S3",
                "Medium"
              );
              customValidation.generateAppError(e, {}, res, req);
            });
        }
      })
      .catch((e) => {
        logger.writeLogToFile(
          "error",
          constants.VMWARE_INVALID_CREDENTIALS.replace("{url}", "")
        );
        commonService.uploadLog(
          filename,
          req.body.tenantid,
          "Asset Sync",
          "Asset Sync",
          "S3",
          "Medium"
        );
        customValidation.generateAppError(e, {}, res, req);
      });
    // })
    // .catch((err) => {
    //   console.log(err);
    // });
  }

  deleteExist(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        let params = {
          replacements: {
            ...inputObj,
            status: constants.DELETE_STATUS,
          },
        };
        Object.keys(queries.VM_DELETE_DATA).forEach((query, i) => {
          commonService
            .executeQuery(queries.VM_DELETE_DATA[query], params, db.sequelize)
            .then((result) => {
              if (Object.keys(queries.VM_DELETE_DATA).length == i + 1) {
                resolve(result);
              }
            });
        });
      } catch (e) {
        resolve("Failed");
      }
    });
  }

  //sync vm data

  syncVM(instance, inputObj, logger, filename): Promise<any> {
    try {
      let vmwareData = [];
      return new Promise((resolve, reject) => {
        let url = inputObj.urlobj.vmlist;
        if (inputObj.clusterid) {
          if (inputObj.version && inputObj.version == "v6.5/v6.7") {
            url += `?filter.clusters=${inputObj.clusterid}&filter.power_states=POWERED_ON`;
            // url += `?filter.clusters=${inputObj.clusterid}`;
          } else {
            url += `?clusters=${inputObj.clusterid}&power_states=POWERED_ON`;
            // url += `?clusters=${inputObj.clusterid}`;
          }
        }
        console.log(url);
        instance
          .get(url, {
            headers: {
              Authorization: `Basic ${inputObj.session}`,
              "vmware-api-session-id": inputObj.token,
            },
          })
          .then((vmdata) => {
            logger.writeLogToFile(
              "info",
              `Getting assets for cluster ${inputObj.clusterid}`
            );
            getVMDetails(
              vmdata.data && vmdata.data.value
                ? vmdata.data.value
                : vmdata.data,
              0
            );
            resolve(vmdata.data);
          });
      });
      function getVMDetails(vmdetails, idx) {
        let vm = vmdetails[idx];
        console.log(idx, vm)
        if (vm) {
          let obj = {
            tenantid: inputObj.tenantid,
            customerid: inputObj.customerid,
            cloudprovider: inputObj.cloudprovider,
            region: inputObj.region,
            instancename: vm.name,
            accountid: inputObj._accountid,
            cloudstatus: vm.power_state == 'POWERED_ON' ? 'running' : 'stopped',
            instancerefid: vm.vm,
            status: constants.STATUS_ACTIVE,
            createdby: inputObj.username,
            createddt: new Date(),
            lastupdatedby: inputObj.username,
            lastupdateddt: new Date(),
            metadata: null,
            privateipv4: "",
            platform: null,
          };
          try {
            instance
              .get(`${inputObj.urlobj.vmlist}/${obj.instancerefid}`, {
                headers: {
                  Authorization: `Basic ${inputObj.domain}`,
                  "vmware-api-session-id": inputObj.token,
                },
              })
              .then(async (details) => {
                const identity = await instance
                  .get(
                    `${inputObj.urlobj.vmlist}/${obj.instancerefid}/guest/identity`,
                    {
                      headers: {
                        Authorization: `Basic ${inputObj.domain}`,
                        "vmware-api-session-id": inputObj.token,
                      },
                    }
                  )
                  .catch((e) => {
                    logger.writeLogToFile(
                      "error",
                      `Unable to get identity of ${obj.instancerefid}`
                    );
                  });

                // get the ip from the CMDB if exists update the same
                obj.privateipv4 = identity && identity.data.value.ip_address.search(":") == -1
                  ? identity.data.value.ip_address
                  : await SyncVMwareIpsService.getIpForVM({
                    name: obj.instancename,
                    cloudprovider: obj.cloudprovider,
                  });
                const platform =
                  details.data.guest_OS ||
                  (details.data.value.guest_OS as string | null);

                obj.metadata = JSON.stringify(
                  details.data && details.data.value
                    ? details.data.value
                    : details.data
                );
                obj.platform = platform
                  ? platform.toLowerCase().includes("windows")
                    ? "windows"
                    : "linux"
                  : "NA";
                vmwareData.push(obj);
                getVMDetails(vmdetails, idx + 1);
              })
              .catch((e) => {
                getVMDetails(vmdetails, idx);
              });
          } catch (e) {
            getVMDetails(vmdetails, idx);
          }
        } else {
          commonService
            .bulkCreate(vmwareData, db.Instances)
            .then((savedData) => {
              savedData = JSON.parse(JSON.stringify(savedData));
              let ids = _.map(savedData, function (item) {
                return {
                  resourceid: item.instanceid,
                  resourcerefid: item.instancerefid,
                };
              });
              commonService.bulkAssetMapping(
                ids,
                inputObj.tenantid,
                inputObj.cloudprovider,
                constants.RESOURCE_TYPES[15],
                inputObj.customerid,
                inputObj._accountid
              );
              new Controller().syncTags(constants.RESOURCE_TYPES[15], inputObj);
            })
            .catch((e) => {
              console.log(e);
            });
        }
      }
    } catch (e) {
      new Controller().syncVM(instance, inputObj, logger, filename);
    }
  }

  syncClusters(instance, inputObj, logger, filename): Promise<any> {
    let dataArray = [];
    return new Promise((resolve, reject) => {
      logger.writeLogToFile("info", `Fetching Cluster data `);
      instance
        .get(inputObj.urlobj.clusterlist, {
          headers: {
            Authorization: `Basic ${inputObj.session}`,
            "vmware-api-session-id": inputObj.token,
          },
        })
        .then((clusterdata) => {
          if (clusterdata && clusterdata.data) {
            logger.writeLogToFile("info", `Cluster data fetched`);
            clusterdata =
              clusterdata.data && clusterdata.data.value
                ? clusterdata.data.value
                : clusterdata.data;
            formClusterData(0);
            function formClusterData(i) {
              let cluster = clusterdata[i];
              let obj = {
                tenantid: inputObj.tenantid,
                customerid: inputObj.customerid,
                region: inputObj.region,
                clusterrefid: cluster.cluster,
                _accountid: inputObj._accountid,
                drsstate: cluster.drs_enabled.toString(),
                hastate: cluster.ha_enabled.toString(),
                clustername: cluster.name,
                status: constants.STATUS_ACTIVE,
                createdby: inputObj.username,
                createddt: new Date(),
                lastupdatedby: inputObj.username,
                lastupdateddt: new Date(),
              };
              dataArray.push(obj);
              inputObj.clusterid = cluster.cluster;
              new Controller()
                .syncVM(instance, inputObj, logger, filename)
                .then((succ) => {
                  if (i == clusterdata.length - 1) {
                    commonService
                      .bulkCreate(dataArray, db.vmclusters)
                      .then((savedData) => {
                        AssetHistoryService.getHistory(
                          inputObj.tenantid,
                          constants.RESOURCE_TYPES[16]
                        );
                        resolve(clusterdata);
                        savedData = JSON.parse(JSON.stringify(savedData));
                        let ids = _.map(savedData, function (item) {
                          return {
                            resourceid: item.clusterid,
                            resourcerefid: item.clusterrefid,
                          };
                        });
                        commonService.bulkAssetMapping(
                          ids,
                          inputObj.tenantid,
                          inputObj.cloudprovider,
                          constants.RESOURCE_TYPES[16],
                          inputObj.customerid,
                          inputObj._accountid
                        );
                        new Controller().syncTags(
                          constants.RESOURCE_TYPES[16],
                          inputObj
                        );
                      });
                  } else {
                    i++;
                    formClusterData(i);
                  }
                })
                .catch((e) => {
                  logger.writeLogToFile(
                    "info",
                    `Error on fetching cluster data `
                  );
                  formClusterData(i);
                });
            }
          } else {
            logger.writeLogToFile("info", `Error on fetching cluster data `);
            resolve(clusterdata);
          }
        });
    });
  }

  syncTags(resourcetype, inputObj) {
    try {
      let query = `update tbl_bs_tag_values t set t.resourceid = (select ${REFERENCE[resourcetype].foreignkey} from ${tables[resourcetype]} where tenantid=${inputObj.tenantid} and status='${constants.STATUS_ACTIVE}' and ${REFERENCE[resourcetype].refid}=t.resourcerefid :accountquery)
      where t.tenantid=${inputObj.tenantid} and t.status='${constants.STATUS_ACTIVE}' and t.cloudprovider='${inputObj.cloudprovider}' and t.resourcetype='${resourcetype}'`;
      let subquery = `and _accountid=${inputObj._accountid}`;
      if (resourcetype == constants.RESOURCE_TYPES[15]) {
        subquery = `and accountid=${inputObj._accountid}`;
      }
      query = query.replace(new RegExp(":accountquery", "g"), subquery);
      let params = {
        replacements: {
          tenantid: inputObj.tenantid,
          status: constants.STATUS_ACTIVE,
          resourcerefid: REFERENCE[resourcetype].refid,
        },
        type: db.sequelize.QueryTypes.SELECT,
      } as any;
      commonService
        .executeQuery(query, params, db.sequelize)
        .then((res) => {
          console.log("Tag values updated>>>>>>>>>>>");
        })
        .catch((err) => {
          console.log("catch", err);
        });
    } catch (e) {
      console.log("catch", e);
    }
  }

  syncDC(instance, inputObj, logger, filename): Promise<any> {
    let dataArray = [];
    return new Promise((resolve, reject) => {
      logger.writeLogToFile("info", `Fetching DC data `);
      instance
        .get(inputObj.urlobj.dclist, {
          headers: {
            Authorization: `Basic ${inputObj.session}`,
            "vmware-api-session-id": inputObj.token,
          },
        })
        .then((dcData) => {
          if (dcData && dcData.data) {
            logger.writeLogToFile("info", `DC data fetched`);
            dcData =
              dcData.data && dcData.data.value
                ? dcData.data.value
                : dcData.data;
            dcData.forEach((dc, i) => {
              let obj = {
                tenantid: inputObj.tenantid,
                customerid: inputObj.customerid,
                region: inputObj.region,
                dcrefid: dc.datacenter,
                _accountid: inputObj._accountid,
                dcname: dc.name,
                status: constants.STATUS_ACTIVE,
                createdby: inputObj.username,
                createddt: new Date(),
                lastupdatedby: inputObj.username,
                lastupdateddt: new Date(),
              };
              dataArray.push(obj);
              if (i == dcData.length - 1) {
                commonService
                  .bulkCreate(dataArray, db.vmwaredc)
                  .then((savedData) => {
                    resolve(dcData);
                    savedData = JSON.parse(JSON.stringify(savedData));
                    let ids = _.map(savedData, function (item) {
                      return {
                        resourceid: item.dcid,
                        resourcerefid: item.dcrefid,
                      };
                    });
                    commonService.bulkAssetMapping(
                      ids,
                      inputObj.tenantid,
                      inputObj.cloudprovider,
                      constants.RESOURCE_TYPES[17],
                      inputObj.customerid,
                      inputObj._accountid
                    );
                    AssetHistoryService.getHistory(
                      inputObj.tenantid,
                      constants.RESOURCE_TYPES[17]
                    );
                    new Controller().syncTags(
                      constants.RESOURCE_TYPES[17],
                      inputObj
                    );
                  });
              }
            });
          } else {
            logger.writeLogToFile("error", `Error in Fetching Cluster data `);
            resolve(dcData);
          }
        });
    });
  }

  syncHosts(instance, inputObj, logger, filename): Promise<any> {
    let dataArray = [];
    return new Promise((resolve, reject) => {
      logger.writeLogToFile("info", `Fetching Host data `);
      instance
        .get(inputObj.urlobj.hostlist, {
          headers: {
            Authorization: `Basic ${inputObj.session}`,
            "vmware-api-session-id": inputObj.token,
          },
        })
        .then((hostData) => {
          if (hostData && hostData.data) {
            logger.writeLogToFile("info", `Host data fetched `);
            hostData =
              hostData.data && hostData.data.value
                ? hostData.data.value
                : hostData.data;
            hostData.forEach((host, i) => {
              let obj = {
                tenantid: inputObj.tenantid,
                customerid: inputObj.customerid,
                region: inputObj.region,
                hoststate: host.connection_state,
                hostrefid: host.host,
                _accountid: inputObj._accountid,
                hostname: host.name,
                powerstate: host.power_state,
                status: constants.STATUS_ACTIVE,
                createdby: inputObj.username,
                createddt: new Date(),
                lastupdatedby: inputObj.username,
                lastupdateddt: new Date(),
              };
              dataArray.push(obj);
              if (i == hostData.length - 1) {
                commonService
                  .bulkCreate(dataArray, db.vmwarehosts)
                  .then((savedData) => {
                    resolve(hostData);
                    savedData = JSON.parse(JSON.stringify(savedData));
                    let ids = _.map(savedData, function (item) {
                      return {
                        resourceid: item.hostid,
                        resourcerefid: item.hostrefid,
                      };
                    });
                    commonService.bulkAssetMapping(
                      ids,
                      inputObj.tenantid,
                      inputObj.cloudprovider,
                      constants.RESOURCE_TYPES[18],
                      inputObj.customerid,
                      inputObj._accountid
                    );
                    AssetHistoryService.getHistory(
                      inputObj.tenantid,
                      constants.RESOURCE_TYPES[18]
                    );
                    new Controller().syncTags(
                      constants.RESOURCE_TYPES[18],
                      inputObj
                    );
                  });
              }
            });
          }
        });
    });
  }
  getVersionURL(version, domain): Promise<any> {
    return new Promise((resolve, reject) => {
      let urlObj: any = {};
      if (version == "v6.5/v6.7") {
        urlObj = {
          vmlist: `${domain}/rest/vcenter/vm`,
          clusterlist: domain + "/rest/vcenter/cluster",
          dclist: domain + "/rest/vcenter/datacenter",
          hostlist: domain + "/rest/vcenter/host",
        };
        resolve(urlObj);
      } else {
        urlObj = {
          vmlist: `${domain}/api/vcenter/vm`,
          clusterlist: `${domain}/api/vcenter/cluster`,
          dclist: `${domain}/api/vcenter/datacenter`,
          hostlist: `${domain}/api/vcenter/host`,
        };
        resolve(urlObj);
      }
    });
  }
  getSession(cred, session, version): Promise<any> {
    return new Promise((resolve, reject) => {
      let url =
        version == "v6.5/v6.7"
          ? cred.domain + "/rest/com/vmware/cis/session"
          : cred.domain + "/api/session";
      let bodyContent =
        version == "v6.5/v6.7"
          ? {}
          : { grant_type: "urn:ietf:params:oauth:grant-type:token-exchange" };
      const instance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });
      instance
        .post(url, bodyContent, {
          headers: {
            Authorization: `Basic ${session}`,
          },
          auth: {
            username: cred.username,
            password: cred.password,
          },
        })
        .then((res) => {
          resolve(res);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
}

export default new Controller();

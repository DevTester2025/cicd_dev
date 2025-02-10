import CommonService from "../../../services/common.service";

import db from "../../../models/model";

import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import * as _ from "lodash";
import { Op } from "sequelize";
import axios from "axios";
import { modules } from "../../../../common/module";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
import { AssetListTemplate } from "../../../../reports/templates";
import commonService from "../../../services/common.service";

interface AlertConfig {
  id: number;
  title: string;
  description: string;
  _customer: number;
  _account: null;
  vm: null;
  _tag: null;
  _synthetics: string;
  severity: string;
  priority: string;
  type: string;
  tagvalue: null;
  metric: string;
  condition: string;
  threshold: number;
  duration: number;
  level: null;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
  tenantid: number;
  status: string;
  ntf_receivers: string;
  region: string;
  pagerduty: string;
  poll_strategy: string;
  instancetype: string;
  instance: string; // array of instances
}

interface Instances {
  networkid: null;
  instancerefid: string;
  instanceid: number;
  platform: string;
  customerid: number;
  privateipv4: string;
  cloudprovider: string;
  tenantregion: Tenantregion[];
}

interface Tenantregion {
  _accountid: number;
  tnregionid: number;
}

const getInstancesByFilter = async (filters: {
  _customer?: number;
  _account?: number;
  _instance?: number;
  _tag?: number;
  tagvalue?: string;
  instancerefid?: string;
}) => {
  let parameters = {
    where: {
      status: "Active",
      tenantid: process.env.ON_PREM_TENANTID,
      cloudprovider: {
        [Op.in]: constants.CLOUDPROVIDERS,
      },
    },
    include: [],
    attributes: [
      "instancerefid",
      "instanceid",
      "platform",
      "customerid",
      "privateipv4",
      "cloudprovider",
      "instancename"
    ],
  } as any;

  if (filters.instancerefid) {
    parameters["where"]["instancerefid"] = { [Op.in]: filters.instancerefid };
  }
  if (filters._customer) {
    parameters["where"]["customerid"] = filters._customer;
  }
  if (filters._tag && !filters.tagvalue) {
    parameters.include = [
      {
        model: db.TagValues,
        as: "tagvalues",
        paranoid: true,
        required: true,
        where: {
          resourcetype: { $in: ["ASSET_INSTANCE", "VIRTUAL_MACHINES"] },
          status: "Active",
          tagid: filters._tag,
        },
        include: [
          {
            model: db.Tags,
            as: "tag",
          },
        ],
      },
    ];
  }
  if (filters._tag && filters.tagvalue) {
    parameters.include = [
      {
        model: db.TagValues,
        as: "tagvalues",
        paranoid: true,
        required: true,
        where: {
          resourcetype: { $in: ["ASSET_INSTANCE", "VIRTUAL_MACHINES"] },
          status: "Active",
          tagid: filters._tag,
          tagvalue: { [Op.in]: [filters.tagvalue] },
        },
        include: [
          {
            model: db.Tags,
            as: "tag",
            status: "Active",
          },
        ],
      },
    ];
  }

  if (filters._account) {
    parameters["where"]["accountid"] = filters._account;

    delete parameters.where["tagvalue"];
    delete parameters.where["tagid"];
  } else {
    parameters.include = [
      ...parameters.include,
      {
        model: db.TenantRegion,
        as: "tenantregion",
        paranoid: false,
        required: false,
        attributes: ["_accountid", "tnregionid"],
        where: {
          status: "Active",
        },
      },
    ];
    delete parameters.where["tagvalue"];
    delete parameters.where["tagid"];
  }

  try {
    const instances = await db.Instances.findAll(parameters);

    return instances;
  } catch (error) {
    throw error;
  }
};

const deleteAlert = async (id, alert?) => {
  const lookup = await db.LookUp.findAll({
    where: {
      lookupkey: "SYSTEM_ALERT_DS",
      status: "Active",
    },
  });

  const lookupData = JSON.parse(JSON.stringify(lookup)) as any;
  let providers = JSON.parse(alert.instancetype);
  const arr = await Promise.all(
    _.map(lookupData, async (itm) => {
      const ds = JSON.parse(itm["keyvalue"]);
      let dsurl =
        ds.url + ds.deleteendpoint.replace("{{alertid}}", id.toString());
      if (_.includes(providers, itm.keyname)) {
        const ds = JSON.parse(itm["keyvalue"]);

        ds.url + ds.deleteendpoint.replace("{{alertid}}", id.toString());
        return axios.delete(dsurl, {
          headers: {
            Authorization: ds["accessToken"],
          },
        });
      } else {
        return itm;
      }
    })
  );
  return true;
};

const deleteSyntheticAlert = async (id) => {
  const lookup = await db.LookUp.findAll({
    where: {
      keyname: "synthetic_grafana",
      status: "Active",
    },
  });
  const lookupData = JSON.parse(JSON.stringify(lookup)) as any;
  const grafanadtl = JSON.parse(lookupData[0]["keyvalue"]);
  let url = grafanadtl.url + grafanadtl.deleteendpoint.replace("{{alertid}}", id.toString());
  const { data: grafanaResponse } = await axios.delete(url, {
    headers: {
      Authorization: grafanadtl["accessToken"],
    },
  });
  return grafanaResponse;
};

const configureSyntheticAlert = (config: AlertConfig) => {
  return new Promise(async (resolve, reject) => {
    try {
      const lookup = await db.LookUp.findAll({
        where: {
          keyname: "synthetic_grafana",
          status: "Active",
        },
      });
      const lookupConfig = JSON.parse(JSON.stringify(lookup)) as any;
      const grafanaDtl = JSON.parse(lookupConfig[0]["keyvalue"]);

      const condition = config.condition;
      let threshold =
        typeof config.threshold == "string"
          ? parseFloat(config.threshold)
          : config.threshold;

      if (config.metric == "Duration") {
        threshold = threshold * 1000;
      }
      let grafanaRequest = {
        name: "ALERTS",
        interval: "1m",
        rules: [
          {
            grafana_alert: {
              title: config.id.toString(),
              condition: "C",
              no_data_state: "NoData",
              exec_err_state: "Error",
              data: [
                {
                  refId: "A",
                  relativeTimeRange: { from: 600, to: 0 },
                  queryType: "",
                  datasourceUid: grafanaDtl["dataSource"],
                  model: {
                    refId: "A",
                    hide: false,
                    label: "",
                    maxDataPoints: 2003,
                    region: config["region"],
                    id: "",
                    logGroups: [],
                    queryMode: "Metrics",
                    namespace: "CloudWatchSynthetics",
                    metricName: config.metric,
                    expression: "",
                    dimensions: {
                      StepName: "*",
                      CanaryName: "*",
                    },
                    statistic: "Average",
                    period: "",
                    metricQueryType: 0,
                    metricEditorMode: 0,
                    sqlExpression: "",
                    matchExact: true,
                  },
                },
                {
                  refId: "B",
                  datasourceUid: "-100",
                  queryType: "",
                  model: {
                    refId: "B",
                    hide: false,
                    type: "reduce",
                    datasource: { uid: "-100", type: "__expr__" },
                    conditions: [
                      {
                        type: "query",
                        evaluator: { params: [], type: "gt" },
                        operator: { type: "and" },
                        query: { params: ["B"] },
                        reducer: { params: [], type: "last" },
                      },
                    ],
                    reducer: "last",
                    expression: "A",
                  },
                  relativeTimeRange: { from: 600, to: 0 },
                },
                {
                  refId: "C",
                  datasourceUid: "-100",
                  queryType: "",
                  model: {
                    refId: "C",
                    hide: false,
                    type: "threshold",
                    datasource: { uid: "-100", type: "__expr__" },
                    conditions: [
                      {
                        type: "query",
                        evaluator: { params: [threshold], type: condition },
                        operator: { type: "and" },
                        query: { params: ["C"] },
                        reducer: { params: [], type: "last" },
                      },
                    ],
                    expression: "B",
                  },
                  relativeTimeRange: { from: 600, to: 0 },
                },
              ],
              is_paused: false,
            },
            for: "5m",
            annotations: {
              summary: "Alerts from Cloudmatiq",
              description: `Alert name: ${config.title}`,
            },
            labels: { alert: "synthetic", name: config.title },
          },
        ],
      };
      if (config["region"] && config["_synthetics"]) {
        try {
          const synthetics = JSON.parse(config["_synthetics"]);
          if (synthetics && synthetics[0]) {
            const detail = await db.MSynthetics.findAll({
              where: {
                id: synthetics[0],
              },
            });
            const synth = JSON.parse(JSON.stringify(detail)) as any;
            const meta = JSON.parse(synth[0]["meta"]);
            grafanaRequest["rules"][0]["grafana_alert"]["data"][0]["model"][
              "dimensions"
            ] = {
              StepName:
                meta.length > 1
                  ? "*"
                  : meta[0].replace(/^https?:\/\//, "").split("/")[0],
              CanaryName: synth[0]["name"],
            };
          }
        } catch (error) {
          console.log("Error ", error);
        }
      }

      let url = `${grafanaDtl["url"]}${grafanaDtl["endpoint"]}`;
      console.log(`Configuring alert on URL >>> ${url}`);
      console.log(JSON.stringify(grafanaRequest));

      // get existing alerts
      const alerts = await axios.get(url, {
        headers: {
          Authorization: grafanaDtl["accessToken"],
        },
      });
      console.log("List of alerts>>>>", JSON.stringify(alerts.data));

      if (
        alerts.data &&
        alerts.data["CM-SYNTHETICS"].length > 0 &&
        alerts.data["CM-SYNTHETICS"][0].rules.length > 0
      ) {
        grafanaRequest.rules = grafanaRequest.rules.concat(
          alerts.data["CM-SYNTHETICS"][0].rules
        );
      }

      const { data: grafanaResponse } = await axios.post(url, grafanaRequest, {
        headers: {
          Authorization: grafanaDtl["accessToken"],
        },
      });
      await db.AlertConfigs.update(
        { status: "Active" },
        { where: { id: config.id } }
      );
      resolve({ grafanaResponse, grafanaRequest });
    } catch (error) {
      console.log("Error configuring grafana alert >>>>>>>>>>>");
      console.log(error);
      reject(error);
    }
  });
};
function formGrafanaRule(config, ds, query, condition, threshold, isCustom?) {
  // threshold = isCustom ? threshold * 1000 : threshold;
  let C = {
    refId: "C",
    datasourceUid: "-100",
    queryType: "",
    model: {
      refId: "C",
      hide: false,
      type: "threshold",
      datasource: { uid: "-100", type: "__expr__" },
      conditions: [
        {
          type: "query",
          evaluator: { params: [threshold], type: condition },
          operator: { type: "and" },
          query: { params: ["C"] },
          reducer: { params: [], type: "last" },
        },
      ],
      expression: "B",
    },
    relativeTimeRange: { from: 600, to: 0 },
  };
  let B = {
    refId: "B",
    datasourceUid: "-100",
    queryType: "",
    model: {
      refId: "B",
      hide: false,
      type: "reduce",
      datasource: { uid: "-100", type: "__expr__" },
      conditions: [
        {
          type: "query",
          evaluator: { params: [], type: condition },
          operator: { type: "and" },
          query: { params: ["B"] },
          reducer: { params: [], type: "last" },
        },
      ],
      reducer: "last",
      expression: "A",
    },
    relativeTimeRange: { from: 600, to: 0 },
  };
  let annotations = {
    summary: `Alert name: ${config.title}`,
    description: ` ${config.description}`,
    alertId: config.id.toString(),
  };
  let labels = {
    alert: "system",
    name: config.title,
    alertname: config.id.toString(),
    alertgroup: config.metric,
    severity: config.severity,
  };
  if (isCustom) {
    return {
      name: config.id.toString(),
      interval: "1m",
      rules: [
        {
          grafana_alert: {
            title: config.id.toString(),
            condition: "C",
            no_data_state: "NoData",
            exec_err_state: "Error",
            data: [
              {
                refId: "A",
                datasourceUid: ds["dataSource"],
                queryType: "",
                relativeTimeRange: { from: 600, to: 0 },
                model: {
                  refId: "A",
                  hide: false,
                  editorMode: "code",
                  expr: query,
                  legendFormat: "__auto",
                  range: true,
                },
              },
              B,
              C,
            ],
          },
          for: `${config.duration}m`,
          annotations: annotations,
          labels: labels,
        },
      ],
    };
  } else {
    return {
      name: config.id.toString(),
      interval: "1m",
      rules: [
        {
          grafana_alert: {
            title: config.id.toString(),
            condition: "C",
            no_data_state: "NoData",
            exec_err_state: "Error",
            data: [
              {
                refId: "A",
                datasourceUid: ds["dataSource"],
                queryType: "",
                relativeTimeRange: { from: 600, to: 0 },
                model: {
                  refId: "A",
                  hide: false,
                  editorMode: "code",
                  expr: query,
                  legendFormat: "__auto",
                  range: true,
                },
              },
              B,
              C,
            ],
          },
          for: `${config.duration}m`,
          annotations: annotations,
          labels: labels,
        },
      ],
    };
  }
}
const configureSystemAlert = (config: AlertConfig) => {
  return new Promise(async (resolve, reject) => {
    try {
      let iCondition = {
        _account: config._account,
        _customer: config._customer,
        _tag: config._tag,
        tagvalue: config.tagvalue,
      } as any;
      if (
        config.instance != null &&
        config.instance != "null" &&
        config.instance != "[]"
      ) {
        iCondition["instancerefid"] = JSON.parse(config.instance);
      }
      const instances = (await getInstancesByFilter(
        iCondition
      )) as any as Instances[];
      let query = "";
      let rule: any = await db.LookUp.findOne({
        where: {
          lookupkey: "SYSTEM_RULES",
          keyvalue: config.metric,
          status: "Active",
        },
      });
      query = rule["keydesc"];
      let ids = [];
      let providers = [];
      if (instances.length > 0) {
        ids = instances.map((i) => {
          providers.push(i.cloudprovider);
          return rule.datatype == "instance"
            ? i.privateipv4 + `:${rule.defaultvalue}`
            : i.instancerefid;
        });
        if (
          config._customer == null &&
          config._account == null &&
          config._tag == null &&
          config.tagvalue == null &&
          (config.instance == null ||
            config.instance == "null" ||
            config.instance == "[]")
        ) {
          query = query
            .replace(`$${rule.datatype}`, ".*")
            .replace(`$${rule.datatype}`, ".*");
        } else {
          query = query
            .replace(`$${rule.datatype}`, ids.join("|"))
            .replace(`$${rule.datatype}`, ids.join("|"));
        }
        if (
          config.instance != null &&
          config.instance != "null" &&
          config.instance != "[]"
        ) {
          await db.AlertConfigs.update(
            { instance: JSON.stringify(ids) },
            { where: { id: config.id } }
          );
        }
        query = query.replace("`", "").replace("`", "");
        const condition = config.condition == "GTE" ? "gt" : "lt";
        const threshold =
          typeof config.threshold == "string"
            ? parseFloat(config.threshold)
            : config.threshold;
        const lookup = await db.LookUp.findAll({
          where: {
            lookupkey: "SYSTEM_ALERT_DS",
            status: "Active",
          },
        });
        const lookupData = JSON.parse(JSON.stringify(lookup)) as any;
        providers = _.uniq(providers);
        const arr = await Promise.all(
          _.map(lookupData, async (itm, idx: Number) => {
            if (_.includes(providers, itm.keyname)) {
              const ds = JSON.parse(itm["keyvalue"]);
              let dsgrafanaRequest = formGrafanaRule(
                config,
                ds,
                query,
                condition,
                threshold
              );
              let dsurl = ds["url"] + ds["endpoint"];
              if (idx == Number(lookupData.length - 1)) {
                await db.AlertConfigs.update(
                  { instancetype: JSON.stringify(providers), status: "Active" },
                  { where: { id: config.id } }
                );
              }
              return axios.post(dsurl, dsgrafanaRequest, {
                headers: {
                  Authorization: ds["accessToken"],
                },
              });
            } else {
              if (idx == Number(lookupData.length - 1)) {
                await db.AlertConfigs.update(
                  { instancetype: JSON.stringify(providers), status: "Active" },
                  { where: { id: config.id } }
                );
              }
              return itm;
            }
          })
        );
      } else {
        await db.AlertConfigs.update(
          { status: "Deleted" },
          { where: { id: config.id } }
        );
      }
      resolve({ status: true, rule: query });
    } catch (error) {
      console.log("Error configuring grafana alert >>>>>>>>>>>");
      console.log(error);
      reject(error);
    }
  });
};

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.ALERTCONFIG };
    try {
      let parameters = {
        where: req.body,
      } as any;
      // let parameters = {} as any;
      // parameters.where = req.body;
      if (req.query.order as any) {
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
        searchparams["title"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["type"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      if (req.body.alerts) {
        parameters.where.type = { $in: req.body.alerts };
      }
      parameters.where = _.omit(parameters.where, ["order", "alerts"]);

      if (req.query.count) {
        parameters.include = [];
        CommonService.getCountAndList(parameters, db.AlertConfigs)
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
        CommonService.getAllList(parameters, db.AlertConfigs)
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
        CommonService.getAllList(parameters, db.AlertConfigs)
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
    let response = { reference: modules.ALERTCONFIG };
    try {
      CommonService.getById(req.params.id, db.AlertConfigs)
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
    let response = { reference: modules.ALERTCONFIG };
    try {
      const config = req.body as AlertConfig;
      if (
        req.body.type == "System Alert" ||
        req.body.type == "Synthetics Alert"
      ) {
        config["status"] = "Deleted";
      }
      CommonService.create(config, db.AlertConfigs)
        .then(async (data) => {
          req.body = {
            ...req.body,
            id: data.id,
          };

          if (req.body.type == "System Alert") {
            await configureSystemAlert({
              ...config,
              id: data.id,
            });
          }

          if (req.body.type == "Synthetics Alert") {
            console.log("Nothing to work now. Alert is configured >>>>>>>>>>");
            await configureSyntheticAlert({
              ...config,
              id: data.id,
            });
          }
          try {
            commonService.create(
              {
                resourcetypeid: data["id"],
                resourcetype: constants.RESOURCETYPE[15],
                _tenantid: data["tenantid"],
                new: data["type"] + " " + constants.HISTORYCOMMENTS[30],
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
                console.log(`Failed to updating history`, error)
          }
          customValidation.generateSuccessResponse(
            data,
            {},
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
        })
        .catch((error: Error) => {
          console.log("Error creating alerts.");
          console.log(error);
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.ALERTCONFIG };
    try {
      let condition = { id: req.body.id };

      // await deleteAlert(condition.id);

      CommonService.update(condition, req.body, db.AlertConfigs)
        .then(async (data) => {
          const config = data["dataValues"] as AlertConfig;
          try {
            commonService.create(
              {
                resourcetypeid: data["id"],
                resourcetype: constants.RESOURCETYPE[15],
                _tenantid: data["tenantid"],
                new: data["type"] + " " + constants.HISTORYCOMMENTS[31],
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
          if (config.status == "Deleted") {
            let r = null;

            if (config.type == "System Alert") {
              r = await deleteAlert(condition.id, config);
            }

            if (config.type == "Synthetics Alert") {
              r = await deleteSyntheticAlert(condition.id);
            }
            customValidation.generateSuccessResponse(
              {
                grafanaResponse: r,
              },
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
          } else {
            if (config.type == "System Alert") {
              await deleteAlert(condition.id, config);
              setTimeout(async () => {
                const r = await configureSystemAlert({
                  ...config,
                  id: condition.id,
                });

                customValidation.generateSuccessResponse(
                  {
                    grafanaResponse: r,
                  },
                  response,
                  constants.RESPONSE_TYPE_UPDATE,
                  res,
                  req
                );
              }, 2000);
            } else if (config.type == "Synthetics Alert") {
              await deleteSyntheticAlert(condition.id);
              setTimeout(async () => {
                const r = await configureSyntheticAlert({
                  ...config,
                  id: condition.id,
                });

                customValidation.generateSuccessResponse(
                  {
                    grafanaResponse: r,
                  },
                  response,
                  constants.RESPONSE_TYPE_UPDATE,
                  res,
                  req
                );
              }, 2000);
            } else {
              customValidation.generateSuccessResponse(
                {},
                response,
                constants.RESPONSE_TYPE_UPDATE,
                res,
                req
              );
            }
          }
        })
        .catch((error: Error) => {
          console.log("Error one >>>>>>>>>>>>>>");
          console.log(error);
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      console.log("Error two >>>>>>>>>>>>>>");
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async getInstancesByFilter(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.ALERTCONFIG };
    try {
      const filters = req.body;
      const data = await getInstancesByFilter(filters);
      customValidation.generateSuccessResponse(
        data,
        response,
        constants.RESPONSE_TYPE_LIST,
        res,
        req
      );
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
}

export default new Controller();

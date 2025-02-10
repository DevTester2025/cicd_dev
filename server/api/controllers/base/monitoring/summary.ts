import CommonService from "../../../services/common.service";

import db from "../../../models/model";

import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import { Op, literal } from "sequelize";
import axios from "axios";
import { subHours } from "date-fns";
import PromService from "../../../services/prometheus.service";
import { createAwsSigner } from "sign-aws-requests";
import { Sha256 } from "@aws-crypto/sha256-browser";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import * as moment from "moment";
interface Instance {
  networkid: null;
  instancerefid: string;
  instanceid: number;
  platform: string;
  promagentstat: string;
  customerid: number;
  accountid: number;
}

interface PrometheusResponse {
  status: string;
  data: {
    resultType: string;
    result: PrometheusResult[];
  };
}

interface PrometheusResult {
  metric: {
    job: string;
  };
  value: Array<number | string>;
}

// const checkIsBetween = (value: number, range: number[]): boolean => {
//   var min = Math.min.apply(Math, [range[0], range[1]]),
//     max = Math.max.apply(Math, [range[0], range[1]]);

//   return value > min && value < max;
// };

// const getValuesForLinux = async (
//   prom: string,
//   instance: Instance,
//   options: {
//     cpu_range: number[];
//     memory_range: number[];
//     disk_range: number[];
//   }
// ) => {
//   let data = {};

//   const { data: response } = await PromService.executeQuery(
//     prom,
//     `sum by (job) (rate(node_cpu_seconds_total{job=~"${instance.instancerefid}"}[1m])) < ${options.cpu_range[1]} > ${options.cpu_range[0]}`
//   );
//   if (response && response.status == "success") {
//     response.data.result.forEach((m) => {
//       const metricValue = m.value[1];
//       data["cpu"] = metricValue;
//     });
//   }

//   const { data: diskresponse } = await PromService.executeQuery(
//     prom,
//     `((node_filesystem_size_bytes{mountpoint="/",job=~"${instance.instancerefid}"} - node_filesystem_free_bytes{mountpoint="/",job=~"${instance.instancerefid}"}) / node_filesystem_size_bytes{mountpoint="/",job=~"${instance.instancerefid}"} * 100) < ${options.disk_range[1]} > ${options.disk_range[0]}`
//   );
//   if (diskresponse && diskresponse.status == "success") {
//     diskresponse.data.result.forEach((m) => {
//       const metricValue = m.value[1];
//       data["disk"] = metricValue;
//     });
//   }

//   const { data: memresponse } = await PromService.executeQuery(
//     prom,
//     `(100 * (1 - ((avg_over_time(node_memory_MemFree_bytes{job=~"${instance.instancerefid}"}[1m]) + avg_over_time(node_memory_Cached_bytes{job=~"${instance.instancerefid}"}[1m]) + avg_over_time(node_memory_Buffers_bytes{job=~"${instance.instancerefid}"}[1m])) / avg_over_time(node_memory_MemTotal_bytes{job=~"${instance.instancerefid}"}[1m])))) < ${options.memory_range[1]} > ${options.memory_range[0]}`
//   );
//   if (memresponse && memresponse.status == "success") {
//     memresponse.data.result.forEach((m) => {
//       const metricValue = m.value[1];
//       data["memory"] = metricValue;
//     });
//   }

//   const { data: uptimeresponse } = await PromService.executeQuery(
//     prom,
//     `node_time_seconds{job="${instance.instancerefid}"} - node_boot_time_seconds{job="${instance.instancerefid}"}`
//   );
//   if (uptimeresponse && uptimeresponse.status == "success") {
//     uptimeresponse.data.result.forEach((m) => {
//       const metricValue = m.value[1];
//       data["uptime"] = metricValue;
//     });
//   }

//   if (
//     !data["cpu"] ||
//     !checkIsBetween(parseFloat(data["cpu"]), options.cpu_range)
//   ) {
//     return null;
//   }
//   if (
//     !data["memory"] ||
//     !checkIsBetween(parseFloat(data["memory"]), options.memory_range)
//   ) {
//     return null;
//   }

//   if (
//     !data["disk"] ||
//     !checkIsBetween(parseFloat(data["disk"]), options.disk_range)
//   ) {
//     console.log("Inside to send null >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
//     return null;
//   }

//   return { ...data, ...instance };
// };

// const getValuesForWindows = async (
//   prom: string,
//   instance: Instance,
//   options: {
//     cpu_range: number[];
//     memory_range: number[];
//     disk_range: number[];
//   }
// ) => {
//   let data = {};

//   const { data: response } = await PromService.executeQuery(
//     prom,
//     `100 - (avg(rate(windows_cpu_time_total{job=~"${instance.instancerefid}",mode="idle"}[1m])) by (job) * 100) < ${options.cpu_range[1]} > ${options.cpu_range[0]}`
//   );

//   console.log("Response for cpu total time >>>>>>>");
//   console.log(response);

//   if (response && response.status == "success") {
//     response.data.result.forEach((m) => {
//       const metricValue = m.value[1];
//       data["cpu"] = metricValue;
//     });
//   }

//   const { data: diskresponse } = await PromService.executeQuery(
//     prom,
//     `100 - 100 * (sum by (job) (windows_logical_disk_free_bytes{job=~"${instance.instancerefid}"}) / sum by (job) (windows_logical_disk_size_bytes{job=~"${instance.instancerefid}"})) < ${options.disk_range[1]} > ${options.disk_range[0]}`
//   );
//   if (diskresponse && diskresponse.status == "success") {
//     diskresponse.data.result.forEach((m) => {
//       const metricValue = m.value[1];
//       data["disk"] = metricValue;
//     });
//   }

//   const { data: memresponse } = await PromService.executeQuery(
//     prom,
//     `100.0 - 100 * avg_over_time(windows_os_physical_memory_free_bytes{job=~"${instance.instancerefid}"}[1m]) / avg_over_time(windows_cs_physical_memory_bytes{job=~"${instance.instancerefid}"}[1m]) < ${options.memory_range[1]} > ${options.memory_range[0]}`
//   );
//   if (memresponse && memresponse.status == "success") {
//     memresponse.data.result.forEach((m) => {
//       const metricValue = m.value[1];
//       data["memory"] = metricValue;
//     });
//   }

//   const { data: uptimeresponse } = await PromService.executeQuery(
//     prom,
//     `time()-windows_system_system_up_time{job=~"${instance.instancerefid}"}`
//   );
//   if (uptimeresponse && uptimeresponse.status == "success") {
//     uptimeresponse.data.result.forEach((m) => {
//       const metricValue = m.value[1];
//       data["uptime"] = metricValue;
//     });
//   }

//   if (
//     !data["cpu"] ||
//     !checkIsBetween(parseFloat(data["cpu"]), options.cpu_range)
//   ) {
//     console.log("################## inside cpu if");
//     return null;
//   }
//   if (
//     !data["memory"] ||
//     !checkIsBetween(parseFloat(data["memory"]), options.memory_range)
//   ) {
//     console.log("################## inside memory if");
//     return null;
//   }

//   if (
//     !data["disk"] ||
//     !checkIsBetween(parseFloat(data["disk"]), options.disk_range)
//   ) {
//     console.log("################## inside disk if");
//     console.log("Inside to send null >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
//     return null;
//   }

//   return { ...data, ...instance };
// };

// const getMetricsForLinux = async (
//   prom: string,
//   instances: Instance[],
//   options: {
//     cpu_range: number[];
//     memory_range: number[];
//     disk_range: number[];
//   }
// ): Promise<Array<Record<string, any>>> => {
//   let l = instances ? instances.length : 0;
//   let values = [];

//   while (l > 0) {
//     const v = await Promise.all(
//       instances.map((i) => {
//         return getValuesForLinux(prom, i, options);
//       })
//     );

//     values = v;

//     l -= 1;
//   }

//   return values.filter((v) => v != null);
// };

// const getMetricsForWindows = async (
//   prom: string,
//   instances: Instance[],
//   options: {
//     cpu_range: number[];
//     memory_range: number[];
//     disk_range: number[];
//   }
// ): Promise<Array<Record<string, any>>> => {
//   let l = instances ? instances.length : 0;

//   let values = [];

//   while (l > 0) {
//     const v = await Promise.all(
//       instances.map((i) => {
//         return getValuesForWindows(prom, i, options);
//       })
//     );

//     values = v;

//     l -= 1;
//   }

//   return values.filter((v) => v != null);
// };

class Controller {
  constructor() {}
  // async getMetricsDetails(req: Request, res: Response): Promise<void> {
  //   try {
  //     const body = req.body as {
  //       customer: number;
  //       account: number;
  //       tag: number;
  //       tagvalue: number;
  //       tenantid: number;
  //       search?: string;
  //       cpu_range: number[];
  //       memory_range: number[];
  //       disk_range: number[];
  //     };
  //     const query = req.query as any as {
  //       limit?: number;
  //       offset?: number;
  //     };

  //     let parameters = {
  //       order: [["cloudprovider", "asc"]],
  //       where: {
  //         promagentstat: {
  //           [Op.ne]: null,
  //         },
  //         status: "Active",
  //         tenantid: body.tenantid,
  //       },
  //       limit: query.limit || undefined,
  //       offset: query.offset || undefined,
  //       include: [],
  //       attributes: [
  //         [
  //           literal(
  //             `(SELECT COUNT(*) FROM tbl_bs_eventlog Events where Events.module='Alert Config' and Events.eventdate between '${subHours(
  //               new Date(),
  //               25
  //             ).toISOString()}' and '${subHours(
  //               new Date(),
  //               0
  //             ).toISOString()}' and Events.status='Active' and Events.referencetype='System' and Events.providerrefid=Instances.instancerefid)`
  //           ),
  //           "events_count",
  //         ],
  //         "instancerefid",
  //         "instanceid",
  //         "platform",
  //         "promagentstat",
  //         "customerid",
  //         "accountid",
  //         "instancename",
  //         "cloudprovider",
  //       ],
  //     } as any;

  //     if (body.search && body.search.length > 0) {
  //       parameters["where"][Op.or] = {
  //         instancerefid: { [Op.like]: "%" + body.search + "%" },
  //         instancename: { [Op.like]: "%" + body.search + "%" },
  //       };
  //     }

  //     if (body.customer) {
  //       parameters["where"]["customerid"] = body.customer;
  //     }

  //     if (body.tag && !body.tagvalue) {
  //       parameters.include = [
  //         {
  //           model: db.TagValues,
  //           as: "tagvalues",
  //           paranoid: true,
  //           required: true,
  //           where: {
  //             resourcetype: "ASSET_INSTANCE",
  //             status: "Active",
  //             tagid: body.tag,
  //           },
  //           include: [
  //             {
  //               model: db.Tags,
  //               as: "tag",
  //             },
  //           ],
  //         },
  //       ];
  //     }
  //     if (body.tag && body.tagvalue) {
  //       parameters.include = [
  //         ...parameters.include,
  //         {
  //           model: db.TagValues,
  //           as: "tagvalues",
  //           paranoid: true,
  //           required: true,
  //           where: {
  //             resourcetype: "ASSET_INSTANCE",
  //             status: "Active",
  //             tagid: body.tag,
  //             tagvalue: { [Op.in]: [body.tagvalue] },
  //           },
  //           include: [
  //             {
  //               model: db.Tags,
  //               as: "tag",
  //               status: "Active",
  //             },
  //           ],
  //         },
  //       ];
  //     }

  //     if (body.account) {
  //       parameters.where["accountid"] = body.account;
  //     }

  //     const data = await CommonService.getCountAndList(
  //       parameters,
  //       db.Instances
  //     );
  //     const count = data["count"];
  //     const rows = data["rows"];

  //     const lookupdata = await db.LookUp.findAll({
  //       where: {
  //         status: "Active",
  //         tenantid: body.tenantid,
  //         keyname: {
  //           [Op.in]: ["mimir-url"],
  //         },
  //       },
  //     });
  //     const lookup = JSON.parse(JSON.stringify(lookupdata));
  //     const prometheusURL = lookup && lookup[0] ? lookup[0]["keyvalue"] : null;
  //     let metrics_array = ["CPU", "RAM", "UPTIME", "DISK"];
  //     let axios_array: any = await new Controller().getGrafanaMetrics(
  //       JSON.parse(JSON.stringify(rows)),
  //       prometheusURL,
  //       metrics_array
  //     );
  //     if (axios_array.length > 0) {
  //       let metricsData = await Promise.all(
  //         _.map(axios_array, (a) => {
  //           return axios(a);
  //         })
  //       );
  //       let result = {};
  //       if (metricsData) {
  //         _.map(metrics_array, (m: any, i) => {
  //           result[m] = metricsData[i].data.data;
  //         });
  //       }
  //       res.send({ metrics: result, count });
  //     } else {
  //       let count = 0;
  //       res.send({ metrics: [], count });
  //     }
  //   } catch (e) {
  //     console.log("Error getting instance metrics >>>>>>>>>>");
  //     console.log(e);
  //     res.status(500).send(e);
  //   }
  // }

  // getGrafanaMetrics = async (
  //   instancearray,
  //   prometheusURL: string,
  //   metrics_array: any
  // ) => {
  //   return new Promise((resolve: Function, reject: Function) => {
  //     let query = "";
  //     // let start = moment().format('YYYY-MM-DDTHH:mm:ss.ss') + 'Z';
  //     // let end = moment().format('YYYY-MM-DDTHH:mm:ss.ss') + 'Z';
  //     let start = "2023-01-16:00:33.200Z";
  //     let end = "2023-01-04T16:23:15.392Z";
  //     let axiosarr = [];
  //     let instances = "";
  //     if (instancearray && instancearray.length > 0) {
  //       _.forEach(instancearray, (o) => {
  //         if (instances != "") instances = instances + "|" + o.instancerefid;
  //         if (instances == "") instances = o.instancerefid;
  //       });

  //       _.each(metrics_array, async (e, idx: number) => {
  //         switch (e) {
  //           case "CPU":
  //             query = "";
  //             query = `100-(avg by(job)(irate(app_cpu_time{mode='idle',job=~'${instances}}'}[2m])))*100`;
  //             break;
  //           case "RAM":
  //             query = "";
  //             query = `100-(app_memory_free{job=~'${instances}}'} / app_memory_total{job=~'${instances}'})*100`;
  //             break;
  //           case "DISK":
  //             query = "";
  //             query = `100-(app_disk_free{job=~'${instances}'} / app_disk_total{job=~'${instances}'})*100`;
  //             break;
  //           case "UPTIME":
  //             query = "";
  //             query = `avg_over_time(up{job=~"${instances}"}[1d])*100`;
  //           default:
  //             break;
  //         }
  //         const url =
  //           prometheusURL +
  //           `query_range?query=${query}` +
  //           `&start=${start}&end=${end}&step=3600`;
  //         let grafanaRequest = {
  //           method: "POST",
  //           headers: {
  //             Authorization: process.env.GRF_TOKEN,
  //           },
  //           url: url,
  //         };
  //         axiosarr.push(grafanaRequest);
  //         if (idx == metrics_array.length - 1) {
  //           resolve(axiosarr);
  //         }
  //       });
  //     } else {
  //       resolve(axiosarr);
  //     }
  //   });
  // };

  async getMetrics(req: Request, res: Response): Promise<void> {
    const body = req.body as {
      customer: number;
      account: number;
      tag: number;
      tagvalue: number;
      tenantid: number;
      search?: string;
      cpu_range: number[];
      memory_range: number[];
      disk_range: number[];
    };
    const query = req.query as any as {
      limit?: number;
      offset?: number;
    };

    let parameters = {
      where: {
        // promagentstat: {
        //   [Op.ne]: null,
        // },
        status: "Active",
        tenantid: body.tenantid,
      },
      limit: query.limit || undefined,
      offset: query.offset || undefined,
      include: [
        // {
        //   model: db.eventlog,
        //   as: "events",
        //   paranoid: true,
        //   required: false,
        //   where: {
        //     module: "Alert Config",
        //     status: "Active",
        //     referencetype: "System",
        //   },
        // },
      ],
      attributes: [
        [
          literal(
            `(SELECT COUNT(*) FROM tbl_bs_eventlog Events where Events.module='Alert Config' and Events.eventdate between '${subHours(
              new Date(),
              25
            ).toISOString()}' and '${subHours(
              new Date(),
              0
            ).toISOString()}' and Events.status='Active' and Events.referencetype='System' and Events.providerrefid=Instances.instancerefid)`
          ),
          "events_count",
        ],
        "instancerefid",
        "instanceid",
        "platform",
        "promagentstat",
        "customerid",
        "accountid",
        "instancename",
        "cloudprovider",
      ],
    } as any;

    if (body.search && body.search.length > 0) {
      parameters["where"][Op.or] = {
        instancerefid: { [Op.like]: "%" + body.search + "%" },
        instancename: { [Op.like]: "%" + body.search + "%" },
      };
    }

    if (body.customer) {
      parameters["where"]["customerid"] = body.customer;
    }

    if (body.tag && !body.tagvalue) {
      parameters.include = [
        {
          model: db.TagValues,
          as: "tagvalues",
          paranoid: true,
          required: true,
          where: {
            resourcetype: "ASSET_INSTANCE",
            status: "Active",
            tagid: body.tag,
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
    if (body.tag && body.tagvalue) {
      parameters.include = [
        ...parameters.include,
        {
          model: db.TagValues,
          as: "tagvalues",
          paranoid: true,
          required: true,
          where: {
            resourcetype: "ASSET_INSTANCE",
            status: "Active",
            tagid: body.tag,
            tagvalue: { [Op.in]: [body.tagvalue] },
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

    if (body.account) {
      parameters.where["accountid"] = body.account;
      delete parameters.where["tagvalue"];
      delete parameters.where["tagid"];
    }

    try {
      const data = await CommonService.getCountAndList(
        parameters,
        db.Instances
      );
      // const lookupdata = await db.LookUp.findAll({
      //   where: {
      //     status: "Active",
      //     tenantid: body.tenantid,
      //     keyname: {
      //       [Op.in]: ["mimir-url"],
      //     },
      //   },
      // });
      // const lookup = JSON.parse(JSON.stringify(lookupdata));
      // const prometheusURL = lookup && lookup[0] ? lookup[0]["keyvalue"] : null;
      // const count = data["count"];
      // const rows = data["rows"];

      const instances = JSON.parse(JSON.stringify(data))["rows"] as Instance[];

      console.log("Instances list >>>>>>");
      console.log(instances);

      const promFilter = instances.map((i) => i["instancerefid"]).join("|");

      const getCpuUsage = async () => {
        const { data } = await axios.get(
          process.env.PROMETHEUS_ENDPOINT +
            `app_cpu_usage_percent{job=~'${promFilter}'}`
        );
        return data as PrometheusResponse;
      };
      const getMemoryUsage = async () => {
        const { data } = await axios.get(
          process.env.PROMETHEUS_ENDPOINT +
            `app_memory_usage_percent{job=~'${promFilter}'}`
        );
        return data as PrometheusResponse;
      };
      const getDiskUsage = async () => {
        const { data } = await axios.get(
          process.env.PROMETHEUS_ENDPOINT +
            `app_disk_usage_percent{job=~'${promFilter}'}`
        );
        return data as PrometheusResponse;
      };
      const getUp = async () => {
        const { data } = await axios.get(
          process.env.PROMETHEUS_ENDPOINT + `up{job=~'${promFilter}'}`
        );
        return data as PrometheusResponse;
      };

      const cpuUtils = (await getCpuUsage()).data.result;
      const memoryUtils = (await getMemoryUsage()).data.result;
      const diskUtils = (await getDiskUsage()).data.result;
      const up = (await getUp()).data.result;

      let responseData = {};

      cpuUtils.forEach((c) => {
        responseData[c["metric"]["job"]] = {
          ...responseData[c["metric"]["job"]],
          cpu: c["value"][1],
        };
      });
      memoryUtils.forEach((c) => {
        responseData[c["metric"]["job"]] = {
          ...responseData[c["metric"]["job"]],
          memory: c["value"][1],
        };
      });
      diskUtils.forEach((c) => {
        responseData[c["metric"]["job"]] = {
          ...responseData[c["metric"]["job"]],
          disk: c["value"][1],
        };
      });
      up.forEach((c) => {
        responseData[c["metric"]["job"]] = {
          ...responseData[c["metric"]["job"]],
          up: c["value"][1],
        };
      });

      // const groupedInstances = _.groupBy(
      //   JSON.parse(JSON.stringify(rows)),
      //   "platform"
      // );

      // const windowsMetrics = await getMetricsForWindows(
      //   prometheusURL,
      //   groupedInstances["windows"],
      //   {
      //     cpu_range: body.cpu_range,
      //     memory_range: body.memory_range,
      //     disk_range: body.disk_range,
      //   }
      // );
      // const linuxMetrics = await getMetricsForLinux(
      //   prometheusURL,
      //   groupedInstances["linux"],
      //   {
      //     cpu_range: body.cpu_range,
      //     memory_range: body.memory_range,
      //     disk_range: body.disk_range,
      //   }
      // );

      res.send(
        instances.map((i) => {
          return {
            ...i,
            ...responseData[i.instancerefid],
          };
        })
      );
    } catch (e) {
      console.log("Error getting instance metrics >>>>>>>>>>");
      console.log(e);
      res.status(500).send(e);
    }
  }
}

export default new Controller();

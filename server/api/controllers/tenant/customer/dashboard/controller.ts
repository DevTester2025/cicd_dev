import { query, Request, Response } from "express";
import { constants } from "../../../../../common/constants";
import { customValidation } from "../../../../../common/validation/customValidation";
import db from "../../../../models/model";
import commonService from "../../../../services/common.service";
import prometheusService from "../../../../services/prometheus.service";
import * as _ from "lodash";
import { queries } from "../../../../../common/query";
import DownloadService from "../../../../services/download.service";
import { CommonHelper } from "../../../../../reports";
import { AssetListTemplate } from "../../../../../reports/templates";
import sequelize = require("sequelize");
import { modules } from "../../../../../common/module";
import { Op } from 'sequelize';

export class Controller {
  constructor() {
    //
  }
  async getVMStatus(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.DASHBOARD };
    try {
      let instances = await db.Instances.findAll({
        where: {
          instancerefid: {
            [sequelize.Op.in]: req.body.instances.split("|"),
          },
          status: "Active",
        },
        attributes: ["privateipv4", "instancerefid", "cloudprovider"],
      });
      let exporter1ips = "";
      let exporter2ips = "";
      let result: any = JSON.parse(JSON.stringify(instances));
      let provider = result[0].cloudprovider;
      _.forEach(result, (o) => {
        if (exporter1ips != "")
          exporter1ips = exporter1ips + "|" + o.privateipv4 + ":9182";
        if (exporter1ips == "") exporter1ips = o.privateipv4 + ":9182";
        if (exporter2ips != "")
          exporter2ips = exporter2ips + "|" + o.privateipv4 + ":9100";
        if (exporter2ips == "") exporter2ips = o.privateipv4 + ":9100";
      });
      let query = `up{instance=~"${exporter1ips}|${exporter2ips}"}`;
      prometheusService
        .getVMStatus(req.body.tenantid, provider, query)
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
  getVmUptime(req: Request, res: Response): void {
    let response = { reference: modules.DASHBOARD };
    try {
      // let parameters = {
      //   where: {
      //     customerid: req.body.customerid,
      //     status: "Active",
      //     reportyn: "Y",
      //   },
      //   include: [
      //     {
      //       model: db.DashboardConfigHdr,
      //       as: "dashboardconfig",
      //       attributes: ["sectionname"],
      //     },
      //     {
      //       model: db.Instances,
      //       as: "instances",
      //       attributes: ["instancerefid", "instancename"],
      //       required: false,
      //     },
      //   ],
      // };
      // commonService
      //   .getAllList(parameters, db.DashboardConfigDtl)
      //   .then((result) => {
      //     if (result) {
      //       let instances = "";
      //       result.forEach((o) => {
      //         if (instances != "")
      //           instances = instances + "|" + o.instances.instancerefid;
      //         if (instances == "") instances = o.instances.instancerefid;
      //       });
      let query =
        `query=avg_over_time(up{instance=~".*:9182.*|.*:9100.*",job=~"${req.body.instances}"}[1d])*100` +
        `&start=${req.body.start}Z&end=${req.body.end}Z&step=36000`;
      prometheusService
        .getVmUptime(req.body.tenantid, query)
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
      //   customValidation.generateSuccessResponse(
      //     {
      //       instances: [],
      //       prometheus: [],
      //     },
      //     response,
      //     constants.RESPONSE_TYPE_LIST,
      //     res,
      //     req
      //   );
      // }
      // });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  kpisummary(req: Request, res: Response): void {
    let response = { reference: modules.DASHBOARD };
    try {
      let filters = {
        status: "Active",
        tenantid: req.body.tenantid,
      } as any;
      if (req.body.customerid != -1) {
        filters.customerid = req.body.customerid;
      }
      if (req.body.tagid != null) {
        filters.tagid = req.body.tagid;
      }
      if (req.body.tagvalue != null) {
        filters.tagvalue = req.body.tagvalue;
      }
      let parameters = {
        where: filters,
        include: [
          {
            model: db.SlaTemplates,
            as: "sla",
            attributes: ["slaname"],
          },
          {
            model: db.Tags,
            as: "tag",
            attributes: ["tagid", "tagname"],
          },
          {
            model: db.Customer,
            as: "customer",
            attributes: ["customerid", "customername"],
          },
        ],
      };
      commonService
        .getAllList(parameters, db.KpiUptime)
        .then((list) => {
          let formattedResponse = [];
          if (list.length > 0) {
            _.map(list, (itm) => {
              let obj = {
                slaname: itm.sla.slaname,
                kpi: itm.tag ? itm.tag.tagname + "-" : "" + itm.tagvalue,
                priority: itm.priority,
                uptimesla: itm.uptime,
                actualsla: 50,
                customer:
                  itm.customerid != -1 ? itm.customer.customername : "All",
              };
              formattedResponse.push(obj);
            });
            customValidation.generateSuccessResponse(
              formattedResponse,
              response,
              constants.RESPONSE_TYPE_LIST,
              res,
              req
            );
          } else {
            customValidation.generateSuccessResponse(
              formattedResponse,
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

  getCounts(req: Request, res: Response): void {
    let response = { reference: modules.DASHBOARD };
    try {
      let q = queries.OPS_COUNT;
      let params = {
        replacements: req.body,
        type: db.sequelize.QueryTypes.SELECT,
      } as any;
      params.replacements["subquery"] = "";
      params.replacements["ecustomerquery"] = "";
      params.replacements["tcustomerquery"] = "";
      if (req.body.customerid != -1) {
        q = q.replace(
          new RegExp(":ecustomerquery", "g"),
          "AND _customer = :customerid"
        );
        q = q.replace(
          new RegExp(":tcustomerquery", "g"),
          "AND customerid = :customerid"
        );
      }
      if (req.body.instanceid) {
        q = q.replace(
          new RegExp(":subquery", "g"),
          "AND providerrefid =:instanceid"
        );
      }
      if (req.body.tagid) {
        q = q.replace(
          new RegExp(":subquery", "g"),
          "AND providerrefid in (SELECT resourcerefid FROM tbl_bs_tag_values where tagid=:tagid and tagvalue = :tagvalue)"
        );
      }
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
  getDateWiseCounts(req: Request, res: Response): void {
    let response = { reference: modules.DASHBOARD };
    try {
      let q = queries.DATEWISE_OPS_COUNT;
      let params = {
        replacements: req.body,
        type: db.sequelize.QueryTypes.SELECT,
      } as any;
      params.replacements["subquery"] = "";
      params.replacements["ecustomerquery"] = "";
      params.replacements["tcustomerquery"] = "";
      if (req.body.customerid != -1) {
        q = q.replace(
          new RegExp(":ecustomerquery", "g"),
          "AND _customer = :customerid"
        );
        q = q.replace(
          new RegExp(":tcustomerquery", "g"),
          "AND customerid = :customerid"
        );
      }
      if (req.body.instanceid) {
        q = q.replace(
          new RegExp(":subquery", "g"),
          "AND providerrefid =:instanceid"
        );
      }
      if (req.body.tagid) {
        q = q.replace(
          new RegExp(":subquery", "g"),
          "AND providerrefid in (SELECT resourcerefid FROM tbl_bs_tag_values where tagid=:tagid and tagvalue = :tagvalue)"
        );
      }
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
  getData(req: Request, res: Response): void {
    let response = { reference: modules.DASHBOARD };
    try {
      let query = {
        status: "Active",
        tenantid: req.body.tenantid,
      } as any;
      if (req.body.customerid != -1) {
        query.customerid = req.body.customerid;
      }
      if (req.body.instanceid) {
        query.providerrefid = req.body.instanceid;
      }
      if (req.body.tagid) {
        query.providerrefid = sequelize.literal(
          "`providerrefid` in (SELECT `resourcerefid` FROM `tbl_bs_tag_values` where `tagid`=" +
            req.body.tagid +
            "and `tagvalue` = " +
            req.body.tagvalue +
            ")"
        );
      }
      if (req.body.searchText && req.body.searchText.length > 0) {
        let searchText = req.body.searchText.trim();
        query[Op.or] = [
          { severity: { [Op.like]: `%${searchText}%` } },
          { notes: { [Op.like]: `%${searchText}%` } },
          // { title: { [Op.like]: `%${searchText}%` } },
        ];
      }
      if (req.body.startdate && req.body.enddate) {
        query.incidentdate = {
          $between: [req.body.startdate, req.body.enddate],
        };
      }

      if (req.body.filterby && req.body.filterby.length > 0) {
        req.body.filterby.forEach((element) => {
          if (element.value.length > 0) {
            if (element.key == "title" || element.key == "keyname") {
              query["severity"] = element.value;
            }
          }
        });
      }
      let model = db.Incident;
      let order = [["incidentdate", "desc"]];
      let attributes = [
        "id",
        ["title", "particulars"],
        "severity",
        [
          sequelize.fn(
            "DATE_FORMAT",
            sequelize.col("incidentdate"),
            "%d-%b-%Y %H:%i"
          ),
          "date",
        ],
      ];
      if (req.body.tab != 4) {
        model = db.eventlog;
        order = [["eventdate", "desc"]];

        if (req.body.customerid != -1) {
          query._customer = req.body.customerid;
        }
        delete query["customerid"];
        delete query["incidentdate"];
        query.module = { $ne: "Alert Config" };
        if (req.body.tab == 0 || req.body.tab == 1) {
          query.module = "Alert Config";
          query.referencetype = req.body.tab == 0 ? "System" : "Security";
        }
        if (req.body.tab == 2 || req.body.tab == 3) {
          query.module = "Alert Config";
          query.referencetype = req.body.tab == 2 ? "SSL" : "Synthetics";
        }
        if (req.body.startdate && req.body.enddate) {
          query.eventdate = {
            $between: [req.body.startdate, req.body.enddate],
          };
        }
        attributes = [
          "id",
          ["notes", "particulars"],
          "providerrefid",
          "cloudprovider",
          "severity",
          [
            sequelize.fn(
              "DATE_FORMAT",
              sequelize.col("eventdate"),
              "%d-%b-%Y %H:%i"
            ),
            "date",
          ],
        ];
      }
      let condition = {
        where: query,
        attributes: attributes,
        order: order,
      } as any;
      if (req.query.order as any) {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        if (splittedOrder[0] == "date" && req.body.tab != 4) {
          splittedOrder[0] = "eventdate";
        }
        if (splittedOrder[0] == "date" && req.body.tab == 4) {
          splittedOrder[0] = "incidentdate";
        }
        if (splittedOrder[0] == "particulars" && req.body.tab != 4) {
          splittedOrder[0] = "notes";
        }
        if (splittedOrder[0] == "particulars" && req.body.tab == 4) {
          splittedOrder[0] = "title";
        }
        condition["order"] = [splittedOrder];
      }
      if (req.query.limit) {
        condition["limit"] = req.query.limit;
      }
      if (req.query.offset) {
        condition["offset"] = req.query.offset;
      }
      console.log(condition);
      commonService
        .getCountAndList(condition, model)
        .then((list) => {
          if (req.body.download) {
            let template = {
              content: AssetListTemplate,
              engine: "handlebars",
              helpers: CommonHelper,
              recipe: "html-to-xlsx",
            };
            let d = { lists: list.rows, headers: req.body.headers };
            DownloadService.generateFile(d, template, (result) => {
              res.send({
                status: true,
                data: list.rows,
                file: result,
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
      // commonService
      //   .executeQuery(q, params, db.sequelize)
      //   .then((list) => {
      //     if (req.body.download) {
      //       let template = {
      //         content: AssetListTemplate,
      //         engine: "handlebars",
      //         helpers: CommonHelper,
      //         recipe: "html-to-xlsx",
      //       };
      //       let d = { lists: list, headers: req.body.headers };
      //       DownloadService.generateFile(d, template, (result) => {
      //         res.send({
      //           status: true,
      //           data: list,
      //           file: result,
      //         });
      //       });
      //     } else {
      //       customValidation.generateSuccessResponse(
      //         list,
      //         response,
      //         constants.RESPONSE_TYPE_LIST,
      //         res,
      //         req
      //       );
      //     }
      //   })
      //   .catch((error: Error) => {
      //     customValidation.generateAppError(error, response, res, req);
      //   });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
}
export default new Controller();

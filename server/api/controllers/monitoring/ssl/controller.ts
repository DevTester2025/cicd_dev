import CommonService from "../../../services/common.service";

import db from "../../../models/model";

import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import * as _ from "lodash";
import { Op } from "sequelize";
import axios from "axios";
import { modules } from "../../../../common/module";
import * as fs from "fs";
import * as moment from "moment";
import { queries } from "../../../../common/query";
const https = require("https");
const csv = require("csvtojson");
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.SSL_MONITORING };
    try {
      let parameters = {} as any;
      parameters.where = req.body;
      if (req.query.limit) {
        parameters["limit"] = Number(req.query.limit);
      }
      if (req.query.offset) {
        parameters["offset"] = Number(req.query.offset);
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        if (!req.query.detail) {
          searchparams["name"] = {
            $like: "%" + req.body.searchText + "%",
          };
        }
        if (req.body.headers) {
          req.body.headers.forEach((element) => {
            if (element.field === "url") {
              searchparams["url"] = {
                $like: "%" + req.body.searchText + "%",
              };
            }
          });
        }
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      //#OP_B627
      if (req.query.order as any) {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      }
      parameters.where = _.omit(parameters.where, ["order"]);
      if (req.query.chart) {
        let query = queries.KPI_SSL;
        let subquery = "";
        let params = {
          replacements: req.body,
          type: db.sequelize.QueryTypes.SELECT,
        } as any;
        params.replacements["durationquery"] = "";
        params.replacements["subquery"] = "";
        if (req.body.duration) {
          if (req.body.duration == "Daily") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(tms.validity_end,'%d-%M-%Y') AS x"
            );
          }
          if (req.body.duration == "Weekly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "CONCAT('Week ', 1 + DATE_FORMAT(tms.validity_end, '%U')) AS x"
            );
          }
          if (req.body.duration == "Monthly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(LAST_DAY(tms.validity_end),'%M-%Y') AS x"
            );
          }
        }

        if (req.body.filters && req.body.filters.length > 0) {
          for (let i = 0; i < req.body.filters.length; i++) {
            if (req.body.filters[i].name) {
              const name = req.body.filters[i].name.map((d) => `"${d.title}"`);
              subquery = subquery + ` AND tms2.name IN (${name.join(",")})`;
            }
            if (req.body.filters[i].urls) {
              const urls = req.body.filters[i].urls.map((d) => `'${d.value}'`);
              subquery = subquery + ` AND tms.url IN (${urls.join(",")})`;
            }
            if (i + 1 == req.body.filters.length) {
              query = query.replace(new RegExp(":subquery", "g"), subquery);
            }
          }
        }
        if (req.body.groupby) {
          query =
            query +
            ` GROUP BY x, ${req.body.groupby} ORDER BY tms.validity_end ASC`;
        } else {
          query = query + ` GROUP BY x ORDER BY tms.validity_end ASC`;
        }

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
            console.log("err", error);
            customValidation.generateAppError(error, response, res, req);
          });
      } else {
        if (req.query.detail) {
          if (req.body.searchText) {
            let searchparams: any = {};
            searchparams["url"] = {
              $like: "%" + req.body.searchText + "%",
            };
            parameters.where = _.omit(parameters.where, ["searchText"]);
            parameters.where["$or"] = searchparams;
          }
          if (req.query.limit) {
            parameters["limit"] = req.query.limit;
          }
          if (req.query.offset) {
            parameters["offset"] = req.query.offset;
          }
          CommonService.getCountAndList(parameters, db.MonitoringSSLDtl)
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
        else if (req.query.isdownload) {
          parameters.where = _.omit(req.body, ["headers", "order"]);
          CommonService.getAllList(parameters, db.MonitoringSSLHdr)
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
        else if (req.query.isdownloaddetail) {
          parameters.where = _.omit(req.body, ["headers", "order"]);
          CommonService.getAllList(parameters, db.MonitoringSSLDtl)
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
        else {
          parameters.include = [
            {
              model: db.MonitoringSSLDtl,
              as: "monitoringssldtls",
              required: false,
              attributes: ["id", "validity_end", "url", "instancerefid"],
            },
          ];
          parameters.distinct = true;
          CommonService.getCountAndList(parameters, db.MonitoringSSLHdr)
            .then((list) => {
              let formatedData = JSON.parse(JSON.stringify(list));
              _.map(formatedData.rows, (item) => {
                item.urlcount = item.monitoringssldtls.length;
                let expire = _.sortBy(item.monitoringssldtls, [
                  "validity_end",
                ])[0];
                item.expireSoon =
                  !_.isEmpty(expire) && expire.validity_end != null
                    ? `${moment(expire.validity_end).format("DD-MMM-YYYY")} (` +
                      `<a href=${expire.url} target="_blank">${expire.url}</a>` +
                      ")"
                    : "-";
                return item;
              });
              customValidation.generateSuccessResponse(
                formatedData,
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
      }
    } catch (e) {
      console.log("catch", e);
      customValidation.generateAppError(e, response, res, req);
    }
  }

  byId(req: Request, res: Response): void {
    let response = { reference: modules.SSL_MONITORING };
    try {
      let parameters = {} as any;
      parameters.where = {
        id: req.params.id,
      };
      parameters.include = [
        {
          model: db.MonitoringSSLDtl,
          as: "monitoringssldtls",
          required: false,
          where: { status: "Active" },
        },
      ];
      CommonService.getData(parameters, db.MonitoringSSLHdr)
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

  import(req: any, res: Response): void {
    let response = { reference: modules.SSL_MONITORING };
    try {
      let file = req.files.file;
      let request = {};
      if (!customValidation.isEmptyValue(req.body.formData)) {
        request = JSON.parse(req.body.formData);
      }
      let monitoringurls = [];
      fs.readFile(file.path, "utf8", (err, data) => {
        console.log("err", err);
        console.log("data", data);
        // fs.writeFileSync(process.cwd() + `/logs/ssl-monitoring.xlxs`, data);

        CommonService.fileUpload(
          req.files.file.path,
          process.cwd() + `/logs/` + "ssl-monitoring.csv"
        );

        setTimeout(function () {
          const csvFilePath = process.cwd() + `/logs/` + "ssl-monitoring.csv";
          csv()
            .fromFile(csvFilePath)
            .then((jsonObj) => {
              console.log(jsonObj);
              jsonObj.map((e) => {
                monitoringurls.push({
                  tenantid: request["tenantid"],
                  url: e.url,
                  instancerefid: e.instancerefid != "" ? e.instancerefid : null,
                  status: constants.STATUS_ACTIVE,
                  createdby: request["createdby"],
                  createddt: new Date(),
                });
              });

              let obj = {
                ...request,
                lastupdatedby: request["createdby"],
                lastupdateddt: new Date(),
                monitoringssldtls: monitoringurls,
              };
              let options = {
                include: [
                  { model: db.MonitoringSSLDtl, as: "monitoringssldtls" },
                ],
              };

              CommonService.saveWithAssociation(
                obj,
                options,
                db.MonitoringSSLHdr
              )
                .then(async (data) => {
                  if (data) {
                    let detailArray = JSON.parse(
                      JSON.stringify(data)
                    ).monitoringssldtls;
                    new Controller().findValidity(detailArray);
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
            });
        }, 1000);
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  findValidity(data) {
    try {
      let i = 0;
      processData();
      function processData() {
        var url = new URL(data[i].url);
        var hostname = url.hostname;
        var options = {
          host: hostname,
          port: 443,
          method: "GET",
        };
        var req = https.request(options, function (res) {
          let result = JSON.parse(
            JSON.stringify(res.connection.getPeerCertificate())
          );
          if (result && result["valid_to"] != undefined) {
            db.MonitoringSSLDtl.update(
              {
                validity_from: result["valid_from"],
                validity_end: result["valid_to"],
              },
              {
                where: {
                  id: data[i].id,
                },
              }
            ).then((res) => {
              if (res) {
                i++;
                if (i != data.length) {
                  setTimeout(function () {
                    processData();
                  }, 2000);
                }
              }
            });
          } else {
            i++;
            if (i != data.length) {
              setTimeout(function () {
                processData();
              }, 2000);
            }
            req.end();
          }
        });
        req.on("error", function (error) {
          if (error) {
            i++;
            if (i != data.length) {
              setTimeout(function () {
                processData();
              }, 2000);
            }
            req.end();
          }
        });
        // console.log('req', JSON.stringify(req))
        req.end();
      }
    } catch (e) {
      console.log(e);
    }
  }

  create(req: Request, res: Response): void {
    let response = { reference: modules.SSL_MONITORING };
    try {
      let options = {
        include: [{ model: db.MonitoringSSLDtl, as: "monitoringssldtls" }],
      };
      req.body.createddt = new Date();
      req.body.lastupdatedby = req.body["createdby"];
      req.body.lastupdateddt = new Date();
      req.body.monitoringssldtls = req.body.monitoringssldtls.map((e) => {
        e.createddt = new Date();
        return e;
      });
      CommonService.saveWithAssociation(req.body, options, db.MonitoringSSLHdr)
        .then(async (data) => {
          try {
            CommonService.create(
              {
                resourcetypeid: data["id"],
                resourcetype: constants.RESOURCETYPE[17],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[34],
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
          if (data) {
            let detailArray = JSON.parse(
              JSON.stringify(data)
            ).monitoringssldtls;
            new Controller().findValidity(detailArray);
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

  async update(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.ALERTCONFIG };
    try {
      let condition = { id: req.body.id };

      CommonService.update(condition, req.body, db.MonitoringSSLHdr)
        .then(async (data) => {
          try {
            CommonService.create(
              {
                resourcetypeid: data["id"],
                resourcetype: constants.RESOURCETYPE[17],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[35],
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
          if (req.body.monitoringssldtls) {
            CommonService.bulkUpdate(
              req.body.monitoringssldtls,
              ["id", "url", "sslhdrid", "status", "instancerefid"],
              db.MonitoringSSLDtl
            );
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
  monitoringUpdate(req: Request, res: Response): void {
    let response = { reference: modules.ALERTCONFIG };
    try {
      let condition = { id: req.body.id };
      CommonService.update(condition, req.body, db.MonitoringSSLDtl)
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

import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import { AppError } from "../../../../common/appError";
import _ = require("lodash");
import { modules } from "../../../../common/module";
import { queries } from "../../../../common/query";
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
import commonService from "../../../services/common.service";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = { module: modules.CUSTOMER };
    try {
      let parameters = {
        where: req.body,
      } as any;
      if (req.query.order && typeof req.query.order === "string") {
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
      parameters.include = [] as any;
      parameters.include = [
        {
          model: db.TenantRegion,
          as: "tenantregion",
          required: false,
          paranoid: false,
          where: { status: constants.STATUS_ACTIVE },
        },
      ];
      if (req.query.tenant) {
        parameters.include.push({
          model: db.Tenant,
          as: "tenant",
          attributes: ["tenantname"],
        });
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["customername"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["contactemail"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["phoneno"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      parameters.where = _.omit(parameters.where, ["order"]);
      if (req.query.chart) {
        let query = queries.KPI_CUSTOMER;
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
              "DATE_FORMAT(ttc.createddt,'%d-%M-%Y') AS x"
            );
          }
          if (req.body.duration == "Weekly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "CONCAT('Week ', 1 + DATE_FORMAT(ttc.createddt, '%U')) AS x"
            );
          }
          if (req.body.duration == "Monthly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(LAST_DAY(ttc.createddt),'%M-%Y') AS x"
            );
          }
        }

        if (Array.isArray(req.body.filters) && req.body.filters.length > 0) {
          for (let i = 0; i < req.body.filters.length; i++) {
            if (req.body.filters[i].customerid) {
              let customerids = _.map(
                req.body.filters[i].customerid,
                function (e) {
                  return e.value;
                }
              );
              subquery = subquery + ` AND ttc.customerid IN (${customerids})`;
            }
            if (req.body.filters[i].cloudprovider) {
              const cloudprovider = req.body.filters[i].cloudprovider.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery +
                ` AND tta.cloudprovider IN (${cloudprovider.join(",")})`;
            }
            if (req.body.filters[i].rolename) {
              const rolename = req.body.filters[i].rolename.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND tta.rolename IN (${rolename.join(",")})`;
            }
            if (i + 1 == req.body.filters.length) {
              query = query.replace(new RegExp(":subquery", "g"), subquery);
            }
          }
        }

        if (req.body.groupby) {
          if (req.body.groupby == "customername") {
            subquery = subquery + ` AND tta.cloudprovider IS NOT NULL `;
            query = query.replace(new RegExp(":subquery", "g"), subquery);
            query =
              query +
              ` GROUP BY x, ttc.${req.body.groupby},tta.cloudprovider ORDER BY ttc.createddt ASC`;
          } else {
            query =
              query +
              ` GROUP BY x, ${req.body.groupby} ORDER BY ttc.createddt ASC`;
          }
        } else {
          query = query + ` GROUP BY x ORDER BY ttc.createddt ASC`;
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
        if (req.query.count) {
          parameters.include = [];
          CommonService.getCountAndList(parameters, db.Customer)
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
          CommonService.getAllList(parameters, db.Customer)
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
          CommonService.getAllList(parameters, db.Customer)
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
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  byId(req: Request, res: Response): void {
    const response = { module: modules.CUSTOMER };
    let condition = {} as any;
    condition.where = { customerid: req.params.id };
    condition.include = [];
    condition.include = [
      {
        model: db.TenantRegion,
        as: "tenantregion",
        required: false,
        where: { status: constants.STATUS_ACTIVE },
      },
    ];
    if (
      req.query.include &&
      _.includes(req.query.include, "maintenancewindowmap")
    ) {
      condition.include.push({
        model: db.MaintwindowMap,
        as: "maintenancewindowmap",
        required: false,
        include: [
          {
            model: db.MaintWindow,
            as: "maintwindow",
          },
        ],
        where: {
          status: constants.STATUS_ACTIVE,
          txnid: req.params.id,
          txntype: "CUSTOMER",
        },
      });
    }
    if (req.query.sla) {
      condition.include.push(
        {
          model: db.CustomerIncidentSla,
          as: "customerincidentsla",
          required: false,
          where: { status: constants.STATUS_ACTIVE, customerid: req.params.id },
          include: [
            {
              model: db.IncidentSla,
              as: "incidentsla",
              required: false,
              where: { status: constants.STATUS_ACTIVE },
              attributes: ["id", "priority"],
            },
          ],
        },
        {
          model: db.CustomerAvailSla,
          as: "customeravailabilitysla",
          required: false,
          where: { status: constants.STATUS_ACTIVE, customerid: req.params.id },
        },
        {
          model: db.CustomerServiceCreditSla,
          as: "customerservicecredits",
          required: false,
          where: { status: constants.STATUS_ACTIVE, customerid: req.params.id },
        }
      );
    }
    try {
      CommonService.getData(condition, db.Customer)
        .then((data) => {
          if (req.query.download) {
            let config: any = _.find(data.dashboardconfig, { key: "LOGO" });
            if (config) {
              CommonService.readS3File("Customer/" + config.value).then((d) => {
                customValidation.generateSuccessResponse(
                  {
                    status: true,
                    data: data,
                    content: d,
                    filename: config.value,
                  },
                  response,
                  constants.RESPONSE_TYPE_LIST,
                  res,
                  req
                );
              });
            } else {
              customValidation.generateSuccessResponse(
                {
                  status: true,
                  data: data,
                  content: null,
                  filename: null,
                },
                response,
                constants.RESPONSE_TYPE_LIST,
                res,
                req
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

  create(req: Request, res: Response): void {
    const response = { module: modules.CUSTOMER };
    try {
      if (!req.body.ecl2flag) {
        CommonService.create(req.body, db.Customer)
          .then((data) => {
            try {
              commonService.create(
                {
                  resourcetypeid: data["customerid"],
                  resourcetype: constants.RESOURCETYPE[20],
                  _tenantid: data["tenantid"],
                  new: constants.HISTORYCOMMENTS[46],
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
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      } else {
        let requesturl = constants.ECL2.MANAGMENT.CREATE_TENANT;
        let requestheader = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };
        let requestparams = {
          tenant_name: (
            req.body.customername.replace(/ /g, "").substring(0, 10) +
            "_" +
            req.body.ecl2region
          ).toUpperCase(),
          description: "",
          region: req.body.ecl2region,
          contract_id: req.body.ecl2contractid,
        };

        CommonService.callECL2Reqest(
          "POST",
          req.body.region,
          req.body.tenantid,
          requesturl,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
          .then((ecl2tenantdata) => {
            if (!customValidation.isEmptyValue(ecl2tenantdata.tenant_id)) {
              requesturl = constants.ECL2.MANAGMENT.ADD_TENANT_ROLE;
              requestparams = {
                user_id: req.body.ecl2userid,
                tenant_id: ecl2tenantdata.tenant_id,
              } as any;

              CommonService.callECL2Reqest(
                "POST",
                req.body.region,
                req.body.tenantid,
                requesturl,
                requestheader,
                requestparams,
                req.body.ecl2tenantid
              )
                .then((ecl2data) => {
                  req.body.ecl2tenantid = ecl2tenantdata.tenant_id;
                  if (!customValidation.isEmptyValue(ecl2data)) {
                    CommonService.create(req.body, db.Customer)
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
                        customValidation.generateAppError(
                          error,
                          response,
                          res,
                          req
                        );
                      });
                  } else {
                    customValidation.generateAppError(
                      new AppError(ecl2data.message),
                      response,
                      res,
                      req
                    );
                  }
                })
                .catch((error: Error) => {
                  customValidation.generateAppError(error, response, res, req);
                });
            } else {
              customValidation.generateAppError(
                new AppError(ecl2tenantdata.message),
                response,
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

  update(req: Request, res: Response): void {
    const response = { module: modules.CUSTOMER };
    try {
      let condition = { customerid: req.body.customerid };
      CommonService.update(condition, req.body, db.Customer)
        .then((data) => {
          try {
            commonService.create(
              {
                resourcetypeid: data["customerid"],
                resourcetype: constants.RESOURCETYPE[20],
                _tenantid: data["tenantid"],
                new: constants.HISTORYCOMMENTS[47],
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
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_UPDATE,
            res,
            req
          );

          if (
            req.body.status === constants.DELETE_STATUS &&
            !customValidation.isEmptyValue(req.body.ecl2tenantid)
          ) {
            let requesturl = constants.ECL2.MANAGMENT.DELETE_TENANT.replace(
              "{tenant_id}",
              req.body.ecl2tenantid
            );
            let requestheader = {
              Accept: "application/json",
              "Content-Type": "application/json",
            };
            let requestparams = {};

            CommonService.callECL2Reqest(
              "DELETE",
              req.body.ecl2region,
              req.body.tenantid,
              requesturl,
              requestheader,
              requestparams,
              req.body.ecl2tenantid
            )
              .then((ecl2data) => {
                console.log(ecl2data);
              })
              .catch((error: Error) => {
                console.log(error);
              });
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  upload(req: any, res: Response): void {
    const response = { module: modules.CUSTOMER };
    try {
      let request = {} as any;
      if (!customValidation.isEmptyValue(req.body.formData)) {
        request = JSON.parse(req.body.formData);
      }
      if (!customValidation.isEmptyValue(req.files.file)) {
        let filename = request.filename;
        CommonService.uploadFiletoS3(
          req.files.file.path,
          "Customer/" + filename
        );
        CommonService.update(
          { customerid: request.customerid },
          request,
          db.Customer
        ).then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_UPDATE,
            res,
            req
          );
        });
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  createOrUpdateSLA(req: any, res: Response): void {
    const response = { module: modules.CUSTOMER };
    try {
      let condition = { customerid: req.body.customerid };
      CommonService.update(
        condition,
        {
          slatemplateid: req.body.slatemplateid,
          lastupdateddt: req.body.lastupdateddt,
          lastupdatedby: req.body.lastupdatedby,
        },
        db.Customer
      )
        .then((data) => {
          if (Array.isArray(req.body.incidentsla)&& req.body.incidentsla.length > 0) {
            CommonService.bulkUpdate(
              req.body.incidentsla,
              [
                "tenantid",
                "slatemplateid",
                "customerid",
                "incidentslaid",
                "responsetime",
                "resolutiontime",
                "tagid",
                "tagvalue",
                "notes",
                "status",
                "createddt",
                "createdby",
                "lastupdateddt",
                "lastupdatedby",
              ],
              db.CustomerIncidentSla
            )
              .then((data) => {
                console.log("Customer Incident Sla updated");
              })
              .catch((error: Error) => {
                customValidation.generateAppError(error, response, res, req);
              });
          }

          if (Array.isArray(req.body.availablitysla) && req.body.availablitysla.length > 0) {
            CommonService.bulkUpdate(
              req.body.availablitysla,
              [
                "tenantid",
                "slatemplateid",
                "customerid",
                "slaid",
                "uptimeprcnt",
                "rpo",
                "rto",
                "tagid",
                "tagvalue",
                "notes",
                "status",
                "createddt",
                "createdby",
                "lastupdateddt",
                "lastupdatedby",
              ],
              db.CustomerAvailSla
            )
              .then((data) => {
                console.log("Customer Availability Sla updated");
              })
              .catch((error: Error) => {
                customValidation.generateAppError(error, response, res, req);
              });
          }

          if (Array.isArray(req.body.servicecredits) && req.body.servicecredits.length > 0) {
            CommonService.bulkUpdate(
              req.body.servicecredits,
              [
                "tenantid",
                "slatemplateid",
                "customerid",
                "servicecreditid",
                "utmin",
                "utmax",
                "servicecredit",
                "tagid",
                "tagvalue",
                "notes",
                "status",
                "createddt",
                "createdby",
                "lastupdateddt",
                "lastupdatedby",
              ],
              db.CustomerServiceCreditSla
            )
              .then((data) => {
                console.log("Customer Service credits Sla updated");
              })
              .catch((error: Error) => {
                customValidation.generateAppError(error, response, res, req);
              });
          }

          if (req.body.prevslatemplateid) {
            // Delete previous records
            CommonService.update(
              {
                slatemplateid: req.body.prevslatemplateid,
                customerid: req.body.customerid,
              },
              { status: constants.DELETE_STATUS },
              db.CustomerIncidentSla
            );
            CommonService.update(
              {
                slatemplateid: req.body.prevslatemplateid,
                customerid: req.body.customerid,
              },
              { status: constants.DELETE_STATUS },
              db.CustomerServiceCreditSla
            );
            CommonService.update(
              {
                slatemplateid: req.body.prevslatemplateid,
                customerid: req.body.customerid,
              },
              { status: constants.DELETE_STATUS },
              db.CustomerAvailSla
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
}
export default new Controller();

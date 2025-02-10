import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants, ECLApiURL } from "../../../../../common/constants";
import _ = require("lodash");
import { AppError } from "../../../../../common/appError";
import * as request from "request";
export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters: any = {};
      //  parameters.where = req.body;
      let condition = {
        tenantid: req.body.tenantid,
        status: req.body.status,
      } as any;
      if (req.body.sourcecustomerid != null) {
        condition.sourcecustomerid = req.body.sourcecustomerid;
      }
      if (req.body.region != null) {
        condition.region = req.body.region;
      }
      if (req.body.tenantconnrequestids) {
        condition.tenantconnrequestid = req.body.tenantconnrequestids;
        delete condition["tenantconnrequestids"];
      }
      parameters = { where: condition, order: [["lastupdateddt", "desc"]] };
      parameters.include = [
        {
          model: db.ecl2tags,
          as: "ecl2tags",
          paranoid: false,
          required: false,
          where: { status: "Active", resourcetype: "TenantReq" },
        },
        {
          model: db.Customer,
          as: "sourcecustomer",
          required: false,
          paranoid: false,
          attributes: [
            "customername",
            "ecl2tenantid",
            "customerid",
            "ecl2region",
          ],
        },
        {
          model: db.Customer,
          as: "descustomer",
          required: false,
          paranoid: false,
          attributes: ["customername", "ecl2tenantid", "customerid"],
        },
        {
          model: db.ecl2networks,
          as: "desnetwork",
          required: false,
          paranoid: false,
          attributes: ["networkname", "ecl2networkid", "networkid"],
        },
      ];
      commonService
        .getAllList(parameters, db.ecl2tenantconnrequest)
        .then((list) => {
          if (req.body.dataSync) {
            let requesturl = ECLApiURL.LIST.TENANT_CONN_REQUEST;
            let requestheader = {
              Accept: "application/json",
              "Content-Type": "application/json",
            };
            let requestparams = {};
            if (!customValidation.isEmptyValue(req.body.ecl2tenantid)) {
              commonService
                .callECL2Reqest(
                  "GET",
                  req.body.region,
                  req.body.tenantid,
                  requesturl,
                  requestheader,
                  requestparams,
                  req.body.ecl2tenantid
                )
                .then((ecl2data) => {
                  if (
                    list.length === 0 ||
                    ecl2data.tenant_connection_requests.length === 0
                  ) {
                    customValidation.generateSuccessResponse(
                      list,
                      response,
                      constants.RESPONSE_TYPE_LIST,
                      res,
                      req
                    );
                  } else {
                    let updationValues = [] as any;
                    _.map(list, function (item, index) {
                      _.find(
                        ecl2data.tenant_connection_requests,
                        function (data: any) {
                          if (data.id === item.ecltenantconnrequestid) {
                            updationValues.push({
                              tenantconnrequestid: item.tenantconnrequestid,
                              approvalrequestid: data.approval_request_id,
                              eclstatus: data.status,
                            });
                            // list[index].tenantconnrequestid = list[index].tenantconnrequestid;
                            // list[index].eclstatus = data.status;
                            // list[index].approvalrequestid = data.approval_request_id;
                            return data;
                          }
                        }
                      );
                      if (index + 1 === list.length) {
                        commonService
                          .bulkUpdate(
                            updationValues,
                            ["eclstatus", "approvalrequestid"],
                            db.ecl2tenantconnrequest
                          )
                          .then((data) => {
                            customValidation.generateSuccessResponse(
                              list,
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
                      }
                    });
                  }
                })
                .catch((error: Error) => {
                  customValidation.generateAppError(error, response, res, req);
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  byId(req: Request, res: Response): void {
    let response = {};
    try {
      commonService
        .getById(req.params.id, db.ecl2tenantconnrequest)
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
    let response = {};
    try {
      let requesturl = ECLApiURL.CREATE.TENANT_CONN_REQUEST;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        tenant_connection_request: {
          tenant_id_other: req.body.ecl2destinationcustomerid,
          network_id: req.body.ecl2networkid,
          name: req.body.name,
          description: req.body.description,
          tag: req.body.tags,
        },
      } as any;

      commonService
        .callECL2Reqest(
          "POST",
          req.body.region,
          req.body.tenantid,
          requesturl,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data: any) => {
          if (
            !customValidation.isEmptyValue(ecl2data.tenant_connection_request)
          ) {
            req.body.ecltenantconnrequestid =
              ecl2data.tenant_connection_request.id;
            req.body.approvalrequestid =
              ecl2data.tenant_connection_request.approval_request_id;
            req.body.eclstatus = ecl2data.tenant_connection_request.status;
            req.body.keystoneuserid =
              ecl2data.tenant_connection_request.keystone_user_id;
            if (req.body.flag === "APPROVAL") {
              setTimeout(function () {
                new Controller().updateApproval(req, res, ecl2data, "SAVE");
              }, 5000);
            } else {
              let query = {} as any;
              query.include = [{ model: db.ecl2tags, as: "ecl2tags" }];
              commonService
                .saveWithAssociation(req.body, query, db.ecl2tenantconnrequest)
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
            }
          } else {
            customValidation.generateAppError(
              new AppError(ecl2data.cause),
              response,
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

  updateApproval(req: any, res: any, tenantreqdata: any, flag): void {
    let response = {};
    try {
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let getrequesturl = ECLApiURL.GET.TENANT_CONN_REQUEST.replace(
        "{tenant_connection_request_id}",
        tenantreqdata.tenant_connection_request.id
      );
      commonService
        .callECL2Reqest(
          "GET",
          req.body.region,
          req.body.tenantid,
          getrequesturl,
          requestheader,
          "",
          req.body.ecl2tenantid
        )
        .then((reqData) => {
          let responseData = JSON.parse(reqData);
          let approvalrequesturl =
            ECLApiURL.UPDATE.TENANT_CONN_REQ_APPROVAL.replace(
              "{request_id}",
              responseData.tenant_connection_request.approval_request_id
            );
          let requestparams = {
            status: "approved",
          };
          let ecl2authurl = constants.ECL2_GET_AUTH_TOKEN_URL.replace(
            "{zone}",
            req.body.region
          );
          request.post(
            {
              url: ecl2authurl,
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              json: {
                auth: {
                  identity: {
                    methods: ["password"],
                    password: {
                      user: {
                        domain: {
                          id: "default",
                        },
                        name: req.body.accesskey,
                        password: req.body.secretkey,
                      },
                    },
                  },
                  scope: {
                    project: {
                      id: req.body.admintenantid,
                    },
                  },
                },
              },
            },
            function (err, httpResponse, body) {
              if (err) {
                console.log(err);
                customValidation.generateAppError(
                  new AppError(err.message),
                  response,
                  res,
                  req
                );
              } else {
                console.log(httpResponse.headers["x-subject-token"]);
                if (_.isEmpty(httpResponse.headers["x-subject-token"])) {
                  customValidation.generateAppError(
                    new AppError(
                      constants.ECL2_INVALID_CREDENTIALS.replace(
                        "{region}",
                        req.body.region
                      )
                    ),
                    response,
                    res,
                    req
                  );
                  if (flag === "SAVE") {
                    let query = {} as any;
                    query.include = [{ model: db.ecl2tags, as: "ecl2tags" }];
                    commonService
                      .saveWithAssociation(
                        req.body,
                        query,
                        db.ecl2tenantconnrequest
                      )
                      .then((data) => {
                        //
                      })
                      .catch((error: Error) => {
                        console.log(error);
                      });
                  }
                } else {
                  requestheader = _.merge(requestheader, {
                    "X-Auth-Token": httpResponse.headers["x-subject-token"],
                  });
                  console.log("\n-----Request Header-----");
                  console.log(approvalrequesturl);
                  console.log(requestheader);
                  console.log("\n-----Request Body-----");
                  console.log(JSON.stringify(requestparams));
                  request(
                    {
                      method: "PUT",
                      url: approvalrequesturl,
                      headers: requestheader,
                      json: requestparams,
                    },
                    function (err, httpResponse, body) {
                      if (err) {
                        console.log("\n-----Response Error-----");
                        console.log(err);
                        customValidation.generateAppError(
                          new AppError(err.message),
                          response,
                          res,
                          req
                        );
                      } else {
                        console.log("\n-----Response Body-----");
                        console.log(JSON.stringify(body));
                        if (body.code === 400) {
                          customValidation.generateAppError(
                            new AppError(body.message),
                            response,
                            res,
                            req
                          );
                        } else {
                          if (flag === "UPDATE") {
                            if (httpResponse.statusCode === 200) {
                              req.body.status = "approved";
                            }
                            let condition = {
                              tenantconnrequestid: req.body.tenantconnrequestid,
                            };
                            commonService
                              .update(
                                condition,
                                req.body,
                                db.ecl2tenantconnrequest
                              )
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
                            if (httpResponse.statusCode === 200) {
                              req.body.status = "approved";
                            }
                            let query = {} as any;
                            query.include = [
                              { model: db.ecl2tags, as: "ecl2tags" },
                            ];
                            commonService
                              .saveWithAssociation(
                                req.body,
                                query,
                                db.ecl2tenantconnrequest
                              )
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
                          }
                        }
                      }
                    }
                  );
                }
              }
            }
          );
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = ECLApiURL.UPDATE.TENANT_CONN_REQUEST.replace(
        "{tenant_connection_request_id}",
        req.body.ecltenantconnrequestid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        tenant_connection_request: {
          name: req.body.name,
          description: req.body.description,
          tags: req.body.tags,
        },
      } as any;

      commonService
        .callECL2Reqest(
          "PUT",
          req.body.region,
          req.body.tenantid,
          requesturl,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          let condition = { tenantconnrequestid: req.body.tenantconnrequestid };
          commonService
            .update(condition, req.body, db.ecl2tenantconnrequest)
            .then((data) => {
              if (!customValidation.isEmptyValue(req.body.ecl2tags)) {
                let updateattributes = [
                  "tagkey",
                  "tagvalue",
                  "resourcetype",
                  "status",
                  "lastupdatedby",
                  "lastupdateddt",
                ];
                commonService
                  .bulkUpdate(req.body.ecl2tags, updateattributes, db.ecl2tags)
                  .then((result: any) => {
                    //
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
              if (req.body.flag === "APPROVAL") {
                new Controller().updateApproval(req, res, ecl2data, "UPDATE");
              } else {
                customValidation.generateSuccessResponse(
                  data,
                  response,
                  constants.RESPONSE_TYPE_UPDATE,
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

  delete(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = ECLApiURL.DELETE.TENANT_CONN_REQUEST.replace(
        "{tenant_connection_request_id}",
        req.body.ecltenantconnrequestid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {};
      commonService
        .callECL2Reqest(
          "DELETE",
          req.body.region,
          req.body.tenantid,
          requesturl,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          let condition = { tenantconnrequestid: req.body.tenantconnrequestid };
          commonService
            .update(condition, req.body, db.ecl2tenantconnrequest)
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

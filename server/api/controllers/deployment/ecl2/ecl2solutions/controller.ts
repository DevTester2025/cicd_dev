import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants, ECLApiURL } from "../../../../../common/constants";
import { AppError } from "../../../../../common/appError";
import * as _ from "lodash";
import * as request from "request";
export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters.where = req.body;
      parameters.include = [
        {
          model: db.ecl2tags,
          as: "tags",
          paranoid: false,
          required: false,
          where: { status: "Active", resourcetype: "ECL2" },
        },
        {
          model: db.TagValues,
          as: "tagvalues",
          paranoid: false,
          required: false,
          where: {
            status: "Active",
            cloudprovider: "ECL2",
            resourcetype: "SOLUTION_ASSET",
          },
          include: [
            { model: db.Tags, as: "tag", paranoid: false, required: false },
          ],
        },
      ];
      commonService
        .getAllList(parameters, db.ecl2solutions)
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

  byId(req: any, res: any): void {
    let response = {};
    try {
      let parameters = {} as any;
      parameters.where = { ecl2solutionid: req.params.id };
      parameters.include = [
        {
          model: db.ecl2vsrx,
          as: "ecl2vsrx",
          required: false,
          paranoid: false,
          include: [
            {
              model: db.ecl2vsrxinterface,
              as: "ecl2vsrxinterface",
              required: false,
              paranoid: false,
            },
          ],
        },
        {
          model: db.ecl2internetgateways,
          as: "ecl2internetgateways",
          required: false,
          paranoid: false,
          include: [
            {
              model: db.ecl2iginterface,
              as: "ecl2iginterface",
              paranoid: false,
              required: false,
              include: [
                {
                  model: db.ecl2networks,
                  as: "ecl2networks",
                  required: false,
                  paranoid: false,
                  include: [
                    {
                      model: db.ecl2subnets,
                      as: "ecl2subnets",
                      required: false,
                      paranoid: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: db.TagValues,
          as: "tagvalues",
          paranoid: false,
          required: false,
          where: {
            status: "Active",
            cloudprovider: "ECL2",
            resourcetype: "SOLUTION_ASSET",
          },
          include: [
            { model: db.Tags, as: "tag", paranoid: false, required: false },
          ],
        },
      ];
      commonService
        .getData(parameters, db.ecl2solutions)
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
      let options = {
        include: [
          { model: db.ecl2tags, as: "tags" },
          { model: db.TagValues, as: "tagvalues" },
        ],
      };
      commonService
        .saveWithAssociation(req.body, options, db.ecl2solutions)
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

  createConnRequest(req: Request, res: Response): void {
    let i = 1;
    let result = {};
    req.body.tenantconnreqobj.forEach((element) => {
      result[element.sourcecustomerid] = [];
    });

    req.body.tenantconnreqobj.forEach((element) => {
      let response = {};
      try {
        let requesturl = ECLApiURL.CREATE.TENANT_CONN_REQUEST;
        let requestheader = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        let requestparams = {
          tenant_connection_request: {
            tenant_id_other: element.destinationecl2tenantid,
            network_id: element.ecl2networkid,
          },
        } as any;
        let parameters = {} as any;
        parameters = {
          tenantid: element.tenantid,
          sourcecustomerid: element.sourcecustomerid,
          customerid: element.customerid,
          networkid: element.networkid,
          status: "Active",
        };
        let condition = { where: parameters } as any;
        commonService
          .getData(condition, db.ecl2tenantconnrequest)
          .then((existdata: any) => {
            if (
              !customValidation.isEmptyValue(existdata) &&
              !customValidation.isEmptyValue(existdata.dataValues)
            ) {
              let existObj = {
                sourcecustomerid: existdata.dataValues.sourcecustomerid,
                networkid: existdata.dataValues.networkid,
                ecl2networkid: element.ecl2networkid,
                ecl2tenantid: element.ecl2tenantid,
                eclstatus: existdata.dataValues.eclstatus,
                tenantconnrequestid: existdata.dataValues.tenantconnrequestid,
                ecltenantconnrequestid:
                  existdata.dataValues.ecltenantconnrequestid,
              };
              if (req.body.tenantconnreqobj.length === i) {
                _.map(result, function (value: any, key) {
                  if (Number(key) === existdata.dataValues.sourcecustomerid) {
                    value.push(existObj);
                  }
                });
                new Controller().updateApproval(req, res, result);
              }
              i++;
            } else {
              commonService
                .callECL2Reqest(
                  "POST",
                  element.region,
                  element.tenantid,
                  requesturl,
                  requestheader,
                  requestparams,
                  element.ecl2tenantid
                )
                .then((ecl2data) => {
                  if (
                    !customValidation.isEmptyValue(
                      ecl2data.tenant_connection_request
                    )
                  ) {
                    element.ecltenantconnrequestid =
                      ecl2data.tenant_connection_request.id;
                    element.approvalrequestid =
                      ecl2data.tenant_connection_request.approval_request_id;
                    element.eclstatus =
                      ecl2data.tenant_connection_request.status;
                    element.keystoneuserid =
                      ecl2data.tenant_connection_request.keystone_user_id;
                    commonService
                      .create(element, db.ecl2tenantconnrequest)
                      .then((connectiondata) => {
                        let sharedobj = {
                          sourcecustomerid: connectiondata.sourcecustomerid,
                          networkid: connectiondata.networkid,
                          ecl2networkid: element.ecl2networkid,
                          ecl2tenantid: element.ecl2tenantid,
                          eclstatus: connectiondata.status,
                          tenantconnrequestid:
                            connectiondata.tenantconnrequestid,
                          ecltenantconnrequestid:
                            connectiondata.ecltenantconnrequestid,
                        };
                        if (req.body.tenantconnreqobj.length === i) {
                          _.map(result, function (value: any, key) {
                            if (
                              Number(key) ===
                              existdata.dataValues.sourcecustomerid
                            ) {
                              value.push(sharedobj);
                            }
                          });
                          new Controller().updateApproval(req, res, result);
                        }
                        i++;
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
                })
                .catch((error: Error) => {
                  customValidation.generateAppError(error, response, res, req);
                });
            }
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      } catch (e) {
        customValidation.generateAppError(e, response, res, req);
      }
    });
  }
  updateApproval(req: any, res: any, result: any) {
    let response = {} as any;
    let i = 1;
    setTimeout(function () {
      _.map(result, function (value: any, key) {
        value.forEach((element) => {
          if (element.eclstatus !== "approved") {
            let requestheader = {
              Accept: "application/json",
              "Content-Type": "application/json",
            };
            let getrequesturl = ECLApiURL.GET.TENANT_CONN_REQUEST.replace(
              "{tenant_connection_request_id}",
              element.ecltenantconnrequestid
            );
            commonService
              .callECL2Reqest(
                "GET",
                req.body.region,
                req.body.tenantid,
                getrequesturl,
                requestheader,
                "",
                element.ecl2tenantid
              )
              .then((reqData) => {
                let responseData = JSON.parse(reqData);
                let approvalrequesturl =
                  ECLApiURL.UPDATE.TENANT_CONN_REQ_APPROVAL.replace(
                    "{request_id}",
                    responseData.tenant_connection_request.approval_request_id
                  );
                let requestparams = {
                  eclstatus: "approved",
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
                      } else {
                        requestheader = _.merge(requestheader, {
                          "X-Auth-Token":
                            httpResponse.headers["x-subject-token"],
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
                            } else {
                              console.log("\n-----Response Body-----");
                              console.log(JSON.stringify(body));
                              if (body.code === 400) {
                                console.log(JSON.stringify(body));
                              }
                              if (httpResponse.statusCode === 200) {
                                let condition = {
                                  tenantconnrequestid:
                                    element.tenantconnrequestid,
                                };
                                let parameters = {
                                  eclstatus: "approved",
                                };
                                commonService
                                  .update(
                                    condition,
                                    parameters,
                                    db.ecl2tenantconnrequest
                                  )
                                  .then((data) => {
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
                              if (value.length === i) {
                                customValidation.generateSuccessResponse(
                                  result,
                                  response,
                                  constants.RESPONSE_TYPE_SAVE,
                                  res,
                                  req
                                );
                              }
                            }
                          }
                        );
                      }
                    }
                  }
                );
              })
              .catch((error: Error) => {
                customValidation.generateAppError(error, response, res, req);
              });
          }
        });
      });
    }, 5000);
  }
  updateConnReq(
    req: Request,
    res: Response,
    sharedtenants: any,
    responsedata: any
  ): void {
    let response = {};
    if (!customValidation.isEmptyValue(sharedtenants)) {
      let params = { sharedtenants: sharedtenants };
      let condition = { ecl2solutionid: responsedata.ecl2solutionid };
      commonService
        .update(condition, params, db.ecl2solutions)
        .then((updateddata) => {
          customValidation.generateSuccessResponse(
            updateddata,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
        });
    } else {
      customValidation.generateSuccessResponse(
        responsedata,
        response,
        constants.RESPONSE_TYPE_SAVE,
        res,
        req
      );
    }
  }

  update(req: any, res: Response): void {
    let response = {};
    try {
      let condition = { ecl2solutionid: req.body.ecl2solutionid };
      commonService
        .update(condition, req.body, db.ecl2solutions)
        .then((data: any) => {
          if (!customValidation.isEmptyValue(req.body.tags)) {
            let updateattributes = [
              "tagkey",
              "tagvalue",
              "status",
              "resourceid",
              "lastupdatedby",
              "lastupdateddt",
            ];
            commonService
              .bulkUpdate(req.body.tags, updateattributes, db.ecl2tags)
              .then((result: any) => {})
              .catch((error: Error) => {
                customValidation.generateAppError(error, response, res, req);
              });
          }

          if (!customValidation.isEmptyValue(req.body.tagvalues)) {
            let updateattributes = [
              "cloudprovider",
              "resourcetype",
              "resourceid",
              "tagid",
              "tagvalue",
              "status",
              "lastupdatedby",
              "lastupdateddt",
            ];
            commonService
              .bulkUpdate(req.body.tagvalues, updateattributes, db.TagValues)
              .then((result: any) => {})
              .catch((error: Error) => {
                customValidation.generateAppError(error, response, res, req);
              });
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

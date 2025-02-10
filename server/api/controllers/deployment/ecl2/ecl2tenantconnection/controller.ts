import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants, ECLApiURL } from "../../../../../common/constants";
import { AppError } from "../../../../../common/appError";

export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters = { where: req.body };
      parameters.include = [
        {
          model: db.ecl2tags,
          as: "ecl2tags",
          paranoid: false,
          required: false,
          where: { status: "Active", resourcetype: "TenantConn" },
        },
        {
          model: db.Instances,
          as: "instance",
          paranoid: false,
          required: true,
          where: { status: constants.STATUS_ACTIVE },
        },
      ];
      commonService
        .getAllList(parameters, db.ecl2tenantconnection)
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

  byId(req: Request, res: Response): void {
    let response = {};
    try {
      commonService
        .getById(req.params.id, db.ecl2tenantconnection)
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
      let requesturl = ECLApiURL.CREATE.TENANT_CONN;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        tenant_connection: {
          name: req.body.name,
          description: req.body.description,
          tags: req.body.tags,
          tenant_connection_request_id: req.body.ecltenantconnrequestid,
          device_type: "ECL::Compute::Server",
          device_id: req.body.ecl2serverid,
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
        .then((ecl2data) => {
          if (
            !customValidation.isEmptyValue(ecl2data.tenant_connection) &&
            !customValidation.isEmptyValue(ecl2data.tenant_connection.id)
          ) {
            req.body.eclttenantconnectionid = ecl2data.tenant_connection.id;
            let query = {} as any;
            query.include = [{ model: db.ecl2tags, as: "ecl2tags" }];
            commonService
              .saveWithAssociation(req.body, query, db.ecl2tenantconnection)
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

  update(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = ECLApiURL.UPDATE.TENANT_CONN.replace(
        "{tenant_connection_id}",
        req.body.eclttenantconnectionid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        tenant_connection: {
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
          let condition = { tenantconnectionid: req.body.tenantconnectionid };
          commonService
            .update(condition, req.body, db.ecl2tenantconnection)
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
                    customValidation.generateSuccessResponse(
                      data,
                      response,
                      constants.RESPONSE_TYPE_UPDATE,
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
      let requesturl = ECLApiURL.UPDATE.TENANT_CONN.replace(
        "{tenant_connection_id}",
        req.body.eclttenantconnectionid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {} as any;
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
          let condition = { tenantconnectionid: req.body.tenantconnectionid };
          commonService
            .update(condition, req.body, db.ecl2tenantconnection)
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

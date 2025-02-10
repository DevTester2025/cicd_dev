import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import _ = require("lodash");

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
          as: "subnettags",
          required: false,
          paranoid: false,
        },
      ];
      commonService
        .getAllList(parameters, db.ecl2subnets)
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
        .getById(req.params.id, db.ecl2subnets)
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
      let requesturl = constants.ECL2_CREATE_SUBNET_URL;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        subnet: {
          cidr: req.body.subnetcidr,
          description: req.body.description,
          enable_dhcp: req.body.enabledhcp === "Y" ? true : false,
          ip_version: 4, // The IP version used. (supports only 4)
          network_id: req.body.ecl2networkid,
          tags: req.body.tags,
        },
      } as any;
      if (!customValidation.isEmptyValue(req.body.subnetname)) {
        requestparams.subnet.name = req.body.subnetname;
      }
      if (!customValidation.isEmptyValue(req.body.allocationpools)) {
        requestparams.subnet.allocation_pools = JSON.parse(
          req.body.allocationpools
        );
      }
      if (!customValidation.isEmptyValue(req.body.gatewayip)) {
        requestparams.subnet.gateway_ip = req.body.gatewayip;
      }
      if (!customValidation.isEmptyValue(req.body.dnsnameservers)) {
        requestparams.subnet.dns_nameservers = JSON.parse(
          req.body.dnsnameservers
        );
      }
      if (!customValidation.isEmptyValue(req.body.ntpservers)) {
        requestparams.subnet.ntp_servers = JSON.parse(req.body.ntpservers);
      }
      if (!customValidation.isEmptyValue(req.body.ecl2tags)) {
        requestparams.subnet.tags = req.body.ecl2tags;
      }
      if (!customValidation.isEmptyValue(req.body.hostroutes)) {
        requestparams.subnet.host_routes = JSON.parse(req.body.hostroutes);
      }
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
          req.body.ecl2subnetid = ecl2data.subnet.id;
          req.body.gatewayip = ecl2data.subnet.gateway_ip;
          req.body.subnetname = ecl2data.subnet.name;
          let query = {} as any;
          query.include = [{ model: db.ecl2tags, as: "subnettags" }];
          commonService
            .saveWithAssociation(req.body, query, db.ecl2subnets)
            .then((data) => {
              customValidation.generateSuccessResponse(
                data,
                response,
                constants.RESPONSE_TYPE_SAVE,
                res,
                req
              );
            })
            .catch((error: any) => {
              customValidation.generateAppError(error, response, res, req);
            });
        })
        .catch((error: any) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = constants.ECL2_UPDATE_SUBNET_URL.replace(
        "{subnet_id}",
        req.body.ecl2subnetid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        subnet: {
          description: req.body.description,
          enable_dhcp: req.body.enabledhcp === "Y" ? true : false,
          tags: req.body.tags,
        },
      } as any;
      if (!customValidation.isEmptyValue(req.body.subnetname)) {
        requestparams.subnet.name = req.body.subnetname;
      }
      if (!customValidation.isEmptyValue(req.body.gatewayip)) {
        requestparams.subnet.gateway_ip = req.body.gatewayip;
      }
      if (!customValidation.isEmptyValue(req.body.dnsnameservers)) {
        requestparams.subnet.dns_nameservers = JSON.parse(
          req.body.dnsnameservers
        );
      }
      if (!customValidation.isEmptyValue(req.body.ntpservers)) {
        requestparams.subnet.ntp_servers = JSON.parse(req.body.ntpservers);
      }
      if (!customValidation.isEmptyValue(req.body.ecl2tags)) {
        requestparams.subnet.tags = req.body.ecl2tags;
      }
      if (!customValidation.isEmptyValue(req.body.hostroutes)) {
        requestparams.subnet.host_routes = JSON.parse(req.body.hostroutes);
      }

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
          let condition = { subnetid: req.body.subnetid };
          commonService
            .update(condition, req.body, db.ecl2subnets)
            .then((data) => {
              if (!customValidation.isEmptyValue(req.body.subnettags)) {
                let updateattributes = [
                  "tagkey",
                  "tagvalue",
                  "resourcetype",
                  "status",
                  "lastupdatedby",
                  "lastupdateddt",
                ];
                commonService
                  .bulkUpdate(
                    req.body.subnettags,
                    updateattributes,
                    db.ecl2tags
                  )
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
      let requesturl = constants.ECL2_DELETE_SUBNET_URL.replace(
        "{subnet_id}",
        req.body.ecl2subnetid
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
          let condition = { subnetid: req.body.subnetid };
          commonService
            .update(condition, req.body, db.ecl2subnets)
            .then((data) => {
              customValidation.generateSuccessResponse(
                data,
                response,
                constants.RESPONSE_TYPE_DELETE,
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

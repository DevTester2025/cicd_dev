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
          as: "porttags",
          paranoid: false,
          required: false,
          where: { status: "Active" },
        },
      ];
      commonService
        .getAllList(parameters, db.ecl2ports)
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
        .getById(req.params.id, db.ecl2ports)
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
      let requesturl = constants.ECL2_CREATE_PORT_URL;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        port: {
          admin_state_up: req.body.adminstateup === "Y" ? true : false,
          description: req.body.description,
          network_id: req.body.ecl2networkid,
          segmentation_id: Number(req.body.segmentationid),
          segmentation_type: req.body.segmentationtype,
          tags: req.body.tags,
          tenant_id: "{tenant_id}",
        },
      } as any;
      if (req.body.tags) {
        requestparams.port.tags = req.body.tags;
      }
      if (req.body.portname) {
        requestparams.port.name = req.body.portname;
      }
      if (req.body.fixedips) {
        requestparams.port.fixedips = JSON.parse(req.body.fixedips);
      }
      if (req.body.allowedaddresspairs) {
        requestparams.port.allowed_address_pairs = JSON.parse(
          req.body.allowedaddresspairs
        );
      }
      if (req.body.deviceid) {
        requestparams.port.device_id = req.body.deviceid;
      }
      if (req.body.deviceowner) {
        requestparams.port.deviceowner = req.body.deviceowner;
      }
      if (req.body.macaddress) {
        requestparams.port.mac_address = req.body.macaddress;
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
          req.body.ecl2portid = ecl2data.port.id;
          req.body.portname = ecl2data.port.name;
          let query = {} as any;
          query.include = [
            {
              model: db.ecl2tags,
              as: "porttags",
              paranoid: false,
              required: false,
            },
          ];
          commonService
            .saveWithAssociation(req.body, query, db.ecl2ports)
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
      let requesturl = constants.ECL2_UPDATE_PORT_URL.replace(
        "{port_id}",
        req.body.ecl2portid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        port: {
          admin_state_up: req.body.adminstateup === "Y" ? true : false,
          description: req.body.description,
          segmentation_id: Number(req.body.segmentationid),
          segmentation_type: req.body.segmentationtype,
        },
      } as any;
      if (req.body.portname) {
        requestparams.port.name = req.body.portname;
      }
      if (req.body.fixedips) {
        requestparams.port.fixedips = JSON.parse(req.body.fixedips);
      }
      if (req.body.allowedaddresspairs) {
        requestparams.port.allowed_address_pairs = JSON.parse(
          req.body.allowedaddresspairs
        );
      }
      if (req.body.tags) {
        requestparams.port.tags = req.body.tags;
      }
      if (req.body.deviceid) {
        requestparams.port.device_id = req.body.deviceid;
      }
      if (req.body.deviceowner) {
        requestparams.port.deviceowner = req.body.deviceowner;
      }
      if (req.body.macaddress) {
        requestparams.port.mac_address = req.body.macaddress;
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
          let condition = { portid: req.body.portid };
          commonService
            .update(condition, req.body, db.ecl2ports)
            .then((data) => {
              if (!customValidation.isEmptyValue(req.body.porttags)) {
                let updateattributes = [
                  "tagkey",
                  "tagvalue",
                  "resourcetype",
                  "status",
                  "lastupdatedby",
                  "lastupdateddt",
                ];
                commonService
                  .bulkUpdate(req.body.porttags, updateattributes, db.ecl2tags)
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
      let requesturl = constants.ECL2_DELETE_PORT_URL.replace(
        "{port_id}",
        req.body.ecl2portid
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
          let condition = { portid: req.body.portid };
          commonService
            .update(condition, req.body, db.ecl2ports)
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

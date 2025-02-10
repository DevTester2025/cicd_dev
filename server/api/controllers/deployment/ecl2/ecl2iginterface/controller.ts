import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";

export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      commonService
        .getAllList(parameters, db.ecl2iginterface)
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
        .getById(req.params.id, db.ecl2iginterface)
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
      let requesturl = constants.ECL2_CREATE_IG_INTERFACE_URL;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        gw_interface: {
          description: req.body.description,
          gw_vipv4: req.body.gwvipv4,
          internet_gw_id: req.body.ecl2internetgatewayid,
          netmask: req.body.netmask,
          network_id: req.body.ecl2networkid,
          primary_ipv4: req.body.primaryipv4,
          secondary_ipv4: req.body.secondaryipv4,
          service_type: req.body.servicetype,
          vrid: req.body.vrid,
        },
      } as any;
      if (!customValidation.isEmptyValue(req.body.interfacename)) {
        requestparams.gw_interface.name = req.body.interfacename;
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
          req.body.ecl2iginterfaceid = ecl2data.gw_interface.id;
          commonService
            .create(req.body, db.ecl2iginterface)
            .then((data) => {
              if (!customValidation.isEmptyValue(req.body.ecl2subnets)) {
                let condition = { subnetid: req.body.ecl2subnets.subnetid };
                commonService
                  .update(condition, req.body.ecl2subnets, db.ecl2subnets)
                  .then((ecl2subnets) => {
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
                customValidation.generateSuccessResponse(
                  data,
                  response,
                  constants.RESPONSE_TYPE_SAVE,
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

  update(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = constants.ECL2_UPDATE_IG_INTERFACE_URL.replace(
        "{gw_interface_id}",
        req.body.ecl2iginterfaceid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        gw_interface: {
          description: req.body.description,
          name: req.body.interfacename,
        },
      };

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
          let condition = { iginterfaceid: req.body.iginterfaceid };
          commonService
            .update(condition, req.body, db.ecl2iginterface)
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
  delete(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = constants.ECL2_DELETE_IG_INTERFACE_URL.replace(
        "{gw_interface_id}",
        req.body.ecl2iginterfaceid
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
          let condition = { iginterfaceid: req.body.iginterfaceid };
          commonService
            .update(condition, req.body, db.ecl2iginterface)
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

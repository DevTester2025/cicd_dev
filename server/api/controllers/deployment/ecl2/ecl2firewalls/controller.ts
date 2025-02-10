import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import * as _ from "lodash";

export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      parameters.include = [
        {
          model: db.ecl2zones,
          as: "ecl2zones",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2firewallplans,
          as: "ecl2firewallplans",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2firewallinterface,
          as: "ecl2firewallinterface",
          required: false,
          paranoid: false,
          include: [
            {
              model: db.ecl2networks,
              as: "ecl2networks",
              required: false,
              paranoid: false,
            },
          ],
        },
        {
          model: db.Customer,
          as: "customer",
          required: false,
          paranoid: false,
          attributes: ["customername", "ecl2tenantid", "customerid"],
        },
      ];
      commonService
        .getAllList(parameters, db.ecl2firewalls)
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
        .getById(req.params.id, db.ecl2firewalls)
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
      let requesturl = constants.ECL2_CREATE_FIREWALL_URL;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        firewall: {
          availability_zone: req.body.availabilityzone,
          default_gateway: null,
          description: req.body.description,
          firewall_plan_id: req.body.ecl2firewallplanid,
          name: req.body.firewallname,
        },
      };

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
          req.body.ecl2firewallid = ecl2data.firewall.id;
          commonService
            .create(req.body, db.ecl2firewalls)
            .then((data) => {
              if (ecl2data.firewall.interfaces.length > 0) {
                let fwinterfecearray = [];
                _.forEach(ecl2data.firewall.interfaces, function (fwinterface) {
                  let ecl2interface = {
                    ecl2fwinterfaceid: fwinterface.id,
                    tenantid: req.body.tenantid,
                    firewallid: data.firewallid,
                    ipaddress: fwinterface.ip_address,
                    fwinterfacename: fwinterface.name,
                    region: req.body.region,
                    slotnumber: fwinterface.slot_number,
                    status: "Down",
                    createdby: "Admin",
                    createddt: new Date(),
                  };
                  fwinterfecearray.push(ecl2interface);
                });
                commonService
                  .bulkCreate(fwinterfecearray, db.ecl2firewallinterface)
                  .then((data) => {
                    // Empty
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
      let requesturl = constants.ECL2_UPDATE_FIREWALL_URL.replace(
        "{firewall_id}",
        req.body.ecl2firewallid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        firewall: {
          default_gateway: null,
          description: req.body.description,
          name: req.body.firewallname,
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
          let condition = { firewallid: req.body.firewallid };
          commonService
            .update(condition, req.body, db.ecl2firewalls)
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
      let requesturl = constants.ECL2_DELETE_FIREWALL_URL.replace(
        "{firewall_id}",
        req.body.ecl2firewallid
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
          let condition = { firewallid: req.body.firewallid };
          commonService
            .update(condition, req.body, db.ecl2firewalls)
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

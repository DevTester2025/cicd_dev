import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants, ECLApiURL } from "../../../../../common/constants";

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
          model: db.ecl2networks,
          as: "ecl2networks",
          required: false,
          paranoid: false,
          include: [
            {
              model: db.ecl2subnets,
              as: "ecl2subnets",
              paranoid: false,
              required: false,
              where: { status: "Active" },
              attributes: ["subnetid", "subnetcidr"],
            },
          ],
        },
      ];
      commonService
        .getAllList(parameters, db.ecl2firewallinterface)
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
        .getById(req.params.id, db.ecl2firewallinterface)
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
      commonService
        .create(req.body, db.ecl2firewallinterface)
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

  update(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = ECLApiURL.UPDATE.FIREWALL_INTERFACE.replace(
        "{firewall_interface_id}",
        req.body.ecl2fwinterfaceid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        firewall_interface: {
          description: req.body.description,
          name: req.body.fwinterfacename,
          network_id: req.body.ecl2networkid,
        },
      } as any;
      if (req.body.ipaddress) {
        requestparams.firewall_interface.ip_address = req.body.ipaddress;
      }
      if (req.body.virtualipaddress) {
        requestparams.firewall_interface.virtual_ip_address =
          req.body.virtualipaddress;
      }
      if (req.body.protocol && req.body.vrid) {
        requestparams.firewall_interface.virtual_ip_properties = {
          protocol: req.body.protocol,
          vrid: req.body.vrid,
        };
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
          let condition = { fwinterfaceid: req.body.fwinterfaceid };
          req.body.ipaddress = ecl2data.firewall_interface.ip_address;
          commonService
            .update(condition, req.body, db.ecl2firewallinterface)
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
      let condition = { fwinterfaceid: req.body.fwinterfaceid };
      commonService
        .update(condition, req.body, db.ecl2firewallinterface)
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}

export default new Controller();

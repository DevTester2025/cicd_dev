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
      parameters.include = [
        {
          model: db.ecl2internetservices,
          as: "ecl2internetservices",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2qosoptions,
          as: "ecl2qosoptions",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2zones,
          as: "ecl2zones",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2iginterface,
          as: "ecl2iginterface",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2igglobalip,
          as: "ecl2igglobalip",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2igstaticip,
          as: "ecl2igstaticip",
          required: false,
          paranoid: false,
          where: { status: "Active" },
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
        .getAllList(parameters, db.ecl2internetgateways)
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
      let parameters = {} as any;
      parameters = {
        where: {
          internetgatewayid: req.params.id,
        },
        order: [["lastupdateddt", "desc"]],
      };
      parameters.include = [
        {
          model: db.ecl2internetservices,
          as: "ecl2internetservices",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2qosoptions,
          as: "ecl2qosoptions",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2zones,
          as: "ecl2zones",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2iginterface,
          as: "ecl2iginterface",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2igglobalip,
          as: "ecl2igglobalip",
          required: false,
          paranoid: false,
          where: { status: "Active" },
        },
        {
          model: db.ecl2igstaticip,
          as: "ecl2igstaticip",
          required: false,
          paranoid: false,
          where: { status: "Active" },
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
        .getAllList(parameters, db.ecl2internetgateways)
        .then((list) => {
          customValidation.generateSuccessResponse(
            list.length > 0 ? list[0] : {},
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });

      // commonService.getById(req.params.id, db.ecl2internetgateways).then((data) => {
      //     customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_LIST, res, req);
      // }).catch((error: Error) => {
      //     customValidation.generateAppError(error, response, res, req);
      // });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  create(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = constants.ECL2_CREATE_INTERNET_GATEWAY_URL;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        internet_gateway: {
          description: req.body.description,
          internet_service_id: req.body.ecl2internetserviceid,
          name: req.body.gatewayname,
          qos_option_id: req.body.ecl2qosoptionid,
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
          req.body.ecl2internetgatewayid = ecl2data.internet_gateway.id;
          commonService
            .create(req.body, db.ecl2internetgateways)
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
      let requesturl = constants.ECL2_UPDATE_INTERNET_GATEWAY_URL.replace(
        "{internet_gateway_id}",
        req.body.ecl2internetgatewayid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        internet_gateway: {
          description: req.body.description,
          name: req.body.gatewayname,
          qos_option_id: req.body.ecl2qosoptionid,
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
          let condition = { internetgatewayid: req.body.internetgatewayid };
          commonService
            .update(condition, req.body, db.ecl2internetgateways)
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
      let requesturl = constants.ECL2_DELETE_INTERNET_GATEWAY_URL.replace(
        "{internet_gateway_id}",
        req.body.ecl2internetgatewayid
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
          let condition = { internetgatewayid: req.body.internetgatewayid };
          commonService
            .update(condition, req.body, db.ecl2internetgateways)
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

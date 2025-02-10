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
      commonService
        .getAllList(parameters, db.ecl2lbsyslogserver)
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
        .getById(req.params.id, db.ecl2lbsyslogserver)
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
      let requesturl = ECLApiURL.CREATE.LB_SYSLOG_SERVER;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        load_balancer_syslog_server: {
          acl_logging: req.body.acllogging,
          date_format: req.body.dateformat,
          description: req.body.description,
          ip_address: req.body.ipaddress,
          load_balancer_id: req.body.ecl2loadbalancerid,
          log_facility: req.body.logfacility,
          log_level: req.body.loglevel,
          name: req.body.lbsyslogservername,
          port_number: req.body.portnumber,
          priority: req.body.priority,
          tcp_logging: req.body.tcplogging,
          time_zone: req.body.timezone,
          transport_type: req.body.transporttype,
        },
      } as any;
      if (req.body.appflowlogging) {
        requestparams.load_balancer_syslog_server.appflow_logging =
          req.body.appflowlogging;
      }
      if (req.body.userconfigurablelogmessages) {
        requestparams.load_balancer_syslog_server.user_configurable_log_messages =
          req.body.userconfigurablelogmessages;
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
          req.body.ecl2lbsyslogserverid =
            ecl2data.load_balancer_syslog_server.id;
          commonService
            .create(req.body, db.ecl2lbsyslogserver)
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
      let requesturl = ECLApiURL.UPDATE.LB_SYSLOG_SERVER.replace(
        "{load_balancer_syslog_server_id}",
        req.body.ecl2lbsyslogserverid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        load_balancer_syslog_server: {
          acl_logging: req.body.acllogging,
          date_format: req.body.dateformat,
          description: req.body.description,
          load_balancer_id: req.body.ecl2loadbalancerid,
          log_facility: req.body.logfacility,
          log_level: req.body.loglevel,
          priority: req.body.priority,
          tcp_logging: req.body.tcplogging,
          time_zone: req.body.timezone,
        },
      } as any;
      if (req.body.appflowlogging) {
        requestparams.load_balancer_syslog_server.appflow_logging =
          req.body.appflowlogging;
      }
      if (req.body.userconfigurablelogmessages) {
        requestparams.load_balancer_syslog_server.user_configurable_log_messages =
          req.body.userconfigurablelogmessages;
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
          let condition = { lbsyslogserverid: req.body.lbsyslogserverid };

          commonService
            .update(condition, req.body, db.ecl2lbsyslogserver)
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
      let condition = { lbsyslogserverid: req.body.lbsyslogserverid };
      commonService
        .update(condition, req.body, db.ecl2lbsyslogserver)
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

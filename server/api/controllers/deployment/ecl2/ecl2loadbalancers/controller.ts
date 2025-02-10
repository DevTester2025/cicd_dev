import commonService from "../../../../services/common.service";
import citrixService from "../../../../services/citrix.service";
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
          model: db.ecl2lbplan,
          as: "ecl2lbplan",
          required: false,
          paranoid: false,
        },
        {
          model: db.ecl2zones,
          as: "lbzones",
          required: false,
          paranoid: false,
        },
        {
          model: db.ecl2lbsettings,
          as: "lbsettings",
          required: false,
          paranoid: false,
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
        .getAllList(parameters, db.ecl2loadbalancers)
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
          loadbalancerid: req.params.id,
        },
        order: [["lastupdateddt", "desc"]],
      };
      parameters.include = [
        {
          model: db.ecl2lbplan,
          as: "ecl2lbplan",
          required: false,
          paranoid: false,
        },
        {
          model: db.ecl2zones,
          as: "lbzones",
          required: false,
          paranoid: false,
        },
        {
          model: db.ecl2lbsettings,
          as: "lbsettings",
          required: false,
          paranoid: false,
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
        .getAllList(parameters, db.ecl2loadbalancers)
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
      // commonService.getById(req.params.id, db.ecl2loadbalancers).then((data) => {
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
      let requesturl = constants.ECL2_CREATE_LOADBAL_URL;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        load_balancer: {
          availability_zone: req.body.availabilityzone,
          description: req.body.description,
          load_balancer_plan_id: req.body.ecl2lbplanid,
          name: req.body.lbname,
          tenant_id: "{tenant_id}",
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
          req.body.ecl2loadbalancerid = ecl2data.load_balancer.id;
          req.body.adminusername = ecl2data.load_balancer.admin_username;
          req.body.adminpassword = ecl2data.load_balancer.admin_password;
          req.body.username = ecl2data.load_balancer.user_username;
          req.body.userpassword = ecl2data.load_balancer.user_password;
          commonService
            .create(req.body, db.ecl2loadbalancers)
            .then((data) => {
              // Save Loadbalancer Interfaces
              if (ecl2data.load_balancer.interfaces.length > 0) {
                let lbinterfecearray = [];
                _.forEach(
                  ecl2data.load_balancer.interfaces,
                  function (lbinterface) {
                    let ecl2interface = {
                      ecl2lbinterfaceid: lbinterface.id,
                      tenantid: req.body.tenantid,
                      region: req.body.region,
                      loadbalancerid: data.loadbalancerid,
                      ipaddress: lbinterface.ip_address,
                      lbinterfacename: lbinterface.name,
                      slotnumber: lbinterface.slot_number,
                      type: lbinterface.type,
                      status: "Down",
                      createdby: "Admin",
                      createddt: new Date(),
                    };
                    lbinterfecearray.push(ecl2interface);
                  }
                );
                commonService
                  .bulkCreate(lbinterfecearray, db.ecl2lbinterface)
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

              // Save Loadbalancer Syslog Servers
              if (ecl2data.load_balancer.syslog_servers.length > 0) {
                let lbsylogarray = [];
                _.forEach(
                  ecl2data.load_balancer.syslog_servers,
                  function (lbsyslogserver) {
                    let ecl2syslog = {
                      ecl2lbsyslogserverid: lbsyslogserver.id,
                      tenantid: req.body.tenantid,
                      region: req.body.region,
                      loadbalancerid: data.loadbalancerid,
                      ipaddress: lbsyslogserver.ip_address,
                      lbsyslogservername: lbsyslogserver.name,
                      logfacility: lbsyslogserver.log_facility,
                      loglevel: lbsyslogserver.log_level,
                      portnumber: lbsyslogserver.port_number,
                      status: "Active",
                      createdby: "Admin",
                      createddt: new Date(),
                    };
                    lbsylogarray.push(ecl2syslog);
                  }
                );
                commonService
                  .bulkCreate(lbsylogarray, db.ecl2lbsyslogserver)
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
      let requesturl = constants.ECL2_UPDATE_LOADBAL_URL.replace(
        "{load_balancer_id}",
        req.body.ecl2loadbalancerid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        load_balancer: {
          description: req.body.description,
          name: req.body.lbname,
        },
      } as any;
      if (!customValidation.isEmptyValue(req.body.defaultgateway)) {
        requestparams.load_balancer.default_gateway = req.body.defaultgateway;
      }
      if (req.body.loadbalancerplanid !== req.body.eloadbalancerplanid) {
        requestparams.load_balancer.load_balancer_plan_id =
          req.body.ecl2lbplanid;
      }
      if (req.body.flag === "TEMPLATE") {
        let condition = { loadbalancerid: req.body.loadbalancerid };
        commonService
          .update(condition, req.body, db.ecl2loadbalancers)
          .then((data) => {
            if (!customValidation.isEmptyValue(req.body.lbsettings)) {
              commonService
                .upsert(req.body.lbsettings, db.ecl2lbsettings)
                .then((ldata) => {})
                .catch((error: Error) => {
                  console.log(error);
                });
            }
            if (!customValidation.isEmptyValue(req.body.ecl2solutions)) {
              let updateattributes = [
                "loadbalancerid",
                "lastupdatedby",
                "lastupdateddt",
              ];
              commonService
                .bulkUpdate(
                  req.body.ecl2solutions,
                  updateattributes,
                  db.ecl2solutions
                )
                .then((updated) => [
                  //
                  console.log("Updated"),
                ]);
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
      } else {
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
            let condition = { loadbalancerid: req.body.loadbalancerid };
            commonService
              .update(condition, req.body, db.ecl2loadbalancers)
              .then((data) => {
                if (!customValidation.isEmptyValue(req.body.lbsettings)) {
                  commonService
                    .upsert(req.body.lbsettings, db.ecl2lbsettings)
                    .then((ldata) => {})
                    .catch((error: Error) => {
                      console.log(error);
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
          })
          .catch((error: any) => {
            customValidation.generateAppError(error, response, res, req);
          });
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  delete(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = constants.ECL2_DELETE_LOADBAL_URL.replace(
        "{load_balancer_id}",
        req.body.ecl2loadbalancerid
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
          let condition = { loadbalancerid: req.body.loadbalancerid };
          commonService
            .update(condition, req.body, db.ecl2loadbalancers)
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
        .catch((error: any) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();

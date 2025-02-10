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
          model: db.ecl2zones,
          as: "ecl2zones",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          attributes: ["region", "zoneid"],
        },
        {
          model: db.ecl2commonfunctionpool,
          as: "ecl2commonfunctionpool",
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
        .getAllList(parameters, db.ecl2commonfunctiongateway)
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
          cfgatewayid: req.params.id,
        },
        order: [["lastupdateddt", "desc"]],
      };
      parameters.include = [
        {
          model: db.ecl2zones,
          as: "ecl2zones",
          required: false,
          paranoid: false,
          where: { status: "Active" },
          attributes: ["region", "zoneid"],
        },
        {
          model: db.ecl2commonfunctionpool,
          as: "ecl2commonfunctionpool",
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
        .getAllList(parameters, db.ecl2commonfunctiongateway)
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
      // commonService.getById(req.params.id, db.ecl2commonfunctiongateway).then((data) => {
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
      let requesturl = ECLApiURL.CREATE.COMMON_FN_GATEWAY;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        common_function_gateway: {
          common_function_pool_id: req.body.ecl2cfpoolid,
          description: req.body.description,
          name: req.body.cfgatewayname,
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
          req.body.ecl2cfgatewayid = ecl2data.common_function_gateway.id;
          commonService
            .create(req.body, db.ecl2commonfunctiongateway)
            .then((data) => {
              customValidation.generateSuccessResponse(
                data,
                response,
                constants.RESPONSE_TYPE_SAVE,
                res,
                req
              );

              let network = {
                ecl2networkid: ecl2data.common_function_gateway.network_id,
                tenantid: req.body.tenantid,
                networkname:
                  "common_function_gw_access_" +
                  ecl2data.common_function_gateway.id,
                customerid: req.body.customerid,
                adminstateup: "Y",
                description: "",
                plane: "Data",
                zoneid: req.body.zoneid,
                status: "Active",
                createdby: "System",
                createddt: new Date(),
                lastupdatedby: "System",
                lastupdateddt: new Date(),
              };

              commonService
                .create(network, db.ecl2networks)
                .then((nwdata: any) => {
                  setTimeout(function () {
                    let subneturl = ECLApiURL.GET.SUBNET.replace(
                      "{subnet_id}",
                      ecl2data.common_function_gateway.subnet_id
                    );

                    commonService
                      .callECL2Reqest(
                        "GET",
                        req.body.region,
                        req.body.tenantid,
                        subneturl,
                        requestheader,
                        {},
                        req.body.ecl2tenantid
                      )
                      .then((ecl2subnetdata) => {
                        let subnet = {
                          ecl2subnetid:
                            ecl2data.common_function_gateway.subnet_id,
                          tenantid: req.body.tenantid,
                          customerid: req.body.customerid,
                          subnetname: ecl2subnetdata.subnet.name,
                          allocationpools: JSON.stringify(
                            ecl2subnetdata.subnet.allocation_pools
                          ),
                          subnetcidr: ecl2subnetdata.subnet.cidr,
                          description: "",
                          dnsnameservers: JSON.stringify(
                            ecl2subnetdata.subnet.dns_nameservers
                          ),
                          enabledhcp:
                            ecl2subnetdata.subnet.enable_dhcp === true
                              ? "Y"
                              : "N",
                          gatewayip: ecl2subnetdata.subnet.gateway_ip,
                          hostroutes: JSON.stringify(
                            ecl2subnetdata.subnet.host_routes
                          ),
                          ipversion: ecl2subnetdata.subnet.ip_version,
                          networkid: nwdata.networkid,
                          ecl2networkid:
                            ecl2data.common_function_gateway.network_id,
                          ntpservers: JSON.stringify(
                            ecl2subnetdata.subnet.ntp_servers
                          ),
                          zoneid: req.body.zoneid,
                          status: "Active",
                          createdby: "System",
                          createddt: new Date(),
                          lastupdatedby: "System",
                          lastupdateddt: new Date(),
                        };

                        commonService
                          .create(subnet, db.ecl2subnets)
                          .then((data: any) => {
                            //
                          })
                          .catch((error: Error) => {
                            console.log(error);
                          });
                      })
                      .catch((error: Error) => {
                        customValidation.generateAppError(
                          error,
                          response,
                          res,
                          req
                        );
                      });
                  }, 3000);
                })
                .catch((error: Error) => {
                  console.log(error);
                });
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
      let requesturl = ECLApiURL.UPDATE.COMMON_FN_GATEWAY.replace(
        "{common_function_gateway_id}",
        req.body.ecl2cfgatewayid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        common_function_gateway: {
          description: req.body.description,
          name: req.body.cfgatewayname,
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
          let condition = { cfgatewayid: req.body.cfgatewayid };
          commonService
            .update(condition, req.body, db.ecl2commonfunctiongateway)
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
      let requesturl = ECLApiURL.DELETE.COMMON_FN_GATEWAY.replace(
        "{common_function_gateway_id}",
        req.body.ecl2cfgatewayid
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
          let condition = { cfgatewayid: req.body.cfgatewayid };
          commonService
            .update(condition, req.body, db.ecl2commonfunctiongateway)
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

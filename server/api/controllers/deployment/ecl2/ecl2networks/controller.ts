import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants, ECLApiURL } from "../../../../../common/constants";
import _ = require("lodash");
export class Controller {
  constructor() {
    //
  }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      if (!customValidation.isEmptyValue(req.body.networklist)) {
        req.body.networkid = { $in: req.body.networklist };
        req.body = _.omit(req.body, "networklist");
      }
      let parameters = {} as any;
      parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      parameters.include = [
        {
          model: db.ecl2subnets,
          as: "ecl2subnets",
          paranoid: false,
          required: false,
          where: { status: "Active" },
          include: [
            {
              model: db.ecl2tags,
              as: "subnettags",
              paranoid: false,
              required: false,
              where: { status: "Active", resourcetype: "Subnet" },
            },
          ],
        },
        {
          model: db.ecl2ports,
          as: "ecl2ports",
          paranoid: false,
          required: false,
          where: { status: "Active" },
          include: [
            {
              model: db.ecl2tags,
              as: "porttags",
              paranoid: false,
              required: false,
              where: { status: "Active", resourcetype: "Port" },
            },
          ],
        },
        {
          model: db.ecl2tags,
          as: "ecl2tags",
          paranoid: false,
          required: false,
          where: { status: "Active", resourcetype: "Network" },
        },
        {
          model: db.ecl2zones,
          as: "ecl2zones",
          paranoid: false,
          required: false,
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
        .getAllList(parameters, db.ecl2networks)
        .then((list: any) => {
          list.forEach((element) => {
            if (!_.isEmpty(element.ecl2subnets)) {
              element.networkname =
                element.networkname +
                "(" +
                _.map(element.ecl2subnets, function (obj) {
                  return obj.subnetcidr;
                }) +
                ")";
            }
          });

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
        where: { networkid: req.params.id },
        order: [["lastupdateddt", "desc"]],
      };
      parameters.include = [
        {
          model: db.ecl2subnets,
          as: "ecl2subnets",
          paranoid: false,
          required: false,
          where: { status: "Active" },
          include: [
            {
              model: db.ecl2tags,
              as: "subnettags",
              paranoid: false,
              required: false,
              where: { status: "Active", resourcetype: "Subnet" },
            },
          ],
        },
        {
          model: db.ecl2ports,
          as: "ecl2ports",
          paranoid: false,
          required: false,
          where: { status: "Active" },
          include: [
            {
              model: db.ecl2tags,
              as: "porttags",
              paranoid: false,
              required: false,
              where: { status: "Active", resourcetype: "Port" },
            },
          ],
        },
        {
          model: db.ecl2tags,
          as: "ecl2tags",
          paranoid: false,
          required: false,
          where: { status: "Active", resourcetype: "Network" },
        },
        {
          model: db.ecl2zones,
          as: "ecl2zones",
          paranoid: false,
          required: false,
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
        .getAllList(parameters, db.ecl2networks)
        .then((list: any) => {
          list.forEach((element) => {
            if (!_.isEmpty(element.ecl2subnets)) {
              element.networkname =
                element.networkname +
                "(" +
                _.map(element.ecl2subnets, function (obj) {
                  return obj.subnetcidr;
                }) +
                ")";
            }
          });

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
      // commonService.getById(req.params.id, db.ecl2networks).then((data) => {
      //     customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_LIST, res, req);
      // }).catch((error: Error) => {
      //     customValidation.generateAppError(error, response, res, req);
      // });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  create(req: any, res: any): void {
    let response = {};
    try {
      let requesturl = constants.ECL2_CREATE_NETWORK_URL;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        network: {
          admin_state_up: req.body.adminstateup === "N" ? false : true,
          description: req.body.description,
          plane: req.body.plane,
        },
      } as any;
      if (!customValidation.isEmptyValue(req.body.tags)) {
        requestparams.network.tags = req.body.tags;
      }
      if (!customValidation.isEmptyValue(req.body.networkname)) {
        requestparams.network.name = req.body.networkname;
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
        .then((ecl2data: any) => {
          req.body.ecl2networkid = ecl2data.network.id;
          req.body.networkname = ecl2data.network.name;
          let query = {} as any;
          if (!customValidation.isEmptyValue(req.body.ecl2tags)) {
            query.include = [{ model: db.ecl2tags, as: "ecl2tags" }];
          }
          commonService
            .saveWithAssociation(req.body, query, db.ecl2networks)
            .then((data: any) => {
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
      let requesturl = constants.ECL2_UPDATE_NETWORK_URL.replace(
        "{network_id}",
        req.body.ecl2networkid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        network: {
          admin_state_up: req.body.adminstateup === "N" ? false : true,
          description: req.body.description,
          name: req.body.networkname,
        },
      } as any;
      if (!customValidation.isEmptyValue(req.body.networkname)) {
        requestparams.network.name = req.body.networkname;
      }
      if (!customValidation.isEmptyValue(req.body.tags)) {
        requestparams.network.tags = req.body.tags;
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
          let condition = { networkid: req.body.networkid };
          commonService
            .update(condition, req.body, db.ecl2networks)
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
      let requesturl = constants.ECL2_DELETE_NETWORK_URL.replace(
        "{network_id}",
        req.body.ecl2networkid
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
          let condition = { networkid: req.body.networkid };
          commonService
            .update(condition, req.body, db.ecl2networks)
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

  tenantconnectionrequest(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = ECLApiURL.CREATE.TENANT_CONN_REQUEST;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        tenant_connection_request: {
          tenant_id_other: req.body.destinationtenantid,
          network_id: req.body.ecl2networkid,
          name: "share_nw",
          description: "shared",
          tag: {},
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
          let condition = { networkid: req.body.networkid };
          let parameters = {} as any;
          let inputs = {} as any;
          inputs = req.body;
          inputs.id = ecl2data.tenant_connection_request.id;
          inputs.status = ecl2data.tenant_connection_request.status;
          inputs.approvalrequestid =
            ecl2data.tenant_connection_request.approval_request_id;
          parameters.shared = [] as any;
          parameters.shared.push(inputs);
          console.log(JSON.stringify(parameters.shared));
          commonService
            .update(condition, parameters, db.ecl2networks)
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
  tenantconnections(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = ECLApiURL.CREATE.TENANT_CONN;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };

      let requestparams = {
        tenant_connection: {
          name: "Tenant connection",
          description: "Test Description",
          tags: {},
          tenant_connection_request_id: "8fd1a5e4-1807-11e9-aa89-525411060500",
          device_type: "ECL::Compute::Server",
          device_id: "65fa0049-3544-4a1c-bbe9-146fd1c01d2d",
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
          let condition = { networkid: req.body.networkid };
          commonService
            .update(condition, req.body, db.ecl2networks)
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

  updateConnReqStatus(req: Request, res: Response): void {
    let response = {};
    try {
      let requesturl = ECLApiURL.LIST.TENANT_CONN_REQUEST;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {};
      commonService
        .callECL2Reqest(
          "GET",
          req.body.region,
          req.body.tenantid,
          requesturl,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          _.map(req.body.shared, function (item, index) {
            _.find(ecl2data.tenant_connection_requests, function (data: any) {
              if (data.id === item.id) {
                req.body.shared[index].status = data.status;
                req.body.shared[index].approvalrequestid =
                  data.approval_request_id;
                return data;
              }
            });
            if (index + 1 === req.body.shared.length) {
              let condition = { networkid: req.body.networkid };
              commonService
                .update(condition, req.body, db.ecl2networks)
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
            }
          });
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  deleteTenantConnReq(req: Request, res: Response): void {
    let response = {};
    try {
      _.map(req.body.shared, function (item, index) {
        if (item.status === constants.DELETE_STATUS) {
          let requesturl = ECLApiURL.DELETE.TENANT_CONN_REQUEST.replace(
            "{tenant_connection_request_id}",
            item.id
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
              let condition = { networkid: req.body.networkid };
              commonService
                .update(condition, req.body, db.ecl2networks)
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
        }
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();

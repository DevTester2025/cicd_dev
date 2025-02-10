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
      let parameters = {} as any;
      parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      parameters.include = [
        {
          model: db.ecl2vsrxplan,
          as: "ecl2vsrxplan",
          paranoid: false,
          required: false,
        },
        {
          model: db.ecl2vsrxinterface,
          as: "ecl2vsrxinterface",
          paranoid: false,
          required: false,
          include: [
            {
              model: db.ecl2networks,
              as: "ecl2networks",
              paranoid: false,
              required: false,
              include: [
                {
                  model: db.ecl2subnets,
                  as: "ecl2subnets",
                  paranoid: false,
                  required: false,
                  where: { status: "Active" },
                  attributes: [
                    "subnetid",
                    "subnetcidr",
                    "allocatedips",
                    "unallocatedips",
                  ],
                },
              ],
            },
            {
              model: db.ecl2vsrx,
              as: "ecl2vsrx",
              paranoid: false,
              required: false,
              attributes: ["username", "password"],
            },
          ],
        },
        {
          model: db.ecl2zones,
          as: "ecl2zones",
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
        .getAllList(parameters, db.ecl2vsrx)
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
          vsrxid: req.params.id,
        },
        order: [["lastupdateddt", "desc"]],
      };
      parameters.include = [
        {
          model: db.ecl2vsrxplan,
          as: "ecl2vsrxplan",
          paranoid: false,
          required: false,
        },
        {
          model: db.ecl2vsrxinterface,
          as: "ecl2vsrxinterface",
          paranoid: false,
          required: false,
          include: [
            {
              model: db.ecl2networks,
              as: "ecl2networks",
              paranoid: false,
              required: false,
              include: [
                {
                  model: db.ecl2subnets,
                  as: "ecl2subnets",
                  paranoid: false,
                  required: false,
                  where: { status: "Active" },
                  attributes: [
                    "subnetid",
                    "subnetcidr",
                    "allocatedips",
                    "unallocatedips",
                  ],
                },
              ],
            },
            {
              model: db.ecl2vsrx,
              as: "ecl2vsrx",
              paranoid: false,
              required: false,
              attributes: ["username", "password"],
            },
          ],
        },
        {
          model: db.ecl2zones,
          as: "ecl2zones",
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
        .getAllList(parameters, db.ecl2vsrx)
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

      // commonService.getById(req.params.id, db.ecl2vsrx).then((data) => {
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
      let requesturl = ECLApiURL.CREATE.VSRX;
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        virtual_network_appliance: {
          name: req.body.vsrxname,
          description: req.body.description,
          default_gateway: req.body.defaultgateway,
          availability_zone: req.body.availabilityzone,
          virtual_network_appliance_plan_id: req.body.ecl2vsrxplanid,
          interfaces: {
            interface_1: {
              name: req.body.interfaces.vsrxinterfacename,
              network_id: req.body.interfaces.ecl2networkid,
              fixed_ips: [
                {
                  ip_address: req.body.interfaces.ipaddress,
                },
              ],
            },
          },
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
          req.body.ecl2vsrxid = ecl2data.virtual_network_appliance.id;
          req.body.username = ecl2data.virtual_network_appliance.username;
          req.body.password = ecl2data.virtual_network_appliance.password;
          if (!_.isEmpty(ecl2data.virtual_network_appliance.interfaces)) {
            let ecl2vsrxinterfaces = [] as any;
            _.map(
              ecl2data.virtual_network_appliance.interfaces,
              function (value, key) {
                value.slotname = key;
                value.vsrxinterfacename = value.name;
                value.ipaddress = !_.isEmpty(value.fixed_ips)
                  ? value.fixed_ips[0].ip_address
                  : "";
                value.ecl2subnetid = !_.isEmpty(value.fixed_ips)
                  ? value.fixed_ips[0].ecl2subnetid
                  : "";
                value.createdby = req.body.createdby;
                value.createddt = req.body.createddt;
                value.lastupdateddt = req.body.lastupdateddt;
                value.lastupdatedby = req.body.lastupdatedby;
                if (!_.isEmpty(value.allowedaddresspairs)) {
                  value.allowedaddresspairs = JSON.stringify(
                    value.allowedaddresspairs
                  );
                }
                if (key === "interface_1") {
                  value.networkid = req.body.interfaces.networkid;
                }
                ecl2vsrxinterfaces.push(value);
                req.body.ecl2vsrxinterface = ecl2vsrxinterfaces;
              }
            );
            let serialno = -1;
            req.body.ecl2vsrxinterface = _.orderBy(
              req.body.ecl2vsrxinterface,
              "slotname"
            );
            _.map(req.body.ecl2vsrxinterface, function (item: any) {
              serialno = serialno + 1;
              item.vsrxinterfaceslot = "ge-0/0/" + serialno;
              item.vsrxinterfaceunitslot = item.vsrxinterfaceslot + ".0";
              return item;
            });
          }
          let query = {} as any;
          query.include = [
            {
              model: db.ecl2vsrxinterface,
              as: "ecl2vsrxinterface",
              paranoid: false,
              required: false,
            },
          ];
          commonService
            .saveWithAssociation(req.body, query, db.ecl2vsrx)
            .then((data: any) => {
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
                  customValidation.generateAppError(error, response, res, req);
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
      let requesturl = ECLApiURL.UPDATE.VSRX.replace(
        "{virtual_network_appliance_id}",
        req.body.ecl2vsrxid
      );
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        virtual_network_appliance: {},
      } as any;
      if (req.body.vsrxname) {
        requestparams.virtual_network_appliance.name = req.body.vsrxname;
      }
      if (req.body.description) {
        requestparams.virtual_network_appliance.description =
          req.body.description;
      }
      if (req.body.interfaces) {
        requestparams.virtual_network_appliance.interfaces =
          req.body.interfaces;
      }
      if (!customValidation.isEmptyValue(req.body.tags)) {
        requestparams.virtual_network_appliance.tags = req.body.tags;
      }
      commonService
        .callECL2Reqest(
          "PATCH",
          req.body.region,
          req.body.tenantid,
          requesturl,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          let condition = { vsrxid: req.body.vsrxid };
          commonService
            .update(condition, req.body, db.ecl2vsrx)
            .then((data) => {
              if (!_.isEmpty(req.body.ecl2vsrxinterface)) {
                let condition = {
                  vsrxinterfaceid: req.body.ecl2vsrxinterface.vsrxinterfaceid,
                };
                commonService
                  .update(
                    condition,
                    req.body.ecl2vsrxinterface,
                    db.ecl2vsrxinterface
                  )
                  .then((interfacedata) => {
                    customValidation.generateSuccessResponse(
                      interfacedata,
                      response,
                      constants.RESPONSE_TYPE_UPDATE,
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
      let requesturl = ECLApiURL.DELETE.VSRX.replace(
        "{virtual_network_appliance_id}",
        req.body.ecl2vsrxid
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
          let condition = { vsrxid: req.body.vsrxid };
          commonService
            .update(condition, req.body, db.ecl2vsrx)
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

  vsrx(req: Request, res: Response): void {
    let response = {};
    try {
      let vsrxrequestparams: any;
      let parameters = {} as any;
      let reqvsrxurl = constants.VSRX_RPC_URL.replace(
        "{ip}",
        req.body.ipaddress
      );
      vsrxrequestparams = req.body;
      let requestid = req.body.vsrxid;
      commonService
        .getById(requestid, db.ecl2vsrx)
        .then((data) => {
          if (!_.isEmpty(data)) {
            if (req.body.type === "Security Zone") {
              let existsecurityzone = [] as any;
              if (data.securityzone !== "" && data.securityzone !== null) {
                existsecurityzone = JSON.parse(data.securityzone);
              }
              existsecurityzone.push(req.body);
              parameters.securityzone = JSON.stringify(existsecurityzone);
              vsrxrequestparams.vsrx =
                '<load-configuration action="merge" format="xml"> <configuration><interfaces><interface><name>' +
                req.body.vsrxinterfaceslot +
                "</name><unit><name>" +
                req.body.unit +
                "</name><family><inet><address><name>" +
                req.body.fixedip +
                "/24</name></address></inet></family></unit></interface></interfaces><security><zones><security-zone><name>" +
                req.body.interfacezone +
                "</name><interfaces><name>" +
                req.body.vsrxinterfaceunitslot +
                "</name><host-inbound-traffic><system-services><name>" +
                req.body.services +
                "</name></system-services></host-inbound-traffic></interfaces></security-zone></zones></security></configuration></load-configuration><commit-configuration/>";
            } else if (req.body.type === "Security Policy") {
              let existsecuritypolicy = [] as any;
              if (data.securitypolicy !== "" && data.securitypolicy !== null) {
                existsecuritypolicy = JSON.parse(data.securitypolicy);
              }
              let services: any;
              let applications: any = "";
              req.body.service.forEach((element) => {
                services = "<application>" + element + "</application>";
                applications = applications + services;
              });
              existsecuritypolicy.push(req.body);
              parameters.securitypolicy = JSON.stringify(existsecuritypolicy);
              vsrxrequestparams.vsrx =
                '<load-configuration action="merge" format="xml"><configuration><security><policies><policy><from-zone-name>' +
                req.body.sourcezone +
                "</from-zone-name><to-zone-name>" +
                req.body.destinationzone +
                "</to-zone-name><policy><name>" +
                req.body.rulename +
                "</name><match><source-address>" +
                req.body.sourceaddress +
                "</source-address><destination-address>" +
                req.body.destinationaddress +
                "</destination-address>" +
                applications +
                "</match> <then>" +
                req.body.advancedrule +
                "</then></policy></policy></policies><zones><security-zone><name>" +
                req.body.destinationzone +
                "</name><address-book><address><name>" +
                req.body.destinationaddress +
                "</name><ip-prefix>" +
                req.body.destinationaddress +
                "/32</ip-prefix></address></address-book></security-zone></zones></security></configuration></load-configuration><commit-configuration/>";
            } else if (req.body.type === "Source NAT") {
              let existsourcenat = [] as any;
              if (data.sourcenat !== "" && data.sourcenat !== null) {
                existsourcenat = JSON.parse(data.sourcenat);
              }
              existsourcenat.push(req.body);
              parameters.sourcenat = JSON.stringify(existsourcenat);
              vsrxrequestparams.vsrx =
                '<load-configuration action="merge" format="xml"><configuration><security><nat><source><rule-set><name>internal-to-internet</name><from><zone>' +
                req.body.fromzone +
                "</zone></from> <to><zone>" +
                req.body.tozone +
                "</zone></to><rule><name>" +
                req.body.rulename +
                "</name><src-nat-rule-match><source-address>" +
                req.body.sourceaddress +
                "/24</source-address><destination-address>" +
                req.body.destinationaddress +
                "/24</destination-address></src-nat-rule-match><then><source-nat>" +
                req.body.natto +
                "</source-nat></then></rule></rule-set></source></nat></security></configuration></load-configuration><commit-configuration/>";
            } else if (req.body.type === "Destination NAT") {
              let existdestinationnat = [] as any;
              if (data.destinationnat !== "" && data.destinationnat !== null) {
                existdestinationnat = JSON.parse(data.destinationnat);
              }
              existdestinationnat.push(req.body);
              parameters.destinationnat = JSON.stringify(existdestinationnat);
              vsrxrequestparams.vsrx =
                '<load-configuration action="merge" format="xml"> <configuration><security><nat><destination><pool><name>' +
                req.body.rulename +
                "</name><address><ipaddr>" +
                req.body.pooladdress +
                "/32</ipaddr> </address> </pool><rule-set><name>incoming</name><from><zone>" +
                req.body.fromzone +
                "</zone></from><rule><name>" +
                req.body.rulename +
                "</name><dest-nat-rule-match><destination-address><dst-addr>" +
                req.body.matchaddress +
                "/32</dst-addr></destination-address></dest-nat-rule-match><then><destination-nat><pool><pool-name>" +
                req.body.rulename +
                "</pool-name></pool></destination-nat></then></rule></rule-set></destination></nat></security></configuration></load-configuration><commit-configuration/>";
            } else if (req.body.type === "ProxyARP NAT") {
              let existproxynat = [] as any;
              if (data.proxyarpnat !== "" && data.proxyarpnat !== null) {
                existproxynat = JSON.parse(data.proxyarpnat);
              }
              existproxynat.push(req.body);
              parameters.proxyarpnat = JSON.stringify(existproxynat);
              vsrxrequestparams.vsrx =
                '<load-configuration action="merge" format="xml"> <configuration><security> <nat> <proxy-arp><interface> <name>' +
                req.body.interface +
                "</name> <address> <name>" +
                req.body.fromaddress +
                "/32</name> <to> <ipaddr>" +
                req.body.toaddress +
                "/32</ipaddr> </to> </address> </interface> </proxy-arp> </nat> </security> </configuration> </load-configuration><commit-configuration/>";
            }
            commonService
              .callVSRX("POST", reqvsrxurl, "", vsrxrequestparams)
              .then((result) => {
                console.log("Result", result);
                let condition = { vsrxid: req.body.vsrxid };

                commonService
                  .update(condition, parameters, db.ecl2vsrx)
                  .then((data) => {
                    console.log(
                      req.body.type === "Destination NAT" &&
                        !customValidation.isEmptyValue(
                          req.body.ecl2subnetparams
                        )
                    );
                    if (
                      req.body.type === "Destination NAT" &&
                      !customValidation.isEmptyValue(req.body.ecl2subnetparams)
                    ) {
                      let condition = {
                        subnetid: req.body.ecl2subnetparams.subnetid,
                      };
                      commonService
                        .update(
                          condition,
                          req.body.ecl2subnetparams,
                          db.ecl2subnets
                        )
                        .then((subnetdata) => {
                          console.log("Subnet updated");
                          customValidation.generateSuccessResponse(
                            data,
                            response,
                            constants.RESPONSE_TYPE_UPDATE,
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
                    customValidation.generateAppError(
                      error,
                      response,
                      res,
                      req
                    );
                  });
              });
          }
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

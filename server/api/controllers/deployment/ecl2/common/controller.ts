import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants, ECLApiURL } from "../../../../../common/constants";
import * as _ from "lodash";
import { messages } from "../../../../../common/messages";

export class Controller {
  constructor() {
    //
  }
  synchronization(req: any, res: Response): void {
    let condition = {
      where: {
        tenantid: req.body.tenantid,
        cloudprovider: constants.CLOUD_ECL,
        tenantrefid: req.body.ecl2tenantid,
        region: req.body.region,
        status: constants.STATUS_ACTIVE,
        customerid: { $ne: req.body.customerid },
      },
      include: [
        {
          as: "customer",
          model: db.Customer,
          where: { status: constants.STATUS_ACTIVE },
        },
      ],
    } as any;

    commonService.getData(condition, db.TenantRegion).then((accountObj) => {
      if (accountObj) {
        accountObj = JSON.parse(JSON.stringify(accountObj));
        customValidation.generateErrorMsg(
          messages.ACCOUNT_ID_EXIST + accountObj.customer.customername,
          res,
          201,
          req
        );
      } else {
        let response = {};
        let requestheader = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };
        let requestparams = {};
        let username = "DATASYNC";
        let defaultstatus = "ACTIVE";
        new Controller().initSync(
          req,
          res,
          response,
          requestheader,
          requestparams,
          defaultstatus,
          username
        );
      }
    });
  }
  initSync(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    if (req.body.tnregionid && null != req.body.tnregionid) {
      commonService
        .update(
          { tnregionid: req.body.tnregionid },
          { lastsyncdt: new Date() },
          db.TenantRegion
        )
        .then((result) => {
          if (!req.body.isJob) {
            customValidation.generateSuccessResponse(
              result,
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
          }
          new Controller().deleteExisting(
            req,
            res,
            response,
            requestheader,
            requestparams,
            defaultstatus,
            username
          );
        })
        .catch((error: Error) => {
          console.log(error); //customValidation.generateAppError(error, response, res, req);
        });
    } else {
      let trobject = {
        tenantid: req.body.tenantid,
        cloudprovider: constants.CLOUD_ECL,
        customerid: req.body.customerid,
        region: req.body.region,
        tenantrefid: req.body.ecl2tenantid,
        lastsyncdt: new Date(),
        status: constants.STATUS_ACTIVE,
        createdby: username,
        createddt: new Date(),
        lastupdatedby: username,
        lastupdateddt: new Date(),
      };
      commonService
        .create(trobject, db.TenantRegion)
        .then((result) => {
          result = JSON.parse(JSON.stringify(result));
          req.body.tnregionid = result.tnregionid;
          customValidation.generateSuccessResponse(
            result,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
          new Controller().deleteExisting(
            req,
            res,
            response,
            requestheader,
            requestparams,
            defaultstatus,
            username
          );
        })
        .catch((error: Error) => {
          console.log(error); //customValidation.generateAppError(error, response, res, req);
        });
    }
    // TODO: After implement tenant region functionality - Remove this
    commonService
      .update(
        { customerid: req.body.customerid },
        { ecl2tenantid: req.body.ecl2tenantid, ecl2region: req.body.region },
        db.Customer
      )
      .then((result) => {})
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }
  deleteExisting(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    let queries = [];
    queries.push(
      `UPDATE tbl_ecl2_images a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_firewallplans a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_vsrxplan a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_internetservices a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_qosoptions a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_lbplan a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_commonfunctionpool a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );

    queries.push(
      `UPDATE tbl_ecl2_ports a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_subnets a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_networks a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );

    queries.push(
      `UPDATE tbl_ecl2_igstaticip a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_iginterface a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_igglobalip a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_internetgateways a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );

    queries.push(
      `UPDATE tbl_ecl2_vsrxinterface a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_vsrx a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );

    queries.push(
      `UPDATE tbl_ecl2_commonfunctiongateway a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );

    queries.push(
      `UPDATE tbl_ecl2_keys a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );

    queries.push(
      `UPDATE tbl_ecl2_volumeattachments a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_volumes a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );

    queries.push(
      `UPDATE tbl_ecl2_lbsyslogserver a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_lbinterface a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_loadbalancers a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );

    queries.push(
      `UPDATE tbl_ecl2_tenantconnection a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_ecl2_tenantconnrequest a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );

    queries.push(
      `UPDATE tbl_tn_assetmappings a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );

    queries.push(
      `UPDATE tbl_tn_instances a set a.status=:status where a.tnregionid=:tnregionid and a.status = "${constants.STATUS_ACTIVE}";`
    );
    queries.push(
      `UPDATE tbl_bs_tag_values a set a.status=:status where a.cloudprovider="${constants.CLOUD_ECL}" AND a.tenantid=:tenantid AND a.status = "${constants.STATUS_ACTIVE}" AND a.tnregionid=:tnregionid;`
    );

    console.log("Queries formatted");
    let params = {
      replacements: {
        status: constants.DELETE_STATUS,
        tnregionid: req.body.tnregionid,
        tenantid: req.body.tenantid,
      },
    };
    _.forEach(queries, function (query, i) {
      commonService
        .executeQuery(query, params, db.sequelize)
        .then((list) => {
          if (i == queries.length - 1) {
            new Controller().syncImages(
              req,
              res,
              response,
              requestheader,
              requestparams,
              defaultstatus,
              username
            );
          }
        })
        .catch((error: Error) => {
          console.log(error); //customValidation.generateAppError(error, response, res, req);
        });
    });
  }

  syncImages(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    let requesturl = ECLApiURL.LIST.IMAGE;
    // For ECL Images
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
        if (ecl2data.images.length > 0) {
          let imagearray = [];
          _.forEach(ecl2data.images, function (ecl2image) {
            if (ecl2image.size > 0) {
              let image = {
                imagename:
                  "(" +
                  (ecl2image.size / 1073741824).toFixed(1) +
                  " GB)" +
                  ecl2image.name,
                tenantid: req.body.tenantid,
                region: req.body.region,
                customerid: req.body.customerid,
                ecl2imageid: ecl2image.id,
                platform: ecl2image[".os.type"],
                notes: ecl2image[".official_image_template"],
                tnregionid: req.body.tnregionid,
                status: constants.STATUS_ACTIVE,
                createdby: username,
                createddt: new Date(),
              };
              imagearray.push(image);
            }
          });

          commonService
            .bulkCreate(imagearray, db.ecl2images)
            .then((data) => {
              new Controller().syncFirewallPlan(
                req,
                res,
                response,
                requestheader,
                requestparams,
                defaultstatus,
                username
              );
              // customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });
        }
      })
      .catch((error: Error) => {
        new Controller().syncFirewallPlan(
          req,
          res,
          response,
          requestheader,
          requestparams,
          defaultstatus,
          username
        );
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }
  syncFirewallPlan(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    try {
      commonService
        .callECL2Reqest(
          "GET",
          req.body.region,
          req.body.tenantid,
          ECLApiURL.LIST.FIREWALLPLAN,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          if (ecl2data.firewall_plans.length > 0) {
            let firewallplanarray = [];
            _.forEach(ecl2data.firewall_plans, function (ecl2firewallplan) {
              let firewallplan = {
                ecl2firewallplanid: ecl2firewallplan.id,
                tenantid: req.body.tenantid,
                region: req.body.region,
                firewallplanname: ecl2firewallplan.name,
                description: ecl2firewallplan.description,
                vendor: ecl2firewallplan.vendor,
                version: ecl2firewallplan.version,
                enabled: ecl2firewallplan.enabled === true ? "1" : "0",
                customerid: req.body.customerid,
                tnregionid: req.body.tnregionid,
                status: constants.STATUS_ACTIVE,
                createdby: username,
                createddt: new Date(),
              };
              firewallplanarray.push(firewallplan);
            });

            commonService
              .bulkCreate(firewallplanarray, db.ecl2firewallplans)
              .then((data) => {
                new Controller().syncVSRXPlan(
                  req,
                  res,
                  response,
                  requestheader,
                  requestparams,
                  defaultstatus,
                  username
                );
                //  customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
              })
              .catch((error: Error) => {
                console.log(error); //customValidation.generateAppError(error, response, res, req);
              });
          }
        })
        .catch((error: Error) => {
          console.log(error); //customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      new Controller().syncVSRXPlan(
        req,
        res,
        response,
        requestheader,
        requestparams,
        defaultstatus,
        username
      );
    }
  }
  syncVSRXPlan(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    try {
      // // For vSRX Plan
      commonService
        .callECL2Reqest(
          "GET",
          req.body.region,
          req.body.tenantid,
          ECLApiURL.LIST.VSRXPLAN,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          if (ecl2data.virtual_network_appliance_plans.length > 0) {
            let vsrxplanarray = [];
            _.forEach(
              ecl2data.virtual_network_appliance_plans,
              function (ecl2vsrxplan) {
                let vsrxplan = {
                  ecl2vsrxplanid: ecl2vsrxplan.id,
                  tenantid: req.body.tenantid,
                  vsrxplanname: ecl2vsrxplan.name,
                  description: ecl2vsrxplan.description,
                  appliancetype: ecl2vsrxplan.appliance_type,
                  region: req.body.region,
                  customerid: req.body.customerid,
                  notes: "version : " + ecl2vsrxplan.version,
                  tnregionid: req.body.tnregionid,
                  status: constants.STATUS_ACTIVE,
                  createdby: username,
                  createddt: new Date(),
                };
                vsrxplanarray.push(vsrxplan);
              }
            );

            commonService
              .bulkCreate(vsrxplanarray, db.ecl2vsrxplan)
              .then((data) => {
                new Controller().syncInterService(
                  req,
                  res,
                  response,
                  requestheader,
                  requestparams,
                  defaultstatus,
                  username
                );
                //  customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
              })
              .catch((error: Error) => {
                console.log(error);
                // console.log(error);//customValidation.generateAppError(error, response, res, req);
              });
          }
        })
        .catch((error: Error) => {
          console.log(error);
          // console.log(error);//customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      new Controller().syncInterService(
        req,
        res,
        response,
        requestheader,
        requestparams,
        defaultstatus,
        username
      );
    }
  }
  syncInterService(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    try {
      // // For Internet Services
      commonService
        .callECL2Reqest(
          "GET",
          req.body.region,
          req.body.tenantid,
          ECLApiURL.LIST.INETSERVICE,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          if (ecl2data.internet_services.length > 0) {
            let inetservicearray = [];
            _.forEach(ecl2data.internet_services, function (ecl2inetservice) {
              let inetservice = {
                ecl2internetservicesid: ecl2inetservice.id,
                tenantid: req.body.tenantid,
                region: req.body.region,
                customerid: req.body.customerid,
                servicename: ecl2inetservice.name,
                description: ecl2inetservice.description,
                minimalsubmasklength: ecl2inetservice.minimal_submask_length,
                zoneid: 0,
                notes: "zone : " + ecl2inetservice.zone,
                tnregionid: req.body.tnregionid,
                status: constants.STATUS_ACTIVE,
                createdby: username,
                createddt: new Date(),
              };
              inetservicearray.push(inetservice);
            });

            commonService
              .bulkCreate(inetservicearray, db.ecl2internetservices)
              .then((data) => {
                new Controller().syncQOSOptions(
                  req,
                  res,
                  response,
                  requestheader,
                  requestparams,
                  defaultstatus,
                  username
                );
                //  customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
              })
              .catch((error: Error) => {
                console.log(error); //customValidation.generateAppError(error, response, res, req);
              });
          }
        })
        .catch((error: Error) => {
          console.log(error); //customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      new Controller().syncQOSOptions(
        req,
        res,
        response,
        requestheader,
        requestparams,
        defaultstatus,
        username
      );
    }
  }
  syncQOSOptions(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    try {
      // // For QOS Options
      commonService
        .callECL2Reqest(
          "GET",
          req.body.region,
          req.body.tenantid,
          ECLApiURL.LIST.QOSOPTIONS,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          if (ecl2data.qos_options.length > 0) {
            let qosoptionsarray = [];
            _.forEach(ecl2data.qos_options, function (ecl2qosoptions) {
              let qosoptions = {
                ecl2qosoptionid: ecl2qosoptions.id,
                tenantid: req.body.tenantid,
                region: req.body.region,
                qosoptionname: ecl2qosoptions.name,
                description: ecl2qosoptions.description,
                awsserviceid: ecl2qosoptions.aws_service_id,
                azureserviceid: ecl2qosoptions.azure_service_id,
                bandwidth: ecl2qosoptions.bandwidth,
                gcpserviceid: ecl2qosoptions.gcp_service_id,
                interdcserviceid: ecl2qosoptions.interdc_service_id,
                internetserviceid: ecl2qosoptions.internet_service_id,
                qostype: ecl2qosoptions.qos_type,
                servicetype: ecl2qosoptions.service_type,
                vpnserviceid: ecl2qosoptions.vpn_service_id,
                customerid: req.body.customerid,
                tnregionid: req.body.tnregionid,
                status: constants.STATUS_ACTIVE,
                createdby: username,
                createddt: new Date(),
              };
              qosoptionsarray.push(qosoptions);
            });

            commonService
              .bulkCreate(qosoptionsarray, db.ecl2qosoptions)
              .then((data) => {
                new Controller().syncLBPlans(
                  req,
                  res,
                  response,
                  requestheader,
                  requestparams,
                  defaultstatus,
                  username
                );
                //  customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
              })
              .catch((error: Error) => {
                console.log(error); //customValidation.generateAppError(error, response, res, req);
              });
          }
        })
        .catch((error: Error) => {
          console.log(error); //customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      new Controller().syncLBPlans(
        req,
        res,
        response,
        requestheader,
        requestparams,
        defaultstatus,
        username
      );
    }
  }
  syncLBPlans(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    try {
      // // For Loadbalancer Plan
      commonService
        .callECL2Reqest(
          "GET",
          req.body.region,
          req.body.tenantid,
          ECLApiURL.LIST.LBPLAN,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          if (ecl2data.load_balancer_plans.length > 0) {
            let lbplansarray = [];
            _.forEach(ecl2data.load_balancer_plans, function (ecl2lbplan) {
              let lbplan = {
                ecl2lbplanid: ecl2lbplan.id,
                tenantid: req.body.tenantid,
                region: req.body.region,
                lbplanname: ecl2lbplan.name,
                description: ecl2lbplan.description,
                vendor: ecl2lbplan.vendor,
                version: ecl2lbplan.version,
                maximumsyslogservers: ecl2lbplan.maximum_syslog_servers,
                enabled: ecl2lbplan.enabled === true ? "1" : "0",
                customerid: req.body.customerid,
                tnregionid: req.body.tnregionid,
                notes: "",
                status: constants.STATUS_ACTIVE,
                createdby: username,
                createddt: new Date(),
              };
              lbplansarray.push(lbplan);
            });

            commonService
              .bulkCreate(lbplansarray, db.ecl2lbplan)
              .then((data) => {
                new Controller().syncCommonFnGW(
                  req,
                  res,
                  response,
                  requestheader,
                  requestparams,
                  defaultstatus,
                  username
                );
                // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
              })
              .catch((error: Error) => {
                console.log(error); //customValidation.generateAppError(error, response, res, req);
              });
          }
        })
        .catch((error: Error) => {
          console.log(error); //customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      new Controller().syncCommonFnGW(
        req,
        res,
        response,
        requestheader,
        requestparams,
        defaultstatus,
        username
      );
    }
  }
  syncCommonFnGW(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    try {
      // // For Common Function Pools
      commonService
        .callECL2Reqest(
          "GET",
          req.body.region,
          req.body.tenantid,
          ECLApiURL.LIST.COMMON_FN_POOL,
          requestheader,
          requestparams,
          req.body.ecl2tenantid
        )
        .then((ecl2data) => {
          if (ecl2data.common_function_pools.length > 0) {
            let cfpoolsarray = [];
            _.forEach(ecl2data.common_function_pools, function (ecl2cfpool) {
              let cfpool = {
                ecl2cfpoolid: ecl2cfpool.id,
                tenantid: req.body.tenantid,
                cfpoolname: ecl2cfpool.name,
                description: ecl2cfpool.description,
                region: req.body.region,
                customerid: req.body.customerid,
                tnregionid: req.body.tnregionid,
                notes: "",
                status: constants.STATUS_ACTIVE,
                createdby: username,
                createddt: new Date(),
              };
              cfpoolsarray.push(cfpool);
            });

            commonService
              .bulkCreate(cfpoolsarray, db.ecl2commonfunctionpool)
              .then((data) => {
                // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
              })
              .catch((error: Error) => {
                console.log(error); //customValidation.generateAppError(error, response, res, req);
              });
          }

          //NETWOTK
          setTimeout(function () {
            new Controller().syncNetwork(
              req,
              res,
              response,
              requestheader,
              requestparams,
              defaultstatus,
              username
            );
          }, 1000);
        })
        .catch((error: Error) => {
          console.log(error); //customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      setTimeout(function () {
        new Controller().syncNetwork(
          req,
          res,
          response,
          requestheader,
          requestparams,
          defaultstatus,
          username
        );
      }, 1000);
      console.log(e); //customValidation.generateAppError(e, response, res, req);
    }
  }

  syncNetwork(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        ECLApiURL.LIST.NETWORKS,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2data) => {
        if (ecl2data.networks.length > 0) {
          let networkarray = [];
          let tagvalues = [];

          _.forEach(ecl2data.networks, function (element) {
            let network = {
              ecl2networkid: element.id,
              tenantid: req.body.tenantid,
              networkname: element.name,
              adminstateup: element.admin_state_up == true ? "Y" : "N",
              description: element.description,
              plane: element.plane,
              zoneid: req.body.zoneid,
              customerid: req.body.customerid,
              //shared: '',
              tnregionid: req.body.tnregionid,
              status: constants.STATUS_ACTIVE,
              createdby: username,
              createddt: new Date(),
              lastupdatedby: username,
              lastupdateddt: new Date(),
            };
            new Controller().addTagValue(
              req,
              element.tags,
              element.id,
              tagvalues,
              constants.RESOURCE_TYPES[1]
            );

            networkarray.push(network);
          });

          commonService
            .bulkCreate(networkarray, db.ecl2networks)
            .then((data) => {
              //Asset Mapping
              let ids = _.map(
                JSON.parse(JSON.stringify(data)),
                function (item: any) {
                  return item.networkid;
                }
              );
              commonService.bulkAssetMapping(
                ids,
                req.body.tenantid,
                constants.CLOUD_ECL,
                constants.RESOURCE_TYPES[1],
                req.body.customerid,
                req.body.tnregionid
              );

              let query = `UPDATE tbl_ecl2_networks n set n.zoneid = (select z.zoneid from tbl_ecl2_zones z where z.region=:region LIMIT 1 )
                            WHERE n.tnregionid=:tnregionid and n.status=:status `;
              let params = {
                replacements: {
                  tenantid: req.body.tenantid,
                  customerid: req.body.customerid,
                  region: req.body.region,
                  status: constants.STATUS_ACTIVE,
                  tnregionid: req.body.tnregionid,
                },
              };
              commonService
                .executeQuery(query, params, db.sequelize)
                .then((list) => {
                  // For Tags
                  let tquery = `UPDATE tbl_bs_tag_values a 
                        set a.tagid = (select c.tagid from tbl_bs_tags c 
                        where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                        a.resourceid = (select c.networkid from tbl_ecl2_networks c 
                        where c.ecl2networkid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        a.resourcerefid = a.createdby,
                        a.createdby=:username
                        WHERE a.tagid IS NULL  AND a.resourcetype =:resourcetype`;

                  new Controller().syncTagValues(
                    req,
                    res,
                    response,
                    requestheader,
                    requestparams,
                    defaultstatus,
                    username,
                    tagvalues,
                    tquery,
                    constants.RESOURCE_TYPES[1]
                  );
                })
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });

              // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });

          //Subnet
          commonService
            .callECL2Reqest(
              "GET",
              req.body.region,
              req.body.tenantid,
              ECLApiURL.LIST.NW_SUBNET,
              requestheader,
              requestparams,
              req.body.ecl2tenantid
            )
            .then((ecl2data) => {
              if (ecl2data.subnets.length > 0) {
                let listarray = [];
                _.forEach(ecl2data.subnets, function (element) {
                  let object = {
                    ecl2subnetid: element.id,
                    tenantid: req.body.tenantid,
                    subnetname: element.name,
                    allocationpools: JSON.stringify(element.allocation_pools),
                    subnetcidr: element.cidr,
                    description: element.description,
                    dnsnameservers: JSON.stringify(element.dns_nameservers),
                    enabledhcp: element.enable_dhcp == true ? "Y" : "N",
                    gatewayip: element.gateway_ip,
                    hostroutes: JSON.stringify(element.host_routes),
                    ipversion: element.ip_version,
                    ecl2networkid: element.network_id,
                    ntpservers: JSON.stringify(element.ntp_servers),
                    zoneid: req.body.zoneid,
                    customerid: req.body.customerid,
                    tnregionid: req.body.tnregionid,
                    status: constants.STATUS_ACTIVE,
                    createdby: username,
                    createddt: new Date(),
                    lastupdatedby: username,
                    lastupdateddt: new Date(),
                  };
                  listarray.push(object);
                });
                commonService
                  .bulkCreate(listarray, db.ecl2subnets)
                  .then((data) => {
                    let query = `UPDATE tbl_ecl2_subnets n set n.zoneid = (select z.zoneid from tbl_ecl2_zones z where z.region=:region LIMIT 1 ),
                                n.networkid = (select n1.networkid from tbl_ecl2_networks n1 
                                where n1.ecl2networkid=n.ecl2networkid AND n1.status=:status AND n1.tnregionid=:tnregionid LIMIT 1)
                                WHERE n.tnregionid=:tnregionid and n.status=:status`;
                    let params = {
                      replacements: {
                        tenantid: req.body.tenantid,
                        customerid: req.body.customerid,
                        region: req.body.region,
                        status: constants.STATUS_ACTIVE,
                        tnregionid: req.body.tnregionid,
                      },
                    };
                    commonService
                      .executeQuery(query, params, db.sequelize)
                      .then((list) => {})
                      .catch((error: Error) => {
                        console.log(error); //customValidation.generateAppError(error, response, res, req);
                      });
                  })
                  .catch((error: Error) => {
                    console.log(error); //customValidation.generateAppError(error, response, res, req);
                  });
              }
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });

          //Ports
          commonService
            .callECL2Reqest(
              "GET",
              req.body.region,
              req.body.tenantid,
              ECLApiURL.LIST.NW_PORT,
              requestheader,
              requestparams,
              req.body.ecl2tenantid
            )
            .then((ecl2data) => {
              if (ecl2data.ports.length > 0) {
                let listarray = [];
                _.forEach(ecl2data.ports, function (element) {
                  let object = {
                    ecl2portid: element.id,
                    tenantid: req.body.tenantid,
                    portname: element.name,
                    adminstateup: element.admin_state_up == true ? "Y" : "N",
                    allowedaddresspairs: JSON.stringify(
                      element.allowed_address_pairs
                    ),
                    ipaddress: null,
                    macaddress: element.mac_address,
                    description: element.description,
                    deviceid: element.device_id,
                    deviceowner: element.device_owner,
                    fixedips: JSON.stringify(element.fixed_ips),
                    ecl2networkid: element.network_id,
                    segmentationid: element.segmentation_id,
                    segmentationtype: element.segmentation_type,
                    zoneid: req.body.zoneid,
                    customerid: req.body.customerid,
                    tnregionid: req.body.tnregionid,
                    status: constants.STATUS_ACTIVE,
                    createdby: username,
                    createddt: new Date(),
                    lastupdatedby: username,
                    lastupdateddt: new Date(),
                  };
                  if (element.fixed_ips) {
                    object.ipaddress = element.fixed_ips[0].ip_address;
                  }
                  listarray.push(object);
                });
                commonService
                  .bulkCreate(listarray, db.ecl2ports)
                  .then((data) => {
                    let query = `UPDATE tbl_ecl2_ports n set n.zoneid = (select z.zoneid from tbl_ecl2_zones z where z.region=:region LIMIT 1 ),
                                n.networkid = (select n1.networkid from tbl_ecl2_networks n1 
                                where n1.ecl2networkid=n.ecl2networkid AND n1.status=:status AND n1.tnregionid=:tnregionid LIMIT 1)
                                WHERE n.tnregionid=:tnregionid AND n.status=:status`;
                    let params = {
                      replacements: {
                        tenantid: req.body.tenantid,
                        customerid: req.body.customerid,
                        region: req.body.region,
                        status: constants.STATUS_ACTIVE,
                        tnregionid: req.body.tnregionid,
                      },
                    };
                    commonService
                      .executeQuery(query, params, db.sequelize)
                      .then((list) => {})
                      .catch((error: Error) => {
                        console.log(error); //customValidation.generateAppError(error, response, res, req);
                      });
                    // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
                  })
                  .catch((error: Error) => {
                    console.log(error); //customValidation.generateAppError(error, response, res, req);
                  });
              }
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });
        }
        //OTHERS
        setTimeout(function () {
          new Controller().syncInternetGateway(
            req,
            res,
            response,
            requestheader,
            requestparams,
            defaultstatus,
            username
          );
        }, 1000);
      })
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }

  syncInternetGateway(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    // Internet Gateway
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        ECLApiURL.LIST.INTERNET_GATEWAY,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2igdata) => {
        if (ecl2igdata.internet_gateways.length > 0) {
          let listarray = [];
          _.forEach(ecl2igdata.internet_gateways, function (element) {
            let object = {
              ecl2internetgatewayid: element.id,
              tenantid: req.body.tenantid,
              gatewayname: element.name,
              description: element.description,
              zoneid: req.body.zoneid,
              customerid: req.body.customerid,
              tnregionid: req.body.tnregionid,
              status: constants.STATUS_ACTIVE,
              createdby: element.internet_service_id,
              createddt: new Date(),
              lastupdatedby: element.qos_option_id,
              lastupdateddt: new Date(),
            };

            listarray.push(object);
          });
          commonService
            .bulkCreate(listarray, db.ecl2internetgateways)
            .then((data) => {
              //Asset Mapping
              let ids = _.map(
                JSON.parse(JSON.stringify(data)),
                function (item: any) {
                  return item.internetgatewayid;
                }
              );
              commonService.bulkAssetMapping(
                ids,
                req.body.tenantid,
                constants.CLOUD_ECL,
                constants.RESOURCE_TYPES[8],
                req.body.customerid,
                req.body.tnregionid
              );

              let query = `UPDATE tbl_ecl2_internetgateways a 
                                    set a.zoneid = (select b.zoneid from tbl_ecl2_zones b where b.region=:region LIMIT 1 ),
                                    a.internetservicesid = (select c.internetservicesid from tbl_ecl2_internetservices c 
                                    where c.ecl2internetservicesid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                    a.qosoptionid = (select c.qosoptionid from tbl_ecl2_qosoptions c 
                                    where c.ecl2qosoptionid=a.lastupdatedby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                    a.createdby=:username,
                                    a.lastupdatedby=:username
                                    WHERE a.tnregionid=:tnregionid AND a.status=:status`;
              let params = {
                replacements: {
                  tenantid: req.body.tenantid,
                  customerid: req.body.customerid,
                  region: req.body.region,
                  username: username,
                  status: constants.STATUS_ACTIVE,
                  tnregionid: req.body.tnregionid,
                },
              };
              commonService
                .executeQuery(query, params, db.sequelize)
                .then((list) => {})
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });
              //Public IPs
              commonService
                .callECL2Reqest(
                  "GET",
                  req.body.region,
                  req.body.tenantid,
                  ECLApiURL.LIST.IG_PUBLICIPS,
                  requestheader,
                  requestparams,
                  req.body.ecl2tenantid
                )
                .then((ecl2data) => {
                  if (ecl2data.public_ips.length > 0) {
                    let listarray = [];
                    _.forEach(ecl2data.public_ips, function (element) {
                      let object = {
                        ecl2igglobalipid: element.id,
                        tenantid: req.body.tenantid,
                        globalipname: element.name,
                        description: element.description,
                        submasklength: element.submask_length,
                        cidr: element.cidr,
                        zoneid: req.body.zoneid,
                        customerid: req.body.customerid,
                        tnregionid: req.body.tnregionid,
                        //status: element.status == defaultstatus ? constants.STATUS_ACTIVE : constants.DELETE_STATUS,
                        status: constants.STATUS_ACTIVE,
                        createdby: element.internet_gw_id,
                        createddt: new Date(),
                        lastupdatedby: username,
                        lastupdateddt: new Date(),
                      };

                      listarray.push(object);
                    });
                    commonService
                      .bulkCreate(listarray, db.ecl2igglobalip)
                      .then((data) => {
                        let query = `UPDATE tbl_ecl2_igglobalip a 
                                                set a.zoneid = (select b.zoneid from tbl_ecl2_zones b where b.region=:region LIMIT 1 ),
                                                a.internetgatewayid = (select c.internetgatewayid from tbl_ecl2_internetgateways c 
                                                where c.ecl2internetgatewayid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                                a.createdby=:username
                                                WHERE a.tnregionid=:tnregionid AND a.status=:status`;
                        let params = {
                          replacements: {
                            tenantid: req.body.tenantid,
                            customerid: req.body.customerid,
                            region: req.body.region,
                            username: username,
                            status: constants.STATUS_ACTIVE,
                            tnregionid: req.body.tnregionid,
                          },
                        };
                        commonService
                          .executeQuery(query, params, db.sequelize)
                          .then((list) => {})
                          .catch((error: Error) => {
                            console.log(error); //customValidation.generateAppError(error, response, res, req);
                          });
                        // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
                      })
                      .catch((error: Error) => {
                        console.log(error); //customValidation.generateAppError(error, response, res, req);
                      });
                  }
                })
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });

              //Gateway Interface
              commonService
                .callECL2Reqest(
                  "GET",
                  req.body.region,
                  req.body.tenantid,
                  ECLApiURL.LIST.IG_GWINTERFACE,
                  requestheader,
                  requestparams,
                  req.body.ecl2tenantid
                )
                .then((ecl2data) => {
                  if (ecl2data.gw_interfaces.length > 0) {
                    let listarray = [];
                    _.forEach(ecl2data.gw_interfaces, function (element) {
                      let object = {
                        ecl2iginterfaceid: element.id,
                        tenantid: req.body.tenantid,
                        interfacename: element.name,
                        description: element.description,
                        netmask: element.netmask,
                        gwvipv4: element.gw_vipv4,
                        vrid: element.vrid,
                        primaryipv4: element.primary_ipv4,
                        secondaryipv4: element.secondary_ipv4,
                        servicetype: element.service_type,
                        zoneid: req.body.zoneid,
                        customerid: req.body.customerid,
                        tnregionid: req.body.tnregionid,
                        //status: element.status == defaultstatus ? constants.STATUS_ACTIVE : constants.DELETE_STATUS,
                        status: constants.STATUS_ACTIVE,
                        createdby: element.internet_gw_id,
                        createddt: new Date(),
                        lastupdatedby: element.network_id,
                        lastupdateddt: new Date(),
                      };

                      listarray.push(object);
                    });
                    commonService
                      .bulkCreate(listarray, db.ecl2iginterface)
                      .then((data) => {
                        let query = `UPDATE tbl_ecl2_iginterface a 
                                                set a.zoneid = (select b.zoneid from tbl_ecl2_zones b where b.region=:region LIMIT 1 ),
                                                a.internetgatewayid = (select c.internetgatewayid from tbl_ecl2_internetgateways c 
                                                where c.ecl2internetgatewayid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                                a.networkid = (select c.networkid from tbl_ecl2_networks c 
                                                where c.ecl2networkid=a.lastupdatedby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                                a.createdby=:username,
                                                a.lastupdatedby=:username
                                                WHERE a.tnregionid=:tnregionid AND a.status=:status`;
                        let params = {
                          replacements: {
                            tenantid: req.body.tenantid,
                            customerid: req.body.customerid,
                            region: req.body.region,
                            username: username,
                            status: constants.STATUS_ACTIVE,
                            tnregionid: req.body.tnregionid,
                          },
                        };
                        commonService
                          .executeQuery(query, params, db.sequelize)
                          .then((list) => {})
                          .catch((error: Error) => {
                            console.log(error); //customValidation.generateAppError(error, response, res, req);
                          });
                        //customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
                      })
                      .catch((error: Error) => {
                        console.log(error); //customValidation.generateAppError(error, response, res, req);
                      });
                  }
                })
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });

              //Static Route
              commonService
                .callECL2Reqest(
                  "GET",
                  req.body.region,
                  req.body.tenantid,
                  ECLApiURL.LIST.IG_STATICROUTE,
                  requestheader,
                  requestparams,
                  req.body.ecl2tenantid
                )
                .then((ecl2data) => {
                  if (ecl2data.static_routes.length > 0) {
                    let listarray = [];
                    _.forEach(ecl2data.static_routes, function (element) {
                      let object = {
                        ecl2igstaticipid: element.id,
                        tenantid: req.body.tenantid,
                        staticipname: element.name,
                        description: element.description,
                        servicetype: element.service_type,
                        nexthop: element.nexthop,
                        zoneid: req.body.zoneid,
                        customerid: req.body.customerid,
                        tnregionid: req.body.tnregionid,
                        //status: element.status == defaultstatus ? constants.STATUS_ACTIVE : constants.DELETE_STATUS,
                        status: constants.STATUS_ACTIVE,
                        createdby: element.internet_gw_id,
                        createddt: new Date(),
                        lastupdatedby: username,
                        lastupdateddt: new Date(),
                      };

                      listarray.push(object);
                    });
                    commonService
                      .bulkCreate(listarray, db.ecl2igstaticip)
                      .then((data) => {
                        let query = `UPDATE tbl_ecl2_igstaticip a 
                                                set a.zoneid = (select b.zoneid from tbl_ecl2_zones b where b.region=:region LIMIT 1 ),
                                                a.internetgatewayid = (select c.internetgatewayid from tbl_ecl2_internetgateways c 
                                                where c.ecl2internetgatewayid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                                a.createdby=:username
                                                WHERE a.tnregionid=:tnregionid AND a.status=:status`;
                        let params = {
                          replacements: {
                            tenantid: req.body.tenantid,
                            customerid: req.body.customerid,
                            region: req.body.region,
                            username: username,
                            status: constants.STATUS_ACTIVE,
                            tnregionid: req.body.tnregionid,
                          },
                        };
                        commonService
                          .executeQuery(query, params, db.sequelize)
                          .then((list) => {})
                          .catch((error: Error) => {
                            console.log(error); //customValidation.generateAppError(error, response, res, req);
                          });
                        //customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
                      })
                      .catch((error: Error) => {
                        console.log(error); //customValidation.generateAppError(error, response, res, req);
                      });
                  }
                })
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });
              //customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });
        }

        //OTHERS
        setTimeout(function () {
          new Controller().syncFirewall(
            req,
            res,
            response,
            requestheader,
            requestparams,
            defaultstatus,
            username
          );
        }, 500);
      })
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }

  syncFirewall(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    //vSRX-Virtual Network Appliances
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        ECLApiURL.LIST.VSRX,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2data) => {
        if (ecl2data.virtual_network_appliances.length > 0) {
          let listarray = [];
          let ecl2vsrxinterfaces = [] as any;
          _.forEach(ecl2data.virtual_network_appliances, function (element) {
            let object = {
              ecl2vsrxid: element.id,
              tenantid: req.body.tenantid,
              vsrxname: element.name,
              description: element.description,
              defaultgateway: element.default_gateway,
              zoneid: req.body.zoneid,
              customerid: req.body.customerid,
              tnregionid: req.body.tnregionid,
              status: constants.STATUS_ACTIVE,
              createdby: element.virtual_network_appliance_plan_id,
              createddt: new Date(),
              lastupdatedby: element.availability_zone,
              lastupdateddt: new Date(),
            };

            listarray.push(object);

            if (!_.isEmpty(element.interfaces)) {
              _.map(element.interfaces, function (value, key) {
                value.slotname = key;
                value.vsrxinterfacename = value.name;
                value.ipaddress = !_.isEmpty(value.fixed_ips)
                  ? value.fixed_ips[0].ip_address
                  : "";
                value.ecl2subnetid = !_.isEmpty(value.fixed_ips)
                  ? value.fixed_ips[0].ecl2subnetid
                  : "";
                value.tnregionid = req.body.tnregionid;
                value.createdby = element.id;
                value.createddt = new Date();
                value.lastupdateddt = new Date();
                value.lastupdatedby = value.network_id;
                if (!_.isEmpty(value.allowedaddresspairs)) {
                  value.allowedaddresspairs = JSON.stringify(
                    value.allowedaddresspairs
                  );
                }
                ecl2vsrxinterfaces.push(value);
                //req.body.ecl2vsrxinterface = ecl2vsrxinterfaces;
              });
              let serialno = -1;
              ecl2vsrxinterfaces = _.orderBy(ecl2vsrxinterfaces, "slotname");
              _.map(ecl2vsrxinterfaces, function (item: any) {
                serialno = serialno + 1;
                item.vsrxinterfaceslot = "ge-0/0/" + serialno;
                item.vsrxinterfaceunitslot = item.vsrxinterfaceslot + ".0";
                return item;
              });
            }
          });
          commonService
            .bulkCreate(listarray, db.ecl2vsrx)
            .then((data) => {
              //Asset Mapping
              let ids = _.map(
                JSON.parse(JSON.stringify(data)),
                function (item: any) {
                  return item.vsrxid;
                }
              );
              commonService.bulkAssetMapping(
                ids,
                req.body.tenantid,
                constants.CLOUD_ECL,
                constants.RESOURCE_TYPES[7],
                req.body.customerid,
                req.body.tnregionid
              );

              let query = `UPDATE tbl_ecl2_vsrx a 
                               set a.zoneid = (select b.zoneid from tbl_ecl2_zones b where b.zonename=CONCAT(:region,'-',a.lastupdatedby) LIMIT 1 ),
                               a.vsrxplanid = (select c.vsrxplanid from tbl_ecl2_vsrxplan c 
                               where c.ecl2vsrxplanid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                               a.createdby=:username,
                               a.lastupdatedby=:username
                               WHERE a.tnregionid=:tnregionid AND a.status=:status`;
              let params = {
                replacements: {
                  tenantid: req.body.tenantid,
                  customerid: req.body.customerid,
                  region: req.body.region,
                  username: username,
                  status: constants.STATUS_ACTIVE,
                  tnregionid: req.body.tnregionid,
                },
              };
              commonService
                .executeQuery(query, params, db.sequelize)
                .then((list) => {})
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });
              if (ecl2vsrxinterfaces.length > 0) {
                commonService
                  .bulkCreate(ecl2vsrxinterfaces, db.ecl2vsrxinterface)
                  .then((data) => {
                    let query = `UPDATE tbl_ecl2_vsrxinterface a 
                                       set a.vsrxid = (select c.vsrxid from tbl_ecl2_vsrx c 
                                       where c.ecl2vsrxid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid ORDER BY 1 DESC LIMIT 1),
                                       a.networkid = (select c.networkid from tbl_ecl2_networks c 
                                       where c.ecl2networkid=a.lastupdatedby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                       a.createdby=:username,
                                       a.lastupdatedby=:username
                                       WHERE a.tnregionid=:tnregionid AND a.status=:status`;
                    let params = {
                      replacements: {
                        tenantid: req.body.tenantid,
                        customerid: req.body.customerid,
                        region: req.body.region,
                        username: username,
                        status: constants.STATUS_ACTIVE,
                        tnregionid: req.body.tnregionid,
                      },
                    };
                    commonService
                      .executeQuery(query, params, db.sequelize)
                      .then((list) => {})
                      .catch((error: Error) => {
                        console.log(error); //customValidation.generateAppError(error, response, res, req);
                      });
                  })
                  .catch((error: Error) => {
                    console.log(error); //customValidation.generateAppError(error, response, res, req);
                  });
              }

              // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });
        }

        //OTHERS
        setTimeout(function () {
          new Controller().syncCFG(
            req,
            res,
            response,
            requestheader,
            requestparams,
            defaultstatus,
            username
          );
        }, 500);
      })
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }

  syncCFG(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    //Common Function Gateway
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        ECLApiURL.LIST.COMMON_FN_GATEWAY,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2data) => {
        if (ecl2data.common_function_gateways.length > 0) {
          let listarray = [];
          _.forEach(ecl2data.common_function_gateways, function (element) {
            let object = {
              ecl2cfgatewayid: element.id,
              tenantid: req.body.tenantid,
              cfgatewayname: element.name,
              description: element.description,
              zoneid: req.body.zoneid,
              customerid: req.body.customerid,
              tnregionid: req.body.tnregionid,
              //status: element.status == defaultstatus ? constants.STATUS_ACTIVE : constants.DELETE_STATUS,
              status: constants.STATUS_ACTIVE,
              createdby: element.common_function_pool_id,
              notes: element.network_id,
              createddt: new Date(),
              lastupdatedby: element.subnet_id,
              lastupdateddt: new Date(),
            };

            listarray.push(object);
          });
          commonService
            .bulkCreate(listarray, db.ecl2commonfunctiongateway)
            .then((data) => {
              //Asset Mapping
              let ids = _.map(
                JSON.parse(JSON.stringify(data)),
                function (item: any) {
                  return item.cfgatewayid;
                }
              );
              commonService.bulkAssetMapping(
                ids,
                req.body.tenantid,
                constants.CLOUD_ECL,
                constants.RESOURCE_TYPES[9],
                req.body.customerid,
                req.body.tnregionid
              );

              let query = `UPDATE tbl_ecl2_commonfunctiongateway a 
                            set a.zoneid = (select b.zoneid from tbl_ecl2_zones b where b.region=:region LIMIT 1 ),
                            a.cfpoolid = (select c.cfpoolid from tbl_ecl2_commonfunctionpool c 
                            where c.ecl2cfpoolid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid ORDER BY 1 DESC LIMIT 1),
                            a.networkid = (select c.networkid from tbl_ecl2_networks c 
                            where c.ecl2networkid=a.notes AND c.status=:status AND c.tnregionid=:tnregionid ORDER BY 1 DESC LIMIT 1),
                            a.subnetid = (select c.subnetid from tbl_ecl2_subnets c 
                            where c.ecl2subnetid=a.lastupdatedby AND c.status=:status AND c.tnregionid=:tnregionid ORDER BY 1 DESC LIMIT 1),
                            a.createdby=:username ,
                            a.lastupdatedby=:username,
                            a.notes=''
                            WHERE a.tnregionid=:tnregionid  AND a.status=:status`;
              let params = {
                replacements: {
                  tenantid: req.body.tenantid,
                  customerid: req.body.customerid,
                  region: req.body.region,
                  username: username,
                  status: constants.STATUS_ACTIVE,
                  tnregionid: req.body.tnregionid,
                },
              };
              commonService
                .executeQuery(query, params, db.sequelize)
                .then((list) => {})
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });
              // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });
        }

        //OTHERS
        setTimeout(function () {
          new Controller().syncLoadbalancer(
            req,
            res,
            response,
            requestheader,
            requestparams,
            defaultstatus,
            username
          );
        }, 500);
      })
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }

  syncLoadbalancer(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    //Load Balancer
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        ECLApiURL.LIST.LOAD_BALANCER,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2data) => {
        if (ecl2data.load_balancers.length > 0) {
          let listarray = [];
          _.forEach(ecl2data.load_balancers, function (element) {
            let object = {
              ecl2loadbalancerid: element.id,
              tenantid: req.body.tenantid,
              lbname: element.name,
              availabilityzone: element.availability_zone,
              description: element.description,
              username: element.user_username,
              zoneid: req.body.zoneid,
              customerid: req.body.customerid,
              tnregionid: req.body.tnregionid,
              //status: element.status == defaultstatus ? constants.STATUS_ACTIVE : constants.DELETE_STATUS,
              status: constants.STATUS_ACTIVE,
              createdby: element.load_balancer_plan_id,
              createddt: new Date(),
              lastupdatedby: username,
              lastupdateddt: new Date(),
            };

            listarray.push(object);
          });
          commonService
            .bulkCreate(listarray, db.ecl2loadbalancers)
            .then((data) => {
              //Asset Mapping
              let ids = _.map(
                JSON.parse(JSON.stringify(data)),
                function (item: any) {
                  return item.loadbalancerid;
                }
              );
              commonService.bulkAssetMapping(
                ids,
                req.body.tenantid,
                constants.CLOUD_ECL,
                constants.RESOURCE_TYPES[4],
                req.body.customerid,
                req.body.tnregionid
              );

              let query = `UPDATE tbl_ecl2_loadbalancers a 
                             set a.zoneid = (select b.zoneid from tbl_ecl2_zones b where b.region=:region LIMIT 1 ),
                             a.loadbalancerplanid = (select c.lbplanid from tbl_ecl2_lbplan c 
                             where c.ecl2lbplanid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                             a.loadbalancerplan = (select c.lbplanname from tbl_ecl2_lbplan c 
                             where c.ecl2lbplanid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                             a.createdby=:username
                             WHERE a.tnregionid=:tnregionid AND a.status=:status`;
              let params = {
                replacements: {
                  tenantid: req.body.tenantid,
                  customerid: req.body.customerid,
                  region: req.body.region,
                  username: username,
                  status: constants.STATUS_ACTIVE,
                  tnregionid: req.body.tnregionid,
                },
              };
              commonService
                .executeQuery(query, params, db.sequelize)
                .then((list) => {
                  //Load Balancer Interface
                  commonService
                    .callECL2Reqest(
                      "GET",
                      req.body.region,
                      req.body.tenantid,
                      ECLApiURL.LIST.LB_INTERFACE,
                      requestheader,
                      requestparams,
                      req.body.ecl2tenantid
                    )
                    .then((ecl2data) => {
                      if (ecl2data.load_balancer_interfaces.length > 0) {
                        let listarray = [];
                        _.forEach(
                          ecl2data.load_balancer_interfaces,
                          function (element) {
                            let object = {
                              ecl2lbinterfaceid: element.id,
                              tenantid: req.body.tenantid,
                              region: req.body.region,
                              ipaddress: element.ip_address,
                              lbinterfacename: element.name,
                              description: element.description,
                              slotnumber: element.slot_number,
                              virtualipaddress: element.virtual_ip_address,
                              zoneid: req.body.zoneid,
                              customerid: req.body.customerid,
                              tnregionid: req.body.tnregionid,
                              status: element.status,
                              createdby: element.load_balancer_id,
                              createddt: new Date(),
                              lastupdatedby: element.network_id,
                              lastupdateddt: new Date(),
                            };

                            listarray.push(object);
                          }
                        );
                        commonService
                          .bulkCreate(listarray, db.ecl2lbinterface)
                          .then((data) => {
                            let query = `UPDATE tbl_ecl2_lbinterface a 
                                             set a.loadbalancerid = (select c.loadbalancerid from tbl_ecl2_loadbalancers c 
                                             where c.ecl2loadbalancerid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                             a.networkid = (select c.networkid from tbl_ecl2_networks c 
                                             where c.ecl2networkid=a.lastupdatedby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                             a.createdby=:username,
                                             a.lastupdatedby=:username
                                             WHERE a.tnregionid=:tnregionid`;
                            let params = {
                              replacements: {
                                tenantid: req.body.tenantid,
                                customerid: req.body.customerid,
                                region: req.body.region,
                                username: username,
                                status: constants.STATUS_ACTIVE,
                                tnregionid: req.body.tnregionid,
                              },
                            };
                            commonService
                              .executeQuery(query, params, db.sequelize)
                              .then((list) => {})
                              .catch((error: Error) => {
                                console.log(error); //customValidation.generateAppError(error, response, res, req);
                              });
                            //customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
                          })
                          .catch((error: Error) => {
                            console.log(error); //customValidation.generateAppError(error, response, res, req);
                          });
                      }
                    })
                    .catch((error: Error) => {
                      console.log(error); //customValidation.generateAppError(error, response, res, req);
                    });

                  //Load Balancer Syslog Server
                  commonService
                    .callECL2Reqest(
                      "GET",
                      req.body.region,
                      req.body.tenantid,
                      ECLApiURL.LIST.LB_SYSLOG_SERVER,
                      requestheader,
                      requestparams,
                      req.body.ecl2tenantid
                    )
                    .then((ecl2data) => {
                      if (ecl2data.load_balancer_syslog_servers.length > 0) {
                        let listarray = [];
                        _.forEach(
                          ecl2data.load_balancer_syslog_servers,
                          function (element) {
                            let object = {
                              ecl2lbsyslogserverid: element.id,
                              tenantid: req.body.tenantid,
                              region: req.body.region,
                              lbsyslogservername: element.name,
                              ipaddress: element.ip_address,
                              description: element.description,
                              logfacility: element.log_facility,
                              loglevel: element.log_level,
                              portnumber: element.port_number,
                              transporttype: element.transport_type,
                              zoneid: req.body.zoneid,
                              customerid: req.body.customerid,
                              tnregionid: req.body.tnregionid,
                              //status: element.status == defaultstatus ? constants.STATUS_ACTIVE : constants.DELETE_STATUS,
                              status: constants.STATUS_ACTIVE,
                              createdby: element.load_balancer_id,
                              createddt: new Date(),
                              lastupdatedby: username,
                              lastupdateddt: new Date(),
                            };

                            listarray.push(object);
                          }
                        );
                        commonService
                          .bulkCreate(listarray, db.ecl2lbsyslogserver)
                          .then((data) => {
                            let query = `UPDATE tbl_ecl2_lbsyslogserver a 
                                                 set a.loadbalancerid = (select c.loadbalancerid from tbl_ecl2_loadbalancers c 
                                                 where c.ecl2loadbalancerid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                                 a.createdby=:username
                                                 WHERE a.tnregionid=:tnregionid AND a.status=:status`;
                            let params = {
                              replacements: {
                                tenantid: req.body.tenantid,
                                customerid: req.body.customerid,
                                region: req.body.region,
                                username: username,
                                status: constants.STATUS_ACTIVE,
                                tnregionid: req.body.tnregionid,
                              },
                            };
                            commonService
                              .executeQuery(query, params, db.sequelize)
                              .then((list) => {})
                              .catch((error: Error) => {
                                console.log(error); //customValidation.generateAppError(error, response, res, req);
                              });
                            //customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
                          })
                          .catch((error: Error) => {
                            console.log(error); //customValidation.generateAppError(error, response, res, req);
                          });
                      }
                    })
                    .catch((error: Error) => {
                      console.log(error); //customValidation.generateAppError(error, response, res, req);
                    });
                })
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });
              // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });
        }
        //OTHERS
        setTimeout(function () {
          new Controller().syncOthers(
            req,
            res,
            response,
            requestheader,
            requestparams,
            defaultstatus,
            username
          );
        }, 500);
      })
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }
  syncOthers(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    //Volumes
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        ECLApiURL.LIST.VOLUMES,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2data) => {
        if (ecl2data.volumes.length > 0) {
          let listarray = [];
          let tagvalues = [];

          _.forEach(ecl2data.volumes, function (element) {
            let object = {
              ecl2volumeid: element.id,
              tenantid: req.body.tenantid,
              volumename: element.displayName,
              description: element.displayDescription,
              size: element.size,
              volumetype: element.volume_type,
              zoneid: req.body.zoneid,
              customerid: req.body.customerid,
              tnregionid: req.body.tnregionid,
              status: constants.STATUS_ACTIVE,
              createdby: element.availabilityZone,
              createddt: new Date(element.createdAt),
              lastupdatedby: username,
              lastupdateddt: new Date(element.createdAt),
            };
            new Controller().addTagValue(
              req,
              element.metadata,
              element.id,
              tagvalues,
              constants.RESOURCE_TYPES[2]
            );

            listarray.push(object);
          });
          commonService
            .bulkCreate(listarray, db.ecl2volumes)
            .then((data) => {
              //Asset Mapping
              let ids = _.map(
                JSON.parse(JSON.stringify(data)),
                function (item: any) {
                  return item.volumeid;
                }
              );
              commonService.bulkAssetMapping(
                ids,
                req.body.tenantid,
                constants.CLOUD_ECL,
                constants.RESOURCE_TYPES[2],
                req.body.customerid,
                req.body.tnregionid
              );

              let query = `UPDATE tbl_ecl2_volumes a 
                              set a.zoneid = (select b.zoneid from tbl_ecl2_zones b 
                              where b.zonename=CONCAT(:region,'-',a.createdby) LIMIT 1 ),
                              a.createdby=:username
                              WHERE a.tnregionid=:tnregionid AND a.status=:status`;
              let params = {
                replacements: {
                  tenantid: req.body.tenantid,
                  customerid: req.body.customerid,
                  region: req.body.region,
                  username: username,
                  status: constants.STATUS_ACTIVE,
                  tnregionid: req.body.tnregionid,
                },
              };
              commonService
                .executeQuery(query, params, db.sequelize)
                .then((list) => {
                  // For Tags
                  let tquery = `UPDATE tbl_bs_tag_values a 
                        set a.tagid = (select c.tagid from tbl_bs_tags c 
                        where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                        a.resourceid = (select c.volumeid from tbl_ecl2_volumes c 
                        where c.ecl2volumeid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        a.resourcerefid = a.createdby,
                        a.createdby=:username
                        WHERE a.tagid IS NULL  AND a.resourcetype =:resourcetype`;

                  new Controller().syncTagValues(
                    req,
                    res,
                    response,
                    requestheader,
                    requestparams,
                    defaultstatus,
                    username,
                    tagvalues,
                    tquery,
                    constants.RESOURCE_TYPES[2]
                  );
                })
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });
              // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });
        }
      })
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });

    //os-keypairs
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        ECLApiURL.LIST.OS_KEYPAIR,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2data) => {
        if (ecl2data.keypairs.length > 0) {
          let listarray = [];
          _.forEach(ecl2data.keypairs, function (element) {
            let object = {
              tenantid: req.body.tenantid,
              keyname: element.keypair.name,
              publickey: element.keypair.public_key,
              fingerprint: element.keypair.fingerprint,
              zoneid: req.body.zoneid,
              customerid: req.body.customerid,
              tnregionid: req.body.tnregionid,
              status: constants.STATUS_ACTIVE,
              createdby: username,
              createddt: new Date(),
              lastupdatedby: username,
              lastupdateddt: new Date(),
            };

            listarray.push(object);
          });
          commonService
            .bulkCreate(listarray, db.ecl2keys)
            .then((data) => {
              let query = `UPDATE tbl_ecl2_keys a 
                         set a.zoneid = (select b.zoneid from tbl_ecl2_zones b where b.region=:region LIMIT 1 )
                         WHERE a.tnregionid=:tnregionid AND a.status=:status`;
              let params = {
                replacements: {
                  tenantid: req.body.tenantid,
                  customerid: req.body.customerid,
                  region: req.body.region,
                  username: username,
                  status: constants.STATUS_ACTIVE,
                  tnregionid: req.body.tnregionid,
                },
              };
              commonService
                .executeQuery(query, params, db.sequelize)
                .then((list) => {})
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });
              //customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });
        }

        setTimeout(function () {
          new Controller().syncInstances(
            req,
            res,
            response,
            requestheader,
            requestparams,
            defaultstatus,
            username
          );
        }, 4000);
      })
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }

  syncInstances(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        ECLApiURL.LIST.TENANT_CONN_REQUEST,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((connectionreq) => {
        let sharedNetworks = [] as any;
        if (connectionreq.tenant_connection_requests.length > 0) {
          sharedNetworks = _.map(
            connectionreq.tenant_connection_requests,
            "name"
          );
        }
        //console.log('sharedNetworks >> ',sharedNetworks);
        commonService
          .callECL2Reqest(
            "GET",
            req.body.region,
            req.body.tenantid,
            ECLApiURL.LIST.NOVA_SERVER,
            requestheader,
            requestparams,
            req.body.ecl2tenantid
          )
          .then((ecl2data) => {
            if (ecl2data.servers.length > 0) {
              let listarray = [];
              let tagvalues = [];
              _.forEach(ecl2data.servers, function (element) {
                let object = {
                  tenantid: req.body.tenantid,
                  customerid: req.body.customerid,
                  cloudprovider: constants.CLOUD_ECL,
                  instancerefid: element.id,
                  instancename: element.name,
                  zoneid: req.body.zoneid,
                  region: req.body.region,
                  imagerefid: element.image ? element.image.id : null,
                  instancetyperefid: element.flavor ? element.flavor.id : null,
                  networkrefid: JSON.stringify(
                    _.map(element.addresses, function (item: any, key) {
                      return key;
                    })
                  ),
                  volumerefid:
                    element["os-extended-volumes:volumes_attached"] &&
                    element["os-extended-volumes:volumes_attached"][0]
                      ? element["os-extended-volumes:volumes_attached"][0].id
                      : null,
                  keyrefid: element.key_name,
                  privateipv4:
                    element.addresses[Object.keys(element.addresses)[0]][0]
                      .addr,
                  monitoringyn: "N",
                  monitorutilyn: "Y",
                  deletionprotectionyn: "N",
                  lbstatus: "N",
                  emailyn: "N",
                  description: element.description,
                  username: element.user_username,
                  tnregionid: req.body.tnregionid,
                  //status: element.status == defaultstatus ? constants.STATUS_ACTIVE : constants.DELETE_STATUS,
                  status: constants.STATUS_ACTIVE,
                  createdby: element["OS-EXT-AZ:availability_zone"],
                  createddt: new Date(element.created),
                  lastupdatedby: username,
                  lastupdateddt: new Date(element.created),
                  tagvalues: [],
                };
                try {
                  for (var key in element.addresses) {
                    if (
                      sharedNetworks &&
                      sharedNetworks.length > 0 &&
                      sharedNetworks.includes(key)
                    ) {
                      object.privateipv4 = element.addresses[key][0].addr;
                    }
                  }
                } catch (e) {
                  console.log(e);
                }
                new Controller().addTagValue(
                  req,
                  element.metadata,
                  element.id,
                  tagvalues,
                  constants.RESOURCE_TYPES[0]
                );

                listarray.push(object);
              });
              commonService
                .bulkCreate(listarray, db.Instances)
                .then((listins) => {
                  //Asset Mapping
                  let ids = _.map(
                    JSON.parse(JSON.stringify(listins)),
                    function (item: any) {
                      return item.instanceid;
                    }
                  );
                  commonService.bulkAssetMapping(
                    ids,
                    req.body.tenantid,
                    constants.CLOUD_ECL,
                    constants.RESOURCE_TYPES[0],
                    req.body.customerid,
                    req.body.tnregionid
                  );

                  let query = `UPDATE tbl_tn_instances a 
                    set a.zoneid = (select b.zoneid from tbl_ecl2_zones b where b.zonename=CONCAT(:region,'-',a.createdby) LIMIT 1 ),
                    a.imageid = (select c.imageid from tbl_ecl2_images c 
                    where c.ecl2imageid=a.imagerefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                    a.instancetypeid = (select c.instancetypeid from tbl_ecl2_instancetype c 
                    where c.instancetypename=a.instancetyperefid AND c.status=:status LIMIT 1),
                    a.volumeid = (select c.volumeid from tbl_ecl2_volumes c 
                    where c.ecl2volumeid=a.volumerefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                    a.keyid = (select c.keyid from tbl_ecl2_keys c 
                    where c.keyname=a.keyrefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                    a.createdby=:username
                    WHERE a.cloudprovider=:cloudprovider AND a.tnregionid=:tnregionid AND a.status=:status`;
                  let params = {
                    replacements: {
                      tenantid: req.body.tenantid,
                      customerid: req.body.customerid,
                      region: req.body.region,
                      username: username,
                      status: constants.STATUS_ACTIVE,
                      cloudprovider: constants.CLOUD_ECL,
                      tnregionid: req.body.tnregionid,
                    },
                  };
                  commonService
                    .executeQuery(query, params, db.sequelize)
                    .then((list) => {
                      let ilist = JSON.parse(JSON.stringify(listins));

                      _.forEach(ilist, function (element) {
                        let qry = `UPDATE tbl_tn_instances set networkid = (
                            select CONCAT('[',GROUP_CONCAT(networkid),']') from tbl_ecl2_networks 
                            where tnregionid=:tnregionid AND status=:status AND networkname  IN (:networkname))
                            WHERE instanceid =:instanceid `;

                        let prms = {
                          replacements: {
                            instanceid: element.instanceid,
                            networkname: JSON.parse(element.networkrefid),
                            customerid: req.body.customerid,
                            status: constants.STATUS_ACTIVE,
                            tnregionid: req.body.tnregionid,
                          },
                        };

                        commonService
                          .executeQuery(qry, prms, db.sequelize)
                          .then((list) => {})
                          .catch((error: Error) => {
                            console.log(error); //customValidation.generateAppError(error, response, res, req);
                          });
                      });

                      // Update Tag values
                      let tquery = `UPDATE tbl_bs_tag_values a 
                        set a.tagid = (select c.tagid from tbl_bs_tags c 
                        where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                        a.resourceid = (select c.instanceid from tbl_tn_instances c 
                        where c.instancerefid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        a.resourcerefid = a.createdby,
                        a.createdby=:username
                        WHERE a.tagid IS NULL AND a.resourcetype =:resourcetype`;

                      new Controller().syncTagValues(
                        req,
                        res,
                        response,
                        requestheader,
                        requestparams,
                        defaultstatus,
                        username,
                        tagvalues,
                        tquery,
                        constants.RESOURCE_TYPES[0]
                      );
                    })
                    .catch((error: Error) => {
                      console.log(error); //customValidation.generateAppError(error, response, res, req);
                    });
                  setTimeout(function () {
                    // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
                  }, 3000);
                })
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });
            } else {
              setTimeout(function () {
                // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
              }, 3000);
            }

            setTimeout(function () {
              new Controller().syncVolumeAttachments(
                req,
                res,
                response,
                requestheader,
                requestparams,
                defaultstatus,
                username
              );
            }, 3000);
          })
          .catch((error: Error) => {
            console.log(error); //customValidation.generateAppError(error, response, res, req);
          });
      });
  }

  syncVolumeAttachments(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        ECLApiURL.LIST.VOLUMES,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2data) => {
        if (ecl2data.volumes.length > 0) {
          let listarray = [];
          _.forEach(ecl2data.volumes, function (volumedata) {
            if (volumedata.attachments && volumedata.attachments.length > 0) {
              _.forEach(volumedata.attachments, function (element) {
                if (element.volumeId) {
                  let object = {
                    ecl2volumeattachmentid: element.id,
                    tenantid: req.body.tenantid,
                    device: element.device,
                    customerid: req.body.customerid,
                    tnregionid: req.body.tnregionid,
                    instancerefid: element.serverId,
                    status: constants.STATUS_ACTIVE,
                    createdby: element.serverId,
                    createddt: new Date(),
                    lastupdatedby: element.volumeId,
                    lastupdateddt: new Date(),
                  };

                  listarray.push(object);
                }
              });
            }
          });
          commonService
            .bulkCreate(listarray, db.ecl2volumeattachment)
            .then((data) => {
              let query = `UPDATE tbl_ecl2_volumeattachments a 
                    set a.instanceid = (select c.instanceid from tbl_tn_instances c 
                    where c.instancerefid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid ORDER BY 1 DESC LIMIT 1),
                    a.volumeid = (select c.volumeid from tbl_ecl2_volumes c 
                    where c.ecl2volumeid=a.lastupdatedby AND c.status=:status AND c.tnregionid=:tnregionid ORDER BY 1 DESC LIMIT 1),
                    a.createdby=:username ,
                    a.lastupdatedby=:username
                    WHERE a.tnregionid = :tnregionid AND a.status=:status`;
              let params = {
                replacements: {
                  tenantid: req.body.tenantid,
                  customerid: req.body.customerid,
                  region: req.body.region,
                  username: username,
                  status: constants.STATUS_ACTIVE,
                  tnregionid: req.body.tnregionid,
                },
              };
              commonService
                .executeQuery(query, params, db.sequelize)
                .then((list) => {})
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });
              // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });
        }
        //customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);

        new Controller().syncInterConnectivity(
          req,
          res,
          response,
          requestheader,
          requestparams,
          defaultstatus,
          username
        );
      })
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }

  syncInterConnectivity(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any
  ): void {
    commonService
      .callECL2Reqest(
        "GET",
        req.body.region,
        req.body.tenantid,
        ECLApiURL.LIST.TENANT_CONN_REQUEST,
        requestheader,
        requestparams,
        req.body.ecl2tenantid
      )
      .then((ecl2data) => {
        if (ecl2data.tenant_connection_requests.length > 0) {
          let listarray = [];
          _.forEach(ecl2data.tenant_connection_requests, function (element) {
            let object = {
              ecltenantconnrequestid: element.id,
              tenantid: req.body.tenantid,
              customerid: req.body.customerid,
              tnregionid: req.body.tnregionid,
              region: req.body.region,
              name: element.name,
              ecl2tenantidother: element.tenant_id_other,
              ecl2networkid: element.network_id,
              description: element.description,
              approvalrequestid: element.approval_request_id,
              eclstatus: element.status,
              status: constants.STATUS_ACTIVE,
              createdby: username,
              createddt: new Date(),
              lastupdatedby: username,
              lastupdateddt: new Date(),
            };
            listarray.push(object);
          });
          commonService
            .bulkCreate(listarray, db.ecl2tenantconnrequest)
            .then((connreq) => {
              connreq = JSON.parse(JSON.stringify(connreq));

              commonService
                .callECL2Reqest(
                  "GET",
                  req.body.region,
                  req.body.tenantid,
                  ECLApiURL.LIST.TENANT_CONN,
                  requestheader,
                  requestparams,
                  req.body.ecl2tenantid
                )
                .then((ecl2data) => {
                  if (ecl2data.tenant_connections.length > 0) {
                    let listarray = [];
                    _.forEach(ecl2data.tenant_connections, function (element) {
                      let object = {
                        eclttenantconnectionid: element.id,
                        tenantid: req.body.tenantid,
                        customerid: req.body.customerid,
                        tnregionid: req.body.tnregionid,
                        tenantconnrequestid: null,
                        name: element.name,
                        description: element.description,
                        devicetype: element.device_type,
                        deviceinterfaceid: element.device_interface_id,
                        ecl2tenantidother: element.tenant_id_other,
                        ecl2networkid: element.network_id,
                        ecl2deviceid: element.device_id,
                        ecl2portid: element.port_id,
                        status: constants.STATUS_ACTIVE,
                        createdby: username,
                        createddt: new Date(),
                        lastupdatedby: username,
                        lastupdateddt: new Date(),
                      };
                      let connreqobj = connreq.find(function (obj) {
                        return (
                          obj.ecltenantconnrequestid ==
                          element.tenant_connection_request_id
                        );
                      });
                      if (connreqobj) {
                        object.tenantconnrequestid =
                          connreqobj.tenantconnrequestid;
                      }
                      listarray.push(object);
                    });
                    commonService
                      .bulkCreate(listarray, db.ecl2tenantconnection)
                      .then((data) => {
                        let query = `UPDATE tbl_ecl2_tenantconnection a 
                    set a.deviceid = (select c.instanceid from tbl_tn_instances c 
                    where c.instancerefid=a.ecl2deviceid AND c.status=:status AND c.tnregionid=:tnregionid ORDER BY 1 DESC LIMIT 1)
                    WHERE a.tnregionid = :tnregionid AND a.status=:status`;
                        let params = {
                          replacements: {
                            tenantid: req.body.tenantid,
                            customerid: req.body.customerid,
                            region: req.body.region,
                            username: username,
                            status: constants.STATUS_ACTIVE,
                            tnregionid: req.body.tnregionid,
                          },
                        };
                        commonService
                          .executeQuery(query, params, db.sequelize)
                          .then((list) => {})
                          .catch((error: Error) => {
                            console.log(error); //customValidation.generateAppError(error, response, res, req);
                          });
                      })
                      .catch((error: Error) => {
                        console.log(error); //customValidation.generateAppError(error, response, res, req);
                      });
                  }
                  //customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
                })
                .catch((error: Error) => {
                  console.log(error); //customValidation.generateAppError(error, response, res, req);
                });
            })
            .catch((error: Error) => {
              console.log(error); //customValidation.generateAppError(error, response, res, req);
            });
        }
        //customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
      })
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }

  syncTagValues(
    req: Request,
    res: Response,
    response: any,
    requestheader: any,
    requestparams: any,
    defaultstatus: any,
    username: any,
    tagvalues: any,
    query: any,
    presourcetype: any
  ): void {
    commonService
      .bulkCreate(tagvalues, db.TagValues)
      .then((data) => {
        let params = {
          replacements: {
            tenantid: req.body.tenantid,
            customerid: req.body.customerid,
            region: req.body.region,
            username: username,
            resourcetype: presourcetype,
            status: constants.STATUS_ACTIVE,
            tnregionid: req.body.tnregionid,
          },
        };
        commonService
          .executeQuery(query, params, db.sequelize)
          .then((list) => {
            // Create Tags
            let query = `select DISTINCT lastupdatedby  from tbl_bs_tag_values 
                where tagid is null AND tenantid=:tenantid AND resourcetype=:resourcetype AND lastupdatedby!=:username`;
            let params = {
              replacements: {
                tenantid: req.body.tenantid,
                resourcetype: presourcetype,
                username: username,
              },
              type: db.sequelize.QueryTypes.SELECT,
            };
            commonService
              .executeQuery(query, params, db.sequelize)
              .then((tvlist) => {
                let taglist = [];
                if (tvlist && tvlist.length > 0) {
                  _.forEach(JSON.parse(JSON.stringify(tvlist)), function (tag) {
                    let obj = {
                      tenantid: req.body.tenantid,
                      //resourcetype: presourcetype,
                      tagname: tag.lastupdatedby,
                      tagtype: "text",
                      status: constants.STATUS_ACTIVE,
                      createdby: username,
                      createddt: new Date(),
                      lastupdatedby: username,
                      lastupdateddt: new Date(),
                    };
                    taglist.push(obj);
                  });

                  commonService
                    .bulkCreate(taglist, db.Tags)
                    .then((data) => {
                      let query = `UPDATE tbl_bs_tag_values a 
                                            set a.tagid = (select c.tagid from tbl_bs_tags c 
                                            where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                                            a.createdby=:username,
                                            a.lastupdatedby=:username
                                            WHERE a.tagid IS NULL AND a.tenantid=:tenantid AND a.resourcetype=:resourcetype`;
                      let params = {
                        replacements: {
                          tenantid: req.body.tenantid,
                          customerid: req.body.customerid,
                          region: req.body.region,
                          username: username,
                          resourcetype: presourcetype,
                        },
                      };
                      commonService
                        .executeQuery(query, params, db.sequelize)
                        .then((list) => {})
                        .catch((error: Error) => {
                          console.log(error); //customValidation.generateAppError(error, response, res, req);
                        });
                    })
                    .catch((error: Error) => {
                      console.log(error); //customValidation.generateAppError(error, response, res, req);
                    });
                }
              })
              .catch((error: Error) => {
                console.log(error); //customValidation.generateAppError(error, response, res, req);
              });
          })
          .catch((error: Error) => {
            console.log(error); //customValidation.generateAppError(error, response, res, req);
          });

        // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
      })
      .catch((error: Error) => {
        console.log(error); //customValidation.generateAppError(error, response, res, req);
      });
  }

  addTagValue(
    req: Request,
    metadata: any,
    refid: any,
    tagvalues: any,
    presourcetype: any
  ) {
    if (metadata) {
      for (var key in metadata) {
        if (metadata.hasOwnProperty(key)) {
          if (constants.DEFAULT_TAGS.indexOf(key) == -1) {
            let tag = {
              tenantid: req.body.tenantid,
              cloudprovider: constants.CLOUD_ECL,
              resourcetype: presourcetype,
              tagvalue: metadata[key],
              status: constants.STATUS_ACTIVE,
              tnregionid: req.body.tnregionid,
              createdby: refid,
              createddt: new Date(),
              lastupdatedby: key,
              lastupdateddt: new Date(),
            };
            tagvalues.push(tag);
          }
        }
      }
    }
  }
}

export default new Controller();

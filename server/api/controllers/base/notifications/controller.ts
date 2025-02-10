import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import NotificationService from "../../../services/notification.service";
import * as _ from "lodash";
import { modules } from "../../../../common/module";
import { getAllList } from "../../monitoring/synthetics/get";
import { RequestHandler } from "express";
import sendEmail from "../../../services/email";
import Mjml2HTML = require("mjml");
import { Op } from "sequelize";
import sequelize = require("sequelize");
import commonService from "../../../services/common.service";
import getTemplate from "../../../services/template.service";
import moment = require("moment");

interface AlertReceivers {
  mode: string;
  receivers: Receiver[];
}
interface Receiver {
  label: string;
  value: number;
}
interface Notification {
  notificationid: number;
  solutionid: number;
  userid: number;
  content: string;
  tenantid: number;
  txntype: string;
  referenceid: number;
  userids: number;
  referenceno: string;
  txnid: number;
  txnstatus: string;
  eventtype: string;
  modeofnotification: string;
  configuration: string;
  notes: string;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
  interval: string;
  title: string;
  deliverystatus: string;
  contenttype: string;
}

export class Controller {
  constructor() {}
  async all(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.NOTIFICATION };

    try {
      let parameters = { where: req.body };
      if (req.body.startdt && req.body.enddt) {
        parameters["where"]["createddt"] = {
          $between: [req.body.startdt, req.body.enddt],
        };
        parameters["where"] = _.omit(req.body, ["startdt", "enddt"]);
      }
      if (req.body.startdate) {
        parameters["where"]["ntfstartdate"] = {
          $gte: req.body.startdate,
        };
        parameters["where"] = _.omit(req.body, ["startdate"]);
      }
      if (req.body.enddate) {
        parameters["where"]["ntfenddate"] = {
          $lte: req.body.enddate,
        };
        parameters["where"] = _.omit(req.body, ["enddate"]);
      }
      if (_.isUndefined(req.body.status)) {
        parameters["where"]["status"] = { $ne: "Deleted" };
      }
      if (req.body.txntypes) {
        parameters["where"]["txntype"] = {
          $in: req.body.txntypes,
        };
        parameters["where"] = _.omit(parameters["where"], ["txntypes"]);
      }
      if (req.query.order as any) {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      }

      if (req.query.limit) {
        parameters["limit"] = req.query.limit;
      }
      if (req.query.offset) {
        parameters["offset"] = req.query.offset;
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["title"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["referenceno"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["referenceid"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where["$or"] = searchparams;
      }
      // DR - Filter code changes - Start
      if (req.body.date) {
        parameters["where"]["date"] = {
          $between: [req.body.date + " 00:00:00", req.body.date + " 23:59:59"],
        };
        parameters["where"] = _.omit(req.body, ["startdt", "enddt"]);
      }
      if (req.body.ntftype) {
        parameters["where"]["eventtype"] = {
          $like: "%" + req.body.ntftype + "%",
        };
        parameters["where"] = _.omit(parameters["where"], ["ntftype"]);
      }
      parameters.where = _.omit(parameters.where, [
        "searchText",
        "headers",
        "date",
      ]);
      // DR - Filter code changes - End
      if (req.body.userids) {
        parameters.where["userids"] = { $like: "%" + req.body.userids + "%" };
        delete parameters.where["userid"];
        // parameters.where['userids'] = { $like: '%' + req.body.userids + '%' }
      }
      if (req.body.notificationstatus) {
        parameters["where"]["txnstatus"] = { $in: req.body.notificationstatus };
      }
      if (req.body.configurations) {
        const configurationValue = req.body.configurations.map(value => `"${value}"`);
        parameters["where"]["configuration"] = { $in: configurationValue };
      }
      parameters.where = _.omit(parameters.where, [
        "order",
        "notificationstatus",
        "configurations",
        "headers",
      ]);
      let query = `(SELECT
        GROUP_CONCAT(SUBSTRING_INDEX(SUBSTRING_INDEX(url, '/', 3), '//', -1) SEPARATOR ',') as domain
      FROM
        tbl_monitoring_syntheticdtl tms
      WHERE
        instancerefid = '${req.body.referenceid}'
        AND status = "Active"
        AND tenantid = '${req.body.tenantid}'
      GROUP BY
        instancerefid
      )`;
      let params = {
        replacements: req.body,
        type: db.sequelize.QueryTypes.SELECT,
      } as any;
      if (req.body.referenceid) {
        let result = await CommonService.executeQuery(
          query,
          params,
          db.sequelize
        );
        let urls = result.length > 0 ? result[0].domain.split(",") : [];
        parameters["where"]["referenceid"] = {
          [sequelize.Op.in]: [...urls, req.body.referenceid],
        };
      }

      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.notification)
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
      } else {
        CommonService.getAllList(parameters, db.notification)
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
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  byId(req: Request, res: Response): void {
    let response = { reference: modules.NOTIFICATION };
    try {
      CommonService.getById(req.params.id, db.notification)
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
    let response = { reference: modules.NOTIFICATION };
    try {
      CommonService.create(req.body, db.notification)
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
    let response = { reference: modules.NOTIFICATION };
    try {
      let condition = { notificationid: req.body.notificationid };
      CommonService.update(condition, req.body, db.notification)
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  updateSynthetics(req: Request, res: Response): void {
    let response = { reference: modules.NOTIFICATION };
    try {
      let condition = {
        txnid: req.params.id,
        referenceno: req.body.referenceno,
      };
      let updateObj = {
        notes: req.body.notes,
        lastupdatedby: req.body.lastupdatedby,
        lastupdateddt: new Date(),
        txnstatus: "Resolved",
      };


      CommonService.update(condition, updateObj, db.notification)
        .then(async (data: any) => {
          if (data) {
            const alert = await db.AlertConfigs.findOne({
              where: {
                id: req.params.id,
                status: "Active",
              },
              include :[
                {
                  as:"tenant",
                  model: db.Tenant,
                  required: false
                }
              ]
            });
            const alertData = JSON.parse(JSON.stringify(alert));
            const notify = await db.notification.findOne({
              where: {
                txnid: req.params.id,
                referenceno: req.body.referenceno,
                txnstatus: "Resolved",
                status: "Active",
              },
            });
            const notifyData = JSON.parse(
              JSON.stringify(notify)
            ) as Notification;

            const receivers = JSON.parse(
              alertData.ntf_receivers
            ) as AlertReceivers[];
            const emailuserIds = [];
            receivers.forEach((send) => {
              send.receivers.forEach((e) => {
                emailuserIds.push(e.value);
              });
            });
            if (emailuserIds.length > 0) {
              const usersData = await db.User.findAll({
                where: {
                  userid: {
                    [Op.in]: emailuserIds,
                  },
                  status: "Active",
                },
              });
              const url = `${process.env.WEB_URL}/notifications`;
              let users = JSON.parse(JSON.stringify(usersData));
              if (alertData.type == 'SSL Alert') {
                let servicenowemail = '';
                const lookupdata = await db.LookUp.findOne({
                  where: {
                    lookupkey: "SERVICENOW_EMAIL",
                    keyname: constants.LOOKUPKEYS.SERVICENOW_EMAIL,
                    status: constants.STATUS_ACTIVE,
                  },
                });
                const lookupdata_dtl = JSON.parse(JSON.stringify(lookupdata));
                servicenowemail = lookupdata_dtl.keyvalue;
                console.log('servicenow email found', servicenowemail)
                users = _.filter(users, function(u){ return u['email'] != servicenowemail});
              }
              let tenantName = alertData.tenant.tenantname
              let subject = `RESOLVED - ${notifyData.title} `;
              const formattedDate = moment(notifyData.lastupdateddt).format("DD-MMM-YYYY HH:mm:ss");
              const replaceValues = {
                "${tenantname}": tenantName,
                "${title}": notifyData.title,
                "${notes}": notifyData.notes,
                "${lastupdatedby}": notifyData.lastupdatedby,
                "${referenceno}": notifyData.referenceno,
                "${formattedDate}": formattedDate,
                "${url}": url,
              }
              const mjmlContent = await getTemplate(constants.TEMPLATE_REF[5], replaceValues);
              const bodyHtml = Mjml2HTML(mjmlContent).html;
              sendEmail(
                  users.map((u)=> u["email"]),
                  subject, // subject
                   bodyHtml,
                null,
                "Resolved Notifications",
                null,
                null,
                ""
              );
              
            }
          }
          customValidation.generateSuccessResponse(
            {},
            response,
            constants.RESPONSE_TYPE_UPDATE,
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

  assetNotification(req: Request, res: Response): void {
    let response = { reference: modules.NOTIFICATION };
    try {
      CommonService.getById(req.params.assetid, db.Instances)
        .then((data: any) => {
          let condition = {
            module: constants.NOTIFICATION_MODULES[4],
            event: constants.NOTIFICATION_EVENTS[9],
            tenantid: data.tenantid,
            status: constants.STATUS_ACTIVE,
          } as any;
          let dateFormat = constants.MOMENT_FORMAT[1];
          let mapObj = {
            "{{instance_name}}": data.instancename,
            "{{failed_dt}}": CommonService.formatDate(
              new Date(),
              dateFormat,
              false
            ),
          };
          NotificationService.getNotificationSetup(
            condition,
            mapObj,
            "CM - Data Collection Failure",
            "Data Collection Failure"
          );

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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  bulkResolve(req: Request, res: Response): void {
    let response = {} as any;
    try {
      const reqData = req.body;

      const query = `UPDATE tbl_tn_notifications
        SET
          txnstatus = "Resolved",
          lastupdatedby = :lastupdatedby,
          lastupdateddt = :lastupdateddt,
          notes = :notes
        WHERE
          status = "Active"
          AND tenantid = :tenantid
          AND referenceno IN (:referenceno)`;

      const params = {
        replacements: {
          tenantid: reqData.tenantid,
          lastupdatedby: reqData.lastupdatedby,
          lastupdateddt: new Date(),
          notes: reqData.notes,
          referenceno: reqData.referenceno,
        },
        type: db.sequelize.QueryTypes.UPDATE,
      };

      CommonService.executeQuery(query, params, db.sequelize)
        .then((list) => {
          customValidation.generateSuccessResponse(
            list,
            {},
            constants.RESPONSE_TYPE_UPDATE,
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

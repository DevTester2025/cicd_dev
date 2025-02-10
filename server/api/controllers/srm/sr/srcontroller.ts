import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import NotificationService from "../../../services/notification.service";
import { Op } from "sequelize";

import sendEmail from "../../../services/email";
import Mjml2HTML = require("mjml");
import * as moment from "moment";
import getTemplate from "../../../services/template.service";
import  notificationWatchListService from "../../../services/watchlist.service";
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let rolename = "";
      let parameters = {} as any;
      if (!_.isUndefined(req.body.catalogyn) && req.body.catalogyn == "Y") {
        req.body.catalogid = { $ne: null };
        req.body = _.omit(req.body, "catalogyn");
      }
      if (
        !_.isUndefined(req.body.rolename) &&
        req.body.rolename == "sales_generic"
      ) {
        rolename = req.body.rolename;
        req.body = _.omit(req.body, "rolename");
      }
      parameters = {
        order: [["lastupdateddt", "desc"]],
        where: req.body,
        include: [
          {
            model: db.srmcatalog,
            as: "catalog",
            include: [
              {
                model: db.Solutions,
                as: "solution",
              },
            ],
          },
          {
            model: db.User,
            as: "assignee",
            attributes: ["fullname", "email", "userid"],
          },
          {
            model: db.TNWorkFlow,
            as: "workflow",
            include: [
              {
                model: db.TNWorkFlowApprover,
                as: "tnapprovers",
                where: { status: constants.STATUS_ACTIVE },
              },
            ],
          },
          { model: db.User, as: "user", attributes: ["fullname", "userid"] },
          {
            model: db.Customer,
            as: "customer",
            attributes: ["customername", "customerid"],
          },
        ],
      };
      if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.srmsr)
          .then((list) => {
            let template = {
              content: AssetListTemplate,
              engine: "handlebars",
              helpers: CommonHelper,
              recipe: "html-to-xlsx",
            };

            let data = { lists: list, headers: req.body.headers };
            DownloadService.generateFile(data, template, (result) => {
              customValidation.generateSuccessResponse(
                result,
                response,
                constants.RESPONSE_TYPE_LIST,
                res,
                req
              );
            });
          })
          .catch((error: Error) => {
            console.log("Error fetching list", error);
            customValidation.generateAppError(error, response, res, req);
          });
      }
      else{
      CommonService.getAllList(parameters, db.srmsr)
        .then((list) => {
          if (rolename == "sales_generic") {
            let condition = {} as any;
            condition.where = {
              touserid: req.body.userid,
              fromuserid: { $ne: req.body.userid },
            };
            condition.include = [
              {
                model: db.srmsr,
                as: "servicerequest",
                include: parameters.include,
                where: { srvrequestid: { $ne: null } },
              },
            ];
            CommonService.getAllList(condition, db.srmsractions).then(
              (data) => {
                if (data != null && data.length != 0) {
                  if (list != null && list.length != 0) {
                    data = _.map(data, _.property("servicerequest"));
                    list = list.concat(data);
                  } else {
                    data = _.map(data, _.property("servicerequest"));
                    list = data;
                  }
                }
                customValidation.generateSuccessResponse(
                  list,
                  response,
                  constants.RESPONSE_TYPE_LIST,
                  res,
                  req
                );
              }
            );
          } else {
            customValidation.generateSuccessResponse(
              list,
              response,
              constants.RESPONSE_TYPE_LIST,
              res,
              req
            );
          }
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
    let response = {};
    try {
      let query = {} as any;
      query.where = {
        srvrequestid: req.params.id,
      };

      query.include = [
        {
          model: db.srmcatalog,
          as: "catalog",
          required: false,
          paranoid: false,
          include: [
            {
              model: db.Solutions,
              as: "solution",
              include: [
                {
                  model: db.Customer,
                  as: "client",
                  required: false,
                  paranoid: false,
                },
              ],
            },
            { model: db.LookUp, as: "group" },
            {
              model: db.srmcatalogaprvr,
              as: "srmcatalogaprvr",
              required: false,
              paranoid: false,
              include: [
                {
                  model: db.User,
                  as: "approver",
                  required: false,
                  paranoid: false,
                  attributes: ["fullname", "email", "userid"],
                },
              ],
            },
          ],
        },
        {
          model: db.User,
          as: "assignee",
          attributes: ["fullname", "email", "userid"],
        },
        {
          model: db.User,
          as: "reportee",
          attributes: ["fullname", "email", "userid"],
        },
        {
          model: db.TNWorkFlow,
          as: "workflow",
          include: [
            {
              model: db.TNWorkFlowApprover,
              as: "tnapprovers",
              where: {
                status: constants.STATUS_ACTIVE,
                reqid: req.params.id,
              },
              include:  [
                {
                  model: db.User,
                  as: "approvers",
                  required: false,
                  paranoid: false,
                  attributes: ["fullname", "email", "userid"],
                },
              ],
            },
          ],
        },
        {
          model: db.UpgradeRequest,
          as: "resizerequest",
          required: false,
          paranoid: false,
          include: [
            {
              model: db.Tenant,
              as: "tenant",
              attributes: ["tenantname"],
            },
            {
              model: db.Instances,
              as: "instance",
              attributes: [
                "instancename",
                "cloudprovider",
                "region",
                "instancerefid",
                "instanceid",
              ],
            },
            {
              model: db.MaintWindow,
              as: "maintwindow",
              attributes: ["startdate", "enddate"],
            },
            {
              model: db.CostVisual,
              as: "upgradeplan",
              attributes: [
                "unit",
                "plantype",
                "priceperunit",
                "currency",
                "pricingmodel",
              ],
              required: false,
            },
            {
              model: db.CostVisual,
              as: "currentplan",
              attributes: [
                "unit",
                "plantype",
                "priceperunit",
                "currency",
                "pricingmodel",
              ],
              required: false,
            },
          ],
        },
        {
          model: db.schedulerequest,
          as: "schedulerequest",
          required: false,
          paranoid: false,
          include: [
            {
              model: db.Tenant,
              as: "tenant",
              attributes: ["tenantname"],
            },
            {
              model: db.Instances,
              as: "instance",
              attributes: [
                "instancename",
                "cloudprovider",
                "region",
                "instancerefid",
                "instanceid",
              ],
            },
            {
              model: db.schedulerequestdetail,
              as: "requestdetails",
              include: [
                {
                  model: db.CostVisual,
                  as: "upgradeplan",
                  attributes: [
                    "unit",
                    "plantype",
                    "priceperunit",
                    "currency",
                    "pricingmodel",
                  ],
                  required: false,
                },
              ],
            },
          ],
        },
        {
          model: db.LookUp,
          as: "departments",
          attributes: ["lookupkey", "keyname", "keyvalue", "lookupid"],
        },
        {
          model: db.Customer,
          as: "customer",
          required: false,
          paranoid: false,
        },
        {
          model: db.srmsractions,
          as: "srmsractions",
          include: [
            {
              model: db.User,
              as: "touser",
              required: false,
              paranoid: false,
              attributes: ["fullname", "email", "userid"],
            },
          ],
        },
        {
          model: db.ContactPoints,
          as: "contactdata",
          required: false,
          paranoid: false,
        },
        {
          model: db.WatchList,
          as: "notificationwatchlistSRM",
          required: false,
          where: { refid: req.params.id, status: constants.STATUS_ACTIVE },
          include: [
            {
              model: db.notificationsetup,
              as: 'notificationSetup',
              required: false,
              include: [
                {
                  model: db.Templates,
                  as: 'templates',
                  required: false
                }
              ]
            }
          ],
        }
      ];
      CommonService.getData(query, db.srmsr)
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

  async create(req: Request, res: Response): Promise<void> {
    let response = {};
    try {
      let query = {} as any;
      query.include = [
        // { model: db.srmsractions, as: "srmsractions" },
        { model: db.ContactPoints, as: "contactdata" },
        { model: db.TNWorkFlowApprover, as: "workflowApprovers" }
      ];
      let approvers = await db.TNWorkFlowApprover.findAll({
        where: {
          status: constants.STATUS_ACTIVE,
          wrkflowid: req.body.wrkflowid,
          reqid: null,
        },
        attributes: [
          "wrkflowaprvrid",
          "approvalstatus",
          "userid",
          "aprvrseqid",
        ],
      });
      let workflowApprovers :any[]= [];
      let data = JSON.parse(JSON.stringify(approvers));
      data.map((itm: any) => {
        let obj = {} as any;
        obj.createddt = new Date();
        obj.lastupdateddt = new Date();
        obj.reqid = req.body.srvrequestid;
        obj.createdby = req.body.createdby;
        obj.lastupdatedby = req.body.lastupdatedby;
        obj.userid = itm.userid;
        obj.wrkflowid = req.body.wrkflowid;
        obj.aprvrseqid = itm.aprvrseqid;
        obj.approvalstatus = constants.STATUS_PENDING;
        workflowApprovers.push(obj);
        return itm;
      });

      req.body.workflowApprovers = workflowApprovers;
      CommonService.saveWithAssociation(req.body, query, db.srmsr)
        .then(async (data: any) => {
          if (data) {
            const receivermail = JSON.parse(JSON.stringify(data));
            const userId = receivermail.workflowApprovers.map(
              (approver) => approver.userid
            );
            try {
              notificationWatchListService.createWatchListSRM(req.body.ntfcsetupid, data);
           } catch(error) {
             console.log("Error getting notification details", error)
           };
            const tenantData: any = db.Tenant.findOne({
              where: { tenantid: receivermail.tenantid },
            }).then((tenantName)=>{
              return tenantName.dataValues;
            })

            const emailId = [];

            userId.forEach((userId) => {
              emailId.push(userId);
            });

            db.Tenant.findOne({
              where: { tenantid: receivermail.tenantid },
            })
              .then(async (tenantData: any) => {
              const tenantname = tenantData.tenantname;

              if (emailId.length > 0) {
                const usersData = await db.User.findAll({
                  where: {
                    userid: {
                      [Op.in]: emailId,
                    },
                    status: constants.STATUS_ACTIVE,
                  },
                });

                const users = JSON.parse(JSON.stringify(usersData));
                let url = constants.INBOXPATH.VIEW_REQUEST.replace(
                  ":id",
                  receivermail.srvrequestid
                );
                let msg = `Click the button to view your request`;
                let button_txt = `<mj-button background-color="rgb(170, 187, 17)" color="white" align="center" font-weight="bold" font-size="15px" href="${url}" font-family="Helvetica Neue, Arial, sans-serif">View Request</mj-button>`;
                const formattedDate = moment(receivermail.requestdate).format(
                  "YYYY-MM-DD"
                );
                const replaceValues = {
                  "${tenantname}": tenantname,
                  "${type}": receivermail.requesttype,
                  "${subject}": receivermail.subject,
                  "${priority}": receivermail.priority,
                  "${referenceno}": receivermail.referenceno,
                  "${createddt}": formattedDate,
                  "${customer_notes}": receivermail.notes,
                  "${srstatus}": receivermail.srstatus,
                  "${msg}": msg,
                  "${button_txt}": button_txt,
                };
                const emailContent = await getTemplate(
                  constants.TEMPLATE_REF[6],
                  replaceValues
                );
                const bodyHtml = Mjml2HTML(emailContent).html;
                sendEmail(
                  users.map((u) => u["email"]),
                  `Request Email`,
                  bodyHtml,
                  null,
                  "New mail",
                  null,
                  null,
                  ""
                );
              }
          })
            // if (req.body.requestList && req.body.requestList.length > 0) {
            //   let reqType;
            //   for (var e of req.body.requestList) {
            //     reqType = e.upgraderequestid ? "resize" : "schedule";
            //     e.srvrequestid = data.srvrequestid;
            //   }
            //   if (reqType && reqType == "resize") {
            //     CommonService.bulkUpdate(
            //       req.body.requestList,
            //       ["srvrequestid", "reqstatus", "lastupdatedby", "lastupdateddt"],
            //       db.UpgradeRequest
            //     ).then((data1) => {
            //       customValidation.generateSuccessResponse(
            //         data,
            //         response,
            //         constants.RESPONSE_TYPE_SAVE,
            //         res,
            //         req
            //       );
            //     });
            //   } else {
            //     CommonService.bulkUpdate(
            //       req.body.requestList,
            //       ["srvrequestid", "reqstatus", "lastupdatedby", "lastupdateddt"],
            //       db.schedulerequest
            //     ).then((data1) => {
            //       customValidation.generateSuccessResponse(
            //         data,
            //         response,
            //         constants.RESPONSE_TYPE_SAVE,
            //         res,
            //         req
            //       );
            //     });
            //   }
            // } else {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
            // }
            // let condition = {
            //   module: constants.NOTIFICATION_MODULES[6],
            //   event: constants.NOTIFICATION_EVENTS[0],
            //   tenantid: req.body.tenantid,
            //   status: constants.STATUS_ACTIVE,
            // } as any;
            // let dateFormat = constants.MOMENT_FORMAT[1];
            // let mapObj = {
            //   "{{sr_name}}": data.subject,
            //   "{{created_by}}": data.createdby,
            //   "{{created_dt}}": CommonService.formatDate(
            //     new Date(data.createddt),
            //     dateFormat,
            //     false
            //   ),
            // };
            // NotificationService.getNotificationSetup(
            //   condition,
            //   mapObj,
            //   "CM - Service Request Created",
            //   "Service Request Created"
            // );
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
          
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    const { approve } = req.query;
    let response = {};
    try {
      let condition = { srvrequestid: req.body.srvrequestid };
      CommonService.update(condition, req.body, db.srmsr)
        .then((data) => {
          // if (!customValidation.isEmptyValue(req.body.srmsractions)) {
          //   let options = [
          //     "fromuserid",
          //     "touserid",
          //     "duedate",
          //     "srstatus",
          //     "apprvstatus",
          //     "notes",
          //     "lastupdatedby",
          //     "lastupdateddt",
          //   ];
          //   CommonService.bulkUpdate(
          //     req.body.srmsractions,
          //     options,
          //     db.srmsractions
          //   )
          //     .then((data) => {
          //       let srobj = req.body.srmsractions[0];
          //       let event;
          //       if (srobj.apprvstatus == "Approved") {
          //         event = constants.NOTIFICATION_EVENTS[4];
          //       }
          //       if (event) {
          //         let condition = {
          //           module: constants.NOTIFICATION_MODULES[6],
          //           event: event,
          //           tenantid: req.body.tenantid,
          //           status: constants.STATUS_ACTIVE,
          //         } as any;
          //         let dateFormat = constants.MOMENT_FORMAT[1];
          //         let mapObj = {
          //           "{{sr_name}}": data.subject,
          //           "{{rejected_by}}": data.lastupdatedby,
          //           "{{rejected_dt}}": CommonService.formatDate(
          //             new Date(data.lastupdateddt),
          //             dateFormat,
          //             false
          //           ),
          //           "{{approved_by}}": data.lastupdatedby,
          //           "{{approved_dt}}": CommonService.formatDate(
          //             new Date(data.lastupdateddt),
          //             dateFormat,
          //             false
          //           ),
          //         };
          //         NotificationService.getNotificationSetup(
          //           condition,
          //           mapObj,
          //           "CM - Service Request Created",
          //           "Service Request Created"
          //         );
          //       }
          //     })
          //     .catch((error: Error) => {
          //       customValidation.generateAppError(error, response, res, req);
          //     });
          // }
          try {
             notificationWatchListService.createWatchListSRM( req.body.ntfcsetupid, data);
          }catch (error) {
            console.log("Error getting notification details", error);
          }
          if (approve) {
            const receivermail = JSON.parse(JSON.stringify(data));
            const userId = receivermail.assignedto;
            const emailId = userId;

            if (emailId) {
              db.Tenant.findOne({
                where: { tenantid: receivermail.tenantid },
              })
                .then((tenantData: any) => {
                const tenantname = tenantData.tenantname;
                const usersData = db.User.findOne({
                  where: {
                    userid: emailId,
                    status: constants.STATUS_ACTIVE,
                  },
                })
                  .then(async (data: any) => {
                    const formattedDate = moment(
                      receivermail.requestdate
                    ).format("YYYY-MM-DD");
                    let url = constants.INBOXPATH.VIEW_REQUEST.replace(
                      ":id",
                      receivermail.srvrequestid
                    );
                    
                    let msg = `Above request has been approved, with selected ${receivermail.requesttype} type</mj-text><mj-text  align="center" font-size="14px" color="#000" font-family="Helvetica Neue, Arial, sans-serif"> Please proceed for execution.`;
                    let button_txt = `<mj-button background-color="rgb(170, 187, 17)" color="white" align="center" font-weight="bold" font-size="15px" href="${url}" font-family="Helvetica Neue, Arial, sans-serif">View Request</mj-button>`;
                    const replaceValues = {
                      "${tenantname}": tenantname,
                      "${type}": receivermail.requesttype,
                      "${subject}": receivermail.subject,
                      "${priority}": receivermail.priority,
                      "${referenceno}": receivermail.referenceno,
                      "${createddt}": formattedDate,
                      "${customer_notes}": receivermail.notes,
                      "${srstatus}": receivermail.srstatus,
                      "${msg}": msg,
                      "${button_txt}": button_txt,
                    };
                    const emailContent = await getTemplate(
                      constants.TEMPLATE_REF[6],
                      replaceValues
                    );
                    const bodyHtml = Mjml2HTML(emailContent).html;
                    sendEmail(
                      data.email,
                      `Request approved mail`,
                      bodyHtml,
                      null,
                      "New mail",
                      null,
                      null,
                      ""
                    );
                  })
                  .catch((error: Error) => {
                    console.log("error", error);
                  });
              });
            }
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  count(req: Request, res: Response): void {
    let response = {};
    try {
      let rolename = "";
      let query = {} as any;
      if (
        !_.isUndefined(req.body.rolename) &&
        req.body.rolename == "sales_generic"
      ) {
        rolename = req.body.rolename;
        req.body = _.omit(req.body, "rolename");
      }

      if (rolename !== "sales_generic") {
        query = {
          where: {
            ...req.body,  
            srstatus: { $in: ['Pending', 'Approved', 'Work In Progress'] } 
          }
        };
      } else {
        query = { where: { ...req.body } };
      }
      CommonService.getCount(query, db.srmsr)
        .then((data: any) => {
          if (rolename === "sales_generic") {
            let condition = {} as any;
            condition.where = {
              touserid: req.body.userid,
              fromuserid: { $ne: req.body.userid },
            };
            condition.include = [
              {
                model: db.srmsr,
                as: "servicerequest",
                where: { srvrequestid: { $ne: null }, srstatus: "Pending" },
              },
            ];
            CommonService.getCount(condition, db.srmsractions).then(
              (count: any) => {
                data = data + count;
                customValidation.generateSuccessResponse(
                  data,
                  response,
                  constants.RESPONSE_TYPE_LIST,
                  res,
                  req
                );
              }
            );
          } else {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_LIST,
              res,
              req
            );
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

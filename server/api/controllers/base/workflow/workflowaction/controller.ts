import { constants } from "../../../../../common/constants";
import { customValidation } from "../../../../../common/validation/customValidation";
import db from "../../../../models/model";
import CommonService from "../../../../services/common.service";
import { Request, Response } from "express";
import {
  WorkflowService,
  iContentConfig,
} from "../../../../services/workflow.service";
import * as _ from "lodash";
interface User {
  userid: number;
  tenantid: number;
  customerid: number;
  password: string;
  fullname: string;
  email: string;
  phone: string;
  secondaryphoneno: string;
  department: string;
  isapproveryn: string;
  lastlogin: Date;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
  roleid: number;
}
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body } as any;
      CommonService.getAllList(parameters, db.TNWorkFlowAction)
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

  byId(req: any, res: Response): void {
    let response = {};
    try {
      CommonService.getById(req.params.id, db.TNWorkFlowAction)
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
      CommonService.create(req.body, db.TNWorkFlowAction)
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
      let condition = { actionsid: req.body.actionsid };
      CommonService.getById(req.body.actionsid, db.TNWorkFlowAction)
      .then((actionresponse) => {
        const actionDetails = JSON.parse(JSON.stringify(actionresponse));
          CommonService.update(condition, req.body, db.TNWorkFlowAction)
          .then(async (data) => {
            const actionDetailsUpdated = JSON.parse(JSON.stringify(data));
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
            let userids=[];
            userids.push(actionDetailsUpdated.fromuserid);
            userids.push(actionDetailsUpdated.touserid);
            const usersInstance = await db.User.findAll({
              where: {
                userid: { $in: userids },
                status: "Active",
              },
            });
            const users: User[] = JSON.parse(JSON.stringify(usersInstance));
            let owner = _.find(users, (u) => {
              return u.userid == actionDetailsUpdated.fromuserid;
            });
            let approver = _.find(users, (u) => {
              return u.userid == actionDetailsUpdated.touserid;
            });
            let replace_rowcontent = "";
            let replace_content = `<mj-section background-color="white">
              <mj-column>
                <mj-table>
                  <tr style="border:1px solid #ecedee;text-align:left;background:#c0e2f1;color:black">
                    <th style="padding: 7px 17px;">Level</th>
                    <th style="padding: 7px 17px;">Approver</th>
                    <th style="padding: 7px 17px;">Status</th>
                    <th style="padding: 7px 17px;">Note</th>
                  </tr>
                  {{rowcontent}}
                </mj-table>
              </mj-column>
            </mj-section>`;
            replace_rowcontent += `<tr style="border:1px solid #ecedee;text-align:left;background:#e5f3f9;color:black">
              <td style="padding: 7px 17px;">${actionDetailsUpdated.approverlevel}</td>
              <td style="padding: 7px 17px;">${owner.fullname}</td>
              <td style="padding: 7px 17px;">${actionDetailsUpdated.workflow_status}</td>
              <td style="padding: 7px 17px;">${actionDetailsUpdated.note || '' }</td>
            </tr>`;
            replace_content=replace_content.replace("{{rowcontent}}", replace_rowcontent);
              let title="Workpack - Status has been updated.";
              let toMail = [];
              toMail.push(owner.email);
              toMail.push(approver.email);
              let encoded_url=encodeURIComponent(`${process.env.WEB_URL}/workpackmanager/edittemplate?resource=${actionDetailsUpdated.resourceid}&srcfrom=email`);
              let maincontentConfig: iContentConfig = {
                o_from_status : actionDetails.workflow_status,
                o_to_status :actionDetailsUpdated.workflow_status,
                subject:title,
                actiontype:"status_update",
                // fromMail: "saravanakumar@cloudmatiq.com",
                toMail: toMail,
                o_title: title,
                o_inner_title: actionDetailsUpdated.resource_title || "",
                o_breadscrumList:[
                  {
                    label : "CM",
                    link : process.env.WEB_URL,
                  },
                  {
                    label : "Workpack Manager",
                    link : process.env.WEB_URL+"/workpackmanager",
                  },
                  {
                    label : "Workpack Template",
                    link : process.env.WEB_URL+"/workpackmanager",
                  }
                ],
                o_updatedby: actionDetailsUpdated.lastupdatedby,
                o_redirect_link:`${process.env.WEB_URL}/common-redirect?redirecturl=${encoded_url}`
              };
              let workflowService = new WorkflowService(maincontentConfig);
              workflowService.sendworkflowMail(replace_content);
              db.notification.bulkCreate(
                users.map((u) => {
                  return {
                    userid: u.userid,
                    content: workflowService.buildHtmlcontent(replace_content),
                    contenttype:"Email",
                    tenantid: u.tenantid,
                    eventtype : "Workflow Notification",
                    title : title,
                    deliverystatus: "SENT",
                    modeofnotification: "EMAIL",
                    configuration: "",
                    notes : title + " - " +actionDetails.workflow_status + " to " + actionDetailsUpdated.workflow_status,
                    status: "Active",
                    createdby: "-",
                    createddt: new Date(),
                    lastupdatedby: "-",
                    lastupdateddt: new Date(),
                    interval: null,
                  };
                }))
          })
          
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      }).catch((error: Error) => {
        customValidation.generateAppError(error, response, res, req);
      });

    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  bulkCreate(req: Request, res: Response): void {
    let response = {};
    let operation = req.body.operation;
    try {
      if (operation) {
        delete req.body.operation;
      }
      CommonService.bulkCreate(req.body, db.TNWorkFlowAction)
        .then(async (data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
          let o_title = "";
          const actionDetailsUpdated = JSON.parse(JSON.stringify(data));
          if (req.body.length > 0) {
            let receivers = _.map(_.cloneDeep(req.body), (b) => {
              return b.touserid;
            });
            receivers.push(req.body[0]["fromuserid"]);
            const usersInstance = await db.User.findAll({
              where: {
                userid: { $in: receivers },
                status: "Active",
              },
            });
            const users: User[] = JSON.parse(JSON.stringify(usersInstance));
            let owner = _.find(users, (u) => {
              return u.userid == req.body[0]["fromuserid"];
            });
            let approver = _.find(users, (u) => {
              return u.userid == req.body["touserid"];
            });
            let approverData = [];
            let toMail = [];
            _.each(_.cloneDeep(req.body), (b) => {
              let wp_user = _.find(users, (u) => {
                toMail.push(u.email);
                return u.userid == b["touserid"];
              });
              b.touser = wp_user;
              approverData.push(b);
            });
            let replace_rowcontent = "";
            let replace_content = `<mj-section background-color="white">
            <mj-column>
              <mj-table>
                <tr style="border:1px solid #ecedee;text-align:left;background:#c0e2f1;color:black">
                  <th style="padding: 7px 17px;">Level</th>
                  <th style="padding: 7px 17px;">Approver</th>
                  <th style="padding: 7px 17px;">Status</th>
                  <th style="padding: 7px 17px;">Note</th>
                </tr>
                {{rowcontent}}
              </mj-table>
            </mj-column>
          </mj-section>`;
            _.each(approverData, (r) => {
              replace_rowcontent += `<tr style="border:1px solid #ecedee;text-align:left;background:#e5f3f9;color:black">
            <td style="padding: 7px 17px;">${r.approverlevel}</td>
            <td style="padding: 7px 17px;">${r.touser.fullname}</td>
            <td style="padding: 7px 17px;">${r.workflow_status}</td>
            <td style="padding: 7px 17px;">${r.note || '' }</td>
          </tr>`;
            });
            replace_content=replace_content.replace("{{rowcontent}}", replace_rowcontent);
            let title="Workpack - Approver(s) added";
            let encoded_url=encodeURIComponent(`${process.env.WEB_URL}/workpackmanager/edittemplate?resource=${req.body[0].resourceid}&srcfrom=email`);
            let maincontentConfig: iContentConfig = {
              subject:title,
              actiontype:req.body[0].actiontype,
              // fromMail: "saravanakumar@cloudmatiq.com",
              toMail: toMail,
              o_title: title,
              o_inner_title: req.body[0].resource_title || "",
              o_breadscrumList:[
                {
                  label : "CM",
                  link : process.env.WEB_URL,
                },
                {
                  label : "Workpack Manager",
                  link : process.env.WEB_URL+"/workpackmanager",
                },
                {
                  label : "Workpack Template",
                  link : process.env.WEB_URL+"/workpackmanager",
                }
              ],
              o_updatedby: req.body.lastupdatedby,
              o_redirect_link:`${process.env.WEB_URL}/common-redirect?redirecturl=${encoded_url}`
            };
            let workflowService = new WorkflowService(maincontentConfig);
            workflowService.sendworkflowMail(replace_content);
              await db.notification.bulkCreate(
                users.map((u) => {
                  return {
                    userid: u.userid,
                    content: workflowService.buildHtmlcontent(replace_content),
                    contenttype:"Email",
                    tenantid: u.tenantid,
                    eventtype : "Workflow Notification",
                    title : title,
                    deliverystatus: "SENT",
                    modeofnotification: "EMAIL",
                    configuration: "",
                    notes : title ,
                    status: "Active",
                    createdby: "-",
                    createddt: new Date(),
                    lastupdatedby: "-",
                    lastupdateddt: new Date(),
                    interval: null,
                  };
                }))
            if(owner){
              maincontentConfig.toMail=[];
            maincontentConfig.toMail.push(owner.email);
            maincontentConfig.subject="Workpack - Status updated";
            workflowService.sendworkflowMail(replace_content);
            }
            
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  bulkUpdate(req: Request, res: Response): void {
    let response = { };
    try {
      let updateattributes = [
        "actionsid",
        "status",
        "createdby",
        "createddt",
        "lastupdatedby",
        "lastupdateddt",
      ];
      CommonService.bulkUpdate(req.body, updateattributes, db.TNWorkFlowAction)
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
}
export default new Controller();

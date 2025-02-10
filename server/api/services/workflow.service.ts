import axios from "axios";
import Mjml2HTML = require("mjml");
import * as AWS from "aws-sdk";
import _ = require("lodash");
import db from "../models/model";
import { constants } from "../../common/constants";
import CommonService from "./common.service";
import sendMail from "./email";
export interface iContentConfig{
  actiontype:string;
  subject?:string;
  fromMail?:string;
  toMail?:any[];
  o_title ?: string;
  o_updatedby ?: string;
  o_breadscrumList ?: any[];
  o_breadscrum ?: string;
  o_inner_title ?: string;
  o_from_status ?: string;
  o_to_status ?: string;
  o_redirect_link ?: string;
}

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

export class WorkflowService {
  contentConfig:iContentConfig;
  constructor(contentConfig?:iContentConfig) {
    this.contentConfig=contentConfig;
  }


  async sendworkflowMail(replace_content){
    const htmlContent = this.buildHtmlcontent(replace_content);
    sendMail(
      this.contentConfig.toMail,
      this.contentConfig.subject,
      htmlContent,
      "",-
      "",
      "",
      "",
      ""
    )
    // await this.AWS_SES.sendEmail({
    //   Source: process.env.NOREPLY_MAIL,
    //   Destination: {
    //     ToAddresses: this.contentConfig.toMail,
    //   },
    //   ReplyToAddresses: [],
    //   Message: {
    //     Body: {
    //       Html: {
    //         Charset: "UTF-8",
    //         Data: htmlContent,
    //       },
    //     },
    //     Subject: {
    //       Charset: "UTF-8",
    //       Data: this.contentConfig.subject || "ESKO Updates",
    //     },
    //   },
    // }).promise();
  }
    buildHtmlcontent(replace_content){
        let title = this.contentConfig.o_title||"Status has been changed";
        let updatedby=this.contentConfig.o_updatedby || "Kumar";
        let breadscrum=this.contentConfig.o_breadscrum || "";
        let inner_title=this.contentConfig.o_inner_title || '-';
        let from_status=this.contentConfig.o_from_status || 'Inprogress';
        let to_status=this.contentConfig.o_to_status || 'Completed';
        let redirect_link=this.contentConfig.o_redirect_link || '';
        if(this.contentConfig.o_breadscrumList.length > 0){
          breadscrum = `<mj-table><tr>`;
          _.each(this.contentConfig.o_breadscrumList,(breadlist)=>{
            breadscrum += `<td width="75px">
            <mj-text align="center">
              > <a href="${breadlist.link}" target="_blank" color="black">${breadlist.label}</a>
            </mj-text>
            </td>`;
          });
          breadscrum += `</tr></mj-table>`;
        }
        let template=`<mjml>
        <mj-body>
          <mj-section background-color="rgb(170, 187, 17)">
            <mj-column>
              <mj-text font-size="20px" align="center" color="white">ESKO</mj-text>
              <mj-text font-size="18px" align="center" font-weight="bold" color="white">${title}</mj-text>
              <mj-text font-size="15px" align="center" color="#ddd">By ${updatedby}</mj-text>
            </mj-column>
          </mj-section>
          <mj-section background-color="#fafafa">
            <mj-column>
            ${breadscrum}
              <mj-text align="center">${inner_title }</mj-text>
            </mj-column>
          </mj-section>
          {{internal_replace}}
          {{external_replace}}
          <mj-section background-color="#fafafa">
            <mj-column width="100%">
              <mj-button background-color="#e3ecdc" color="#fff" align="center">
              <a href="${redirect_link}" target="_blank" color="#fff">Open in browser</a>
              </mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>`;
      let internal_replace=`<mj-section background-color="#fafafa">
      <mj-column width="40%">
        <mj-button background-color="#DDD" align="right">${from_status}</mj-button>
      </mj-column>
      <mj-column width="20%">
        <mj-text padding-top="20px" align="center">To</mj-text>
      </mj-column>
      <mj-column width="40%">
        <mj-button background-color="#fcc245" align="left">${to_status}</mj-button>
      </mj-column>
      
    </mj-section>`;
        switch (this.contentConfig.actiontype) {
          case "status_update":
            template=template.replace("{{internal_replace}}",internal_replace)
            break;
            case "workpack-asignee":
            break;
          default:
            break;
        }
      if(replace_content){
        template=template.replace("{{external_replace}}",replace_content)
      }
      return Mjml2HTML(template, {
        keepComments: false,
      }).html;
    }
  async  sendCommentsNotification(resourceid,commentsData:any,mode:string){
    // let resourceid = req.resourceid
    let parameters = { where: {} } as any;
    parameters["where"]={
      status : constants.STATUS_ACTIVE,
      resourceid : resourceid
    }
    let receivers:any[]=[];
    let actionDetailsUpdated:any[] = await CommonService.getAllList(parameters, db.TNWorkFlowAction);
      if(actionDetailsUpdated.length > 0){
        receivers = _.map(_.cloneDeep(actionDetailsUpdated), (b) => {
          return b.touserid;
        });

        receivers.push(actionDetailsUpdated[0]["fromuserid"]);
      }
        // watch list 
        let txnRes = await CommonService.getAllList(
          {
            where: { 
              refkey : resourceid,
              module : constants.CMDB_OPERATIONTYPE[7],
              status:constants.STATUS_ACTIVE
             }
          },
          db.TxnRefModel
        );
        let txnrefList = JSON.parse(JSON.stringify(txnRes));
        _.each(_.cloneDeep(txnrefList),(t:any)=>{
          receivers.push(t.txn);
        });

        if(receivers.length > 0){
        const usersInstance = await db.User.findAll({
          where: {
            userid: { $in: receivers },
            status: "Active",
          },
        });

        const users: User[] = JSON.parse(JSON.stringify(usersInstance));
            
            let approverData = [];
            let toMail = [];
            _.each(_.cloneDeep(actionDetailsUpdated), (b) => {
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
            {{generalContent}}
            </mj-column>
            </mj-section>
            <mj-section background-color="white">
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
            let title="Workpack - Remarks/Observations Updated";
            let generalContent = ``;
            if(mode == "comments"){
              generalContent = `
            <mj-column>
              <mj-table>
                <tr>
                  <td colspan="2">${commentsData.comment}</rd>
                </tr>
                <tr>
                  <td style="text-align:left;color:#dddd">${commentsData.createdby}</td>
                  <td style="text-align:right;color:#dddd">${commentsData.createddt}</td>
                </tr>
              </mj-table>
            </mj-column>
              `;
            }
            else if(mode == "field-updates"){
              title="Workpack - content Updated";
              let swapcontent=``;
              _.each(commentsData,(ud)=>{
                swapcontent +=`<tr>
                  <td>
                  ${ud.affectedattribute}
                  </td>
                  <td>
                  ${ud.old}
                  </td>
                  <td>
                  ${ud.new}
                  </td>
                </tr>
                <tr colspan="3">
                Updated by : ${ud.lastupdatedby} - ${ud.lastupdateddt}
                </tr>`;
              });
              generalContent = `
                <mj-column>
                  <mj-table>
                  <tr>
                    <th>Field</th>
                    <th>Old Value</th>
                    <th>New value</th>
                  </tr>
                  ${swapcontent}
                  </mj-table>
                </mj-column>
              `;
            }
            replace_content=replace_content.replace("{{rowcontent}}", replace_rowcontent);
            replace_content=replace_content.replace("{{generalContent}}", generalContent);
            
            
            
            let encoded_url="";
            if(actionDetailsUpdated.length > 0){
              encodeURIComponent(`${process.env.WEB_URL}/workpackmanager/edittemplate?resource=${actionDetailsUpdated[0].resourceid}&srcfrom=email`);
            let maincontentConfig: iContentConfig = {
              subject:title,
              actiontype:actionDetailsUpdated[0].actiontype,
              // fromMail: "saravanakumar@cloudmatiq.com",
              toMail: toMail,
              o_title: title,
              o_inner_title: actionDetailsUpdated[0].resource_title || "",
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
              o_updatedby: actionDetailsUpdated[0].lastupdatedby,
              o_redirect_link:`${process.env.WEB_URL}/common-redirect?redirecturl=${encoded_url}`
            };
            this.contentConfig = maincontentConfig;
          }
            this.sendworkflowMail(replace_content);
      }
    let userids=[];
    return true;
  }
  async createWorkflowRelations(relationDtl:any) :Promise<any>{
    return await CommonService.create(relationDtl,db.TNWorkflowRelations);
  }
}
export default new WorkflowService();
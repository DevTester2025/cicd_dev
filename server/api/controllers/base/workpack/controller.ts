import { constants } from "../../../../common/constants";
import { customValidation } from "../../../../common/validation/customValidation";
import db from "../../../models/model";
import CommonService from "../../../services/common.service";
import { Request, Response } from "express";
import * as _ from "lodash";
import { CommonHelper, ReportTemplates } from "../../../../reports";
import DownloadService from "../../../services/download.service";
import { modules } from "../../../../common/module";
import assetController from "../../../controllers/base/assetrecords/controller";
import sequelize = require("sequelize");
import {
  WorkflowService,
  iContentConfig,
} from "../../../services/workflow.service";

import * as moment from "moment";
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
  constructor() { }
  async download(req: Request, res: Response): Promise<void> {
    //Reusable functions
    const getReferenceValue = (field: any, detail: any): string => {
      try {
        const jsonVal = JSON.parse(detail[field.fieldname]);
        return jsonVal.map(d => d.name || Object.keys(d).map(key => d[key])[0]).join(", ");
      } catch {
        return "";
      }
    };

    function getUniqueRefKeys(data, key) {
      const uniqueRefKeys = new Set(data.map(item => item[key]));
      return Array.from(uniqueRefKeys);
    }
    function sortByFieldValueDesc(data) {
      return data.sort((a, b) => {
        const aKeyObj = a.find(item => item.fieldname === 'Key');
        const bKeyObj = b.find(item => item.fieldname === 'Key');
        let aKeyVal = aKeyObj["fieldvalue"].split("Key")[1];
        let bKeyVal = bKeyObj["fieldvalue"].split("Key")[1];
        if (aKeyObj && bKeyObj) {
          return aKeyVal - bKeyVal;
        }
        if (!aKeyObj) return -1;
        if (!bKeyObj) return -1;
        return 0;
      });
    }
    function groupByKey(array, key) {
      return array.reduce((acc, item: any) => {
        const data = item[key];
        if (!acc[data]) {
          acc[data] = [];
        }
        acc[data].push(item);
        return acc;
      }, {});
    }
    // Declare Variables
    const { tenantid, resourceid } = req.body;
    const crn = resourceid.split("/")[0];

    // get template header/details
    const [assetData, workflowActions] = await Promise.all([
      db.AssetsHdr.findAll({
        where: { status: "Active", crn, tenantid }
      }),
      db.TNWorkFlowAction.findAll({
        where: { status: "Active", tenantid, resourceid },
        include: [
          { model: db.User, as: "fromuser", required: false, paranoid: false },
          { model: db.User, as: "touser", required: false, paranoid: false },
        ],
      }),
    ]);

    let main_workflowactionList: any[] = JSON.parse(
      JSON.stringify(workflowActions)
    );

    const assetHdr = JSON.parse(JSON.stringify(assetData));

    let detaileReq: any = {
      body: {
        workpackDownload: true,
        tenantid: req.body.tenantid,
        crn: crn,
        fields: assetHdr,
        filters: {
          resource: {},
        },
      },
    };
    let resourcemap: any = {};
    resourcemap[resourceid] = true;
    detaileReq.body.filters.resource = resourcemap;
    let details = await assetController.getResourceDetails(detaileReq, res);
    let assetDtl: any[] = JSON.parse(JSON.stringify(details));

    if (assetHdr.length > 0 && assetDtl.length > 0) {
      let txnrefList: any[];
      let tasksres: any[];

      const formattedData = assetHdr.map((field: any) => ({
        ...field,
        fieldvalue: field.fieldtype === "REFERENCE"
          ? getReferenceValue(field, assetDtl[0])
          : assetDtl[0][field.fieldname] || "",
      }));

      const txnRefs = await db.TxnRefModel.findAll({
        where: { refkey: resourceid, status: constants.STATUS_ACTIVE },
      });

      const txnRefList = txnRefs.map(ref => ref.get({ plain: true }));
      const tasksRes: any[] = txnRefList.filter((t: any) => t.module === "workpack-task");
      const taskCrn: any[] = await getUniqueRefKeys(tasksRes, 'reference');
      let hdrData = await db.AssetsHdr.findAll({ where: { status: "Active", crn: { $in: taskCrn }, tenantid } });
      hdrData = JSON.parse(JSON.stringify(hdrData));
      const groupedHdrData = await groupByKey(hdrData, 'crn');
      const groupedDtlData: any = {};
      let taskAssetDetail: any[] = [];
      if (groupedHdrData && tasksRes) {
        for (const key in groupedHdrData) {
          let taskFormattedData: any = [];
          // load task header and details
          if (key && groupedHdrData[key][0].crn) {
            let taskTransactions = _.filter(tasksRes, (w) => {
              return w.reference == groupedHdrData[key][0].crn;
            });
            const tasksResourceIds = taskTransactions.map((tres: any) => tres.txn);
            let taskcrn = taskTransactions[0].reference.split("/")[0];
            let taskassetHdr = groupedHdrData[key];
            taskassetHdr = [
              ..._.orderBy(taskassetHdr, ["ordernumber", "id", "asc"]),
            ];
            if (taskassetHdr.length > 0) {
              let taskdetaileReq: any = {
                body: {
                  workpackDownload: true,
                  tenantid: req.body.tenantid,
                  crn: taskcrn,
                  fields: taskassetHdr,
                  filters: {
                    resource: {},
                  },
                },
              };
              let taskresourcemap: any = {};
              _.each(tasksResourceIds, (r) => {
                taskresourcemap[r] = true;
              });
              // load the task comments
              let taskscommentids = _.map(_.clone(tasksResourceIds), (a) => {
                a = a + "/wflowtasks";
                return a;
              });
              let taskcmt_parameters = {
                where: {
                  resourceid: {
                    $in: taskscommentids,
                  },
                  status: "Active",
                },
              };
              taskcmt_parameters["order"] = [["lastupdateddt", "desc"]];
              let tasks_commentsRes = await db.AssetsComment.findAll(
                taskcmt_parameters
              );
              const tasks_comments: any[] = JSON.parse(
                JSON.stringify(tasks_commentsRes)
              );

              taskdetaileReq.body.filters.resource = taskresourcemap;

              let details = await assetController.getResourceDetails(
                taskdetaileReq,
                res
              );
              taskAssetDetail = JSON.parse(JSON.stringify(details));
              // get task workflow action start
              let taskwrkflw_parameters = {} as any;
              let taskResourceIDs = [];
              _.each(taskAssetDetail, (dt) => {
                taskResourceIDs.push(dt.resource);
              });
              taskwrkflw_parameters = {
                where: {
                  status: "Active",
                  tenantid: req.body.tenantid,
                  module: constants.CMDB_OPERATIONTYPE[6],
                  resourceid: {
                    $in: taskResourceIDs,
                  },
                },
              };
              taskwrkflw_parameters.include = [
                {
                  model: db.User,
                  as: "fromuser",
                  required: false,
                  paranoid: false,
                },
                { model: db.User, as: "touser", required: false, paranoid: false },
              ];
              let taskWorkflowRes = await CommonService.getAllList(
                taskwrkflw_parameters,
                db.TNWorkFlowAction
              );
              let taskWorkflowActionList = JSON.parse(
                JSON.stringify(taskWorkflowRes)
              );
              // get task workflow action end

              _.each(taskAssetDetail, (t_dtl) => {
                let fdata: any = _.map(_.cloneDeep(taskassetHdr), (f: any) => {
                  f.fieldvalue = "";
                  if (t_dtl[f.fieldname]) {
                    if (f.fieldtype == "REFERENCE") {
                      f.fieldvalue = getReferenceValue(f, t_dtl);
                    } else f.fieldvalue = t_dtl[f.fieldname];
                  }
                  return f;
                });
                let taskWorkflow = _.filter(taskWorkflowActionList, (w) => {
                  return t_dtl.resource == w.resourceid;
                });
                fdata[0].taskWorkflow = taskWorkflow;
                fdata[0].taskComments = [];
                if (tasks_comments) {
                  if (tasks_comments.length > 0) {
                    fdata[0].taskComments = _.filter(tasks_comments, (c) => {
                      return c.resourceid.indexOf(t_dtl.resource) > -1;
                    });
                  }
                }
                taskFormattedData.push(fdata);
              });
              taskFormattedData = [
                ..._.orderBy(taskFormattedData, ["ordernumber", "id", "asc"]),
              ];
              groupedDtlData[key] = sortByFieldValueDesc(taskFormattedData);
            }
          }
        }
        // end task end
      }
      let headerData;
      let cmdbData: any[] = _.filter(formattedData, (f) => {
        let fieldname: string = f.fieldname;
        if (
          (fieldname.toLowerCase() == "name" ||
            fieldname.toLowerCase() == "Title" ||
            fieldname.toLowerCase() == "script id") &&
          headerData == undefined
        ) {
          headerData = f;
        }
        return f;
      });
      let textAreaData = _.filter(cmdbData, (f) => {
        return f.fieldtype == "Textarea";
      });
      textAreaData = [..._.orderBy(textAreaData, ["ordernumber", "id", "asc"])];
      let commonContentData: any[] = _.filter(cmdbData, (f) => {
        return f.fieldtype != "Textarea";
      });
      commonContentData = [
        ..._.orderBy(commonContentData, ["ordernumber", "id", "asc"]),
      ];

      //load main comments
      let cmt_parameters = {
        where: {
          resourceid: req.body.resourceid,
          status: "Active",
        },
      };
      cmt_parameters["order"] = [["lastupdateddt", "desc"]];
      let commentsRes = await db.AssetsComment.findAll(cmt_parameters);
      const comments: any[] = JSON.parse(JSON.stringify(commentsRes));

      // load execution comments
      //load main comments
      let execmt_parameters = {
        where: {
          resourceid: req.body.resourceid + "/wflow",
          status: "Active",
        },
      };
      execmt_parameters["order"] = [["lastupdateddt", "desc"]];
      let exe_commentsRes = await db.AssetsComment.findAll(execmt_parameters);
      const exe_comments: any[] = JSON.parse(JSON.stringify(exe_commentsRes));


      // history
      let hist_parameters = {
        where: {
          resourceid: req.body.resourceid,
          status: "Active",
        },
      };
      hist_parameters["order"] = [["createddt", "desc"]];
      let historyRes = await db.AssetsHistory.findAll(hist_parameters);
      const history: any[] = JSON.parse(JSON.stringify(historyRes));

      let headerTemplate = `<span>${moment().format(
        "DD-MM-YYYY hh:mm a "
      )}<span> `;
      if (headerData) {
        headerTemplate = `<div style="margin:15px 5px">
      <span>${moment().format("DD-MM-YYYY hh:mm a ")}</span>
       <span style="margin-left:50px"><b>${headerData.resourcetype
          }</b></span> : 
       <span><b>${headerData.fieldvalue}</b></span>
      </div> `;
      }
      for (let o in groupedHdrData) {
        groupedHdrData[o] = [..._.orderBy(groupedHdrData[o], ["ordernumber", "asc"])];
      }
      // let createres = await new assetcommentCotroller.all()
      let template = {
        // content: workpackTemplate,
        content: ReportTemplates.workpackMainTemplate,
        engine: "handlebars",
        helpers: CommonHelper,
        recipe: "chrome-pdf",
        phantom: {
          header: headerTemplate,
        },
        chrome: {
          marginTop: "1cm",
          marginLeft: "1cm",
          marginRight: "1cm",
          marginBottom: "1cm",
          landscape: true,
        },
      };

      let d = { commonContentData, textAreaData, comments, history, groupedDtlData, groupedHdrData, main_workflowactionList, exe_comments };

      DownloadService.generateFile(d, template, (result) => {
        res.send({
          data: result,
        });
      });

      // pdf formation end
    } else {
      customValidation.generateAppError("failed", {}, res, req);
    }
  }
  formatAssetDetails(cmdbData) { }

  txnList(req: Request, res: Response): void {
    let response = {};
    try {
      customValidation.generateSuccessResponse(
        "",
        response,
        constants.RESPONSE_TYPE_SAVE,
        res,
        req
      );
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
  async updateWatchList(req: Request, res: Response): Promise<void> {
    const response = {
      reference: modules.CMDB,
    } as any;
    try {
      let condition = {
        refkey: req.body.refkey,
        module: constants.CMDB_OPERATIONTYPE[7],
      };
      await CommonService.update(
        condition,
        {
          status: constants.STATUS_InACTIVE,
        },
        db.TxnRefModel
      );
      CommonService.bulkCreate(req.body.list, db.TxnRefModel)
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
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
  async execute(req: Request, res: Response) {
    try {
      let reqDta: any = req.body;
      let resourceDetails = reqDta.resourceDetails;
      let workflowDetails = reqDta.workflowDetails;
      const response = {
        reference: modules.CMDB,
      } as any;
      let resource_title = "";
      if (workflowDetails.length > 0) {
        resource_title = workflowDetails[0].resource_title
          ? workflowDetails[0].resource_title
          : "";
      }
      let createres: any = await new Controller().formatResourceDetails(
        resourceDetails,
        resource_title
      );
      if (createres) {
        if (createres.assetdetails) {
          let aidx = _.findIndex(createres.assetdetails, (a: any) => {
            return (
              a.fieldkey.indexOf("fk:name") > -1 ||
              a.fieldkey.indexOf("fk:title") > -1 ||
              a.fieldkey.indexOf("fk:script_id") > -1
            );
          });
          if (aidx > -1) {
            createres.assetdetails[aidx].fieldvalue = resource_title;
          }
        }
        let inserted: any[] = await new Controller().resourceDetailsBulkCreate(
          createres
        );
        let ins_resourceid, ins_crn;
        if (inserted) {
          if (inserted.length > 0) {
            let insertedItesm = inserted;
            ins_resourceid = insertedItesm[0]["resourceid"];
            resource_title =
              resource_title != undefined && resource_title != ""
                ? insertedItesm[0]["resource_title"]
                : "";
            let headerData = _.find(insertedItesm, (f) => {
              let fieldkey: string = f.fieldkey;
              return (
                fieldkey.indexOf("fk:name") > -1 ||
                fieldkey.indexOf("fk:title") > -1 ||
                fieldkey.indexOf("fk:script_id") > -1
              );
            });
            if (
              headerData &&
              resource_title != undefined &&
              resource_title != ""
            ) {
              resource_title = headerData.fieldvalue;
            }
            workflowDetails = _.map(workflowDetails, (w: any) => {
              w.resourceid = ins_resourceid;
              if (resource_title) {
                w.resource_title = resource_title;
              }
              return w;
            });
            ins_crn = ins_resourceid.split("/")[0];

            // for workpack task mapping
            let cloneRefReq = {
              resourceId: resourceDetails.resourceId,
              new_resourceId: ins_resourceid,
              module: constants.CMDB_OPERATIONTYPE[4],
              crn: ins_crn,
            };
            let txnDetails = await new Controller().workpackTxnRefBulkCreate(
              cloneRefReq
            );

            // for workpack execution mapping
            let cloneRefReq1 = {
              resourceId: resourceDetails.resourceId,
              new_resourceId: ins_resourceid,
              module: constants.CMDB_OPERATIONTYPE[5],
              crn: ins_crn,
            };
            let txnDetails1 = await new Controller().workpackTxnRefBulkCreate(
              cloneRefReq1
            );

            // assign worklow to tasks start
            let txnRes = await CommonService.getAllList(
              {
                where: {
                  refkey: ins_resourceid,
                  status: constants.STATUS_ACTIVE,
                },
              },
              db.TxnRefModel
            );
            let txnrefList = JSON.parse(JSON.stringify(txnRes));
            let tasksres: any[] = _.filter(
              _.cloneDeep(txnrefList),
              (t: any) => {
                return t.module == "workpack-task";
              }
            );
            if (tasksres.length > 0) {
              let taskWorkflowDetails: any[] = [];
              _.each(tasksres, (tsk, i) => {
                _.each(_.cloneDeep(workflowDetails), (wd: any) => {
                  wd.resource_title = `Step ` + i + " - " + wd.resource_title;
                  wd.resourceid = tsk.txn;
                  wd.module = constants.CMDB_OPERATIONTYPE[6];
                  taskWorkflowDetails.push(wd);
                });
              });
              _.each(taskWorkflowDetails, (tw) => {
                workflowDetails.push(tw);
              });
            }
            // assign worklow to tasks end

            let wrkflowres = await new Controller().workflowaction(
              workflowDetails
            );
            customValidation.generateSuccessResponse(
              inserted,
              response,
              constants.RESPONSE_TYPE_UPDATE,
              res,
              req
            );
          }
        }
      }
      console.log(res);
    } catch (e) {
      customValidation.generateAppError(e, {}, res, req);
      console.log("catch", e);
    }
  }

  async formatResourceDetails(
    reqDta: any,
    resourceTitle: string
  ): Promise<any> {
    try {
      let resourceId = reqDta.resourceId;
      let crn = resourceId.split("/")[0];
      let query = `select
                  tad .crn,
                  tad .fieldkey,
                  tah .fieldtype,
                  tah .id  as hdrid,
                  tad .fieldvalue,
                  tad .resourceid,
                  tad.dtl_operationtype,
                  tad .status 
                from
                  tbl_assets_dtl tad
                left join tbl_assets_hdr tah on
                  tad .crn = tah .crn
                  and 
                  tad .fieldkey = tah .fieldkey
                where
                  tah .crn = '${crn}'
                  and 
                  tad .resourceid ='${resourceId}' `;
      let resourcedetailsData = await db.sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
      });
      let autoGenList = [];
      let updateList = [];
      resourcedetailsData.map((asst) => {
        if (asst.fieldtype == "AUTOGEN") autoGenList.push(asst.fieldkey);
      });
      if (autoGenList.length > 0) {
        let hdrList = await CommonService.getAllList(
          {
            // where: { id: { $in: autoGenList } },
            where: { fieldkey: { $in: autoGenList } },
            attributes: ["id", "curseq", "prefix", "fieldkey"],
          },
          db.AssetsHdr
        );
        hdrList = JSON.parse(JSON.stringify(hdrList));
        let i = 0;
        let currentseq;
        let autogenlen = autoGenList.length;
        const resourceTimeStamp = Date.now().toString();
        let crnresourceid = (crn + "/" + resourceTimeStamp).toString();
        for (const asset of resourcedetailsData) {
          asset.createdby = reqDta.createdby;
          asset.createddt = reqDta.createddt;
          asset.lastupdatedby = reqDta.lastupdatedby;
          asset.lastupdatedby = reqDta.lastupdatedby;
          asset.lastupdateddt = reqDta.lastupdateddt;
          asset.tenantid = reqDta.tenantid;
          asset.resourceid = crnresourceid;
          asset.dtl_operationtype = reqDta.dtl_operationtype || "cmdb";
          i++;
          if (asset.fieldtype == "AUTOGEN") {
            let seq = hdrList.find((rec) => {
              return rec.fieldkey === asset.fieldkey;
            });
            if (seq) {
              if (currentseq == undefined) currentseq = seq.curseq;
              asset.fieldvalue = `${seq.prefix}${currentseq}`;
              updateList.push({
                id: asset.hdrid ? asset.hdrid : hdrList[0].id,
                curseq: await getSeq(Number(currentseq)),
                resourcetype: "",
              });
              autogenlen--;
              if (autogenlen != 0) {
                currentseq = Number(currentseq) + 1;
              }
            }
          }

          if (i == resourcedetailsData.length) {
            reqDta.updateList = updateList;
            reqDta.assetdetails = resourcedetailsData;
            return reqDta;
          }
        }
        function getSeq(seqNo) {
          let currseq = parseInt(seqNo);
          let newSeq: any = currseq + 1;
          let currLength = seqNo.length - newSeq.toString().length;
          for (let i = 0; i < currLength; i++) {
            newSeq = "0" + newSeq;
          }
          return newSeq;
        }
      } else {
        new Controller().resourceDetailsBulkCreate(reqDta);
      }
    } catch (e) {
      return;
    }
  }
  async resourceDetailsBulkCreate(reqDta: any): Promise<any> {
    try {
      let resData: {
        id: number;
        tenantid: number;
        crn: string;
        fieldkey: string;
        fieldvalue: string;
        resourceid: string;
        status: string;
        createdby: string;
        createddt: Date;
        lastupdatedby: string;
        lastupdateddt: Date;
      }[] = await CommonService.bulkCreate(reqDta.assetdetails, db.AssetsDtl);
      console.log("resData");
      console.log("Data to store on history >>>>>");
      console.log(resData[0]["crn"], resData[0]["resourceid"]);

      await CommonService.create(
        {
          type: 1,
          old: null,
          new: "New record created",
          affectedattribute: null,
          status: "Active",
          createdby: resData[0]["createdby"],
          createddt: resData[0]["createddt"],
          lastupdatedby: null,
          lastupdateddt: null,
          meta: "",
          tenantid: resData[0]["tenantid"],
          resourceid: resData[0]["resourceid"],
          crn: resData[0]["crn"],
        },
        db.AssetsHistory
      );
      await CommonService.bulkUpdate(
        reqDta.updateList,
        ["curseq"],
        db.AssetsHdr
      );
      return resData;
    } catch (e) {
      return e;
    }
  }

  async workflowaction(reqDta: any): Promise<any> {
    let response = {};
    let operation = reqDta.operation;
    try {
      if (operation) {
        delete reqDta.operation;
      }
      CommonService.bulkCreate(reqDta, db.TNWorkFlowAction)
        .then(async (data) => {
          let o_title = "";
          const actionDetailsUpdated = JSON.parse(JSON.stringify(data));
          if (reqDta.length > 0) {
            let receivers = _.map(_.cloneDeep(reqDta), (b) => {
              return b.touserid;
            });
            receivers.push(reqDta[0]["fromuserid"]);
            const usersInstance = await db.User.findAll({
              where: {
                userid: { $in: receivers },
                status: "Active",
              },
            });
            const users: User[] = JSON.parse(JSON.stringify(usersInstance));
            let owner = _.find(users, (u) => {
              return u.userid == reqDta[0]["fromuserid"];
            });
            let approver = _.find(users, (u) => {
              return u.userid == reqDta["touserid"];
            });
            let approverData = [];
            let toMail = [];
            _.each(_.cloneDeep(reqDta), (b) => {
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
            <td style="padding: 7px 17px;">${r.note || ""}</td>
          </tr>`;
            });
            replace_content = replace_content.replace(
              "{{rowcontent}}",
              replace_rowcontent
            );
            let title = "Workpack - Approver(s) added";
            let encoded_url = encodeURIComponent(
              `${process.env.WEB_URL}/workpackmanager/edittemplate?resource=${reqDta[0].resourceid}&srcfrom=email`
            );
            let maincontentConfig: iContentConfig = {
              subject: title,
              actiontype: reqDta[0].actiontype,
              // fromMail: "saravanakumar@cloudmatiq.com",
              toMail: toMail,
              o_title: title,
              o_inner_title: reqDta[0].resource_title || "",
              o_breadscrumList: [
                {
                  label: "CM",
                  link: process.env.WEB_URL,
                },
                {
                  label: "Workpack Manager",
                  link: process.env.WEB_URL + "/workpackmanager",
                },
                {
                  label: "Workpack Template",
                  link: process.env.WEB_URL + "/workpackmanager",
                },
              ],
              o_updatedby: reqDta.lastupdatedby,
              o_redirect_link: `${process.env.WEB_URL}/common-redirect?redirecturl=${encoded_url}`,
            };
            let workflowService = new WorkflowService(maincontentConfig);
            workflowService.sendworkflowMail(replace_content);
            await db.notification.bulkCreate(
              users.map((u) => {
                return {
                  userid: u.userid,
                  content: workflowService.buildHtmlcontent(replace_content),
                  contenttype: "Email",
                  tenantid: u.tenantid,
                  eventtype: "Workflow Notification",
                  title: title,
                  deliverystatus: "SENT",
                  modeofnotification: "EMAIL",
                  configuration: "",
                  notes: title,
                  status: "Active",
                  createdby: "-",
                  createddt: new Date(),
                  lastupdatedby: "-",
                  lastupdateddt: new Date(),
                  interval: null,
                };
              })
            );
            if (owner) {
              maincontentConfig.toMail = [];
              maincontentConfig.toMail.push(owner.email);
              maincontentConfig.subject = "Workpack - Status updated";
              workflowService.sendworkflowMail(replace_content);
            }
          }
        })
        .catch((error: Error) => {
          return error;
        });
    } catch (e) {
      return e;
    }
  }

  async workpackTxnRefBulkCreate(req: any): Promise<any> {
    let parameters = { where: {} } as any;
    let resourceId = req.resourceId;
    try {
      if (resourceId) {
        parameters.where = {
          refkey: resourceId,
          status: constants.STATUS_ACTIVE,
        };
        let list = await CommonService.getAllList(parameters, db.TxnRefModel);
        let reqDta: any = [];
        if (req.module == constants.CMDB_OPERATIONTYPE[5]) {
          let countReq = {
            where: {
              txn: resourceId,
              status: constants.STATUS_ACTIVE,
              module: constants.CMDB_OPERATIONTYPE[5],
            },
          };
          let run_count: any = await CommonService.getCount(
            countReq,
            db.TxnRefModel
          );
          reqDta.push({
            txnid: run_count + 1,
            refid: list[0].refid,
            txn: req.resourceId,
            reference: list[0].reference,
            refkey: req.new_resourceId,
            notes: req.crn || list[0].crn,
            status: list[0].status,
            createdby: list[0].createdby,
            createddt: list[0].createddt,
            lastupdatedby: list[0].lastupdatedby,
            lastupdateddt: list[0].lastupdateddt,
            module: req.module || list[0].module,
          });
        } else {
          reqDta = _.map(_.cloneDeep(list), (l) => {
            return {
              txnid: l.txnid,
              refid: l.refid,
              txn: l.txn,
              reference: l.reference,
              refkey: req.new_resourceId,
              notes: l.notes,
              status: l.status,
              createdby: l.createdby,
              createddt: l.createddt,
              lastupdatedby: l.lastupdatedby,
              lastupdateddt: l.lastupdateddt,
              module: req.module || l.module,
            };
          });
        }

        let insertedList = await CommonService.bulkCreate(
          reqDta,
          db.TxnRefModel
        );
        return insertedList;
      } else {
        return [];
      }
    } catch (error) {
      return error;
    }
  }

  executionList(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body } as any;
      parameters.where = req.body;
      if (req.body.userid) {
        parameters.where["$or"] = [
          { fromuserid: req.body.userid },
          { touserid: req.body.userid },
        ];
        delete parameters.where["userid"];
      }
      // parameters.include=[
      //   { model: db.User, as: "user", attributes: ["fullname", "userid"] },
      // ];
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["resource_title"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      if (req.query.count) {
        CommonService.getCountAndList(parameters, db.TNWorkFlowAction)
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
      else {
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
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  workflowrelationList(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = { where: req.body } as any;
      parameters.where = req.body;
      CommonService.getAllList(parameters, db.TNWorkflowRelations)
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
}
export default new Controller();

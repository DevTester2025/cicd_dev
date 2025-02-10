import { Request, Response, response } from "express";
import db from "../../models/model";
import awssyntheticEventHandler from "./controller/aws-syntheticevent";
import commonService from "../../services/common.service";
import { customValidation } from "../../../common/validation/customValidation";
import { constants } from "../../../common/constants";
import { error } from "console";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";
import { ReleaseConfigService } from "../../services/cicd/releases/releaseconfig.service";
import { Op } from "sequelize";
import logger from "../../../common/logger";


export default async function handleWebHook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const headers = req.headers;
    const query = req.query;
    const body = req.body;

    await db.Logs.create({
      createddt: new Date(),
      module: req.params.module,
      operation: req.params.type,
      level: "verbose",
      meta: JSON.stringify({
        headers: headers,
        query: query,
        body: body,
        params: req.params,
      }),
      notes: JSON.stringify({
        headers: headers,
        query: query,
        body: body,
        params: req.params,
      }),
    });

    if (req.method.toLowerCase() == "post") {
      if (req.params.module == "aws" && req.params.type == "synthetics") {
        await awssyntheticEventHandler(body);
      }
      res.send("Hook accepted on post channel.");
    } else {
      // Prometheus alert
      if (req.params.module == "grafana" && req.params.type == "alert") {
        // const r = await grafanaAlertHandler(body);

        console.log("Response from alert handler >>>>>>>>>>>>>>>");
        // console.log(r);
      }
      // Synthetic alert
      if (
        req.params.module == "grafana" &&
        req.params.type == "syntheticalert"
      ) {
        // const r = await syntheticsAlertHandler(body);

        console.log("Response from alert handler >>>>>>>>>>>>>>>");
        // console.log(r);
      }

      res.send("Hook accepted");
    }
  } catch (error) {
    console.log("Error handling the hook.");
    console.log(error);
    res.send("Hook accepted with error messages");
  }
}

//Webhook fetch log
export async function webhookLog(data: any, req: Request, res: Response) {
  try {
    const runId = data.workflow_job.run_id;
    const workflowName = data.workflow_job.workflow_name;
    const branchName = data.workflow_job.head_branch;
    const repository = data.repository.name;
    const ownerName = data.repository.owner.login;
    const commitId = data.workflow_job.head_sha;
    let accessToken: string;
    const releaseConfig = await db.ReleaseConfig.findAll({
      where: {
        status: constants.STATUS_ACTIVE,
      },
    });

    const releaseConfigDetails = JSON.parse(JSON.stringify(releaseConfig));
    //Get list of config id
    let releaseConfigIds = releaseConfigDetails.map((obj) => {
      return obj.id;
    });

    //Find job detail by release in ReleaseProcessDetail table
    let releaseDetails: any[] = await db.ReleaseProcessHeader.findAll({
      where: {
        releaseconfigid: releaseConfigIds,
      },
      include: [
        {
          model: db.ReleaseProcessDetail,
          as: "processdetail",
        },
      ],
    });
    let headerStatus: string;
    let result: { jobList: any; workflowRunStatus: any; octokit: any };
    const headerParams ={
      result,
      ownerName,
      repository,
      runId,
      accessToken,
      headerStatus,
      res,
      req,
      commitId,
    } 

    // Compare and find the common runId from webhook response
    const releaseHeaderUpdate = releaseDetails.find(
      (transaction: {
        providerrunid: string;
        workflowname: string;
        reponame: string;
        branch: string;
        status: string;
      }) => {
        return (
          transaction.reponame == repository &&
          transaction.branch == branchName &&
          transaction.workflowname == workflowName &&
          transaction.providerrunid == runId.toString()
        );
      }
    );

    if (releaseHeaderUpdate != null || releaseHeaderUpdate != undefined) {
      await getReleaseHeader(headerParams,releaseHeaderUpdate)
    } else {
      const releaseHeader = await releaseDetails.find(
        (transaction: {
          providerrunid: string;
          workflowname: string;
          reponame: string;
          branch: string;
          status: string;
        }) => {
          return (
            transaction.reponame == repository &&
            transaction.branch == branchName &&
            transaction.workflowname == workflowName &&
            transaction.status == constants.RELEASE_STATUS_PENDING &&
            (transaction.providerrunid == null ||
              transaction.providerrunid == undefined)
          );
        }
      );

      if (releaseHeader != null && releaseHeader != undefined) {
        await getReleaseHeader(headerParams,releaseHeader);
      }else{
        logger.error("Data not found");
      }
    }
  } catch (err) {
    logger.error(err);
  }
}

async function getReleaseHeader(headerParams:any,releaseHeader:any): Promise<any> {
 

  const headerId = JSON.parse(JSON.stringify(releaseHeader));
  let condition = { id: headerId.id };
  headerParams.result = await getAccessToken(
    headerId,
    headerParams.ownerName,
    headerParams.repository,
    headerParams.runId,
    headerParams.accessToken
  );
  if (
    headerParams.result.workflowRunStatus.data.conclusion != undefined &&
    headerParams.result.workflowRunStatus.data.conclusion != null) {
      switch (headerParams.result.workflowRunStatus.data.conclusion.toString()) {
        case "queued":
          headerParams.headerStatus = constants.RELEASE_STATUS_PENDING;
          break;
        case "in_progress":
          headerParams.headerStatus = constants.RELEASE_STATUS_INPROGRESS;
          break;
        case "skipped":
          headerParams.headerStatus = constants.RELEASE_STATUS_PENDING;
          break;
        case "cancelled":
          headerParams.headerStatus = constants.RELEASE_STATUS_CANCELLED;
          break;
        case "failure":
          headerParams.headerStatus = constants.RELEASE_STATUS_FAILED;
          break;
        case "success":
          headerParams.headerStatus = constants.RELEASE_STATUS_COMPLETED;
          break;
        default:
          headerParams.headerStatus = headerParams.result.workflowRunStatus.data.conclusion;
      }
  } 
  else {
      headerParams.headerStatus = constants.RELEASE_STATUS_INPROGRESS;
  }
  let mapfield = {
    commitid:headerParams.commitId,
    providerrunid: headerParams.runId,
    status: headerParams.headerStatus,
    executionendtime: new Date(),
    lastupdateddt: new Date(),
  };
 const data = await commonService
    .update(condition, mapfield, db.ReleaseProcessHeader);
  getJobListAndStatus(
    headerId,
    headerParams 
  );
}

// To get a access Token from TemplateConfig table
async function getAccessToken(
  headerId: any,
  ownerName: string,
  repository: string,
  runId: number,
  accessToken: string
): Promise<{ jobList: any; workflowRunStatus: any; octokit: any }> {
  try {
    const releaseDetail = await db.ReleaseConfig.findOne({
      where: { status: constants.STATUS_ACTIVE, id: headerId.releaseconfigid },
    });

    if (releaseDetail) {
      const config = JSON.parse(JSON.stringify(releaseDetail));
       
      const templateDetail = await db.ReleaseConfigDetail.findAll({
                    
        where:{ releaseconfighdrid:config.id, status: constants.STATUS_ACTIVE },
        order: [['position', 'ASC']] ,

            include: [
                {
                    model: db.ReleaseSetupConfig,
                    as: "releasesetupdetailconfig",
                    where:{ status: constants.STATUS_ACTIVE} 
                  }
            ]   

});
      const templateDetails = JSON.parse(JSON.stringify(templateDetail));

      const setupdetails: any[] = templateDetails;
      if (setupdetails.length > 0) {
        const firstElement = setupdetails[0];
        const setUpDetailsResponse =
          firstElement.releasesetupdetailconfig.setupdetails;
        const owner = JSON.parse(setUpDetailsResponse);
        accessToken = owner.accesstoken;
      }
    }
    const octokit = new Octokit({ auth: accessToken, request: { fetch } });
    const jobList = await octokit.rest.actions. listJobsForWorkflowRun({
      owner: ownerName,
      repo: repository,
      run_id: runId,
    });
    const workflowRunStatus = await octokit.actions.getWorkflowRun({
      owner: ownerName,
      repo: repository,
      run_id: runId,
    });
    return { jobList, workflowRunStatus, octokit };
  } catch (e) {
    logger.error(e);
  }
}

//To get a log from GitHub
export async function getJobListAndStatus(
  processHeader: any,
  headerParams:any,
) {
  try {
    const jobs = headerParams.result.jobList.data.jobs;

    let processDetails: any[] = processHeader.processdetail;
    const upsertJobDetails: any[] = [];
    for (const job of jobs) {
      const { data: workflowLogs } =
        await headerParams.result.octokit.actions.downloadJobLogsForWorkflowRun({
          owner: headerParams.ownerName,
          repo: headerParams.repository,
          job_id: job.id,
        });
      let conclusionStatus;
      await getStatus(job).then((result) => {
        conclusionStatus = result.jobStatus;
      });
      // Compare and find the common JobIds from webhook response
      let jobDetail = processDetails.find(
        (jobDtl: { jobname: string }) => jobDtl.jobname == job.name
      );
      if (jobDetail &&(jobDetail.jobname == "APPROVAL_WORKFLOW" || jobDetail.jobname == "ORCHESTRATION")
      ) {
        await orchestration(headerParams,jobDetail,job,upsertJobDetails,conclusionStatus,workflowLogs);
      }
      else if (jobDetail && (jobDetail.jobname != "APPROVAL_WORKFLOW" && jobDetail.jobname != "ORCHESTRATION")) {
        let obj = {
          id: jobDetail.id,
          tenantid: jobDetail.tenantid,
          releaseprocesshdrid: jobDetail.releaseprocesshdrid,
          referencetype: jobDetail.referencetype,
          referenceid: jobDetail.referenceid,
          position: jobDetail.position,
          providerjobid: job.id,
          jobname: job.name,
          log: workflowLogs,
          status: conclusionStatus,
          createdby: jobDetail.createdby,
          lastupdateddt: new Date(),
        };
        upsertJobDetails.push(obj);
      }
    }
    await commonService.bulkUpdate(
      upsertJobDetails,
      ["providerjobid", "log", "status", "lastupdateddt","issuesid"],
      db.ReleaseProcessDetail
    ).then((data) => {
      customValidation.generateSuccessResponse(
        data,
        response,
        constants.RESPONSE_TYPE_UPDATE,
        headerParams.res,
        headerParams.req
      );
    });
  } catch (e) {
    logger.error(e);
  }
}

async function getStatus(job: any): Promise<any> {
  try{
  let jobStatus;
  if (job.conclusion != null && job.conclusion != undefined) {
    if (job.conclusion == "skipped") {
      jobStatus = constants.RELEASE_STATUS_PENDING;
    } else if (job.conclusion == "success") {
      jobStatus = constants.RELEASE_STATUS_COMPLETED;
    } else if(job.conclusion == "failure") {
      jobStatus = constants.RELEASE_STATUS_FAILED;
    }else if(job.conclusion == "cancelled"){
      jobStatus = constants.RELEASE_STATUS_CANCELLED;
    }else{
      jobStatus = job.conclusion;
    }
  } else if (job.status != null && job.status != undefined) {
    switch (job.status.toString()) {
      case "queued":
        jobStatus = constants.RELEASE_STATUS_PENDING;
        break;
      case "in_progress":
        jobStatus = constants.RELEASE_STATUS_INPROGRESS;
        break;
      case "skipped":
        jobStatus = constants.RELEASE_STATUS_PENDING;
        break;
      case "cancelled":
        jobStatus = constants.RELEASE_STATUS_CANCELLED;
        break;
      case "failure":
        jobStatus = constants.RELEASE_STATUS_FAILED;
        break;
      case "success":
        jobStatus = constants.RELEASE_STATUS_COMPLETED;
        break;
      default:
        jobStatus = job.status;
    }
  }
  return { jobStatus };
} catch (e) {

  logger.error(e);
}
}

export async function getCommitAndSchedule(data: any, req: Request, res: Response){
try{

  const branchName = data.workflow_run.head_branch;
  const repoName =data.repository.name;
  const workflowFileName = data.workflow_run.name.replace('.github/workflows/', '').replace('.yml', '');
  const runId = data.workflow_run.id;
  const event = data.workflow_run.event;
let  releaseConfig;

if(event!=null && event!=undefined && event==constants.EVENT_PUSH){
  releaseConfig= await db.ReleaseConfig.findAll({
    where: {
      status: constants.STATUS_ACTIVE,
      schedule: constants.SCHEDULED_ONCOMMIT,
    }
  });
}else{
  releaseConfig= await db.ReleaseConfig.findAll({
    where: {
      status: constants.STATUS_ACTIVE,
      schedule: constants.SCHEDULED_SCHEDULE,
    }
  });
}

  const releaseConfigDetails = JSON.parse(JSON.stringify(releaseConfig));
  const relevantConfigs = releaseConfigDetails.filter(obj =>
    obj.providerrepo === repoName &&
    obj.providerbranch === branchName &&
    obj.filename === workflowFileName
  );

  if(relevantConfigs.length===0){
    logger.error("Data not found");
  }
  
  await Promise.all(JSON.parse(JSON.stringify(relevantConfigs)).map(async obj => {

    let configDetail: any[] = await db.ReleaseProcessHeader.findAll({
      where: {
        releaseconfigid: obj.id,
      },
      include: [
        {
          model: db.ReleaseProcessDetail,
          as: "processdetail",
        },
      ],
    });

    const releaseHeader = configDetail.find((transaction: any) => 
    transaction.get('reponame') === repoName &&
    transaction.get('branch') === branchName &&
    transaction.get('workflowname') === workflowFileName &&
    transaction.get('providerrunid') === runId.toString()
  );

    if(!releaseHeader){
       const releaseConfingDetail = await db.ReleaseConfigDetail.findAll({
        where: {
          releaseconfighdrid: obj.id,
          status: constants.STATUS_ACTIVE,
        }
      });
      const confingDetails = JSON.parse(JSON.stringify(releaseConfingDetail));
       const processHeader = {
      tenantid: obj.tenantid,
      templateid: obj.templateid,
      releaseconfigid: obj.id,
      providerrunid:runId,
      workflowname: obj.filename,
      provider: constants.GITHUB,
      reponame: repoName,
      branch: branchName,
      executionstarttime: new Date(),
      status: constants.RELEASE_STATUS_PENDING,
      createdby: constants.ADMIN,
      createddt: new Date(),
      lastupdateby: constants.ADMIN,
      lastupdateddt:new Date(),
      processdetail: confingDetails.map((detail) => ({
        tenantid: obj.tenantid,
        referencetype: detail.referencetype,
        referenceid: detail.referenceid,
        jobname: detail.providerjobname,
        position: detail.position,
        status: constants.RELEASE_STATUS_PENDING,
        createdby: constants.RELEASE_SYSTEM,
        createddt: new Date(),
        lastupdateby: constants.RELEASE_SYSTEM,
        lastupdateddt:new Date(),
      })),
    };

    await commonService.saveWithAssociation(
      processHeader,
      {
        include: [
          {
            model: db.ReleaseProcessDetail,
            as: "processdetail",
          },
        ],
      },
      db.ReleaseProcessHeader
    ).then(result=>{
if(result){
  logger.error("Table created successfully");
}
   }) 
    }else{
      logger.error("Table already exsist");
    }
  }));
}
catch(e){
  logger.error(e);
}
}

export async function orchestration(headerParams,jobDetail,job,upsertJobDetails,conclusionStatus,workflowLogs) {
  try {
    let issuesId;
    if (conclusionStatus == constants.RELEASE_STATUS_INPROGRESS) {
      await headerParams.result.octokit.issues
        .listForRepo({
          owner: headerParams.ownerName,
          repo: headerParams.repository,
        })
        .then(async ({ data }) => {
          if(data){
             // Process the issues
          await data.forEach(async (issue) => {
            const body = issue.body;
            if (body) {
              const regex = /run_id: (\d+)/;
              const match = body.match(regex);
              if (match) {
                const workflowId = match[1];
                console.log("Workflow ID:", workflowId);
                if (headerParams.runId == workflowId) {
                 //TODO Orchestration&Approval
                 issuesId=issue.number;
                }
                console.log("IssueNumber:", issue.number);
              }
            }
          });
          }
        });
    }
    let obj = {
      id: jobDetail.id,
      tenantid: jobDetail.tenantid,
      releaseprocesshdrid: jobDetail.releaseprocesshdrid,
      referencetype: jobDetail.referencetype,
      referenceid: jobDetail.referenceid,
      position: jobDetail.position,
      providerjobid: job.id,
      jobname: job.name,
      issuesid:jobDetail.issuesid?jobDetail.issuesid:issuesId,
      status: conclusionStatus,
      createdby: jobDetail.createdby,
      lastupdateddt: new Date(),
    };
    commonService.bulkUpdate([obj],["providerjobid", "status", "lastupdateddt","issuesid"],db.ReleaseProcessDetail);
  } catch (e) {
    logger.error(e.message);
  }
}


export async function processApproval(req: Request, res: Response, status: string): Promise<any> {
  try {
    const releaseConfig = await db.ReleaseConfig.findOne({
      where: {
        id: req.body.data.releaseId,
        tenantid: req.body.data.tenantid,
        status: constants.STATUS_ACTIVE,
      },
      include: [
        {
          model: db.ReleaseConfigDetail,
          as: "ConfigDetail",
          where: {
            tenantid: req.body.data.tenantid,
            status: "Active",
          },
          include: [
            {
              model: db.ReleaseSetupConfig,
              as: "releasesetupdetailconfig",
            },
          ],
        },
      ],
    });

    if (!releaseConfig) {
      console.log("Data not found")
      return res.json({ status: false, code: 204, message: "Data not found" });
    }

    const release = JSON.parse(JSON.stringify(releaseConfig));
    const repository = release.providerrepo;
    let accessToken, ownerName;

    const setupdetails: any[] = release.ConfigDetail;
    if (setupdetails.length > 0) {
      const firstElement = setupdetails[0];
      const setUpDetailsResponse = firstElement.releasesetupdetailconfig.setupdetails;
      const owner = JSON.parse(setUpDetailsResponse);
      ownerName = owner.username;
      accessToken = owner.accesstoken;
    }

    const octokit = new Octokit({ auth: accessToken, request: { fetch } });

    const transcationDetail = await db.ReleaseProcessDetail.findOne({
      where: { providerjobid: req.body.data.jobId, tenantid: req.body.data.tenantid },
    });

    if (!transcationDetail) {
      return res.json({ status: false, code: 204, message: "Data not found" });
    }

    const releaseDetail = JSON.parse(JSON.stringify(transcationDetail));
    let log = "";

    if (releaseDetail.jobname === constants.ORCHESTRATION && releaseDetail.providerjobid === req.body.data.jobId && req.body.data.type === constants.ORCHESTRATION) {
      log = await orchestrationLog(req.body.log);
    } else if (releaseDetail.jobname === constants.APPROVAL_WORKFLOW && releaseDetail.providerjobid === req.body.data.jobId && req.body.data.type === constants.APPROVAL_WORKFLOW) {
      log = await jsonToTable(req.body.log);
    } else {
      return res.json({ status: false, code: 204, message: "Data not found" });
    }

    if (releaseDetail.issuesid && releaseDetail.issuesid === req.body.data.issueNumber &&
        releaseDetail.providerjobid && releaseDetail.providerjobid === req.body.data.jobId) {
      if (status === constants.GITHUB_STATUS_SUCCESS || status === constants.DASHBOARD_FAILED_STATUS) {
        const commentBody = (status === constants.GITHUB_STATUS_SUCCESS) ? constants.APPROVED : constants.DENIED;
        try {
          await octokit.issues.createComment({
            owner: ownerName,
            repo: repository,
            issue_number: req.body.data.issueNumber,
            body: commentBody,
          });
        } catch (error) {
          console.log("error", error);
        }
      }

      const obj = {
        ...releaseDetail,
        log: log,
        status: releaseDetail.status,
        lastupdateddt: new Date(),
      };

      await commonService.update({ id: releaseDetail.id }, obj, db.ReleaseProcessDetail);
      return res.json({ status: true, code: 200, message: "Log updated successfully" });
    } else {
      return res.json({ status: false, code: 204, message: "Data not found" });
    }
  } catch (e) {
    console.error(e);
    return res.json({ status: false, code: 204, message: e.message });
  }
}

async function jsonToTable(jsonLog: any): Promise<string> {
  try {
      let table = '';
      const logs = jsonLog; // Access the 'log' array from the JSON object

      if (logs.length > 0) { // Ensure there are logs to process
          const keys = Object.keys(logs[0]);
          const columnWidths: { [key: string]: number } = {};

          // Calculate column widths based on maximum value length
          keys.forEach((key: string) => {
              const maxWidth = Math.min(30, Math.max(...logs.map((logItem: any) => {
                  // Check if the value is "null" and handle it
                  if (logItem[key] == null) {
                      return 4; // Length of "null"
                  }
                  return logItem[key].toString().length;
              })));
              columnWidths[key] = Math.max(maxWidth, key.length);
          });

          // Create header row
          const headerRow = '|' + keys.map(key => ' ' + key.toUpperCase()  + ' '.repeat(columnWidths[key] - key.length) + ' ').join('|') + '|\n';
          const separatorRow = '|' + keys.map(key => '-' + '-'.repeat(columnWidths[key]) + '-').join('|') + '|\n';

          table += separatorRow + headerRow + separatorRow;

          // Iterate over each log entry
          logs.forEach((logItem: any) => {
              // Create data row
              const dataRow = '|' + keys.map(key => {
                  let value = logItem[key];
                  // Check if the value is "null" and handle it
                  if (value ==null) {
                      value = '-';
                  } else {
                      value = value.toString();
                      if (value.length > 30) {
                          value = value.slice(0, 27) + '...';
                      }
                  }
                  return ' ' + value + ' '.repeat(columnWidths[key] - value.length) + ' ';
              }).join('|') + '|\n';
              table += dataRow + separatorRow;
          });

          return table;
      } else {
          console.log("No log entries found.");
          return ''; // Return an empty string if no logs are found
      }
  } catch (error) {
      console.error("Error parsing JSON:", error);
      return ''; // Return an empty string in case of an error
  }
}

async function orchestrationLog(log: any): Promise<string> {
    function padEnd(str: string, targetLength: number, padString: string = ' '): string {
      targetLength = targetLength >> 0;
      if (str.length > targetLength) {
        return str;
      }
      targetLength = targetLength - str.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length);
      }
      return str + padString.slice(0, targetLength);
    }
    try {
      for (const key in log) {
        if (log[key] === null) {
            log[key] = '-';
        }
    }
      const keys = Object.keys(log);
      const values = keys.map(key => log[key]);
      const columnWidths = keys.map((key, index) => {
        const valueStr = values[index] !== undefined ? values[index].toString() : '-';
        return Math.max(key.length, valueStr.length) + 2;
      });
      const headerRow = keys.map((key, index) => {
        return `| ${padEnd(key.toUpperCase(), columnWidths[index] - 2)} `;
      }).join('') + '|';
      const separatorRow = keys.map((_, index) => {
        return `|${'-'.repeat(columnWidths[index])}`;
      }).join('') + '|';
      const topBorder = keys.map((_, index) => {
        return `|${'-'.repeat(columnWidths[index])}`;
      }).join('') + '|';
      const dataRow = values.map((value, index) => {
        const valueStr = value !== undefined ? value.toString() : '-';
        return `| ${padEnd(valueStr, columnWidths[index] - 2)} `;
      }).join('') + '|';
      const logTable = `${topBorder}\n${headerRow}\n${separatorRow}\n${dataRow}\n${separatorRow}`;
      return logTable;
    } catch (error) {
      logger.error("Error processing log:", error);
    }
}
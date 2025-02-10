import db from "../../../models/model";
import commonService from "../../common.service";
import { constants } from "../../../../common/constants";
import { Request, Response } from "express";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";
import { customValidation } from "../../../../common/validation/customValidation";
import { Op } from "sequelize";
import logger from "../../../../common/logger";
import { messages } from "../../../../common/messages";




export class ReleaseConfigService {
  //Trigger workflow
  async tiggerReleaseworkflow(
    configId: number,
    headerId: number,
    req: Request<any>,
    res: Response<any>,
    scheduled:string
  ) {
    let response = {};
    await this.releaseTransaction(Number(configId), headerId)
      .then(async (data) => {
        try {
          const octokit = new Octokit({
            auth: data.accessToken,
            request: { fetch },
          });
          const response = await octokit.actions
            .createWorkflowDispatch({
              owner: data.userName,
              repo: data.repoName,
              workflow_id: data.fileName +constants.WORKFLOW_YML, // Replace with your workflow_id
              ref: data.branchName,
            })
            .then(async (result) => {
              if (result.status === 204) {
                res.json({ 
                  code: 200,
                  status: true,
                  message: constants.WORKFLOW_TRIGGER});
                new ReleaseConfigService().releaseWorkflowList(octokit, data,scheduled);
              } else {
                res.json({ 
                  code: 204,
                  status: false,
                  message: constants.FAILED_TRIGGER
                  })
                customValidation.generateAppError(
                  result.status,
                  response,
                  res,
                  req
                );
              }
            });
        } catch (error) {
          res.json({
            code: 204,
            status: false,
             message: error.message });
          let options = {
            status: constants.RELEASE_STATUS_FAILED,
            description: error.response.data.message,
          };
          await commonService.update(
            {
              releaseconfigid: configId,
              status: constants.RELEASE_STATUS_PENDING,
            },
            options,
            db.ReleaseProcessHeader
          );
        }
      })
      .catch(async (err) => {
        res.json({
            code: 204,
            status: false,
             message: err.message });
      });
  }

  async releaseTransaction(configid: number, headerId: number): Promise<any> {
    let repoName: string;
    let fileName: string;
    let branchName: string;
    let userName: string;
    let accessToken: string;
    const referenceHeaderId =
      headerId != null && headerId != undefined ? headerId : null;

    try {
      const releaseDetail = await db.ReleaseConfig.findOne({
        where: { id: configid, status: constants.STATUS_ACTIVE },
      });

      if (!releaseDetail) {
        throw new Error(messages.RELEAECONFIG_ERR_MSG[5]);
      }

      const config = JSON.parse(JSON.stringify(releaseDetail));
      branchName = config.providerbranch;
      repoName = config.providerrepo;
      fileName = config.filename;
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
      const configDetail = await db.ReleaseProcessHeader.findAll({
        where: {
          releaseconfigid: configid,
          status: {
            [Op.or]: [
              constants.RELEASE_STATUS_PENDING,
              constants.RELEASE_STATUS_INPROGRESS,
            ],
          },
        },
      });

      if (configDetail && configDetail.length) {
        throw new Error(constants.WORKFLOW_PENDING);
      }

      const templateDetails = JSON.parse(JSON.stringify(templateDetail));

      const setupdetails: any[] = templateDetails;
      if (setupdetails.length > 0) {
        const firstElement = setupdetails[0];
        const setUpDetailsResponse =
          firstElement.releasesetupdetailconfig.setupdetails;

        const owner = JSON.parse(setUpDetailsResponse);
        userName = owner.username;
        accessToken = owner.accesstoken;
      }

      const processHeader = {
        tenantid: config.tenantid,
        templateid: config.templateid,
        releaseconfigid: configid,
        referenceheaderid: referenceHeaderId,
        workflowname: config.filename,
        provider: constants.GITHUB,
        reponame: repoName,
        branch: branchName,
        executionstarttime: new Date(),
        status: constants.RELEASE_STATUS_PENDING,
        createdby: constants.ADMIN,
        createddt: new Date(),
        lastupdateby: constants.ADMIN,
        lastupdateddt:new Date(),
        processdetail: templateDetails.map((detail) => ({
          tenantid: config.tenantid,
          referencetype: detail.referencetype,
          referenceid: detail.referenceid,
          jobname: detail.providerjobname,
          position: detail.position,
          status: constants.RELEASE_STATUS_PENDING,
          createdby: constants.ADMIN,
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
      );

      return {
        userName,
        accessToken,
        repoName,
        branchName,
        fileName,
      };
    } catch (e) {
      logger.error(e.message);
throw e ;   
    }
  }

  //To get workflow log using RunID
  async releaseWorkflowList(octokit: any, data: any,scheduled:string) {
    try {
      //Code to be executed repeatedly
      let intervalId = setInterval(async function () {
        const workflowsResponse = await octokit.actions.listWorkflowRuns({
          owner: data.userName,
          repo: data.repoName,
          workflow_id: data.fileName +constants.WORKFLOW_YML,
        });

        workflowsResponse.data.workflow_runs.forEach(async (workflow) => {
          if (
            workflow.status == constants.GITHUB_STATUS_INPROGRESS ||
            workflow.status == constants.GITHUB_STATUS_QUEUED
          ) {
            await new ReleaseConfigService().getHeaderStatus(workflow, octokit,scheduled);
            if (workflow.id != null) {
              clearInterval(intervalId);
              console.log("Interval stopped...");
            }
          }
        });
      }, 5000);
    } catch (e) {
      logger.error(e.message);
      throw e;
    }
  }

  //To get headerStatus
  async getHeaderStatus(workflow: any, octokit: any,scheduled) {
    try {
      let intervalTime = setInterval(async function () {
        const runId = workflow.id;
        const workflowName = workflow.name;
        const branchName = workflow.head_branch;
        const repository = workflow.repository.name;
        const ownerName = workflow.repository.owner.login;
        const commitId = workflow.head_sha;

        let  releaseConfig ;
        if(scheduled!=null && scheduled!=undefined && scheduled==constants.SCHEDULED_ONCOMMIT){
          releaseConfig = await db.ReleaseConfig.findAll({
            where: {
              status: constants.STATUS_ACTIVE,
              schedule: constants.SCHEDULED_ONCOMMIT,
            },
          });
        }else{
          releaseConfig = await db.ReleaseConfig.findAll({
            where: {
              status: constants.STATUS_ACTIVE,
              schedule: constants.SCHEDULED_MANUAL,
            },
          });
        }
        
        const releaseConfigDetails = JSON.parse(JSON.stringify(releaseConfig));
        //Get list of config id
        let releaseConfigIds = releaseConfigDetails.map((obj) => {
          return obj.id;
        });

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
        const headerParams = {
          ownerName,
          repository,
          runId,
          commitId,
          octokit,
          intervalTime,
        };
        if (releaseHeaderUpdate != null || releaseHeaderUpdate != undefined) {
          const headerId = JSON.parse(JSON.stringify(releaseHeaderUpdate));
          await new ReleaseConfigService().workflowJobLog(
            headerId,
            workflow,
            headerParams
            
          );
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
            const headerUpdatedId = JSON.parse(JSON.stringify(releaseHeader));
            await new ReleaseConfigService().workflowJobLog(
              headerUpdatedId,
              workflow,
              headerParams
            );
          }
        }
      }, 5000);
    } catch (e) {
      logger.error(e.message);
      throw e;
    }
  }

  async workflowJobLog(headerId: any, workflow: any, headerParams: any) {
    try {
      let condition = { id: headerId.id };
      let headerStatus;
      let releaseId= headerId.releaseconfigid
      const workflowRunStatus = await headerParams.octokit.actions.getWorkflowRun({
          owner: headerParams.ownerName,
          repo: headerParams.repository,
          run_id: headerParams.runId,
        });
      console.log(workflowRunStatus, "........workflowRunStatus");
      if (
        workflowRunStatus.data.conclusion != undefined &&
        workflowRunStatus.data.conclusion != null
      ) {
        switch (workflowRunStatus.data.conclusion) {
          case constants.GITHUB_STATUS_QUEUED:
            headerStatus = constants.RELEASE_STATUS_PENDING;
            break;
          case constants.GITHUB_STATUS_INPROGRESS:
            headerStatus = constants.RELEASE_STATUS_INPROGRESS;
            break;
          case constants.GITHUB_STATUS_SKIPPED:
            headerStatus = constants.RELEASE_STATUS_PENDING;
            break;
          case constants.GITHUB_STATUS_CANCELLED:
            headerStatus = constants.RELEASE_STATUS_CANCELLED;
            break;
          case constants.GITHUB_STATUS_FAILED:
            headerStatus = constants.RELEASE_STATUS_FAILED;
            break;
          case constants.GITHUB_STATUS_SUCCESS:
            headerStatus = constants.RELEASE_STATUS_COMPLETED;
            break;
          default:
            headerStatus = workflowRunStatus.data.conclusion;
        }
      } else {
        headerStatus = constants.RELEASE_STATUS_INPROGRESS;
      }
      let mapfield = {
        commitid: headerParams.commitId,
        providerrunid: headerParams.runId,
        status: headerStatus,
        executionendtime: new Date(),
        lastupdatedby: constants.RELEASE_SYSTEM,
        lastupdateddt: new Date(),
      };
      let processHeader;
      await commonService
        .update(condition, mapfield, db.ReleaseProcessHeader)
        .then((result) => {
          processHeader = JSON.parse(JSON.stringify(result));
        });
      const jobList =
        await headerParams.octokit.rest.actions.listJobsForWorkflowRun({
          owner: headerParams.ownerName,
          repo: headerParams.repository,
          run_id: headerParams.runId,
        });
        console.log(jobList, ".....jobList");
      const jobs = jobList.data.jobs;
      let processDetails: any[] = headerId.processdetail;
      const upsertJobDetails: any[] = [];
      for (const job of jobs) {
        try {
          const { data: workflowLogs } =
            await headerParams.octokit.actions.downloadJobLogsForWorkflowRun({
              owner: headerParams.ownerName,
              repo: headerParams.repository,
              job_id: job.id,
            });
          let conclusionStatus;
          await this.getStatus(job).then((result) => {
            conclusionStatus = result.jobStatus;
          });
          // Compare and find the common JobIds from webhook response
          let jobDetail = processDetails.find(
            (jobDtl: { jobname: string }) => jobDtl.jobname == job.name
          );
          if (jobDetail &&(jobDetail.jobname == constants.APPROVAL_WORKFLOW || jobDetail.jobname == constants.ORCHESTRATION)
          ) {
            await this.orchestration(headerParams,jobDetail,job,upsertJobDetails,conclusionStatus,releaseId,workflowLogs);
          }
          else if (jobDetail && (jobDetail.jobname != constants.APPROVAL_WORKFLOW && jobDetail.jobname != constants.ORCHESTRATION))  {
            await upsertJobDetails.push(this.jobDetailObj(jobDetail, job, workflowLogs, conclusionStatus));
          }
        } catch (e) {
          logger.error(e)
        }
      }
      console.log(JSON.stringify(upsertJobDetails), "........upsertJobDetails");
      await commonService.bulkUpdate(
        upsertJobDetails,
        ["providerjobid", "log", "status", "lastupdateddt","issuesid"],
        db.ReleaseProcessDetail
      );
      if (
        processHeader.status != constants.RELEASE_STATUS_INPROGRESS &&
        processHeader.status != constants.RELEASE_STATUS_PENDING
      ) {
        clearInterval(headerParams.intervalTime);
        console.log("Interval stopped...");
      }
    } catch (e) {
      logger.error(e);
      throw e;
    }
  }

    //To get Orchestration & Approval
    async orchestration(headerParams,jobDetail,job,upsertJobDetails,conclusionStatus,releaseId,workflowLogs) {
      try {
        let issuesId;
        if (conclusionStatus == constants.RELEASE_STATUS_INPROGRESS) {
          await headerParams.octokit.issues
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
        const obj =  await this.jobDetailObj(jobDetail, job, workflowLogs, conclusionStatus, issuesId);
        await commonService.bulkUpdate([obj], ["providerjobid", "status", "lastupdateddt", "issuesid"], db.ReleaseProcessDetail);       
      } catch (e) {
        logger.error(e.message);
      }
    }

    jobDetailObj(jobDetail, job, workflowLogs, conclusionStatus, issuesId = null) {
      try{
      const jobObj:any =  {
        id: jobDetail.id,
        tenantid: jobDetail.tenantid,
        releaseprocesshdrid: jobDetail.releaseprocesshdrid,
        referencetype: jobDetail.referencetype,
        referenceid: jobDetail.referenceid,
        position: jobDetail.position,
        providerjobid: job.id,
        jobname: job.name,
        issuesid: jobDetail.issuesid ? jobDetail.issuesid : issuesId,
        status: conclusionStatus,
        createdby: jobDetail.createdby,
        lastupdateddt: Date.now(),
      };
      if (jobDetail.jobname !== constants.ORCHESTRATION && jobDetail.jobname !== constants.APPROVAL_WORKFLOW) {
        jobObj.log = workflowLogs;
    }
    return jobObj;
  }catch (e) {
    logger.error(e.message);
  }
    }

  async getStatus(job: any): Promise<any> {
    try {
      let jobStatus;
      if (job.conclusion != null && job.conclusion != undefined) {
        if (job.conclusion == constants.GITHUB_STATUS_SKIPPED) {
          jobStatus = constants.RELEASE_STATUS_PENDING;
        } else if (job.conclusion == constants.GITHUB_STATUS_SUCCESS) {
          jobStatus = constants.RELEASE_STATUS_COMPLETED;
        } else if (job.conclusion == constants.GITHUB_STATUS_FAILED) {
          jobStatus = constants.RELEASE_STATUS_FAILED;
        } else if (job.conclusion == constants.GITHUB_STATUS_CANCELLED) {
          jobStatus = constants.RELEASE_STATUS_CANCELLED;
        } else {
          jobStatus = job.conclusion;
        }
      } else if (job.status != null && job.status != undefined) {
        switch (job.status.toString()) {
          case constants.GITHUB_STATUS_QUEUED:
            jobStatus = constants.RELEASE_STATUS_PENDING;
            break;
          case constants.GITHUB_STATUS_INPROGRESS:
            jobStatus = constants.RELEASE_STATUS_INPROGRESS;
            break;
          case constants.GITHUB_STATUS_SKIPPED:
            jobStatus = constants.RELEASE_STATUS_PENDING;
            break;
          case constants.GITHUB_STATUS_CANCELLED:
            jobStatus = constants.RELEASE_STATUS_CANCELLED;
            break;
          case constants.GITHUB_STATUS_FAILED:
            jobStatus = constants.RELEASE_STATUS_FAILED;
            break;
          case constants.GITHUB_STATUS_SUCCESS:
            jobStatus = constants.RELEASE_STATUS_COMPLETED;
            break;
          default:
            jobStatus = job.status;
        }
      }
      return { jobStatus };
    } catch (e) {
      logger.error(e.message);
      throw e;
    }
  }

}
export default new ReleaseConfigService();

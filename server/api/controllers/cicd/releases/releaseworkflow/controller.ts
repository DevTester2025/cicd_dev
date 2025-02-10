import { customValidation } from "../../../../../common/validation/customValidation";
import { Request, Response } from "express";
import { Service } from "../../../../services/cicd/releases/releaseworkflow.service";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";
import { modules } from "../../../../../common/module";
import db from "../../../../models/model";
import commonService from "../../../../services/common.service";
import { constants } from "../../../../../common/constants";
import _ = require("lodash");
import { Op } from "sequelize";
import { basicValidation } from "../../cicdcommon/validation";
import { messages } from "../../../../../common/messages";


export class Controller {

  //Get Workflow transactions
  all(req: Request, res: Response): void {
    let response = { reference: modules.CICD_RELEASE };
    try {
      new Controller().basicValidation(req.query.tenantid,req.query.startDate,req.query.endDate,)
      let parameters = {
        where: { tenantid: req.query.tenantid },
        include: [
          {
            model: db.ReleaseConfig,
            as: "config",
            attributes: ["name"],
          },
        ],
        order: [["createddt", "DESC"]],
      } as any;
      if (req.query.filters) {
        let filters: any = req.query.filters;
        parameters.where = JSON.parse(filters);
      }
      if (req.query.startDate && req.query.endDate) {  
        let startdate = req.query.startDate as string;
        let enddate = req.query.endDate as string;
        let startDate = new Date(startdate);
        let endDate = new Date(enddate);
        startDate.setHours(0,0,0);
        endDate.setHours(23,59,59);
          parameters.where["createddt"] = {
            [Op.between]: [startDate, endDate],
          };              
      }
      if (req.query.selectedStatus) {
        parameters.where["status"] = req.query.selectedStatus;
      }
      if (req.query.selectedProvider) {
        parameters.where["provider"] = req.query.selectedProvider;
      }
      if (req.query.selectedRepository) {
        parameters.where["reponame"] = req.query.selectedRepository;
      }
      if (req.query.selectedBranch) {
        parameters.where["branch"] = req.query.selectedBranch;
      }
      if (
        typeof req.query.searchText === "string" &&
        req.query.searchText.trim() !== ""
      ) {
        const searchText = req.query.searchText.trim();
        const searchCondition = {
          [Op.or]: [
            { "$config.name$": { [Op.like]: `%${searchText}%` } },
            { commitid: { [Op.like]: `%${searchText}%` } },
          ],
        };
        parameters.where = { ...parameters.where, ...searchCondition };
      }
      if (req.query.limit) {
        parameters.limit = req.query.limit;
      }
      if (req.query.offset) {
        parameters.offset = req.query.offset;
      }
      if (req.query.count) {
        commonService
          .getCountAndList(parameters, db.ReleaseProcessHeader)
          .then((result) => {
            const { count, rows } = result;
            const data = {
              count,
              rows: rows.map((row) => ({
                ...serializeRow(row),
                executiontime: calculateExecutionTime(
                  row.executionstarttime,
                  row.executionendtime
                ),
              })),
            };
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
      } else {
        commonService
          .getAllList(parameters, db.ReleaseProcessHeader)
          .then((list) => {
            const data = {
              count: list.length,
              rows: list.map((row) => ({
                ...serializeRow(row),
                executiontime: calculateExecutionTime(
                  row.executionstarttime,
                  row.executionendtime
                ),
              })),
            };
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
      }
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  //cancelWorkflow
  async cancelWorkflow(req: Request, res: Response): Promise<void> {
    try {
      customValidation.isMandatoryLong(
        req.body.releaseProcessHeaderId,
        "releaseProcessHeaderId",
        1,
        11
      );
      customValidation.isMandatoryLong(req.body.tenantId, "tenantId", 1, 11);
      await new Service().cancelTransaction(req, res).then(async (data) => {
        const octokit = new Octokit({
          auth: data.accessToken,
          request: { fetch },
        });
        await octokit.rest.actions
          .cancelWorkflowRun({
            owner: data.userName,
            repo: data.repoName,
            run_id: data.runId,
          })
          .then((result) => {
            if (result.status === 202) {
              res.json({
                code: 200,
                status: true,
                 message: constants.WORKFLOW_CANCEL});
            } else {
              res.json({
                code: 204,
                status: false,
                message:constants.WORKFLOW_CANCEL_ERROR,
              });
            }
          })
          .catch((error: Error) => {
            res.json({
                code: 204,
                status: false,
                 message: error.message });
          });
      });
    } catch (err) {
      const { message } = err;
      res.json({
        code: 204,
        status: false,
        message: message });
    }
  }

  //Rerun workflow
  async reRunWorkflow(req: Request, res: Response) {
    try {
      customValidation.isMandatoryLong(
        req.body.releaseProcessHeaderId,
        "releaseProcessHeaderId",
        1,
        11
      );
      customValidation.isMandatoryLong(req.body.tenantId, "tenantId", 1, 11);
      await new Service().reRunTransaction(req, res);
    } catch (err) {
      const { message } = err;
      res.json({code: 204,
        status: false,
        message: message });
    }
  }

  //Get Log byId:
  async getWorkflowLog(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.CICD_RELEASE };
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);

      await db.ReleaseProcessDetail.findOne({
        where: { id: req.params.id },
      }).then((result) => {
        if (result != null && result != undefined) {
          const data = JSON.parse(JSON.stringify(result));
          const logData = { log: data.log , status: data.status , jobname: data.jobname };
          customValidation.generateSuccessResponse(
            logData,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        } else {
          return res.send({
            status: false,
            code: 204,
            message: messages.RELEAECONFIG_ERR_MSG[5],
          });
        }
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  //Get WorkflowView
  async getWorkflowView(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.CICD_RELEASE };
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      let condition = {
        where: {
          id: req.params.id,
        },
        include: [
          {
            model: db.ReleaseProcessDetail,
            as: "processdetail",
          },
          {
            model: db.ReleaseConfig,
            as: "config",
          },
        ],
      };
      commonService
        .getData(condition, db.ReleaseProcessHeader)
        .then((result) => {
          if (result != null && result != undefined) {
            const upsertJobDetails: any[] = [];
            result.processdetail.forEach((element) => {
              let data = {
                id: element.id,
                releaseName: result.config.name,
                releaseProcessHdrId: element.releaseprocesshdrid,
                referenceType: element.referencetype,
                position: element.position,
                jobName: element.jobname,
                status: element.status,
                jobId: element.providerjobid,
              };
              upsertJobDetails.push(data);
            });
            let releaseDetail = {
              releaseName: result.config.name,
              processdetail: upsertJobDetails,
            };
            customValidation.generateSuccessResponse(
              releaseDetail,
              response,
              constants.RESPONSE_TYPE_LIST,
              res,
              req
            );
          } else {
            return res.json({
              status: false,
              code: 204,
              message: messages.RELEAECONFIG_ERR_MSG[5],
            });
          }
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  basicValidation(tenant,startDt,endDt){
    customValidation.isMandatoryLong(tenant,'tenantid',1,11);
     basicValidation.isMandatoryDate(startDt, constants.DATE_FORMAT,"startDate");
     basicValidation.isMandatoryDate(endDt,constants.DATE_FORMAT,"endtDate");
     basicValidation.ValidRange(startDt,endDt,"Date");

 }
}
function serializeRow(row: any): any {
  return {
    ...row.toJSON(),
  };
}

function calculateExecutionTime(
  startTime: string,
  endTime: string
): string {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return "-";
  }
  const start = startDate.getTime();
  const end = endDate.getTime();
  const diff = end - start;
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default new Controller();

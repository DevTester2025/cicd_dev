import db from "../../../models/model";
import { constants } from "../../../../common/constants";
import { Request, Response } from "express";
import { ReleaseConfigService } from "./releaseconfig.service";
import logger from "../../../../common/logger";
import { messages } from "../../../../common/messages";



export class Service {

  //Cancel workflow Transaction
  async cancelTransaction(req: any, res: any): Promise<any> {
    try {
      let userName: string;
      let accessToken: string;
      let repoName: string;
      let configId;
      let runId;
      let headerId = Number(req.body.releaseProcessHeaderId);
      let tenantId = req.body.tenantId;
      const releaseHeader = await db.ReleaseProcessHeader.findOne({
        where: {
          id: headerId,
          tenantid: tenantId,
        },
      });
      if (releaseHeader != null && releaseHeader != undefined) {
        const headerStatus = JSON.parse(JSON.stringify(releaseHeader));

        if (
          headerStatus != null &&
          headerStatus != undefined &&
          headerStatus.status == constants.RELEASE_STATUS_INPROGRESS
        ) {
          configId = headerStatus.releaseconfigid;
          runId = headerStatus.providerrunid;
          repoName = headerStatus.reponame;

          const releaseDetail = await db.ReleaseConfig.findOne({
            where: { id: configId, status: constants.STATUS_ACTIVE },
            include: [
              {
                model: db.PipelineTemplate,
                as: "template",
              },
            ],
          });

          if (!releaseDetail) {
            throw new Error(messages.RELEAECONFIG_ERR_MSG[5]);
          }

          const config = JSON.parse(JSON.stringify(releaseDetail));
          const templateDetail = await db.PipelineTemplateDetails.findAll({
            where: {
              templateid: config.templateid,
              status: constants.STATUS_ACTIVE,
            },
            include: [
              {
                model: db.PipelineTemplateDetailConfiguration,
                as: "templatedetailconfig",
                where: { status: constants.STATUS_ACTIVE },
              },
            ],
          });

          const templateDetails = JSON.parse(JSON.stringify(templateDetail));

          const setupdetails: any[] = templateDetails;
          if (setupdetails.length > 0) {
            const firstElement = setupdetails[0];
            const setUpDetailsResponse =
              firstElement.templatedetailconfig.setupdetails;
            const owner = JSON.parse(setUpDetailsResponse);
            userName = owner.username;
            accessToken = owner.accesstoken;

            return {
              userName,
              accessToken,
              repoName,
              runId,
            };
          } else {
            throw new Error(messages.RELEAECONFIG_ERR_MSG[5]);
          }
        } else {
          throw new Error(messages.CANCEL_WORKFLOW_INPROGRESS);
        }
      } else {
        throw new Error(messages.CANCEL_WORKFLOW_DATA_NOT_FOUND);
      }
    } catch (e) {
      logger.error(e.message);
     throw e
    }
  }

  //Rerun workflow Transcation
  async reRunTransaction(req: Request<any>, res: Response<any>) {
    try {
      let configId;
      let headerId = Number(req.body.releaseProcessHeaderId);
      let tenantId = req.body.tenantId;

      const releaseHeader = await db.ReleaseProcessHeader.findOne({
        where: {
          id: headerId,
          tenantid: tenantId,
        },
        include: [
          {
            model: db.ReleaseConfig,
            as: "config",
          },
        ],
      });
      if (releaseHeader != null && releaseHeader != undefined) {
        const headerStatus = JSON.parse(JSON.stringify(releaseHeader));
        if (
          headerStatus != null &&
          headerStatus != undefined &&
          headerStatus.status != constants.RELEASE_STATUS_INPROGRESS &&
          headerStatus.status != constants.RELEASE_STATUS_PENDING
        ) {
          configId = headerStatus.releaseconfigid;
          await new ReleaseConfigService().tiggerReleaseworkflow(configId, headerId, req, res,headerStatus.config.schedule);
        } else {
          throw new Error(
            `Workflow already is in ${headerStatus.status.toLowerCase()}`
          );
        }
      } else {
        throw new Error(messages.CANCEL_WORKFLOW_DATA_NOT_FOUND);
      }
    } catch (e) {
      logger.error(e.message);
      throw e

    }
  }
}
export default new Service();

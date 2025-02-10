import { Request, Response } from "express";
import { Op } from "sequelize";
import db from "../../models/model";
import commonService from "../../services/common.service";
import { getCommitAndSchedule, processApproval, webhookLog } from "./handler";
import logger from "../../../common/logger";


interface AlertBody {
  receiver: string;
  status: string;
  alerts: Alert[];
  groupLabels: CommonAnnotations;
  commonLabels: CommonLabels;
  commonAnnotations: CommonAnnotations;
  externalURL: string;
  version: string;
  groupKey: string;
  truncatedAlerts: number;
  orgId: number;
  title: string;
  state: string;
  message: string;
}

interface Alert {
  status: string;
  labels: Labels;
  annotations: CommonAnnotations;
  startsAt: Date;
  endsAt: Date;
  generatorURL: string;
  fingerprint: string;
  silenceURL: string;
  dashboardURL: string;
  panelURL: string;
  valueString: string;
}

interface CommonAnnotations {}

interface Labels {
  MODE: string;
  alertname: string;
}

interface CommonLabels {
  MODE: string;
}

export interface Notification {
  mode: string;
  receivers: Receiver[];
}

export interface Receiver {
  label: string;
  value: number;
}

const prometheusHook = async (req: Request, res: Response) => {
  const alertBody: AlertBody = req.body;

  const alertIds = alertBody.alerts.map((a) => {
    return parseInt(a.labels.alertname.split("-")[0]);
  });

  const configs = await commonService.getAllList(
    { where: { status: "Active", id: { [Op.in]: alertIds } } },
    db.AlertConfigs
  );
  const configsData: Array<Record<string, any>> = JSON.parse(
    JSON.stringify(configs)
  );

  let userIds = [];

  configsData.forEach((c) => {
    const ntf: Notification[] = JSON.parse(c.ntf_receivers);
    if (ntf && ntf.length > 0) {
      ntf.forEach((n) => {
        userIds.push(
          ...n.receivers.map((r) => {
            return r.value;
          })
        );
      });
    }
  });

  const user = await commonService.getAllList(
    { where: { status: "Active", userid: { [Op.in]: userIds } } },
    db.User
  );
  const userData: Array<Record<string, any>> = JSON.parse(JSON.stringify(user));

  console.log(JSON.parse(JSON.stringify(configs)));
  console.log(userData);

  let notificationData = [];

  configsData.forEach((c) => {
    const ntf: Notification[] = JSON.parse(c.ntf_receivers);

    if (ntf && ntf.length > 0) {
      ntf.forEach((n) => {
        n.receivers.forEach((r) => {
          notificationData.push({
            userid: r.value,
            content: `Threshold limit crossed for instance on alert "${c.title}".`,
            tenantid: c.tenantid,
            eventtype: "EVENT",
            modeofnotification: "Application",
            configuration: "",
            notes: "Notification created",
            status: "Active",
            createdby: "SYSTEM",
            createddt: new Date(),
            lastupdatedby: "SYSTEM",
            lastupdateddt: new Date(),
            interval: null,
            title: `System Alerts for ${c.metric}`,
            deliverystatus: "SENT",
            contenttype: "Text",
          });
        });
      });
    }
  });

  console.log("Notifications data to insert >>>>>>>>>>>>>>>>>>>");
  console.log(notificationData);

  if (notificationData && notificationData.length > 0) {
    await commonService.bulkCreate(notificationData, db.notification);
  }

  return true;
};

export default async function handleWebHook(
  req: Request,
  res: Response
): Promise<void> {
  const headers = req.headers;
  const query = req.query;
  const body = req.body;

  console.log("USER-AGENT+++++++++++++++++++++++");
  console.log(headers["user-agent"]);

  if (headers["user-agent"] == "Grafana") {
    await prometheusHook(req, res);
  }

  db.eventlog.create({
    meta: JSON.stringify({ headers, query, body }),
    createddt: new Date(),
    createdby: "HOOK",
  });

  res.send(true);
}

export async function log(req: Request, res: Response): Promise<any> {
  let response = {};
  try {
      const data = req.body;
      if (data && data.workflow_job && data.workflow_job.run_id) {
        webhookLog(data, req, res);
      }else if(data && data.workflow_run && data.workflow_run.event=="push"|| data.workflow_run && data.workflow_run.event=="schedule"){
        getCommitAndSchedule(data, req, res);
      }else{
        logger.error("WebhookLog data not found");
      }
  } catch (e) {
    logger.error(e);
  }
}

export async function orchestrationAprroval(req: Request, res: Response): Promise<any> {
  try{
    await processApproval(req, res, req.body.orchestrationStatus);
  }
  catch (e) {
    logger.error(e);
  }
}

export async function manualAprroval(req: Request, res: Response): Promise<any> {
  try{
    await  processApproval(req, res, req.body.workflowStatus);
  }
  catch (e) {
    logger.error(e);
  }
}

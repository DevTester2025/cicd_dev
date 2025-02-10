import { Request, Response } from "express";
import { Op } from "sequelize";
import db from "../../../models/model";
import CommonService from "../../../services/common.service";
import { constants } from "../../../../common/constants";
import { customValidation } from "../../../../common/validation/customValidation";
import IORedis = require("ioredis");
import { Queue } from "bullmq";
import _ = require("lodash");
import sequelize = require("sequelize");

export async function getSchedules(req: Request, res: Response) {
  try {
    let condition: any = {
      where: {
        status: "Active",
      },
      include: [
        {
          model: db.Tags,
          as: "tag",
          required: false,
          paranoid: true,
          attributes: ["tagname", "tagid"],
        },
        {
          model: db.Customer,
          as: "customer",
          required: false,
          paranoid: true,
          attributes: ["customername", "customerid"],
        },
        {
          model: db.CustomerAccount,
          as: "account",
          required: false,
          paranoid: true,
          attributes: ["name", "id"],
        },
        {
          model: db.Orchestration,
          as: "orchestration",
          required: false,
          paranoid: true,
          attributes: ["orchname", "orchid"],
        },
        {
          model: db.MaintWindow,
          as: "maintwindow",
          required: false,
          paranoid: true,
          attributes: ["windowname", "maintwindowid"],
        },
      ],
    };
    if (req.body.schedulestatus == "Completed") {
      condition["where"]["totalrun"] = {
        [Op.eq]: sequelize.col("expectedrun"),
      };
    } else if (req.body.schedulestatus == "Active") {
      condition["where"]["expectedrun"] = {
        [Op.gt]: sequelize.col("totalrun"),
      };
    }
    if (req.query.instanceids) {
      condition.where.instances = req.query.instanceids;
    }
    if (req.query.instancerefids) {
      condition.where.instances = req.query.instancerefids;
    }
    if (req.body.searchText) {
      let searchparams: any = {};
      searchparams["title"] = {
        $like: "%" + req.body.searchText + "%",
      };
      searchparams["$orchestration.orchname$"] = {
        $like: "%" + req.body.searchText + "%",
      };
      condition.where = _.omit(condition.where, ["searchText", "headers"]);
      condition.where["$or"] = searchparams;
    }
    const data = await db.OrchestrationSchedule.findAll(condition);

    res.send({
      status: true,
      code: 200,
      message: "Failed to save details",
      data,
    });
  } catch (error) {
    customValidation.generateErrorMsg(
      error,
      res,
      constants.RESPONSE_TYPE_SAVE,
      req
    );
  }
}

export async function updateSchedule(req: Request, res: Response) {
  try {
    const data = await db.OrchestrationSchedule.update(req.body, {
      where: {
        id: req.params.id,
      },
    });

    customValidation.generateSuccessResponse(
      data,
      {},
      constants.RESPONSE_TYPE_SAVE,
      res,
      req
    );
  } catch (error) {
    customValidation.generateAppError(error, {}, res, req);
  }
}

export async function deleteSchedule(req: Request, res: Response) {
  try {
    const conn = new IORedis({
      host: process.env.APP_REDIS_HOST,
      password: process.env.APP_REDIS_PASS,
      port: parseInt(process.env.APP_REDIS_PORT),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    }).setMaxListeners(0);

    const schedulerQueue = new Queue(constants.QUEUE.ORCH_RUN_SCHEDULER, {
      connection: conn,
    });

    const schedQueueId = "SCHED-QUEUE-" + req.params.id;

    console.log("To Remove .>>>>>> ", schedQueueId);
    const j = await schedulerQueue.getJob(schedQueueId);
    const r = await schedulerQueue.remove(schedQueueId);

    console.log("Detail .>>>>>> ", j, r);

    const data = await db.OrchestrationSchedule.update(
      {
        status: "Deleted",
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );

    customValidation.generateSuccessResponse(
      data,
      {},
      constants.RESPONSE_TYPE_DELETE,
      res,
      req
    );
  } catch (error) {
    customValidation.generateAppError(error, {}, res, req);
  }
}

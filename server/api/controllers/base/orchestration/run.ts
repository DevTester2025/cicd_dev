import { Request, Response } from "express";
import db from "../../../models/model";
import CommonService from "../../../services/common.service";
import { constants } from "../../../../common/constants";
import { customValidation } from "../../../../common/validation/customValidation";
import { Queue } from "bullmq";
import IORedis = require("ioredis");
import { differenceInMilliseconds } from "date-fns";
import LokiService from "../../../services/logging/loki.service";
import ScheduleService from "../../../services/orchestration/schedule";

// export default async function runOrchestration(req: Request, res: Response) {
//   try {
//     let scripts = [];
//     let appLog = new AppLogger(process.cwd() + `/instances/test/`, "test.log");

//     const orchestration = await CommonService.getById(
//       req.body.orchid,
//       db.Orchestration
//     );

//     const instances = await CommonService.getAllList(
//       {
//         where: {
//           status: "Active",
//           tenantid: req.body.tenantid,
//           instanceid: {
//             [Op.in]: req.body.instances,
//           },
//         },
//       },
//       db.Instances
//     );

//     let scriptsFromOrch = orchestration["scripts"]
//       ? JSON.parse(orchestration["scripts"])
//       : null;

//     if (scriptsFromOrch) {
//       scriptsFromOrch.forEach((element) => {
//         CommonService.readS3File("Scripts/" + element["scriptname"])
//           .then((data) => {
//             console.log("Scripts data", data);
//             if (data) {
//               fs.writeFile(
//                 process.cwd() + "/public/Scripts/" + element["scriptname"],
//                 data,
//                 function (err) {
//                   if (err) {
//                     throw err;
//                   } else {
//                     console.log("Successfully file created in local");
//                   }
//                 }
//               );
//             }
//           })
//           .catch((err) => {
//             throw err;
//           });
//       });
//       scriptsFromOrch.forEach((element) => {
//         scripts.push(
//           process.cwd() + "/public/Scripts/" + element["scriptname"]
//         );
//       });
//     }

//     const orchFlow = JSON.parse(orchestration["orchflow"]);
//     const orchData = {
//       sys_ip: instances[0]["publicipv4"],
//       sys_ts_ip: instances[0]["publicipv4"],
//       sys_name: instances[0]["instancename"],
//       sys_host_ip: null,
//       sys_deploymentid: "355",
//       message: "Good",
//       status: "Active",
//     };

//     // let orch = new Orchestrate(orchFlow, orchData, {
//     //   logger: appLog,
//     // });

//     // orch.start();

//     res.send({ orchFlow, orchData, orchestration, instances });
//   } catch (error) {
//     customValidation.generateSuccessResponse(
//       error,
//       res,
//       constants.RESPONSE_TYPE_SAVE,
//       res,
//       req
//     );
//   }
// }

export async function getInstancesByFilter(req: Request, res: Response) {
  try {
    const data = req.body;

    const condition = { status: "Active", tenantid: data._tenant };
    const includes = [];
    if (data.ssmagent) {
      condition["ssmagent"] = data.ssmagent;
    }
    if (data._account) {
      condition["accountid"] = data._account;
    }
    if (data._customer) {
      condition["customerid"] = data._customer;
    }
    if (data.region) {
      condition["region"] = data.region;
    }
    if (data._tag) {
      const joinWhere = {
        tagid: data._tag,
        status: "Active",
      };

      if (data.tagvalue) {
        joinWhere["tagvalue"] = data.tagvalue;
      }

      const join = {
        model: db.TagValues,
        as: "tagvalues",
        paranoid: true,
        required: true,
        where: joinWhere,
        attributes: ["tagvalueid"],
      };

      includes.push(join);
    }

    const instancesToProcess = await db.Instances.findAll({
      where: condition,
      attributes: [
        "instancerefid",
        "instanceid",
        "instancename",
        "customerid",
        "tenantid",
        "publicipv4",
        "privateipv4",
      ],
      include: includes,
    });
    customValidation.generateSuccessResponse(
      instancesToProcess,
      {},
      constants.RESPONSE_TYPE_LIST,
      res,
      req
    );
  } catch (error) {
    console.log("Error in getting instances based on filter >>>>>");
    console.log(error);
    customValidation.generateErrorMsg(
      error,
      res,
      constants.RESPONSE_TYPE_SAVE,
      req
    );
  }
}


export default function runOrchestration(req: Request, res: Response) {
  try {
    const conn = new IORedis({
      host: process.env.APP_REDIS_HOST,
      password: process.env.APP_REDIS_PASS,
      port: parseInt(process.env.APP_REDIS_PORT),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      db: parseInt(process.env.APP_REDIS_ORCH_DB),
    }).setMaxListeners(0);

    const schedulerQueue = new Queue(constants.QUEUE.ORCH_RUN_SCHEDULER, {
      connection: conn,
    });

    const groups = req.body.rungroups;
    let hdrData: any = {};
    const header = req.body.headers.map(h => {
      return CommonService.create({
        title: h.title,
        orchid: req.body._orch,
        totalrun: h.value ? h.value.length : 0,
        tenantid: req.body._tenant,
        pendingrun: h.value ? h.value.length : 0,
        ...req.body,
        status: constants.STATUS_PENDING
      }, db.OrchestrationScheduleHdr).then((op)=>{
        if(op){
          hdrData[h.title] = op.dataValues.scdlid
        }
        })
    })
    Promise.all(header).then(()=> {
      const scheduled = groups.map((g) => {
        let title = g.title;
        delete g.title;
        let orchObj = {
          ...req.body,
          instances: JSON.stringify(g),
        };
        if (req.body.scheduled == true) { orchObj.runtimestamp = g.runtimestamp }
        return ScheduleService.scheduleOrchestrationRun(
          schedulerQueue,
          orchObj,
          title,
          hdrData[g.groupname]
        );
      })
      return Promise.all(scheduled);
    })
    customValidation.generateSuccessResponse(
      null,
      {},
      constants.RESPONSE_TYPE_SAVE,
      res,
      req
    );
  } catch (error) {
    console.log("Error in run ts >>>>>");
    console.log(error);
    LokiService.createLog(
      {
        message: "Error scheduling orchestration.",
        reference: "ORCH-RUN",
        error: String(error),
      },
      "ERROR"
    );
    customValidation.generateErrorMsg(
      error,
      res,
      constants.RESPONSE_TYPE_SAVE,
      req
    );
  }
}

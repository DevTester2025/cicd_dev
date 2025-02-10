import { Request, Response } from "express";
import { Op } from "sequelize";
import db from "../../../models/model";
import { customValidation } from "../../../../common/validation/customValidation";
import * as _ from "lodash";

export async function getLogs(req: Request, res: Response) {
  try {
    let condition = {
      where: {} as any,
      include: [] as any,
    } as any;
    condition = {
      where: {
        ...req.body,
        status: {
          [Op.ne]: "Deleted",
        },
      },
      include: [
        {
          model: db.OrchestrationSchedule,
          as: "schedule",
          required: true,
          paranoid: true,
          where: {},
          include: [
            {
              model: db.Orchestration,
              as: "orchestration",
              required: false,
              paranoid: true,
              attributes: ["orchname", "orchid"],
              where: {} as any,
            },
          ],
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
          model: db.Instances,
          as: "instance",
          required: false,
          paranoid: true,
          attributes: ["instancename", "instanceid"],
        },
      ],
    } as any;

    if (req.body.startdate && req.body.enddate) {
      condition["where"]["createddt"] = {
        $between: [req.body.startdate, req.body.enddate],
      };
      condition["where"] = _.omit(condition["where"], ["startdate", "enddate"]);
    }
    if (req.body.status) {
      condition["where"]["status"] = req.body.status;
    }
    if (req.body.orchid) {
      condition["include"][0] = {
        model: db.OrchestrationSchedule,
        as: "schedule",
        required: true,
        paranoid: true,
        include: [
          {
            model: db.Orchestration,
            as: "orchestration",
            required: true,
            attributes: ["orchname", "orchid"],
            where: {
              orchid: req.body.orchid,
            },
          },
        ],
      };
      condition["where"] = _.omit(condition["where"], ["orchid"]);
    }
    if (req.body.exptrids && req.body.exptrids.length > 0) {
      condition["include"][0]["where"]["exptrid"] = { [Op.in]: req.body.exptrids };
      condition["where"] = _.omit(condition["where"], ["exptrids"]);
    }
    if (req.body.scdlid) {
      condition["include"][0]["where"]["scdlid"] = req.body.scdlid;
      condition["where"] = _.omit(condition["where"], ["scdlid"]);
    }
    if (req.query.order as any) {
      let order: any = req.query.order;
      let splittedOrder = order.split(",");
      condition["order"] = [splittedOrder];
      if(splittedOrder[0] == 'orchname'){
        condition.order = [
          [{ model: db.OrchestrationSchedule, as: "schedule" }, { model: db.Orchestration, as: "orchestration" }, "orchname", splittedOrder[1]],
        ];
      }
      if(splittedOrder[0] == 'title'){
        condition.order = [
          [{ model: db.OrchestrationSchedule, as: "schedule" }, "title", splittedOrder[1]],
        ];
      }
    };
    if (req.query.limit) {
      condition["limit"] = Number(req.query.limit);
    };
    if (req.query.offset) {
      condition["offset"] = Number(req.query.offset);
    };
    if (req.body.searchText) {
      let searchparams: any = {};
      searchparams["$schedule.orchestration.orchname$"] = {
        $like: "%" + req.body.searchText + "%",
      };
      searchparams["$schedule.title$"] = {
        $like: "%" + req.body.searchText + "%",
      };
      searchparams["status"] = {
        $like: "%" + req.body.searchText + "%",
      };
      condition.where = _.omit(condition.where, ["searchText", "headers"]);
      condition.where["$or"] = searchparams;
    }
    condition.where = _.omit(condition.where, ["order"]);
    const data = await db.OrchestrationLog.findAndCountAll(condition);

    res.send({
      status: true,
      code: 200,
      message: "Log details",
      data: data.rows,
      count: data.count,
    });
  } catch (error) {
    customValidation.generateErrorMsg(error, res, 500, req);
  }
}

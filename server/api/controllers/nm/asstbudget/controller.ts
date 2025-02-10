import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants, CMApiURL } from "../../../../common/constants";
import _ = require("lodash");
import { AppError } from "../../../../common/appError";
import axios from "axios";
import { endOfMonth } from "date-fns";
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters = { where: req.body, order: [["lastupdateddt", "desc"]] };
      parameters.include = [
        {
          model: db.Customer,
          as: "customer",
          attributes: ["customername"],
          required: false,
        },
        {
          model: db.CustomerAccount,
          as: "account",
          attributes: ["name", "id"],
          required: false,
        },
        {
          model: db.Tags,
          as: "tag",
          attributes: ["tagname", "tagid"],
          required: false,
        },
      ];
      if (req.query.filterbudget) {
        parameters.where = {};
        parameters.where = {
          status: req.body.status,
          cloudprovider: req.body.cloudprovider,
          $or: [
            {
              $and: [
                { resourcetype: req.body.resourcetype },
                {
                  instancerefid: {
                    $like: "%" + req.body.instancerefid.join(",") + "%",
                  },
                },
              ],
            },
            {
              $and: [
                { cloudprovider: req.body.cloudprovider },
                { customerid: req.body.customerid },
              ],
            },
            {
              $and: [
                { cloudprovider: req.body.cloudprovider },
                { customerid: -1 },
                { resourcetype: "All" },
              ],
            },
          ],
        };
        if (req.body.accountid) parameters.where._accountid = req.body.accountid;
      }
      if (req.query.isdownload) {
        parameters.where = _.omit(req.body, ["headers", "order"]);
        CommonService.getAllList(parameters, db.AsstBudget)
          .then((list) => {

            let template = {
              content: AssetListTemplate,
              engine: "handlebars",
              helpers: CommonHelper,
              recipe: "html-to-xlsx",
            };

            let data = { lists: list, headers: req.body.headers };
            DownloadService.generateFile(data, template, (result) => {
              customValidation.generateSuccessResponse(
                result,
                response,
                constants.RESPONSE_TYPE_LIST,
                res,
                req
              );
            });

          })
          .catch((error: Error) => {
            console.log("Error fetching list", error);
            customValidation.generateAppError(error, response, res, req);
          });
      }
      else {
        CommonService.getAllList(parameters, db.AsstBudget)
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

  byId(req: Request, res: Response): void {
    let response = {};
    try {
      let query = {} as any;
      query.where = {
        budgetid: req.params.id,
      };
      query.include = [
        {
          model: db.Customer,
          as: "customer",
          attributes: ["customername"],
          required: false,
        },
        {
          model: db.Tags,
          as: "tag",
          attributes: ["tagname", "tagid"],
          required: false,
        },
      ];
      CommonService.getData(query, db.AsstBudget)
        .then((data) => {
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  create(req: any, res: Response): void {
    let response = {};
    try {
      let condition = {
        status: "Active",
      } as any;
      if (req.body.startdt && req.body.enddt) {
        condition["startdt"] = { $gte: req.body.startdt };
        condition["enddt"] = { $lte: req.body.enddt };
      }
      if (req.body.cloudprovider) {
        condition["cloudprovider"] = req.body.cloudprovider;
      }
      if (req.body.tenantid) {
        condition["tenantid"] = req.body.tenantid;
      }
      if (req.body.customerid) {
        condition["customerid"] = req.body.customerid;
      }
      if (req.body.resourcetype) {
        condition["resourcetype"] = req.body.resourcetype;
      }
      if (req.body.resourceid && req.body.resourceid.length > 0) {
        condition["resourceid"] = {
          $like: "%" + req.body.resourceid.join(",") + "%",
        };
      }
      CommonService.getOrSave(condition, req.body, db.AsstBudget, [])
        .then((data) => {
          if (data != null && data[1] === false) {
            throw new AppError("Already exist");
          } else {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async download(req: Request, res: Response) {
    const body: {
      startdt: string;
      enddt: string;
      tenantid: number;
      cloudprovider: string;
      budgetvalue: number;
    } = req.body;

    const { data } = await axios.post(CMApiURL.BILLING_SUMMARY, body, {
      headers: {
        "x-auth-header": (req as any).access_token,
      },
    });
    const monthWiseBilling: {
      actualamount: string;
      monthname: string;
    }[] = data.data;

    let csv = [];

    console.log("Total month wise billing >>>>>>>>", monthWiseBilling.length);

    while (monthWiseBilling.length > 0) {
      const currentPeriod = monthWiseBilling.pop();

      const bills = await db.AsstBilling.findAll({
        where: {
          // cloud_resourceid: {
          //   [db.sequelize.Op.ne]: null,
          // },
          status: "Active",
          billingdt: {
            $between: [
              CommonService.formatDate(
                new Date("01-" + currentPeriod.monthname),
                "yyyy-MM-d",
                false
              ),
              CommonService.formatDate(
                endOfMonth(new Date("01-" + currentPeriod.monthname)),
                "yyyy-MM-d",
                false
              ),
            ],
          },
        },
        include: [
          {
            model: db.Customer,
            as: "_customer",
            attributes: [
              ["customername", "title"],
              ["customerid", "value"],
            ],
            required: false,
            where: { status: constants.STATUS_ACTIVE },
          },
          {
            model: db.CustomerAccount,
            as: "_account",
            attributes: [
              ["name", "title"],
              ["id", "value"],
            ],
            required: false,
            where: { status: constants.STATUS_ACTIVE },
          },
        ],
        order: ["billingdt", "resourcetype"],
      });

      if (bills && bills.length > 0) {
        bills.forEach((b) => {
          csv.push({
            Month: currentPeriod.monthname,
            "Budgeted value": body.budgetvalue,
            "Actual value": parseFloat(currentPeriod.actualamount).toFixed(2),
            Customer: b.dataValues["_customer"].dataValues["title"],
            "Customer account": b.dataValues["_account"].dataValues["title"],
            resourcetype: b.dataValues["resourcetype"],
            resource: b.dataValues["cloud_resourceid"],
            billingdt: b.dataValues["billingdt"],
            billamount: b.dataValues["billamount"],
          });
        });
      }

      console.log(
        "Current month wise billing length >>>>",
        monthWiseBilling.length
      );
      if (monthWiseBilling.length <= 0) {
        res.send(csv);
      }
    }
  }

  update(req: any, res: Response): void {
    let response = {};
    try {
      let condition = { budgetid: req.body.budgetid };
      console.log(req.body);
      CommonService.update(condition, req.body, db.AsstBudget)
        .then((data: any) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_UPDATE,
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

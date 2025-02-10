import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import reportService from "../../../services/report.service";
import { queries } from "../../../../common/query";
import sequelize = require("sequelize");

export class Controller {
  constructor() {}
  getChart(req: Request, res: Response): void {
    const response = {};
    try {
      let q = queries.MONTHLY_ASSTBILLING;
      let params = {
        replacements: {
          startdt: req.body.startdt,
          enddt: req.body.enddt,
        },
        type: db.sequelize.QueryTypes.SELECT,
      } as any;
      if (req.query.summarydtl && req.body.cloudprovider != "AWS") {
        q = queries.MONTHLY_ASSTBILLING_DETAIL;
      } else if (req.query.summarydtl && req.body.cloudprovider == "AWS") {
        q = queries.MONTHLY_AWS_ASSTBILLING_DETAIL;
      }
      let instancesubquery = "";
      let tagsubquery = "";
      if (req.body.customerid) {
        q = q + ` AND ab.customerid = :customerid`;
        params.replacements["customerid"] = req.body.customerid;
      }
      if (req.body.accountid) {
        q = q + ` AND ab._accountid = :accountid`;
        params.replacements["accountid"] = req.body.accountid;
      }
      if (req.body.cloudprovider) {
        if (req.query.summarydtl) {
          q =
            q +
            ` AND ab.cloudprovider = :cloudprovider AND ab.cloud_resourceid is null`;
        } else if (req.body.tagid && req.body.tagvalues) {
          q =
            q +
            ` AND ab.cloudprovider = :cloudprovider AND ab.cloud_resourceid is not null`;
        } else if (req.body.tagid && !req.body.tagvalues) {
          q =
            q +
            ` AND ab.cloudprovider = :cloudprovider AND ab.cloud_resourceid is not null`;
        } else {
          q =
            q +
            ` AND ab.cloudprovider = :cloudprovider AND ab.cloud_resourceid is null`;
        }

        params.replacements["cloudprovider"] = req.body.cloudprovider;
      }
      if (req.body.resourcetype && req.body.resourcetype != "All") {
        q = q + ` AND ab.resourcetype = :resourcetype`;
        params.replacements["resourcetype"] = req.body.resourcetype;
      }
      if (req.body.resourceids && req.body.resourceids.length > 0) {
        q = q + ` AND ab.instancerefid IN :resourceids`;
        params.replacements["resourceids"] = [req.body.resourceids];
        instancesubquery = ` INNER JOIN tbl_tn_instances i on ab.instancerefid = i.instancerefid`;
      }
      // if (req.body.tagid) {
      //     q = q + ` AND t.tagid = :tagid`;
      //     params.replacements['tagid'] = req.body.tagid;
      //     tagsubquery = ` LEFT JOIN tbl_tn_instances i on ab.instancerefid = i.instancerefid LEFT JOIN tbl_bs_tag_values tv on i.instanceid = tv.resourceid LEFT OUTER JOIN tbl_bs_tags t on tv.tagid = t.tagid`;
      // }
      if (req.body.tagid && req.body.tagvalues) {
        // q = q + ` AND tv.tagvalue IN :tagvalue`;
        // params.replacements['tagvalue'] = [req.body.tagvalues];
        tagsubquery = ` INNER JOIN tbl_tn_instances i on ab.cloud_resourceid = i.instancerefid  INNER JOIN tbl_bs_tag_values tv on i.instanceid = tv.resourceid AND tv.tagvalue IN ('${req.body.tagvalues}') AND tv.status = "Active" INNER JOIN tbl_bs_tags t on tv.tagid = t.tagid AND t.tagid = ${req.body.tagid}`;
      }
      if (req.body.tagid && !req.body.tagvalues) {
        // q = q + ` AND tv.tagvalue IN :tagvalue`;
        // params.replacements['tagvalue'] = [req.body.tagvalues];
        tagsubquery = ` INNER JOIN tbl_tn_instances i on ab.cloud_resourceid = i.instancerefid  INNER JOIN tbl_bs_tag_values tv on i.instanceid = tv.resourceid AND tv.status = "Active" AND tv.tagid IN (${req.body.tagid})`;
      }
      if (req.body.resourcetype == "All") {
        q =
          q +
          ` AND ab.resourcetype NOT IN ('ASSET_INSTANCE','TOTAL_BILLING_COST')`;
      }
      q = q.replace(new RegExp(":instancesubquery:", "g"), instancesubquery);
      q = q.replace(new RegExp(":tagsubquery:", "g"), tagsubquery);

      // if (req.body.instancerefid) {
      //     q = q + ` AND ab.instancerefid = :instancerefid`;
      //     params.replacements['instancerefid'] = req.body.instancerefid;
      // }
      if (req.query.summarydtl && req.body.cloudprovider != "AWS") {
        q = q + ` GROUP BY assettype,ab.billingdt order by billingdt asc;`;
      } else if (req.query.summarydtl && req.body.cloudprovider == "AWS") {
        q = q + ` GROUP BY assettype order by actualamount desc;`;
      } else {
        q = q + ` GROUP BY monthname order by billingdt asc;`;
      }
      params.type = sequelize.QueryTypes.SELECT;
      CommonService.executeQuery(q, params, db.sequelize)
        .then((list) => {
          if (req.body.cloudprovider == "AWS" && req.query.summarydtl) {
            let i = 0;
            let newBilling = [] as any;
            let otherBill = 0;
            for (let bill of list) {
              if (i > 14) {
                otherBill += bill.actualamount;
              } else {
                newBilling.push(bill);
              }
              i++;
            }
            newBilling = [
              { actualamount: otherBill, assettype: "Others" },
              ...newBilling,
            ];
            console.log(newBilling);
            customValidation.generateSuccessResponse(
              newBilling,
              response,
              constants.RESPONSE_TYPE_LIST,
              res,
              req
            );
          } else {
            customValidation.generateSuccessResponse(
              list,
              response,
              constants.RESPONSE_TYPE_LIST,
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
  async all(req: Request, res: Response): Promise<void> {
    const body: {
      billingdates: string[];
      duration: "Day" | "Week" | "Month";
      tenantid: number;
      groupby?: string;
      filters?: Record<string, string[] | number[]>;
      tagid?: number;
      tagvalue?: string;
    } = req.body;

    const response = {};
    try {
      let parameters = {
        billingdt: {
          $between: [body.billingdates[0], body.billingdates[1]],
        },
        tenantid: body.tenantid,
      };

      if (body.groupby && body.groupby == "cloud_resourceid") {
        parameters["cloud_resourceid"] = {
          [sequelize.Op.ne]: null,
        };
      } else {
        if (req.body.cloud_resourceid) {
          parameters["cloud_resourceid"] = req.body.cloud_resourceid;
        } else {
          parameters["cloud_resourceid"] = {
            [sequelize.Op.eq]: null,
          };
        }
      }

      if (body.tagid) {
        let q = `
          select
            tti.instancerefid
          from
            tbl_tn_instances tti
          inner join tbl_bs_tag_values tv on
            tti.instancerefid = tv.resourcerefid
            and tv.tagid in (${body.tagid}) ${
          body.tagvalue && body.tagvalue.length > 0
            ? "and tv.tagvalue in ('" + body.tagvalue + "')"
            : ""
        }
          where
            tti.status = "Active" group by tti.instancerefid
        `;
        const cloud_resourceids = await db.sequelize.query(q, {
          type: db.Sequelize.QueryTypes.SELECT,
        });

        if (cloud_resourceids && cloud_resourceids.length > 0) {
          parameters["cloud_resourceid"] = {
            [sequelize.Op.in]: cloud_resourceids.map((o) => {
              return o["instancerefid"];
            }),
          };
        } else {
          customValidation.generateSuccessResponse(
            [],
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
          return;
        }
      }

      let attributes: sequelize.FindOptionsAttributesArray = [
        [
          sequelize.literal(
            body.duration == "Day"
              ? `DATE_FORMAT(billingdt,"%d-%b-%Y")`
              : body.duration == "Week"
              ? `CONCAT('Week ',1 + DATE_FORMAT(billingdt, "%U"))`
              : body.duration == "Month"
              ? `DATE_FORMAT(LAST_DAY(billingdt),"%M-%Y")`
              : `DATE_FORMAT(billingdt,"%d-%b-%Y")`
          ),
          "x",
        ],
        [sequelize.fn("sum", sequelize.col("billamount")), "y"],
      ];
      let groups = ["x"];
      let includes = [];
      if (body.groupby) {
        attributes.push([body.groupby, "xy"]);
        groups.push(`\`AsstBilling\`.\`${body.groupby}\``);

        if (body.groupby == "customerid") {
          includes.push({
            model: db.Customer,
            as: "_customer",
            attributes: [
              ["customername", "title"],
              ["customerid", "value"],
            ],
            required: false,
            where: { status: constants.STATUS_ACTIVE },
          });
        }
        if (body.groupby == "_accountid") {
          includes.push({
            model: db.CustomerAccount,
            as: "_account",
            attributes: [
              [
                sequelize.fn(
                  "concat",
                  sequelize.col("name"),
                  " (",
                  sequelize.col("accountref"),
                  ")"
                ),
                "title",
              ],
              ["id", "value"],
            ],
            required: false,
            where: { status: constants.STATUS_ACTIVE },
          });
        }
      }

      for (const key in body.filters) {
        if (Object.prototype.hasOwnProperty.call(body.filters, key)) {
          const value = body.filters[key];
          parameters[key] = {
            [sequelize.Op.in]: value,
          };
        }
      }

      console.log("Parameters is >>>");
      console.log(parameters);

      db.AsstBilling.findAll({
        attributes: attributes,
        group: groups,
        where: parameters,
        include: includes,
        order: [["billingdt", "ASC"]],
      })
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((err) => {
          console.log("Error getting billing detail.");
          console.log(err);
          customValidation.generateAppError(err, response, res, req);
        });

      // let parameters = {} as any;
      // parameters = { where: req.body, order: [["billingdt", "asc"]] };
      // if (req.body.billingdates) {
      //   parameters.where["billingdt"] = {
      // $between: [
      //   CommonService.formatDate(
      //     new Date(req.body.billingdates[0]),
      //     "yyyy-MM-d",
      //     false
      //   ),
      //   CommonService.formatDate(
      //     new Date(req.body.billingdates[1]),
      //     "yyyy-MM-d",
      //     false
      //   ),
      // ],
      //   };
      //   delete parameters.where["billingdates"];
      // }
      // if (!req.query.filterby) {
      //   parameters.order = [
      //     ["billingdt", "asc"],
      //     ["resourceid", "desc"],
      //     ["resourceid", "desc"],
      //   ];
      //   parameters.include = [
      // {
      //   model: db.Customer,
      //   as: "customer",
      //   attributes: ["customername", "customerid"],
      //   required: false,
      //   where: { status: constants.STATUS_ACTIVE },
      // },
      //     {
      //       model: db.Instances,
      //       as: "instance",
      //       attributes: ["instancename", "instanceid"],
      //       required: false,
      //       include: [],
      //       where: { status: constants.STATUS_ACTIVE },
      //     },
      //   ];
      //   if (req.body.resource) {
      //     parameters.include[1].where.instanceid = { $in: req.body.resource };
      //     parameters.include[1].required = true;
      //     delete parameters.where["resource"];
      //   }
      //   if (req.body.tagvalues) {
      //     parameters.include[1].required = true;
      //     parameters.include[1].include.push({
      //       model: db.TagValues,
      //       as: "tagvalues",
      //       attributes: ["tagvalue"],
      //       where: {
      //         tagvalue: req.body.tagvalues,
      //         status: constants.STATUS_ACTIVE,
      //       },
      //       include: [
      //         {
      //           model: db.Tags,
      //           as: "tag",
      //           attributes: ["tagname"],
      //           where: {
      //             tagid: req.body.tagname,
      //             status: constants.STATUS_ACTIVE,
      //           },
      //         },
      //       ],
      //     });
      //     delete parameters.where["tagvalues"];
      //     delete parameters.where["tagname"];
      //   }
      // }
      // CommonService.getAllList(parameters, db.AsstBilling)
      //   .then((list) => {
      // customValidation.generateSuccessResponse(
      //   list,
      //   response,
      //   constants.RESPONSE_TYPE_LIST,
      //   res,
      //   req
      // );
      //   })
      //   .catch((error: Error) => {
      //     customValidation.generateAppError(error, response, res, req);
      //   });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  getFilterValues(req: Request, res: Response): void {
    let parameters = {
      status: constants.STATUS_ACTIVE,
      tenantid: req.body.tenantid,
    };
    if (req.body.filters.customerid) {
      parameters["customerid"] = { $in: req.body.filters.customerid };
    }
    if (req.body.filters._accountid) {
      parameters["_accountid"] = { $in: req.body.filters._accountid };
    }
    db.AsstBilling.findAll({
      where: parameters,
      include: [
        {
          model: db.CustomerAccount,
          as: "_account",
          attributes: [
            [
              sequelize.fn(
                "concat",
                sequelize.col("name"),
                " (",
                sequelize.col("accountref"),
                ")"
              ),
              "title",
            ],
            ["id", "value"],
          ],
          required: false,
          where: {
            status: constants.STATUS_ACTIVE,
            tenantid: req.body.tenantid,
          },
        },
        {
          model: db.Customer,
          as: "_customer",
          attributes: [
            ["customername", "title"],
            ["customerid", "value"],
          ],
          required: false,
          where: {
            status: constants.STATUS_ACTIVE,
            tenantid: req.body.tenantid,
          },
        },
      ],
      group: [req.query.key],
    })
      .then((data) => {
        customValidation.generateSuccessResponse(
          data,
          {},
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      })
      .catch((err) => {
        console.log("Error getting billing detail.");
        console.log(err);
        customValidation.generateAppError(err, {}, res, req);
      });
  }

  getResourceBilling(req: Request, res: Response): void {
    const body: {
      startdate: Date;
      enddate: Date;
      tenantid: number;
      resourcetype?: string;
      filters: Record<string, any>;
    } = req.body;

    let parameters = {
      tenantid: body.tenantid,
      status: "Active",
      billingdt: {
        [sequelize.Op.between]: [
          CommonService.formatDate(
            new Date(body.startdate),
            "yyyy-MM-d",
            false
          ),
          CommonService.formatDate(new Date(body.enddate), "yyyy-MM-d", false),
        ],
      },
    };

    const attributes = [
      "resourcetype",
      ["cloud_resourceid", "resourceid"],
      ["billingdt", "date"],
      [sequelize.fn("sum", sequelize.col("billamount")), "cost"],
    ] as any;

    const groups = ["billingdt"];

    if (body.resourcetype) {
      parameters["resourcetype"] = body.resourcetype;
      parameters["cloud_resourceid"] = {
        [sequelize.Op.ne]: null,
      };
      groups.push("cloud_resourceid");
    } else {
      groups.push("resourcetype");
      parameters["cloud_resourceid"] = {
        [sequelize.Op.eq]: null,
      };
    }

    if (Object.keys(body.filters).length <= 0) {
      parameters["cloud_resourceid"] = {
        [sequelize.Op.ne]: null,
      };
    }else{
      parameters = {
        ...body.filters,
        ...parameters
      }
    }

    let condition = {
      attributes: attributes,
      group: groups,
      where: parameters,
    };
    if (req.body.order) {
      condition["order"] = [req.body.order];
      if (req.body.order[0] == "cost")
        condition["order"] = [
          [sequelize.fn("sum", sequelize.col("billamount")), req.body.order[1]],
        ];
    }
    db.AsstBilling.findAll(condition)
      .then((data) => {
        customValidation.generateSuccessResponse(
          data,
          {},
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      })
      .catch((err) => {
        console.log("Error getting billing detail.");
        console.log(err);
        customValidation.generateAppError(err, {}, res, req);
      });
  }

  byId(req: Request, res: Response): void {
    let response = {};
    try {
      let query = {} as any;
      query.where = {
        billingid: req.params.id,
      };

      CommonService.getData(query, db.AsstBilling)
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
      CommonService.create(req.body, db.AsstBilling)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
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

  update(req: any, res: Response): void {
    let response = {};
    try {
      let condition = { billingid: req.body.billingid };
      CommonService.update(condition, req.body, db.AsstBilling)
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

  getDailyBilling(req: any, res: Response): void {
    let response = {};
    try {
      reportService.getDailyBilling(req.body);
      customValidation.generateSuccessResponse(
        {},
        response,
        constants.RESPONSE_TYPE_SAVE,
        res,
        req
      );
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();

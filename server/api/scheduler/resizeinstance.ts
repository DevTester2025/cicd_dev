import eclcontroller from "../controllers/deployment/ecl2/ecl2controller";
import awscontroller from "../controllers/deployment/awscontroller";
import commonService from "../services/common.service";
import { constants } from "../../common/constants";
import db from "../models/model";
import _ = require("lodash");

export class ResizeInstance {
  constructor() {
    this.resizeInstance();
  }
  resizeInstance() {
    try {
      let parameters = {} as any;
      let now = new Date();
      let days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      let today = days[now.getDay()];
      parameters.include = [
        {
          model: db.srmsr,
          as: "servicerequest",
          include: [
            {
              model: db.Customer,
              as: "customer",
              required: false,
              paranoid: false,
              attributes: [
                "customerid",
                "ecl2tenantid",
                "awsaccountid",
                "ecl2region",
                "awsregion",
                "ecl2contractid",
                "status",
              ],
            },
            {
              model: db.srmsractions,
              as: "srmsractions",
              include: [
                {
                  model: db.User,
                  as: "touser",
                  required: false,
                  paranoid: false,
                  attributes: ["fullname", "email", "userid"],
                },
              ],
            },
          ],
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.Tenant,
          as: "tenant",
          attributes: ["tenantname"],
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.Instances,
          as: "instance",
          attributes: [
            "instancename",
            "cloudprovider",
            "region",
            "instancerefid",
            "instanceid",
          ],
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.MaintWindow,
          as: "maintwindow",
          attributes: ["startdate", "enddate"],
          where: {
            status: constants.STATUS_ACTIVE,
            startdate: {
              $lte: new Date(),
            },
            enddate: {
              $gte: new Date(),
            },
          },
        },
        {
          model: db.CostVisual,
          as: "upgradeplan",
          attributes: [
            "unit",
            "plantype",
            "priceperunit",
            "currency",
            "pricingmodel",
          ],
          required: false,
        },
        {
          model: db.CostVisual,
          as: "currentplan",
          attributes: [
            "unit",
            "plantype",
            "priceperunit",
            "currency",
            "pricingmodel",
          ],
          required: false,
        },
      ];
      parameters.where = {
        reqstatus: constants.STATUS_PENDING,
        autoimplementation: "Y",
        implstartdt: { $lte: new Date() },
      };
      commonService
        .getAllList(parameters, db.UpgradeRequest)
        .then((list) => {
          if (list && list.length > 0) {
            let eclFormData = [] as any;
            let awsFormData = [] as any;
            for (var data of list) {
              let obj = {} as any;
              let nonapprovalData;
              if (data.servicerequest) {
                nonapprovalData = _.find(data.servicerequest.srmsractions, {
                  apprvstatus: constants.STATUS_PENDING,
                });
              }
              if (!nonapprovalData) {
                console.log(data.requestday, today);
                if (data.requestday == today) {
                  let startTime = data.reqstarttime
                    .replace(/(^:)|(:$)/g, "")
                    .split(":");
                  let endTime = data.reqendtime
                    .replace(/(^:)|(:$)/g, "")
                    .split(":");
                  if (
                    now.getHours() >= parseFloat(startTime[0]) &&
                    now.getHours() <= parseFloat(endTime[0])
                  ) {
                    obj.region = data.instance.region;
                    obj.tenantid = data.tenantid;
                    obj.instanceid = data.instance.instanceid;
                    obj.instancerefid = data.instance.instancerefid;
                    obj.ecl2tenantid =
                      data.servicerequest.customer.ecl2tenantid;
                    obj.instancetype = data.upgradeplan
                      ? data.upgradeplan.plantype
                      : null;
                    obj.upgraderequestid = data.upgraderequestid;
                    obj.srvrequestid = data.srvrequestid;
                    if (data.cloudprovider == constants.CLOUD_ECL)
                      eclFormData.push(obj);
                    if (data.cloudprovider == constants.CLOUD_AWS)
                      awsFormData.push(obj);
                  }
                }
              }
              if (eclFormData.length > 0) {
                eclcontroller.ecl2ResizeInsType({ body: eclFormData });
              }
              if (awsFormData.length > 0) {
                awscontroller.awsResizeInsType({ body: awsFormData });
              }
              this.scheduledRequestsResize([...eclFormData, ...awsFormData]);
            }
          } else {
            this.scheduledRequestsResize();
          }
        })
        .catch((error: Error) => {
          console.log(error);
        });
    } catch (e) {
      console.log(e);
    }
  }
  scheduledRequestsResize(updatedInstanceList?) {
    try {
      let parameters = {} as any;
      let now = new Date();
      let days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      let today = days[now.getDay()];
      parameters.attributes = [
        "scheduledreqhdrid",
        "srvrequestid",
        "tenantid",
        "customerid",
        "cloudprovider",
        "resourceid",
        "maintwindowid",
        "reqstatus",
        "status",
      ];
      parameters.include = [
        {
          model: db.srmsr,
          as: "servicerequest",
          include: [
            {
              model: db.Customer,
              as: "customer",
              required: false,
              paranoid: false,
              attributes: [
                "customerid",
                "ecl2tenantid",
                "awsaccountid",
                "ecl2region",
                "awsregion",
                "ecl2contractid",
                "status",
              ],
              where: { status: constants.STATUS_ACTIVE },
            },
            {
              model: db.srmsractions,
              as: "srmsractions",
              include: [
                {
                  model: db.User,
                  as: "touser",
                  required: false,
                  paranoid: false,
                  attributes: ["fullname", "email", "userid"],
                  where: { status: constants.STATUS_ACTIVE },
                },
              ],
            },
          ],
          attributes: ["srvrequestid", "tenantid", "requesttype", "srstatus"],
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.schedulerequestdetail,
          as: "requestdetails",
          where: { status: constants.STATUS_ACTIVE },
          include: [
            {
              model: db.CostVisual,
              as: "upgradeplan",
              attributes: [
                "unit",
                "plantype",
                "priceperunit",
                "currency",
                "pricingmodel",
              ],
              required: false,
              where: { status: constants.STATUS_ACTIVE },
            },
          ],
        },
        {
          model: db.Tenant,
          as: "tenant",
          attributes: ["tenantname"],
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.MaintWindow,
          as: "maintwindow",
          attributes: ["startdate", "enddate"],
          where: {
            status: constants.STATUS_ACTIVE,
            startdate: {
              $lte: new Date(),
            },
            enddate: {
              $gte: new Date(),
            },
          },
        },
        {
          model: db.Instances,
          as: "instance",
          attributes: [
            "instancename",
            "instancetyperefid",
            "cloudprovider",
            "region",
            "instancerefid",
            "instanceid",
          ],
          where: { status: constants.STATUS_ACTIVE },
        },
      ];
      parameters.where = { reqstatus: constants.STATUS_PENDING };
      commonService
        .getAllList(parameters, db.schedulerequest)
        .then((list) => {
          list = JSON.parse(JSON.stringify(list));
          let eclFormData = [] as any;
          let awsFormData = [] as any;
          for (var data of list) {
            let obj = {} as any;
            let isApproved = false as any;
            let nonapprovalData;
            if (data.servicerequest) {
              nonapprovalData = _.find(data.servicerequest.srmsractions, {
                apprvstatus: constants.STATUS_PENDING,
              });
              if (
                nonapprovalData == undefined &&
                data.servicerequest.srstatus !== constants.STATUS_COMPLETED
              ) {
                isApproved = true;
              }
            }
            if (isApproved) {
              let request = _.find(data.requestdetails, {
                requestday: today,
              }) as any;
              console.log(request);
              if (request && request.execute == "Y") {
                let startTime = request.reqstarttime
                  .replace(/(^:)|(:$)/g, "")
                  .split(":");
                let endTime = request.reqendtime
                  .replace(/(^:)|(:$)/g, "")
                  .split(":");
                let updatedInstance = _.find(updatedInstanceList, {
                  instanceid: data.instance.instanceid,
                });
                if (
                  now.getHours() >= parseFloat(startTime[0]) &&
                  now.getHours() <= parseFloat(endTime[0])
                ) {
                  if (!updatedInstance) {
                    if (
                      request.upgradeplan.plantype !==
                      data.instance.instancetyperefid
                    ) {
                      obj.region = data.instance.region;
                      obj.tenantid = data.tenantid;
                      obj.instanceid = data.instance.instanceid;
                      obj.instancerefid = data.instance.instancerefid;
                      obj.ecl2tenantid =
                        data.servicerequest.customer.ecl2tenantid;
                      obj.srvrequestid = data.srvrequestid;
                      obj.instancetype = request.upgradeplan
                        ? request.upgradeplan.plantype
                        : null;
                      if (data.cloudprovider == constants.CLOUD_ECL)
                        eclFormData.push(obj);
                      if (data.cloudprovider == constants.CLOUD_AWS)
                        awsFormData.push(obj);
                    }
                  }
                }
              }
            }
          }
          if (eclFormData.length > 0) {
            eclcontroller.ecl2ResizeInsType({ body: eclFormData });
          }
          if (awsFormData.length > 0) {
            awscontroller.awsResizeInsType({ body: awsFormData });
          }
        })
        .catch((error: Error) => {
          console.log(error);
        });
    } catch (e) {
      console.log(e);
    }
  }
}

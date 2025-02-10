import { resolve } from "bluebird";
import { constants } from "../../common/constants";
import db from "../models/model";
import commonService from "./common.service";
interface recommendationdata {
  platform: string;
  region: string;
  pricetype: string;
  cloudprovider: string;
  cpuutilmin: number;
  cpuutilmax: number;
  memutilmin: number;
  memutilmax: number;
  action: string;
}

export class RecommendationService {
  constructor() {}
  setupRecommendation(data: any) {
    return new Promise((resolve, reject) => {
      let condition = {
        platform: data.platform,
        cloudprovider: data.cloudprovider,
        cpuutilmin: data.cpuutilmin,
        cpuutilmax: data.cpuutilmax,
        memutilmin: data.memutilmin,
        memutilmax: data.memutilmax,
      };
      commonService
        .update(
          condition,
          { status: constants.STATUS_InACTIVE },
          db.Recommendation
        )
        .then((updated) => {
          if (data.cloudprovider == "AWS") {
            this.awsRecommendation(data);
          } else {
            this.ecl2Recommendation(data);
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
  awsRecommendation(data) {
    let recommendationData = [] as any;
    let instanceFamily = "" as any;
    let instanceVersion;
    let condition = {
      where: {
        status: constants.STATUS_ACTIVE,
        region: data.region,
        pricetype: data.pricetype,
      },
      include: [
        { as: "instancetype", model: db.awsinsttype, attributes: ["version"] },
      ],
    } as any;
    commonService
      .getAllList(condition, db.CostVisual)
      .then((insatnceData: any) => {
        insatnceData.forEach((type) => {
          if (type.plantype && type.instancetype) {
            instanceFamily = type.plantype.split(".")[0];
            instanceVersion = type.instancetype.version;
            let instanceObj = {} as any;
            switch (data.action) {
              case "onelevelup":
                instanceObj = insatnceData.find(findOneLevelUp);
                if (instanceObj) {
                  recommendationData.push(
                    this.formAWSSQLquery(type, data, instanceObj)
                  );
                }
                break;
              case "twolevelup":
                instanceObj = insatnceData.find(findTwoLevelUp);
                if (instanceObj) {
                  recommendationData.push(
                    this.formAWSSQLquery(type, data, instanceObj)
                  );
                }
                break;
              case "oneleveldown":
                instanceObj = insatnceData.find(findOneLevelDown);
                if (instanceObj) {
                  recommendationData.push(
                    this.formAWSSQLquery(type, data, instanceObj)
                  );
                }
                break;
              case "twoleveldown":
                instanceObj = insatnceData.find(findTwoLevelDown);
                if (instanceObj) {
                  recommendationData.push(
                    this.formAWSSQLquery(type, data, instanceObj)
                  );
                }
                break;

              default:
                break;
            }
          }
        });
        commonService.bulkCreate(recommendationData, db.Recommendation);
      })
      .catch((e) => {
        console.log(e);
      });
    function findOneLevelUp(obj) {
      if (
        obj.plantype.includes(instanceFamily) &&
        obj.instancetype &&
        obj.instancetype.version == instanceVersion + 1
      ) {
        return obj;
      }
    }
    function findOneLevelDown(obj) {
      if (
        obj.plantype.includes(instanceFamily) &&
        obj.instancetype &&
        obj.instancetype.version == instanceVersion - 1
      ) {
        return obj;
      }
    }
    function findTwoLevelUp(obj) {
      if (
        obj.plantype.includes(instanceFamily) &&
        obj.instancetype &&
        obj.instancetype.version == instanceVersion + 2
      ) {
        return obj;
      }
    }
    function findTwoLevelDown(obj) {
      if (
        obj.plantype.includes(instanceFamily) &&
        obj.instancetype &&
        obj.instancetype.version == instanceVersion - 2
      ) {
        return obj;
      }
    }
  }
  ecl2Recommendation(data) {
    let recommendationData = [] as any;
    let instanceVersion;
    commonService
      .getAllList(
        { where: { status: constants.STATUS_ACTIVE } },
        db.ecl2instancetype
      )
      .then((insatnceData: any) => {
        insatnceData.forEach((type) => {
          if (type.instancetypename) {
            instanceVersion = type.version;
            let instanceObj = {} as any;
            switch (data.action) {
              case "onelevelup":
                instanceObj = insatnceData.find(findOneLevelUp);
                if (instanceObj) {
                  recommendationData.push(
                    this.formSQLquery(type, data, instanceObj)
                  );
                }
                break;
              case "twolevelup":
                instanceObj = insatnceData.find(findTwoLevelUp);
                if (instanceObj) {
                  recommendationData.push(
                    this.formSQLquery(type, data, instanceObj)
                  );
                }
                break;
              case "oneleveldown":
                instanceObj = insatnceData.find(findOneLevelDown);
                if (instanceObj) {
                  recommendationData.push(
                    this.formSQLquery(type, data, instanceObj)
                  );
                }
                break;
              case "twoleveldown":
                instanceObj = insatnceData.find(findTwoLevelDown);
                if (instanceObj) {
                  recommendationData.push(
                    this.formSQLquery(type, data, instanceObj)
                  );
                }
                break;

              default:
                break;
            }
          }
        });
        commonService.bulkCreate(recommendationData, db.Recommendation);
      })
      .catch((e) => {
        console.log(e);
      });
    function findOneLevelUp(obj) {
      if (obj.version == instanceVersion + 1) {
        return obj;
      }
    }
    function findOneLevelDown(obj) {
      if (obj.version == instanceVersion - 1) {
        return obj;
      }
    }
    function findTwoLevelUp(obj) {
      if (obj.version == instanceVersion + 2) {
        return obj;
      }
    }
    function findTwoLevelDown(obj) {
      if (obj.version == instanceVersion - 2) {
        return obj;
      }
    }
  }
  formSQLquery(currentPlan, setupData, upgradeplan) {
    let data = {} as any;
    data.cloudprovider = setupData.cloudprovider;
    data.resourcetype = "ASSET_INSTANCE";
    data.plantype = currentPlan.instancetypeid;
    data.status = constants.STATUS_ACTIVE;
    data.createdby = setupData.createdby;
    data.createddt = setupData.createddt;
    data.lastupdatedby = setupData.createdby;
    data.lastupdateddt = setupData.createddt;
    data.cpuutilmin = setupData.cpuutilmin;
    data.cpuutilmax = setupData.cpuutilmax;
    data.memutilmin = setupData.memutilmin;
    data.memutilmax = setupData.memutilmax;
    data.recommendationone = upgradeplan.instancetypeid;
    data.restartyn = "Y";
    data.platform = setupData.platform;
    data.recommendsetupid = setupData.recommendsetupid;
    return data;
  }
  formAWSSQLquery(currentPlan, setupData, upgradeplan) {
    let data = {} as any;
    data.cloudprovider = setupData.cloudprovider;
    data.resourcetype = "ASSET_INSTANCE";
    data.plantype = currentPlan.costvisualid;
    data.status = constants.STATUS_ACTIVE;
    data.region = upgradeplan.region;
    data.pricetype = upgradeplan.pricetype;
    data.createdby = setupData.createdby;
    data.createddt = setupData.createddt;
    data.lastupdatedby = setupData.createdby;
    data.lastupdateddt = setupData.createddt;
    data.cpuutilmin = setupData.cpuutilmin;
    data.cpuutilmax = setupData.cpuutilmax;
    data.memutilmin = setupData.memutilmin;
    data.memutilmax = setupData.memutilmax;
    data.recommendationone = upgradeplan.costvisualid;
    data.restartyn = "Y";
    data.platform = setupData.platform;
    data.recommendsetupid = setupData.costvisualid;
    return data;
  }
}
export default new RecommendationService();

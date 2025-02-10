import eclcontroller from "../controllers/deployment/ecl2/ecl2controller";
import awscontroller from "../controllers/deployment/awscontroller";
import commonService from "../services/common.service";
import { constants } from "../../common/constants";
import db from "../models/model";
import _ = require("lodash");

class ResizeInstance {
  startProcessingWeeklyAverage(
    notations: object,
    week: number,
    month: number,
    year: number,
    instanceid: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let query = `
                  SELECT
                    utilkey,
                    utiltype,
                    instanceid,
                    tnad.date,
                    tenantid,
                    AVG(value) avg,
                    MIN(value) minval,
                    MAX(value) maxval,
                    uom,
                    (SELECT value from tbl_nm_asstutl_weekly tnaw where tnaw.week = ${week} and tnaw.year = ${year} and tnaw.instanceid = tnad.instanceid and tnaw.utilkey = tnad.utilkey and tnaw.tenantid = tnad.tenantid limit 1) weekavg,
                    (SELECT utilweeklyid from tbl_nm_asstutl_weekly tnaw where tnaw.week = ${week} and tnaw.year = ${year} and tnaw.instanceid = tnad.instanceid and tnaw.utilkey = tnad.utilkey and tnaw.tenantid = tnad.tenantid limit 1) weekavgid
                  from
                    tbl_nm_asstutl_daily tnad
                  where
                    WEEK(tnad.date) = ${week} and tnad.instanceid = ${instanceid}
                    group by utilkey, instanceid  
             `;

      return commonService
        .executeQuery(
          query,
          {
            type: db.sequelize.QueryTypes.SELECT,
          },
          db.sequelize
        )
        .then((weeklyavg) => {
          if (weeklyavg && weeklyavg.length > 0) {
            for (let j = 0; j < weeklyavg.length; j++) {
              const element = weeklyavg[j];
              let w = {
                ...element,
                week: week,
                year: year,
                month: month,
                notation: notations[element["uom"]] || null,
                value: element["avg"],
              };

              if (element["weekavgid"] != null)
                w["utilweeklyid"] = element["weekavgid"];

              commonService
                .upsert(w, db.AsstUtlWeekly)
                .then((weeklyMetricsDone) => {
                  console.log("Weekly metrics updated:::::::::");
                  console.log("J IS ", j, " Length is  ", weeklyavg.length);
                  if (j == weeklyavg.length - 1) {
                    resolve(true);
                    return;
                  }
                })
                .catch((err) => {
                  console.log("Error updating weekly metrics:::::::");
                  console.log(err);
                });
            }
          } else {
            resolve("");
          }
        })
        .catch((err) => {
          console.log("Error generating weekly average::::::");
          console.log(err);
          reject(err);
        });
    });
  }
  startProcessingMonthlyAverage(
    notations: object,
    week: number,
    month: number,
    year: number,
    instanceid: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let monthlyAggrQuery = `
                    SELECT
                      utilkey,
                      utiltype,
                      instanceid,
                      tenantid,
                      AVG(value) avg,
                      MIN(value) minval,
                      MAX(value) maxval,
                      uom,
                      (SELECT value from tbl_nm_asstutl_monthly tnam where tnam.month = ${month} and tnam.year = ${year} and tnam.instanceid = tnaw2.instanceid and tnam.utilkey = tnaw2.utilkey  and tnam.tenantid = tnaw2.tenantid limit 1) monthavg,
                      (SELECT utilmonthlyid from tbl_nm_asstutl_monthly tnam where tnam.month = ${month} and tnam.year = ${year} and tnam.instanceid = tnaw2.instanceid and tnam.utilkey = tnaw2.utilkey  and tnam.tenantid = tnaw2.tenantid limit 1) monthavgid
                    from
                      tbl_nm_asstutl_weekly tnaw2 
                    where
                      tnaw2.month = ${month} and tnaw2.instanceid = ${instanceid}
                    group by
                      utilkey,
                      instanceid
                  `;

      return commonService
        .executeQuery(
          monthlyAggrQuery,
          {
            type: db.sequelize.QueryTypes.SELECT,
          },
          db.sequelize
        )
        .then((monthlyAvg) => {
          if (monthlyAvg && monthlyAvg.length > 0) {
            for (let j = 0; j < monthlyAvg.length; j++) {
              const element = monthlyAvg[j];
              let m = {
                ...element,
                year: year,
                month: month,
                notation: notations[element["uom"]] || null,
                value: element["avg"],
              };
              if (element["monthavgid"] != null)
                m["utilmonthlyid"] = element["monthavgid"];

              commonService
                .upsert(m, db.AsstUtlMonthly)
                .then((weeklyMetricsDone) => {
                  console.log("Monthly metrics updated:::::::::");
                  console.log(`J is ${j} and length is ${monthlyAvg.length}`);
                  if (j == monthlyAvg.length - 1) {
                    resolve(true);
                    return;
                  }
                })
                .catch((err) => {
                  console.log("Error updating Monthly metrics:::::::");
                  console.log(err);
                });
            }
          } else {
            resolve();
          }
        })
        .catch((err) => {
          console.log("Error generating Monthly average::::::");
          console.log(err);
          reject(false);
        });
    });
  }
  startProcessingYearlyAverage(
    notations: object,
    week: number,
    month: number,
    year: number,
    instanceid: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let yearlyAggrQuery = `
                    SELECT
                        utilkey,
                        utiltype,
                        instanceid,
                        tenantid,
                        AVG(value) avg,
                        MIN(value) minval,
                        MAX(value) maxval,
                        uom,
                        (SELECT value from tbl_nm_asstutl_yearly tnam where tnam.year = ${year} and tnam.instanceid = tnaw2.instanceid and tnam.utilkey = tnaw2.utilkey  and tnam.tenantid = tnaw2.tenantid limit 1) yearavg,
                        (SELECT utilmonthlyid from tbl_nm_asstutl_yearly tnam where tnam.year = ${year} and tnam.instanceid = tnaw2.instanceid and tnam.utilkey = tnaw2.utilkey  and tnam.tenantid = tnaw2.tenantid limit 1) yearavgid
                    from
                        tbl_nm_asstutl_monthly tnaw2 
                    where
                        tnaw2.year = ${year} and tnaw2.instanceid = ${instanceid}
                    group by
                        utilkey,
                        instanceid
                  `;

      commonService
        .executeQuery(
          yearlyAggrQuery,
          {
            type: db.sequelize.QueryTypes.SELECT,
          },
          db.sequelize
        )
        .then((yearlyAvg) => {
          if (yearlyAvg && yearlyAvg.length > 0) {
            for (let j = 0; j < yearlyAvg.length; j++) {
              const element = yearlyAvg[j];
              let m = {
                ...element,
                year: year,
                notation: notations[element["uom"]] || null,
                value: element["avg"],
              };
              if (element["yearavgid"] != null)
                m["utilyearlyid"] = element["yearavgid"];
              console.log("Yearly data to upsert::::::::::::");
              console.log(m);
              commonService
                .upsert(m, db.AsstUtlYearly)
                .then((weeklyMetricsDone) => {
                  console.log("Yearly metrics updated:::::::::");
                  console.log(`J is ${j} and length is ${yearlyAvg.length}`);
                  if (j == yearlyAvg.length - 1) {
                    resolve(true);
                  }
                })
                .catch((err) => {
                  console.log("Error updating Yearly metrics:::::::");
                  console.log(err);
                });
            }
          } else {
            resolve();
            return;
          }
        })
        .catch((err) => {
          console.log("Error generating Monthly average::::::");
          console.log(err);
          reject(false);
        });
    });
  }
}

export default new ResizeInstance();

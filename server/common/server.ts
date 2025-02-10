import * as express from "express";
import { Application } from "express";
import * as path from "path";
import * as bodyParser from "body-parser";
import * as os from "os";
import * as cookieParser from "cookie-parser";
import swaggerify from "./swagger";
import l from "./logger";
import { NotifyServerUtl } from "../api/scheduler/serverurl";
import { ResizeInstance } from "../api/scheduler/resizeinstance";
import CommonService from "../api/services/common.service";
import ReportService from "../api/services/report.service";
import db from "../api/models/model";
import workers from "../workers/index";

import ServerUtilAggs from "../api/scheduler/utilizationaggs";
import * as moment from "moment";
import influxDbService from "../api/services/influxdb";
import * as fs from "fs";
import AssetNotificationCron from "../cron/assetmodificaiton";
import AWSBillingCron from "../cron/AssetBilling/AWS";
// import * as Sentry from '@sentry/node';
// import * as Tracing from '@sentry/tracing';


const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
(global as any).io = io;
var schedule = require("node-schedule");
import { sub, add } from "date-fns";

import { JiraInsights } from "../integrations";
import BudgetService from "../api/services/budget.service";
import * as logToFile from "log-to-file";
import LokiService from "../api/services/logging/loki.service";


export default class ExpressServer {
  constructor() {
    const root = path.normalize(__dirname + "/../..");
    app.set("appPath", root + "client");
    app.use(
      bodyParser.json({
        limit: "10mb",
      })
    );
    app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
    app.use(cookieParser(process.env.SESSION_SECRET));
    app.use(express.static(`${root}/public`));
    app.use(  
      "/deployment_scripts",
      express.static(path.join(__dirname, "../../deployment_scripts"))
    );
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb" }));
    app.use(function (req, res, next) {
      let requestObj = {
        message: "Request Data ",
        reference: "REQUEST",
        request: JSON.stringify({
          baseUrl: req.url,
          body: req.body,
          params: req.params,
          query: req.query,
        }),
      };
      LokiService.createLog(requestObj, "INFO");
      next();
    });
    // Data collection report job
    var drule = new schedule.RecurrenceRule();
    drule.hour = 23;
    drule.minute = 59;
    drule.second = 59;
    drule.dayOfWeek = [0, new schedule.Range(0, 6)];
    // drule.minute = new schedule.Range(0, 59, 1);
    var djob = schedule.scheduleJob(drule, function () {
      ReportService.getDailyReport();
      // aggrregateMetrics();
    });

    // schedule.scheduleJob("*/30 * * * *", function () {
    //   console.log("CRON JOB RUNNNING FOR EVERY 30 Minute");
    //   new AssetNotificationCron(parseInt(process.env.ON_PREM_TENANTID), {
    //     authReSyncOnChangeDetection: true,
    //   }).init();
    // });

    // new AssetNotificationCron(7, {
    //   authReSyncOnChangeDetection: true,
    // }).init();

    // ReportService.getDailyBilling();

    var rule = new schedule.RecurrenceRule();
    rule.minute = 0;
    rule.hour = 9;
    var offset1 = 0;
    function influxdata() {
      console.log("Inside influx data >>>>>");
      CommonService.getAllList(
        { limit: 2000, offset: offset1 },
        db.AsstUtlDtl
      ).then((list) => {
        if (list) {
          list = JSON.parse(JSON.stringify(list));
          for (var util of list) {
            let query = {
              utiltype: util.utiltype,
              tenantid: util.tenantid,
              instancerefid: util.instancerefid,
              instanceid: util.instanceid,
              utilkey: util.utilkey,
              uom: util.uom,
            };
            let date = new Date(util.utildate).getTime() * 1000000;
            influxDbService
              .writeData(query, date, parseFloat(util.value))
              .then((data) => {
                console.log("Inside then ><>>>>>>>>>>>>>>>>>>>>>");
                // stream1.write(JSON.stringify(query));
              })
              .catch((e) => {
                console.log("Inside catch ><>>>>>>>>>>>>>>>>>>>>>");
                console.log(e);
                // stream2.write(JSON.stringify(query));
              });
          }
          setTimeout(() => {
            offset1 += 2000;
            influxdata();
          }, 7000);
        }
      });
    }
    // influxdata();

    let scheduledTime;
    var j = schedule.scheduleJob("0 */15 * * * *", function () {
      // new ResizeInstance();
      // CommonService.getAllList({ where: { lookupkey: 'UTIL_JOB_DURATION' } }, db.LookUp).then((list) => {
      //   if (list) {
      //     list = JSON.parse(JSON.stringify(list))[0];
      //     let duration = parseFloat(list.keyvalue);
      //     if (!scheduledTime && duration) {
      //       new NotifyServerUtl();
      //       scheduledTime = new Date();
      //     } else {
      //       let today = new Date() as any;
      //       var diff_in_ms = (today - scheduledTime); // milliseconds
      //       var diff_in_minutes = Math.floor(diff_in_ms / 60000) // minutes
      //       if (diff_in_minutes >= duration) {
      //         new NotifyServerUtl();
      //         scheduledTime = new Date();
      //       }
      //     }
      //   }
      // }).catch((error: Error) => {
      //   console.log(error);
      // });
      // Class/fn to call
      // new NotifyServerUtl();
    });

    // schedule.scheduleJob('0 0 1 * * *', function () {
    let limit = 1;
    let offset = 0;

    const notations = {
      GB: "GB",
      KBs: "Kbps",
      PERCENT: "%",
      Kbps: "Kbps",
    };

    function aggrregateMetrics() {
      let day = moment().subtract(1, "days");

      function handleNext() {
        setTimeout(() => {
          CommonService.executeQuery(
            `SELECT * from csdm.tbl_tn_instances where lastrun <> "${moment(
              day
            ).format("YYYY-MM-DD")}"`,
            { type: db.Sequelize.QueryTypes.SELECT },
            db.sequelize
          )
            .then((pending) => {
              if (pending.length > 0) {
                aggrregateMetrics();
              } else {
                console.log("All instance metrics aggregated.");
              }
            })
            .catch((err) => {
              console.log("Error validating remaining instances:::");
              console.log(err);
            });
        }, 500);
      }

      CommonService.executeQuery(
        `SELECT * from tbl_tn_instances tti where tti.status = "Active" order by instanceid desc limit ${limit} offset ${offset}`,
        { type: db.sequelize.QueryTypes.SELECT },
        db.sequelize
      )
        .then((res) => {
          if (res.length > 0) {
            CommonService.getAllList(
              {
                where: {
                  lookupkey: "RIGHTSIZE_DAYS",
                  tenantid: res[0]["tenantid"],
                },
              },
              db.LookUp
            )
              .then((rightsizedays) => {
                let defaultValue = JSON.parse(
                  JSON.stringify(rightsizedays)
                ) as object[];

                console.log(defaultValue[0]);

                CommonService.executeQuery(
                  `
                SELECT
                  utilkey,
                  utiltype,
                  instanceid,
                  tenantid,
                  AVG(value) dailyavg,
                  MIN(value) minval,
                  MAX(value) maxval,
                  uom
                from
                  tbl_nm_asstutldtl tna
                where
                  tna.utildate >= "${day.format("YYYY-MM-DD")} 00:00:00"
                  and tna.utildate <= "${day.format("YYYY-MM-DD")} 23:59:59"
                  and tna.instanceid IN (${res
                    .map((o) => o["instanceid"])
                    .join(",")})
                  group by utilkey, instanceid 
              `,
                  { type: db.sequelize.QueryTypes.SELECT },
                  db.sequelize
                )
                  .then((aggs) => {
                    if (aggs.length > 0) {
                      CommonService.bulkCreate(
                        aggs.map((o) => {
                          return {
                            ...o,
                            value: o["dailyavg"],
                            date: day.format("YYYY-MM-DD"),
                            notation: notations[o["uom"]] || null,
                          };
                        }),
                        db.AsstUtlDaily
                      )
                        .then((dailyMetrics) => {
                          // Week is 1 to n and month is 0 to 11
                          // Week - 1 since mysql WEEK() is 0 to n
                          ServerUtilAggs.startProcessingWeeklyAverage(
                            notations,
                            day.week() - 1,
                            day.month() + 1,
                            day.year(),
                            aggs[0]["instanceid"]
                          )
                            .then((done) => {
                              console.log(
                                "Weekly aggregations added::::::::::::"
                              );
                              ServerUtilAggs.startProcessingMonthlyAverage(
                                notations,
                                day.week() - 1,
                                day.month() + 1,
                                day.year(),
                                aggs[0]["instanceid"]
                              )
                                .then((done) => {
                                  console.log(
                                    "Monthly aggregations added::::::::::::"
                                  );
                                  if (res.length == limit) {
                                    CommonService.executeQuery(
                                      `update tbl_tn_instances set lastrun = "${moment().format(
                                        "YYYY-MM-DD"
                                      )}" where instanceid in (${res
                                        .map((o) => o["instanceid"])
                                        .join(",")})`,
                                      {
                                        type: db.sequelize.QueryTypes
                                          .BULKUPDATE,
                                      },
                                      db.sequelize
                                    )
                                      .then((lastrun) => {
                                        console.log("Last run updated::::::");
                                        offset += limit;
                                        CommonService.executeQuery(
                                          `
                              update
                                tbl_tn_instances tti
                              set
                                tti.rightsizeyn = ifnull((
                                SELECT
                                  "Y"
                                from
                                  tbl_nm_recommendation tnr
                                where
                                  tnr.cloudprovider = "${
                                    res[0]["cloudprovider"]
                                  }"
                                  and tnr.plantype = ${res[0]["instancetypeid"]}
                                  and ifnull((
                                  select
                                    AVG(tna.value)
                                  from
                                    tbl_nm_asstutldtl tna
                                  where
                                    tna.utilkey = "CPU_UTIL"
                                    and tna.instanceid = ${res[0]["instanceid"]}
                                    and tna.utildate BETWEEN "${moment()
                                      .subtract(
                                        defaultValue[0]["keyvalue"],
                                        "day"
                                      )
                                      .format(
                                        "YYYY-MM-DD"
                                      )}" and "${moment().format("YYYY-MM-DD")}"
                                  limit 1),
                                  -1) BETWEEN tnr.cpuutilmin and tnr.cpuutilmax
                                  and ifnull((
                                  select
                                    AVG(tna.value)
                                  from
                                    tbl_nm_asstutldtl tna
                                  where
                                    tna.utilkey = "MEM_USEPERCENT"
                                    and tna.instanceid = ${res[0]["instanceid"]}
                                    and tna.utildate BETWEEN "${moment()
                                      .subtract(
                                        defaultValue[0]["keyvalue"],
                                        "day"
                                      )
                                      .format(
                                        "YYYY-MM-DD"
                                      )}" and "${moment().format("YYYY-MM-DD")}"
                                  limit 1),
                                  -1) BETWEEN tnr.cpuutilmin and tnr.cpuutilmax
                                limit 1),"N"),
                                tti.recommendationid = ifnull((
                                  SELECT
                                    tnr.recommendationid
                                  from
                                    tbl_nm_recommendation tnr
                                  where
                                    tnr.cloudprovider = "${
                                      res[0]["cloudprovider"]
                                    }"
                                    and tnr.plantype = ${
                                      res[0]["instancetypeid"]
                                    }
                                    and ifnull((
                                    select
                                      AVG(tna.value)
                                    from
                                      tbl_nm_asstutldtl tna
                                    where
                                      tna.utilkey = "CPU_UTIL"
                                      and tna.instanceid = ${
                                        res[0]["instanceid"]
                                      }
                                      and tna.utildate BETWEEN "${moment()
                                        .subtract(
                                          defaultValue[0]["keyvalue"],
                                          "day"
                                        )
                                        .format(
                                          "YYYY-MM-DD"
                                        )}" and "${moment().format(
                                            "YYYY-MM-DD"
                                          )}"
                                    limit 1),
                                    -1) BETWEEN tnr.cpuutilmin and tnr.cpuutilmax
                                    and ifnull((
                                    select
                                      AVG(tna.value)
                                    from
                                      tbl_nm_asstutldtl tna
                                    where
                                      tna.utilkey = "MEM_USEPERCENT"
                                      and tna.instanceid = ${
                                        res[0]["instanceid"]
                                      }
                                      and tna.utildate BETWEEN "${moment()
                                        .subtract(
                                          defaultValue[0]["keyvalue"],
                                          "day"
                                        )
                                        .format(
                                          "YYYY-MM-DD"
                                        )}" and "${moment().format(
                                            "YYYY-MM-DD"
                                          )}"
                                    limit 1),
                                    -1) BETWEEN tnr.cpuutilmin and tnr.cpuutilmax
                                  limit 1),null)
                              where
                                tti.instanceid = ${res[0]["instanceid"]}
                          `,
                                          {
                                            type: db.sequelize.QueryTypes
                                              .UPDATE,
                                          },
                                          db.sequelize
                                        )
                                          .then((done) => {
                                            handleNext();
                                          })
                                          .catch((err) => {
                                            console.log(
                                              "Error setting right size  option"
                                            );
                                            console.log(err);
                                          });
                                      })
                                      .catch((err) => {
                                        offset += limit;
                                        console.log(
                                          "Offset limit::::::::::::::::"
                                        );
                                        console.log(offset, limit);
                                        handleNext();
                                        console.log("Unable toupdate last run");
                                      });
                                  } else {
                                    CommonService.executeQuery(
                                      `update tbl_tn_instances set lastrun = "${moment().format(
                                        "YYYY-MM-DD"
                                      )}" where instanceid in (${res
                                        .map((o) => o["instanceid"])
                                        .join(",")})`,
                                      {
                                        type: db.sequelize.QueryTypes
                                          .BULKUPDATE,
                                      },
                                      db.sequelize
                                    )
                                      .then((lastrun) => {
                                        console.log("Last run updated::::::");
                                      })
                                      .catch((err) => {
                                        console.log("Unable toupdate last run");
                                      });
                                  }
                                })
                                .catch((err) => {
                                  console.log(
                                    "Error generating weekly aggs::::::::::::"
                                  );
                                });
                            })
                            .catch((err) => {
                              console.log(
                                "Error generating weekly aggs::::::::::::"
                              );
                              console.log(err);
                            });
                        })
                        .catch((err) => {
                          console.log("Err adding daily aggs:::::::::::::::::");
                          console.log(err);
                          handleNext();
                        });
                    } else {
                      CommonService.executeQuery(
                        `update tbl_tn_instances set lastrun = "${day.format(
                          "YYYY-MM-DD"
                        )}" where instanceid in (${res
                          .map((o) => o["instanceid"])
                          .join(",")})`,
                        {
                          type: db.sequelize.QueryTypes.BULKUPDATE,
                        },
                        db.sequelize
                      )
                        .then((lastrun) => {
                          console.log("Last run updated::::::");
                          offset += limit;
                          handleNext();
                        })
                        .catch((err) => {
                          offset += limit;
                          handleNext();
                          console.log("Unable toupdate last run");
                        });
                    }
                  })
                  .catch((err) => {
                    console.log(err);
                    console.log("Error getting aggr averages");
                  });
              })
              .catch((err) => {
                console.log(err);
                console.log("Error getting recommendations");
              });
          }
        })
        .catch((err) => {
          console.log(err);
          console.log("Error getting aggr");
        });
    }

    // aggrregateMetrics();
    // });

    // });
    
    // Sentry.init({
    //   dsn: process.env.SENTRY_DSN,
    //   integrations: [
    //     // enable HTTP calls tracing
    //     new Sentry.Integrations.Http({ tracing: true }),
    //     // enable Express.js middleware tracing
    //     new Tracing.Integrations.Express({ app }),
    //   ],
   
    //   tracesSampleRate: 1.0,
     
    // });
    // console.log('Sentry initialized.');
    // app.use(Sentry.Handlers.requestHandler());
    // app.use(Sentry.Handlers.tracingHandler());
    // app.use(Sentry.Handlers.errorHandler());
  }

  startJiraInsightsSync() {
    const tenantid = 7;
    const host = "https://platops-jira.esko.com/rest/insight/1.0";
    const auth = "cmFqbTpSYWphI2Vza28xMjMh"; // base64("rajm:Raja#esko123!")

    // new JiraInsights.InsightsSync(tenantid, host, auth).init();
  }

  startAWSBillingCron() {
    // console.log("ON PREM TENANT ID");
    // console.log(process.env.ON_PREM_TENANTID);
    // const c = new AWSBillingCron(parseInt(process.env.ON_PREM_TENANTID), {
    //   start: new Date(2022, 2, 2),
    //   end: new Date(2022, 2, 3),
    // });
    // c.init();
    logToFile("Asset billing CRON job started.");
    schedule.scheduleJob("0 1 * * *", function () {
      const c = new AWSBillingCron(parseInt(process.env.ON_PREM_TENANTID));
      c.init();
    });

    // To fetch billing details for last 14 days one time cron.
    // let count = 1;

    // function fetchBilling() {
    //   if (count < 15) {
    //     console.log(
    //       "Fetching for >>>>>>>>>>",
    //       sub(new Date(), {
    //         days: count,
    //       })
    //     );
    //     const c = new AWSBillingCron(parseInt(process.env.ON_PREM_TENANTID), {
    //       start: sub(new Date(), {
    //         days: count,
    //       }),
    //       end: add(
    //         sub(new Date(), {
    //           days: count,
    //         }),
    //         {
    //           days: 1,
    //         }
    //       ),
    //     });
    //     c.init();
    //     setTimeout(() => {
    //       count += 1;
    //       fetchBilling();
    //     }, 15000);
    //   }
    // }

    // fetchBilling();
  }

  $budgetOverrun() {
    const s = new BudgetService(parseInt(process.env.ON_PREM_TENANTID));
    s.init();
  }

  router(routes: (app: Application) => void): ExpressServer {
    swaggerify(app, routes);
    return this;
  }

  listen(port: number = parseInt(process.env.PORT)): Application {
    const welcome = (port) => () => {
      this.startJiraInsightsSync();
      this.startAWSBillingCron();
      // this.$budgetOverrun();

      l.info(
        `up and running in ${
          process.env.NODE_ENV || "development"
        } @: ${os.hostname()} on port: ${port}}`
      );
    };

    // const W = new workers(app);
    // W.init();

    http.listen(port, welcome(port));
    return app;
  }
}

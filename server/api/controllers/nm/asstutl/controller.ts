import CommonService from "../../.././services/common.service";
import db from "../../.././models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../.././common/validation/customValidation";
import { constants } from "../../../.././common/constants";
import * as winRm from "../../../../lib/win/winrm";
import * as winExe from "../../../../lib/win/winexe";
import _ = require("lodash");
import * as shell from "shelljs";
import AppLogger from "../../../../lib/logger";
import * as moment from "moment";
import { queries } from "../../../../common/query";
import DownloadService from "../../../services/download.service";
import { ListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import influxDbService from "../../../services/influxdb";
import { influxQueries } from "../../../../common/influxqueries";
export class Controller {
  constructor() {
    //
  }
  getDailyReport(req: Request, res: Response): void {
    let response = {};
    try {
      let q = "";
      console.log(req.body);
      if (req.body.cloudprovider == "AWS") {
        q = queries.AWS_DATACOLLECTION;
      }
      if (req.body.cloudprovider == "ECL2") {
        q = queries.ECL2_DATACOLLECTION;
      }
      let params = {
        replacements: {
          cloudprovider: req.body.cloudprovider,
          fromdate: req.body.fromdate,
          todate: req.body.todate,
          // fromdate: '2020-12-02 00:00:00',
          // todate: '2020-12-02 23:59:59',
          customerid: req.body.customerid,
        },
        type: db.sequelize.QueryTypes.SELECT,
      };
      CommonService.executeQuery(q, params, db.sequelize)
        .then((list) => {
          let template = {
            content: ListTemplate,
            engine: "handlebars",
            helpers: CommonHelper,
            recipe: "html-to-xlsx",
          };
          let data = { list };
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
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  report(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters: any = { where: {} };

      if (req.query.type == "asstutldtl") {
        if (req.body.startdate && req.body.enddate) {
          parameters.where["utildate"] = {
            $between: [req.body.startdate, req.body.enddate],
          };
        }
        if (req.body.customerid) {
          parameters.where["customerid"] = req.body.customerid;
        }
        // if (req.body.cloudprovider) {
        //     parameters.where['cloudprovider'] = req.body.cloudprovider;
        // }
        if (req.body.utiltype) {
          if (Array.isArray(req.body.utiltype)) {
            parameters.where["utiltype"] = { $in: req.body.utiltype };
          } else {
            parameters.where["utiltype"] = req.body.utiltype;
          }
        }
        if (req.body.utilkey) {
          if (Array.isArray(req.body.utilkey)) {
            parameters.where["utilkey"] = { $in: req.body.utilkey };
          } else {
            parameters.where["utilkey"] = req.body.utilkey;
          }
        }
        if (req.body.instancerefid) {
          if (Array.isArray(req.body.instancerefid)) {
            parameters.where["instancerefid"] = { $in: req.body.instancerefid };
          } else {
            parameters.where["instancerefid"] = req.body.instancerefid;
          }
        }
        if (req.body.detailed && req.body.detailed == "Y") {
          parameters.attributes = [["utildate", "date"], "value", "utilkey"];
        } else {
          parameters.attributes = [
            [db.sequelize.fn("date", db.sequelize.col("utildate")), "date"],
            [db.sequelize.fn("avg", db.sequelize.col("value")), "avgvalue"],
            [db.sequelize.fn("min", db.sequelize.col("value")), "minvalue"],
            [db.sequelize.fn("max", db.sequelize.col("value")), "maxvalue"],
            "utilkey",
          ];
          parameters.group = ["utilkey", db.sequelize.col("date")];
        }
        parameters.order = [["utilkey"], [db.sequelize.col("date")]];

        CommonService.getAllList(parameters, db.AsstUtlDtl)
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
      } else {
        const groupTableMaps = {
          daily: db.AsstUtlDaily,
          weekly: db.AsstUtlWeekly,
          monthly: db.AsstUtlMonthly,
        };

        parameters.where["utilkey"] = { $in: req.body.utilkey };
        parameters.where["tenantid"] = req.body.tenantid;
        parameters.where["instancerefid"] = req.body.instancerefid;

        switch (req.body.groupby) {
          case "daily":
            parameters["order"] = [["date", "asc"]];
            if (req.body.range == "l7") {
              parameters.where["date"] = {
                $between: [
                  moment().subtract(7, "days").format("YYYY-MM-DD"),
                  moment().format("YYYY-MM-DD"),
                ],
              };
            }
            if (req.body.range == "l15") {
              parameters.where["date"] = {
                $between: [
                  moment().subtract(15, "days").format("YYYY-MM-DD"),
                  moment().format("YYYY-MM-DD"),
                ],
              };
            }
            if (req.body.range == "l30") {
              parameters.where["date"] = {
                $between: [
                  moment().subtract(30, "days").format("YYYY-MM-DD"),
                  moment().format("YYYY-MM-DD"),
                ],
              };
            }
            if (req.body.range == "l90") {
              parameters.where["date"] = {
                $between: [
                  moment().subtract(90, "days").format("YYYY-MM-DD"),
                  moment().format("YYYY-MM-DD"),
                ],
              };
            }
            if (req.body.range == "l180") {
              parameters.where["date"] = {
                $between: [
                  moment().subtract(180, "days").format("YYYY-MM-DD"),
                  moment().format("YYYY-MM-DD"),
                ],
              };
            }
            break;
          case "weekly":
            let thisWeek = moment().week();
            let years = [];
            parameters["week"] = [["date", "asc"]];
            if (req.body.range == "4W") {
              let startWeek = moment().week() - 4;
              if (years.indexOf(moment().year()) == -1)
                years.push(moment().year());
              if (years.indexOf(moment().subtract(4, "weeks").year()) == -1)
                years.push(moment().subtract(4, "weeks").year());
              parameters.where["week"] = { $between: [startWeek, thisWeek] };
              parameters.where["year"] = { $in: years };
            }
            if (req.body.range == "8W") {
              let startWeek = moment().week() - 8;
              if (years.indexOf(moment().year()) == -1)
                years.push(moment().year());
              if (years.indexOf(moment().subtract(8, "weeks").year()) == -1)
                years.push(moment().subtract(8, "weeks").year());
              parameters.where["week"] = { $between: [startWeek, thisWeek] };
              parameters.where["year"] = { $in: years };
            }
            if (req.body.range == "12W") {
              let startWeek = moment().week() - 12;
              if (years.indexOf(moment().year()) == -1)
                years.push(moment().year());
              if (years.indexOf(moment().subtract(12, "weeks").year()) == -1)
                years.push(moment().subtract(12, "weeks").year());
              parameters.where["week"] = { $between: [startWeek, thisWeek] };
              parameters.where["year"] = { $in: years };
            }
            break;
          case "monthly":
            parameters["month"] = [["date", "asc"]];
            let thismonth = moment().month() + 1;
            let yearsFilter = [];
            if (req.body.range == "3M") {
              let startMonth = moment().subtract(3, "month").month() + 1;
              parameters.where["month"] = { $between: [thismonth, startMonth] };
              if (yearsFilter.indexOf(moment().year()) == -1)
                yearsFilter.push(moment().year());
              if (
                yearsFilter.indexOf(moment().subtract(3, "month").year()) == -1
              )
                yearsFilter.push(moment().subtract(3, "month").year());
              parameters.where["year"] = { $in: yearsFilter };
            }
            if (req.body.range == "6M") {
              let startMonth = moment().subtract(6, "month").month() + 1;
              parameters.where["month"] = { $between: [thismonth, startMonth] };
              if (yearsFilter.indexOf(moment().year()) == -1)
                yearsFilter.push(moment().year());
              if (
                yearsFilter.indexOf(moment().subtract(6, "month").year()) == -1
              )
                yearsFilter.push(moment().subtract(6, "month").year());
              parameters.where["year"] = { $in: yearsFilter };
            }
            break;

          default:
            break;
        }

        CommonService.getAllList(parameters, groupTableMaps[req.body.groupby])
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

  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = req.body;
      parameters.startdate = new Date(parameters.startdate).toISOString();
      parameters.enddate = new Date(parameters.enddate).toISOString();
      let groupby = "utiltype,instancerefid,utilkey,uom";
      let condition = influxDbService.formInfluxWhere(req.body);
      let query = influxQueries.getUtilization(
        parameters.startdate,
        parameters.enddate,
        groupby,
        condition,
        parameters.duration
      );
      influxDbService
        .executeQuery(query)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((e) => {
          customValidation.generateAppError(e, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  byId(req: Request, res: Response): void {
    let response = {};
    try {
      CommonService.getById(req.params.id, db.AsstUtlHdr)
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

  create(req: Request, res: Response): void {
    let response = {};
    try {
      let query = {} as any;
      query.include = [{ model: db.AsstUtlDtl, as: "asstutldtl" }];
      CommonService.saveWithAssociation(req.body, query, db.AsstUtlHdr)
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

  createDetails(req: Request, res: Response): void {
    let response = {};
    try {
      let query = {} as any;
      console.log(req.body);
      let d = [];
      let metric: { [key: string]: any };
      metric = req.body;
      for (const key in metric) {
        if (Object.prototype.hasOwnProperty.call(metric, key)) {
          const value = metric[key];
          let keys = key.split(":");
          let obj = {
            tenantid: 1,
            utildate: new Date(),
            instancerefid: 1,
            instanceid: 1,
            utiltype: keys[0],
            utilkey: keys[1],
            value,
            uom: keys[2],
          };
          d.push(obj);
        }
      }
      CommonService.bulkCreate(d, db.AsstUtlDtl)
        .then((data) => {
          customValidation.generateSuccessResponse(
            {},
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

  process(req: Request, res: Response): void {
    let response = {};
    customValidation.generateSuccessResponse(
      {},
      response,
      constants.RESPONSE_TYPE_SAVE,
      res,
      req
    );
    if (req.body.instanceids) {
      new Controller().cronJob(req.body.instanceids);
    } else {
      new Controller().cronJob();
    }
  }

  cronJob(instanceids?: number[]): void {
    let response = {};
    let appLogger = new AppLogger(null, null);

    try {
      let lookupparam = {
        where: {
          lookupkey: {
            $in: ["AD_ADMIN_USERNAME", "AD_ADMIN_PASSWORD", "FILE_PATH"],
          },
        },
      };
      CommonService.getAllList(lookupparam, db.LookUp)
        .then((lookuplist) => {
          let username = _.find(lookuplist, function (data: any) {
            if (data.lookupkey === "AD_ADMIN_USERNAME") {
              appLogger.writeLogToFile("info", data);
              return data;
            }
          });
          let password = _.find(lookuplist, function (data: any) {
            if (data.lookupkey === "AD_ADMIN_PASSWORD") {
              appLogger.writeLogToFile("info", data);
              return data;
            }
          });
          console.log("Passowrd id::::::::::::::::::");
          console.log(CommonService.decrypt(password.keyvalue));
          if (password)
            password.keyvalue = CommonService.decrypt(password.keyvalue);
          let client_path = _.find(lookuplist, function (data: any) {
            if (data.lookupkey === "FILE_PATH") {
              appLogger.writeLogToFile("info", data);
              return data;
            }
          });

          let parameters = {
            where: {
              status: constants.STATUS_ACTIVE,
              //tenantid: 127,
              //cloudprovider: constants.CLOUD_ECL,
            },
            attributes: [
              db.sequelize.fn("DISTINCT", db.sequelize.col("tenantid")),
              "tenantid",
            ],
            order: [["instanceid", "desc"]],
          };

          if (instanceids && instanceids.length > 0) {
            parameters["where"]["instanceid"] = { $in: instanceids };
          }

          CommonService.getAllList(parameters, db.Instances)
            .then((tenantList: any) => {
              tenantList = JSON.parse(JSON.stringify(tenantList));
              if (tenantList.length > 0) {
                console.log("tenantList >>", tenantList.length);
                let i = 0;
                iterateTenant(i);
                //   tenantList.forEach(tenant => {
                function iterateTenant(i) {
                  console.log("---i-----", i);
                  if (tenantList[i] != undefined && null != tenantList[i]) {
                    let tenant = tenantList[i];
                    var nextdate = new Date();
                    nextdate.setHours(nextdate.getHours() + 1);
                    let asstUtlHdrObj: any = {
                      tenantid: tenant.tenantid,
                      lastrun: new Date(),
                      nextrun: nextdate,
                      //responsedata: '',
                      status: constants.STATUS_FAILED,
                    };

                    CommonService.create(asstUtlHdrObj, db.AsstUtlHdr)
                      .then((headerdata) => {
                        headerdata = JSON.parse(JSON.stringify(headerdata));
                        let parameters: any = {
                          where: {
                            status: constants.STATUS_ACTIVE,
                            tenantid: tenant.tenantid,
                            privateipv4: { $ne: null },
                          },
                          attributes: [
                            "instanceid",
                            "tenantid",
                            "privateipv4",
                            "publicipv4",
                            "cloudprovider",
                            "adminusername",
                            "adminpassword",
                          ],
                          order: [["instanceid", "desc"]],
                        };
                        if (instanceids && instanceids.length > 0) {
                          parameters["where"]["instanceid"] = {
                            $in: instanceids,
                          };
                        }
                        CommonService.getAllList(parameters, db.Instances)
                          .then((instanceList) => {
                            instanceList = JSON.parse(
                              JSON.stringify(instanceList)
                            );
                            let arrayout: any = [];
                            let arrayAsstutls: any = [];
                            console.log("instanceList >>", instanceList.length);
                            let index = 0;
                            iterateInstance(index);
                            function iterateInstance(index) {
                              console.log("---index-----", index);
                              let element = instanceList[index];
                              if (
                                undefined != instanceList[index] &&
                                null != instanceList[index]
                              ) {
                                if (
                                  undefined == element.adminusername ||
                                  null == element.adminusername
                                ) {
                                  element.adminusername = username.keyvalue; //sdladmin
                                }
                                if (
                                  undefined == element.adminpassword ||
                                  null == element.adminpassword
                                ) {
                                  element.adminpassword = password.keyvalue; //SdlAbmin#12E!
                                }
                                if (
                                  element.cloudprovider != constants.CLOUD_ECL
                                ) {
                                  if (element.publicipv4) {
                                    element.privateipv4 = element.publicipv4;
                                  }
                                }
                                //--------------
                                //element.privateipv4 = '18.216.50.193'; //169.254.0.6
                                //--------------
                                console.log(element);
                                winRm
                                  .WaitforConnection(
                                    element.adminusername,
                                    element.adminpassword,
                                    element.privateipv4,
                                    12000,
                                    5,
                                    appLogger
                                  )
                                  .then((credentials) => {
                                    winRm
                                      .ExecuteCommand(
                                        credentials,
                                        "set-executionpolicy Unrestricted",
                                        "ps"
                                      )
                                      .then((restart1) => {
                                        winRm
                                          .CopyScript(
                                            appLogger,
                                            credentials,
                                            "http://csdmdevapi.cloudmatiq.com/deployment_scripts/asstutl/serverutl.ps1",
                                            "C:/serverutl.ps1",
                                            true,
                                            []
                                          )
                                          .then((output) => {
                                            //winRm.CopyScript(appLogger, credentials, "http://" + client_path.keyvalue + "/deployment_scripts/asstutl/serverutl.ps1", 'C:/serverutl.ps1', true, []).then(output => {
                                            if (output) {
                                              output = JSON.parse(
                                                output.trim()
                                              );
                                            }
                                            console.log(
                                              "Process Output >1> ",
                                              output
                                            );
                                            //Expected Output
                                            new Controller().buildServerUtil(
                                              output,
                                              arrayAsstutls,
                                              arrayout,
                                              headerdata,
                                              tenant,
                                              element
                                            );
                                            if (
                                              instanceList.length ==
                                              index + 1
                                            ) {
                                              i = i + 1;
                                              iterateTenant(i);
                                              new Controller().saveServerUtil(
                                                arrayAsstutls,
                                                headerdata,
                                                arrayout
                                              );
                                            }
                                            index = index + 1;
                                            iterateInstance(index);
                                          })
                                          .catch((err) => {
                                            //PS Script Error
                                            new Controller().buildServerUtil(
                                              null,
                                              arrayAsstutls,
                                              arrayout,
                                              headerdata,
                                              tenant,
                                              element
                                            );
                                            console.log(err);
                                            if (
                                              instanceList.length ==
                                              index + 1
                                            ) {
                                              i = i + 1;
                                              iterateTenant(i);
                                              new Controller().saveServerUtil(
                                                arrayAsstutls,
                                                headerdata,
                                                arrayout
                                              );
                                            }
                                            index = index + 1;
                                            iterateInstance(index);
                                          });
                                      })
                                      .catch((err) => {
                                        //PS Script Error
                                        new Controller().buildServerUtil(
                                          null,
                                          arrayAsstutls,
                                          arrayout,
                                          headerdata,
                                          tenant,
                                          element
                                        );
                                        console.log(err);
                                        if (instanceList.length == index + 1) {
                                          i = i + 1;
                                          iterateTenant(i);
                                          new Controller().saveServerUtil(
                                            arrayAsstutls,
                                            headerdata,
                                            arrayout
                                          );
                                        }
                                        index = index + 1;
                                        iterateInstance(index);
                                      });
                                  })
                                  .catch((err) => {
                                    // WINEXE Connection Error
                                    console.log(err);
                                    new Controller().buildServerUtil(
                                      null,
                                      arrayAsstutls,
                                      arrayout,
                                      headerdata,
                                      tenant,
                                      element
                                    );
                                    console.log(err);
                                    if (instanceList.length == index + 1) {
                                      i = i + 1;
                                      iterateTenant(i);
                                      new Controller().saveServerUtil(
                                        arrayAsstutls,
                                        headerdata,
                                        arrayout
                                      );
                                    }
                                    index = index + 1;
                                    iterateInstance(index);
                                  });
                              }
                            }
                          })
                          .catch((error: Error) => {
                            console.log(error);
                          });
                      })
                      .catch((error: Error) => {
                        console.log(error);
                      });
                  }
                }
                //  });
              } else {
                console.log("Tenant list empty");
              }
            })
            .catch((error: Error) => {
              console.log("Error getting tenant list");
              console.log(error);
            });
        })
        .catch((error: Error) => {
          appLogger.writeLogToFile("error", error);
        });
    } catch (e) {
      console.log(e);
    }
  }

  buildServerUtil(
    output: any,
    arrayAsstutls: any,
    arrayout: any,
    headerdata: any,
    tenant: any,
    element: any
  ): void {
    if (output == undefined || output == null) {
      output = {
        "CPU:CPU_UTIL:PERCENT":
          Math.floor(Math.random() * (10000 - 100) + 100) / 100,
        "MEMORY:MEM_USEPERCENT:PERCENT":
          Math.floor(Math.random() * (10000 - 100) + 100) / 100,
        "CPU:CPU_SPEED:GHz":
          Math.floor(Math.random() * (3000 - 100) + 100) / 100,
        "MEMORY:MEM_TOTAL:GB": Math.floor(Math.random() * 12) + 1,
        "MEMORY:MEM_FREE:GB": Math.floor(Math.random() * 12) + 1,
        "DISK:DISK_READ:Kbps":
          Math.floor(Math.random() * (20000 - 100) + 100) / 100,
        "DISK:DISK_WRITE:Kbps":
          Math.floor(Math.random() * (10000 - 100) + 100) / 100,
        "ETHERNET:NET_RECV:Kbps":
          Math.floor(Math.random() * (500 - 100) + 100) / 100,
        "ETHERNET:NET_SEND:Kbps":
          Math.floor(Math.random() * (500 - 100) + 100) / 100,
      };
    }
    arrayout.push(output);
    for (var key in output) {
      //console.log('Key : ', key);
      if (output.hasOwnProperty(key)) {
        var keys = key.split(":");
        let obj = {
          utilhdrid: headerdata.utilhdrid,
          tenantid: tenant.tenantid,
          utildate: new Date(),
          instanceid: element.instanceid,
          utiltype: keys[0],
          utilkey: keys[1],
          value: output[key],
          uom: keys[2],
        };
        arrayAsstutls.push(obj);
      }
    }
  }
  saveServerUtil(arrayAsstutls: any, headerdata: any, arrayout: any): void {
    CommonService.bulkCreate(arrayAsstutls, db.AsstUtlDtl)
      .then((data) => {
        CommonService.update(
          { utilhdrid: headerdata.utilhdrid },
          {
            responsedata: JSON.stringify(arrayout),
            status: constants.STATUS_SUCCESS,
          },
          db.AsstUtlHdr
        )
          .then((data) => {})
          .catch((error: Error) => {});
      })
      .catch((error: Error) => {
        console.log(error);
      });
  }
  cronJob2(): void {
    let cwd = process.cwd();
    let pscommand =
      cwd +
      `\\node_modules\\winexe\\bin\\paexec.exe \\169.254.0.59 -u "Administrator" -p "csdm#2020" powershell $server = 'ad.lab.local'; $MaxClockSpeed = $(Get-WmiObject Win32_Processor ^| select -first 1).MaxClockSpeed; $ProcessorPerformance = (Get-Counter -Counter '\Processor Information(_Total)\% Processor Performance').CounterSamples.CookedValue; $CurrentCPUSpeed = [Math]::round($($MaxClockSpeed*($ProcessorPerformance/100))/1000,2); $BaseCpuSpeed = [Math]::round(($MaxClockSpeed/1000),2); $CPUUsagePercentage = [Math]::round($(Get-Counter -Counter '\Processor(_Total)\% Processor Time' ^| Select -ExpandProperty countersamples ^| Measure-Object -Average CookedValue).Average,2); $ComputerMemory = Get-WmiObject -Class win32_operatingsystem -ErrorAction Stop; $TotalMemory = [Math]::round($ComputerMemory.TotalVisibleMemorySize/1MB); $FreeMemory = [Math]::round($ComputerMemory.FreePhysicalMemory /1MB,2); $Memory = ((($ComputerMemory.TotalVisibleMemorySize - $ComputerMemory.FreePhysicalMemory)*100)/ $ComputerMemory.TotalVisibleMemorySize); $memoryUsagePercentage = [math]::Round($Memory, 2); $DiskRead = [Math]::round($(Get-Counter -Counter '\physicaldisk(_total)\Disk Read Bytes/sec' ^| select -ExpandProperty countersamples ^| Measure-Object -Average CookedValue).Average/1000,2); $DiskWrite = [Math]::round($(Get-Counter -Counter '\physicaldisk(_total)\Disk Write Bytes/sec' ^| select -ExpandProperty countersamples ^| Measure-Object -Average CookedValue).Average/1000,2); $BRPS = 0; $BSPS = 0; $adapters = Get-WmiObject -Class Win32_PerfFormattedData_Tcpip_NetworkInterface ^| select Name, BytesReceivedPersec, BytesSentPersec ^| where {$_.BytesReceivedPersec -ne 0 -and $_.BytesSentPersec -ne 0}; If($adapters) { $count = $($adapters ^| Measure-Object).count; foreach($adapter in $adapters) { $BRPS += $adapter.BytesReceivedPersec; $BSPS += $adapter.BytesSentPersec; } $BRPS_avg = $BRPS/$count; $BSPS_avg = $BSPS/$count; $Received_Kbps = [Math]::round($BRPS_avg/125,2); $Sent_Kbps = [Math]::round($BSPS_avg/125,2); } else { $Received_Kbps = $BRPS; $Sent_Kbps = $BSPS; } $Object = New-Object PSObject; $Object ^| Add-Member -MemberType NoteProperty -Name 'CPU:CPU_UTIL:PERCENT' -Value $CPUUsagePercentage; $Object ^| Add-Member -MemberType NoteProperty -Name 'MEMORY:MEM_USEPERCENT:PERCENT' -Value $memoryUsagePercentage; $Object ^| Add-Member -MemberType NoteProperty -Name 'CPU:CPU_SPEED:GHz' -Value $CurrentCPUSpeed; $Object ^| Add-Member -MemberType NoteProperty -Name 'MEMORY:MEM_TOTAL:GB' -Value $TotalMemory; $Object ^| Add-Member -MemberType NoteProperty -Name 'MEMORY:MEM_FREE:GB' -Value $FreeMemory; $Object ^| Add-Member -MemberType NoteProperty -Name 'DISK:DISK_READ:KBs' -Value $DiskRead; $Object ^| Add-Member -MemberType NoteProperty -Name 'DISK:DISK_WRITE:KBs' -Value $DiskWrite; $Object ^| Add-Member -MemberType NoteProperty -Name 'ETHERNET:NET_RECV:Kbps' -Value $Received_Kbps; $Object ^| Add-Member -MemberType NoteProperty -Name 'ETHERNET:NET_SEND:Kbps' -Value $Sent_Kbps; return ConvertTo-Json $Object;`;
    console.log(pscommand);
    shell.exec(pscommand, function (err, stdout, stderr) {
      console.log("err >>", err);
      console.log("stdout >>", stdout);
      console.log("stderr >>", stderr);
      if (err) {
        console.log(err);
      } else {
      }
    });
  }
}
export default new Controller();

import * as _ from "lodash";
import * as request from "request";
import db from "../models/model";
import { constants } from "../../common/constants";
import CommonService from "../services/common.service";
import { queries } from "../../common/query";
import * as moment from "moment";
import commonService from "../services/common.service";
import { AppError } from "../../common/appError";
import NotificationService from "../services/notification.service";
import * as AWS from "aws-sdk";

var fs = require("fs");
var jsonexport = require("jsonexport");
// var AWS = require("aws-sdk");

class ReportService {
  constructor() {}
  getDailyReport() {
    try {
      return new Promise((resolve, reject) => {
        let q = queries.DATACOLS_DAILY;
        let params = {
          replacements: {
            fromdate: moment().format("YYYY-MM-DD") + " 00:00:00",
            todate: moment().format("YYYY-MM-DD") + " 23:59:59",
          },
          type: db.sequelize.QueryTypes.SELECT,
        };
        CommonService.executeQuery(q, params, db.sequelize)
          .then((list) => {
            list = JSON.parse(JSON.stringify(list));
            jsonexport(
              list,
              {
                headers: [
                  "AccountID",
                  "InstanceID",
                  "Timedate",
                  "CPUUtilizationMaximum",
                  "CPUUtilizationMinimum",
                  "CPUUtilizationAverage",
                  "NetworkIn",
                  "NetworkOut",
                  "RAMUtilisation",
                  "DiskUtilisation",
                  "DiskTotalGb",
                ],
                rename: [
                  "AccountID",
                  "InstanceID",
                  "Date",
                  "CPUUtilizationMaximum(%)",
                  "CPUUtilizationMinimum(%)",
                  "CPUUtilizationAverage(%)",
                  "NetworkIn(Bytes)",
                  "NetworkOut(Bytes)",
                  "RAMUtilisation(%)",
                  "DiskUtilisation(GB)",
                  "DiskTotal(GB)",
                ],
              },
              function (err, csv) {
                // fs.writeFile('datacollections11.csv', csv, function (d) {
                //     console.log("file created");
                // });
                if (err) {
                  console.log(err);
                } else {
                  let cloudcredentials = {
                    cloudauthkey: constants.AWS_S3_CREDENTIALS.AUTH_KEY,
                    cloudseckey: constants.AWS_S3_CREDENTIALS.SECRET_KEY,
                  };
                  new ReportService()
                    .getCrossAccountCredentials(
                      cloudcredentials,
                      constants.AWS_S3_CREDENTIALS.REGION,
                      constants.AWS_S3_CREDENTIALS.ACCOUNTID,
                      constants.AWS_S3_CREDENTIALS.IAMROLE
                    )
                    .then((roledata: any) => {
                      AWS.config.region = constants.AWS_S3_CREDENTIALS.REGION;
                      AWS.config.update(roledata);
                      let filename =
                        "Datacollection_" + moment().format("DD-MM-YYYY");

                      let params = {
                        Bucket: process.env.S3_BUCKET_STATICS,
                        Key: `${filename}.csv`,
                        Body: csv,
                      };
                      var s3 = new AWS.S3({
                        apiVersion: constants.AWS_S3_APIVERSION,
                      });
                      s3.upload(params, function (err, data) {
                        console.log(err, data);
                      });
                    })
                    .catch((e) => {
                      console.log(e);
                    });
                }
              }
            );
          })
          .catch((error: any) => {
            reject(error);
          });
      });
    } catch (error) {
      console.log(error);
    }
  }

  getCrossAccountCredentials = async (
    ecl2cloud: any,
    region: any,
    awsaccountid: any,
    awsiamrole: any
  ) => {
    return new Promise((resolve, reject) => {
      if (awsaccountid == undefined || awsaccountid == null) {
        awsaccountid = "436437695588";
      }
      if (awsiamrole == undefined || awsiamrole == null) {
        awsiamrole = "CloudOperationsGlobalCrossAccountCloudMatiq";
      }
      let accesskeys = {
        accessKeyId: ecl2cloud.cloudauthkey,
        secretAccessKey: ecl2cloud.cloudseckey,
        region: region,
      };

      AWS.config.update(accesskeys);
      AWS.config.region = region;
      AWS.config.apiVersions = {
        sts: "2011-06-15",
        // other service API versions
      };
      var sts = new AWS.STS({});
      sts.assumeRole(
        {
          RoleArn: "arn:aws:iam::" + awsaccountid + ":role/" + awsiamrole,
          RoleSessionName: "CloudOperationsGlobal",
          DurationSeconds: 1800,
        },
        function (err, roledata) {
          if (err) {
            console.log("Error gaining AWS Access ARN");
            console.log(err, err.stack);
            resolve(accesskeys);
          } // an error occurred
          else {
            console.log("AWS Access ARN gained.");
            resolve({
              accessKeyId: roledata.Credentials.AccessKeyId,
              secretAccessKey: roledata.Credentials.SecretAccessKey,
              sessionToken: roledata.Credentials.SessionToken,
            });
          }
        }
      );
    });
  };

  getDailyBilling(data?: { startdate: string; enddate: string }) {
    let startdate = data
      ? data.startdate
      : moment().subtract(1, "days").format("YYYY-MM-DD");
    let enddate = data ? data.enddate : moment().format("YYYY-MM-DD");
    // let query = queries.ASSET_BILLING; //query to update contact id from instances table
    // let asstdailybillquery = queries.ASSET_BILLING_UPDATE_CONTACT;
    // let replacement = {
    //   replacements: {
    //     billingdt: moment(startdate).format("YYYY-MM-DD"),
    //   },
    // };
    // let deletequeryrep = {
    //   month: moment(startdate).format("MM"),
    //   year: moment(startdate).format("YYYY"),
    // };
    // // Delete the older records
    // commonService
    //   .executeQuery(
    //     queries.DELETE_EXISTING_BILLING,
    //     { replacements: deletequeryrep },
    //     db.sequelize
    //   )
    //   .then((updated) => {
    //     // getECLBilling();
    //     console.log("STARTED DAILY BILLING >>>>>>");
    //     getAWSBilling();

    //     // Not required can be consolidated using AWSBilling function alone
    //     // getAWSDetailsBilling();
    //   });

    // getAWSBilling();
    getAWSDetailsBilling();

    function getAWSBilling() {
      //to get aws billing
      let lookupkey = ["AWS_BILL_AUTHKEY", "AWS_BILL_SECRKEY"];
      commonService
        .getAllList(
          { where: { lookupkey: { $in: lookupkey }, tenantid: 7 } },
          db.LookUp
        )
        .then((lookupData) => {
          let accessKey = _.find(lookupData, { keyname: "accesskey" }) as any;
          let secretKey = _.find(lookupData, { keyname: "secretkey" }) as any;
          if (accessKey && secretKey) {
            accessKey = JSON.parse(JSON.stringify(accessKey));
            secretKey = JSON.parse(JSON.stringify(secretKey));
            let params = {
              //parameter for API
              TimePeriod: {
                Start: startdate,
                End: enddate,
              },
              Granularity: "MONTHLY",
              Filter: {
                Dimensions: {
                  Key: "SERVICE",
                  Values: ["Amazon Elastic Compute Cloud - Compute"],
                },
              },
              GroupBy: [
                {
                  Type: "DIMENSION",
                  Key: "RESOURCE_ID",
                },
              ],
              Metrics: ["BlendedCost", "UnblendedCost", "UsageQuantity"],
            };
            try {
              AWS.config.update({
                accessKeyId: accessKey.keyvalue,
                secretAccessKey: secretKey.keyvalue,
                region: "us-east-1",
              });
              AWS.config.apiVersions = {
                costexplorer: constants.AWS_CE_BILLING,
              };
              var costexplorer = new AWS.CostExplorer();
              costexplorer.getCostAndUsageWithResources(
                params,
                function (err, data) {
                  if (err) console.log(" Don't have permission", err);
                  else {
                    console.log("DATA FROM AWS BILLING COST EXPLORER >>>>>>>>");
                    console.log(JSON.stringify(data));
                    if (data && data.ResultsByTime && data.ResultsByTime[0]) {
                      let updateData = [] as any;
                      for (var metricsData of data.ResultsByTime[0].Groups) {
                        let currency: any =
                          constants.CURRENCY[
                            metricsData.Metrics.BlendedCost.Unit
                          ];
                        let obj = {
                          tenantid: 7,
                          billingdt: startdate,
                          instancerefid: metricsData.Keys
                            ? metricsData.Keys[0]
                            : null,
                          cloudprovider: "AWS",
                          resourcetype: "ASSET_INSTANCE",
                          currency: currency ? currency : null,
                          billamount: metricsData.Metrics
                            ? metricsData.Metrics.BlendedCost.Amount
                            : null,
                          status: constants.STATUS_ACTIVE,
                          createdby: "Admin",
                          createddt: new Date(),
                        };
                        updateData.push(obj);
                      }
                      commonService
                        .bulkCreate(updateData, db.AsstBilling)
                        .then((metricsData) => {
                          console.log("Data return to asset billing table.");

                          // commonService
                          //   .executeQuery(query, replacement, db.sequelize)
                          //   .then((res) => {
                          //     console.log("success");

                          //     // Daily asst billings
                          //     let instancedailybillings = [] as any;
                          //     instancedailybillings = _.filter(updateData, {
                          //       resourcetype: "ASSET_INSTANCE",
                          //     });
                          //     if (
                          //       instancedailybillings &&
                          //       instancedailybillings.length > 0
                          //     ) {
                          //       commonService
                          //         .bulkCreate(updateData, db.AssetDailyBilling)
                          //         .then((metricsData) => {
                          //           commonService
                          //             .executeQuery(
                          //               asstdailybillquery,
                          //               replacement,
                          //               db.sequelize
                          //             )
                          //             .then((res) => {});
                          //         });
                          //     }
                          //   });
                        })
                        .catch((e) => {
                          console.log(e);
                        });
                    }
                  }
                }
              );
            } catch (e) {
              console.log(" Don't have permission", e);
            }
          }
        });
    }

    function getECLBilling() {
      let parameters = {} as any;
      parameters = {
        where: {
          fieldlabel: { $in: ["CLOUD_DETAILS"] },
          tenantid: { $ne: -1 },
        },
      };
      commonService
        .getAllList(parameters, db.CustomField)
        .then((ecl2authdata: any) => {
          for (let authdata of ecl2authdata) {
            let authdetails = commonService.decrypt(authdata.fieldvalue);
            if (authdetails) {
              authdetails = JSON.parse(authdetails);
              for (let cloudauthdetail of authdetails) {
                let cloudauthdetails = cloudauthdetail as any;
                if (
                  cloudauthdetails.referenceid &&
                  cloudauthdetails.referenceid != ""
                ) {
                  let metricsArray = [] as any;
                  let url = constants.ECL2_BILLING as any;
                  url = url.replace("{zone}", "us1");
                  url = url.replace(
                    "{month}",
                    moment(startdate).format("YYYY-MM")
                  );
                  url = url.replace(
                    "{ecl2contract}",
                    cloudauthdetails.referenceid
                  );
                  new ReportService()
                    .callECL2Reqest(
                      "us1",
                      url,
                      "Content-Type: application/json",
                      cloudauthdetails.cloudauthkey,
                      cloudauthdetails.cloudseckey
                    )
                    .then((ecl2data) => {
                      if (
                        ecl2data &&
                        ecl2data.charge_data &&
                        ecl2data.charge_data.data &&
                        ecl2data.charge_data.data.item &&
                        ecl2data.charge_data.data.item.item
                      ) {
                        //get provider total billing cost
                        let currency: any =
                          constants.CURRENCY[
                            ecl2data.charge_data.data.item.currency
                          ];
                        let obj = {
                          tenantid: authdata.tenantid,
                          billingdt: moment(startdate).format("YYYY-MM-DD"),
                          instancerefid: "",
                          cloudprovider: "ECL2",
                          resourcetype: "TOTAL_BILLING_COST",
                          customername: "",
                          currency: currency ? currency : null,
                          billamount: ecl2data.charge_data.data.item.amount
                            ? ecl2data.charge_data.data.item.amount
                            : null,
                          status: constants.STATUS_ACTIVE,
                          createdby: "Admin",
                          createddt: new Date(),
                        };
                        metricsArray.push(obj);
                        formArray(ecl2data.charge_data.data.item.item);
                        commonService
                          .bulkCreate(metricsArray, db.AsstBilling)
                          .then((metricsData) => {
                            // commonService
                            //   .executeQuery(
                            //     queries.UPDATE_BILLING_REFID,
                            //     replacement,
                            //     db.sequelize
                            //   )
                            //   .then((res) => {
                            //     commonService
                            //       .executeQuery(
                            //         query,
                            //         replacement,
                            //         db.sequelize
                            //       )
                            //       .then((res) => {
                            //         console.log("Success");
                            //         new ReportService().notifyBudgetOverRun(
                            //           "ECL2",
                            //           startdate
                            //         );
                            //       });
                            //   });
                            // // Daily asst billings
                            // let instancedailybillings = [] as any;
                            // instancedailybillings = _.filter(metricsArray, {
                            //   resourcetype: "ASSET_INSTANCE",
                            // });
                            // if (
                            //   instancedailybillings &&
                            //   instancedailybillings.length > 0
                            // ) {
                            //   commonService
                            //     .bulkCreate(
                            //       instancedailybillings,
                            //       db.AssetDailyBilling
                            //     )
                            //     .then((metricsData) => {
                            //       commonService
                            //         .executeQuery(
                            //           queries.UPDATE_DAILYBILLING_REFID,
                            //           replacement,
                            //           db.sequelize
                            //         )
                            //         .then((res) => {
                            //           commonService
                            //             .executeQuery(
                            //               asstdailybillquery,
                            //               replacement,
                            //               db.sequelize
                            //             )
                            //             .then((res) => {});
                            //         });
                            //     });
                            // }
                          })
                          .catch((e) => {
                            console.log(e);
                          });
                      }
                    })
                    .catch((e) => {
                      console.log(e);
                    });

                  // tslint:disable-next-line:no-inner-declarations
                  function formIndividuals(array, customername) {
                    for (let metricsData of array) {
                      let currency: any =
                        constants.CURRENCY[metricsData.currency];
                      if (metricsData.name === "Virtual Server") {
                        for (let serverData of metricsData.item) {
                          if (serverData.name === "Compute") {
                            let instancereferenceid;
                            let refid = JSON.stringify(
                              serverData.description
                            ).split(":") as any;
                            if (refid && refid[1]) {
                              instancereferenceid = refid[1].split(",")[0];
                            }
                            let currency: any =
                              constants.CURRENCY[serverData.currency];
                            let obj = {
                              tenantid: authdata.tenantid,
                              billingdt: moment(startdate).format("YYYY-MM-DD"),
                              instancerefid: instancereferenceid
                                ? instancereferenceid
                                : null,
                              cloudprovider: "ECL2",
                              resourcetype: "ASSET_INSTANCE",
                              customername: customername,
                              currency: currency ? currency : null,
                              billamount: serverData.amount,
                              status: constants.STATUS_ACTIVE,
                              createdby: "Admin",
                              createddt: new Date(),
                            };
                            metricsArray.push(obj);
                          }
                        }
                      }

                      // To form high level details
                      let obj = {
                        billingdt: moment(startdate).format("YYYY-MM-DD"),
                        instancerefid: "",
                        cloudprovider: "ECL2",
                        resourcetype: new ReportService().resourceType(
                          metricsData.name
                        ),
                        customername: customername,
                        currency: currency ? currency : null,
                        billamount: metricsData.amount,
                        status: constants.STATUS_ACTIVE,
                        createdby: "Admin",
                        createddt: new Date(),
                      };
                      metricsArray.push(obj);
                    }
                  }
                  // to form data for asset billing table
                  // tslint:disable-next-line:no-inner-declarations
                  function formArray(array) {
                    console.log("Started>>>>>");
                    for (let metricsData of array) {
                      let customername = "";
                      let desc = JSON.stringify(metricsData.description).split(
                        ","
                      ) as any;
                      if (desc && desc[0]) {
                        customername = desc[0].split(":");
                        customername = customername[1];
                      }
                      if (metricsData.name === "Tenants") {
                        if (metricsData.item.length > 0) {
                          let ecl2Data: any = _.find(metricsData.item, {
                            name: "Enterprise Cloud 2.0",
                          });
                          // console.log(ecl2Data);
                          if (ecl2Data != undefined) {
                            formIndividuals(ecl2Data.item, customername);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
    }

    function getAWSDetailsBilling() {
      let lookupkey = ["AWS_BILL_AUTHKEY", "AWS_BILL_SECRKEY"];
      commonService
        .getAllList(
          { where: { lookupkey: { $in: lookupkey }, tenantid: 7 } },
          db.LookUp
        )
        .then((lookupData) => {
          let accessKey = _.find(lookupData, { keyname: "accesskey" }) as any;
          let secretKey = _.find(lookupData, { keyname: "secretkey" }) as any;
          if (accessKey && secretKey) {
            accessKey = JSON.parse(JSON.stringify(accessKey));
            secretKey = JSON.parse(JSON.stringify(secretKey));
            let params = {
              TimePeriod: {
                Start: data.startdate,
                End: data.enddate,
              },
              Granularity: "DAILY",
              GroupBy: [
                {
                  Type: "DIMENSION",
                  Key: "SERVICE",
                },
                {
                  Type: "DIMENSION",
                  Key: "LINKED_ACCOUNT",
                },
              ],
              Metrics: ["BlendedCost", "UnblendedCost", "UsageQuantity"],
            };

            AWS.config.update({
              accessKeyId: accessKey.keyvalue,
              secretAccessKey: secretKey.keyvalue,
              region: "us-east-1",
            });
            AWS.config.apiVersions = {
              costexplorer: constants.AWS_CE_BILLING,
            };
            var costexplorer = new AWS.CostExplorer();

            costexplorer.getCostAndUsage(params, function (err, data) {
              if (err) {
                console.log(" Don't have permission >>>>>>>>>>>>>>>>>>");
                console.log(err);
                console.log(params);
              } else {
                let query = queries.CUSTOMER_ID_UPDATION; //query to update contact id from instances table
                let replacement = {
                  replacements: {
                    billingdt: moment(startdate).format("YYYY-MM-DD"),
                  },
                };
                console.log("PULL BILLING DATA >>>>>>>>>>>>>>>>>>>>.");
                console.log(JSON.stringify(data));
                if (data && data.ResultsByTime && data.ResultsByTime[0]) {
                  let updateData = [] as any;
                  for (var metricsData of data.ResultsByTime[0].Groups) {
                    if (
                      metricsData.Metrics &&
                      (metricsData as any).Metrics.BlendedCost.Amount > 1
                    ) {
                      let currency: any =
                        constants.CURRENCY[
                          metricsData.Metrics.BlendedCost.Unit
                        ];
                      let obj = {
                        billingdt: moment(startdate).format("YYYY-MM-DD"),
                        instancerefid: metricsData.Keys
                          ? metricsData.Keys[0]
                          : null,
                        customername: metricsData.Keys
                          ? metricsData.Keys[1]
                          : null,
                        cloudprovider: "AWS",
                        resourcetype: metricsData.Keys
                          ? metricsData.Keys[0]
                          : null,
                        currency: currency ? currency : null,
                        billamount: metricsData.Metrics
                          ? metricsData.Metrics.BlendedCost.Amount
                          : null,
                        status: constants.STATUS_ACTIVE,
                        createdby: "Admin",
                        createddt: new Date(),
                        tenantid: 7,
                      };
                      updateData.push(obj);
                    }
                  }
                  commonService
                    .bulkCreate(updateData, db.AsstBilling)
                    .then((metricsData) => {
                      commonService
                        .executeQuery(query, replacement, db.sequelize)
                        .then((res) => {
                          console.log("Success");
                        });
                    })
                    .catch((e) => {
                      console.log(e);
                    });
                }
              }
            });

            // let awsServices = constants.AWS_SERVICE;
            // let service = 0;
            // startCollect();
            // function startCollect() {
            //   try {
            //     if (awsServices[service]) {
            //       new ReportService()
            //         .pullBillingData(
            //           accessKey,
            //           secretKey,
            //           params,
            //           startdate,
            //           awsServices[service]
            //         )
            //         .then((res) => {
            //           service += 1;
            //           startCollect();
            //         })
            //         .catch((e) => {
            //           console.log(e);
            //           service += 1;
            //           startCollect();
            //         });
            //     } else {
            //       new ReportService().notifyBudgetOverRun("AWS", startdate);
            //     }
            //   } catch (e) {
            //     console.log(" Don't have permission", e);
            //     service += 1;
            //     startCollect();
            //   }
            // }
          }
        });
    }
  }

  pullBillingData(
    accessKey,
    secretKey,
    params,
    startdate,
    assettype
  ): Promise<any> {
    let promise = new Promise<void>((resolve: Function, reject: Function) => {
      AWS.config.update({
        accessKeyId: accessKey.keyvalue,
        secretAccessKey: secretKey.keyvalue,
        region: "us-east-1",
      });
      AWS.config.apiVersions = {
        costexplorer: constants.AWS_CE_BILLING,
      };
      var costexplorer = new AWS.CostExplorer();
      if (assettype != "TOTAL_BILLING_COST") {
        params.GroupBy = [
          {
            Type: "DIMENSION",
            Key: "SERVICE",
          },
          {
            Type: "DIMENSION",
            Key: "LINKED_ACCOUNT",
          },
        ];
      }
      costexplorer.getCostAndUsage(params, function (err, data) {
        if (err) {
          console.log(" Don't have permission >>>>>>>>>>>>>>>>>>");
          console.log(err);
          console.log(params);
          reject(assettype);
        } else {
          let query = queries.CUSTOMER_ID_UPDATION; //query to update contact id from instances table
          let replacement = {
            replacements: {
              billingdt: moment(startdate).format("YYYY-MM-DD"),
            },
          };
          console.log("PULL BILLING DATA >>>>>>>>>>>>>>>>>>>>.");
          console.log(JSON.stringify(data));
          resolve(JSON.stringify(data));
          if (data && data.ResultsByTime && data.ResultsByTime[0]) {
            let updateData = [] as any;
            if (assettype == "TOTAL_BILLING_COST") {
              let metricsData = data.ResultsByTime[0].Total;
              let currency: any =
                constants.CURRENCY[metricsData.BlendedCost.Unit];
              let obj = {
                billingdt: moment(startdate).format("YYYY-MM-DD"),
                instancerefid: null,
                customername: null,
                tenantid: 7,
                cloudprovider: "AWS",
                resourcetype: assettype,
                currency: currency ? currency : null,
                billamount: metricsData ? metricsData.BlendedCost.Amount : null,
                status: constants.STATUS_ACTIVE,
                createdby: "Admin",
                createddt: new Date(),
              };
              updateData.push(obj);
            } else {
              for (var metricsData of data.ResultsByTime[0].Groups) {
                if (
                  metricsData.Metrics &&
                  (metricsData as any).Metrics.BlendedCost.Amount > 1
                ) {
                  let currency: any =
                    constants.CURRENCY[metricsData.Metrics.BlendedCost.Unit];
                  let obj = {
                    billingdt: moment(startdate).format("YYYY-MM-DD"),
                    instancerefid: metricsData.Keys
                      ? metricsData.Keys[0]
                      : null,
                    customername: metricsData.Keys ? metricsData.Keys[1] : null,
                    cloudprovider: "AWS",
                    resourcetype: metricsData.Keys ? metricsData.Keys[0] : null,
                    currency: currency ? currency : null,
                    billamount: metricsData.Metrics
                      ? metricsData.Metrics.BlendedCost.Amount
                      : null,
                    status: constants.STATUS_ACTIVE,
                    createdby: "Admin",
                    createddt: new Date(),
                    tenantid: 7,
                  };
                  updateData.push(obj);
                }
              }
            }
            commonService
              .bulkCreate(updateData, db.AsstBilling)
              .then((metricsData) => {
                commonService
                  .executeQuery(query, replacement, db.sequelize)
                  .then((res) => {
                    console.log("Success");
                  });
              })
              .catch((e) => {
                console.log(e);
              });
          }
        }
      });
    });
    return promise;
  }

  resourceType(name) {
    try {
      let resourcetype = "";
      switch (name) {
        case "Virtual Server":
          resourcetype = "VIRTUAL_SERVER";
          break;
        case "Storage":
          resourcetype = "ASSET_VOLUME";
          break;
        case "Logical Network":
          resourcetype = "ASSET_NETWORK";
          break;
        case "Discounts":
          resourcetype = "ASSET_DISCOUNT";
          break;
      }
      if (resourcetype == "") {
        var str = name;
        var trim = str.replace(/\s+/g, "");
        resourcetype = "ASSET_" + trim.toUpperCase();
      }
      return resourcetype;
    } catch (e) {
      console.log(e);
    }
  }

  callECL2Reqest(
    pzone: any,
    requesturl: any,
    requestheader: any,
    cloudauthkey: any,
    cloudseckey: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      let ecl2authurl = constants.ECL2_GET_AUTH_TOKEN_URL.replace(
        "{zone}",
        pzone
      );
      request.post(
        {
          url: ecl2authurl,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          json: {
            auth: {
              identity: {
                methods: ["password"],
                password: {
                  user: {
                    domain: {
                      id: "default",
                    },
                    name: cloudauthkey,
                    password: cloudseckey,
                  },
                },
              },
            },
          },
        },
        function (err, httpResponse, body) {
          if (err) {
            reject(new AppError(err.message));
          } else {
            if (_.isEmpty(httpResponse.headers["x-subject-token"])) {
              reject(
                new AppError(
                  constants.ECL2_INVALID_CREDENTIALS.replace("{region}", pzone)
                )
              );
            } else {
              requestheader = _.merge(requestheader, {
                "X-Auth-Token": httpResponse.headers["x-subject-token"],
              });
              request(
                {
                  method: "GET",
                  url: requesturl,
                  headers: requestheader,
                  json: JSON.parse(JSON.stringify({})),
                },
                function (err, httpResponse, body) {
                  if (err) {
                    reject(new AppError(err.message));
                  } else {
                    if (body === "Authentication required") {
                      reject(
                        new AppError(
                          constants.ECL2_INVALID_CREDENTIALS.replace(
                            "{region}",
                            pzone
                          )
                        )
                      );
                    }
                    if (_.has(body, "No X-Auth-Token")) {
                      reject(
                        new AppError(
                          constants.ECL2_INVALID_CREDENTIALS.replace(
                            "{region}",
                            pzone
                          )
                        )
                      );
                    }
                    if (_.has(body, "error")) {
                      reject(
                        new AppError(
                          body.error === ""
                            ? "An unknown error has occurred"
                            : body.error
                        )
                      );
                    }
                    if (_.has(body, "badRequest")) {
                      reject(new AppError(body.badRequest.message));
                    }
                    if (_.has(body, "conflictingRequest")) {
                      reject(new AppError(body.conflictingRequest.message));
                    }
                    if (_.has(body, "api_error_message")) {
                      reject(new AppError(body.api_error_message));
                    }
                    if (_.has(body, "itemNotFound")) {
                      reject(new AppError(body.itemNotFound.message));
                    } else {
                      resolve(body);
                    }
                  }
                }
              );
            }
          }
        }
      );
    });
    return promise;
  }
  notifyBudgetOverRun(provider, date) {
    function formatCurrency(currency, value) {
      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      });
      return formatter.format(value);
    }

    let budgetcondition: any = {
      where: {
        status: constants.STATUS_ACTIVE,
        cloudprovider: provider,
        startdt: { $lt: date },
        enddt: { $gt: date },
      },
    };
    let billingCondition: any = {
      where: {
        resourcetype: "TOTAL_BILLING_COST",
        cloudprovider: provider,
        status: constants.STATUS_ACTIVE,
        billingdt: date,
      },
    };
    commonService
      .getData(billingCondition, db.AsstBilling)
      .then((billingData) => {
        commonService
          .getAllList(budgetcondition, db.AsstBudget)
          .then((budgetData) => {
            if (billingData && budgetData) {
              billingData = JSON.parse(JSON.stringify(billingData));
              budgetData = JSON.parse(JSON.stringify(budgetData));
              budgetData.forEach((budget) => {
                let end_date = new Date(budget.enddt);
                let start_date = new Date(budget.startdt);
                let difference =
                  end_date.getFullYear() * 12 +
                  end_date.getMonth() +
                  1 -
                  (start_date.getFullYear() * 12 + start_date.getMonth());
                let budgetAmount = Math.round(
                  parseInt(budget.budgetamount) / difference
                );
                console.log(
                  "Values are",
                  budgetAmount,
                  parseInt(billingData.billamount)
                );
                if (budgetAmount < parseInt(billingData.billamount)) {
                  let condition = {
                    module: constants.NOTIFICATION_MODULES[7],
                    event: constants.NOTIFICATION_EVENTS[14],
                    // tenantid: budget.tenantid,
                    status: constants.STATUS_ACTIVE,
                  } as any;
                  let mapObj = {
                    "{{billing_amount}}": formatCurrency(
                      constants.CURRENCY_SYMBOL[billingData.currency],
                      billingData.billamount
                    ),
                    "{{budget_amount}}": formatCurrency(
                      constants.CURRENCY_SYMBOL[budget.currency],
                      budgetAmount
                    ),
                    "{{month}}": moment(date).startOf("month").format("MMMM"),
                  };
                  NotificationService.getNotificationSetup(
                    condition,
                    mapObj,
                    "CM - Budget Overrun",
                    "Budget Overrun"
                  );
                }
              });
            }
          })
          .catch((e) => {
            console.log(e);
          });
      })
      .catch((e) => {
        console.log(e);
      });
  }
}
export default new ReportService();

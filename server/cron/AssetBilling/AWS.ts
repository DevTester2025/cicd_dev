import * as AWS from "aws-sdk";
import * as moment from "moment";

import db from "../../api/models/model";
import { constants } from "../../common/constants";
import commonService from "../../api/services/common.service";
import { ICloudDetails, ICustomer } from "../interface";
import { APIVersions, ConfigurationOptions } from "aws-sdk/lib/config";
import { ConfigurationServicePlaceholders } from "aws-sdk/lib/config_service_placeholders";
import * as LogToFile from "log-to-file";
import BudgetService from "../../api/services/budget.service";

interface CronOptions {
  start: Date;
  end: Date;
}

export default class AWSBillingCron {
  private tenantid: number;
  private options: CronOptions;

  private authKey: string;
  private authSecret: string;
  private authAccountType: "Root Account" | string;

  private customers: ICustomer[] = [];

  private services: string[] = [];

  constructor(tenantid: number, options?: CronOptions) {
    this.tenantid = tenantid;
    this.options = {
      start:
        options && options.start
          ? options.start
          : moment().subtract(1, "days").toDate(),
      end: options && options.end ? options.end : new Date(),
    };
  }

  init() {
    LogToFile(
      `Billing to be fetched for ${this.options.start} and ${this.options.end}`
    );
    this.getSecrets();
  }

  private getSecrets() {
    LogToFile(`Trying to obtain secrets to pull in billing record`);
    try {
      db.CustomField.findAll({
        where: {
          tenantid: this.tenantid,
          status: constants.STATUS_ACTIVE,
          fieldlabel: { $in: ["CLOUD_DETAILS"] },
        },
      })
        .then((records) => {
          const cloudDetails = records ? records[0] : null;

          if (cloudDetails) {
            const cloudLists = JSON.parse(
              commonService.decrypt(cloudDetails.dataValues["fieldvalue"])
            ) as ICloudDetails[];
            const AWSCred = cloudLists.find((o) => o["cloudprovider"] == "AWS");

            if (AWSCred) {
              this.authKey = AWSCred.cloudauthkey;
              this.authSecret = AWSCred.cloudseckey;
              this.authAccountType = AWSCred.accounttype;
              this.getAllCustomers();
            } else {
              throw new Error("No credentials found for AWS.");
            }
          } else {
            throw new Error("No credentials found");
          }
        })
        .catch((err) => {
          console.log("Error getting account credentials");
          console.log(err);
          throw err;
        });
    } catch (error) {
      console.log("ERROR GETTING SECRETS >>>>");
      console.log(error);
    }
  }

  private getAllCustomers() {
    LogToFile("Getting all customers");
    // let parameters = {
    //   where: {
    //     tenantid: this.tenantid,
    //     status: constants.STATUS_ACTIVE,
    //   },
    //   order: [["lastupdateddt", "desc"]],
    // } as any;
    // parameters.include = [] as any;
    // parameters.include = [
    //   {
    //     model: db.TenantRegion,
    //     as: "tenantregion",
    //     required: false,
    //     where: { status: constants.STATUS_ACTIVE },
    //   },
    // ];

    db.Customer.findAll({
      where: { tenantid: this.tenantid, status: constants.STATUS_ACTIVE },
      include: [
        {
          model: db.TenantRegion,
          as: "tenantregion",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          model: db.CustomerAccount,
          as: "accounts",
          required: false,
          where: { status: constants.STATUS_ACTIVE },
        },
      ],
    })
      .then((list) => {
        const customers: ICustomer[] = JSON.parse(JSON.stringify(list));
        customers.forEach((c) => {
          c.accounts.forEach((a) => {
            this.customers.push({
              ...c,
              awsaccountid: a.accountref,
              $role: a.rolename,
              $_accountid: a.id,
            });
          });
        });
        LogToFile("CUSTOMERS LIST >>>>>");
        LogToFile(JSON.stringify(this.customers));
        this.processBillingForNextCustomer();
      })
      .catch((error: Error) => {
        console.log("ERROR GETTING CUSTOMERS LIST >>>>>>>>>>>");
      });
  }

  private getAWSCred(
    region: string,
    accountid?: string,
    role?: string
  ): Promise<
    ConfigurationOptions & ConfigurationServicePlaceholders & APIVersions
  > {
    return new Promise((resolve, reject) => {
      const keys = {
        secretAccessKey: this.authSecret,
        accessKeyId: this.authKey,
        region: region,
      };

      if (this.authAccountType == "Root Account") {
        resolve(keys);
      } else {
        AWS.config.update(keys);
        AWS.config.region = region;
        AWS.config.apiVersions = {
          sts: "2011-06-15",
        };
        let sts = new AWS.STS({});
        sts.assumeRole(
          {
            RoleArn: "arn:aws:iam::" + accountid + ":role/" + role,
            RoleSessionName: "CloudOperationsGlobal",
            DurationSeconds: 1800,
          },
          function (err, roledata) {
            if (err) {
              console.log("Error gaining AWS Access ARN");
              console.log(err, err.stack);
              reject("Unable to switch role");
            } else {
              resolve({
                accessKeyId: roledata.Credentials.AccessKeyId,
                secretAccessKey: roledata.Credentials.SecretAccessKey,
                sessionToken: roledata.Credentials.SessionToken,
              });
            }
          }
        );
      }
    });
  }

  private async processBillingForNextCustomer() {
    const customer = this.customers.pop();

    if (customer) {
      try {
        await this.processAssetTypeLevelBillingForCustomer(customer);
        await this.processResourceLevelBillingForCustomer(customer);
        LogToFile(`BILLING PROCESSED FOR CUSTOMER ${customer.customername}`);
        this.processBillingForNextCustomer();
      } catch (error) {
        console.log(
          `ERROR PROCESSING BILLING FOR CUSTOMER ${customer.customername}`
        );
        console.log(error);
      }
    } else {
      LogToFile(
        `Processed billing for all customers. Proceeding to notify users based on budgets.`
      );
      const s = new BudgetService(this.tenantid);
      s.init();
    }
  }

  private processAssetTypeLevelBillingForCustomer(customer: ICustomer) {
    return new Promise(async (resolve, reject) => {
      try {
        const resourcesTypes = new Set<string>();

        let params = {
          TimePeriod: {
            Start: moment(this.options.start).format("YYYY-MM-DD"),
            End: moment(this.options.end).format("YYYY-MM-DD"),
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
          Metrics: ["UnblendedCost"],
        };

        const awsConfig = await this.getAWSCred(
          "us-east-1",
          customer.awsaccountid,
          customer.$role
        );

        AWS.config.update(awsConfig);
        AWS.config.apiVersions = {
          costexplorer: constants.AWS_CE_BILLING,
        };
        var costexplorer = new AWS.CostExplorer();

        costexplorer.getCostAndUsage(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            if (data && data.ResultsByTime && data.ResultsByTime[0]) {
              let updateData = [] as any;
              for (var metricsData of data.ResultsByTime[0].Groups) {
                if (metricsData.Metrics) {
                  for (const key in metricsData.Metrics) {
                    if (
                      Object.prototype.hasOwnProperty.call(
                        metricsData.Metrics,
                        key
                      )
                    ) {
                      const element = metricsData.Metrics[key];

                      let currency: any =
                        constants.CURRENCY[
                          metricsData.Metrics.UnblendedCost.Unit
                        ];
                      resourcesTypes.add(metricsData.Keys[0]);
                      let obj = {
                        billingdt: moment(this.options.start).format(
                          "YYYY-MM-DD"
                        ),
                        customername: customer.customername,
                        customerid: customer.customerid,
                        cloudprovider: "AWS",
                        _accountid: customer.$_accountid,
                        resourcetype: metricsData.Keys
                          ? metricsData.Keys[0]
                          : null,
                        cloud_resourceid: null,
                        currency: currency ? currency : null,
                        billamount: metricsData.Metrics ? element.Amount : null,
                        status: constants.STATUS_ACTIVE,
                        createdby: "Admin",
                        createddt: new Date(),
                        tenantid: this.tenantid,
                        costtype: key,
                      };
                      updateData.push(obj);
                    }
                  }
                }
              }
              commonService
                .bulkCreate(updateData, db.AsstBilling)
                .then((metricsData) => {
                  LogToFile(
                    "Resource type values >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
                  );
                  LogToFile(resourcesTypes);
                  this.services = Array.from<string>(resourcesTypes);
                  resolve(true);
                })
                .catch((e) => {
                  reject(e);
                });
            } else {
              console.log("GET COST AND USAGE >>>>>>");
              console.log(data);
            }
          }
        });
      } catch (error) {
        console.log(
          "ERROR PROCESSING RESOURCE TYPE LEVEL BILLING >>>>>>>>>>>>>>"
        );
        console.log(error);
        reject(error);
      }
    });
  }

  private processResourceLevelBillingForCustomer(customer: ICustomer) {
    return new Promise(async (resolve, reject) => {
      while (this.services.length > 0) {
        const service = this.services.pop();

        try {
          await this.processResourceLevelBillingForService(customer, service);
        } catch (error) {
          reject(error);
          break;
        }
      }

      resolve(true);
    });
  }

  private processResourceLevelBillingForService(
    customer: ICustomer,
    service: string
  ) {
    return new Promise(async (resolve, reject) => {
      let params = {
        //parameter for API
        TimePeriod: {
          Start: moment(this.options.start).format("YYYY-MM-DD"),
          End: moment(this.options.end).format("YYYY-MM-DD"),
        },
        Granularity: "DAILY",
        Filter: {
          Dimensions: {
            Key: "SERVICE",
            Values: [service],
          },
        },
        GroupBy: [
          {
            Type: "DIMENSION",
            Key: "RESOURCE_ID",
          },
        ],
        Metrics: ["UnblendedCost"],
      };

      // Metrics: ["BlendedCost", "UnblendedCost"],
      try {
        const account = await this.getAWSCred(
          "us-east-1",
          customer.awsaccountid,
          customer.$role
        );
        AWS.config.update({
          ...account,
          region: "us-east-1",
        });
        AWS.config.apiVersions = {
          costexplorer: constants.AWS_CE_BILLING,
        };
        var costexplorer = new AWS.CostExplorer();
        costexplorer.getCostAndUsageWithResources(params, (err, data) => {
          if (err) console.log(" Don't have permission", err);
          else {
            if (data && data.ResultsByTime && data.ResultsByTime[0]) {
              let updateData = [] as any;
              for (var metricsData of data.ResultsByTime[0].Groups) {
                for (const key in metricsData.Metrics) {
                  if (
                    Object.prototype.hasOwnProperty.call(
                      metricsData.Metrics,
                      key
                    )
                  ) {
                    const element = metricsData.Metrics[key];

                    let currency: any =
                      constants.CURRENCY[
                        metricsData.Metrics.UnblendedCost.Unit
                      ];
                    let obj = {
                      tenantid: this.tenantid,
                      billingdt: moment(this.options.start).format(
                        "YYYY-MM-DD"
                      ),
                      cloud_resourceid: metricsData.Keys
                        ? metricsData.Keys[0]
                        : null,
                      customerid: customer.customerid,
                      _accountid: customer.$_accountid,
                      customername: customer.customername,
                      cloudprovider: "AWS",
                      resourcetype: service,
                      currency: currency ? currency : null,
                      billamount: element.Amount,
                      costtype: key,
                      status: constants.STATUS_ACTIVE,
                      createdby: "Admin",
                      createddt: new Date(),
                    };
                    updateData.push(obj);
                  }
                }
              }
              commonService
                .bulkCreate(updateData, db.AsstBilling)
                .then((metricsData) => {
                  LogToFile("Data written to asset billing table.");
                  resolve(true);
                })
                .catch((e) => {
                  reject(e);
                });
            } else {
              console.log("GET COST AND USAGE WITH RESOURCE >>>>>>");
              console.log(data);
            }
          }
        });
      } catch (e) {
        console.log("REJECTED >>>>>>>>>>>>>>>>>>>");
        reject(e);
      }
    });
  }
}

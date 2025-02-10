import * as _ from "lodash";
import * as JWT from "jsonwebtoken";
import axios from "axios";
import { endOfMonth, startOfMonth, format, parseISO } from "date-fns";
import Mjml2HTML = require("mjml");
import * as AWS from "aws-sdk";

import db from "../models/model";
import logger from "../../common/logger";
import { CMApiURL, constants } from "../../common/constants";
import getTemplate from "./template.service";

interface NotificationSetup {
  ntfcsetupid: number;
  tenantid: number;
  module: string;
  event: string;
  ntftype: string;
  template: string;
  receivers: string;
  notes: string;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
}

interface Budget {
  budgetid: number;
  name: string;
  startdt: Date;
  enddt: Date;
  instancerefid: string;
  cloudprovider: string;
  customerid: number;
  _accountid: number;
  tenantid: number;
  resourcetype: string;
  resourceid: string;
  tagid: number;
  tagvalue: string;
  currency: string;
  budgetamount: number;
  notes: string;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
  customer: string;
  account: string;
}

interface User {
  userid: number;
  tenantid: number;
  customerid: number;
  password: string;
  fullname: string;
  email: string;
  phone: string;
  secondaryphoneno: string;
  department: string;
  isapproveryn: string;
  lastlogin: Date;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
  roleid: number;
}

interface Bill {
  billingid: number;
  tenantid: number;
  billingdt: Date;
  cloudprovider: string;
  customerid: number;
  _accountid: number;
  customername: string;
  resourcetype: string;
  cloud_resourceid: null;
  resourceid: null;
  currency: string;
  billamount: string;
  costtype: string;
  notes: null;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: null;
  lastupdateddt: null;
}



export default class BudgetService {
  private tenantid: number;

  private stateNotificationsSetups = [] as NotificationSetup[];

  constructor(tenantid: number) {
    this.tenantid = tenantid;
  }

  init() {
    this.checkIfNotificationStatusExists();
  }

  private createSessionToken() {
    return JWT.sign({ data: { userid: null } }, constants.APP_SECRET, {
      expiresIn: "1h",
    });
  }

  private async checkIfNotificationStatusExists() {
    try {
      let ntfcondition = {
        tenantid: this.tenantid,
        status: "Active",
        module: "Budget",
      };
      const data = await db.notificationsetup.findAll({ where: ntfcondition });
      const setup: NotificationSetup[] = JSON.parse(JSON.stringify(data));

      this.stateNotificationsSetups = setup;
      this.processNextNotification();
    } catch (e) {
      logger.error(e);
    }
  }

  private async processNextNotification() {
    const setup = this.stateNotificationsSetups.pop();

    if (setup) {
      const budgetsInstance: Budget[] = await db.sequelize.query(
        `
          select
            *,
            IFNULL((select ttc.customername from tbl_tn_customers ttc where ttc.customerid = tab.customerid),'-') customer,
            IFNULL((select tta.name from tbl_tn_accounts tta where tta.id = tab.\`_accountid\`),'-') account
          from
            tbl_asst_budget tab
          where
            NOW() BETWEEN tab.startdt and tab.enddt
            and tab.tenantid = ${this.tenantid}
            and tab.status = "Active"
      `,
        {
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      Promise.all(
        budgetsInstance.map((b) => {
          return this.processBudget(setup, b);
        })
      )
        .then((_) => {
          console.log("All budget data processed for the notification");
          this.processNextNotification();
        })
        .catch((err) => {
          console.log("Error processing budget for notifications ");
          console.log(err);
        });
    }
  }

  private processBudget(notificationSetup: NotificationSetup, budget: Budget) {
    return new Promise(async (resolve, reject) => {
      try {
        const condition = {
          startdt: budget.startdt,
          enddt: budget.enddt,
          tenantid: budget.tenantid,
          status: "Active",
          cloudprovider: budget.cloudprovider,
        };

        if (
          budget.customerid &&
          typeof budget.customerid == "number" &&
          budget.customerid > 1
        ) {
          condition["customerid"] = budget.customerid;
        }
        if (
          budget._accountid &&
          typeof budget._accountid == "number" &&
          budget._accountid > 1
        ) {
          condition["accountid"] = budget._accountid;
        }
        if (budget.resourcetype) {
          condition["resourcetype"] = budget.resourcetype;
        }

        const { data } = await axios.post(CMApiURL.BILLING_SUMMARY, condition, {
          headers: {
            "x-auth-header": this.createSessionToken(),
          },
        });
        const monthWiseBilling: {
          actualamount: string;
          monthname: string;
        }[] = data.data;

        this.processBudgetAgainstBills(
          monthWiseBilling,
          notificationSetup,
          budget
        )
          .then((_) => {
            resolve(true);
          })
          .catch((err) => {
            reject(err);
          });

        // .filter((m) => {
        //   if (format(new Date(), "LLL-u") == m.monthname) {
        //     return m;
        //   }
        // })
        // Promise.all(
        //   monthWiseBilling.map((m) => {
        //     return this.processBudgetOnMonthAgainstBills(
        //       m,
        //       notificationSetup,
        //       budget
        //     );
        //   })
        // )
        //   .then((_) => {
        //     resolve(true);
        //   })
        //   .catch((err) => {
        //     reject(err);
        //   });
      } catch (error) {
        reject(error);
      }
    });
  }

  private processBudgetAgainstBills(
    billsAgainstBudget: {
      actualamount: string;
      monthname: string;
    }[],
    notificationSetup: NotificationSetup,
    budget: Budget
  ) {
    return new Promise(async (resolve, reject) => {
      const AWS_SES = new AWS.SES({
       
      });

      let total = 0;

      billsAgainstBudget.forEach((b) => {
        total += parseFloat(b.actualamount);
      });

      const isOverRun = total > budget.budgetamount ? true : false;

      const condition = {
        billingdt: {
          [db.sequelize.Op.between]: [
            startOfMonth(parseISO(new Date(budget.startdt).toISOString())),
            endOfMonth(parseISO(new Date(budget.enddt).toISOString())),
          ],
        },
        cloud_resourceid: {
          [db.sequelize.Op.eq]: null,
        },
        status: "Active",
      };

      if (
        budget.customerid &&
        typeof budget.customerid == "number" &&
        budget.customerid > 1
      ) {
        condition["customerid"] = budget.customerid;
      }
      if (
        budget._accountid &&
        typeof budget._accountid == "number" &&
        budget._accountid > 1
      ) {
        condition["_accountid"] = budget._accountid;
      }
      if (budget.resourcetype) {
        condition["resourcetype"] = budget.resourcetype;
      }

      // TODO: Table should be generated and sent on email.
      const billsInstance = await db.AsstBilling.findAll({
        where: condition,
        group: ["resourcetype"],
      });
      const bills: Bill[] = JSON.parse(JSON.stringify(billsInstance));
      let rows = [];

      bills.forEach((b) => {
        rows.push(`
          <tr style="background:#8080801f">
            <td style="padding: 7px 17px;">${b.resourcetype}</td>
            <td style="padding: 7px 17px;">$${parseFloat(b.billamount).toFixed(
              2
            )}</td>
          </tr>
        `);
      });
      const month = `${format(
          parseISO(new Date(budget.startdt).toISOString()),
          "LLL-u"
        )} to ${format(
          parseISO(new Date(budget.enddt).toISOString()),
          "LLL-u"
        )}`
        
        const diff = budget.budgetamount - parseFloat(total.toFixed(2)) ;
      let replaceValues = {
        "${budgetName}":budget.name,
        "${budget}": budget.budgetamount,
        "${actual}": parseFloat(total.toFixed(2)),
        "${Math.abs(diff)}": diff,
        "${month}" : month,
        "{{bills}}": rows.join(" "),
        "${customer}":  budget.customer,
        "${account}": budget.account
      }
      const mjmlContent = await getTemplate(constants.TEMPLATE_REF[2], replaceValues);
      const htmlContent = Mjml2HTML(mjmlContent).html;
      const textContent = `The Billing amount $${total.toFixed(2)} ${
        isOverRun ? "overrun" : "underrun"
      } the budget $"${budget.budgetamount}" for "${format(
        parseISO(new Date(budget.startdt).toISOString()),
        "LLL-u"
      )} to ${format(
        parseISO(new Date(budget.enddt).toISOString()),
        "LLL-u"
      )}".`;

      const receivers = JSON.parse(notificationSetup.receivers);

      const usersInstance = await db.User.findAll({
        where: {
          userid: { $in: receivers },
          status: "Active",
        },
      });
      const users: User[] = JSON.parse(JSON.stringify(usersInstance));

      if (notificationSetup.ntftype == "Email") {
        await AWS_SES.sendEmail({
          Source: "raja@cloudmatiq.com",
          Destination: {
            ToAddresses: [
              "raja@cloudmatiq.com",
              "rajashanmugam.jm@esko.com",
              "francesco.casi@esko.com",
            ],
          },
          ReplyToAddresses: [],
          Message: {
            Body: {
              Html: {
                Charset: "UTF-8",
                Data: htmlContent,
              },
            },
            Subject: {
              Charset: "UTF-8",
              Data: `Hi,`,
            },
          },
        }).promise();
      }

      await db.notification.bulkCreate(
        users.map((u) => {
          return {
            userid: u.userid,
            content:
              notificationSetup.ntftype == "Application" ||
              notificationSetup.ntftype == "Email"
                ? htmlContent
                : textContent,
            contenttype:
              notificationSetup.ntftype == "Application" ||
              notificationSetup.ntftype == "Email"
                ? "HTML"
                : "Text",
            tenantid: this.tenantid,
            eventtype: "Budget " + isOverRun ? "Overrun" : "Underrun",
            title: `${isOverRun ? "Overrun" : "Underrun"} alert for budget ${
              budget.name
            }`,
            deliverystatus: "SENT",
            modeofnotification: notificationSetup.ntftype,
            configuration: "",
            notes: `The Billing amount $${total.toFixed(2)} ${
              isOverRun ? "overrun" : "underrun"
            } the budget $"${budget.budgetamount}" for the month "${format(
              parseISO(new Date(budget.startdt).toISOString()),
              "LLL-u"
            )} to ${format(
              parseISO(new Date(budget.enddt).toISOString()),
              "LLL-u"
            )}".`,
            status: "Active",
            createdby: "DATASYNC",
            createddt: new Date(),
            lastupdatedby: "DATASYNC",
            lastupdateddt: new Date(),
            interval: null,
          };
        })
      );
    });
  }

  private processBudgetOnMonthAgainstBills(
    billonmonth: {
      actualamount: string;
      monthname: string;
    },
    notificationSetup: NotificationSetup,
    budget: Budget
  ) {
    return new Promise(async (resolve, reject) => {
      try {
        const AWS_SES = new AWS.SES({
          
        });

        const isOverRun =
          parseFloat(billonmonth.actualamount) > budget.budgetamount
            ? true
            : false;

        const condition = {
          billingdt: {
            [db.sequelize.Op.between]: [
              startOfMonth(new Date(billonmonth.monthname)),
              endOfMonth(new Date(billonmonth.monthname)),
            ],
          },
          cloud_resourceid: {
            [db.sequelize.Op.eq]: null,
          },
          status: "Active",
        };

        if (
          budget.customerid &&
          typeof budget.customerid == "number" &&
          budget.customerid > 1
        ) {
          condition["customerid"] = budget.customerid;
        }
        if (
          budget._accountid &&
          typeof budget._accountid == "number" &&
          budget._accountid > 1
        ) {
          condition["_accountid"] = budget._accountid;
        }
        if (budget.resourcetype) {
          condition["resourcetype"] = budget.resourcetype;
        }

        // TODO: Table should be generated and sent on email.
        const billsInstance = await db.AsstBilling.findAll({
          where: condition,
          group: ["resourcetype"],
        });
        const diff = budget.budgetamount - parseFloat(billonmonth.actualamount);
        const bills: Bill[] = JSON.parse(JSON.stringify(billsInstance));
        let rows = [];

        bills.forEach((b) => {
          rows.push(`
            <tr style="background:#8080801f">
              <td style="padding: 7px 17px;">${b.resourcetype}</td>
              <td style="padding: 7px 17px;">$${parseFloat(b.billamount).toFixed(
                2
              )}</td>
            </tr>
          `);
        });
        let replaceValues = {
          "${budgetName}": budget.name,
          "${month}" : billonmonth.monthname,
          "${budget}": budget.budgetamount,
          "${actual}": parseFloat(parseFloat(billonmonth.actualamount).toFixed(2)),
          "${Math.abs(diff)}": diff,
          "{{bills}}": rows.join(" "),
          "${customer}":  budget.customer,
          "${account}": budget.account
        }
        const mjmlContent = await getTemplate(constants.TEMPLATE_REF[2], replaceValues);
        const htmlContent = Mjml2HTML(mjmlContent).html;
        const textContent = `The Billing amount $${billonmonth.actualamount} ${
          isOverRun ? "overrun" : "underrun"
        } the budget $"${budget.budgetamount}" for the month "${
          billonmonth.monthname
        }".`;

        const receivers = JSON.parse(notificationSetup.receivers);

        const usersInstance = await db.User.findAll({
          where: {
            userid: { $in: receivers },
            status: "Active",
          },
        });
        const users: User[] = JSON.parse(JSON.stringify(usersInstance));

        if (notificationSetup.ntftype == "Email") {
          await AWS_SES.sendEmail({
            Source: "raja@cloudmatiq.com",
            Destination: {
              ToAddresses: ["raja@cloudmatiq.com", "rajashanmugam.jm@esko.com"],
            },
            ReplyToAddresses: [],
            Message: {
              Body: {
                Html: {
                  Charset: "UTF-8",
                  Data: htmlContent,
                },
              },
              Subject: {
                Charset: "UTF-8",
                Data: `Hello, User!`,
              },
            },
          }).promise();
        }

        await db.notification.bulkCreate(
          users.map((u) => {
            return {
              userid: u.userid,
              content:
                notificationSetup.ntftype == "Application" ||
                notificationSetup.ntftype == "Email"
                  ? htmlContent
                  : textContent,
              contenttype:
                notificationSetup.ntftype == "Application" ||
                notificationSetup.ntftype == "Email"
                  ? "HTML"
                  : "Text",
              tenantid: this.tenantid,
              eventtype: "Budget " + isOverRun ? "Overrun" : "Underrun",
              title: `The Billing amount $${billonmonth.actualamount} ${
                isOverRun ? "overrun" : "underrun"
              } the budget $"${budget.budgetamount}" for the month "${
                billonmonth.monthname
              }".`,
              deliverystatus: "SENT",
              modeofnotification: notificationSetup.ntftype,
              configuration: "",
              notes: "",
              status: "Active",
              createdby: "DATASYNC",
              createddt: new Date(),
              lastupdatedby: "DATASYNC",
              lastupdateddt: new Date(),
              interval: null,
            };
          })
        );
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }
}
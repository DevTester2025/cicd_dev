import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import * as _ from "lodash";
export interface AsstBudgetAttributes {}
export interface AsstBudgetInstance extends Instance<AsstBudgetAttributes> {
  dataValues: AsstBudgetAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AsstBudgetInstance, AsstBudgetAttributes>(
    "AsstBudget",
    {
      budgetid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      name: SequelizeStatic.STRING(100),
      startdt: {
        type: SequelizeStatic.DATEONLY,
      },
      enddt: {
        type: SequelizeStatic.DATEONLY,
      },
      instancerefid: {
        type: SequelizeStatic.STRING(500),
        set: function (data: any) {
          if (data) {
            _.set(this, "dataValues.instancerefid", JSON.stringify(data));
          }
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.instancerefid");
          if (data) {
            return JSON.parse(data);
          }
        },
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
        // set: function (data: any) {
        //   if (data) {
        //     _.set(this, "dataValues.customerid", JSON.stringify(data));
        //   }
        // },
        // get: function () {
        //   let data;
        //   data = _.get(this, "dataValues.customerid");
        //   if (data) {
        //     return JSON.parse(data);
        //   }
        // },
      },
      _accountid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(50),
      },
      resourceid: {
        type: SequelizeStatic.STRING(500),
        set: function (data: any) {
          if (data) {
            _.set(this, "dataValues.resourceid", JSON.stringify(data));
          }
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.resourceid");
          if (data) {
            return JSON.parse(data);
          }
        },
      },
      tagid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagvalue: {
        type: SequelizeStatic.TEXT,
      },
      currency: {
        type: SequelizeStatic.STRING(10),
      },
      budgetamount: {
        type: SequelizeStatic.DOUBLE,
      },
      notifications: SequelizeStatic.TEXT,
      notes: {
        type: SequelizeStatic.STRING(500),
      },
      status: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Active",
        allowNull: false,
      },
      createdby: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      createddt: {
        type: SequelizeStatic.DATE,
      },
      lastupdatedby: {
        type: SequelizeStatic.STRING(50),
      },
      lastupdateddt: {
        type: SequelizeStatic.DATE,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_asst_budget",
    }
  );
};

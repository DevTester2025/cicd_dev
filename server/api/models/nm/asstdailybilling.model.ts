import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AsstDailyBillingAttributes {}
export interface AsstDailyBillingInstance
  extends Instance<AsstDailyBillingAttributes> {
  dataValues: AsstDailyBillingAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AsstDailyBillingInstance, AsstDailyBillingAttributes>(
    "AsstDailyBilling",
    {
      billingdailyid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      billingdt: {
        type: SequelizeStatic.DATEONLY,
      },
      instancerefid: {
        type: SequelizeStatic.STRING(100),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customername: {
        type: SequelizeStatic.STRING(50),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(50),
      },
      resourceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      currency: {
        type: SequelizeStatic.STRING(10),
      },
      billamount: {
        type: SequelizeStatic.DOUBLE,
      },
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
      tableName: "tbl_asst_dailybilling",
    }
  );
};

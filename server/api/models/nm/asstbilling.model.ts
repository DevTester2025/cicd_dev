import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AsstBillingAttributes {}
export interface AsstBillingInstance extends Instance<AsstBillingAttributes> {
  dataValues: AsstBillingAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AsstBillingInstance, AsstBillingAttributes>(
    "AsstBilling",
    {
      billingid: {
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
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      _accountid: SequelizeStatic.INTEGER(11),
      customername: {
        type: SequelizeStatic.STRING(50),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(50),
      },
      cloud_resourceid: {
        type: SequelizeStatic.INTEGER(500),
      },
      resourceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      currency: {
        type: SequelizeStatic.STRING(10),
      },
      billamount: {
        type: SequelizeStatic.DECIMAL(10,5),
      },
      costtype: SequelizeStatic.STRING(100),
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
      tableName: "tbl_asst_billing",
    }
  );
};

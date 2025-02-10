import * as _ from "lodash";
import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface CustomerKPIAttributes {}
export interface CustomerKPIInstance extends Instance<CustomerKPIAttributes> {
  dataValues: CustomerKPIAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<CustomerKPIInstance, CustomerKPIAttributes>(
    "Customer KPI",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      _customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      _reportid: {
        type: SequelizeStatic.INTEGER(11),
      },
      publishyn: {
        type: SequelizeStatic.STRING(1),
      },
      startdt: {
        type: SequelizeStatic.DATEONLY,
      },
      enddt: {
        type: SequelizeStatic.DATEONLY,
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
      tableName: "tbl_tn_customer_kpi",
    }
  );
};

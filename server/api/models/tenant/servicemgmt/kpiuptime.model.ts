import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface KPIUptimeAttributes {}
export interface KPIUptimeInstance extends Instance<KPIUptimeAttributes> {
  dataValues: KPIUptimeAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<KPIUptimeInstance, KPIUptimeAttributes>(
    "KPIUptime",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagvalue: {
        type: SequelizeStatic.STRING(50),
      },
      slaid: {
        type: SequelizeStatic.INTEGER(11),
      },
      priority: {
        type: SequelizeStatic.STRING(50),
      },
      uptime: {
        type: SequelizeStatic.FLOAT,
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
      tableName: "tbl_tn_kpiuptime",
    }
  );
};

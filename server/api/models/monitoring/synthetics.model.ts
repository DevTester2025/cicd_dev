import * as _ from "lodash";
import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SyntheticsAttributes {}
export interface SyntheticsInstance extends Instance<SyntheticsAttributes> {
  dataValues: SyntheticsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<SyntheticsInstance, SyntheticsAttributes>(
    "MonitoringSynthetics",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: SequelizeStatic.INTEGER(11),
      type: SequelizeStatic.STRING(100),
      region: SequelizeStatic.STRING(100),
      name: SequelizeStatic.STRING(100),
      instances: SequelizeStatic.STRING(100),
      endpoint: SequelizeStatic.STRING(100),
      screenshot: SequelizeStatic.BOOLEAN,
      recurring: SequelizeStatic.BOOLEAN,
      recurring_type: SequelizeStatic.STRING(100),
      cron: SequelizeStatic.STRING(100),
      rate_in_min: SequelizeStatic.INTEGER(11),
      ref: SequelizeStatic.TEXT,
      meta: SequelizeStatic.TEXT,
      scripttype: SequelizeStatic.STRING(20),
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
      instancerefid: {
        type: SequelizeStatic.STRING(100)
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_monitoring_synthetics",
    }
  );
};

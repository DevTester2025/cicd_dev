import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface AssetsAttributes { }
export interface AssetsInstance
  extends SequelizeStatic.Instance<AssetsAttributes> {
  dataValues: AssetsAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<AssetsInstance, AssetsAttributes>(
    "Alert-Configs",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      title: SequelizeStatic.STRING(100),
      description: SequelizeStatic.STRING(100),
      _customer: SequelizeStatic.INTEGER(11),
      _synthetics: SequelizeStatic.STRING(500),
      _ssl: SequelizeStatic.TEXT,
      _account: SequelizeStatic.INTEGER(11),
      _instance: SequelizeStatic.INTEGER(11),
      _tag: SequelizeStatic.INTEGER(11),
      tagvalue: SequelizeStatic.STRING(100),
      instancetype: SequelizeStatic.STRING(100),
      region: SequelizeStatic.STRING(50),
      type: SequelizeStatic.STRING(100),
      level: SequelizeStatic.INTEGER(11),
      severity: SequelizeStatic.STRING(100),
      priority: SequelizeStatic.STRING(15),
      metric: SequelizeStatic.STRING(100),
      condition: SequelizeStatic.STRING(100),
      threshold: SequelizeStatic.STRING(100),
      duration: SequelizeStatic.STRING(100),
      instance: SequelizeStatic.STRING(500),
      poll_strategy: SequelizeStatic.STRING(100),
      platform: SequelizeStatic.STRING(20),
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
      ntf_receivers: SequelizeStatic.TEXT,
      pagerduty: {
        type: SequelizeStatic.TINYINT(1),
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_bs_alertconfigs",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSSGRuleAttributes {}
export interface AWSSGRuleInstance extends Instance<AWSSGRuleAttributes> {
  dataValues: AWSSGRuleAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSSGRuleInstance, AWSSGRuleAttributes>(
    "awssgrules",
    {
      sgrulesid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      securitygroupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      type: {
        type: SequelizeStatic.STRING(20),
      },
      protocol: {
        type: SequelizeStatic.STRING(20),
      },
      portrange: {
        type: SequelizeStatic.STRING(20),
      },
      sourcetype: {
        type: SequelizeStatic.STRING(10),
      },
      source: {
        type: SequelizeStatic.STRING(20),
      },
      notes: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_aws_sgrules",
    }
  );
};

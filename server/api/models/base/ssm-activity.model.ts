import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SsmActivityAttributes {}
export interface SsmActivity extends Instance<SsmActivityAttributes> {
  dataValues: SsmActivityAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<SsmActivity, SsmActivityAttributes>(
    "SsmActivity",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagvalue: {
        type: SequelizeStatic.STRING(100),
      },
      instances: {
        type: SequelizeStatic.TEXT,
      },
      type: SequelizeStatic.STRING(100),
      name: SequelizeStatic.STRING(100),
      region: SequelizeStatic.STRING(30),
      accountid: SequelizeStatic.INTEGER(11),
      reference: {
        type: SequelizeStatic.STRING(100),
      },
      meta: {
        type: SequelizeStatic.TEXT,
      },
      notes: {
        type: SequelizeStatic.TEXT,
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
      tableName: "tbl_ssm_activity",
    }
  );
};

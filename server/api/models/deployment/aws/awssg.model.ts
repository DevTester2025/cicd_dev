import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSSGAttributes {}
export interface AWSSGInstance extends Instance<AWSSGAttributes> {
  dataValues: AWSSGAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSSGInstance, AWSSGAttributes>(
    "awssecgrp",
    {
      securitygroupid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      securitygroupname: {
        type: SequelizeStatic.STRING(200),
      },
      awssecuritygroupid: {
        type: SequelizeStatic.STRING(50),
      },
      vpcid: {
        type: SequelizeStatic.INTEGER(11),
      },
      notes: {
        type: SequelizeStatic.STRING(100),
      },
      tnregionid: {
        type: SequelizeStatic.INTEGER(11),
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
      tableName: "tbl_aws_securitygroup",
    }
  );
};

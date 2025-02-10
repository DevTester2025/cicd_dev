import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface BuildAttributes { }
export interface BuildInstance extends Instance<BuildAttributes> {
  dataValues: BuildAttributes;
}

export default (sequelize: Sequelize) => {
  return sequelize.define<BuildInstance, BuildAttributes>(
    "SetupBuild",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      type: {
        type: SequelizeStatic.STRING(45),
        allowNull: false,
      },
      instancerefid: {
        type: SequelizeStatic.STRING(100),
        allowNull: true,
      },
      ipaddress: {
        type: SequelizeStatic.STRING(20),
        allowNull: true,
      },
      name: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      instancename: {
        type: SequelizeStatic.STRING(100),
        allowNull: true,
      },
      username: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      password: {
        type: SequelizeStatic.STRING(150),
        allowNull: false,
      },
      buildscript:{
        type: SequelizeStatic.TEXT,
        allowNull: false,
      },
      description: {
        type: SequelizeStatic.STRING(500),
        allowNull: true,
      },
      status: {
        type: SequelizeStatic.STRING(10),
        allowNull: false,
      },
      createdby: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      createddt: {
        type: SequelizeStatic.DATE,
        allowNull: false,
      },
      lastupdatedby: {
        type: SequelizeStatic.STRING(50),
        allowNull: true,
      },
      lastupdateddt: {
        type: SequelizeStatic.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_cicd_build",
    }
  );
};

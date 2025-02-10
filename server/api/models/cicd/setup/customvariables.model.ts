import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface CustomVariableAttributes {}
export interface CustomVariableInstance
  extends Instance<CustomVariableAttributes> {
  dataValues: CustomVariableAttributes;
}

export default (sequelize: Sequelize) => {
  return sequelize.define<CustomVariableInstance, CustomVariableAttributes>(
    "CustomVariable",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      variabletype: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      providerid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: true,
      },
      reponame: {
        type: SequelizeStatic.STRING(50),
        allowNull: true,
      },
      environment: {
        type: SequelizeStatic.STRING(15),
        allowNull: false,
      },
      keyname: {
        type: SequelizeStatic.STRING(50),
        defaultValue: null,
      },
      keytype: {
        type: SequelizeStatic.STRING(25),
        defaultValue: null,
      },
      description: {
        type: SequelizeStatic.STRING(500),
        defaultValue: null,
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
      tableName: "tbl_cicd_custom_variables",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface CustomVariablesValuesAttributes {}
export interface CustomVariablesValuesInstance
  extends Instance<CustomVariablesValuesAttributes> {
  dataValues: CustomVariablesValuesAttributes;
}

export default (sequelize: Sequelize) => {
  return sequelize.define<
    CustomVariablesValuesInstance,
    CustomVariablesValuesAttributes
  >(
    "CustomVariablesValues",
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
      variableid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      environment: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      keyvalue: {
        type: SequelizeStatic.STRING(500),
        allowNull: false,
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
      tableName: "tbl_cicd_custom_variables_values",
    }
  );
};
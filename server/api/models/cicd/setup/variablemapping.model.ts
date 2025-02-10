import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";


export interface VariableMappingAttributes {}
export interface VariableMappingInstance extends Instance<VariableMappingAttributes> {
  dataValues: VariableMappingAttributes;
}

export default (sequelize: Sequelize, DataTypes: SequelizeStatic.DataTypes) => {
  return  sequelize.define<VariableMappingInstance, VariableMappingAttributes>(
    "VariableMapping",
    {
        id: {
            type: SequelizeStatic.INTEGER,
            allowNull: false,
            primaryKey: true,
          },
          tenantid: {
            type: SequelizeStatic.INTEGER,
            allowNull: false,
          },
          variableid: {
            type: SequelizeStatic.INTEGER,
            allowNull: false,
            
          },
          referencetype: {
            type: SequelizeStatic.STRING(15),
            allowNull: false,
          },
          referenceid: {
            type: DataTypes.INTEGER(11),
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
      tableName: "tbl_cicd_variable_mapping",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface DeployedScriptsAttributes {}
export interface DeployedScriptsInstance
  extends Instance<DeployedScriptsAttributes> {
  dataValues: DeployedScriptsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<DeployedScriptsInstance, DeployedScriptsAttributes>(
    "DeployedScripts",
    {
      deployscriptid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      deploymentid: {
        type: SequelizeStatic.INTEGER(11),
      },
      scriptcontent: {
        type: SequelizeStatic.TEXT,
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
      tableName: "tbl_tn_deployedscripts",
    }
  );
};

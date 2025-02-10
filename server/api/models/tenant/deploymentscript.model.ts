import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface DeploymentScriptAttributes {}
export interface DeploymentScriptInstance
  extends Instance<DeploymentScriptAttributes> {
  dataValues: DeploymentScriptAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<DeploymentScriptInstance, DeploymentScriptAttributes>(
    "DeploymentScript",
    {
      deployscriptid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      reftype: {
        type: SequelizeStatic.STRING(20),
      },
      refid: {
        type: SequelizeStatic.INTEGER(11),
      },
      scriptid: {
        type: SequelizeStatic.INTEGER(11),
      },
      orderno: {
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
      tableName: "tbl_bs_deployment_scripts",
    }
  );
};

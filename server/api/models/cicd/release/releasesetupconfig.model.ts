import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ReleaseSetupConfigAttributes {}

export interface ReleaseSetupConfiInstance
  extends Instance<ReleaseSetupConfigAttributes> {
  dataValues: ReleaseSetupConfigAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ReleaseSetupConfiInstance,ReleaseSetupConfigAttributes>(
    "ReleaseSetupConfig",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      releaseconfigdetailid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      setupdetails: {
        type: SequelizeStatic.JSON,
        allowNull: false,
      },
      variabledetails: {
        type: SequelizeStatic.JSON,
      },
      scriptcontent: {
        type: SequelizeStatic.TEXT,
        allowNull: true,
      },
      status: {
        type: SequelizeStatic.STRING(10),
        allowNull: false,
      },
      description: {
        type: SequelizeStatic.STRING(500),
        allowNull: true,
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
      tableName: "tbl_cicd_release_setup_configuration",
    }
  );
};

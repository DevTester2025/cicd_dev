import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface ReleaseAttributes { }
export interface ReleaseInstance
  extends SequelizeStatic.Instance<ReleaseAttributes> {
  dataValues: ReleaseAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<ReleaseInstance, ReleaseAttributes>(
    "ReleaseConfig",
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
      name: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      templateid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      schedule: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      scheduleon: {
        type: SequelizeStatic.STRING(25),
      },
      environment: {
        type: SequelizeStatic.STRING(45),
        allowNull: true,
      },
      providerbranch: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      providerrepo: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      filename: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      version: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: true,
      },
      runnerid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: true,
      },
      description: {
        type: SequelizeStatic.STRING(500),
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
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_cicd_release_configuration",
    }
  );
};
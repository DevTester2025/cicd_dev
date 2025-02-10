import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ProviderRunnersAttributes {}
export interface ProviderRunnersInstance
  extends Instance<ProviderRunnersAttributes> {
  dataValues: ProviderRunnersAttributes;
}

export default (sequelize: Sequelize) => {
  return sequelize.define<ProviderRunnersInstance, ProviderRunnersAttributes>(
    "ProviderRunners",
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
      providerid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: true,
      },
      type: {
        type: SequelizeStatic.STRING(45),
        allowNull: false,
      },
      repo: {
        type: SequelizeStatic.STRING(45),
        allowNull: true,
      },
      name: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      os: {
        type: SequelizeStatic.STRING(50),
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
      tableName: "tbl_cicd_provider_runners",
    }
  );
};

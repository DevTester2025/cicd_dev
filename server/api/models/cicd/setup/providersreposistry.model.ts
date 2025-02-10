import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";


export interface ProviderRepositoriesAttributes {}
export interface ProviderRepositoriesInstance extends Instance<ProviderRepositoriesAttributes> {
  dataValues: ProviderRepositoriesAttributes;
}

export default (sequelize: Sequelize) => {
  return  sequelize.define<ProviderRepositoriesInstance, ProviderRepositoriesAttributes>(
    "ProviderRepositories",
    {
        id: {
            type: SequelizeStatic.INTEGER(11),
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          providerid: {
            type: SequelizeStatic.INTEGER(11),
            allowNull: false,
          },
          repository: {
            type: SequelizeStatic.STRING(25),
            allowNull: false,
          },
          branch: {
            type: SequelizeStatic.STRING(25),
            allowNull: false,
          },
          noofforks: {
            type: SequelizeStatic.INTEGER(11),
            defaultValue: 0,
          },
          noofmergerequest: {
            type: SequelizeStatic.INTEGER(11),
            defaultValue: 0,
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
      tableName: "tbl_cicd_provider_repositories",
    }
  );
};

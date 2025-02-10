import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";


export interface ContainerRegistryAttributes {}
export interface ContainerRegistryInstance extends Instance<ContainerRegistryAttributes> {
  dataValues: ContainerRegistryAttributes;
}

export default (sequelize: Sequelize) => {
  return  sequelize.define<ContainerRegistryInstance, ContainerRegistryAttributes>(
    "ContainerRegistry",
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
      type: {
        type: SequelizeStatic.STRING(45),
        allowNull: false,
      },
      name: {
        type: SequelizeStatic.STRING(45),
        allowNull: false,
      },
      username: {
        type: SequelizeStatic.STRING(45),
        allowNull: true,
      },
      usernameisvariable:{
          type: SequelizeStatic.BOOLEAN,
          allowNull: false,
      },
      usernamevariable:{
        type: SequelizeStatic.STRING(45),
        allowNull: true,
      },
      accesstoken: {
        type: SequelizeStatic.STRING(500),
        allowNull: true,
      },
      accesstokenisvariable:{
        type: SequelizeStatic.BOOLEAN,
        allowNull: true,
      },
      accesstokenvariable:{
        type: SequelizeStatic.STRING(45),
        allowNull: true,
      },
      urlisvariable:{
        type: SequelizeStatic.BOOLEAN,
        allowNull: true,
      },
      urlvariable:{
        type: SequelizeStatic.STRING(45),
        allowNull: true,
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
      url: {
        type: SequelizeStatic.STRING(500),
        allowNull: true,
    }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_cicd_container_registery",
    }
  );
};

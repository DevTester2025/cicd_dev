import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ProviderAttributes {}

export interface ProviderInstance extends Instance<ProviderAttributes> {
  dataValues: ProviderAttributes;
}
export default (sequelize: Sequelize) => 
{
    return sequelize.define<ProviderInstance, ProviderAttributes>(
      "Provider",
    {
     id :{
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
        type: SequelizeStatic.STRING(50),
        allowNull: false,
    },
      username: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
    },
      accesstoken: {
        type: SequelizeStatic.STRING(200),
        allowNull: false,
    },
    organizationname: {
      type: SequelizeStatic.STRING(50),
      allowNull: true,
  },
      url: {
        type: SequelizeStatic.STRING(500),
        allowNull: false,
    },
      description: {
        type: SequelizeStatic.STRING(500),
        allowNull: true,
    },
      syncrepository: {
        type: SequelizeStatic.BOOLEAN,
        allowNull: false,
    },
      lastsyncdate: {
        type: SequelizeStatic.DATE,
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
      tableName: "tbl_cicd_provider",

    }
);
};



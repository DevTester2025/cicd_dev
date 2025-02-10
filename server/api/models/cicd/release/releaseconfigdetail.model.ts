import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ReleaseConfigDetailAttributes {}

export interface ReleaseConfigDetailInstance
  extends Instance<ReleaseConfigDetailAttributes> {
    dataValues: ReleaseConfigDetailAttributes;
}

export default (sequelize: Sequelize) => {
 return sequelize.define<ReleaseConfigDetailInstance,ReleaseConfigDetailAttributes>(
    "ReleaseConfigDetail",
    {
      id: {
        type: SequelizeStatic.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER,
        allowNull: false,
      },
      position: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      referencetype: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      referenceid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      releaseconfighdrid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      providerjobname: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
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
      tableName: "tbl_cicd_release_config_detail",
    }
  );
  
};

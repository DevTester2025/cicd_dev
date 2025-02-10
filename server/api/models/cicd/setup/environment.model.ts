import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface EnvironmentsAttributes { }
export interface EnvironmentsInstance extends Instance<EnvironmentsAttributes> {
  dataValues: EnvironmentsAttributes;
}

export default (sequelize: Sequelize) => {
  return sequelize.define<EnvironmentsInstance, EnvironmentsAttributes>(
    "Environments",
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
      type: {
        type: SequelizeStatic.STRING(45),
        allowNull: false,
      },
      instancerefid: {
        type: SequelizeStatic.STRING(100),
        allowNull: true,
      },
      ipaddressisvariable: {
        type: SequelizeStatic.BOOLEAN,
        allowNull: false,
      },
      ipaddressvariable: {
        type: SequelizeStatic.STRING(45),
        allowNull: true,
      },
      ipaddress: {
        type: SequelizeStatic.STRING(20),
        allowNull: true,
      },
      instancename: {
        type: SequelizeStatic.STRING(100),
        allowNull: true,
      },
      usernameisvariable: {
        type: SequelizeStatic.BOOLEAN,
        allowNull: false,
      },
      usernamevariable: {
        type: SequelizeStatic.STRING(45),
        allowNull: true,
      },
      username: {
        type: SequelizeStatic.STRING(50),
        allowNull: true,
      },
      passwordisvariable: {
        type: SequelizeStatic.BOOLEAN,
        allowNull: false,
      },
      passwordvariable: {
        type: SequelizeStatic.STRING(45),
        allowNull: true,
      },
      password: {
        type: SequelizeStatic.STRING(150),
        allowNull: true,
      },
      authenticationtype: {
        type: SequelizeStatic.STRING(45),
        allowNull: false,
      },
      keyfilename: {
        type: SequelizeStatic.STRING(50),
        allowNull: true,
      },
      keyfiledata: {
        type: SequelizeStatic.BLOB,
        allowNull: true,
      },
      ispasswordprotector: {
        type: SequelizeStatic.BOOLEAN,
        allowNull: true,
      },
      passwordprotector: {
        type: SequelizeStatic.STRING(500),
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
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_cicd_environment",
    }
  );
};

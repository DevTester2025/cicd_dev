import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface VMHostAttributes { }
export interface VMHostInstance extends Instance<VMHostAttributes> {
  dataValues: VMHostAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<VMHostInstance, VMHostAttributes>(
    "VMHost",
    {
      hostid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(10),
      },
      _accountid: {
        type: SequelizeStatic.INTEGER(11),
      },
      hoststate: {
        type: SequelizeStatic.STRING(10),
      },
      hostrefid: {
        type: SequelizeStatic.STRING(100),
      },
      hostname: {
        type: SequelizeStatic.STRING(100),
      },
      powerstate: {
        type: SequelizeStatic.STRING(15),
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
      tableName: "tbl_vc_hosts",
    }
  );
};

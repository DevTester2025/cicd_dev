import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface VMWareCommonAttributes {}
export interface VMWareCommonInstance extends Instance<VMWareCommonAttributes> {
  dataValues: VMWareCommonAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<VMWareCommonInstance, VMWareCommonAttributes>(
    "VMWareCommon",
    {
      vmid: {
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
      cpucount: {
        type: SequelizeStatic.INTEGER(3),
      },
      memorysize: {
        type: SequelizeStatic.STRING(10),
      },
      vmname: {
        type: SequelizeStatic.STRING(100),
      },
      powerstate: {
        type: SequelizeStatic.STRING(15),
      },
      vmrefid: {
        type: SequelizeStatic.STRING(100),
      },
      clusterid: {
        type: SequelizeStatic.INTEGER(11),
      },
      metadata: {
        type: SequelizeStatic.TEXT,
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
      platform: SequelizeStatic.STRING(100),
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_vc_vm",
    }
  );
};

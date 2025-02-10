import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2LBInterfaceAttributes {}
export interface ECL2LBInterfaceInstance
  extends Instance<ECL2LBInterfaceAttributes> {
  dataValues: ECL2LBInterfaceAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2LBInterfaceInstance, ECL2LBInterfaceAttributes>(
    "ecl2lbinterface",
    {
      lbinterfaceid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2lbinterfaceid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(10),
      },
      loadbalancerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ipaddress: {
        type: SequelizeStatic.STRING(30),
      },
      lbinterfacename: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      networkid: {
        type: SequelizeStatic.INTEGER(11),
      },
      slotnumber: {
        type: SequelizeStatic.INTEGER(11),
      },
      virtualipaddress: {
        type: SequelizeStatic.STRING(30),
      },
      protocol: {
        type: SequelizeStatic.STRING(10),
      },
      vrid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vmac: {
        type: SequelizeStatic.TEXT,
      },
      ip: {
        type: SequelizeStatic.TEXT,
      },
      type: {
        type: SequelizeStatic.STRING(20),
      },
      notes: {
        type: SequelizeStatic.STRING(500),
      },
      tnregionid: {
        type: SequelizeStatic.INTEGER(11),
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
      tableName: "tbl_ecl2_lbinterface",
    }
  );
};

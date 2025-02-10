import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2vSRXInterfaceAttributes {}
export interface ECL2vSRXInterfaceInstance
  extends Instance<ECL2vSRXInterfaceAttributes> {
  dataValues: ECL2vSRXInterfaceAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ECL2vSRXInterfaceInstance,
    ECL2vSRXInterfaceAttributes
  >(
    "ecl2vsrxinterface",
    {
      vsrxinterfaceid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2vsrxinterfaceid: {
        type: SequelizeStatic.STRING(100),
      },
      vsrxid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vsrxinterfacename: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      networkid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ipaddress: {
        type: SequelizeStatic.STRING(30),
      },
      defaultgateway: {
        type: SequelizeStatic.STRING(30),
      },
      vsrxinterfaceslot: {
        type: SequelizeStatic.STRING(20),
      },
      vsrxinterfaceunitslot: {
        type: SequelizeStatic.STRING(20),
      },
      ecl2subnetid: {
        type: SequelizeStatic.STRING(30),
      },
      allowedaddresspairs: {
        type: SequelizeStatic.STRING(500),
      },
      slotname: {
        type: SequelizeStatic.STRING(15),
      },
      securityzone: {
        type: SequelizeStatic.TEXT,
      },
      securityunit: {
        type: SequelizeStatic.TEXT,
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
      tableName: "tbl_ecl2_vsrxinterface",
    }
  );
};

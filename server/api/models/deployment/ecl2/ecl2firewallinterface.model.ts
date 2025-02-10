import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2FirewallInterfaceAttributes {}
export interface ECL2FirewallInterfaceInstance
  extends Instance<ECL2FirewallInterfaceAttributes> {
  dataValues: ECL2FirewallInterfaceAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ECL2FirewallInterfaceInstance,
    ECL2FirewallInterfaceAttributes
  >(
    "ecl2firewallinterface",
    {
      fwinterfaceid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2fwinterfaceid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      firewallid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ipaddress: {
        type: SequelizeStatic.STRING(30),
      },
      fwinterfacename: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      region: {
        type: SequelizeStatic.STRING(10),
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
      tableName: "tbl_ecl2_firewallinterface",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2IgInterfaceAttributes {}
export interface ECL2IgInterfaceInstance
  extends Instance<ECL2IgInterfaceAttributes> {
  dataValues: ECL2IgInterfaceAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2IgInterfaceInstance, ECL2IgInterfaceAttributes>(
    "ecl2iginterface",
    {
      iginterfaceid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2iginterfaceid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      interfacename: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      internetgatewayid: {
        type: SequelizeStatic.INTEGER(11),
      },
      netmask: {
        type: SequelizeStatic.INTEGER(11),
      },
      networkid: {
        type: SequelizeStatic.INTEGER(11),
      },
      gwvipv4: {
        type: SequelizeStatic.STRING(100),
      },
      primaryipv4: {
        type: SequelizeStatic.STRING(500),
      },
      secondaryipv4: {
        type: SequelizeStatic.STRING(100),
      },
      servicetype: {
        type: SequelizeStatic.STRING(100),
      },
      vrid: {
        type: SequelizeStatic.INTEGER(11),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
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
      tableName: "tbl_ecl2_iginterface",
    }
  );
};

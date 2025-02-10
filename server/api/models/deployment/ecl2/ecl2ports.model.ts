import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2PortsAttributes {}
export interface ECL2PortsInstance extends Instance<ECL2PortsAttributes> {
  dataValues: ECL2PortsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2PortsInstance, ECL2PortsAttributes>(
    "ecl2ports",
    {
      portid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2portid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      portname: {
        type: SequelizeStatic.STRING(250),
      },
      adminstateup: {
        type: SequelizeStatic.STRING(1),
      },
      allowedaddresspairs: {
        type: SequelizeStatic.STRING(500),
      },
      ipaddress: {
        type: SequelizeStatic.STRING(20),
      },
      macaddress: {
        type: SequelizeStatic.STRING(50),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      deviceid: {
        type: SequelizeStatic.STRING(100),
      },
      deviceowner: {
        type: SequelizeStatic.STRING(50),
      },
      fixedips: {
        type: SequelizeStatic.STRING(500),
      },
      networkid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ecl2networkid: {
        type: SequelizeStatic.STRING(100),
      },
      segmentationid: {
        type: SequelizeStatic.STRING(100),
      },
      segmentationtype: {
        type: SequelizeStatic.STRING(10),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
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
      tableName: "tbl_ecl2_ports",
    }
  );
};

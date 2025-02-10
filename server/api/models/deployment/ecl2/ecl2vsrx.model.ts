import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2vSRXAttributes {}
export interface ECL2vSRXInstance extends Instance<ECL2vSRXAttributes> {
  dataValues: ECL2vSRXAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2vSRXInstance, ECL2vSRXAttributes>(
    "ecl2vsrx",
    {
      vsrxid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2vsrxid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vsrxname: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      defaultgateway: {
        type: SequelizeStatic.STRING(30),
      },
      vsrxplanid: {
        type: SequelizeStatic.INTEGER(11),
      },
      username: {
        type: SequelizeStatic.STRING(30),
      },
      password: {
        type: SequelizeStatic.STRING(30),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      securityzone: {
        type: SequelizeStatic.TEXT,
      },
      securitypolicy: {
        type: SequelizeStatic.TEXT,
      },
      sourcenat: {
        type: SequelizeStatic.TEXT,
      },
      destinationnat: {
        type: SequelizeStatic.TEXT,
      },
      proxyarpnat: {
        type: SequelizeStatic.TEXT,
      },
      addressbooks: {
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
      tableName: "tbl_ecl2_vsrx",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2TenantConnectionAttributes {}
export interface ECL2TenantConnectionInstance
  extends Instance<ECL2TenantConnectionAttributes> {
  dataValues: ECL2TenantConnectionAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ECL2TenantConnectionInstance,
    ECL2TenantConnectionAttributes
  >(
    "ecl2tenantconnection",
    {
      tenantconnectionid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      eclttenantconnectionid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tenantconnrequestid: {
        type: SequelizeStatic.INTEGER(11),
      },
      name: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      devicetype: {
        type: SequelizeStatic.STRING(100),
      },
      deviceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      deviceinterfaceid: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2tenantidother: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2networkid: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2deviceid: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2portid: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_ecl2_tenantconnection",
    }
  );
};

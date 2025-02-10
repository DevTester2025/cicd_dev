import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2TenantconnRequestAttributes {}
export interface ECL2TenantconnRequestInstance
  extends Instance<ECL2TenantconnRequestAttributes> {
  dataValues: ECL2TenantconnRequestAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ECL2TenantconnRequestInstance,
    ECL2TenantconnRequestAttributes
  >(
    "ecl2tenantconnrequest",
    {
      tenantconnrequestid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecltenantconnrequestid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      networkid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(10),
      },
      name: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2tenantidother: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2networkid: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      approvalrequestid: {
        type: SequelizeStatic.STRING(100),
      },
      sourcecustomerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      keystoneuserid: {
        type: SequelizeStatic.STRING(100),
      },
      eclstatus: {
        type: SequelizeStatic.STRING(30),
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
      tableName: "tbl_ecl2_tenantconnrequest",
    }
  );
};

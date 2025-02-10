import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface TenantlicensesAttributes {}
export interface TenantlicensesInstance
  extends Instance<TenantlicensesAttributes> {
  dataValues: TenantlicensesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<TenantlicensesInstance, TenantlicensesAttributes>(
    "TenantLicenses",
    {
      licenseid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      licensekey: {
        type: SequelizeStatic.STRING(100),
      },
      costpermonth: {
        type: SequelizeStatic.FLOAT,
      },
      costperannual: {
        type: SequelizeStatic.FLOAT,
      },
      ccysymbol: {
        type: SequelizeStatic.STRING(10),
      },
      plan_ref: {
        type: SequelizeStatic.STRING(50),
      },
      valid_from: {
        type: SequelizeStatic.DATE,
      },
      valid_till: {
        type: SequelizeStatic.DATE,
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
      tableName: "tbl_bs_tenant_licenses",
    }
  );
};

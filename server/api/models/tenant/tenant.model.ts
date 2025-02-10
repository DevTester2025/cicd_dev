import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import _ = require("lodash");
import { constants } from "../../../common/constants";

let baseUrl = constants.FILEDWNLOADPATH;

export interface TenantAttributes {}
export interface TenantInstance extends Instance<TenantAttributes> {
  dataValues: TenantAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<TenantInstance, TenantAttributes>(
    "Tenant",
    {
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantname: {
        type: SequelizeStatic.STRING(50),
      },
      tenantaddress: {
        type: SequelizeStatic.STRING(2000),
      },
      postcode: {
        type: SequelizeStatic.STRING(12),
      },
      pphoneno: {
        type: SequelizeStatic.STRING(20),
      },
      sphoneno: {
        type: SequelizeStatic.STRING(20),
      },
      contactperson: {
        type: SequelizeStatic.STRING(30),
      },
      designation: {
        type: SequelizeStatic.STRING(45),
      },
      contactemail: {
        type: SequelizeStatic.STRING(100),
      },
      tenant_logo: {
        type: SequelizeStatic.STRING(50)
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
      tableName: "tbl_bs_tenants",
    }
  );
};

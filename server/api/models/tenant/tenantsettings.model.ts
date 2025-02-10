import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface TenantSettingsAttributes {}
export interface TenantSettingsInstance
  extends Instance<TenantSettingsAttributes> {
  dataValues: TenantSettingsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<TenantSettingsInstance, TenantSettingsAttributes>(
    "TenantSettings",
    {
      tnsettingid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      setting_name: {
        type: SequelizeStatic.STRING(50),
      },
      setting_ref: {
        type: SequelizeStatic.STRING(50),
      },
      setting_value: {
        type: SequelizeStatic.JSON,
      },
      datatype:{
        type: SequelizeStatic.STRING(20),
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
      tableName: "tbl_bs_tenant_settings",
    }
  );
};

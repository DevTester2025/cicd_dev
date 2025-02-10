import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface TenantRegionAttributes {}
export interface TenantRegionInstance extends Instance<TenantRegionAttributes> {
  dataValues: TenantRegionAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<TenantRegionInstance, TenantRegionAttributes>(
    "TenantRegion",
    {
      tnregionid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      _accountid: SequelizeStatic.INTEGER(11),
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(30),
      },
      tenantrefid: {
        type: SequelizeStatic.STRING(100),
      },
      lastsyncdt: {
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
      tableName: "tbl_tn_regions",
    }
  );
};

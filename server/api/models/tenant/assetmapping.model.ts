import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AssetMappingAttributes {}
export interface AssetMappingInstance extends Instance<AssetMappingAttributes> {
  dataValues: AssetMappingAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AssetMappingInstance, AssetMappingAttributes>(
    "AssetMapping",
    {
      assetmappingid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(30),
      },
      resourceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tnregionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      resourcerefid: {
        type: SequelizeStatic.STRING(100),
      },
      crnresourceid: {
        type: SequelizeStatic.STRING(200),
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
      tableName: "tbl_tn_assetmappings",
    }
  );
};

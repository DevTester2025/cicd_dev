import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface CatalogApprvrAttributes {}
export interface CatalogApprvrInstance
  extends Instance<CatalogApprvrAttributes> {
  dataValues: CatalogApprvrAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<CatalogApprvrInstance, CatalogApprvrAttributes>(
    "srmcatalogapprvrs",
    {
      catalogapprovid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      catalogid: {
        type: SequelizeStatic.INTEGER(11),
      },
      userid: {
        type: SequelizeStatic.INTEGER(11),
      },
      approverlevel: {
        type: SequelizeStatic.INTEGER(11),
      },
      status: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Active",
        allowNull: false,
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
      tableName: "tbl_srm_catalogapprovers",
    }
  );
};

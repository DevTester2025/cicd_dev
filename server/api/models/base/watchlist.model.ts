import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface WatchListsAttributes {}
export interface WatchListInstance extends Instance<WatchListsAttributes> {
  dataValues: WatchListsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<WatchListInstance, WatchListsAttributes>(
    "ContactPoints",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ntfcsetupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      refid: {
        type: SequelizeStatic.STRING(100),
      },
      reftype: {
        type: SequelizeStatic.STRING(50),
      },
      tenantid: {
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
      tableName: "tbl_bs_watchlist",
    }
  );
};

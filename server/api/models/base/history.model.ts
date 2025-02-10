import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface HistoryAttributes {}
export interface HistoryInstance
  extends SequelizeStatic.Instance<HistoryAttributes> {
  dataValues: HistoryAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<HistoryInstance, HistoryAttributes>(
    "History",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      _tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      _customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      _accountid: {
        type: SequelizeStatic.INTEGER(11),
      },
      action: {
        type: SequelizeStatic.STRING(50),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(50),
      },
      resourcetypeid: {
        type: SequelizeStatic.STRING(100),
      },
      meta: SequelizeStatic.TEXT,
      old: SequelizeStatic.TEXT,
      new: SequelizeStatic.TEXT,
      affectedattribute: SequelizeStatic.STRING(50),
      notes: SequelizeStatic.TEXT,
      createdby: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      createddt: {
        type: SequelizeStatic.DATE,
      },
      updatedby: {
        type: SequelizeStatic.STRING(50),
      },
      updateddt: {
        type: SequelizeStatic.DATE,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_tn_history",
    }
  );
};

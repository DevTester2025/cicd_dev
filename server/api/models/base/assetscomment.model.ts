import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface AssetsAttributes {}
export interface AssetsInstance
  extends SequelizeStatic.Instance<AssetsAttributes> {
  dataValues: AssetsAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<AssetsInstance, AssetsAttributes>(
    "Assets-Comment",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      crn: {
        type: SequelizeStatic.STRING(100),
      },
      resourceid: {
        type: SequelizeStatic.STRING(100),
      },
      comment: SequelizeStatic.TEXT,
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
      meta: SequelizeStatic.TEXT,
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_assets_comment",
    }
  );
};

import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface AssetsAttributes { }
export interface AssetsInstance
  extends SequelizeStatic.Instance<AssetsAttributes> {
  dataValues: AssetsAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<AssetsInstance, AssetsAttributes>(
    "Assets-HDR",
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
      fieldkey: {
        type: SequelizeStatic.STRING(100),
      },
      fieldname: {
        type: SequelizeStatic.STRING(100),
      },
      identifier: SequelizeStatic.BOOLEAN,
      fieldtype: {
        type: SequelizeStatic.STRING(100),
      },
      protected: {
        type: SequelizeStatic.TINYINT(1),
      },
      prefix: {
        type: SequelizeStatic.STRING(30),
      },
      curseq: {
        type: SequelizeStatic.STRING(10),
      },
      defaultval: {
        type: SequelizeStatic.TEXT,
      },
      showbydefault: {
        type: SequelizeStatic.TINYINT(1),
      },
      readonly: {
        type: SequelizeStatic.TINYINT(1),
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
      meta: SequelizeStatic.TEXT,
      resourcetype: SequelizeStatic.STRING(100),
      relation: SequelizeStatic.STRING(200),
      referenceasset: SequelizeStatic.TEXT,
      referencetag: SequelizeStatic.TEXT,
      referenceid: SequelizeStatic.TEXT,
      parentcrn: {
        type: SequelizeStatic.STRING(100),
      },
      ordernumber: {
        type: SequelizeStatic.INTEGER(11)
      },
      module: {
        type: SequelizeStatic.STRING(50),
      },
      operationtype: {
        type: SequelizeStatic.STRING(50),
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_assets_hdr",
    }
  );
};

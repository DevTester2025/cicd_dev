import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface AssetsAttributes {}
export interface AssetsInstance
  extends SequelizeStatic.Instance<AssetsAttributes> {
  dataValues: AssetsAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<AssetsInstance, AssetsAttributes>(
    "Assets",
    {
      assetid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tnregionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      assetname: {
        type: SequelizeStatic.STRING(200),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(25),
      },
      assettype: {
        type: SequelizeStatic.STRING(25),
      },
      assetdata: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.assetdata", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.assetdata");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      reftable: {
        type: SequelizeStatic.STRING(30),
      },
      refkey: {
        type: SequelizeStatic.STRING(30),
      },
      remarks: {
        type: SequelizeStatic.STRING(500),
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
      tableName: "tbl_tn_cloudassets",
    }
  );
};

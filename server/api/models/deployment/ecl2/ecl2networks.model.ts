import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import * as _ from "lodash";

export interface ECL2NetworksAttributes {}
export interface ECL2NetworksInstance extends Instance<ECL2NetworksAttributes> {
  dataValues: ECL2NetworksAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2NetworksInstance, ECL2NetworksAttributes>(
    "ecl2networks",
    {
      networkid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2networkid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      networkname: {
        type: SequelizeStatic.STRING(100),
      },
      adminstateup: {
        type: SequelizeStatic.STRING(1),
      },
      description: {
        type: SequelizeStatic.STRING(1000),
      },
      plane: {
        type: SequelizeStatic.STRING(10),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      shared: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.shared", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.shared");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      tnregionid: {
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
      tableName: "tbl_ecl2_networks",
    }
  );
};

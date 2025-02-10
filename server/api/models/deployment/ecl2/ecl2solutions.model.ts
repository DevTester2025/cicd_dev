import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import _ = require("lodash");
export interface ECL2SolutionsAttributes {}
export interface ECL2SolutionsInstance
  extends Instance<ECL2SolutionsAttributes> {
  dataValues: ECL2SolutionsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2SolutionsInstance, ECL2SolutionsAttributes>(
    "ecl2solutions",
    {
      ecl2solutionid: {
        type: SequelizeStatic.BIGINT(11),
        primaryKey: true,
        autoIncrement: true,
      },
      solutionid: {
        type: SequelizeStatic.BIGINT(11),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancename: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2imageid: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2networkid: {
        type: SequelizeStatic.STRING(100),
        set: function (data: any) {
          _.set(this, "dataValues.ecl2networkid", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.ecl2networkid");
          if (data !== undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      ecl2volumeid: {
        type: SequelizeStatic.STRING(100),
        set: function (data: any) {
          _.set(this, "dataValues.ecl2volumeid", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.ecl2volumeid");
          if (data !== undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      ecl2internetgatewayid: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2vsrxid: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2loadbalancerid: {
        type: SequelizeStatic.STRING(100),
      },
      diskconfig: {
        type: SequelizeStatic.STRING(10),
      },
      flavorid: {
        type: SequelizeStatic.INTEGER(11),
      },
      imageid: {
        type: SequelizeStatic.INTEGER(11),
      },
      mincount: {
        type: SequelizeStatic.INTEGER(2),
      },
      maxcount: {
        type: SequelizeStatic.INTEGER(2),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      configdrive: {
        type: SequelizeStatic.BOOLEAN,
      },
      keyid: {
        type: SequelizeStatic.INTEGER(11),
      },
      scriptid: {
        type: SequelizeStatic.INTEGER(11),
      },
      orchid: {
        type: SequelizeStatic.INTEGER(11),
      },
      noofservers: {
        type: SequelizeStatic.INTEGER(11),
      },
      userdata: {
        type: SequelizeStatic.STRING(100),
      },
      blockdevicemapping: {
        type: SequelizeStatic.STRING(1000),
      },
      blockdevicemappingv2: {
        type: SequelizeStatic.TEXT,
      },
      metadata: {
        type: SequelizeStatic.STRING(1000),
      },
      monitorutilyn: {
        type: SequelizeStatic.STRING(1),
      },
      networkid: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.networkid", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.networkid");
          if (data !== undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      volumeid: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.volumeid", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.volumeid");
          if (data !== undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      notes: {
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
      ecl2networks: {
        type: SequelizeStatic.STRING(10),
      },
      internetgatewayid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vsrxid: {
        type: SequelizeStatic.INTEGER(11),
      },
      sharedtenants: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.sharedtenants", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.sharedtenants");
          if (data !== undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      loadbalancerid: {
        type: SequelizeStatic.INTEGER(11),
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_ecl2_solutions",
    }
  );
};

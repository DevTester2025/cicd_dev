import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import * as _ from "lodash";

export interface ECL2LBSettingsAttributes {}
export interface ECL2LBSettingsInstance
  extends Instance<ECL2LBSettingsAttributes> {
  dataValues: ECL2LBSettingsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2LBSettingsInstance, ECL2LBSettingsAttributes>(
    "ecl2lbsettings",
    {
      lbsettingid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      loadbalancerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      servicegroup: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.servicegroup", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.servicegroup");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      servicegroupmemberbindings: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(
            this,
            "dataValues.servicegroupmemberbindings",
            JSON.stringify(data)
          );
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.servicegroupmemberbindings");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      lbserver: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.lbserver", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.lbserver");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      lbvserver: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.lbvserver", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.lbvserver");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      lbvserversgbindings: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.lbvserversgbindings", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.lbvserversgbindings");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      servicegroupmonitorbindings: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(
            this,
            "dataValues.servicegroupmonitorbindings",
            JSON.stringify(data)
          );
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.servicegroupmonitorbindings");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      lbvservermethodbindings: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(
            this,
            "dataValues.lbvservermethodbindings",
            JSON.stringify(data)
          );
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.lbvservermethodbindings");
          if (data != undefined && data != null) {
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
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_ecl2_lbsettings",
    }
  );
};

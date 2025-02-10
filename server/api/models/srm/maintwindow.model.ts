import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import _ = require("lodash");

export interface MaintWindowAttributes {}
export interface MaintWindowInstance extends Instance<MaintWindowAttributes> {
  dataValues: MaintWindowAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<MaintWindowInstance, MaintWindowAttributes>(
    "MaintWindow",
    {
      maintwindowid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      windowname: {
        type: SequelizeStatic.STRING(30),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
      },
      region: {
        type: SequelizeStatic.STRING(20),
      },
      startdate: {
        type: SequelizeStatic.DATE,
      },
      enddate: {
        type: SequelizeStatic.DATE,
      },
      duration: {
        type: SequelizeStatic.DECIMAL(10, 2),
      },
      monday: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.monday", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.monday");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      tuesday: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.tuesday", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.tuesday");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      wednesday: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.wednesday", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.wednesday");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      thursday: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.thursday", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.thursday");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      friday: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.friday", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.friday");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      saturday: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.saturday", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.saturday");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      sunday: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.sunday", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.sunday");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
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
      tableName: "tbl_srm_maintwindow",
    }
  );
};

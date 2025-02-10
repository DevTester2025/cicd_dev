import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import * as _ from "lodash";

export interface ECL2SubnetsAttributes {}
export interface ECL2SubnetsInstance extends Instance<ECL2SubnetsAttributes> {
  dataValues: ECL2SubnetsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2SubnetsInstance, ECL2SubnetsAttributes>(
    "ecl2subnets",
    {
      subnetid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2subnetid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      subnetname: {
        type: SequelizeStatic.STRING(100),
      },
      allocationpools: {
        type: SequelizeStatic.STRING(1000),
      },
      subnetcidr: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      dnsnameservers: {
        type: SequelizeStatic.STRING(500),
      },
      enabledhcp: {
        type: SequelizeStatic.STRING(1),
      },
      gatewayip: {
        type: SequelizeStatic.STRING(20),
      },
      hostroutes: {
        type: SequelizeStatic.STRING(500),
      },
      ipversion: {
        type: SequelizeStatic.STRING(10),
      },
      networkid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ecl2networkid: {
        type: SequelizeStatic.STRING(100),
      },
      ntpservers: {
        type: SequelizeStatic.STRING(500),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
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
      unallocatedips: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.unallocatedips", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.unallocatedips");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      allocatedips: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.allocatedips", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.allocatedips");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_ecl2_subnets",
    }
  );
};

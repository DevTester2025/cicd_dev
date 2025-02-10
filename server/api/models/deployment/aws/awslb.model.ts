import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import _ = require("lodash");

export interface AWSLBAttributes {}
export interface AWSLBInstance extends Instance<AWSLBAttributes> {
  dataValues: AWSLBAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSLBInstance, AWSLBAttributes>(
    "awslb",
    {
      lbid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      lbname: {
        type: SequelizeStatic.STRING(100),
      },
      listeners: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.listeners", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.listeners");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      vpcid: {
        type: SequelizeStatic.INTEGER(11),
      },
      subnetid: {
        type: SequelizeStatic.STRING(11),
      },
      certificatearn: {
        type: SequelizeStatic.STRING(100),
      },
      securitypolicy: {
        type: SequelizeStatic.STRING(50),
      },
      securitygroupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      // targetgroupawsid: {
      //   type: SequelizeStatic.STRING(50)
      // },
      hcport: {
        type: SequelizeStatic.INTEGER(11),
      },
      hcinterval: {
        type: SequelizeStatic.INTEGER(11),
      },
      hctimeout: {
        type: SequelizeStatic.INTEGER(11),
      },
      hchealthythreshold: {
        type: SequelizeStatic.INTEGER(11),
      },
      hcunhealthythreshold: {
        type: SequelizeStatic.INTEGER(11),
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      notes: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_aws_loadbalancer",
    }
  );
};

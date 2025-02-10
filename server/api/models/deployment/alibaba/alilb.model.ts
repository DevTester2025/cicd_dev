import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import _ = require("lodash");

export interface AliLBAttributes {}
export interface AliLBInstance extends Instance<AliLBAttributes> {
  dataValues: AliLBAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliLBInstance, AliLBAttributes>(
    "alilb",
    {
      lbid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      alilbid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vswitchid: {
        type: SequelizeStatic.INTEGER(11),
      },
      lbname: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      attachedservers: {
        type: SequelizeStatic.STRING(200),
        set: function (data: any) {
          _.set(this, "dataValues.attachedservers", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.attachedservers");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      internet: {
        type: SequelizeStatic.STRING(1),
      },
      internetchargetype: {
        type: SequelizeStatic.STRING(100),
      },
      bandwidth: {
        type: SequelizeStatic.INTEGER(11),
      },
      specification: {
        type: SequelizeStatic.STRING(100),
      },
      ipaddress: {
        type: SequelizeStatic.STRING(50),
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
      tableName: "tbl_ali_loadbalancer",
    }
  );
};

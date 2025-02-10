import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import _ = require("lodash");

export interface AliLBListenerAttributes {}
export interface AliLBListenerInstance
  extends Instance<AliLBListenerAttributes> {
  dataValues: AliLBListenerAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliLBListenerInstance, AliLBListenerAttributes>(
    "alilblistener",
    {
      lblistenerid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      alilblistenerid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      lbid: {
        type: SequelizeStatic.INTEGER(11),
      },
      frontendport: {
        type: SequelizeStatic.INTEGER(11),
      },
      backendport: {
        type: SequelizeStatic.INTEGER(11),
      },
      protocol: {
        type: SequelizeStatic.STRING(100),
      },
      bandwidth: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      scheduler: {
        type: SequelizeStatic.STRING(20),
      },
      persistencetimeout: {
        type: SequelizeStatic.INTEGER(11),
      },
      healthcheck: {
        type: SequelizeStatic.STRING(1),
      },
      healthchecktype: {
        type: SequelizeStatic.STRING(10),
      },
      healthythreshold: {
        type: SequelizeStatic.INTEGER(11),
      },
      unhealthythreshold: {
        type: SequelizeStatic.INTEGER(11),
      },
      healthchecktimeout: {
        type: SequelizeStatic.INTEGER(11),
      },
      healthcheckinterval: {
        type: SequelizeStatic.INTEGER(11),
      },
      sslcertificate: {
        type: SequelizeStatic.STRING(100),
      },
      aclname: {
        type: SequelizeStatic.STRING(50),
      },
      aclipversion: {
        type: SequelizeStatic.STRING(10),
      },
      aclstatus: {
        type: SequelizeStatic.STRING(10),
      },
      acltype: {
        type: SequelizeStatic.STRING(10),
      },
      aclid: {
        type: SequelizeStatic.STRING(100),
      },
      establishedtimeout: {
        type: SequelizeStatic.INTEGER(11),
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
      tableName: "tbl_ali_lblistener",
    }
  );
};

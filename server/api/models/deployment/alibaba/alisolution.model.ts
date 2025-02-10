import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import _ = require("lodash");

export interface AliSolutionAttributes {}
export interface AliSolutionInstance extends Instance<AliSolutionAttributes> {
  dataValues: AliSolutionAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliSolutionInstance, AliSolutionAttributes>(
    "alisolution",
    {
      alisolutionid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      serverid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancename: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(20),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vswitchid: {
        type: SequelizeStatic.INTEGER(11),
      },
      imageid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancetypeid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vpcid: {
        type: SequelizeStatic.INTEGER(11),
      },
      securitygroupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      volumeid: {
        type: SequelizeStatic.INTEGER(11),
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
      lbid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancechargetype: {
        type: SequelizeStatic.STRING(50),
      },
      internetchargetype: {
        type: SequelizeStatic.STRING(50),
      },
      internetmaxbandwidthin: {
        type: SequelizeStatic.INTEGER(11),
      },
      internetmaxbandwidthout: {
        type: SequelizeStatic.INTEGER(11),
      },
      noofservers: {
        type: SequelizeStatic.INTEGER(11),
      },
      hostname: {
        type: SequelizeStatic.STRING(100),
      },
      adminusername: {
        type: SequelizeStatic.STRING(100),
      },
      adminpassword: {
        type: SequelizeStatic.STRING(100),
      },
      deletionprotectionyn: {
        type: SequelizeStatic.STRING(1),
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
      tableName: "tbl_ali_solution",
    }
  );
};

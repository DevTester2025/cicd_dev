import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import _ = require("lodash");

export interface AliDeploymentAttributes {}
export interface AliDeploymentInstance
  extends Instance<AliDeploymentAttributes> {
  dataValues: AliDeploymentAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliDeploymentInstance, AliDeploymentAttributes>(
    "alideployment",
    {
      alideploymentid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      deploymentid: {
        type: SequelizeStatic.INTEGER(11),
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      alisolutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancename: {
        type: SequelizeStatic.STRING(100),
      },
      vpcid: {
        type: SequelizeStatic.INTEGER(11),
      },
      imageid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancetypeid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vswitchid: {
        type: SequelizeStatic.INTEGER(11),
      },
      securitygroupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      volumeid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagsid: {
        type: SequelizeStatic.INTEGER(11),
      },
      keyid: {
        type: SequelizeStatic.STRING(20),
      },
      scriptid: {
        type: SequelizeStatic.INTEGER(11),
      },
      lbid: {
        type: SequelizeStatic.INTEGER(11),
      },
      publicipyn: {
        type: SequelizeStatic.STRING(1),
      },
      deletionprotectionyn: {
        type: SequelizeStatic.STRING(1),
      },
      publicipv4: {
        type: SequelizeStatic.STRING(20),
      },
      privateipv4: {
        type: SequelizeStatic.STRING(20),
      },
      publicdns: {
        type: SequelizeStatic.STRING(100),
      },
      notes: {
        type: SequelizeStatic.STRING(500),
      },
      instanceoutput: {
        type: SequelizeStatic.STRING(2000),
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
      tableName: "tbl_ali_deployments",
    }
  );
};

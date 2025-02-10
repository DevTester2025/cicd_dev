import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import * as _ from "lodash";

export interface AWSSolutionAttributes {}
export interface AWSSolutionInstance extends Instance<AWSSolutionAttributes> {
  dataValues: AWSSolutionAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSSolutionInstance, AWSSolutionAttributes>(
    "awssolution",
    {
      awssolutionid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vpcid: {
        type: SequelizeStatic.INTEGER(11),
      },
      amiid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancetypeid: {
        type: SequelizeStatic.INTEGER(11),
      },
      subnetid: {
        type: SequelizeStatic.INTEGER(11),
      },
      securitygroupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancename: {
        type: SequelizeStatic.STRING(50),
      },
      awsamiid: {
        type: SequelizeStatic.STRING(100),
      },
      awsvpcid: {
        type: SequelizeStatic.STRING(100),
      },
      awssubnetd: {
        type: SequelizeStatic.STRING(100),
      },
      awssecuritygroupid: {
        type: SequelizeStatic.STRING(100),
      },
      keyid: {
        type: SequelizeStatic.INTEGER(11),
      },
      lbid: {
        type: SequelizeStatic.INTEGER(11),
      },
      rootvolumesize: {
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
      publicipyn: {
        type: SequelizeStatic.STRING(1),
      },
      shutdownbehaviour: {
        type: SequelizeStatic.STRING(20),
      },
      terminationprotectionyn: {
        type: SequelizeStatic.STRING(),
      },
      monitoringyn: {
        type: SequelizeStatic.STRING(1),
      },
      monitorutilyn: {
        type: SequelizeStatic.STRING(1),
      },
      notes: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_aws_solution",
    }
  );
};

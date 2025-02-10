import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSDeploymentVolumesattributes {}
export interface AWSDeploymentVolumesInstance
  extends Instance<AWSDeploymentVolumesattributes> {
  dataValues: AWSDeploymentVolumesattributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    AWSDeploymentVolumesInstance,
    AWSDeploymentVolumesattributes
  >(
    "awsdeployedvolumes",
    {
      dvolumeid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      awsdeploymentid: SequelizeStatic.INTEGER(11),
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      volumetype: {
        type: SequelizeStatic.STRING(20),
      },
      sizeingb: {
        type: SequelizeStatic.INTEGER(11),
      },
      delontermination: {
        type: SequelizeStatic.STRING(1),
      },
      encryptedyn: {
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
      tableName: "tbl_aws_deployedvolumes",
    }
  );
};

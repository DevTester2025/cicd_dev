import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSZonesAttributes {}
export interface AWSZoneInstance extends Instance<AWSZonesAttributes> {
  dataValues: AWSZonesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSZoneInstance, AWSZonesAttributes>(
    "awszone",
    {
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      zonename: {
        type: SequelizeStatic.STRING(100),
      },
      displayname: {
        type: SequelizeStatic.STRING(100),
      },
      awszoneid: {
        type: SequelizeStatic.STRING(20),
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
      tableName: "tbl_aws_zones",
    }
  );
};

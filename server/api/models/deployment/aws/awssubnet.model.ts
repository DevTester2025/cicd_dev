import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSSubNetAttributes {}
export interface AWSSubNetInstance extends Instance<AWSSubNetAttributes> {
  dataValues: AWSSubNetAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSSubNetInstance, AWSSubNetAttributes>(
    "awssubnet",
    {
      subnetid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      subnetname: {
        type: SequelizeStatic.STRING(200),
      },
      awssubnetd: {
        type: SequelizeStatic.STRING(20),
      },
      vpcid: {
        type: SequelizeStatic.INTEGER(11),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ipv4cidr: {
        type: SequelizeStatic.STRING(20),
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
      tableName: "tbl_aws_subnet",
    }
  );
};

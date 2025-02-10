import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSVPCAttributes {}
export interface AWSVPCInstance extends Instance<AWSVPCAttributes> {
  dataValues: AWSVPCAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSVPCInstance, AWSVPCAttributes>(
    "awsvpc",
    {
      vpcid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vpcname: {
        type: SequelizeStatic.STRING(200),
      },
      awsvpcid: {
        type: SequelizeStatic.STRING(50),
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
      tableName: "tbl_aws_vpc",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSInstTypeAttributes {}
export interface AWSInstTypeInstance extends Instance<AWSInstTypeAttributes> {
  dataValues: AWSInstTypeAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSInstTypeInstance, AWSInstTypeAttributes>(
    "awsinsttype",
    {
      instancetypeid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      instancetypename: {
        type: SequelizeStatic.STRING(100),
      },
      version: {
        type: SequelizeStatic.INTEGER(5),
      },
      vcpu: {
        type: SequelizeStatic.INTEGER(11),
      },
      memory: {
        type: SequelizeStatic.FLOAT,
      },
      storage: {
        type: SequelizeStatic.STRING(100),
      },
      cpucredithour: {
        type: SequelizeStatic.FLOAT,
      },
      priceperhour: {
        type: SequelizeStatic.FLOAT,
      },
      pricepermonth: {
        type: SequelizeStatic.FLOAT,
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
      tableName: "tbl_aws_instancetype",
    }
  );
};

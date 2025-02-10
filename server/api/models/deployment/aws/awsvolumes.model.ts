import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSVolumesAttributes {}
export interface AWSVolumesInstance extends Instance<AWSVolumesAttributes> {
  dataValues: AWSVolumesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSVolumesInstance, AWSVolumesAttributes>(
    "awsvolumes",
    {
      volumeid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      awssolutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      awsvolumeid: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_aws_volumes",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSAMIttributes {}
export interface AWSAMIInstance extends Instance<AWSAMIttributes> {
  dataValues: AWSAMIttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSAMIInstance, AWSAMIttributes>(
    "awsami",
    {
      amiid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      awsamiid: {
        type: SequelizeStatic.STRING(50),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      aminame: {
        type: SequelizeStatic.STRING(200),
      },
      platform: {
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
      tableName: "tbl_aws_ami",
    }
  );
};

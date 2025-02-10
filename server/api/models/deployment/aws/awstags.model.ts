import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSTagsAttributes {}
export interface AWSTagsInstance extends Instance<AWSTagsAttributes> {
  dataValues: AWSTagsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSTagsInstance, AWSTagsAttributes>(
    "awstags",
    {
      tagid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagkey: {
        type: SequelizeStatic.STRING(50),
      },
      tagvalue: {
        type: SequelizeStatic.STRING(100),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(10),
      },
      resourceid: {
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
      tableName: "tbl_aws_tags",
    }
  );
};

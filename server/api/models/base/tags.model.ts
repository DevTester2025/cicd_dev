import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface TagsAttributes {}
export interface TagsInstance extends Instance<TagsAttributes> {
  dataValues: TagsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<TagsInstance, TagsAttributes>(
    "Tags",
    {
      tagid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(50),
      },
      tagname: {
        type: SequelizeStatic.STRING(50),
      },
      tagtype: {
        type: SequelizeStatic.STRING(50),
      },
      regex: {
        type: SequelizeStatic.STRING(500),
      },
      description: {
        type: SequelizeStatic.STRING(1000),
      },
      lookupvalues: {
        type: SequelizeStatic.TEXT,
      },
      attributeid: {
        type: SequelizeStatic.STRING(100),
      },
      resourceid: {
        type: SequelizeStatic.STRING(100),
      },
      required: {
        type: SequelizeStatic.BOOLEAN,
        defaultValue: false,
        allowNull: true,
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
      tableName: "tbl_bs_tags",
    }
  );
};

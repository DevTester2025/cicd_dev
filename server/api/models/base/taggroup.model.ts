import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface TagGroupAttributes {}
export interface TagGroupInstance extends Instance<TagGroupAttributes> {
  dataValues: TagGroupAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<TagGroupInstance, TagGroupAttributes>(
    "TagGroup",
    {
      taggroupid: {
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
      groupname: {
        type: SequelizeStatic.STRING(50),
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
      tableName: "tbl_bs_taggroup",
    }
  );
};

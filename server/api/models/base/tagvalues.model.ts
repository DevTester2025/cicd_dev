import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface TagValuesAttributes {}
export interface TagValuesInstance extends Instance<TagValuesAttributes> {
  dataValues: TagValuesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<TagValuesInstance, TagValuesAttributes>(
    "TagValues",
    {
      tagvalueid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(30),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(50),
      },
      resourcerefid: {
        type: SequelizeStatic.STRING(100),
      },
      attributerefid: {
        type: SequelizeStatic.STRING(100),
      },
      refid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagorder: {
        type: SequelizeStatic.INTEGER(11),
      },
      resourceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      taggroupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagvalue: {
        type: SequelizeStatic.TEXT,
      },
      category: {
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
      tableName: "tbl_bs_tag_values",
    }
  );
};

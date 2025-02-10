import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ResourceTemplatesAttributes {}
export interface ResourceTemplatesInstance
  extends Instance<ResourceTemplatesAttributes> {
  dataValues: ResourceTemplatesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ResourceTemplatesInstance,
    ResourceTemplatesAttributes
  >(
    "resourcetemplates",
    {
      resourceid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      provider: {
        type: SequelizeStatic.STRING(20),
      },
      resourcename: {
        type: SequelizeStatic.STRING(50),
      },
      template: {
        type: SequelizeStatic.TEXT,
      },
      version: {
        type: SequelizeStatic.STRING(10),
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
      tableName: "tbl_tf_resourcetemplates",
    }
  );
};

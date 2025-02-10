import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ContactPointsAttributes {}
export interface ContactPointsInstance extends Instance<ContactPointsAttributes> {
  dataValues: ContactPointsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ContactPointsInstance, ContactPointsAttributes>(
    "ContactPoints",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      action: {
        type: SequelizeStatic.STRING(50),
      },
      actiontype: {
        type: SequelizeStatic.TEXT,
      },
      module: {
        type: SequelizeStatic.STRING(25),
      },
      refid: {
        type: SequelizeStatic.INTEGER(11),
      },
      reftype: {
        type: SequelizeStatic.TEXT,
      },
      meta: SequelizeStatic.TEXT,
      tenantid: {
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
      tableName: "tbl_bs_contactpoints",
    }
  );
};

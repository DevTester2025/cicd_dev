import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AliInstancetypeAttributes {}
export interface AliInstancetypeInstance
  extends Instance<AliInstancetypeAttributes> {
  dataValues: AliInstancetypeAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliInstancetypeInstance, AliInstancetypeAttributes>(
    "aliinstancetype",
    {
      instancetypeid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      aliinstancetypeid: {
        type: SequelizeStatic.STRING(100),
      },
      instancetypename: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      cpucorecount: {
        type: SequelizeStatic.INTEGER(11),
      },
      memory: {
        type: SequelizeStatic.INTEGER(11),
      },
      supportedregion: {
        type: SequelizeStatic.STRING(200),
      },
      instancetypefamily: {
        type: SequelizeStatic.STRING(20),
      },
      notes: {
        type: SequelizeStatic.STRING(500),
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
      tableName: "tbl_ali_instancetype",
    }
  );
};

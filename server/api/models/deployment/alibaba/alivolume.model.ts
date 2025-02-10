import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AliVolumeAttributes {}
export interface AliVolumeInstance extends Instance<AliVolumeAttributes> {
  dataValues: AliVolumeAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliVolumeInstance, AliVolumeAttributes>(
    "alivolume",
    {
      volumeid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      alivolumeid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      alisolutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      name: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      sizeingb: {
        type: SequelizeStatic.INTEGER(11),
      },
      diskcategory: {
        type: SequelizeStatic.STRING(20),
      },
      encryptedyn: {
        type: SequelizeStatic.STRING(1),
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
      tableName: "tbl_ali_volumes",
    }
  );
};

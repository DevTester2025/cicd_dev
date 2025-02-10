import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AliImageAttributes {}
export interface AliImageInstance extends Instance<AliImageAttributes> {
  dataValues: AliImageAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliImageInstance, AliImageAttributes>(
    "aliimage",
    {
      imageid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      aliimageid: {
        type: SequelizeStatic.STRING(200),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      imagename: {
        type: SequelizeStatic.STRING(200),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      imageowner: {
        type: SequelizeStatic.STRING(20),
      },
      imagesize: {
        type: SequelizeStatic.INTEGER(11),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      snapshotid: {
        type: SequelizeStatic.STRING(200),
      },
      ostype: {
        type: SequelizeStatic.STRING(20),
      },
      platform: {
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
      tableName: "tbl_ali_image",
    }
  );
};

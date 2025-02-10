import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2ImagesAttributes {}
export interface ECL2ImagesInstance extends Instance<ECL2ImagesAttributes> {
  dataValues: ECL2ImagesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2ImagesInstance, ECL2ImagesAttributes>(
    "ecl2images",
    {
      imageid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      imagename: {
        type: SequelizeStatic.STRING(200),
      },
      ecl2imageid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(10),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      platform: {
        type: SequelizeStatic.STRING(100),
      },
      notes: {
        type: SequelizeStatic.STRING(500),
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
      tableName: "tbl_ecl2_images",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2ZonesAttributes {}
export interface ECL2ZonesInstance extends Instance<ECL2ZonesAttributes> {
  dataValues: ECL2ZonesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2ZonesInstance, ECL2ZonesAttributes>(
    "ecl2zones",
    {
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      zonename: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ecl2zoneid: {
        type: SequelizeStatic.STRING(20),
      },
      region: {
        type: SequelizeStatic.STRING(10),
      },
      notes: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_ecl2_zones",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AliZonesAttributes {}
export interface AliZonesInstance extends Instance<AliZonesAttributes> {
  dataValues: AliZonesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliZonesInstance, AliZonesAttributes>(
    "alizones",
    {
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      zonename: {
        type: SequelizeStatic.STRING(100),
      },
      region: {
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
      tableName: "tbl_ali_zones",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AvailSlaAttributes {}
export interface AvailSlaInstance extends Instance<AvailSlaAttributes> {
  dataValues: AvailSlaAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AvailSlaInstance, AvailSlaAttributes>(
    "AvailSla",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      slatemplateid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      slaid: {
        type: SequelizeStatic.INTEGER(11),
      },
      uptimeprcnt: {
        type: SequelizeStatic.INTEGER(11),
      },
      rpo: {
        type: SequelizeStatic.FLOAT,
      },
      rto: {
        type: SequelizeStatic.FLOAT,
      },
      tagid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagvalue: {
        type: SequelizeStatic.STRING(50),
      },
      notes: {
        type: SequelizeStatic.TEXT,
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
      tableName: "tbl_tn_customer_availsla",
    }
  );
};

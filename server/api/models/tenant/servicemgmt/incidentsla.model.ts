import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface IncidentSlaAttributes {}
export interface IncidentSlaInstance extends Instance<IncidentSlaAttributes> {
  dataValues: IncidentSlaAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<IncidentSlaInstance, IncidentSlaAttributes>(
    "IncidentSla",
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
      priority: {
        type: SequelizeStatic.INTEGER(11),
      },
      responsetime: SequelizeStatic.FLOAT,
      resolutiontime: SequelizeStatic.FLOAT,
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
      tableName: "tbl_tn_incidentsla",
    }
  );
};

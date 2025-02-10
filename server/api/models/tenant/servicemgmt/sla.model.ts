import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SlaAttributes {}
export interface SlaInstance extends Instance<SlaAttributes> {
  dataValues: SlaAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<SlaInstance, SlaAttributes>(
    "Sla",
    {
      slaid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      slaname: {
        type: SequelizeStatic.STRING(20),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      slatemplateid: {
        type: SequelizeStatic.INTEGER(11),
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      priority: {
        type: SequelizeStatic.INTEGER(11),
      },
      responsetimemins: {
        type: SequelizeStatic.INTEGER(11),
      },
      uptimeprcnt: {
        type: SequelizeStatic.INTEGER(11),
      },
      workinghrs: {
        type: SequelizeStatic.INTEGER(11),
      },
      creditsprcnt: {
        type: SequelizeStatic.INTEGER(11),
      },
      replacementhrs: {
        type: SequelizeStatic.INTEGER(11),
      },
      resolutionhrs: {
        type: SequelizeStatic.FLOAT,
      },
      rpo: {
        type: SequelizeStatic.FLOAT,
      },
      rto: {
        type: SequelizeStatic.FLOAT,
      },
      startdate: SequelizeStatic.DATE,
      enddate: SequelizeStatic.DATE,
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
      tableName: "tbl_tn_sla",
    }
  );
};

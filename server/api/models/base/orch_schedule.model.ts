import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface OrchestrationScheduleAttributes { }
export interface OrchestrationScheduleInstance
  extends Instance<OrchestrationScheduleAttributes> {
  dataValues: OrchestrationScheduleAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    OrchestrationScheduleInstance,
    OrchestrationScheduleAttributes
  >(
    "OrchestrationSchedule",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: SequelizeStatic.TEXT,
      },
      recurring: SequelizeStatic.BOOLEAN,
      exptrid: {
        type: SequelizeStatic.INTEGER(11),
      },
      scheduled: SequelizeStatic.BOOLEAN,
      lastrun: SequelizeStatic.DATE,
      nextrun: SequelizeStatic.DATE,
      repetition: SequelizeStatic.INTEGER(11),
      expectedrun: SequelizeStatic.INTEGER(11),
      _orch: {
        type: SequelizeStatic.INTEGER(11),
      },
      scdlid: {
        type: SequelizeStatic.INTEGER(11),
      },
      _tenant: {
        type: SequelizeStatic.INTEGER(11),
      },
      _account: {
        type: SequelizeStatic.INTEGER(11),
      },
      _customer: {
        type: SequelizeStatic.INTEGER(11),
      },
      _tag: {
        type: SequelizeStatic.INTEGER(11),
      },
      _maintwindow: {
        type: SequelizeStatic.INTEGER(11),
      },
      runtimestamp: {
        type: SequelizeStatic.DATE,
      },
      instances: Sequelize.TEXT,
      tagvalue: {
        type: SequelizeStatic.STRING(500),
      },
      notes: {
        type: SequelizeStatic.TEXT,
      },
      totalrun: {
        type: SequelizeStatic.TEXT,
      },
      params: SequelizeStatic.TEXT,
      trigger: SequelizeStatic.TEXT,
      trigger_meta: SequelizeStatic.TEXT,
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
      tableName: "tbl_orch_schedule",
    }
  );
};

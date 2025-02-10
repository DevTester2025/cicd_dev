//schedule header model created - 30-10-2023
import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface OrchestrationScheduleHdrAttributes { }
export interface OrchestrationScheduleHdrInstance
  extends Instance<OrchestrationScheduleHdrAttributes> {
  dataValues: OrchestrationScheduleHdrAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    OrchestrationScheduleHdrInstance,
    OrchestrationScheduleHdrAttributes
  >(
    "OrchestrationScheduleHdr",
    {
      scdlid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: SequelizeStatic.STRING(100),
      },
      totalrun: {
        type: SequelizeStatic.INTEGER(11),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      orchid: {
        type: SequelizeStatic.INTEGER(11),
      },
      cmpltdrun: {
        type: SequelizeStatic.INTEGER(11),
      },
      pendingrun: {
        type: SequelizeStatic.INTEGER(11),
      },
      inprogress: {
        type: SequelizeStatic.INTEGER(11),
      },
      successrun: {
        type: SequelizeStatic.INTEGER(11),
      },
      failedrun: {
        type: SequelizeStatic.INTEGER(11),
      },
      duration: {
        type: SequelizeStatic.INTEGER(11),
      },
      starttime: {
        type: SequelizeStatic.DATE,
      },
      endtime: {
        type: SequelizeStatic.DATE,
      },
      status: {
        type: SequelizeStatic.STRING(30),
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
      tableName: "tbl_orch_schedulehdr",
    }
  );
};

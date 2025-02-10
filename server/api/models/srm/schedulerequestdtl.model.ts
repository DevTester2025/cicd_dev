import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ScheduleReqDtlAttributes {}
export interface ScheduleReqDtlInstance
  extends Instance<ScheduleReqDtlAttributes> {
  dataValues: ScheduleReqDtlAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ScheduleReqDtlInstance, ScheduleReqDtlAttributes>(
    "schedulerequestdetail",
    {
      scheduledreqdtlid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      scheduledreqhdrid: {
        type: SequelizeStatic.INTEGER(11),
      },
      upgradeplantype: {
        type: SequelizeStatic.INTEGER(11),
      },
      requestday: {
        type: SequelizeStatic.STRING(20),
      },
      reqstarttime: {
        type: SequelizeStatic.STRING(10),
      },
      reqendtime: {
        type: SequelizeStatic.STRING(10),
      },
      execute: {
        type: SequelizeStatic.STRING(20),
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
      tableName: "tbl_srm_scheduledreqdtls",
    }
  );
};

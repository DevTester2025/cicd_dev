import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface OrchestrationLogAttributes {}
export interface OrchestrationLog extends Instance<OrchestrationLogAttributes> {
  dataValues: OrchestrationLogAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<OrchestrationLog, OrchestrationLogAttributes>(
    "OrchestrationLog",
    {
      id: {
        type: SequelizeStatic.UUID,
        defaultValue: SequelizeStatic.UUIDV4,
        allowNull: false,
        primaryKey: true,
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
      _orchschedule: {
        type: SequelizeStatic.STRING(100),
      },
      _instance: {
        type: SequelizeStatic.INTEGER(11),
      },
      params: SequelizeStatic.TEXT,
      execution_start: {
        type: SequelizeStatic.DATE,
      },
      execution_end: {
        type: SequelizeStatic.DATE,
      },
      notes: {
        type: SequelizeStatic.TEXT,
      },
      lifecycle: SequelizeStatic.TEXT,
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
      tableName: "tbl_orch_schedule_log",
    }
  );
};

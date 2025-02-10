import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface OrchestrationLogAttributes {}
export interface OrchestrationLog extends Instance<OrchestrationLogAttributes> {
  dataValues: OrchestrationLogAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<OrchestrationLog, OrchestrationLogAttributes>(
    "OrchestrationLifecycle",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      scdlid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      refid: {
        type: SequelizeStatic.STRING(100),
      },
      node: { type: SequelizeStatic.STRING(100) },
      log: {
        type: SequelizeStatic.TEXT,
      },
      status: {
        type: SequelizeStatic.STRING(100),
        allowNull: false,
      },
      message: SequelizeStatic.TEXT,
      createdby: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      createddt: {
        type: SequelizeStatic.DATE,
      },
      updateddt: {
        type: SequelizeStatic.DATE,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_orch_lifecycle",
    }
  );
};

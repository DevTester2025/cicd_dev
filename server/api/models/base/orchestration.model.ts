import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface OrchestrationAttributes {}
export interface OrchestrationInstance
  extends Instance<OrchestrationAttributes> {
  dataValues: OrchestrationAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<OrchestrationInstance, OrchestrationAttributes>(
    "Orchestration",
    {
      orchid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      categoryid: {
        type: SequelizeStatic.INTEGER(11),
      },
      orchname: {
        type: SequelizeStatic.STRING(100),
      },
      orchdesc: {
        type: SequelizeStatic.STRING(500),
      },
      orchflow: {
        type: SequelizeStatic.TEXT,
      },
      params: {
        type: SequelizeStatic.TEXT,
      },
      scripts: {
        type: SequelizeStatic.TEXT,
      },
      module: {
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
      tableName: "tbl_bs_orchestration",
    }
  );
};

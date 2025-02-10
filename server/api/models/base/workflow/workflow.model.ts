import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface WorkflowAttributes {}
export interface WorkflowInstance
  extends SequelizeStatic.Instance<WorkflowAttributes> {
  dataValues: WorkflowAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<WorkflowInstance, WorkflowAttributes>(
    "Workflow",
    {
      wrkflowid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      wrkflowname: SequelizeStatic.STRING(50),
      module: SequelizeStatic.STRING(50),
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
      tableName: "tbl_tn_workflow",
    }
  );
};

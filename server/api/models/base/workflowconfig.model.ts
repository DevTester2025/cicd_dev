import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface WorkFlowAttributes {}
export interface WorkFlowInstance extends Instance<WorkFlowAttributes> {
  dataValues: WorkFlowAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<WorkFlowInstance, WorkFlowAttributes>(
    "WorkFlow",
    {
      aprvalwrkflowid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      aprvalwrkflowname: {
        type: SequelizeStatic.STRING(50),
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
      tableName: "tbl_srm_aprvalwrkflow",
    }
  );
};

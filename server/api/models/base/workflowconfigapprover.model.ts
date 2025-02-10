import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface WorkFlowApproverAttributes {}
export interface WorkFlowApproverInstance
  extends Instance<WorkFlowApproverAttributes> {
  dataValues: WorkFlowApproverAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<WorkFlowApproverInstance, WorkFlowApproverAttributes>(
    "WorkFlowApprover",
    {
      wrkflowaprvrid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      aprvalwrkflowid: {
        type: SequelizeStatic.INTEGER(11),
      },
      userid: {
        type: SequelizeStatic.INTEGER(11),
      },
      aprvseqid: {
        type: SequelizeStatic.INTEGER(11),
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
      tableName: "tbl_srm_wrkflow_aprover",
    }
  );
};

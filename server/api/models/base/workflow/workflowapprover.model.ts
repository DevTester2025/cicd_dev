import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface ApproverAttributes {}
export interface ApproverInstance
  extends SequelizeStatic.Instance<ApproverAttributes> {
  dataValues: ApproverAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<ApproverInstance, ApproverAttributes>(
    "Approver",
    {
      wrkflowaprvrid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      wrkflowid: {
        type: SequelizeStatic.INTEGER(11),
        defaultValue: 0
      },
      userid: SequelizeStatic.INTEGER(11),
      aprvrseqid: SequelizeStatic.INTEGER(11),
      reqid: SequelizeStatic.INTEGER(11),
      completion_status: SequelizeStatic.STRING(50),
      rejection_status: SequelizeStatic.STRING(50),
      approvalstatus: SequelizeStatic.STRING(50),
      notes: SequelizeStatic.TEXT,
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
      tableName: "tbl_tn_wrkflow_aprover",
    }
  );
};

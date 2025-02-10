import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface ActionsAttributes {}
export interface ActionsInstance
  extends SequelizeStatic.Instance<ActionsAttributes> {
  dataValues: ActionsAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<ActionsInstance, ActionsAttributes>(
    "Actions",
    {
        actionsid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      resourceid: {
        type: SequelizeStatic.INTEGER(100),
      },
      resource_title:{
        type: SequelizeStatic.STRING(1000),
      },
      actiontype: SequelizeStatic.STRING(10),
      fromuserid: SequelizeStatic.INTEGER(11),
      touserid: SequelizeStatic.INTEGER(11),
      duedate : {
        type: SequelizeStatic.DATE,
        allowNull: true
      },
      to_duedate : {
        type: SequelizeStatic.DATE,
        allowNull: true
      },
      workflow_status: {
        type: SequelizeStatic.STRING(100),
        defaultValue: "Pending"
      },
      assignee_status: {
        type: SequelizeStatic.STRING(100),
        defaultValue: ""
      },
      approverlevel: SequelizeStatic.INTEGER(11),
      notes: {
        type: SequelizeStatic.TEXT,
        allowNull: true
      },
      module: {
        type: SequelizeStatic.STRING(100),
        defaultValue: 'workpack-executable'
      },
      tenantid: {
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
      tableName: "tbl_tn_wrkflow_actions",
    }
  );
};

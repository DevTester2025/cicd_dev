import * as SequelizeStatic from "sequelize";

export interface TemplateTaskAttributes {}
export interface TemplateTaskInstance
  extends SequelizeStatic.Instance<TemplateTaskAttributes> {
  dataValues: TemplateTaskAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<TemplateTaskInstance, TemplateTaskAttributes>(
    "TemplateTask",
    {
      task_tid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      workpack_tid: {
        type: SequelizeStatic.INTEGER(11)
      },
      title: {
        type: SequelizeStatic.STRING(100),
      },
      position: {
        type: SequelizeStatic.INTEGER(11),
      },
      description: {
        type: SequelizeStatic.TEXT,
      },
      expected_result: {
        type: SequelizeStatic.STRING(100),
      },
      notes: {
        type: SequelizeStatic.TEXT,
      },
      estimate: {
        type: SequelizeStatic.INTEGER(11),
      },
      orchestrator_id: {
        type: SequelizeStatic.INTEGER(11),
      },
      workflow_id: {
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
      updatedby: {
        type: SequelizeStatic.STRING(50),
      },
      updateddt: {
        type: SequelizeStatic.DATE,
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_wp_taskstemplates",
    }
  );
};

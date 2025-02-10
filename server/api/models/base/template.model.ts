import * as SequelizeStatic from "sequelize";

export interface TemplateAttributes {}
export interface TemplateInstance
  extends SequelizeStatic.Instance<TemplateAttributes> {
  dataValues: TemplateAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<TemplateInstance, TemplateAttributes>(
    "Template",
    {
        workpack_tid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      title: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.TEXT,
      },
      component: {
        type: SequelizeStatic.STRING(100),
      },
      category: {
        type: SequelizeStatic.STRING(100),
      },
      version: {
        type: SequelizeStatic.STRING(50),
      },
      reference: {
        type: SequelizeStatic.STRING(50),
      },
      prerequisites: {
        type: SequelizeStatic.STRING(50),
      },
      notes: {
        type: SequelizeStatic.TEXT,
      },
      estimate: {
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
      tableName: "tbl_wp_templates",
    }
  );
};

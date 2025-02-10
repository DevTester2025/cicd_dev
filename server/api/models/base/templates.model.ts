import * as SequelizeStatic from "sequelize";

export interface NtfTemplateAttributes {}
export interface NtfTemplateInstances
  extends SequelizeStatic.Instance<NtfTemplateAttributes> {
  dataValues: NtfTemplateAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<NtfTemplateInstances, NtfTemplateAttributes>(
    "NtfTemplate",
    {
      templateid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      template: {
        type: SequelizeStatic.TEXT,
      },
      title: {
        type: SequelizeStatic.STRING(500),
      },
      description: {
        type: SequelizeStatic.TEXT,
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
      tableName: "tbl_tn_template",
    }
  );
};

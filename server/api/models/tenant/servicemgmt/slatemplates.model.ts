import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SlaTemplatesAttributes {}
export interface SlaTemplatesInstance extends Instance<SlaTemplatesAttributes> {
  dataValues: SlaTemplatesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<SlaTemplatesInstance, SlaTemplatesAttributes>(
    "SlaTemplates",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11)
      },
      slaname: {
        type: SequelizeStatic.STRING(20),
      },
      notes: {
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
      tableName: "tbl_tn_slatemplates",
    }
  );
};

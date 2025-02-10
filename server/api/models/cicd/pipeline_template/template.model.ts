import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface TemplateAttributes{}

export interface TemplateInstance extends Instance<TemplateAttributes> {
  dataValues: TemplateAttributes;
}

export default (sequelize: Sequelize) => {
  return sequelize.define<TemplateInstance, TemplateAttributes>(
    "PipelineTemplate",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      pipelinename: {
        type: SequelizeStatic.STRING(50),
        allowNull: true,
      },
      runnerid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: true,
      },
      crn: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
        allowNull: true,
      },
      providerrepo: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      providerbranch: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      filename: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      pipelineflow: {
        type: SequelizeStatic.JSON,
        allowNull: false,
      },
      status: {
        type: SequelizeStatic.STRING(10),
        allowNull: false,
      },
      createdby: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      createddt: {
        type: SequelizeStatic.DATE,
        allowNull: false,
      },
      lastupdatedby: {
        type: SequelizeStatic.STRING(50),
        allowNull: true,
      },
      lastupdateddt: {
        type: SequelizeStatic.DATE,
        allowNull: true,
      },
      isdefault: {
        type: SequelizeStatic.BOOLEAN,
        allowNull: false,
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_cicd_pipeline_template",
    }
  );
};

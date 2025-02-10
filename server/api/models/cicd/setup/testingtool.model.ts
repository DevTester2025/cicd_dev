import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface TestingToolAttributes {}
export interface TestingToolInstance extends Instance<TestingToolAttributes> {
  dataValues: TestingToolAttributes;
}

export default (sequelize: Sequelize) => {
  return sequelize.define<TestingToolInstance, TestingToolAttributes>(
    "TestingTool",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      type: {
        type: SequelizeStatic.STRING(45),
        allowNull: false,
      },
      name: {
        type: SequelizeStatic.STRING(45),
        allowNull: false,
      },
      organization: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      url: {
        type: SequelizeStatic.STRING(500),
        allowNull: true,
      },
      accesstokenisvariable: {
        type: SequelizeStatic.BOOLEAN,
        allowNull: true,
      },
      accesstokenvariable: {
        type: SequelizeStatic.STRING(45),
        allowNull: true,
      },
      urlisvariable: {
        type: SequelizeStatic.BOOLEAN,
        allowNull: true,
      },
      urlvariable: {
        type: SequelizeStatic.STRING(45),
        allowNull: true,
      },
      description: {
        type: SequelizeStatic.STRING(500),
        allowNull: true,
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
      accesstoken: {
        type: SequelizeStatic.STRING(500),
        allowNull: true,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_cicd_testing_tools",
    }
  );
};

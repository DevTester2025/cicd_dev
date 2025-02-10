import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SolutionsAttributes {}
export interface SolutionsInstance extends Instance<SolutionsAttributes> {
  dataValues: SolutionsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<SolutionsInstance, SolutionsAttributes>(
    "Solutions",
    {
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      solutionname: {
        type: SequelizeStatic.STRING(100),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(15),
      },
      notes: {
        type: SequelizeStatic.STRING(100),
      },
      // slaid: {
      //     type: SequelizeStatic.INTEGER(11)
      // },
      slaname: {
        type: SequelizeStatic.STRING(50),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      // notificaitonid: {
      //     type: SequelizeStatic.INTEGER(11)
      // },
      clientid: {
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
      tableName: "tbl_solutions",
    }
  );
};

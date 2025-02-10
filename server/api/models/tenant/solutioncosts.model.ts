/*
 * @Author: Vidhya M
 * @Date: 2020-07-23 12:02:38
 * @Last Modified by: Vidhya M
 * @Last Modified time: 2020-07-23 13:42:35
 */

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SolutionCostAttributes {}
export interface SolutionCostInstance extends Instance<SolutionCostAttributes> {
  dataValues: SolutionCostAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<SolutionCostInstance, SolutionCostAttributes>(
    "SolutionCosts",
    {
      solutioncostid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      costvisualid: {
        type: SequelizeStatic.INTEGER(11),
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      assetid: {
        type: SequelizeStatic.INTEGER(11),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(20),
      },
      costtype: {
        type: SequelizeStatic.STRING(20),
      },
      baseprice: {
        type: SequelizeStatic.DECIMAL(19, 4),
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
      tableName: "tbl_tn_solution_costs",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface RecommendSetupAttributes {}
export interface RecommendSetupInstance
  extends Instance<RecommendSetupAttributes> {
  dataValues: RecommendSetupAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<RecommendSetupInstance, RecommendSetupAttributes>(
    "RecommendSetup",
    {
      recommendsetupid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      platform: {
        type: SequelizeStatic.STRING(10),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(15),
      },
      region: {
        type: SequelizeStatic.STRING(30),
      },
      pricetype: {
        type: SequelizeStatic.STRING(30),
      },
      cpuutilmin: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      cpuutilmax: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      memutilmin: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      memutilmax: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      action: {
        type: SequelizeStatic.STRING(25),
      },
      notes: {
        type: SequelizeStatic.STRING(10),
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
      tableName: "tbl_nm_recommendation_setup",
    }
  );
};

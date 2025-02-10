import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface RecommendationAttributes {}
export interface RecommendationInstance
  extends Instance<RecommendationAttributes> {
  dataValues: RecommendationAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<RecommendationInstance, RecommendationAttributes>(
    "Recommendation",
    {
      recommendationid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      platform: {
        type: SequelizeStatic.STRING(100),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(30),
      },
      region: {
        type: SequelizeStatic.STRING(30),
      },
      pricetype: {
        type: SequelizeStatic.STRING(30),
      },
      plantype: {
        type: SequelizeStatic.INTEGER(11),
      },
      recommendsetupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      utilrangemin: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      utilrangemax: {
        type: SequelizeStatic.DECIMAL(19, 4),
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
      discutilmin: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      discutilmax: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      netutilmin: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      netutilmax: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      // duration: {
      //     type: SequelizeStatic.STRING(10)
      // },
      recommendedplantype: {
        type: SequelizeStatic.INTEGER(11),
      },
      recommendationone: {
        type: SequelizeStatic.INTEGER(11),
      },
      recommendationtwo: {
        type: SequelizeStatic.INTEGER(11),
      },
      recommendationthree: {
        type: SequelizeStatic.INTEGER(11),
      },
      restartyn: {
        type: SequelizeStatic.STRING(1),
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
      tableName: "tbl_nm_recommendation",
    }
  );
};

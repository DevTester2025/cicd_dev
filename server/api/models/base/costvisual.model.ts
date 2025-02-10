import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface CostVisualAttributes {}
export interface CostVisualInstance extends Instance<CostVisualAttributes> {
  dataValues: CostVisualAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<CostVisualInstance, CostVisualAttributes>(
    "CostVisual",
    {
      costvisualid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
      },
      region: {
        type: SequelizeStatic.STRING(30),
      },
      pricetype: {
        type: SequelizeStatic.STRING(30),
      },
      resourcetype: {
        type: SequelizeStatic.STRING(30),
      },
      plantype: {
        type: SequelizeStatic.STRING(100),
      },
      unit: {
        type: SequelizeStatic.STRING(20),
      },
      priceperunit: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      image: {
        type: SequelizeStatic.STRING(150),
      },
      currency: {
        type: SequelizeStatic.STRING(20),
      },
      version: {
        type: SequelizeStatic.INTEGER(5),
      },
      pricingmodel: {
        type: SequelizeStatic.STRING(30),
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
      tableName: "tbl_bs_costvisual",
    }
  );
};

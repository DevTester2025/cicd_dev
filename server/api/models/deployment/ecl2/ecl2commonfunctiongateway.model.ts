import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2CommonfunctiongatewayAttributes {}
export interface ECL2CommonfunctiongatewayInstance
  extends Instance<ECL2CommonfunctiongatewayAttributes> {
  dataValues: ECL2CommonfunctiongatewayAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ECL2CommonfunctiongatewayInstance,
    ECL2CommonfunctiongatewayAttributes
  >(
    "ecl2commonfunctiongateway",
    {
      cfgatewayid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2cfgatewayid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      cfpoolid: {
        type: SequelizeStatic.INTEGER(11),
      },
      cfgatewayname: {
        type: SequelizeStatic.STRING(100),
      },
      subnetid: {
        type: SequelizeStatic.INTEGER(11),
      },
      networkid: {
        type: SequelizeStatic.INTEGER(11),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      notes: {
        type: SequelizeStatic.STRING(500),
      },
      tnregionid: {
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
      tableName: "tbl_ecl2_commonfunctiongateway",
    }
  );
};

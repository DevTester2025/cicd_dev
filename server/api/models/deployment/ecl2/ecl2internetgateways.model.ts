import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2InternetgatewaysAttributes {}
export interface ECL2InternetgatewaysInstance
  extends Instance<ECL2InternetgatewaysAttributes> {
  dataValues: ECL2InternetgatewaysAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ECL2InternetgatewaysInstance,
    ECL2InternetgatewaysAttributes
  >(
    "ecl2internetgateways",
    {
      internetgatewayid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2internetgatewayid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      gatewayname: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      internetservicesid: {
        type: SequelizeStatic.INTEGER(11),
      },
      qosoptionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
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
      tableName: "tbl_ecl2_internetgateways",
    }
  );
};

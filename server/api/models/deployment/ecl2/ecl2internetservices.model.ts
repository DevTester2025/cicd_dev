import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2InternetservicesAttributes {}
export interface ECL2InternetservicesInstance
  extends Instance<ECL2InternetservicesAttributes> {
  dataValues: ECL2InternetservicesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ECL2InternetservicesInstance,
    ECL2InternetservicesAttributes
  >(
    "ecl2internetservices",
    {
      internetservicesid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2internetservicesid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(10),
      },
      servicename: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      minimalsubmasklength: {
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
      tableName: "tbl_ecl2_internetservices",
    }
  );
};

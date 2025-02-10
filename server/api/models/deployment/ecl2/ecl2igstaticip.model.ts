import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2IgStaticIpAttributes {}
export interface ECL2IgStaticIpInstance
  extends Instance<ECL2IgStaticIpAttributes> {
  dataValues: ECL2IgStaticIpAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2IgStaticIpInstance, ECL2IgStaticIpAttributes>(
    "ecl2igstaticip",
    {
      igstaticipid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2igstaticipid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      staticipname: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      internetgatewayid: {
        type: SequelizeStatic.INTEGER(11),
      },
      servicetype: {
        type: SequelizeStatic.STRING(100),
      },
      destination: {
        type: SequelizeStatic.STRING(100),
      },
      nexthop: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_ecl2_igstaticip",
    }
  );
};

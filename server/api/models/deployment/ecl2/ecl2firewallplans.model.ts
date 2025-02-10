import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2FirewallplansAttributes {}
export interface ECL2FirewallplansInstance
  extends Instance<ECL2FirewallplansAttributes> {
  dataValues: ECL2FirewallplansAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ECL2FirewallplansInstance,
    ECL2FirewallplansAttributes
  >(
    "ecl2firewallplans",
    {
      firewallplanid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2firewallplanid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(10),
      },
      firewallplanname: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      vendor: {
        type: SequelizeStatic.STRING(100),
      },
      version: {
        type: SequelizeStatic.STRING(10),
      },
      enabled: {
        type: SequelizeStatic.STRING(1),
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
      tableName: "tbl_ecl2_firewallplans",
    }
  );
};

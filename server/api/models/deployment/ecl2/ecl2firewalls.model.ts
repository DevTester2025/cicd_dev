import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2FirewallsAttributes {}
export interface ECL2FirewallsInstance
  extends Instance<ECL2FirewallsAttributes> {
  dataValues: ECL2FirewallsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2FirewallsInstance, ECL2FirewallsAttributes>(
    "ecl2firewalls",
    {
      firewallid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2firewallid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      firewallname: {
        type: SequelizeStatic.STRING(100),
      },
      availabilityzone: {
        type: SequelizeStatic.STRING(20),
      },
      defaultgateway: {
        type: SequelizeStatic.STRING(20),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      firewallplanid: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_ecl2_firewalls",
    }
  );
};

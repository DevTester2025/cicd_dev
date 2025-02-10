import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2LBPlanAttributes {}
export interface ECL2LBPlanInstance extends Instance<ECL2LBPlanAttributes> {
  dataValues: ECL2LBPlanAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2LBPlanInstance, ECL2LBPlanAttributes>(
    "ecl2lbplan",
    {
      lbplanid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2lbplanid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(10),
      },
      lbplanname: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      vendor: {
        type: SequelizeStatic.STRING(50),
      },
      version: {
        type: SequelizeStatic.STRING(20),
      },
      maximumsyslogservers: {
        type: SequelizeStatic.INTEGER(11),
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
      notes: {
        type: SequelizeStatic.STRING(500),
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
      tableName: "tbl_ecl2_lbplan",
    }
  );
};

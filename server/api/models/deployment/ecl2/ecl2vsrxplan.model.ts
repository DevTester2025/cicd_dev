import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2vSRXPlanAttributes {}
export interface ECL2vSRXPlanInstance extends Instance<ECL2vSRXPlanAttributes> {
  dataValues: ECL2vSRXPlanAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2vSRXPlanInstance, ECL2vSRXPlanAttributes>(
    "ecl2vsrxplan",
    {
      vsrxplanid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2vsrxplanid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vsrxplanname: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      appliancetype: {
        type: SequelizeStatic.STRING(100),
      },
      region: {
        type: SequelizeStatic.STRING(10),
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
      tableName: "tbl_ecl2_vsrxplan",
    }
  );
};

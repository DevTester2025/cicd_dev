import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2VolumesAttributes {}
export interface ECL2VolumesInstance extends Instance<ECL2VolumesAttributes> {
  dataValues: ECL2VolumesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2VolumesInstance, ECL2VolumesAttributes>(
    "ecl2volumes",
    {
      volumeid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2volumeid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      volumename: {
        type: SequelizeStatic.STRING(50),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      iopspergb: {
        type: SequelizeStatic.STRING(20),
      },
      size: {
        type: SequelizeStatic.INTEGER(11),
      },
      volumetype: {
        type: SequelizeStatic.STRING(50),
      },
      initiatoriqns: {
        type: SequelizeStatic.STRING(50),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      virtualstorageid: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ecl2deploymentid: {
        type: SequelizeStatic.INTEGER(11),
      },
      notes: {
        type: SequelizeStatic.STRING(1000),
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
      tableName: "tbl_ecl2_volumes",
    }
  );
};

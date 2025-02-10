import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2QosoptionsAttributes {}
export interface ECL2QosoptionsInstance
  extends Instance<ECL2QosoptionsAttributes> {
  dataValues: ECL2QosoptionsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2QosoptionsInstance, ECL2QosoptionsAttributes>(
    "ecl2qosoptions",
    {
      qosoptionid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2qosoptionid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(10),
      },
      qosoptionname: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      awsserviceid: {
        type: SequelizeStatic.STRING(100),
      },
      azureserviceid: {
        type: SequelizeStatic.STRING(100),
      },
      bandwidth: {
        type: SequelizeStatic.INTEGER(11),
      },
      gcpserviceid: {
        type: SequelizeStatic.STRING(100),
      },
      interdcserviceid: {
        type: SequelizeStatic.STRING(100),
      },
      internetserviceid: {
        type: SequelizeStatic.STRING(100),
      },
      qostype: {
        type: SequelizeStatic.STRING(50),
      },
      servicetype: {
        type: SequelizeStatic.STRING(50),
      },
      vpnserviceid: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_ecl2_qosoptions",
    }
  );
};

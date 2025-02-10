import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2KeysAttributes {}
export interface ECL2KeysInstance extends Instance<ECL2KeysAttributes> {
  dataValues: ECL2KeysAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2KeysInstance, ECL2KeysAttributes>(
    "ecl2keys",
    {
      keyid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      keyname: {
        type: SequelizeStatic.STRING(100),
      },
      publickey: {
        type: SequelizeStatic.TEXT,
      },
      fingerprint: {
        type: SequelizeStatic.STRING(500),
      },
      userid: {
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
      tableName: "tbl_ecl2_keys",
    }
  );
};

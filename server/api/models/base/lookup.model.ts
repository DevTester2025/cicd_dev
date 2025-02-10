import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface LookUpAttributes {}
export interface LookUpInstance extends Instance<LookUpAttributes> {
  dataValues: LookUpAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<LookUpInstance, LookUpAttributes>(
    "LookUp",
    {
      lookupid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      lookupkey: {
        type: SequelizeStatic.STRING(20),
      },
      keyname: {
        type: SequelizeStatic.STRING(100),
      },
      keydesc: {
        type: SequelizeStatic.STRING(100),
      },
      keyvalue: {
        type: SequelizeStatic.STRING(200),
      },
      datatype: {
        type: SequelizeStatic.STRING(10),
      },
      defaultvalue: {
        type: SequelizeStatic.STRING(100),
      },
      displayorder: {
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
      tableName: "tbl_bs_lookup",
    }
  );
};

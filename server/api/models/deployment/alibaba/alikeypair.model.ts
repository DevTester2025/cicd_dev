import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AliKeyPairsAttributes {}
export interface AliKeyPairsInstance extends Instance<AliKeyPairsAttributes> {
  dataValues: AliKeyPairsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliKeyPairsInstance, AliKeyPairsAttributes>(
    "alikeypairs",
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
        type: SequelizeStatic.STRING(50),
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
      tableName: "tbl_ali_keypairs",
    }
  );
};

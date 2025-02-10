import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AliSGRulesAttributes {}
export interface AliSGRulesInstance extends Instance<AliSGRulesAttributes> {
  dataValues: AliSGRulesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliSGRulesInstance, AliSGRulesAttributes>(
    "alisgrules",
    {
      sgrulesid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      alisgruleid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      securitygroupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      sgrulename: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      nictype: {
        type: SequelizeStatic.STRING(20),
      },
      direction: {
        type: SequelizeStatic.STRING(20),
      },
      ipprotocol: {
        type: SequelizeStatic.STRING(20),
      },
      policy: {
        type: SequelizeStatic.STRING(10),
      },
      portrange: {
        type: SequelizeStatic.STRING(30),
      },
      priority: {
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
      tableName: "tbl_ali_sgrules",
    }
  );
};

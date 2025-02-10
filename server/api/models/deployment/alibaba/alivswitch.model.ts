import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AliVSwitchAttributes {}
export interface AliVSwitchInstance extends Instance<AliVSwitchAttributes> {
  dataValues: AliVSwitchAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliVSwitchInstance, AliVSwitchAttributes>(
    "alivswitch",
    {
      vswitchid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      alivswitchid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vpcid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vswitchname: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      ipv4cidr: {
        type: SequelizeStatic.STRING(20),
      },
      isdefault: {
        type: SequelizeStatic.STRING(1),
      },
      zoneid: {
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
      tableName: "tbl_ali_vswitch",
    }
  );
};

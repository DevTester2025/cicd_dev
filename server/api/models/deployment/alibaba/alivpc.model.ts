import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AliVPCAttributes {}
export interface AliVPCInstance extends Instance<AliVPCAttributes> {
  dataValues: AliVPCAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AliVPCInstance, AliVPCAttributes>(
    "alivpc",
    {
      vpcid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      alivpcid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      vpcname: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      ipv4cidr: {
        type: SequelizeStatic.STRING(20),
      },
      region: {
        type: SequelizeStatic.STRING(20),
      },
      vrouterid: {
        type: SequelizeStatic.STRING(100),
      },
      isdefault: {
        type: SequelizeStatic.STRING(1),
      },
      resourcegroupid: {
        type: SequelizeStatic.STRING(200),
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
      tableName: "tbl_ali_vpc",
    }
  );
};

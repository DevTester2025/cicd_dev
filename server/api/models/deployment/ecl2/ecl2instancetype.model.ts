import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2InstancetypeAttributes {}
export interface ECL2InstancetypeInstance
  extends Instance<ECL2InstancetypeAttributes> {
  dataValues: ECL2InstancetypeAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2InstancetypeInstance, ECL2InstancetypeAttributes>(
    "ecl2instancetype",
    {
      instancetypeid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      instancetypename: {
        type: SequelizeStatic.STRING(100),
      },
      vcpu: {
        type: SequelizeStatic.INTEGER(11),
      },
      version: {
        type: SequelizeStatic.INTEGER(5),
      },
      memory: {
        type: SequelizeStatic.INTEGER(10),
      },
      storage: {
        type: SequelizeStatic.STRING(100),
      },
      notes: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_ecl2_instancetype",
    }
  );
};

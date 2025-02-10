import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import _ = require("lodash");

export interface MaintWindowAmpAttributes {}
export interface MaintWindowMapInstance extends Instance<MaintWindowAmpAttributes> {
  dataValues: MaintWindowAmpAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<MaintWindowMapInstance, MaintWindowAmpAttributes>(
    "MaintWindowMap",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      maintwindowid: {
        type: SequelizeStatic.INTEGER(11),
      },
      txnid: {
        type: SequelizeStatic.INTEGER(11),
      },
      txntype: {
        type: SequelizeStatic.STRING(50),
      },
      notes: {
        type: SequelizeStatic.STRING(500),
      },
      metadata: {
        type: SequelizeStatic.TEXT,
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
      tableName: "tbl_srm_maintwindowmap",
    }
  );
};

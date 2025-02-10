import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SRActionAttributes {}
export interface SRActionInstance extends Instance<SRActionAttributes> {
  dataValues: SRActionAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<SRActionInstance, SRActionAttributes>(
    "srmsractions",
    {
      sractionsid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      srvrequestid: {
        type: SequelizeStatic.INTEGER(11),
      },
      actiontype: {
        type: SequelizeStatic.STRING(10),
      },
      fromuserid: {
        type: SequelizeStatic.INTEGER(11),
      },
      touserid: {
        type: SequelizeStatic.INTEGER(11),
      },
      duedate: {
        type: SequelizeStatic.DATE,
      },
      department: {
        type: SequelizeStatic.STRING(100),
      },
      srstatus: {
        type: SequelizeStatic.STRING(20),
      },
      apprvstatus: {
        type: SequelizeStatic.STRING(10),
      },
      approverlevel: {
        type: SequelizeStatic.INTEGER(1),
      },
      notes: {
        type: SequelizeStatic.STRING(50),
      },
      createdby: {
        type: SequelizeStatic.STRING(50),
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
      tableName: "tbl_srm_sractions",
    }
  );
};

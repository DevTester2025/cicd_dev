import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AsstUtlHdrAttributes {}
export interface AsstUtlHdrInstance extends Instance<AsstUtlHdrAttributes> {
  dataValues: AsstUtlHdrAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AsstUtlHdrInstance, AsstUtlHdrAttributes>(
    "AsstUtlHdr",
    {
      utilhdrid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      lastrun: {
        type: SequelizeStatic.DATE,
      },
      nextrun: {
        type: SequelizeStatic.DATE,
      },
      responsedata: {
        type: SequelizeStatic.TEXT,
      },
      status: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Active",
        allowNull: false,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_nm_asstutlhdr",
    }
  );
};

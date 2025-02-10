import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AsstUtlDtlAttributes {}
export interface AsstUtlDtlInstance extends Instance<AsstUtlDtlAttributes> {
  dataValues: AsstUtlDtlAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AsstUtlDtlInstance, AsstUtlDtlAttributes>(
    "AsstUtlDtl",
    {
      utildtlid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      utilhdrid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      utildate: {
        type: SequelizeStatic.DATE,
      },
      instanceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancerefid: {
        type: SequelizeStatic.INTEGER(11),
      },
      utiltype: {
        type: SequelizeStatic.STRING(10),
      },
      utilkey: {
        type: SequelizeStatic.STRING(30),
      },
      value: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      uom: {
        type: SequelizeStatic.STRING(20),
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_nm_asstutldtl",
    }
  );
};

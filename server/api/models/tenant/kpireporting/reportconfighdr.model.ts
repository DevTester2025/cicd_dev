import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface KPIReportConfigHdrAttributes {}
export interface KPIReportConfigHdrInstance
  extends Instance<KPIReportConfigHdrAttributes> {
  dataValues: KPIReportConfigHdrAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    KPIReportConfigHdrInstance,
    KPIReportConfigHdrAttributes
  >(
    "KPIReportConfigHdr",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      title: {
        type: SequelizeStatic.STRING(50),
      },
      description: {
        type: SequelizeStatic.STRING(200),
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
      tableName: "tbl_tn_kpi_reportconfighdr",
    }
  );
};

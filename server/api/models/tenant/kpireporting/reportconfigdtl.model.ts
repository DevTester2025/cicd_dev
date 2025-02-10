import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface KPIReportConfigDtlAttributes {}
export interface KPIReportConfigDtlInstance
  extends Instance<KPIReportConfigDtlAttributes> {
  dataValues: KPIReportConfigDtlAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    KPIReportConfigDtlInstance,
    KPIReportConfigDtlAttributes
  >(
    "KPIReportConfigDtl",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      _confighdrid: {
        type: SequelizeStatic.INTEGER(11),
      },
      reporttype: {
        type: SequelizeStatic.STRING(50),
      },
      seriesname: {
        type: SequelizeStatic.STRING(50),
      },
      savedqueryid:{
        type: SequelizeStatic.INTEGER(11),
      },
      startdate: {
        type: SequelizeStatic.DATE,
      },
      enddate: {
        type: SequelizeStatic.DATE,
      },
      duration: {
        type: SequelizeStatic.STRING(10),
      },
      groupby: {
        type: SequelizeStatic.STRING(30),
      },
      charttype: {
        type: SequelizeStatic.STRING(10),
      },
      settings: {
        type: SequelizeStatic.TEXT,
      },
      filterby: {
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
      tableName: "tbl_tn_kpi_reportconfigdtl",
    }
  );
};

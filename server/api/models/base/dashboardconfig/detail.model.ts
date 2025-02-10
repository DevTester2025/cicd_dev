import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface DashboardConfigDtlAttributes {}
export interface DashboardConfigDtlInstance
  extends SequelizeStatic.Instance<DashboardConfigDtlAttributes> {
  dataValues: DashboardConfigDtlAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<
    DashboardConfigDtlInstance,
    DashboardConfigDtlAttributes
  >(
    "Dashboard-ConfigsDtl",
    {
      configdtlid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      confighdrid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      referenceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancename: {
        type: SequelizeStatic.STRING(100),
      },
      instancerefid: {
        type: SequelizeStatic.STRING(100),
      },
      displayname: {
        type: SequelizeStatic.STRING(50),
      },
      reportyn: {
        type: SequelizeStatic.STRING(1),
      },
      downtimeyn: {
        type: SequelizeStatic.STRING(1),
      },
      uptime: {
        type: SequelizeStatic.FLOAT,
      },
      displayorder: {
        type: SequelizeStatic.INTEGER(11),
      },
      dailyreportyn:{
        type: SequelizeStatic.STRING(1),
      },
      dailyreportconfig:{
        type: SequelizeStatic.TEXT,
      },
      status: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Active",
        allowNull: false,
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
      tableName: "tbl_bs_dashboardconfigdtl",
    }
  );
};

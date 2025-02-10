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
    "Dashboard-ConfigsHdr",
    {
      confighdrid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      sectionname: {
        type: SequelizeStatic.STRING(50),
      },
      tagid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tagvalue: {
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
        type: SequelizeStatic.INTEGER(11)
      },
      dailyreportyn:{
        type: SequelizeStatic.STRING(1),
      },
      status: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Active",
        allowNull: false,
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
      tableName: "tbl_bs_dashboardconfighdr",
    }
  );
};

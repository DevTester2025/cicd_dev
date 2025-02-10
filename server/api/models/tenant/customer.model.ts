import * as _ from "lodash";
import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface CustomerAttributes {}
export interface CustomerInstance extends Instance<CustomerAttributes> {
  dataValues: CustomerAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<CustomerInstance, CustomerAttributes>(
    "Customer",
    {
      customerid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customername: {
        type: SequelizeStatic.STRING(50),
      },
      customercode:{
        type: SequelizeStatic.STRING(30),
      },
      customeraddress: {
        type: SequelizeStatic.STRING(2000),
      },
      postcode: {
        type: SequelizeStatic.STRING(12),
      },
      phoneno: {
        type: SequelizeStatic.STRING(12),
      },
      secondaryphoneno: {
        type: SequelizeStatic.STRING(12),
      },
      contactperson: {
        type: SequelizeStatic.STRING(30),
      },
      contactemail: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2tenantid: {
        type: SequelizeStatic.STRING(100),
      },
      awsaccountid: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2region: {
        type: SequelizeStatic.STRING(10),
      },
      awsregion: {
        type: SequelizeStatic.STRING(50),
      },
      resourceid: {
        type: SequelizeStatic.STRING(50),
      },
      ecl2contractid: {
        type: SequelizeStatic.STRING(100),
      },
      dashboardconfig: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.dashboardconfig", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.dashboardconfig");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      slatemplateid: {
        type: SequelizeStatic.INTEGER(11),
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
      allowedusers: {
        type: SequelizeStatic.TEXT,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_tn_customers",
    }
  );
};

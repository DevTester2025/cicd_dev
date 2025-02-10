import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface CustomFieldAttributes {}
export interface CustomFieldInstance extends Instance<CustomFieldAttributes> {
  dataValues: CustomFieldAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<CustomFieldInstance, CustomFieldAttributes>(
    "CustomField",
    {
      customfldid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      paramtype: {
        type: SequelizeStatic.STRING(15),
      },
      referencetype: {
        type: SequelizeStatic.STRING(50),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      templateid: {
        type: SequelizeStatic.INTEGER(11),
      },
      scriptid: {
        type: SequelizeStatic.INTEGER(11),
      },
      referenceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      fieldname: {
        type: SequelizeStatic.STRING(100),
      },
      fieldlabel: {
        type: SequelizeStatic.STRING(100),
      },
      fieldvalue: {
        type: SequelizeStatic.TEXT,
      },
      datatype: {
        type: SequelizeStatic.STRING(10),
      },
      fieldoptions: {
        type: SequelizeStatic.STRING(1000),
      },
      fieldwidth: {
        type: SequelizeStatic.STRING(20),
      },
      defaultvalue: {
        type: SequelizeStatic.STRING(20),
      },
      forminput: {
        type: SequelizeStatic.STRING(1),
      },
      orderno: {
        type: SequelizeStatic.INTEGER(11),
      },
      showinexport: {
        type: SequelizeStatic.STRING(1),
      },
      showinreport: {
        type: SequelizeStatic.STRING(1),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(20),
      },
      refdeploymentid: {
        type: SequelizeStatic.INTEGER(11),
      },
      isunique: {
        type: SequelizeStatic.STRING(1),
        defaultValue: "N",
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
      tableName: "tbl_bs_customfield",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SRAttributes {}
export interface SRInstance extends Instance<SRAttributes> {
  dataValues: SRAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<SRInstance, SRAttributes>(
    "srmsr",
    {
      srvrequestid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      catalogid: {
        type: SequelizeStatic.INTEGER(11),
      },
      wrkflowid: {
        type: SequelizeStatic.INTEGER(11),
      },
      userid: {
        type: SequelizeStatic.INTEGER(11),
      },
      assignedto: {
        type: SequelizeStatic.INTEGER(11),
      },
      reporter: {
        type: SequelizeStatic.INTEGER(11),
      },
      department: {
        type: SequelizeStatic.STRING(50),
      },
      environment: {
        type: SequelizeStatic.STRING(50),
      },
      priority: {
        type: SequelizeStatic.STRING(30),
      },
      requesttype: {
        type: SequelizeStatic.STRING(50),
      },
      requestdate: {
        type: SequelizeStatic.DATE,
      },
      duedate: {
        type: SequelizeStatic.DATE,
      },
      subject: {
        type: SequelizeStatic.STRING(50),
      },
      description: {
        type: SequelizeStatic.STRING(1000),
      },
      clientid: {
        type: SequelizeStatic.INTEGER(11),
      },
      referenceno: {
        type: SequelizeStatic.STRING(50),
      },
      requesturl: {
        type: SequelizeStatic.STRING(50),
      },
      emailyn: {
        type: SequelizeStatic.STRING(1),
      },
      urgentyn: {
        type: SequelizeStatic.STRING(1),
      },
      deploystdate: {
        type: SequelizeStatic.DATE,
      },
      decommdate: {
        type: SequelizeStatic.DATE,
      },
      budgetyn: {
        type: SequelizeStatic.STRING(1),
      },
      golivedate: {
        type: SequelizeStatic.DATE,
      },
      expecteddt: {
        type: SequelizeStatic.DATE,
      },
      progresspercent: {
        type: SequelizeStatic.INTEGER(3),
        defaultValue: 0,
      },
      notes: {
        type: SequelizeStatic.STRING(1000),
      },
      autodeployyn: {
        type: SequelizeStatic.STRING(1),
      },
      custmorprjyn: {
        type: SequelizeStatic.STRING(1),
      },
      srstatus: {
        type: SequelizeStatic.STRING(20),
      },
      assetid: {
        type: SequelizeStatic.INTEGER(11),
      },
      costvisualid: {
        type: SequelizeStatic.INTEGER(11),
      },
      proposedcostvisualid: {
        type: SequelizeStatic.INTEGER(11),
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
      tableName: "tbl_srm_servicerequest",
    }
  );
};

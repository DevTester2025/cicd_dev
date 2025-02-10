import * as SequelizeStatic from "sequelize";

export interface IncidentsAttributes {}
export interface IncidentsInstance
  extends SequelizeStatic.Instance<IncidentsAttributes> {
  dataValues: IncidentsAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<IncidentsInstance, IncidentsAttributes>(
    "Incidents",
    {
      id: {
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
      caller_id: {
        type: SequelizeStatic.STRING(100)
      },
      product: {
        type: SequelizeStatic.STRING(50)
      },
      u_environment: {
        type: SequelizeStatic.STRING(50)
      },
      snow_id: {
        type: SequelizeStatic.STRING(100),
      },
      refid: {
        type: SequelizeStatic.INTEGER(11),
      },
      reftype: {
        type: SequelizeStatic.STRING(50),
      },
      incidentdate: {
        type: SequelizeStatic.DATEONLY,
      },
      incidentclosedt: {
        type: SequelizeStatic.DATE,
      },
      response_ts: {
        type: SequelizeStatic.DATE,
      },
      resolution_ts: {
        type: SequelizeStatic.DATE,
      },
      incidentno: {
        type: SequelizeStatic.STRING(50),
      },
      category: {
        type: SequelizeStatic.STRING(50),
      },
      subcategory: {
        type: SequelizeStatic.STRING(50),
      },
      severity: {
        type: SequelizeStatic.STRING(50),
      },
      impact: {
        type: SequelizeStatic.STRING(20),
      },
      urgency: {
        type: SequelizeStatic.STRING(20),
      },
      contacttype: {
        type: SequelizeStatic.STRING(50),
      },
      assignmentgroup: {
        type: SequelizeStatic.STRING(50),
      },
      assignmentto: {
        type: SequelizeStatic.STRING(100),
      },
      title: {
        type: SequelizeStatic.TEXT,
      },
      displaytitle: {
        type: SequelizeStatic.STRING(200),
      },
      notes: {
        type: SequelizeStatic.TEXT,
      },
      publishyn: {
        type: SequelizeStatic.STRING(1),
      },
      incidentstatus: {
        type: SequelizeStatic.STRING(10),
        allowNull: false,
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
      tableName: "tbl_tn_incidents",
    }
  );
};

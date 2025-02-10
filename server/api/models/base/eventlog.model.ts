import * as SequelizeStatic from "sequelize";
import * as _ from "lodash";

export interface EventLogAttributes {}
export interface EventLogInstance
  extends SequelizeStatic.Instance<EventLogAttributes> {
  dataValues: EventLogAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<EventLogInstance, EventLogAttributes>(
    "eventlog",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      regionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      _accountid: {
        type: SequelizeStatic.INTEGER(11),
      },
      _customer: SequelizeStatic.INTEGER(11),
      module: {
        type: SequelizeStatic.STRING(50),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(100),
      },
      providerrefid: {
        type: SequelizeStatic.STRING(100),
      },
      references: SequelizeStatic.TEXT,
      eventtype: {
        type: SequelizeStatic.STRING(50),
      },
      eventdate: {
        type: SequelizeStatic.DATE,
      },
      referenceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      referencetype: {
        type: SequelizeStatic.STRING(50),
      },
      severity: {
        type: SequelizeStatic.STRING(50),
      },
      cost: {
        type: SequelizeStatic.STRING(30),
      },
      previouscost: {
        type: SequelizeStatic.STRING(30),
      },
      status: {
        type: SequelizeStatic.STRING(15),
      },
      notes: {
        type: SequelizeStatic.STRING(100),
      },
      meta: {
        type: SequelizeStatic.TEXT,
      },
      sysinfo: {
        type: SequelizeStatic.TEXT,
      },
      createdby: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      createddt: {
        type: SequelizeStatic.DATE,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_bs_eventlog",
    }
  );
};

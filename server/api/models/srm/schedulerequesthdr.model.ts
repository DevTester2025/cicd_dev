import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ScheduleRequestAttributes {}
export interface ScheduleRequestInstance
  extends Instance<ScheduleRequestAttributes> {
  dataValues: ScheduleRequestAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ScheduleRequestInstance, ScheduleRequestAttributes>(
    "schedulerequest",
    {
      scheduledreqhdrid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      srvrequestid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
      },
      resourceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      resourcerefid: {
        type: SequelizeStatic.STRING(100),
      },
      maintwindowid: {
        type: SequelizeStatic.INTEGER(11),
      },
      reqstatus: {
        type: SequelizeStatic.STRING(20),
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
      tableName: "tbl_srm_scheduledreqhdr",
    }
  );
};

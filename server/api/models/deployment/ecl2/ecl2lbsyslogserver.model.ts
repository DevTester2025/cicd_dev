import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2LBInterfaceAttributes {}
export interface ECL2LBInterfaceInstance
  extends Instance<ECL2LBInterfaceAttributes> {
  dataValues: ECL2LBInterfaceAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2LBInterfaceInstance, ECL2LBInterfaceAttributes>(
    "ecl2lbsyslogserver",
    {
      lbsyslogserverid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2lbsyslogserverid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(10),
      },
      loadbalancerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      lbsyslogservername: {
        type: SequelizeStatic.STRING(100),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      ipaddress: {
        type: SequelizeStatic.STRING(30),
      },
      acllogging: {
        type: SequelizeStatic.STRING(20),
      },
      appflowlogging: {
        type: SequelizeStatic.STRING(20),
      },
      dateformat: {
        type: SequelizeStatic.STRING(20),
      },
      logfacility: {
        type: SequelizeStatic.STRING(20),
      },
      loglevel: {
        type: SequelizeStatic.STRING(20),
      },
      portnumber: {
        type: SequelizeStatic.INTEGER(11),
      },
      priority: {
        type: SequelizeStatic.INTEGER(11),
      },
      tcplogging: {
        type: SequelizeStatic.STRING(20),
      },
      timezone: {
        type: SequelizeStatic.STRING(20),
      },
      transporttype: {
        type: SequelizeStatic.STRING(20),
      },
      userconfigurablelogmessages: {
        type: SequelizeStatic.STRING(10),
      },
      notes: {
        type: SequelizeStatic.STRING(500),
      },
      tnregionid: {
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
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_ecl2_lbsyslogserver",
    }
  );
};

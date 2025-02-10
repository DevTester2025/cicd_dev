import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import * as _ from "lodash";

export interface ECL2DeploymentsAttributes {}
export interface ECL2DeploymentsInstance
  extends Instance<ECL2DeploymentsAttributes> {
  dataValues: ECL2DeploymentsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ECL2DeploymentsInstance, ECL2DeploymentsAttributes>(
    "ecl2deployments",
    {
      ecl2deploymentid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      deploymentid: {
        type: SequelizeStatic.INTEGER(11),
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ecl2solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ecl2serverid: {
        type: SequelizeStatic.STRING(100),
      },
      ecl2serverpwd: {
        type: SequelizeStatic.STRING(20),
      },
      instancename: {
        type: SequelizeStatic.STRING(50),
      },
      networkid: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.networkid", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.networkid");
          if (data !== undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      imageid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancetypeid: {
        type: SequelizeStatic.INTEGER(11),
      },
      securitygroupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      volumeid: {
        type: SequelizeStatic.STRING(50),
        set: function (data: any) {
          _.set(this, "dataValues.volumeid", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.volumeid");
          if (data !== undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      tagsid: {
        type: SequelizeStatic.INTEGER(11),
      },
      keyid: {
        type: SequelizeStatic.INTEGER(11),
      },
      scriptid: {
        type: SequelizeStatic.INTEGER(50),
      },
      shutdownbehaviour: {
        type: SequelizeStatic.STRING(20),
      },
      monitorutilyn: {
        type: SequelizeStatic.STRING(1),
      },
      publicipv4: {
        type: SequelizeStatic.STRING(20),
      },
      privateipv4: {
        type: SequelizeStatic.STRING(20),
      },
      publicdns: {
        type: SequelizeStatic.STRING(100),
      },
      instanceoutput: {
        type: SequelizeStatic.STRING(2000),
      },
      serveraddresses: {
        type: SequelizeStatic.STRING(100),
        set: function (data: any) {
          _.set(this, "dataValues.serveraddresses", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.serveraddresses");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      virtualipaddress: {
        type: SequelizeStatic.STRING(100),
      },
      fwconflictstatus: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Failed",
      },
      lbconflictstatus: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Failed",
      },
      interconnectivitystatus: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Active",
      },
      notes: {
        type: SequelizeStatic.STRING(1000),
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
      tableName: "tbl_ecl2_deployments",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import * as _ from "lodash";
export interface ECL2LoadbalancersAttributes {}
export interface ECL2LoadbalancersInstance
  extends Instance<ECL2LoadbalancersAttributes> {
  dataValues: ECL2LoadbalancersAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ECL2LoadbalancersInstance,
    ECL2LoadbalancersAttributes
  >(
    "ecl2loadbalancers",
    {
      loadbalancerid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ecl2loadbalancerid: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      lbname: {
        type: SequelizeStatic.STRING(100),
      },
      availabilityzone: {
        type: SequelizeStatic.STRING(20),
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      loadbalancerplanid: {
        type: SequelizeStatic.STRING(100),
      },
      loadbalancerplan: {
        type: SequelizeStatic.STRING(100),
      },
      attachedservers: {
        type: SequelizeStatic.TEXT,
        set: function (data: any) {
          _.set(this, "dataValues.attachedservers", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.attachedservers");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ecl2solutionid: {
        type: SequelizeStatic.STRING(100),
        set: function (data: any) {
          _.set(this, "dataValues.ecl2solutionid", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.ecl2solutionid");
          if (data != undefined && data != null) {
            return JSON.parse(data);
          } else {
            return null;
          }
        },
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      defaultgateway: {
        type: SequelizeStatic.STRING(30),
      },
      availablesubnets: {
        type: SequelizeStatic.INTEGER(11),
      },
      adminusername: {
        type: SequelizeStatic.STRING(50),
      },
      adminpassword: {
        type: SequelizeStatic.STRING(50),
      },
      username: {
        type: SequelizeStatic.STRING(50),
      },
      userpassword: {
        type: SequelizeStatic.STRING(50),
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
      tableName: "tbl_ecl2_loadbalancers",
    }
  );
};

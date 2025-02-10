import * as _ from "lodash";
import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSDeploymentsAttributes {}
export interface AWSDeploymentsInstance
  extends Instance<AWSDeploymentsAttributes> {
  dataValues: AWSDeploymentsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSDeploymentsInstance, AWSDeploymentsAttributes>(
    "awsdeployments",
    {
      awsdeploymentid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      deploymentid: {
        type: SequelizeStatic.INTEGER(11),
      },
      awssolutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancename: {
        type: SequelizeStatic.STRING(50),
      },
      tfmoduleid: {
        type: SequelizeStatic.STRING(11),
      },
      vpcid: {
        type: SequelizeStatic.INTEGER(11),
      },
      amiid: {
        type: SequelizeStatic.STRING(50),
      },
      instancetypeid: {
        type: SequelizeStatic.INTEGER(11),
      },
      subnetid: {
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
        type: SequelizeStatic.INTEGER(11),
      },
      publicipyn: {
        type: SequelizeStatic.STRING(1),
      },
      shutdownbehaviour: {
        type: SequelizeStatic.STRING(20),
      },
      terminationprotectionyn: {
        type: SequelizeStatic.STRING(1),
      },
      monitoringyn: {
        type: SequelizeStatic.STRING(1),
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
      notes: {
        type: SequelizeStatic.STRING(1000),
      },
      instanceoutput: {
        type: SequelizeStatic.TEXT,
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
      lbdns: {
        type: SequelizeStatic.STRING(100),
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_aws_deployments",
    }
  );
};

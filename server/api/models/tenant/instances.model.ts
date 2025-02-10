import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import * as _ from "lodash";
import { constants } from "../../../common/constants";

export interface InstancesAttributes {}
export interface InstancesInstance extends Instance<InstancesAttributes> {
  dataValues: InstancesAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<InstancesInstance, InstancesAttributes>(
    "Instances",
    {
      instanceid: {
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
      cloudprovider: {
        type: SequelizeStatic.STRING(30),
      },
      lifecycle: {
        type: SequelizeStatic.STRING(30),
      },
      deploymentid: {
        type: SequelizeStatic.INTEGER(11),
      },
      rightsizegrpid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancerefid: {
        type: SequelizeStatic.STRING(100),
      },
      instancename: {
        type: SequelizeStatic.STRING(100),
      },
      adminusername: {
        type: SequelizeStatic.STRING(100),
      },
      adminpassword: {
        type: SequelizeStatic.STRING(100),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      region: {
        type: SequelizeStatic.STRING(20),
      },
      rightsizeyn: {
        type: SequelizeStatic.STRING(1),
      },
      imageid: {
        type: SequelizeStatic.INTEGER(11),
      },
      imagerefid: {
        type: SequelizeStatic.STRING(100),
      },
      platform: {
        type: SequelizeStatic.STRING(10),
      },
      instancetypeid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancetyperefid: {
        type: SequelizeStatic.STRING(100),
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
            try {
              return JSON.parse(JSON.stringify(data));
            } catch (error) {
              console.log(constants.JSON_ERROR, error);
              return null;
            }
          } else {
            return null;
          }
        },
      },
      networkrefid: {
        type: SequelizeStatic.STRING(500),
      },
      securitygroupid: {
        type: SequelizeStatic.INTEGER(11),
      },
      securitygrouprefid: {
        type: SequelizeStatic.STRING(100),
      },
      subnetid: {
        type: SequelizeStatic.INTEGER(11),
      },
      subnetrefid: {
        type: SequelizeStatic.STRING(100),
      },
      volumeid: {
        type: SequelizeStatic.INTEGER(11),
      },
      volumerefid: {
        type: SequelizeStatic.STRING(100),
      },
      keyid: {
        type: SequelizeStatic.INTEGER(11),
      },
      accountid: {
        type: SequelizeStatic.INTEGER(11),
      },
      keyrefid: {
        type: SequelizeStatic.STRING(100),
      },
      publicipv4: {
        type: SequelizeStatic.STRING(20),
      },
      privateipv4: {
        type: SequelizeStatic.STRING(100),
      },
      publicdns: {
        type: SequelizeStatic.STRING(100),
      },
      monitoringyn: {
        type: SequelizeStatic.STRING(1),
      },
      deletionprotectionyn: {
        type: SequelizeStatic.STRING(1),
      },
      lbstatus: {
        type: SequelizeStatic.STRING(1),
      },
      emailyn: {
        type: SequelizeStatic.STRING(1),
      },
      notes: {
        type: SequelizeStatic.STRING(500),
      },
      clusterid: {
        type: SequelizeStatic.STRING(100),
      },
      metadata: {
        type: SequelizeStatic.INTEGER(11),
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

      lastrun: {
        type: SequelizeStatic.DATEONLY,
      },
      recommendationid: {
        type: SequelizeStatic.INTEGER(11),
      },
      costyn: {
        type: SequelizeStatic.STRING(1),
      },
      lastcostsyncdt: {
        type: SequelizeStatic.DATE,
      },
      checksum: SequelizeStatic.TEXT,
      cloudstatus: SequelizeStatic.STRING(100),
      orchstatus: SequelizeStatic.STRING(30),
      orchstatuslog: SequelizeStatic.STRING(100),
      promagentstat: SequelizeStatic.STRING(100),
      agentid: SequelizeStatic.STRING(100),
      wagentstatus: SequelizeStatic.STRING(100),
      ssmagent: SequelizeStatic.TEXT,
      ssmagenttype:SequelizeStatic.STRING(50),
      ssmagentstatus: SequelizeStatic.STRING(50),
      ssmsgentid: SequelizeStatic.STRING(50),
      iamrole: SequelizeStatic.STRING(100),
      druuid: SequelizeStatic.STRING(100),
      hostname: SequelizeStatic.STRING(30),
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_tn_instances",
    }
  );
};

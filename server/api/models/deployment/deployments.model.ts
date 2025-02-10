import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface DeploymentsAttributes {}
export interface DeploymentsInstance extends Instance<DeploymentsAttributes> {
  dataValues: DeploymentsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<DeploymentsInstance, DeploymentsAttributes>(
    "deployments",
    {
      deploymentid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      requestid: {
        type: SequelizeStatic.INTEGER(11),
      },
      zoneid: {
        type: SequelizeStatic.INTEGER(11),
      },
      tnregionid:{
        type: SequelizeStatic.INTEGER(11), 
      },
      clientid: {
        type: SequelizeStatic.INTEGER(11),
      },
      cloudprovider: {
        type: SequelizeStatic.STRING(10),
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
      tableName: "tbl_deployments",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ClustersAttributes { }
export interface ClustersInstance extends Instance<ClustersAttributes> {
  dataValues: ClustersAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ClustersInstance, ClustersAttributes>(
    "Clusters",
    {
      clusterid: {
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
      region: {
        type: SequelizeStatic.STRING(10),
      },
      _accountid: {
        type: SequelizeStatic.INTEGER(11),
      },
      dcid: {
        type: SequelizeStatic.INTEGER(11),
      },
      clusterrefid: {
        type: SequelizeStatic.STRING(100),
      },
      clustername: {
        type: SequelizeStatic.STRING(100),
      },
      drsstate: {
        type: SequelizeStatic.STRING(15),
      },
      hastate: {
        type: SequelizeStatic.STRING(15),
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
      tableName: "tbl_vc_cluster",
    }
  );
};

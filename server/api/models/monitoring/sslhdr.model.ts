import * as _ from "lodash";
import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SSLAttributes { }
export interface SSLInstance extends Instance<SSLAttributes> {
  dataValues: SSLAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<SSLInstance, SSLAttributes>(
    "MonitoringSSLHdr",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: SequelizeStatic.INTEGER(11),
      name: SequelizeStatic.STRING(100),
      notes: SequelizeStatic.STRING(500),
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
      tableName: "tbl_monitoring_sslhdr",
    }
  );
};

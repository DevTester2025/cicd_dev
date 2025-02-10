import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface UpgradeRequestAttributes {}
export interface UpgradeRequestInstance
  extends Instance<UpgradeRequestAttributes> {
  dataValues: UpgradeRequestAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<UpgradeRequestInstance, UpgradeRequestAttributes>(
    "UpgradeRequest",
    {
      upgraderequestid: {
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
      resourcetype: {
        type: SequelizeStatic.STRING(30),
      },
      resourceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      requestday: {
        type: SequelizeStatic.STRING(20),
      },
      reqstarttime: {
        type: SequelizeStatic.STRING(10),
      },
      reqendtime: {
        type: SequelizeStatic.STRING(10),
      },
      resourcerefid: {
        type: SequelizeStatic.INTEGER(11),
      },
      currplantype: {
        type: SequelizeStatic.INTEGER(11),
      },
      upgradeplantype: {
        type: SequelizeStatic.INTEGER(11),
      },
      maintwindowid: {
        type: SequelizeStatic.INTEGER(11),
      },
      restartreq: {
        type: SequelizeStatic.STRING(1),
      },
      autoimplementation: {
        type: SequelizeStatic.STRING(1),
      },
      implstartdt: {
        type: SequelizeStatic.DATE,
      },
      implenddt: {
        type: SequelizeStatic.DATE,
      },
      reqstatus: {
        type: SequelizeStatic.STRING(20),
      },
      notes: {
        type: SequelizeStatic.STRING(500),
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
      tableName: "tbl_srm_upgraderequest",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface NotificationSetupAttributes {}
export interface NotificationSetupInstance
  extends Instance<NotificationSetupAttributes> {
  dataValues: NotificationSetupAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    NotificationSetupInstance,
    NotificationSetupAttributes
  >(
    "NotificationSetup",
    {
      ntfcsetupid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      templateid:{
        type: SequelizeStatic.INTEGER(11),
      },
      module: {
        type: SequelizeStatic.STRING(100),
        allowNull: false,
      },
      event: {
        type: SequelizeStatic.STRING(25),
        allowNull: false,
      },
      ntftype: {
        type: SequelizeStatic.STRING(25),
        allowNull: false,
      },
      template: {
        type: SequelizeStatic.TEXT,
      },
      receivers: {
        type: SequelizeStatic.TEXT,
      },
      notes: {
        type: SequelizeStatic.STRING(100),
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
      tableName: "tbl_tn_notificationsetup",
    }
  );
};

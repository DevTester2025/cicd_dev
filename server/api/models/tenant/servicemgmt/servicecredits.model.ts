import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ServiceCreditsAttributes {}
export interface ServiceCreditsInstance
  extends Instance<ServiceCreditsAttributes> {
  dataValues: ServiceCreditsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ServiceCreditsInstance, ServiceCreditsAttributes>(
    "ServiceCredits",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      slatemplateid: {
        type: SequelizeStatic.INTEGER(11),
      },
      utmin: {
        type: SequelizeStatic.FLOAT,
      },
      utmax: {
        type: SequelizeStatic.FLOAT,
      },
      servicecredit: {
        type: SequelizeStatic.FLOAT,
      },
      notes: {
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
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_tn_servicecredits",
    }
  );
};

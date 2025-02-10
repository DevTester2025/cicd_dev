import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface DatacenterAttributes { }
export interface DatacenterInstance extends Instance<DatacenterAttributes> {
  dataValues: DatacenterAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<DatacenterInstance, DatacenterAttributes>(
    "Datacenter",
    {
      dcid: {
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
      dcrefid: {
        type: SequelizeStatic.STRING(100),
      },
      dcname: {
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
      tableName: "tbl_vc_datacenter",
    }
  );
};

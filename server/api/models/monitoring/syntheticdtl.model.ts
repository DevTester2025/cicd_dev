import * as _ from "lodash";
import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SyntheticsDtlAttributes {}
export interface SyntheticsDtlInstance extends Instance<SyntheticsDtlAttributes> {
  dataValues: SyntheticsDtlAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<SyntheticsDtlInstance, SyntheticsDtlAttributes>(
    "MonitoringSyntheticsDtl",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: SequelizeStatic.INTEGER(11),
      syntheticid: SequelizeStatic.INTEGER(11),
      url: SequelizeStatic.STRING(200),
      instancerefid: SequelizeStatic.STRING(100),
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
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_monitoring_syntheticdtl",
    }
  );
};

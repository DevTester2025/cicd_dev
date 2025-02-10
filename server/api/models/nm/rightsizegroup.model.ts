import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import * as _ from "lodash";

export interface RightsizeGroupAttributes {}
export interface RightsizeGroupInstance
  extends Instance<RightsizeGroupAttributes> {
  dataValues: RightsizeGroupAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<RightsizeGroupInstance, RightsizeGroupAttributes>(
    "RightsizeGroup",
    {
      rightsizegrpid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      groupname: {
        type: SequelizeStatic.STRING(100),
      },
      maintwindowids: {
        type: SequelizeStatic.STRING(100),
        set: function (data: any) {
          if (data) {
            _.set(this, "dataValues.maintwindowids", JSON.stringify(data));
          }
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.maintwindowids");
          if (data) {
            return JSON.parse(data);
          }
        },
      },
      cpuutil: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      memoryutil: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      duration: {
        type: SequelizeStatic.DECIMAL(19, 4),
      },
      userids: {
        type: SequelizeStatic.STRING(100),
        set: function (data: any) {
          if (data) {
            _.set(this, "dataValues.userids", JSON.stringify(data));
          }
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.userids");
          if (data) {
            return JSON.parse(data);
          }
        },
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
      tableName: "tbl_nm_rightsizegroup",
    }
  );
};

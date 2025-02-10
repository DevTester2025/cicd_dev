import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import { constants } from "../../../common/constants";
import * as _ from "lodash";
let baseUrl = constants.FILEDWNLOADPATH;
export interface ScriptsAttributes {}
export interface ScriptsInstance extends Instance<ScriptsAttributes> {
  dataValues: ScriptsAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<ScriptsInstance, ScriptsAttributes>(
    "Scripts",
    {
      scriptid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      scriptname: {
        type: SequelizeStatic.STRING(50),
      },
      scripttype: {
        type: SequelizeStatic.STRING(20),
      },
      filename: {
        type: SequelizeStatic.STRING(50),
        // get: function () {
        //   let data;
        //   data = _.get(this, "dataValues.filename");
        //   if (data != null && data != undefined) {
        //     return baseUrl.SCRIPT_FILE + data;
        //   } else {
        //     return null;
        //   }
        // },
      },
      commandblock: {
        type: SequelizeStatic.TEXT,
      },
      notes: {
        type: SequelizeStatic.STRING(100),
      },
      authtype: {
        type: SequelizeStatic.STRING(20),
      },
      conntype: {
        type: SequelizeStatic.STRING(20),
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
      tableName: "tbl_bs_scripts",
    }
  );
};

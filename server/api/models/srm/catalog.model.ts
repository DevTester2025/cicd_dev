import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";
import _ = require("lodash");
import { constants } from "../../../common/constants";
let baseUrl = constants.FILEDWNLOADPATH;
export interface CatalogAttributes {}
export interface CatalogInstance extends Instance<CatalogAttributes> {
  dataValues: CatalogAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<CatalogInstance, CatalogAttributes>(
    "srmcatalog",
    {
      catalogid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      referenceid: {
        type: SequelizeStatic.STRING(100),
      },
      wrkflowid: {
        type: SequelizeStatic.INTEGER(11),
      },
      groupname: {
        type: SequelizeStatic.STRING(50),
      },
      catalogname: {
        type: SequelizeStatic.STRING(50),
      },
      referencetype: {
        type: SequelizeStatic.STRING(50),
      },
      catalogimage: {
        type: SequelizeStatic.STRING(50),
        get: function () {
          let data;
          data = _.get(this, "dataValues.catalogimage");
          if (data != null && data != undefined) {
            return baseUrl.SERVICE_IMG + data;
          } else {
            return null;
          }
        },
      },
      catalogola: {
        type: SequelizeStatic.STRING(50),
        get: function () {
          let data;
          data = _.get(this, "dataValues.catalogola");
          if (data != null && data != undefined) {
            return baseUrl.OLA_IMG + data;
          } else {
            return null;
          }
        },
      },
      startdate: {
        type: SequelizeStatic.DATE,
      },
      publishdate: {
        type: SequelizeStatic.DATE,
      },
      enddate: {
        type: SequelizeStatic.DATE,
      },
      archdiagram: {
        type: SequelizeStatic.STRING(50),
        get: function () {
          let data;
          data = _.get(this, "dataValues.archdiagram");
          if (data != null && data != undefined) {
            return baseUrl.ARCH_IMG + data;
          } else {
            return null;
          }
        },
      },
      ha: {
        type: SequelizeStatic.STRING(50),
      },
      description: {
        type: SequelizeStatic.STRING(1000),
      },
      estimatedcost: {
        type: SequelizeStatic.INTEGER(11),
      },
      setupcost: {
        type: SequelizeStatic.INTEGER(11),
      },
      runningcost: {
        type: SequelizeStatic.INTEGER(11),
      },
      othercost: {
        type: SequelizeStatic.INTEGER(11),
      },
      autodeployyn: {
        type: SequelizeStatic.STRING(1),
      },
      approvalyn: {
        type: SequelizeStatic.STRING(1),
      },
      noofapprovers: {
        type: SequelizeStatic.INTEGER(2),
      },
      notes: {
        type: SequelizeStatic.STRING(2000),
      },
      publishstatus: {
        type: SequelizeStatic.STRING(10),
      },
      plannedpublishdate: {
        type: SequelizeStatic.DATE,
      },
      plannedenddate: {
        type: SequelizeStatic.DATE,
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
      tableName: "tbl_srm_catalog",
    }
  );
};

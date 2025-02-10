import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface ReleaseHeaderAttributes { }
export interface ReleaseHeaderInstance
  extends SequelizeStatic.Instance<ReleaseHeaderAttributes> {
  dataValues: ReleaseHeaderAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  const ReleaseProcessHeader = sequelize.define<ReleaseHeaderInstance, ReleaseHeaderAttributes>(
    "ReleaseProcessHeader",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      templateid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },

      releaseconfigid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      referenceheaderid: {
        type: SequelizeStatic.INTEGER(11),
      },
      providerrunid: {
        type: SequelizeStatic.STRING(50),
      },
      workflowname: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      provider: {
        type: SequelizeStatic.STRING(45),
      },
      reponame: {
        type: SequelizeStatic.STRING(50),
      },
      branch: {
        type: SequelizeStatic.STRING(50),
      },
      commitid: {
        type: SequelizeStatic.STRING(50),
      },
      executionstarttime: {
        type: SequelizeStatic.DATE,
      },
      executionendtime: {
        type: SequelizeStatic.DATE,
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      status: {
        type: SequelizeStatic.STRING(25),
        defaultValue: "Pending",
      },
      createdby: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      createddt: {
        type: SequelizeStatic.DATE,
        allowNull: false,
      },
      lastupdatedby: {
        type: SequelizeStatic.STRING(50),
        allowNull: true,
      },
      lastupdateddt: {
        type: SequelizeStatic.DATE,
        allowNull: true,
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_cicd_release_process_hdr",
    }
  );

  ReleaseProcessHeader.afterCreate((instance) => {
    (global as any).io.emit('connectedHrd', instance)
  });

  ReleaseProcessHeader.addHook('afterBulkUpdate', (instance) => {
    (global as any).io.emit('addHookProcessHrd', instance)
  });

  return ReleaseProcessHeader;
};
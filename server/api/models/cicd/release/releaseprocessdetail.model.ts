import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface ReleaseAttributes { }
export interface ReleaseInstance
  extends SequelizeStatic.Instance<ReleaseAttributes> {
  dataValues: ReleaseAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  const ReleaseProcessDetail = sequelize.define<ReleaseInstance, ReleaseAttributes>(
    "ReleaseProcessDetail",
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
      releaseprocesshdrid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      providerjobid: {
        type: SequelizeStatic.STRING(50),
      },
      jobname: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      referencetype: {
        type: SequelizeStatic.STRING(50),
        allowNull: false,
      },
      referenceid: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      position: {
        type: SequelizeStatic.INTEGER(11),
        allowNull: false,
      },
      log: {
        type: SequelizeStatic.TEXT,
      },
      issuesid:{
        type: SequelizeStatic.INTEGER(11),
        allowNull: true,
      },
      description: {
        type: SequelizeStatic.STRING(500),
      },
      status: {
        type: SequelizeStatic.STRING(25),
        allowNull: false,
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
      tableName: "tbl_cicd_release_process_details",
    }
  );

  ReleaseProcessDetail.afterCreate((instance) => {
    (global as any).io.emit('connectedDtl', instance)
  });

  ReleaseProcessDetail.addHook('afterBulkCreate', (instance) => {
    (global as any).io.emit('addHookProcessDtl', instance)
    console.log('afterBulkUpadet', instance)
  });

  return ReleaseProcessDetail
};
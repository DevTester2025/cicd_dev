import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ECL2VolumeAttachmentAttributes {}
export interface ECL2VolumeAttachmentInstance
  extends Instance<ECL2VolumeAttachmentAttributes> {
  dataValues: ECL2VolumeAttachmentAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    ECL2VolumeAttachmentInstance,
    ECL2VolumeAttachmentAttributes
  >(
    "ecl2volumeattachment",
    {
      volumeattachmentid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      device: {
        type: SequelizeStatic.STRING(50),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      ecl2volumeattachmentid: {
        type: SequelizeStatic.STRING(50),
      },
      instanceid: {
        type: SequelizeStatic.INTEGER(11),
      },
      instancerefid: {
        type: SequelizeStatic.INTEGER(11),
      },
      volumeid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      notes: {
        type: SequelizeStatic.STRING(500),
      },
      tnregionid: {
        type: SequelizeStatic.INTEGER(11),
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
      tableName: "tbl_ecl2_volumeattachments",
    }
  );
};

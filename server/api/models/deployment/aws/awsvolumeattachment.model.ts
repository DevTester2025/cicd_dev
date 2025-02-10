import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSVolumeAttachmentAttributes {}
export interface AWSVolumeAttachmentInstance
  extends Instance<AWSVolumeAttachmentAttributes> {
  dataValues: AWSVolumeAttachmentAttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<
    AWSVolumeAttachmentInstance,
    AWSVolumeAttachmentAttributes
  >(
    "awsvolumeattachment",
    {
      volumeattachmentid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
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
      tableName: "tbl_aws_volumeattachments",
    }
  );
};

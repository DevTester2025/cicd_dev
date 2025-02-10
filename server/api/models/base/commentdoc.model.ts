import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface CommentDocAttributes {}
export interface CommentDocInstance
  extends SequelizeStatic.Instance<CommentDocAttributes> {
  dataValues: CommentDocAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<CommentDocInstance, CommentDocAttributes>(
    "CommentDoc",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      refid: {
        type: SequelizeStatic.INTEGER(11),
      },
      reftype: {
        type: SequelizeStatic.STRING(50),
      },
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      comments: SequelizeStatic.TEXT,
      docname: {
        type: SequelizeStatic.STRING(50),
      },
      docpath: {
        type: SequelizeStatic.STRING(50),
      },
      status: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Active",
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
      tableName: "tbl_bs_commentdocs",
    }
  );
};

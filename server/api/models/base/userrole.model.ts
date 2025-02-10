import * as SequelizeStatic from "sequelize";
import _ = require("lodash");

export interface UserRoleAttributes {}
export interface UserRoleInstance
  extends SequelizeStatic.Instance<UserRoleAttributes> {
  dataValues: UserRoleAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<UserRoleInstance, UserRoleAttributes>(
    "UserRoles",
    {
      roleid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      rolename: {
        type: SequelizeStatic.STRING(45),
      },
      permissions: {
        type: SequelizeStatic.STRING(1000),
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
      accessid: {
        type: SequelizeStatic.STRING(1000),
        set: function (data: any) {
          _.set(this, "dataValues.accessid", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.accessid");
          return data;
        },
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_bs_role",
    }
  );
};

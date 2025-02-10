import * as SequelizeStatic from "sequelize";
import * as _ from "lodash";
export interface RoleAccessAttributes {}
export interface RoleAccessInstance
  extends SequelizeStatic.Instance<RoleAccessAttributes> {
  dataValues: RoleAccessAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<RoleAccessInstance, RoleAccessAttributes>(
    "RoleAccess",
    {
      accessid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      roleid: {
        type: SequelizeStatic.INTEGER(11),
      },
      screenid: {
        type: SequelizeStatic.INTEGER(11),
      },
      screencode: {
        type: SequelizeStatic.STRING(10),
      },
      actions: {
        type: SequelizeStatic.STRING(500),
        set: function (data: any) {
          _.set(this, "dataValues.actions", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.actions");
          return JSON.parse(data);
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
      tableName: "tbl_bs_roleaccess",
    }
  );
};

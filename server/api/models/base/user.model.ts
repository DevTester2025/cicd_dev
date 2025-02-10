import * as SequelizeStatic from "sequelize";

export interface UserAttributes {}
export interface UserInstance extends SequelizeStatic.Instance<UserAttributes> {
  dataValues: UserAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<UserInstance, UserAttributes>(
    "User",
    {
      userid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      customerid: SequelizeStatic.INTEGER(11),
      password: {
        type: SequelizeStatic.STRING(100),
      },
      fullname: {
        type: SequelizeStatic.STRING(45),
      },
      email: {
        type: SequelizeStatic.STRING(45),
      },
      phone: {
        type: SequelizeStatic.STRING(15),
      },
      secondaryphoneno: {
        type: SequelizeStatic.STRING(15),
      },
      department: {
        type: SequelizeStatic.STRING(17),
      },
      isapproveryn: {
        type: SequelizeStatic.STRING(1),
      },
      lastlogin: {
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
      roleid: {
        type: SequelizeStatic.INTEGER(11),
      },
      totpsecret: {
        type: SequelizeStatic.STRING(100),
      },
      twofactorauthyn: {
        type: SequelizeStatic.STRING(1),
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_bs_user",
    }
  );
};

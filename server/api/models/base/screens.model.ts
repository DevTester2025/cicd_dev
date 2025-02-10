import * as SequelizeStatic from "sequelize";

export interface ScreensAttributes {}
export interface ScreensInstance
  extends SequelizeStatic.Instance<ScreensAttributes> {
  dataValues: ScreensAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<ScreensInstance, ScreensAttributes>(
    "Screens",
    {
      screenid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      screencode: {
        type: SequelizeStatic.STRING(10),
      },
      screenname: {
        type: SequelizeStatic.STRING(50),
      },
      group: {
        type: SequelizeStatic.STRING(100),
      },
      screenurl: {
        type: SequelizeStatic.STRING(100),
      },
      screenicon: {
        type: SequelizeStatic.STRING(50),
      },
      displayorder: {
        type: SequelizeStatic.INTEGER(11),
      },
      events:{
        type: SequelizeStatic.STRING(50),
      },
      status: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Active",
        allowNull: false,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_bs_screens",
    }
  );
};

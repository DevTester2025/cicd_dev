import * as SequelizeStatic from "sequelize";

export interface ScreenActionsAttributes {}
export interface ScreenActionsInstance
  extends SequelizeStatic.Instance<ScreenActionsAttributes> {
  dataValues: ScreenActionsAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<ScreenActionsInstance, ScreenActionsAttributes>(
    "ScreenActions",
    {
      actionid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      screenid: {
        type: SequelizeStatic.INTEGER(11),
      },
      actions: {
        type: SequelizeStatic.STRING(10),
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
      tableName: "tbl_bs_screensactions",
    }
  );
};

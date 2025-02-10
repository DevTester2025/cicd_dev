import * as SequelizeStatic from "sequelize";
import * as _ from "lodash";

export interface EventLogAttributes {}
export interface EventLogInstance
  extends SequelizeStatic.Instance<EventLogAttributes> {
  dataValues: EventLogAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<EventLogInstance, EventLogAttributes>(
    "eventlog",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      _tenant: {
        type: SequelizeStatic.INTEGER(11),
      },
      _user: {
        type: SequelizeStatic.INTEGER(11),
      },
      module: {
        type: SequelizeStatic.STRING(50),
      },
      _reference: {
        type: SequelizeStatic.TEXT,
      },
      referencetype: {
        type: SequelizeStatic.STRING(50),
      },
      level: SequelizeStatic.STRING(50),
      operation: SequelizeStatic.STRING(50),
      notes: SequelizeStatic.TEXT,
      status: {
        type: SequelizeStatic.STRING(15),
      },
      meta: {
        type: SequelizeStatic.TEXT,
      },
      createddt: {
        type: SequelizeStatic.DATE,
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_bs_logs",
    }
  );
};

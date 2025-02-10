import * as SequelizeStatic from "sequelize";

export interface WrkRelationsAttributes {}
export interface WrkRelationsInstance extends SequelizeStatic.Instance<WrkRelationsAttributes> {
  dataValues: WrkRelationsAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<WrkRelationsInstance, WrkRelationsAttributes>(
    "WorkflowRelations",
    {
      relationid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      ref_key: {
        type: SequelizeStatic.STRING(100),
        allowNull: false,
      },
      parentref_key: {
        type: SequelizeStatic.STRING(100),
      },
      relation_name: {
        type: SequelizeStatic.STRING(100),
      },
      positionno: {
        type: SequelizeStatic.INTEGER(11),
      },
      notes: {
        type: SequelizeStatic.TEXT,
      },
      mode_function: {
        type: SequelizeStatic.STRING(100),
      },
      module: {
        type: SequelizeStatic.STRING(100),
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      status: {
        type: SequelizeStatic.STRING(10),
        defaultValue: "Active",
      },
      createdby: {
        type: SequelizeStatic.STRING(50)
      },
      createddt: {
        type: SequelizeStatic.DATE,
      },
      lastupdatedby: {
        type: SequelizeStatic.STRING(50),
      },
      lastupdateddt: {
        type: SequelizeStatic.DATE,
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_tn_wrkflow_relations",
    }
  );
};

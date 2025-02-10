import * as SequelizeStatic from "sequelize";

export interface ReferenceModelTblAttributes {}
export interface ReferenceModelTblInstance
  extends SequelizeStatic.Instance<ReferenceModelTblAttributes> {
  dataValues: ReferenceModelTblAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<ReferenceModelTblInstance, ReferenceModelTblAttributes>(
    "ReferenceModelTbl",
    {
      ref_id: {
        type: SequelizeStatic.INTEGER(20),
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: SequelizeStatic.STRING(2000),
      },
      parent_id: {
        type: SequelizeStatic.INTEGER(20)
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(20)
      },
      keyname: {
        type: SequelizeStatic.STRING(100),
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
      updatedby: {
        type: SequelizeStatic.STRING(50),
      },
      updateddt: {
        type: SequelizeStatic.DATE,
      }
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_ref_model",
    }
  );
};

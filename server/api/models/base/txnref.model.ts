import * as SequelizeStatic from "sequelize";

export interface TxnAttributes {}
export interface TxnInstance extends SequelizeStatic.Instance<TxnAttributes> {
  dataValues: TxnAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<TxnInstance, TxnAttributes>(
    "TxnRef",
    {
      id: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      txnid: {
        type: SequelizeStatic.INTEGER(11),
      },
      refid: SequelizeStatic.INTEGER(11),
      txn: {
        type: SequelizeStatic.STRING(100),
      },
      reference: {
        type: SequelizeStatic.STRING(100),
      },
      refkey: {
        type: SequelizeStatic.STRING(100),
      },
      notes: {
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
      lastupdatedby: {
        type: SequelizeStatic.STRING(50),
      },
      lastupdateddt: {
        type: SequelizeStatic.DATE,
      },
      module:{
        type: SequelizeStatic.STRING(50),
      },
    },
    {
      timestamps: false,
      freezeTableName: true,
      tableName: "tbl_txn_ref",
    }
  );
};

import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface AssetsQueryAttributes { }
export interface AssetsQueryInstance
    extends SequelizeStatic.Instance<AssetsQueryAttributes> {
    dataValues: AssetsQueryAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
    return sequelize.define<AssetsQueryInstance, AssetsQueryAttributes>(
        "Assets-Query",
        {
            id: {
                type: SequelizeStatic.INTEGER(11),
                primaryKey: true,
                autoIncrement: true,
            },
            tenantid: {
                type: SequelizeStatic.INTEGER(11),
            },
            title: {
                type: SequelizeStatic.STRING(200),
            },
            query: {
                type: SequelizeStatic.TEXT,
            },
            meta: {
                type: SequelizeStatic.TEXT,
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
            }
        },
        {
            timestamps: false,
            freezeTableName: true,
            tableName: "tbl_assets_query",
        }
    );
};

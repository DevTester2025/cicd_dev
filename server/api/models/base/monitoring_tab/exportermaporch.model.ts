import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface ExptrMapOrchAttributes { }
export interface ExptrMapOrchInstance
    extends SequelizeStatic.Instance<ExptrMapOrchAttributes> {
    dataValues: ExptrMapOrchAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
    return sequelize.define<ExptrMapOrchInstance, ExptrMapOrchAttributes>(
        "Exporter-Map-Orch",
        {
            exprtorchid: {
                type: SequelizeStatic.INTEGER(11),
                primaryKey: true,
                autoIncrement: true,
            },
            exprtrname: {
                type: SequelizeStatic.STRING(30),
            },
            cloudprovider: {
                type: SequelizeStatic.STRING(30),
            },
            exptrtype: {
                type: SequelizeStatic.STRING(30),
            },
            exptrport: {
                type: SequelizeStatic.STRING(10),
            },
            exprturl: {
                type: SequelizeStatic.TEXT
            },
            tenantid: {
                type: SequelizeStatic.INTEGER(11),
            },
            instlorchid: {
                type: SequelizeStatic.INTEGER(11),
            },
            rmvorchid: {
                type: SequelizeStatic.INTEGER(11),
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
            tableName: "tbl_tn_exptr_orch_mapping",
        }
    );
};

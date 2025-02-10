import _ = require("lodash");
import * as SequelizeStatic from "sequelize";

export interface ExptrMapAttributes { }
export interface ExptrMapInstance
    extends SequelizeStatic.Instance<ExptrMapAttributes> {
    dataValues: ExptrMapAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
    return sequelize.define<ExptrMapInstance, ExptrMapAttributes>(
        "Exporter-Mapping",
        {
            exptrid: {
                type: SequelizeStatic.INTEGER(11),
                primaryKey: true,
                autoIncrement: true,
            },
            exprtorchid: {
                type: SequelizeStatic.INTEGER(11),
            },
            tenantid: {
                type: SequelizeStatic.INTEGER(11),
            },
            instancerefid: {
                type: SequelizeStatic.STRING(100),
            },
            exptrstatus: {
                type: SequelizeStatic.STRING(30),
            },
            metadata: {
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
        },
        {
            timestamps: false,
            freezeTableName: true,
            tableName: "tbl_tn_exptr_mapping",
        }
    );
};

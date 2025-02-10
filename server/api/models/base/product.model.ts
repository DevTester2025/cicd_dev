import * as _ from "lodash";
import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ProductAttributes { }
export interface ProductInstance extends Instance<ProductAttributes> {
    dataValues: ProductAttributes;
}
export default (sequelize: Sequelize) => {
    return sequelize.define<ProductInstance, ProductAttributes>(
        "Product",
        {
            productid: {
                type: SequelizeStatic.INTEGER(11),
                primaryKey: true,
                autoIncrement: true,
            },
            productname: {
                type: SequelizeStatic.STRING(1000),
                allowNull: false,
            },
            productcode: {
                type: SequelizeStatic.STRING(255),
            },
            customerid: SequelizeStatic.INTEGER(11),
            servertype: {
                type: SequelizeStatic.STRING(255),
            },
            tenantid: SequelizeStatic.INTEGER(11),
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
            tableName: "tbl_tn_products",
        }
    );
};

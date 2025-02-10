import * as _ from "lodash";
import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface ResouceMappingAttributes { }
export interface ResouceMappingInstance extends Instance<ResouceMappingAttributes> {
    dataValues: ResouceMappingAttributes;
}
export default (sequelize: Sequelize) => {
    return sequelize.define<ResouceMappingInstance, ResouceMappingAttributes>(
        "ResouceMapping",
        {
            id: {
                type: Sequelize.INTEGER(11),
                primaryKey: true,
                autoIncrement: true,
            },
            tenantid: {
                type: Sequelize.INTEGER(11),
            },
            referencetype: {
                type: Sequelize.STRING(50),
            },
            referenceid: {
                type: Sequelize.INTEGER(11),
            },
            resource_type: {
                type: Sequelize.STRING(15),
            },
            crn: {
                type: Sequelize.STRING(100),
            },
            fieldname: {
                type: Sequelize.STRING(100),
            },
            status: {
                type: Sequelize.STRING(10),
                defaultValue: "Active",
                allowNull: false,
            },
            createdby: {
                type: Sequelize.STRING(50),
            },
            createddt: {
                type: Sequelize.DATE,
            },
            lastupdatedby: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            lastupdateddt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        },
        {
            timestamps: false,
            freezeTableName: true,
            tableName: "tbl_bs_resource_mapping",
        }
    );
};

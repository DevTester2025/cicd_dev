import * as _ from "lodash";
import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface SSLDtlAttributes { }
export interface SSLDtlInstance extends Instance<SSLDtlAttributes> {
    dataValues: SSLDtlAttributes;
}
export default (sequelize: Sequelize) => {
    return sequelize.define<SSLDtlInstance, SSLDtlAttributes>(
        "MonitoringSSLDtl",
        {
            id: {
                type: SequelizeStatic.INTEGER(11),
                primaryKey: true,
                autoIncrement: true,
            },
            tenantid: SequelizeStatic.INTEGER(11),
            sslhdrid: SequelizeStatic.INTEGER(11),
            url: SequelizeStatic.STRING(200),
            validity_from: {
                type: SequelizeStatic.DATE()
            },
            validity_end: {
                type: SequelizeStatic.DATE()
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
            instancerefid: {
                type: SequelizeStatic.STRING(100),
            }
        },
        {
            timestamps: false,
            freezeTableName: true,
            tableName: "tbl_monitoring_ssldtl",
        }
    );
};

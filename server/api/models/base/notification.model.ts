import * as SequelizeStatic from "sequelize";
import * as _ from "lodash";

export interface NotificationAttributes { }
export interface NotificationInstance
  extends SequelizeStatic.Instance<NotificationAttributes> {
  dataValues: NotificationAttributes;
}
export default (sequelize: SequelizeStatic.Sequelize) => {
  return sequelize.define<NotificationInstance, NotificationAttributes>(
    "notifications",
    {
      notificationid: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      tenantid: {
        type: SequelizeStatic.INTEGER(11),
      },
      solutionid: {
        type: SequelizeStatic.INTEGER(11),
      },
      userid: {
        type: SequelizeStatic.INTEGER(11),
      },
      txnid: {
        type: SequelizeStatic.INTEGER(11),
      },
      txntype: SequelizeStatic.STRING(50),
      referenceid: {
        type: SequelizeStatic.STRING(100),
      },
      referenceno: {
        type: SequelizeStatic.STRING(100),
      },
      txnstatus: SequelizeStatic.STRING(10),
      customerid: {
        type: SequelizeStatic.INTEGER(11),
      },
      content: {
        type: SequelizeStatic.TEXT,
      },
      contenttype: SequelizeStatic.STRING(100),
      title: SequelizeStatic.STRING(100),
      deliverystatus: SequelizeStatic.STRING(100), // SENT, PENDING, READ
      ntfstartdate: SequelizeStatic.DATE,
      ntfenddate: SequelizeStatic.DATE,
      implementationdt: SequelizeStatic.DATE,
      eventtype: {
        type: SequelizeStatic.STRING(1000),
        set: function (data: any) {
          _.set(this, "dataValues.eventtype", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.eventtype");
          if (!_.isUndefined(data) && !_.isNull(data) && data.includes("[")) {
            return JSON.parse(data);
          } else {
            return data;
          }
        },
      },
      modeofnotification: {
        type: SequelizeStatic.STRING(1000),
        set: function (data: any) {
          _.set(this, "dataValues.modeofnotification", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.modeofnotification");
          if (!_.isUndefined(data) && !_.isNull(data)) {
            return JSON.parse(data);
          } else {
            return data;
          }
        },
      },
      configuration: {
        type: SequelizeStatic.STRING(1000),
        set: function (data: any) {
          _.set(this, "dataValues.configuration", JSON.stringify(data));
        },
        get: function () {
          let data;
          data = _.get(this, "dataValues.configuration");
          if (!_.isUndefined(data) && !_.isNull(data)) {
            return JSON.parse(data);
          } else {
            return data;
          }
        },
      },
      notes: {
        type: SequelizeStatic.STRING(100),
      },
      interval: {
        type: SequelizeStatic.INTEGER(11),
      },
      bgcolor: {
        type: SequelizeStatic.STRING(50),
      },
      textcolor: {
        type: SequelizeStatic.STRING(50),
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
      tableName: "tbl_tn_notifications",
    }
  );
};

import * as SequelizeStatic from "sequelize";
import { Sequelize, Instance } from "sequelize";

export interface AWSCostVisualttributes {}
export interface AWSCostVisualInstance
  extends Instance<AWSCostVisualttributes> {
  dataValues: AWSCostVisualttributes;
}
export default (sequelize: Sequelize) => {
  return sequelize.define<AWSCostVisualInstance, AWSCostVisualttributes>(
    "awscostvisual",
    {
      ID: {
        type: SequelizeStatic.INTEGER(11),
        primaryKey: true,
        autoIncrement: true,
      },
      Rate_Code: {
        type: SequelizeStatic.STRING(255),
      },
      Term_Type: {
        type: SequelizeStatic.STRING(255),
      },
      Price_Description: {
        type: SequelizeStatic.STRING(255),
      },
      Effective_Date: {
        type: SequelizeStatic.STRING(255),
      },
      Unit: {
        type: SequelizeStatic.STRING(55),
      },
      PricePer_Unit: {
        type: SequelizeStatic.DECIMAL,
      },
      Currency: {
        type: SequelizeStatic.STRING(55),
      },
      LeaseContract_length: {
        type: SequelizeStatic.STRING(255),
      },
      Purchase_Option: {
        type: SequelizeStatic.STRING(255),
      },
      Offering_Class: {
        type: SequelizeStatic.STRING(255),
      },
      Product_Family: {
        type: SequelizeStatic.STRING(255),
      },
      Location: {
        type: SequelizeStatic.STRING(255),
      },
      Instance_Type: {
        type: SequelizeStatic.STRING(255),
      },
      Current_Generation: {
        type: SequelizeStatic.STRING(255),
      },
      Instance_Family: {
        type: SequelizeStatic.STRING(255),
      },
      vCPU: {
        type: SequelizeStatic.INTEGER(11),
      },
      Physical_Processor: {
        type: SequelizeStatic.STRING(255),
      },
      Clock_Speed: {
        type: SequelizeStatic.STRING(255),
      },
      Memory: {
        type: SequelizeStatic.STRING(255),
      },
      Storage: {
        type: SequelizeStatic.STRING(255),
      },
      Network_Performance: {
        type: SequelizeStatic.STRING(255),
      },
      Processor_Architecture: {
        type: SequelizeStatic.STRING(255),
      },
      Storage_Media: {
        type: SequelizeStatic.STRING(255),
      },
      Volume_Type: {
        type: SequelizeStatic.STRING(255),
      },
      Max_throughputvolume: {
        type: SequelizeStatic.STRING(255),
      },
      Tenancy: {
        type: SequelizeStatic.STRING(255),
      },
      EBS_Optimized: {
        type: SequelizeStatic.STRING(255),
      },
      OperatingSystem: {
        type: SequelizeStatic.STRING(255),
      },
      License_Model: {
        type: SequelizeStatic.STRING(255),
      },
      Transfer_Type: {
        type: SequelizeStatic.STRING(255),
      },
      From_Location: {
        type: SequelizeStatic.STRING(255),
      },
      usageType: {
        type: SequelizeStatic.STRING(255),
      },
      operation: {
        type: SequelizeStatic.STRING(255),
      },
      Dedicated_EBS_Throughput: {
        type: SequelizeStatic.STRING(255),
      },
      ECU: {
        type: SequelizeStatic.STRING(255),
      },
      Physical_Cores: {
        type: SequelizeStatic.STRING(255),
      },
      Pre_Installed_SW: {
        type: SequelizeStatic.STRING(255),
      },
      Processor_Features: {
        type: SequelizeStatic.STRING(255),
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
      tableName: "tbl_aws_costvisual",
    }
  );
};

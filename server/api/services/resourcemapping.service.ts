import * as _ from "lodash";
import { constants } from "../../common/constants";
import CommonService from "../services/common.service";
import db from "../models/model";
import { Op } from "sequelize";
export class ResouceMappingService {
  async create(req, data) {
    try {
      let bulkData = [];

      if (req.outgoingResources && req.outgoingResources.length > 0) {
        const outgoingMappings = req.outgoingResources.map((resource) => ({
          tenantid: req.tenantid,
          referenceid: data.id,
          referencetype: req.referencetype,
          crn: resource.outgoingResourcetype,
          fieldname: JSON.stringify(resource.outgoingattributes),
          resource_type: constants.CICD_RESOUCE_TYPE[1],
          status: constants.STATUS_ACTIVE,
          createdby: req.createdby,
          createddt: new Date(),
          lastupdatedby: req.createdby,
          lastupdateddt: new Date(),
        }));

        bulkData.push(...outgoingMappings);
      }
      if (req.attributes && req.attributes.length > 0) {
        bulkData.push({
          tenantid: req.tenantid,
          referenceid: data.id,
          referencetype: req.referencetype,
          crn: req.crn,
          fieldname: JSON.stringify(req.attributes),
          resource_type: constants.CICD_RESOUCE_TYPE[0],
          status: constants.STATUS_ACTIVE,
          createdby: req.createdby,
          createddt: new Date(),
          lastupdatedby: req.createdby,
          lastupdateddt: new Date(),
        });
      }

      if (bulkData.length > 0) {
        await CommonService.bulkCreate(bulkData, db.ResourceMapping);
      }
    } catch (error) {
      console.error("Failed", error);
    }
  }

  async update(req, id) {
    try {
      const currentOutgoingCRNs =
        req.outgoingResources && Array.isArray(req.outgoingResources)
          ? req.outgoingResources.map(
              (resource) => resource.outgoingResourcetype
            )
          : [];

      // Check if there are any outgoing resources
      if (currentOutgoingCRNs.length > 0) {
        // Find and delete old records that are not in the incoming data
        await db.ResourceMapping.update(
          {
            status: constants.DELETE_STATUS,
            lastupdatedby: req.lastupdatedby,
            lastupdateddt: new Date(),
          },
          {
            where: {
              referenceid: id,
              resource_type: constants.CICD_RESOUCE_TYPE[1],
              referencetype: req.referencetype,
              crn: { [Op.notIn]: currentOutgoingCRNs },
            },
          }
        );
      } else {
        // If there are no current outgoing resources, delete all existing records
        await db.ResourceMapping.update(
          {
            status: constants.DELETE_STATUS,
            lastupdatedby: req.lastupdatedby,
            lastupdateddt: new Date(),
          },
          {
            where: {
              referenceid: id,
              referencetype: req.referencetype,
              resource_type: constants.CICD_RESOUCE_TYPE[1],
            },
          }
        );
      }

      if (req.outgoingResources && Array.isArray(req.outgoingResources)) {
        for (const resource of req.outgoingResources) {
          const outgoingMapping = {
            tenantid: req.tenantid,
            referenceid: id,
            referencetype: req.referencetype,
            crn: resource.outgoingResourcetype,
            fieldname: JSON.stringify(resource.outgoingattributes),
            resource_type: constants.CICD_RESOUCE_TYPE[1],
            status: constants.STATUS_ACTIVE,
            createdby: req.lastupdatedby,
            createddt: new Date(),
            lastupdatedby: req.lastupdatedby,
            lastupdateddt: new Date(),
          };

          // Check if the outgoing resource already exists
          const existingRecord = await db.ResourceMapping.findOne({
            where: {
              referenceid: outgoingMapping.referenceid,
              crn: outgoingMapping.crn,
              resource_type: constants.CICD_RESOUCE_TYPE[1],
              referencetype: req.referencetype,
            },
          });

          if (existingRecord) {
            // Update the existing record
            await db.ResourceMapping.update(outgoingMapping, {
              where: {
                referenceid: outgoingMapping.referenceid,
                crn: outgoingMapping.crn,
                resource_type: constants.CICD_RESOUCE_TYPE[1],
                referencetype: req.referencetype,
              },
            });
          } else {
            // Insert new record if it doesn't exist
            await db.ResourceMapping.create(outgoingMapping);
          }
        }
      }

      // Handle incoming resources
      if (req.attributes && req.attributes.length > 0) {
        const incomingMapping = {
          tenantid: req.tenantid,
          referenceid: id,
          referencetype: req.referencetype,
          crn: req.crn,
          fieldname: JSON.stringify(req.attributes),
          resource_type: constants.CICD_RESOUCE_TYPE[0],
          status: constants.STATUS_ACTIVE,
          createdby: req.lastupdatedby,
          createddt: new Date(),
          lastupdatedby: req.lastupdatedby,
          lastupdateddt: new Date(),
        };

        const existingIncoming = await db.ResourceMapping.findOne({
          where: {
            referenceid: incomingMapping.referenceid,
            resource_type: constants.CICD_RESOUCE_TYPE[0],
            referencetype: req.referencetype,
          },
        });

        if (existingIncoming) {
          await db.ResourceMapping.update(incomingMapping, {
            where: {
              referenceid: incomingMapping.referenceid,
              resource_type: constants.CICD_RESOUCE_TYPE[0],
              referencetype: req.referencetype,
            },
          });
        } else {
          await db.ResourceMapping.create(incomingMapping);
        }
      } else {
        // If there are no current incoming resources, delete all existing records
        await db.ResourceMapping.update(
          {
            status: constants.DELETE_STATUS,
            lastupdatedby: req.lastupdatedby,
            lastupdateddt: new Date(),
          },
          {
            where: {
              referenceid: id,
              resource_type: constants.CICD_RESOUCE_TYPE[0],
              referencetype: req.referencetype,
            },
          }
        );
      }
    } catch (error) {
      console.error("Failed to update or insert", error);
      throw error;
    }
  }
}
export default new ResouceMappingService();
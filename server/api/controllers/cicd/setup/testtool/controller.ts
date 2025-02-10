import { customValidation } from "../../../../../common/validation/customValidation";
import { Request, Response } from "express";
import _ = require("lodash");
import { messages } from "../../../../../common/messages";
import { modules } from "../../../../../common/module";
import { basicValidation } from "../../cicdcommon/validation";
import { constants } from "../../../../../common/constants";
import db from "../../../../models/model";
import commonService from "../../../../services/common.service";
import { Op } from "sequelize";
import ResouceMappingService from "../../../../services/resourcemapping.service";
export class Controller {
  //List
  async all(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_TESTING_TOOL };
    try {
      customValidation.isMandatoryLong(req.query.tenantid, "tenantid", 1, 11);
      let parameters: any = {
        where: { tenantid: req.query.tenantid },
        order: [["lastupdateddt", "DESC"]],
      };
      if (req.query.order && typeof req.query.order === "string") {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      }
      if (req.query.status) {
        parameters.where["status"] = req.query.status;
      }
      if (req.query.organization) {
        parameters.where["organization"] = req.query.organization;
      }
      if (req.query.name) {
        parameters.where["name"] = req.query.name;
      }
      if (typeof req.query.searchText === "string" && req.query.searchText.trim() !== "") {
        const searchText = req.query.searchText.trim();
        const searchCondition = {
          [Op.or]: [
            { name: { [Op.like]: `%${searchText}%` } },
            { url: { [Op.like]: `%${searchText}%` } },
            { organization: { [Op.like]: `%${searchText}%` } },
          ],
        };
        parameters.where = { ...parameters.where, ...searchCondition };
      }
      commonService
        .getAllList(parameters, db.TestingTool)
        .then((list) => {
          // Group
          const groupedByType = list.reduce((acc, currentItem) => {
            const type = currentItem.type;
            if (!acc[type]) {
              acc[type] = [];
            }
            acc[type].push(currentItem);
            return acc;
          }, {});

          customValidation.generateSuccessResponse(
            groupedByType,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  //create
  async create(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_TESTING_TOOL };
    try {
      if(req.body.crn && req.body.crn != null && req.body.attributes == null){
        res.json({
          status: false,
          code: 204,
          message: messages.CICD_INCOMING_ATTRIBUTE,
        });
        return;
      }
      customValidation.isMandatoryLong(req.body.tenantid, "tenantid", 1, 11);
      customValidation.isMandatoryString(req.body.type, "type", 5, 45);
      customValidation.isMandatoryString(req.body.name, "name", 3, 45);
      customValidation.isMandatoryString(req.body.organization, "organization", 3, 50);
      customValidation.isMandatoryString(req.body.createdby, "createdby", 3, 50);
      await new Controller().variableMapping(req, res, response);
      const testingtool = [
        constants.TESTING_TOOL_SONARQUBE,
        constants.TESTING_TOOL_SELENIUM,
        constants.TESTING_TOOL_JUNIT,
        constants.TESTING_TOOL_JMETER,
      ];
      if (!testingtool.includes(req.body.type)) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_PROVIDER[0],
        });
        return;
      }
      const existingTestingTool = await db.TestingTool.findOne({
        where: {
            tenantid: req.body.tenantid,
            name: req.body.name.trim(),
            status: constants.STATUS_ACTIVE.trim(),
            type: req.body.type
        },
    });
    if (existingTestingTool) {
        res.json({
            status: false,
            code: 204,
            message: messages.SETUP_TESTING_TOOLS[0],
          });
        return;
    }
      req.body.status = constants.STATUS_ACTIVE;
      req.body.createddt = Date.now();
      req.body.lastupdateddt = Date.now();
      commonService
        .create(req.body, db.TestingTool)
        .then(async (data) => {
          try {
            await commonService.create(
              {
                resourcetypeid: data.id,
                resourcetype: constants.RESOURCETYPE[11],
                _tenantid: req.body.tenantid,
                new: constants.HISTORYCOMMENTS[22],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: req.body.createdby,
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          } catch (error) {
            console.log(`Failed to create history`, error);
          }

          try {
            ResouceMappingService.create(req.body, data);
         } catch(error) {
           console.log("Error in maping", error)
         }
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  async variableMapping(req: Request, res: Response, response) {
    try {
      if (req.body.accesstokenisvariable) {
        await this.validateAccesstoken(req)
      }
      else {
        req.body.accesstokenisvariable = 0;
        customValidation.isMandatoryString(req.body.accesstoken, "accesstoken", 3, 45);
        if (req.body.accesstokenvariable) {
          customValidation.errorResponse("accesstokenvariable ", messages.VARIABLE_MAPPING[1]);
        }
      }
      if (req.body.urlisvariable) {
        await this.validateUrl(req)
      }
      else {
        req.body.urlisvariable = 0;
        customValidation.isMandatoryString(req.body.url, "URL", 10, 500);
        basicValidation.isMandatoryURL(req.body.url, "URL", 10, 500);
        if (req.body.urlvariable) {
          customValidation.errorResponse("urlvariable ", messages.VARIABLE_MAPPING[1]);
        }
      }
    } catch (error) {
      console.log(error)
      throw error;
    }
  }
  async validateAccesstoken(req: Request) {
    if (typeof (req.body.accesstokenisvariable) == constants.BOOLEAN) {
      req.body.accesstokenisvariable = 1;
      customValidation.isMandatoryString(req.body.accesstokenvariable, "accesstokenvariable", 3, 45);
      if (req.body.accesstoken) {
        customValidation.errorResponse("accesstoken ", messages.VARIABLE_MAPPING[1]);
      }
      return req
    } else {
      customValidation.errorResponse("accesstokenisvariable ", messages.VARIABLE_MAPPING[0]);
    }
  }
  async validateUrl(req: Request) {
    if (typeof (req.body.urlisvariable) == constants.BOOLEAN) {
      req.body.urlisvariable = 1;
      customValidation.isMandatoryString(req.body.urlvariable, "urlvariable", 3, 45);
      if (req.body.url) {
        customValidation.errorResponse("url ", messages.VARIABLE_MAPPING[1]);
      }
      return req
    } else {
      customValidation.errorResponse("urlisvariable ", messages.VARIABLE_MAPPING[0]);
    }
  }

  //get by id
  byId(req: Request, res: Response): void {
    let response = { reference: modules.SETUP_TESTING_TOOL };
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      db.TestingTool.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: db.ResourceMapping,
            as: 'testsCMDB',
            required: false, 
            where: { referenceid: req.params.id, status: constants.STATUS_ACTIVE, referencetype: constants.CICD_REFERENCE[4] },
          },
        ],
      })
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  //update
  async update(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_TESTING_TOOL };
    try {
      if(req.body.crn && req.body.crn != null && req.body.attributes == null){
        res.json({
          status: false,
          code: 204,
          message: messages.CICD_INCOMING_ATTRIBUTE,
        });
        return;
      }
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryLong(req.body.tenantid, "tenantid", 1, 11);
      customValidation.isMandatoryString(req.body.type, "type", 5, 45);
      customValidation.isMandatoryString(req.body.name, "name", 3, 45);
      customValidation.isMandatoryString(req.body.organization, "organization", 3, 50);
      customValidation.isMandatoryString(req.body.lastupdatedby, "lastupdatedby", 3, 50);
      await new Controller().variableMapping(req, res, response);
      const testingtool = [
        constants.TESTING_TOOL_SONARQUBE,
        constants.TESTING_TOOL_SELENIUM,
        constants.TESTING_TOOL_JUNIT,
        constants.TESTING_TOOL_JMETER,
      ];
      if (!testingtool.includes(req.body.type)) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_PROVIDER[0],
        });
        return;
      }
      const checkTestingTool = await db.TestingTool.findOne({
        where: {
          id: req.params.id,
        },
      });
      const existingTestingTool = JSON.parse(JSON.stringify(checkTestingTool));
      if (!existingTestingTool) {
        res.json({
          status: false,
          code: 201,
          message: messages.SETUP_TESTING_TOOLS[2],
        });
        return;
      }
      const existingName = await db.TestingTool.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
          tenantid: req.body.tenantid,
          name: req.body.name.trim(),
          status: constants.STATUS_ACTIVE.trim(),
          type: req.body.type,
        },
      });
      if (existingName) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_TESTING_TOOLS[0],
        });
        return;
      }
      req.body.lastupdateddt = Date.now();
      let condition = { id: req.params.id };
      commonService
        .update(condition, req.body, db.TestingTool)
        .then(async (data) => {
          try {
            const changes = {
              old: {},
              new: {},
            };

            Object.keys(existingTestingTool).forEach((key) => {
              const oldValue = existingTestingTool[key];
              const newValue = req.body[key];

              if (
                key !== "accesstokenisvariable" &&
                key !== "urlisvariable" &&
                key !== "lastupdateddt" &&
                oldValue !== newValue &&
                oldValue !== undefined &&
                newValue !== undefined
              ) {
                changes.old[key] = oldValue;
                changes.new[key] = newValue;
              }
            });
            const formatObject = (obj: Record<string, any>): string =>
              JSON.stringify(obj).replace(/[{}"]/g, "").replace(/,/g, ", ");
    
            await commonService.create(
              {
                resourcetypeid: req.params.id,
                resourcetype: constants.RESOURCETYPE[11],
                _tenantid: req.body.tenantid,
                old: formatObject(changes.old),
                new: formatObject(changes.new),
                affectedattribute: constants.AFFECTEDATTRIBUTES[0], // List affected attributes
                status: constants.STATUS_ACTIVE,
                createdby: req.body.lastupdatedby,
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          } catch (error) {
            console.log(`Failed to update history`, error);
          }

          try {
            ResouceMappingService.update(req.body, req.params.id);
          } catch (error) {
            console.log("Error in maping", error);
          }
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_UPDATE,
            res,
            req
          );
        })
        .catch((error: Error) => {
          console.log(error);
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (error) {
      console.log(error)
      customValidation.generateAppError(error, response, res, req);
    }
  }

  //delete
  async delete(req: Request, res: Response): Promise<void> {
    let response = {};
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryString(req.query.lastUpdatedBy, "lastUpdatedBy", 3, 50)
      const checkTestingTool = await db.TestingTool.findOne({
        where: {
          id: req.params.id,
        },
      });
      const existingTestingTool = JSON.parse(JSON.stringify(checkTestingTool));
      if (!existingTestingTool) {
        res.json({
          status: false,
          code: 201,
          message: messages.SETUP_TESTING_TOOLS[2],
        });
        return;
      }
      if (existingTestingTool.status == constants.CICD_STATUS_INACTIVE) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_TESTING_TOOLS[1],
        });
        return;
      }
      if (existingTestingTool.status == constants.STATUS_ACTIVE) {
        await db.TestingTool.update(
          {
            status: constants.CICD_STATUS_INACTIVE,
            lastupdatedby: req.query.lastUpdatedBy,
            lastupdateddt: Date.now(),
          },
          {
            where: { id: req.params.id },
          }
        );
        await db.ResourceMapping.update(
          {
            status: constants.DELETE_STATUS,
            lastupdatedby: req.query.lastUpdatedBy,
            lastupdateddt: Date.now(),
          },
          {
            where: { referenceid: req.params.id, 
            referencetype: constants.CICD_REFERENCE[4]
             },
          }
        )
        res.json({
          status: true,
          code: 200,
          message: messages.DELETE_SUCCESS,
        });
        return;
      }
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
}
export default new Controller();

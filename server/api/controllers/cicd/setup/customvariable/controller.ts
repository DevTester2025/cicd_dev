import { modules } from "../../../../../common/module";
import { customValidation } from "../../../../../common/validation/customValidation";
import CommonService from "../../../../services/common.service";
import { constants } from "../../../../../common/constants";
import { Request, Response } from "express";
import db from "../../../../models/model";
import { messages } from "../../../../../common/messages";
import { Op } from "sequelize";
import ResouceMappingService from "../../../../services/resourcemapping.service";

export class Controller {
  //create
  async create(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_CUSTOMVARIABLE };
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
      customValidation.isMandatoryString(req.body.keyname, "keyname", 3, 45);
      customValidation.isMandatoryString(req.body.variabletype, "variabletype", 3, 15);
      customValidation.isMandatoryString(req.body.keytype, "keytype", 3, 15);
      customValidation.isMandatoryString(req.body.createdby, "createdby", 3, 50);
      for (const variableValue of req.body.variablevalues) {
        customValidation.isMandatoryString(variableValue.environment, "environment", 2, 50);
        customValidation.isMandatoryString(variableValue.keyvalue, "keyvalue", 3, 45);
      }
      const existingVariable = await db.customVariable.findOne({
        where: {
          keyname: req.body.keyname,
          tenantid: req.body.tenantid,
        },
      });
      if (existingVariable) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_CUSTOMVARIABLE[4],
        });
        return;
      }
      req.body.status = constants.STATUS_ACTIVE;
      req.body.createddt = Date.now();
      const environments = req.body.variablevalues.map(
        (value: any) => value.environment
      );
      req.body.environment = environments.join(", ");
      const variables: any = await CommonService.create(
        req.body,
        db.customVariable
      );
      const variableValuesToCreate = req.body.variablevalues.map(
        (value: any) => ({
          variableid: variables.id,
          environment: value.environment,
          keyvalue: value.keyvalue,
          tenantid: req.body.tenantid,
          status: variables.status,
          createdby: req.body.createdby,
          createddt: variables.createddt,
        })
      );
      await CommonService.bulkCreate(
        variableValuesToCreate,
        db.customVariablesValues
      );
      const responseData = {
        id: variables.id,
        tenantid: variables.tenantid,
        keyname: variables.keyname,
        keytype: variables.keytype,
        variabletype: variables.variabletype,
        description: variables.description,
        variablevalues: req.body.variablevalues.map((value: any) => ({
          variableid: variables.id,
          environment: value.environment,
          keyvalue: value.keyvalue,
        })),
        createdby: variables.createdby,
        status: variables.status,
        createddt: variables.createddt,
      };
      try {
        await CommonService.create(
          {
            resourcetypeid: variables.id,
            resourcetype: constants.RESOURCETYPE[7],
            _tenantid: req.body.tenantid,
            new: constants.HISTORYCOMMENTS[14],
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
        ResouceMappingService.create(req.body, variables);
     } catch(error) {
       console.log("Error in maping", error)
     };
      customValidation.generateSuccessResponse(
        responseData,
        response,
        constants.RESPONSE_TYPE_SAVE,
        res,
        req
      );
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  //list
  async all(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_CUSTOMVARIABLE };
    function serializeRow(row: any): any {
      return {
        ...row.toJSON(),
      };
    }
    try {
      let parameters: any = {};
      customValidation.isMandatoryLong(req.query.tenantid, "tenantid", 1, 11);
  
      if (req.query.variabletype == "CLOUDMATIQ") {
        parameters = {
          where: {
            tenantid: req.query.tenantid,
            status: constants.STATUS_ACTIVE,
            variabletype: req.query.variabletype || {
              [db.Sequelize.Op.ne]: null,
            },
          },
          include: [
            {
              model: db.customVariablesValues,
              as: "customVariablesValues",
              where: { status: constants.STATUS_ACTIVE },
            },
          ],
          order: [["lastupdateddt", "DESC"]],
        };
      } else if (req.query.variabletype == "PROVIDER") {
        parameters = {
          where: {
            tenantid: req.query.tenantid,
            status: constants.STATUS_ACTIVE,
            variabletype: req.query.variabletype
          },
          order: [["lastupdateddt", "DESC"]],
        };
      } else {
        parameters = {
          where: {
            tenantid: req.query.tenantid,
            status: constants.STATUS_ACTIVE,
            variabletype: req.query.variabletype || {
              [db.Sequelize.Op.ne]: null,
            },
          },
          order: [["lastupdateddt", "DESC"]],
        };
      }

      if (req.query.order && typeof req.query.order === "string") {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
      }
      if (req.query.variabletype) {
        parameters.where["variabletype"] = req.query.variabletype;
      }
      if (req.query.keyname) {
        parameters.where["keyname"] = req.query.keyname;
      }
      if (req.query.environment) {
        parameters.where["environment"] = req.query.environment;
      }
      if (req.query.limit) {
        parameters["limit"] = parseInt(req.query.limit as string);
      }
      if (req.query.offset) {
        parameters["offset"] = parseInt(req.query.offset as string);
      }
      if (typeof req.query.searchText === "string" && req.query.searchText.trim() !== "") {
        const searchText = req.query.searchText.trim();
        const searchCondition = {
          [Op.or]: [
            { keyname: { [Op.like]: `%${searchText}%` } },
            { environment: { [Op.like]: `%${searchText}%` } },
            { variabletype: { [Op.like]: `%${searchText}%` } },
          ],
        };
        parameters.where = { ...parameters.where, ...searchCondition };
      }
      if (req.query.count) {
        CommonService
          .getCountAndList(parameters, db.customVariable)
          .then((result) => {
            const { count, rows } = result;
            const data = {
              count,
              rows: rows.map((row) => ({
                ...serializeRow(row),
              })),
            };
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
      } else {
      CommonService
        .getAllList(parameters, db.customVariable)
        .then((list) => {
          const data = {
            count: list.length,
            rows: list.map((row) => ({
              ...serializeRow(row),
            })),
          };
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
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  

  //get by detail id
  byId(req: Request, res: Response): void {
    let response = { reference: modules.SETUP_CUSTOMVARIABLE };
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      db.customVariable.findOne({
        where: { id: req.params.id },
        include: [{ model: db.customVariablesValues, as: 'customVariablesValues' }, 
            {
          model: db.ResourceMapping,
          as: 'ResourceMapping',
          required: false, 
          where: { referenceid: req.params.id, status: constants.STATUS_ACTIVE, referencetype: constants.CICD_REFERENCE[5] },
        },
      ]
      })
        .then((data: any) => {
          if (!data) {
            res.json({
              status: false,
              code: 204,
              message: messages.SETUP_CUSTOMVARIABLE[2],
            });
            return;
          }
          let responseData: any = {
            id: data.id,
            tenantid: data.tenantid,
            keyname: data.keyname,
            keytype: data.keytype,
            variabletype: data.variabletype,
            description: data.description,
            variablevalues: data.customVariablesValues.map((value: any) => ({
              variableid: value.variableid,
              id: value.id,
              tenantid: value.tenantid,
              environment: value.environment,
              keyvalue: value.keyvalue,
              status: value.status,
              cratedby: value.cratedby,
              createddt: value.createddt,
              lastupdatedby: value.lastupdatedby,
              lastupdateddt: value.lastupdateddt
            })),
            createdby: data.createdby,
            lcreateddt: data.lcreateddt,
            lastupdatedby: data.lastupdatedby,
            status: data.status,
            lastupdateddt: data.lastupdateddt,
            variablesCMDB: data.ResourceMapping.map((value: any)=>({
              id: value.id,
              tenantid: value.tenantid,
              referenceid: value.referenceid,                        
              referencetype: value.referencetype,  
              crn: value.crn,          
              fieldname: value.fieldname, 
              resource_type: value.resource_type,                 
              status: value.status,  
              createdby: value.lastupdatedby,           
              lastupdatedby: value.lastupdatedby,
            }))
          };
          customValidation.generateSuccessResponse(
            responseData,
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
    let response = { reference: modules.SETUP_CUSTOMVARIABLE };
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
      customValidation.isMandatoryString(req.body.keyname, "keyname", 3, 45);
      customValidation.isMandatoryString(req.body.variabletype, "variabletype", 3, 15);
      customValidation.isMandatoryString(req.body.keytype, "keytype", 3, 15);
      customValidation.isMandatoryString(req.body.lastupdatedby, "lastupdatedby", 3, 50);
      for (const variableValue of req.body.variablevalues) {
        customValidation.isMandatoryString(variableValue.environment, "environment", 2, 50);
        customValidation.isMandatoryString(variableValue.keyvalue, "keyvalue", 3, 45);
      }
      const existingVariable = await db.customVariable.findOne({
        where: {
          keyname: req.body.keyname,
          tenantid: req.body.tenantid,
          id: { [Op.ne]: req.params.id },
        },
      });
      if (existingVariable) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_CUSTOMVARIABLE[4],
        });
        return;
      }
      const oldData = await db.customVariable.findByPk(req.params.id);
      req.body.status = constants.STATUS_ACTIVE;
      req.body.lastupdateddt = Date.now();
      const environments = req.body.variablevalues.map((value: any) => value.environment);
      req.body.environment = environments.join(", ");
      await CommonService.update(
        { id: req.params.id },
        req.body,
        db.customVariable
      );
      try {
        ResouceMappingService.update(req.body,req.params.id);
     } catch(error) {
       console.log("Error in maping", error)
     };
      let createdIds: number[] = [];
      for (const value of req.body.variablevalues) {
        if (!value.id) {
          const record = await CommonService.create(
            {
              variableid: req.params.id,
              environment: value.environment,
              keyvalue: value.keyvalue,
              tenantid: req.body.tenantid,
              status: req.body.status,
              lastupdatedby: req.body.lastupdatedby,
              lastupdateddt: Date.now(),
              createdby: req.body.lastupdatedby,
              createddt: Date.now()
            },
            db.customVariablesValues
          );
          createdIds.push(record.id);
          value.id = record.id;
        } else {
          await CommonService.update(
            {
              id: value.id,
              variableid: req.params.id,
              tenantid: req.body.tenantid
            },
            {
              environment: value.environment,
              keyvalue: value.keyvalue,
              status: req.body.status,
              lastupdatedby: req.body.lastupdatedby,
              lastupdateddt: Date.now()
            },
            db.customVariablesValues
          );
        }
      }
      const updatedVariable: any = await db.customVariable.findByPk(req.params.id);
      const responseData = {
        id: updatedVariable.id,
        tenantid: updatedVariable.tenantid,
        keyname: updatedVariable.keyname,
        keytype: updatedVariable.keytype,
        variabletype: updatedVariable.variabletype,
        description: updatedVariable.description,
        variablevalues: req.body.variablevalues.map((value: any, index: number) => ({
          variableid: updatedVariable.id,
          id: value.id ? value.id : createdIds[index],
          environment: value.environment,
          keyvalue: value.keyvalue,
          status: value.status,
        })),
        lastupdatedby: updatedVariable.lastupdatedby,
        status: updatedVariable.status,
        lastupdateddt: updatedVariable.lastupdateddt,
      };
      try {
        const changes = {
          old: {},
          new: {},
        };

        Object.keys(req.body).forEach((key) => {
          const oldValue = oldData[key];
          const newValue = req.body[key];
          if (
            key !== "attributes" &&
            key !== "lastupdateddt" &&
            key !== "lastupdatedby" &&
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
        
        await CommonService.create(
          {
            resourcetypeid: req.params.id,
            resourcetype: constants.RESOURCETYPE[7],
            _tenantid: req.body.tenantid,
            old: formatObject(changes.old),
            new: formatObject(changes.new),
            affectedattribute: constants.AFFECTEDATTRIBUTES[0],
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
      customValidation.generateSuccessResponse(
        responseData,
        response,
        constants.RESPONSE_TYPE_UPDATE,
        res,
        req
      );

    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  //delete
  async delete(req: Request, res: Response): Promise<void> {
    let response = {};
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryString(req.query.lastUpdatedBy, "lastUpdatedBy", 3, 50);
      const checkcustomVariable = await db.customVariable.findOne({
        where: {
          id: req.params.id,
        },
      });
      const existingcheckcustomVariable = JSON.parse(
        JSON.stringify(checkcustomVariable)
      );
      if (!existingcheckcustomVariable) {
        res.json({
          status: false,
          code: 201,
          message: messages.SETUP_CUSTOMVARIABLE[2],
        });
        return;
      }
      if (
        existingcheckcustomVariable.status == constants.CICD_STATUS_INACTIVE
      ) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_CUSTOMVARIABLE[3],
        });
        return;
      }
      if (existingcheckcustomVariable.status == constants.STATUS_ACTIVE) {
        await db.customVariable.update(
          {
            status: constants.CICD_STATUS_INACTIVE,
            lastupdatedby: req.query.lastUpdatedBy,
            lastupdateddt: new Date(),
          },
          {
            where: { id: req.params.id },
          }
        );
        await db.customVariablesValues.update(
          {
            status: constants.CICD_STATUS_INACTIVE,
            lastupdatedby: req.query.lastUpdatedBy,
            lastupdateddt: new Date(),
          },
          {
            where: { variableid: req.params.id },
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
            referencetype: constants.CICD_REFERENCE[5]
             },
          }
        );
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

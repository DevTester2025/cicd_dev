import { customValidation } from "../../../../../common/validation/customValidation";
import { Request, Response } from "express";
import _ = require("lodash");
import { Op } from "sequelize";
import commonService from "../../../../services/common.service";
import { modules } from "../../../../../common/module";
import { constants } from "../../../../../common/constants";
import db from "../../../../models/model";
import { messages } from "../../../../../common/messages";
import { basicValidation } from "../../cicdcommon/validation";
import ResouceMappingService from "../../../../services/resourcemapping.service";
export class Controller {
  
  //List
  async all(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_BUILD };
    function serializeRow(row: any): any {
      return {
        ...row.toJSON(),
      };
    }
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
      if (req.query.limit) {
        parameters["limit"] = parseInt(req.query.limit as string);
      }
      if (req.query.offset) {
        parameters["offset"] = parseInt(req.query.offset as string);
      }
      if (req.query.instancename) {
        parameters.where["instancename"] = req.query.instancename;
      }
      if (req.query.name) {
        parameters.where["name"] = req.query.name;
      }
      if (req.query.status) {
        parameters.where["status"] = req.query.status;
      }
      if (req.query.startDate && req.query.endDate) {
        let startdate = req.query.startDate as string;
        let enddate = req.query.endDate as string;
        let startDate = new Date(startdate);
        let endDate = new Date(enddate);
        startDate.setHours(0, 0, 0);
        endDate.setHours(23, 59, 59);
        parameters.where["createddt"] = {
          [Op.between]: [startDate, endDate],
        };
      }
      if (
        typeof req.query.searchText === "string" &&
        req.query.searchText.trim() !== ""
      ) {
        const searchText = req.query.searchText.trim();
        const searchCondition = {
          [Op.or]: [
            { name: { [Op.like]: `%${searchText}%` } },
            { instancename: { [Op.like]: `%${searchText}%` } },
            { ipaddress: { [Op.like]: `%${searchText}%` } },
          ],
        };
        parameters.where = { ...parameters.where, ...searchCondition };
      }
      if (req.query.count) {
        commonService
          .getCountAndList(parameters, db.SetupBuild)
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
        commonService
          .getAllList(parameters, db.SetupBuild)
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
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  //get by ID
  byId(req: Request, res: Response): void {
    let response = { reference: modules.SETUP_BUILD };
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
        db.SetupBuild.findOne({
          where: { id: req.params.id },
          include: [
            {
              model: db.ResourceMapping,
              as: 'buildsCMDB',
              required: false, 
              where: { referenceid: req.params.id, status: constants.STATUS_ACTIVE, referencetype:constants.CICD_REFERENCE[2]},
            },
          ],
        })
        .then((data) => {
          if (data) {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_LIST,
              res,
              req
            );
          } else {
            res.json({
              status: false,
              code: 201,
              message: messages.SETUP_BUILD[1],
            });
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  //delete
  async delete(req: Request, res: Response): Promise<void> {
    let response = {};
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryString(
        req.query.lastUpdatedBy,
        "lastUpdatedBy",
        3,
        50
      );
      const checkBuilds = await db.SetupBuild.findOne({
        where: {
          id: req.params.id,
        },
      });
      const existingBuilds = JSON.parse(JSON.stringify(checkBuilds));
      if (!existingBuilds) {
        res.json({
          status: false,
          code: 201,
          message: messages.SETUP_BUILD[3],
        });
        return;
      }
      if (existingBuilds.status == constants.CICD_STATUS_INACTIVE) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_BUILD[2],
        });
        return;
      }
      if (existingBuilds.status == constants.STATUS_ACTIVE) {
        await db.SetupBuild.update(
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
            referencetype:constants.CICD_REFERENCE[2]
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

  //create
 async create(req: Request, res: Response): Promise<void> {
  let response = { reference: modules.SETUP_BUILD };
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
      customValidation.isMandatoryString(req.body.name, "name", 3, 50);
      customValidation.isMandatoryString(req.body.username, "username", 3, 50);
      customValidation.isMandatoryString(req.body.ipaddress, "ipaddress", 1, 20);
      customValidation.isMandatoryString(req.body.password, "password", 1, 150);
      customValidation.isMandatoryString(req.body.createdby, "createdby", 3, 50);
      customValidation.isOptionalString(req.body.instancename, "instancename", 3, 100);
      customValidation.isOptionalString(req.body.instancerefid, "instancerefid", 1, 100);
      basicValidation.isMandatoryScript(req.body.buildscript, "Build Script");  

      if (req.body.instancerefid != null && req.body.instancerefid != undefined && req.body.instancerefid != "") {

          const existingInstance = await db.Instances.findOne({
              where: {
                  tenantid: req.body.tenantid,
                  instancerefid: req.body.instancerefid,
                  status: constants.STATUS_ACTIVE.trim(),
              }
          });
          
          if (!existingInstance) {
              res.json({
                  status: false,
                  code: 204,
                  message: messages.SETUP_BUILD[0]
              });
              return;
          }
      }
      const existingBuildName = await db.SetupBuild.findOne({
          where: {
              tenantid: req.body.tenantid,
              name: req.body.name.trim(),
              status: constants.STATUS_ACTIVE.trim(),
          },
      });
      if (existingBuildName) {
          res.json({
              status: false,
              code: 204,
              message: messages.SETUP_BUILD[1]
            });
          return;
      }
      req.body.status = constants.STATUS_ACTIVE;
      req.body.createddt = Date.now();
      req.body.lastupdateddt = Date.now();
      commonService
          .create(req.body, db.SetupBuild)
          .then(async (data) => {
            try {
              await commonService.create({
                  resourcetypeid: data.id,
                  resourcetype: constants.RESOURCETYPE[10],
                  _tenantid: req.body.tenantid,
                  new: constants.HISTORYCOMMENTS[20],
                  affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                  status: constants.STATUS_ACTIVE,
                  createdby: req.body.createdby,
                  createddt: new Date(),
                  updatedby: null,
                  updateddt: null,
              }, db.History);
          } catch (error) {
              console.log(`Failed to create history`, error);
          }
          try {
            ResouceMappingService.create(req.body, data);
         } catch(error) {
           console.log("Error in maping", error)
         };
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
  } catch (e) {
      customValidation.generateAppError(e, response, res, req);
  }
}

//update
async update(req: Request, res: Response): Promise<void> {
  let response = { reference: modules.SETUP_BUILD };
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
      customValidation.isMandatoryString(req.body.name, "name", 3, 50);
      customValidation.isMandatoryString(req.body.username, "username", 3, 50);
      customValidation.isMandatoryString(req.body.ipaddress, "ipaddress", 1, 20);
      customValidation.isMandatoryString(req.body.password, "password", 1, 150);
      customValidation.isMandatoryString(req.body.lastupdatedby, "lastupdatedby", 3, 50);
      customValidation.isOptionalString(req.body.instancename, "instancename", 3, 100);
      customValidation.isOptionalString(req.body.instancerefid, "instancerefid", 1, 100);
      basicValidation.isMandatoryScript(req.body.buildscript, "Build Script");
      if (req.body.instancerefid != null && req.body.instancerefid != undefined && req.body.instancerefid != "") {

        const existingInstance = await db.Instances.findOne({
          where: {
              tenantid: req.body.tenantid,
              instancerefid: req.body.instancerefid,
              status: constants.STATUS_ACTIVE.trim(),
          }
      });         
          if (!existingInstance) {
              res.json({
                  status: false,
                  code: 204,
                  message: messages.SETUP_BUILD[0]
              });
              return;
          }
      }
      const existingBuildName = await db.SetupBuild.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
            tenantid: req.body.tenantid,
            name: req.body.name.trim(),
            status: constants.STATUS_ACTIVE.trim(),
        },
    });
    if (existingBuildName) {
        res.json({
            status: false,
            code: 204,
            message: messages.SETUP_BUILD[1]
          });
        return;
    }
    const oldData = await db.SetupBuild.findOne({
      where: { id: req.params.id },
      raw: true,
    });
    req.body.lastupdateddt = Date.now();
    let condition = { id: req.params.id };
    commonService
      .update(condition, req.body, db.SetupBuild)
      .then(async (data) => {
        try {
          const changes = {
            old: {},
            new: {},
          };

          Object.keys(oldData).forEach((key) => {
            const oldValue = oldData[key];
            const newValue = req.body[key];

            if (
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
              resourcetype: constants.RESOURCETYPE[10],
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
      .catch((error) => {
        customValidation.generateAppError(error, response, res, req);
      });
  } catch (e) {
      customValidation.generateAppError(e, response, res, req);
  }
}
}
export default new Controller();

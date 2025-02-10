import { customValidation } from "../../../../../common/validation/customValidation";
import { Request, Response, } from "express";
import _ = require("lodash");
import CommonService from "../../../../services/common.service";
import { modules } from "../../../../../common/module";
import { constants } from "../../../../../common/constants";
import db from "../../../../models/model";
import { messages } from "../../../../../common/messages";
import { AppError } from "../../../../../common/appError";
import ResouceMappingService from "../../../../services/resourcemapping.service";
import { Op } from "sequelize";

export class Controller {

  //List
  async all(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_EVIRONMENTS };
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
      if (req.query.instancename) {
        parameters.where["instancename"] = req.query.instancename;
      }
      if (req.query.authenticationtype) {
        parameters.where["authenticationtype"] = req.query.authenticationtype;
      }
      if (req.query.status) {
        parameters.where["status"] = req.query.status;
      }
      if (typeof req.query.searchText === "string" && req.query.searchText.trim() !== "") {
        const searchText = req.query.searchText.trim();
        const searchCondition = {
          [Op.or]: [
            { instancename: { [Op.like]: `%${searchText}%` } },
            { ipaddress: { [Op.like]: `%${searchText}%` } },
          ],
        };
        parameters.where = { ...parameters.where, ...searchCondition };
      }
      CommonService
        .getAllList(parameters, db.Environments)
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

  //delete
  async delete(req: Request, res: Response): Promise<void> {
    let response = {};
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryString(req.query.lastUpdatedBy, "lastUpdatedBy", 3, 50)
      const checkEnvironments = await db.Environments.findOne({
        where: {
          id: req.params.id,
        },
      });
      const existingEnvironments = JSON.parse(
        JSON.stringify(checkEnvironments)
      );
      if (!existingEnvironments) {
        res.json({
          status: false,
          code: 201,
          message: messages.SETUP_ENVIRONMENTS[3],
        });
        return;
      }
      if (existingEnvironments.status == constants.CICD_STATUS_INACTIVE) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_ENVIRONMENTS[2],
        });
        return;
      }
      if (existingEnvironments.status == constants.STATUS_ACTIVE) {
        await db.Environments.update(
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
            referencetype: constants.CICD_REFERENCE[3]
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

  //get by ID
  byId(req: Request, res: Response): void {
    let response = { reference: modules.SETUP_EVIRONMENTS };
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      db.Environments.findOne({
        where: { id: req.params.id },
        include: [
          {
            model: db.ResourceMapping,
            as: 'environmentsCMDB',
            required: false, 
            where: { referenceid: req.params.id, status: constants.STATUS_ACTIVE, referencetype: constants.CICD_REFERENCE[3]},
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

  //create
  async create(req: any, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_EVIRONMENTS };
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
      customValidation.isMandatoryString(req.body.authenticationtype, "authenticationtype", 3, 45);
      customValidation.isMandatoryString(req.body.createdby, "createdby", 3, 45);
      customValidation.isMandatoryString(req.body.createdby, "instancename", 3, 100);
      customValidation.isOptionalString(req.body.instancerefid, "instancerefid", 1, 100);
      const environmentsTypes = [
        constants.ENVIRONMENTS_VIRTUAL_MACHINE,
        constants.ENVIRONMENTS_KUBERNATES,
        constants.ENVIRONMENTS_DOCKER,
        constants.ENVIRONMENTS_SFTP,
      ];

      new Controller().validateVarible(req);
      new Controller().validateVaribleUsernameAndPass(req);

      if (!environmentsTypes.includes(req.body.type)) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_PROVIDER[0],
        });
        return;
      }
      if (req.body.authenticationtype == constants.AUTH_PASSWORD) {
        if (req.body.keyfiledata != null) {
          res.json({
            status: false,
            code: 204,
            message: messages.SETUP_ENVIRONMENTS[0], //0
          });
          return;
        }
      }
      if (req.body.authenticationtype == constants.AUTH_KEYBASEDTYPE) {
        if (req.body.password != null) {
          res.json({
            status: false,
            code: 204,
            message: messages.SETUP_ENVIRONMENTS[1],//1
          });
          return;
        }
      }
      new Controller().validateCreate(req, res);
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async validateCreate(req, res) {
    let response = { reference: modules.SETUP_EVIRONMENTS };
    try {
      const existingEnv: any[] = await db.Environments.findAll({
        where: {
          tenantid: req.body.tenantid,
          status: constants.STATUS_ACTIVE,
        },
      });
      
      if (req.body.instancerefid != null) {
        const existingInstanceRef = existingEnv.find((environment: { instancerefid: string ,  type: string;}) => {
          return environment.instancerefid == req.body.instancerefid && environment.type == req.body.type

        });
      
        if (existingInstanceRef) {
          res.json({
            status: false,
            code: 204,
            message: messages.SETUP_ENVIRONMENTS[5]
          });
          return;
        }
      }

if (req.body.instancerefid == null && !req.body.ipaddressisvariable) {
  const existingIpAddress = existingEnv.find((environment: { ipaddress: string,type: string; }) => {
    return environment.ipaddress == req.body.ipaddress &&  environment.type == req.body.type
  });

  if (existingIpAddress) {
    res.json({
      status: false,
      code: 204,
      message: messages.SETUP_ENVIRONMENTS[6],
    });
    return;
  }
}
      req.body.status = constants.STATUS_ACTIVE;
      req.body.createddt = Date.now();
      req.body.lastupdateddt = Date.now();
      CommonService.create(req.body, db.Environments)
        .then(async (data: any) => {
          try {
            await CommonService.create(
              {
                resourcetypeid: data.id,
                resourcetype: constants.RESOURCETYPE[6],
            _tenantid: req.body.tenantid,
            new: constants.HISTORYCOMMENTS[12],
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
          } catch (error) {
            console.log("Error in maping", error);
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  //update
  async update(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.SETUP_EVIRONMENTS };
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
      customValidation.isMandatoryString(req.body.authenticationtype, "authenticationtype", 3, 45);
      customValidation.isMandatoryString(req.body.lastupdatedby, "lastupdatedby", 3, 45);
      customValidation.isOptionalString(req.body.instancerefid, "instancerefid", 1, 100);
      const environmentsTypes = [
        constants.ENVIRONMENTS_VIRTUAL_MACHINE,
        constants.ENVIRONMENTS_KUBERNATES,
        constants.ENVIRONMENTS_DOCKER,
        constants.ENVIRONMENTS_SFTP,
      ];

      new Controller().validateVarible(req);
      new Controller().validateVaribleUsernameAndPass(req);

      if (!environmentsTypes.includes(req.body.type)) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_PROVIDER[0],
        });
        return;
      }
      if (req.body.authenticationtype == constants.AUTH_PASSWORD) {
        if (req.body.keyfiledata != null) {
          res.json({
            status: false,
            code: 204,
            message: messages.SETUP_ENVIRONMENTS[0], //0
          });
          return;
        }
      }
      if (req.body.authenticationtype == constants.AUTH_KEYBASEDTYPE) {
        if (req.body.password != null) {
          res.json({
            status: false,
            code: 204,
            message: messages.SETUP_ENVIRONMENTS[1],//1
          });
          return;
        }
      }
      const checkEnvironments = await db.Environments.findOne({
        where: {
          id: req.params.id,
        },
      });
      const existingEnvironments = JSON.parse(
        JSON.stringify(checkEnvironments)
      );
      const oldData = JSON.parse(JSON.stringify(existingEnvironments));
      if (!existingEnvironments) {
        res.json({
          status: false,
          code: 201,
          message: messages.SETUP_ENVIRONMENTS[3],
        });
        return;
      }
      await new Controller().validateUpdate(req,res)
      try {
        const changes = {
          old: {},
          new: {},
        };

        Object.keys(existingEnvironments).forEach((key) => {
          const oldValue = existingEnvironments[key];
          const newValue = req.body[key];

          if (
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
                resourcetype: constants.RESOURCETYPE[6],
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

 async  validateUpdate(req, res){
  let response = { reference: modules.SETUP_EVIRONMENTS };
  try{
    const existingEnv: any[] = await db.Environments.findAll({
      where: {
        tenantid: req.body.tenantid,
        status: constants.STATUS_ACTIVE,
      },
    });
    if (req.body.instancerefid != null ) {
      const existingInstanceRef = existingEnv.find((environment: { instancerefid: string, type: string; }) => {
        return environment.instancerefid == req.body.instancerefid && environment.type == req.body.type;
      });
    
      if (existingInstanceRef &&  existingInstanceRef.id != req.params.id) {
        res.json({
          status: false,
          code: 204,
          message: messages.SETUP_ENVIRONMENTS[5]
        });
        return;
      }
    }
    
    
    if (req.body.instancerefid == null && req.body.ipaddressisvariable === false) {
      const existingIpAddress = existingEnv.find((environment: { ipaddress: string, type: string, id: string; }) => {
        return environment.ipaddress == req.body.ipaddress && environment.type == req.body.type;
      });
    
      if (existingIpAddress && existingIpAddress.id != req.params.id) {
        res.json({
          status: false,
          code: 204,  
          message: messages.SETUP_ENVIRONMENTS[6],
        });
        return;
      }
    }
    req.body.lastupdateddt = Date.now();
    let condition = { id: req.params.id };
    CommonService
      .update(condition, req.body, db.Environments)
      .then((data) => {
        try {
          ResouceMappingService.update(req.body,req.params.id);
       } catch(error) {
         console.log("Error in maping", error)
       };
        customValidation.generateSuccessResponse(
          data,
          response,
          constants.RESPONSE_TYPE_UPDATE,
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


  validateVarible(req) {
    if (typeof req.body.ipaddressisvariable !== "boolean") {
      customValidation.errorResponse("ipaddressisvariable", " must be a boolean");
    } else if (req.body.ipaddressisvariable && req.body.ipaddress !== null) {
      throw new AppError("Either use the variable or input");
    } else if (!req.body.ipaddressisvariable && req.body.ipaddressvariable !== null) {
      throw new AppError("Either use the variable or input");
    } else if (!req.body.ipaddressisvariable) {
      customValidation.isMandatoryString(req.body.ipaddress, "ipaddress", 3, 20);
    } else {
      customValidation.isMandatoryString(req.body.ipaddressvariable, "ipaddressvariable", 3, 45);
    }
  }

  validateVaribleUsernameAndPass(req) {
    if (typeof req.body.usernameisvariable !== "boolean") {
      customValidation.errorResponse("usernameisvariable", " must be a boolean")
    } else if (req.body.usernameisvariable && req.body.username !== null) {
      throw new AppError("Either use the variable or input");
    } else if (!req.body.usernameisvariable && req.body.usernamevariable !== null) {
      throw new AppError("Either use the variable or input");
    } else if (!req.body.usernameisvariable) {
      customValidation.isMandatoryString(req.body.username, "username", 3, 50);
    } else {
      customValidation.isMandatoryString(req.body.usernamevariable, "usernamevariable", 3, 45);
    }

    if (typeof req.body.passwordisvariable !== "boolean") {
      customValidation.errorResponse("passwordisvariable", " must be a boolean")
    } else if (req.body.passwordisvariable && req.body.password !== null) {
      throw new AppError("Either use the variable or input");
    } else if (!req.body.passwordisvariable && req.body.passwordvariable !== null) {
      throw new AppError("Either use the variable or input");
    } else if (!req.body.passwordisvariable) {
      customValidation.isMandatoryString(req.body.password, "password", 3, 150);
    } else {
      customValidation.isMandatoryString(req.body.passwordvariable, "passwordvariable", 3, 45);
    }
  }

}
export default new Controller();

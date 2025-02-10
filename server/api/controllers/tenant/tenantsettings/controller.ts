import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import { modules } from "../../../../common/module";



export class Controller {
    constructor() {}
  // List all the Tenant Settings
    all(req: Request, res: Response): void {
      let response = { reference: modules.TENANT_SETTINGS };
      try {
        let parameters = {
          where: { status: constants.STATUS_ACTIVE },
        } as any;
        CommonService.getAllList(parameters, db.TenantSettings)
          .then((list) => {
            customValidation.generateSuccessResponse(
              list,
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
  // Get the Tenant Settings by ID
    byId(req: Request, res: Response): void {
      let response = { reference: modules.TENANT_SETTINGS };
      try {
        CommonService.getById(req.params.id, db.TenantSettings)
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

  // Create a new Tenant Settings
    create(req: Request, res: Response): void {
      let response = { reference: modules.TENANT_SETTINGS };
      try {
        CommonService.create(req.body, db.TenantSettings)
          .then((data) => {
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
    
  // Update an existing Tenant Settings
    update(req: Request, res: Response): void {
      let response = { reference: modules.TENANT_SETTINGS };
      try {
        let condition = { tnsettingid: req.body.tnsettingid };
        CommonService.update(condition, req.body, db.TenantSettings)
          .then((data) => {
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
  }
  export default new Controller();
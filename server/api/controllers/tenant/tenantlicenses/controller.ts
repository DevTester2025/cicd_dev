import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import { modules } from "../../../../common/module";



export class Controller {
    constructor() {}
    // List all the Tenant Licenses
    all(req: Request, res: Response): void {
      let response = { reference: modules.TENANT_LICENSES };
      try {
        let parameters = {} as any;
        CommonService.getAllList(parameters, db.TenantLicenses)
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
    
  // Get the Tenant License by ID
    byId(req: Request, res: Response): void {
      let response = { reference: modules.TENANT_LICENSES };
      try {
        CommonService.getById(req.params.id, db.TenantLicenses)
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

  // Create a new Tenant License
    create(req: Request, res: Response): void {
      let response = { reference: modules.TENANT_LICENSES };
      try {
        CommonService.create(req.body, db.TenantLicenses)
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
  
    // Update an existing Tenant License
    update(req: Request, res: Response): void {
      let response = { reference: modules.TENANT_LICENSES };
      try {
        let condition = { licenseid: req.body.licenseid };
        CommonService.update(condition, req.body, db.TenantLicenses)
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
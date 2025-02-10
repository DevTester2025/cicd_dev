import { Request, Response } from "express";
import * as _ from "lodash";
import { constants } from "../../../../../common/constants";
import { modules } from "../../../../../common/module";
import { customValidation } from "../../../../../common/validation/customValidation";
import db from "../../../../models/model";
import commonService from "../../../../services/common.service";
import {  WorkflowService,  iContentConfig,} from "../../../../services/workflow.service";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.CMDBCOM };
    try {
      let parameters = { where: req.body };
      parameters["order"] = [["lastupdateddt", "desc"]];
      commonService
        .getAllList(parameters, db.AssetsComment)
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
  async create(req: Request, res: Response) {
    let response = { reference: modules.CMDBCOM };
    let isWorkflowNotification = false;
    try {
      if(req.query){
        if(req.query.isWorkflowNotification == "true"){
          isWorkflowNotification = true;
        }
      }
      commonService
        .create(req.body, db.AssetsComment)
        .then(async (data) => {
          await commonService.create(
            {
              type: 1,
              old: null,
              new: data["comment"],
              affectedattribute: "Notes",
              status: "Active",
              createdby: data["createdby"],
              createddt: new Date(),
              lastupdatedby: null,
              lastupdateddt: null,
              meta: "",
              tenantid: data["tenantid"],
              resourceid: data["resourceid"],
              crn: data["crn"],
            },
            db.AssetsHistory
          );
          if(isWorkflowNotification){
            await new Controller().SendWorkflowNotification(req.body,data);
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

   update(req: Request, res: Response): void {
    let response = { reference: modules.CMDBCOM };
    try {
      let condition = { id: req.body.id };
      const existingRecord = db.AssetsComment.findOne({
        where: condition,
      })
      commonService
        .update(condition, req.body, db.AssetsComment)
        .then(async (data) => {
          let oldvalue = (await existingRecord).dataValues["comment"]
          await commonService.create(
            {
              type: 2,
              old: oldvalue,
              new: data["comment"],
              affectedattribute: req.body.status=='Deleted'?"Comment Removed":"Notes",
              status: "Active",
              createdby: data["lastupdatedby"],
              createddt: new Date(),
              lastupdatedby: data["lastupdatedby"],
              lastupdateddt: data["lastupdateddt"],
              meta: "",
              tenantid: data["tenantid"],
              resourceid: data["resourceid"],
              crn: data["crn"],
            },
            db.AssetsHistory
          );
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
  async SendWorkflowNotification(req,commentsdata) : Promise<any>{
    return new Promise(async (resolve, reject) => {
      let workflowService = new WorkflowService();
      let resouceid = req.resourceid.replace("/wflow","");
      workflowService.sendCommentsNotification(resouceid,commentsdata,"comments");
      resolve(true);
    });
    
  }
}

export default new Controller();

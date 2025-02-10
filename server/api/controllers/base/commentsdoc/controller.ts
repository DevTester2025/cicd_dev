import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import _ = require("lodash");
import { modules } from "../../../../common/module";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {
      reference: modules.COMMENTDOCS,
    };
    try {
      let parameters = {} as any;
      parameters.where = req.body;
      CommonService.getAllList(parameters, db.CommentsDoc)
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

  byId(req: Request, res: Response): void {
    let response = {
      reference: modules.COMMENTDOCS,
    };
    try {
      CommonService.getById(req.params.id, db.CommentsDoc)
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

  create(req: Request, res: Response): void {
    let response = {
      reference: modules.COMMENTDOCS
    };
    try {
      CommonService.create(req.body, db.CommentsDoc)
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

  upload(req: any, res: Response): void {
    const response = { module: modules.COMMENTDOCS };
    try {
      let request = {} as any;
      if (!customValidation.isEmptyValue(req.body.formData)) {
        request = JSON.parse(req.body.formData);
      }
      if (!customValidation.isEmptyValue(req.files.file)) {
        let filename = request.docname;
        CommonService.uploadFiletoS3(
          req.files.file.path,
          "Request/" + filename
        );
      }
        CommonService.create(
          request,
          db.CommentsDoc
        ).then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
        }).catch((err)=>{
          customValidation.generateAppError(err, response, res, req);
        })
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  download(req: Request, res: Response): void {
    let response = { reference: modules.CMDBDOC };
    let condition = {} as any;
    try {
      if(req.body.key){
      let splitedKey = req.body.key.split(".");
      condition = splitedKey[0];
      }
      CommonService.readS3File(condition).then((d) => {
        customValidation.generateSuccessResponse(
          { content: d, filename: req.body.key },
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      }).catch((err)=>{
        customValidation.generateAppError(err, response, res, req);
      })
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = {
      reference: modules.COMMENTDOCS,
    };
    try {
      let condition = { id: req.body.id };
      CommonService.update(condition, req.body, db.CommentsDoc)
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

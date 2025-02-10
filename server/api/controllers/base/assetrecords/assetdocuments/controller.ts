import { Request, Response } from "express";
import * as _ from "lodash";
import { constants } from "../../../../../common/constants";
import { customValidation } from "../../../../../common/validation/customValidation";
import db from "../../../../models/model";
import commonService from "../../../../services/common.service";
import { S3 } from "aws-sdk";
import * as fs from "fs";
import { modules } from "../../../../../common/module";

export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    let response = { reference: modules.CMDBDOC };
    try {
      let parameters = { where: req.body };
      commonService
        .getAllList(parameters, db.AssetsDocument)
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
  create(req: any, res: Response): void {
    let response = { reference: modules.CMDBDOC };
    try {
      const s3 = new S3({
        endpoint: process.env.S3ENDPT,
        accessKeyId: process.env.APP_AWS_ACCESS,
        secretAccessKey: process.env.APP_AWS_SECRET,
      });
      let file = req.files.file;
      fs.readFile(file.path, (err, data) => {
        console.log(data);
        console.log(err);
        if (err) throw err;
        const params = {
          Bucket: constants.AWS_BUCKET, // pass your bucket name
          Key: "Documents/" + file.name,
          Body: data,
        };
        s3.upload(params, function (s3Err, s3Data) {
          if (s3Err) {
            console.error(s3Err);
          } else {
            console.log(s3Data);
            console.log(`File uploaded successfully at ${s3Data.Location}`);
            let reqObj = JSON.parse(req.body.formData);
            reqObj.meta = JSON.stringify(s3Data);
            reqObj.mimetype = file.mimetype;
            reqObj.filesize = file.size;
            reqObj.filename = file.originalname;
            if(reqObj.mode == "DOCUEMNT_DATATYPE"){
              customValidation.generateSuccessResponse(
                reqObj,
                response,
                constants.RESPONSE_TYPE_SAVE,
                res,
                req
              );
            }
            else{
              if(reqObj.mode){
                delete reqObj.mode;
              }
              commonService
              .create(reqObj, db.AssetsDocument)
              .then(async (data) => {
                await commonService.create(
                  {
                    type: 1,
                    old: null,
                    new: data["filename"],
                    affectedattribute: "File added",
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
            }
          }
        });
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = { reference: modules.CMDBDOC };
    try {
      let condition = { id: req.body.id };
      commonService
        .update(condition, req.body, db.AssetsDocument)
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
  download(req: Request, res: Response): void {
    let response = { reference: modules.CMDBDOC };
    let condition = {} as any;
    try {
      commonService.readS3File(req.body.key).then((d) => {
        customValidation.generateSuccessResponse(
          { content: d, filename: req.body.key },
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  delete(req: Request, res: Response): void {
    let response = { reference: modules.CMDBDOC };
    try {
      const existingRecord = db.AssetsDocument.findOne({
        where: {id: req.body.id},
      })
      commonService.deleteS3File(req.body.key).then((d) => {
        commonService
          .update(
            {
              id: req.body.id,
            },
            { status: constants.DELETE_STATUS },
            db.AssetsDocument
          )
          .then(async (data) => {
            let oldvalue = (await existingRecord).dataValues["filename"]
            await commonService.create(
              {
                type: 2,
                old: oldvalue,
                new: data["filename"],
                affectedattribute: "File removed",
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
              constants.RESPONSE_TYPE_LIST,
              res,
              req
            );
          });
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}

export default new Controller();

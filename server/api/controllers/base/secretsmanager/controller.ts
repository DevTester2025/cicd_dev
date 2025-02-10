import { Request, Response } from "express";
import * as _ from "lodash";
import { AppError } from "../../../../common/appError";
import { constants } from "../../../../common/constants";
import { customValidation } from "../../../../common/validation/customValidation";
import db from "../../../models/model";
import AWSSecretManagerService from "../../../services/providers/aws-sm.service";
import AWSService from "../../../services/providers/aws.service";
export class Controller {
  constructor() {}
  getAccess(req: Request, res: Response, next: any) {
    let response = { reference: "REGIONACCESS" };
    try {
      if (
        req.body.instancerefid != null &&
        req.body.instancerefid != undefined
      ) {
        if (req.body.action == "DEFAULT") {
          req["awscredentials"] = {
            accessKeyId: process.env.APP_AWS_ACCESS,
            secretAccessKey: process.env.APP_AWS_SECRET,
          };
          req["region"] = process.env.DEFAULT_SMREGION;
          next();
        } else {
          db.Instances.findOne({
            where: {
              instancerefid: req.body["instancerefid"],
              status: constants.STATUS_ACTIVE,
            },
            limit: 1,
            attributes: [
              "instancerefid",
              "tnregionid",
              "accountid",
              "region",
              "tenantid",
            ],
            include: [
              {
                as: "instanceregion",
                model: db.TenantRegion,
                attributes: ["region", "tenantrefid"],
                where: { status: constants.STATUS_ACTIVE },
                include: [
                  {
                    as: "accountdata",
                    model: db.CustomerAccount,
                    attributes: ["rolename"],
                    where: { status: constants.STATUS_ACTIVE },
                  },
                ],
              },
            ],
          })
            .then((instance: any) => {
              if (instance != null) {
                let instanceData = JSON.parse(JSON.stringify(instance));
                let tenantregion = instanceData["instanceregion"];
                AWSService.getCredentials(
                  tenantregion,
                  instanceData["tenantid"]
                )
                  .then((awsCredentials: any) => {
                    req["awscredentials"] = awsCredentials;
                    req["region"] = tenantregion["region"];
                    next();
                  })
                  .catch((e: any) => {
                    customValidation.generateAppError(e, response, res, req);
                  });
              } else {
                customValidation.generateAppError(
                  new AppError("Invalid Instance Details"),
                  response,
                  res,
                  req
                );
              }
            })
            .catch((e: any) => {
              console.log(e);
              customValidation.generateAppError(e, response, res, req);
            });
        }
      } else {
        customValidation.generateAppError(
          new AppError("Please provide Instance reference id"),
          response,
          res,
          req
        );
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  all(req: Request, res: Response): void {
    const response = { reference: "SM-List" };
    try {
      let params = {
        Filters: [
          {
            Key: "tag-key",
            Values: ["InstanceId"],
          },
          {
            Key: "tag-value",
            Values: [req.body.instancerefid],
          },
        ],
      };
      AWSSecretManagerService.getSecrets(
        req["awscredentials"],
        req["region"],
        params
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  description(req: Request, res: Response): void {
    const response = { reference: "SM-DESC" };
    try {
      AWSSecretManagerService.getSecretValue(req.body)
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  create(req: Request, res: Response): void {
    const response = { reference: "SM-Create" };
    try {
      let params = {};
      AWSSecretManagerService.create(
        req["awscredentials"],
        req["region"],
        params
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
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

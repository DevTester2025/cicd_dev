import CommonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import * as _ from "lodash";
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = {};
    try {
      let parameters = {} as any;
      parameters = { where: req.body };
      parameters.include = [
        {
          model: db.awsvolumes,
          as: "volumes",
          paranoid: true,
          required: false,
          where: { status: req.body.status },
        },
        {
          model: db.awstags,
          as: "tags",
          paranoid: true,
          required: false,
          where: { status: req.body.status },
        },
        {
          model: db.TagValues,
          as: "tagvalues",
          paranoid: true,
          required: false,
          where: {
            status: "Active",
            cloudprovider: "AWS",
            resourcetype: "SOLUTION_ASSET",
          },
          include: [
            { model: db.Tags, as: "tag", paranoid: false, required: false },
          ],
        },
      ];
      CommonService.getAllList(parameters, db.awssolution)
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
    let response = {};
    try {
      CommonService.getById(req.params.id, db.awssolution)
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
    let response = {};
    try {
      let options = {
        include: [
          { model: db.awsvolumes, as: "volumes" },
          { model: db.awstags, as: "tags" },
          { model: db.TagValues, as: "tagvalues" },
        ],
      };
      CommonService.saveWithAssociation(req.body, options, db.awssolution)
        .then((data) => {
          console.log(data);
          try {
            CommonService.create(
              {
                resourcetypeid: data["solutionid"],
                resourcetype: constants.RESOURCETYPE[18],
                _tenantid: process.env.ON_PREM_TENANTID,
                new: constants.HISTORYCOMMENTS[40],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: data["createdby"],
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          }catch(error) {
          console.log("Failed to update history", error)
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
    let response = {};
    try {
      let condition = { awssolutionid: req.body.awssolutionid };
      CommonService.update(condition, req.body, db.awssolution)
        .then((data) => {
          CommonService.bulkUpdate(
            req.body.volumes,
            [
              "volumetype",
              "sizeingb",
              "delontermination",
              "encryptedyn",
              "lastupdateddt",
              "lastupdatedby",
              "status",
            ],
            db.awsvolumes
          ).then((data) => {});
          CommonService.bulkUpdate(
            req.body.tags,
            ["tagkey", "tagvalue", "lastupdateddt", "lastupdatedby"],
            db.awstags
          ).then((data) => {});

          if (!customValidation.isEmptyValue(req.body.tagvalues)) {
            let updateattributes = [
              "cloudprovider",
              "resourcetype",
              "resourceid",
              "tagid",
              "tagvalue",
              "status",
              "lastupdatedby",
              "lastupdateddt",
            ];
            CommonService.bulkUpdate(
              req.body.tagvalues,
              updateattributes,
              db.TagValues
            )
              .then((result: any) => {})
              .catch((error: Error) => {});
          }
          try {
            CommonService.create(
              {
                resourcetypeid: data["solutionid"],
                resourcetype: constants.RESOURCETYPE[18],
                _tenantid: process.env.ON_PREM_TENANTID,
                new: constants.HISTORYCOMMENTS[41],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: req.body.lastupdatedby ? req.body.lastupdatedby : req.body.createdby,
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          }catch(error) {
          console.log("Failed to update history", error)
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
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  bulkupdate(req: Request, res: Response): void {
    let response = {};
    try {
      let updateattributes = [
        "solutionid",
        "vpcid",
        "amiid",
        "instancetypeid",
        "subnetid",
        "securitygroupid",
        "instancename",
        "keyid",
        "lbid",
        "scriptid",
        "noofservers",
        "publicipyn",
        "shutdownbehaviour",
        "terminationprotectionyn",
        "monitoringyn",
        "notes",
        "status",
        "lastupdatedby",
        "lastupdateddt",
      ];

      if (req.body.length > 0 && req.body[0].islbupdate == "Y" && Array.isArray(req.body)) {
        updateattributes = ["lbid", "lastupdateddt", "lastupdatedby"];
      }
      console.log(updateattributes);
      CommonService.bulkUpdate(req.body, updateattributes, db.awssolution)
        .then((data) => {
          if (!customValidation.isEmptyValue(req.body.volumes)) {
            CommonService.bulkUpdate(
              req.body.volumes,
              [
                "volumetype",
                "sizeingb",
                "delontermination",
                "encryptedyn",
                "lastupdateddt",
                "lastupdatedby",
              ],
              db.awsvolumes
            ).then((data) => {});
          }
          if (!customValidation.isEmptyValue(req.body.tags)) {
            CommonService.bulkUpdate(
              req.body.tags,
              ["tagkey", "tagvalue", "lastupdateddt", "lastupdatedby"],
              db.awstags
            ).then((data) => {});
          }
          if (!customValidation.isEmptyValue(req.body.tagvalues)) {
            let updateattributes = [
              "cloudprovider",
              "resourcetype",
              "resourceid",
              "tagid",
              "tagvalue",
              "status",
              "lastupdatedby",
              "lastupdateddt",
            ];
            CommonService.bulkUpdate(
              req.body.tagvalues,
              updateattributes,
              db.TagValues
            )
              .then((result: any) => {})
              .catch((error: Error) => {});
          }
          try {
            CommonService.create(
              {
                resourcetypeid: data[0]["solutionid"],
                resourcetype: constants.RESOURCETYPE[18],
                _tenantid: process.env.ON_PREM_TENANTID,
                new: constants.HISTORYCOMMENTS[37],
                affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                status: constants.STATUS_ACTIVE,
                createdby: data[0]["lastupdatedby"],
                createddt: new Date(),
                updatedby: null,
                updateddt: null,
              },
              db.History
            );
          }catch(error) {
          console.log("Failed to update history", error)
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
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();

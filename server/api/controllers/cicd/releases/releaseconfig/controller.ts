import _ = require("lodash");
import { constants } from "../../../../../common/constants";
import { modules } from "../../../../../common/module";
import db from "../../../../models/model";
import commonService from "../../../../services/common.service";
import { Op } from "sequelize";
import { Request, Response } from "express";
import { ReleaseConfigService } from "../../../../services/cicd/releases/releaseconfig.service";
import { customValidation } from "../../../../../common/validation/customValidation";
import { messages } from "../../../../../common/messages";
import { Service } from "../../pipelinetemplate/buildworkflowyml/service";
import { basicValidation } from "../../cicdcommon/validation";
import axios from "axios";
import { AssetListTemplate } from "../../../../../reports/templates";
import { CommonHelper } from "../../../../../reports";
import DownloadService from "../../../../services/download.service";
export class Controller {
  // Release list
  async all(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.CICD_RELEASE };
    function serializeRow(row: any): any {
      return {
        ...row.toJSON(),
      };
    }
    try {
      let parameters = {
        where: { tenantid: req.query.tenantid },
        include: [
          {
            model: db.PipelineTemplate,
            as: "template",
            attributes: ["pipelinename"],
            where: {},
          },
          {
            model: db.srmcatalog,
            required: false,
            as: "catalog",
            attributes: ["catalogid","referenceid","referencetype","publishstatus","status"],
            where: { status: constants.STATUS_ACTIVE },
          },
        ],
        order: [["lastupdateddt", "DESC"]],
      } as any;
      if (req.query.filters) {
        let filters: any = req.query.filters;
        parameters.where = JSON.parse(filters);
      }
      if (req.query.startdate && req.query.enddate) {
        const startdateString = req.query.startdate as string;
        const enddateString = req.query.enddate as string;
        // Convert query parameters to Date objects
        const startdate = new Date(startdateString);
        const enddate = new Date(enddateString);
        // Set endDate to the end of the day
        startdate.setHours(0, 0, 0);
        enddate.setHours(23, 59, 59);
        parameters.where["createddt"] = {
          [Op.between]: [startdate, enddate],
        };
      }
      if (req.query.order as any) {
        let order: any = req.query.order;
        let splittedOrder;
        if (typeof order === "string") {
            splittedOrder = order.split(",");
        }        
        parameters["order"] = [splittedOrder];
      }
      if (req.query.limit) {
        parameters["limit"] = req.query.limit;
      }
      if (req.query.offset) {
        parameters["offset"] = req.query.offset;
      }
      if (req.query.status) {
        parameters.where["status"] = req.query.status;
      }
      if (req.query.schedule) {
        parameters.where["schedule"] = req.query.schedule;
      }
      if (req.query.templateid) {
        parameters.where["templateid"] = req.query.templateid;
      }
      if (
        typeof req.query.searchText === "string" &&
        req.query.searchText.trim() !== ""
      ) {
        const searchText = req.query.searchText.trim();
        const searchCondition = {
          [Op.or]: [{ name: { [Op.like]: `%${searchText}%` } }],
        };
        parameters.where = { ...parameters.where, ...searchCondition };
      }
      if (req.query.name) {
        if (Array.isArray(req.query.name)) {
          parameters.where["name"] = {
            [Op.or]: req.query.name.map(name => ({
              [Op.like]: `%${name}%`
            }))
          };
        } else {
          parameters.where["name"] = {
            [Op.like]: `%${req.query.name}%`
          };
        }
      }      
      if (req.query.count) {
        commonService
          .getCountAndList(parameters, db.ReleaseConfig)
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
      }  else if (req.query.isdownload) {
        const { tenantid } = req.query;
        parameters.where = {
            tenantid,
            ..._.omit(req.body, ["headers", "order"])
        };
        commonService.getAllList(parameters, db.ReleaseConfig)
            .then((list) => {
                let template = {
                    content: AssetListTemplate,
                    engine: "handlebars",
                    helpers: CommonHelper,
                    recipe: "html-to-xlsx",
                };
                let headers = [];
                if (typeof req.query.headers === 'string') {
                    try {
                        headers = JSON.parse(decodeURIComponent(req.query.headers));
                    } catch (error) {
                        return customValidation.generateAppError(new Error("Invalid headers format"), response, res, req);
                    }
                }
                let data = { lists: list, headers: headers };
                DownloadService.generateFile(data, template, (result) => {
                    customValidation.generateSuccessResponse(
                        result,
                        response,
                        constants.RESPONSE_TYPE_LIST,
                        res,
                        req
                    );
                });
            })
            .catch((error) => {
                console.error("Error fetching list:", error);
                customValidation.generateAppError(error, response, res, req);
            });
    } 
      else {
        commonService
          .getAllList(parameters, db.ReleaseConfig)
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

  //Release Create API
  async create(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.CICD_RELEASE };
    try {
      customValidation.isMandatoryString(req.body.name, "name", 3, 50);
      customValidation.isMandatoryString(req.body.schedule, "schedule", 3, 50);
      customValidation.isMandatoryLong(req.body.tenantid, "tenantid", 1, 11);
      customValidation.isMandatoryLong(
        req.body.templateid,
        "templateid",
        1,
        11
      );
      customValidation.isMandatoryString(
        req.body.createdby,
        "createdby",
        3,
        50
      );
      const validScheduleTypes = [
        constants.SCHEDULED_MANUAL,
        constants.SCHEDULED_SCHEDULE,
        constants.SCHEDULED_ONCOMMIT,
      ];
      // Check if schedule is valid
      if (!validScheduleTypes.includes(req.body.schedule)) {
        res.json({
          status: false,
          code: 204,
          message: messages.RELEAECONFIG_ERR_MSG[0],
        });
        return;
      }
      // Check for scheduleon only for specific schedules
      if (
        req.body.schedule == constants.SCHEDULED_MANUAL ||
        req.body.schedule == constants.SCHEDULED_ONCOMMIT
      ) {
        if (req.body.scheduleon != null) {
          res.json({
            status: false,
            code: 204,
            message: messages.RELEAECONFIG_ERR_MSG[1],
          });
          return;
        }
      }
      // Validate scheduleon for SCHEDULED_SCHEDULE
      if (req.body.schedule == constants.SCHEDULED_SCHEDULE) {
        customValidation.isMandatoryString(
          req.body.scheduleon,
          "scheduleon",
          3,
          25
        );
        if (!constants.SCHEDULEON_REGEX.test(req.body.scheduleon)) {
          res.json({
            status: false,
            code: 204,
            message: messages.RELEAECONFIG_ERR_MSG[2],
          });
          return;
        }
      }
      await new Controller().validateCreate(req, res); //call
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async validateCreate(req, res) {
    let response = { reference: modules.CICD_RELEASE };
    try {
      let existingReleaseName;
      if (typeof req.body.name === "string"){
        existingReleaseName = await db.ReleaseConfig.findOne({
          where: {
              tenantid: req.body.tenantid,
              name: req.body.name.trim(),
              status: constants.STATUS_ACTIVE.trim(),
          },
      });
      }
    if (existingReleaseName) {
        res.json({
            status: false,
            code: 204,
            message: messages.RELEAECONFIG_ERR_MSG[4],
          });
        return;
    }else {
        req.body.ConfigDetail = _.map(
          req.body.releasetemplatedetails,
          (itm) => {
            customValidation.isMandatoryString(
              itm.providerjobname,
              "providerjobname",
              0,
              50
            );
            customValidation.isMandatoryLong(itm.position, "position", 1, 11);
            customValidation.isMandatoryLong(
              itm.referenceid,
              "referenceid",
              1,
              11
            );
            customValidation.isMandatoryString(
              itm.referencetype,
              "referencetype",
              3,
              50
            );
            customValidation.isOptionalString(
              itm.description,
              "description",
              1,
              500
            );
            if(itm.providerjobname == 'BUILD_SCRIPT')
              {
                basicValidation.isMandatoryScript(itm.releasesetupdetailconfig.setupdetails.buildscript, "Build Script");
              }
            itm.tenantid = req.body.tenantid;
            itm.createdby = req.body.createdby;
            itm.createddt = Date.now();
            itm.lastupdateddt = Date.now();

            itm.status = constants.STATUS_ACTIVE;

            itm.releasesetupdetailconfig = {
              providerjobname: req.body.providerjobname,
              setupdetails: itm.releasesetupdetailconfig.setupdetails,
              scriptcontent: itm.releasesetupdetailconfig.scriptcontent,
              tenantid: req.body.tenantid,
              status: constants.STATUS_ACTIVE,
              createdby: req.body.createdby,
              lastupdateddt: Date.now(),
              createddt: Date.now(),
            };
            itm.releaseconfigdetailid = 0; // req.body.templatedetailid,
            itm.releaseconfighdrid = 0;

            return itm;
          }
        );

        req.body.status = constants.STATUS_ACTIVE;
        req.body.lastupdateddt = Date.now();
        req.body.createddt = Date.now();

        let options = {
          include: [
            {
              model: db.ReleaseConfigDetail,
              as: "ConfigDetail",
              include: [
                {
                  model: db.ReleaseSetupConfig,
                  as: "releasesetupdetailconfig",
                },
              ],
            },
          ],
        };
        commonService
          .saveWithAssociation(req.body, options, db.ReleaseConfig)
          .then(async (data) => {
            try {
              await commonService.create(
                {
                  resourcetypeid: data["id"],
                  resourcetype: constants.RESOURCETYPE[1],
                  _tenantid: data["tenantid"],
                  new: constants.HISTORYCOMMENTS[2],
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
              console.log(`Failed to create history`, error)
            }
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
            setTimeout(() => {
              (async () => {
                try {
                  await new Service().getTemplateDetails(
                    data.id,
                    req,
                    res,
                    req.body.scheduleon
                  );
                } catch (error) {
                  console.log('error',error)
                }
              })();
            }, 500);
          });
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  //get by ID
  byId(req: Request, res: Response): void {
    const response = { reference: modules.CICD_RELEASE };
    db.ReleaseConfig.findOne({
      where: {
        id: req.params.id,
      },
    })
      .then(async (checkid) => {
        if (!checkid) {
          return res.json({
            status: false,
            code: 204,
            message: messages.RELEAECONFIG_ERR_MSG[5],
          });
        }
        await db.ReleaseConfig.findOne({
          where: {
            tenantid: req.query.tenantid,
            id: req.params.id,
            status: constants.STATUS_ACTIVE,
          },
          include: [
            {
              model: db.ReleaseConfigDetail,
              as: "ConfigDetail",
              include: [
                {
                  model: db.ReleaseSetupConfig,
                  as: "releasesetupdetailconfig",
                },
              ],
            },
          ],
        })
          .then((data) => {
            const release = JSON.parse(JSON.stringify(data));
            db.PipelineTemplate.findOne({
              where: { id: release.templateid },
              attributes: ["pipelinename"],
            })
              .then((templateData) => {
                const list = {
                  ...data.toJSON(),
                  template: templateData ? templateData.toJSON() : null,
                };
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
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      })
      .catch((e) => {
        customValidation.generateAppError(e, response, res, req);
      });
  }

  //update
  async update(req: Request, res: Response): Promise<void> {
    const response = { reference: modules.CICD_RELEASE };
    try {
      customValidation.isMandatoryString(
        req.body.lastupdatedby,
        "lastupdatedby",
        3,
        50
      );
      let originalString = req.body.name;
      let stringWithoutSpaces
      if (typeof originalString === "string") {
        stringWithoutSpaces = originalString.replace(/\s+/g, "");
      }
      customValidation.isMandatoryString(stringWithoutSpaces, "name", 3, 50);
      customValidation.isMandatoryString(req.body.schedule, "schedule", 3, 50);
      customValidation.isMandatoryLong(req.body.tenantid, "tenantid", 1, 11);
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryLong(
        req.body.templateid,
        "templateid",
        1,
        11
      );
      const validScheduleTypes = [
        constants.SCHEDULED_MANUAL,
        constants.SCHEDULED_SCHEDULE,
        constants.SCHEDULED_ONCOMMIT,
      ];
      if (!validScheduleTypes.includes(req.body.schedule)) {
        res.json({
          status: false,
          code: 204,
          message: messages.RELEAECONFIG_ERR_MSG[0],
        });
        return;
      }
      (req.body.schedule == constants.SCHEDULED_MANUAL ||
        req.body.schedule == constants.SCHEDULED_ONCOMMIT) &&
        (req.body.scheduleon = null);

      if (req.body.schedule == constants.SCHEDULED_SCHEDULE) {
        customValidation.isMandatoryString(
          req.body.scheduleon,
          "scheduleon",
          3,
          25
        );
        if (!constants.SCHEDULEON_REGEX.test(req.body.scheduleon)) {
          res.json({
            status: false,
            code: 204,
            message: messages.RELEAECONFIG_ERR_MSG[2],
          });
          return;
        }
      }
      const configs = await db.ReleaseConfig.findAll({
        where: {
          tenantid: req.body.tenantid,
          status: constants.STATUS_ACTIVE,
        },
      });

      (!configs || configs.length === 0 || req.params.id == null) &&
        res.json({
          status: false,
          code: 204,
          message: messages.RELEAECONFIG_ERR_MSG[5],
        });

      const configsDetail = JSON.parse(JSON.stringify(configs));
      const configById = configsDetail.find(
        (element) => element.id == req.params.id
      );
      if (!configById) {
        res.json({
          status: false,
          code: 204,
          message: messages.RELEAECONFIG_ERR_MSG[5],
        });
        return;
      }
      const existingReleaseName = await db.ReleaseConfig.findOne({
        where: {
           id: { [Op.ne]: req.params.id },
            tenantid: req.body.tenantid,
            name: req.body.name.trim(),
            status: constants.STATUS_ACTIVE.trim(),
        },
    });
    if (existingReleaseName) {
        res.json({
          status: false,
          code: 204,
          message: messages.RELEAECONFIG_ERR_MSG[4],
        });
        return;
      }
      await new Controller().validate(req, res, configs); //call
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  async validate(req, res, release) {
    const response = { reference: modules.CICD_RELEASE };
    try {
      let existingRelease;
      if (release && typeof release.name === "string" ){
          existingRelease = "";
      }
      const existingName =
        existingRelease &&
        existingRelease.id != req.params.id &&
        existingRelease.schedule != req.body.schedule;

      if (existingName) {
        res.json({
          status: false,
          code: 204,
          message: messages.RELEAECONFIG_ERR_MSG[3],
        });
        return;
      }

      const checkRelease = await db.ReleaseConfig.findOne({
        where: {
          id: req.params.id,
        },
      });
      const existRelease = JSON.parse(JSON.stringify(checkRelease));

      const result = release.find((release) => release.id == req.params.id);
      if (result != null && result != undefined) {
        req.body.status = constants.STATUS_ACTIVE;
        req.body.lastupdateddt = Date.now();
        req.body.ConfigDetail = _.map(req.body.ConfigDetail, (itm) => {
          customValidation.isMandatoryString(
            itm.providerjobname,
            "providerjobname",
            0,
            50
          );
          customValidation.isMandatoryLong(itm.position, "position", 1, 11);
          customValidation.isMandatoryLong(
            itm.referenceid,
            "referenceid",
            1,
            11
          );
          customValidation.isMandatoryString(
            itm.referencetype,
            "referencetype",
            3,
            50
          );
          customValidation.isOptionalString(
            itm.description,
            "description",
            1,
            500
          );
          if(itm.providerjobname == 'BUILD_SCRIPT')
            {
              basicValidation.isMandatoryScript(itm.releasesetupdetailconfig.setupdetails.buildscript, "Build Script");
            }
          itm.tenantid = req.body.tenantid;
          itm.createdby = req.body.createdby;
          itm.createddt = Date.now();
          itm.lastupdateddt = Date.now();
          itm.status = constants.STATUS_ACTIVE;

          itm.releasesetupdetailconfig = {
            id: itm.releasesetupdetailconfig.id,
            releaseconfigdetailid:
              itm.releasesetupdetailconfig.releaseconfigdetailid,
            setupdetails: itm.releasesetupdetailconfig.setupdetails,
            scriptcontent: itm.releasesetupdetailconfig.scriptcontent,
            tenantid: req.body.tenantid,
            status: constants.STATUS_ACTIVE,
            createdby: req.body.createdby,
            lastupdateddt: Date.now(),
            createddt: Date.now(),
          };
          itm.releaseconfighdrid = req.body.id;

          return itm;
        });
        req.body.status = constants.STATUS_ACTIVE;
        req.body.lastupdateddt = Date.now();
        req.body.createddt = Date.now();

        let options = {
          include: [
            {
              model: db.ReleaseConfigDetail,
              as: "ConfigDetail",
              include: [
                {
                  model: db.ReleaseSetupConfig,
                  as: "releasesetupdetailconfig",
                },
              ],
            },
          ],
        };
        commonService
          .updateWithAssociation(
            req.body,
            options,
            db.ReleaseConfig,
            req.params.id
          )
          .then(async (data) => {
            const id = data.id;
            try {
              const changes = {
                old: {},
                new: {},
              };
  
              Object.keys(existRelease).forEach((key) => {
                
                const oldValue = existRelease[key];
                const newValue = req.body[key];
  
                if (
                  key !== "lastupdateddt" &&
                  key !== "createddt" &&
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
                  resourcetypeid: data["id"],
                  resourcetype: constants.RESOURCETYPE[1],
                  _tenantid: data["tenantid"],
                  old: formatObject(changes.old),
                  new: formatObject(changes.new),
                  affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                  status: constants.STATUS_ACTIVE,
                  createdby: data["lastupdatedby"],
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
              { id },
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
            setTimeout(() => {
              (async () => {
                try {
                  await new Service().getTemplateDetails(
                    data.id,
                    req,
                    res,
                    constants.RELEASE_UPDATE
                  );
                } catch (error) {
                  console.log('error',error)
                }
              })();
            }, 500);
          });
      } else {
        res.json({
          status: false,
          code: 204,
          message: messages.RELEAECONFIG_ERR_MSG[5],
        });
      }
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  //Trigger workflow
  async triggerWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const configId = req.body.configId;
      await new ReleaseConfigService().tiggerReleaseworkflow(
        Number(configId),
        null,
        req,
        res,
        null
      );
    } catch (err) {
      const { message } = err;
      res.send({ message });
    }
  }

  //Release Delete
  async releaseDelete(req: Request, res: Response): Promise<void> {
    let response = {};
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryString(
        req.query.lastUpdatedBy,
        "lastUpdatedBy",
        1,
        50
      );
      const release = await db.ReleaseConfig.findOne({
        where: {
          tenantid: req.query.tenantid,
          id: req.params.id,
          status: constants.STATUS_ACTIVE,
        },
        include: [
          {
            model: db.ReleaseConfigDetail,
            as: "ConfigDetail",
            include: [
              {
                model: db.ReleaseSetupConfig,
                as: "releasesetupdetailconfig",
              },
            ],
          },
        ],
      });
      const result = JSON.parse(JSON.stringify(release));
      req.body=result;
      if (result) {
        await new Service().getTemplateDetails(
          result.id,
          req,
          res,
          "Delete"
        );   
   await new Controller().deleteConfig(result, req, res, response);
      } else {
        res.json({
          status: false,
          code: 204,
          message: messages.RELEAECONFIG_ERR_MSG[5],
        });
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  async deleteConfig(result, req, res, response) {
    try {
      req.body={};
      result.status = constants.CICD_STATUS_INACTIVE;
      result.lastupdateddt = Date.now();
      result.ConfigDetail = _.map(result.ConfigDetail, (itm) => {
        itm.tenantid = result.tenantid;
        itm.createdby = result.createdby;
        itm.createddt = Date.now();
        itm.lastupdateddt = Date.now();
        result.lastupdatedby = req.query.lastUpdatedBy;
        itm.status = constants.CICD_STATUS_INACTIVE;

        itm.releasesetupdetailconfig = {
          id: itm.releasesetupdetailconfig.id,
          status: constants.CICD_STATUS_INACTIVE,
          createdby: result.createdby,
          lastupdateddt: Date.now(),
          lastupdatedby: req.query.lastUpdatedBy,
          createddt: Date.now(),
        };
        itm.releaseconfighdrid = result.id;

        return itm;
      });
      result.status = constants.CICD_STATUS_INACTIVE;
      result.lastupdateddt = Date.now();
      result.lastupdatedby = req.query.lastUpdatedBy;
      result.createddt = Date.now();

      let options = {
        include: [
          {
            model: db.ReleaseConfigDetail,
            as: "ConfigDetail",
            include: [
              {
                model: db.ReleaseSetupConfig,
                as: "releasesetupdetailconfig",
              },
            ],
          },
        ],
      };
      await commonService
        .updateWithAssociation(result, options, db.ReleaseConfig, req.params.id)
        .then((data) => {
          res.json({
            status: true,
            code: 200,
            message: messages.DELETE_SUCCESS,
          });
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async  orchestrationApproval(req: Request,res : Response) {
    try {
      const response = "";   
      res.status(200).send(response) ;
    } catch (error) {
      console.log(error);
    }
  }

  async  approvalWorkflow(req: Request,res : Response) {
    try {
    const response =  "";
    res.status(200).send(response) ;

    } catch (error) {
      console.log( error);
    }
  }

}

export default new Controller();

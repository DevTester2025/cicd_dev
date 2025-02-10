import CommonService from "../../../services/common.service";
import { Request, Response } from "express";
import { modules } from "../../../../common/module";
import db from "../../../models/model";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import * as _ from "lodash";
import { Op } from "sequelize";
import { basicValidation } from "../cicdcommon/validation";
import { messages } from "../../../../common/messages";
import notificationWatchListService from "../../../services/watchlist.service"
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
export class Controller {
  //create pipeline template
  async create(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.PIPELINETEMPLATE };

    try {
      customValidation.isMandatoryString(req.body.createdby, 'createdby', 3, 50);
      customValidation.isMandatoryString(req.body.pipelinename, 'pipelinename', 3, 50);
      customValidation.isMandatoryString(req.body.providerrepo, 'providerrepo', 3, 50);
      customValidation.isMandatoryString(req.body.providerbranch, 'providerbranch', 3, 50);
      customValidation.isMandatoryString(req.body.filename, 'filename', 3, 50);
      customValidation.isOptionalString(req.body.description, 'description', 3, 500);
      customValidation.isMandatoryLong(req.body.tenantid, "tenantid", 1, 11);
      customValidation.isMandatoryLong(req.body.runnerid, "runnerid", 1, 11);
      if (Object.keys(req.body.pipelineflow).length == 0) {
        res.json({
          status: false,
          code: 204,
          message: messages.PIPELINETEMPLATE_ERR_MSG[1]
        });
        return;
      }
      if (Object.keys(req.body.pipelinedetails).length == 0) {
        res.json({
          status: false,
          code: 204,
          message: messages.PIPELINETEMPLATE_ERR_MSG[2]
        });
        return;
      }
      if (!Array.isArray(req.body.ntfcsetupid) || req.body.ntfcsetupid.length === 0) {
        res.json({
          status: false,
          code: 204,
          message: messages.PIPELINETEMPLATE_ERR_MSG[5]
        });
        return;
      }
      req.body.pipelinetemplatedetails = _.map(req.body.pipelinedetails, (itm) => {
        customValidation.isMandatoryString(itm.providerjobname, 'providerjobname', 0, 50);
        customValidation.isMandatoryLong(itm.position, 'position', 1, 11);
        customValidation.isMandatoryLong(itm.referenceid, 'referenceid', 1, 11);
        customValidation.isMandatoryString(itm.referencetype, 'referencetype', 3, 50);
        customValidation.isOptionalString(itm.description, 'description', 1, 500)

        itm.tenantid = req.body.tenantid;
        itm.createdby = req.body.createdby;
        itm.createddt = Date.now();
        itm.lastupdateddt = Date.now();
        itm.status = constants.STATUS_ACTIVE;
        if(itm.providerjobname == 'BUILD_SCRIPT')
          {
            basicValidation.isMandatoryScript(itm.setupdetails.buildscript, "Build Script");
          }   
        if (
          itm.providerjobname === "DOCKERHUB" ||
          itm.providerjobname == "BUILD_SCRIPT"
        ) {
          if (itm.meta && Array.isArray(itm.meta)) {
            itm.meta.forEach((metaData) => {
              // Settings Tab validation
              if (metaData.settings) {
                const settings = metaData.settings;
                // Deployment Option
                basicValidation.isString(settings.type, "Deployment Type");
                if (settings.type === "C") {
                  basicValidation.canaryPercentage(
                    settings.frequency,
                    "Frequency"
                  );
                }
                if (settings.type === "BG") {
                  basicValidation.isNumber(settings.accounts, "Account");
                  basicValidation.isNumber(settings.customers, "Customer");
                  basicValidation.isNumber(settings.tag, "Tag");
                  basicValidation.isString(settings.tagValue, "Tag Value");
                  basicValidation.isArray(settings.instance, "Instance");
                }

                // Backup Artifacts
                if (settings.storagetype === "FTP") {
                  basicValidation.ValidIP(settings.ip, "FTP IP");
                  basicValidation.isvalidate(settings.username, "FTP Username");
                  basicValidation.isvalidate(settings.password, "FTP Password");
                }
                if (settings.storagetype === "Storage_Object") {
                  basicValidation.isvalidate(
                    settings.provider,
                    "Storage Object Provider"
                  );
                  basicValidation.isvalidate(
                    settings.bucket_name,
                    "Storage Object Bucket Name"
                  );
                  basicValidation.isMandatoryURL(
                    settings.endpoint,
                    "Storage Object Endpoint",
                    10,
                    500
                  );
                  basicValidation.isValidRemoteDirectory(
                    settings.folder_location,
                    "Storage Object"
                  );
                  basicValidation.isvalidate(
                    settings.region,
                    "Storage Object Region"
                  );
                  basicValidation.isvalidate(
                    settings.access_key,
                    "Storage Object Access Key"
                  );
                  basicValidation.isvalidate(
                    settings.secret_key,
                    "Storage Object Secret Key"
                  );
                }
              }
              // Rollback & Retries Tab validation
              if (metaData.rollback_retries) {
                const rollback_retries = metaData.rollback_retries;
                basicValidation.isString(
                  rollback_retries.rollbackOption,
                  "Rollback Option"
                );
                basicValidation.retryMandatoryField(
                  rollback_retries.retryTimeInterval,
                  "Time Interval -"
                );
                basicValidation.retryMandatoryField(
                  rollback_retries.retryCount,
                  "Count -"
                );
                if (rollback_retries.rollbackOption === "orchestrator") {
                  basicValidation.isNumber(
                    rollback_retries.orchestrator,
                    "orchid"
                  );
                }
                if (rollback_retries.rollbackMethod === "notify") {
                  basicValidation.isArray(
                    rollback_retries.notifiers,
                    "Notifier"
                  );
                }
              }

              // Compliance
              if (metaData.compliances) {
                const compliances = metaData.compliances;
                compliances.forEach((data) => {
                  basicValidation.isString(data.type, "Alert Type");
                  basicValidation.isArray(data.notifiers, "Notifiers");
                  basicValidation.isArray(data.configuration, "Configuration");
                });
              }
            });
          }
        }
        //T5549-Integration tab validation
        if (
          itm.providerjobname === "SONARQUBE" ||
          itm.providerjobname == "SELENIUM" ||
          itm.providerjobname === "JUNIT" ||
          itm.providerjobname === "JMETER"
        ) {
          if (itm.meta && Array.isArray(itm.meta)) {
            itm.meta.forEach((metaData) => {
              if (metaData.integration) {
                let integrationObject = metaData.integration;
                basicValidation.isNumber(integrationObject.tools, "Tool");
              }
            });
          }
        }
        // Notification Tab validation
        if (itm.meta && Array.isArray(itm.meta)) {
          itm.meta.forEach((metaData) => {
            if (metaData.notifications) {
              const notification = metaData.notifications;
              notification.forEach((data) => {
                basicValidation.isString(data.type, "Event Type");
                basicValidation.isArray(data.notifiers, "Notifiers");
                if (data.type === "Failure") {
                  basicValidation.isArray(data.configuration, "Configuration");
                }
              });
            }
          });
        }
        itm.templatedetailconfig = {
          // providerjobname: req.body.providerjobname,
          setupdetails: itm.setupdetails,
          scriptcontent:itm.scriptcontent,
          tenantid: req.body.tenantid,
          meta: itm.meta,
          status: constants.STATUS_ACTIVE,
          createdby: req.body.createdby,
          lastupdateddt: Date.now(),
          createddt: Date.now(),
        };
        itm.templatedetailid = 0; // req.body.templatedetailid,
        itm.templateid = 0;

        return itm;
      });
      const existingPipeline = await db.PipelineTemplate.findOne({
        where: {
          tenantid: req.body.tenantid,
          pipelinename: req.body.pipelinename,
          status: constants.STATUS_ACTIVE
        },
      });
      if (existingPipeline) {
        res.json({
          status: false,
          code: 204,
          message: messages.PIPELINETEMPLATE_ERR_MSG[3]
        });
      } else {
        req.body.filename = req.body.pipelinename;
        req.body.status = constants.STATUS_ACTIVE;
        req.body.lastupdateddt = Date.now();
        req.body.createddt = Date.now();

        let options = {
          include: [
            {
              model: db.PipelineTemplateDetails,
              as: "pipelinetemplatedetails",
              include: [
                {
                  model: db.PipelineTemplateDetailConfiguration,
                  as: "templatedetailconfig",
                },
              ],
            },
          ],
        };
       CommonService.saveWithAssociation(
          req.body,
          options,
          db.PipelineTemplate
        )
          .then(async (data) => {
            const id = data.id;
              try {
                await notificationWatchListService.createWatchList(req.body.ntfcsetupid, data);
              } catch(error) {
                console.log("Error getting notification details", error)
              };
            try {
              await CommonService.create(
                {
                  resourcetypeid: data["id"],
                  resourcetype: constants.RESOURCETYPE[0],
                  _tenantid: data["tenantid"],
                  new: constants.HISTORYCOMMENTS[0],
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
              { id },
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
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  //pipeline template list
  async all(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.PIPELINETEMPLATE };
    function serializeRow(row: any): any {
      return {
        ...row.toJSON(),
      };
    }
    try {
      new Controller().basicValidation(req.query.tenantid, req.query.startDate, req.query.endDate,)
      let defaultTemplate = Number(req.query.isdefault);
      let parameters = {
        where: { tenantid: req.query.tenantid },
        order: [['lastupdateddt', 'DESC']]
      };
      if (!isNaN(defaultTemplate)) {
        if (defaultTemplate === 1) {  
          parameters.where["isdefault"] = 1;
        } else {
          parameters.where["isdefault"] = 0;
        }
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
      if (req.query.limit) {
        parameters["limit"] = req.query.limit;
      }
      if (req.query.offset) {
        parameters["offset"] = req.query.offset;
      }

      if (req.query.pipelinename) {
        parameters.where["pipelinename"] = {
          [Op.like]: `%${req.query.pipelinename}%`
        };
      }
      if (req.query.status) {
        parameters.where["status"] = req.query.status;
      }
      if (
        typeof req.query.searchText === "string" &&
        req.query.searchText.trim() !== ""
      ) {
        const searchText = req.query.searchText.trim();
        const searchCondition = {
          [Op.or]: [
            { pipelinename: { [Op.like]: `%${searchText}%` } },
          ],
        };
        parameters.where = { ...parameters.where, ...searchCondition };
      }
      if (req.query.count) {
        CommonService
          .getCountAndList(parameters, db.PipelineTemplate)
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
      }
      else if (req.query.isdownload) {
        const { tenantid } = req.query;
        parameters.where = {
            tenantid, 
            ..._.omit(req.body, ["headers", "order"])
        };
        CommonService.getAllList(parameters, db.PipelineTemplate)
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
        CommonService.getAllList(parameters, db.PipelineTemplate)
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
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  // get pipeline template detail by id
  async byId(req: Request, res: Response): Promise<void> {
    let response = { reference: modules.PIPELINETEMPLATE };
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      const getCRN = await db.PipelineTemplate.findOne({
        where: {
          tenantid: process.env.ON_PREM_TENANTID,
          id: req.params.id,
          status: constants.STATUS_ACTIVE
        },
      });
      const pipelineData = JSON.parse(JSON.stringify(getCRN))
      let parameters = {
        id: req.params.id,
        include: [
          {
            model: db.PipelineTemplateDetails,
            as: "pipelinetemplatedetails",
            where: { templateid: req.params.id, status: constants.STATUS_ACTIVE },
            include: [
              {
                model: db.PipelineTemplateDetailConfiguration,
                as: "templatedetailconfig",
              }
            ]
          },
          {
            model: db.WatchList,
            as: "notificationwatchlist",
            required: false,
            where: { refid: req.params.id, status: constants.STATUS_ACTIVE },
            include: [
              {
                model: db.notificationsetup,
                as: 'notificationSetup',
                required: false,
                include: [
                  {
                    model: db.Templates,
                    as: 'templates',
                    required: false
                  }
                ]
              }
            ],
          },
          {
          model: db.AssetsHdr,
          as: "pipelineassethdr",
          required: false,
          where: { 
            crn: pipelineData.crn, 
            status: constants.STATUS_ACTIVE }
          },
        ]

      };
      CommonService.getData(parameters, db.PipelineTemplate)
        .then((data) => {
          const upsertJobDetails: any[] = [];
          const ntfcSetupDetails: any[] = [];
          const assetHdrDetails: any[] = [];
          data.notificationwatchlist.map((dtls)=> {
            let templateObj;
            if (dtls.notificationSetup.templates) {
              templateObj = {
                templateid: dtls.notificationSetup.templates.templateid,
                template: dtls.notificationSetup.templates.template,
                title: dtls.notificationSetup.templates.title,
                description: dtls.notificationSetup.templates.description,
                status: dtls.notificationSetup.templates.status,
              }
            }
            let notificationSetup = {
              ntfcsetupid: dtls.notificationSetup.ntfcsetupid,
              tenantid: dtls.notificationSetup.tenantid,
              templateid: dtls.notificationSetup.templateid,
              module: dtls.notificationSetup.module,
              event: dtls.notificationSetup.event,
              ntftype: dtls.notificationSetup.ntftype,
              template: dtls.notificationSetup.template,
              receivers: dtls.notificationSetup.receivers,
              notes: dtls.notificationSetup.notes,
              status: dtls.notificationSetup.status,
              templates: templateObj
            }
            let dtlsObj = {
              id: dtls.id,
              ntfcsetupid: dtls.ntfcsetupid,
              refid: dtls.refid,
              reftype: dtls.reftype,
              tenantid: dtls.tenantid,
              status: dtls.status,
              createdby: dtls.createdby,
              createddt: dtls.createddt,
              lastupdatedby: dtls.lastupdatedby,
              lastupdateddt: dtls.lastupdateddt,
              notificationSetup: notificationSetup
            }
            ntfcSetupDetails.push(dtlsObj)
          })
          data.pipelinetemplatedetails.map((detail) => {
            let configObj;
            if (detail.templatedetailconfig) {
              configObj = {
                id: detail.templatedetailconfig.id,
                tenantid: detail.templatedetailconfig.tenantid,
                templatedetailid: detail.templatedetailconfig.templatedetailid,
                scriptcontent: detail.templatedetailconfig.scriptcontent,
                setupdetails: JSON.parse(detail.templatedetailconfig.setupdetails),
                meta: JSON.parse(detail.templatedetailconfig.meta),
                variabledetails: detail.templatedetailconfig.variabledetails,
                status: detail.templatedetailconfig.status,
                description: detail.templatedetailconfig.description,
                createdby: detail.templatedetailconfig.createdby,
                createddt: detail.templatedetailconfig.createddt,
                lastupdatedby: detail.templatedetailconfig.lastupdatedby,
                lastupdateddt: detail.templatedetailconfig.lastupdateddt
              }
            }
            let obj = {
              id: detail.id,
              tenantid: detail.tenantid,
              position: detail.position,
              referencetype: detail.referencetype,
              referenceid: detail.referenceid,
              templateid: detail.templateid,
              providerjobname: detail.providerjobname,
              status: detail.status,
              description: detail.description,
              createdby: detail.createdby,
              createddt: detail.createddt,
              lastupdatedby: detail.lastupdatedby,
              lastupdateddt: detail.lastupdateddt,
              templatedetailconfig: configObj
            }
            upsertJobDetails.push(obj)
          });

          data.pipelineassethdr.map((dtls)=>{
            let workpackObj = {
         id: dtls.id,
         crn: dtls.crn,
         resourcetype:dtls.resourcetype,
         fieldkey: dtls.fieldkey,
         tenantid: dtls.tenantid,
         status: dtls.status,
         createdby: dtls.createdby,
         createddt: dtls.createddt,
         lastupdatedby: dtls.lastupdatedby,
         lastupdateddt: dtls.lastupdateddt,
       }
         assetHdrDetails.push(workpackObj);
       })
          let dataobj = {
            id: data.id,
            tenantid: data.tenantid,
            pipelinename: data.pipelinename,
            description: data.description,
            runnerid: data.runnerid,
            providerrepo: data.providerrepo,
            providerbranch: data.providerbranch,
            filename: data.filename,
            pipelineflow: JSON.parse(data.pipelineflow),
            status: data.status,
            createdby: data.createdby,
            createddt: data.createddt,
            lastupdatedby: data.lastupdatedby,
            lastupdateddt: data.lastupdateddt,
            isdefault: data.isdefault,
            crn:data.crn,
            pipelinetemplatedetails: upsertJobDetails,
            notificationwatchlist: ntfcSetupDetails,
            pipelineassethdr: assetHdrDetails,
          }
          customValidation.generateSuccessResponse(
            dataobj,
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

  //Update PipelineTemplate
  async update(req: Request, res: Response): Promise<void> {
    let response = {};
    try {
      customValidation.isMandatoryLong(req.params.id, "id", 1, 11);
      customValidation.isMandatoryLong(req.body.tenantid, "tenantid", 1, 11);
      customValidation.isMandatoryString(req.body.lastupdatedby, "lastupdatedby", 3, 50);
      customValidation.isMandatoryString(req.body.pipelinename, "pipelinename", 3, 50);
      customValidation.isMandatoryString(req.body.pipelinename, "providerrepo", 3, 50);
      customValidation.isMandatoryString(req.body.pipelinename, "providerbranch", 3, 50);

      if (!Array.isArray(req.body.ntfcsetupid) || req.body.ntfcsetupid.length === 0) {
        res.json({
          status: false,
          code: 204,
          message: messages.PIPELINETEMPLATE_ERR_MSG[5] 
        });
        return;
      }

      const data = await db.PipelineTemplate.findAll({
        where: {
          tenantid: req.body.tenantid,
          status: constants.STATUS_ACTIVE,
        },
      });
      if (data && data.length > 0) {
        const pipelineTemp = JSON.parse(JSON.stringify(data));

        const templateId = pipelineTemp.find(
          (element: any) => element.id == req.params.id
        );

        if (!templateId) {
          res.json({
            status: false,
            code: 204,
            message: messages.PIPELINETEMPLATE_ERR_MSG[1],
          });
          return
        }
        let templateByName;
        if (req.body.pipelinename && typeof req.body.pipelinename === 'string') {
          templateByName = pipelineTemp.find(element => element.pipelinename === req.body.pipelinename.trim());
        } 

        // Check if a pipelinename exists but with a different ID
        if (templateByName && templateByName.id !== templateId.id) {
          res.json({
            status: false,
            code: 204,
            message: messages.PIPELINETEMPLATE_ERR_MSG[3],
          });
          return;
        } 
        await new Controller(). updateTemplateDetail(data, res, req,response, req.body.ntfcsetupid);
      }
      else {
        res.json({
          status: false,
          code: 204,
          message: messages.PIPELINETEMPLATE_ERR_MSG[1],
        });
        return;
      }
    }
    catch (e) {
      customValidation.generateAppError(e, response, res, req);
      return;
    }
  }

async updateTemplateDetail(data, res, req,response, ntfcsetupid){
try{
  const result = data.find((pipeline) => pipeline.id == req.params.id);
  if (result) {
    req.body.lastupdateddt = Date.now();
    req.body.pipelinetemplatedetails = _.map(req.body.pipelinetemplatedetails, (itm) => {
      customValidation.isMandatoryString(itm.providerjobname,"providerjobname",0,50);
      customValidation.isMandatoryLong(itm.position, "position", 1, 11);
      customValidation.isMandatoryLong(itm.referenceid,"referenceid",1,11);
      customValidation.isMandatoryString(itm.referencetype,"referencetype",3,50);
      customValidation.isOptionalString(itm.description,"description",1,500);
      itm.tenantid = req.body.tenantid;
      itm.createdby = req.body.createdby;
      itm.createddt = Date.now();
      itm.lastupdateddt = Date.now();
      if(itm.providerjobname == 'BUILD_SCRIPT')
        {
          basicValidation.isMandatoryScript(itm.templatedetailconfig.setupdetails.buildscript, "Build Script");
        }
      itm.templatedetailconfig = {
        id: itm.templatedetailconfig.id,
        templatedetailconfig:
        itm.templatedetailconfig.templatedetailconfig,
        setupdetails: itm.templatedetailconfig.setupdetails,
        scriptcontent: itm.templatedetailconfig.scriptcontent,
        tenantid: req.body.tenantid,
        status:itm.templatedetailconfig.status,
        createdby: req.body.createdby,
        lastupdateddt: Date.now(),
        createddt: Date.now(),
      };

      return itm;
    });
    req.body.lastupdateddt = Date.now();
    req.body.createddt = Date.now();

    let options = {
      include: [
        {
          model: db.PipelineTemplateDetails,
          as: "pipelinetemplatedetails",
          include: [
            {
              model: db.PipelineTemplateDetailConfiguration,
              as: "templatedetailconfig",
            },
          ],
        },
      ],
    };
    CommonService
      .updateWithAssociationPipeline(
        req.body,
        options,
        db.PipelineTemplate,
        req.params.id
      )
      .then(async (data) => {
        const id = data.id;
        try {
          await notificationWatchListService.createWatchList(ntfcsetupid, data);
        }catch (error) {
          console.log("Error getting notification details", error);
        }
        try {
          await CommonService.create(
            {
              resourcetypeid: data["id"],
              resourcetype: constants.RESOURCETYPE[0],
              _tenantid: data["tenantid"],
              new: constants.HISTORYCOMMENTS[1],
              affectedattribute: constants.AFFECTEDATTRIBUTES[0],
              status: constants.STATUS_ACTIVE,
              createdby: data["lastupdatedby"],
              createddt: new Date(),
              updatedby: null,
              updateddt: null,
            },
            db.History
          );
        }catch(error) {
          console.log(`Failed to updating history`, error)
        }
        customValidation.generateSuccessResponse(
          { id },
          response,
          constants.RESPONSE_TYPE_UPDATE,
          res,
          req
        );
      });
  }else{
    res.json({
            status: false,
            code: 204,
            message: messages.PIPELINETEMPLATE_ERR_MSG[1],
          });
  }
}catch (e) {
  customValidation.generateAppError(e, response, res, req);
}

}
  basicValidation(tenant, startDt, endDt) {
    customValidation.isMandatoryLong(tenant, 'tenantid', 1, 11);
    basicValidation.isMandatoryDate(startDt, constants.DATE_FORMAT, "startDate");
    basicValidation.isMandatoryDate(endDt, constants.DATE_FORMAT, "endtDate");
    basicValidation.ValidRange(startDt, endDt, "Date");

  }
}

export default new Controller();

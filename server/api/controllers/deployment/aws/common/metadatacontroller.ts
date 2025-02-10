import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants, ECLApiURL } from "../../../../../common/constants";
import * as _ from "lodash";
import { AppError } from "../../../../../common/appError";
import * as moment from "moment";
import AwsController from "../../aws/common/controller";
import AppLogger from "../../../../../lib/logger";

var AWS = require("aws-sdk");

export class Controller {
  constructor() {
    //
  }

  metadata(req: Request, res: Response): void {
    let filename =
      "aws_tag_update" + commonService.generateRandomNumber(10) + ".log";
    let logger = new AppLogger(process.cwd() + `/logs/`, filename);

    let parameters = {} as any;
    let response = {};
    parameters = {
      where: {
        tenantid: req.body.tenantid,
        status: constants.STATUS_ACTIVE,
        fieldlabel: { $in: ["CLOUD_DETAILS"] },
      },
    };
    commonService.getAllList(parameters, db.CustomField).then((list) => {
      if (null == list || list.size === 0) {
        customValidation.generateAppError(
          new AppError(
            constants.AWS_INVALID_CREDENTIALS.replace("{region}", "")
          ),
          response,
          res,
          req
        );
        logger.writeLogToFile(
          "info",
          constants.AWS_INVALID_CREDENTIALS.replace("{region}", "")
        );
        new Controller().uploadLog(filename, req.body.tenantid);
      }
      let clouddetails = _.find(list, function (data: any) {
        if (data.fieldlabel === "CLOUD_DETAILS") {
          data.fieldvalue = commonService.decrypt(data.fieldvalue);
          return data;
        }
      });
      if (_.isEmpty(clouddetails) || _.isEmpty(clouddetails.fieldvalue)) {
        customValidation.generateAppError(
          new AppError(
            constants.AWS_INVALID_CREDENTIALS.replace(
              "{region}",
              req.body.region
            )
          ),
          response,
          res,
          req
        );
        logger.writeLogToFile(
          "info",
          constants.AWS_INVALID_CREDENTIALS.replace("{region}", req.body.region)
        );
        new Controller().uploadLog(filename, req.body.tenantid);
      }
      let ecl2cloud = _.find(
        JSON.parse(clouddetails.fieldvalue),
        function (data: any) {
          if (data.cloudprovider === constants.CLOUD_AWS) {
            return data;
          }
        }
      );
      if (
        _.isEmpty(ecl2cloud) ||
        _.isEmpty(ecl2cloud.cloudauthkey) ||
        _.isEmpty(ecl2cloud.cloudseckey)
      ) {
        customValidation.generateAppError(
          new AppError(
            constants.AWS_INVALID_CREDENTIALS.replace(
              "{region}",
              req.body.region
            )
          ),
          response,
          res,
          req
        );
        logger.writeLogToFile(
          "info",
          constants.AWS_INVALID_CREDENTIALS.replace("{region}", req.body.region)
        );
        new Controller().uploadLog(filename, req.body.tenantid);
      } else {
        new Controller().createTag(req, res, ecl2cloud, logger, filename);
      }
    });
  }

  async syncTags(req: Request, res: Response) {
    //parameters to get data from AWS
    var params = {
      Filters: [
        {
          Name: "resource-id",
          Values: [
            req.body.refid
          ]
        }
      ]
    };
    //parameters to get data region table
    let condition = {
      where: { tnregionid: req.body.tnregionid },
      include: [
        {
          as: "accountdata",
          model: db.CustomerAccount,
          required: false,
          attributes: ["rolename"],
          where: { status: constants.STATUS_ACTIVE },
        },
      ],
    };
    //parameters to get credentials of AWS account
    let parameters = {
      where: {
        tenantid: req.body.tenantid,
        status: constants.STATUS_ACTIVE,
        fieldlabel: { $in: ["CLOUD_DETAILS"] },
      },
    };
    try {
      //get credentials from custom fields table 
      const list: any = await commonService.getAllList(parameters, db.CustomField);
      let clouddetails = await _.find(list, function (data: any) {
        if (data.fieldlabel === "CLOUD_DETAILS") {
          data.fieldvalue = commonService.decrypt(data.fieldvalue);
          return data;
        }
      });
      let ecl2cloud = await _.find(
        JSON.parse(clouddetails.fieldvalue),
        function (data: any) {
          if (data.cloudprovider === constants.CLOUD_AWS) {
            return data;
          }
        }
      );
      if (ecl2cloud && ecl2cloud.cloudauthkey && ecl2cloud.cloudseckey) {
        //get regions data 
        let regionData: any = await commonService.getData(condition, db.TenantRegion);
        regionData = JSON.parse(JSON.stringify(regionData));
        //get cross account credentials if account is IAM
        const acl = await AwsController.getCrossAccountCredentials(ecl2cloud, req.body.region, regionData.tenantrefid, regionData.accountdata ? regionData.accountdata.rolename : null);
        AWS.config.update(acl);
        var ec2service = new AWS.EC2({
          apiVersion: constants.AWS_EC2_APIVERSION,
        });
        ec2service.describeTags(params, function (err, data) {
          if (err) console.log(err, err.stack);
          else {
            new Controller().createAssetTags(req, res, data);
          }
        });
      }
    } catch (e) {
      customValidation.generateAppError(e, {}, res, req);
    }
  }
  async createAssetTags(req, res, tags) {
    let tagvalues = [];
    let params = {
      replacements: {
        tenantid: req.body.tenantid
      },
    };
    let tvParams = {
      where: { resourcerefid: req.body.refid, status: constants.STATUS_ACTIVE }, include: [
        {
          as: "tag",
          model: db.Tags
        },
      ],
    };
    await commonService.update({ resourcerefid: req.body.refid }, { status: constants.DELETE_STATUS }, db.TagValues);
    for (let element of tags.Tags) {
      let tag = {
        tenantid: req.body.tenantid,
        cloudprovider: constants.CLOUD_AWS,
        resourcetype: req.body.presourcetype,
        tagvalue: element.Value,
        resourcerefid: req.body.refid,
        resourceid: req.body.id,
        tnregionid: req.body.tnregionid,
        status: constants.STATUS_ACTIVE,
        createdby: req.body.username,
        createddt: new Date(),
        lastupdatedby: element.Key,
        lastupdateddt: new Date(),
      };
      tagvalues.push(tag);
    }
    await commonService.bulkCreate(tagvalues, db.TagValues);
    let query = `UPDATE tbl_bs_tag_values a
    set a.tagid = (select c.tagid from tbl_bs_tags c
    where c.tagname=a.lastupdatedby AND c.tenantid=${req.body.tenantid} LIMIT 1) :lastupdated: where resourcerefid = '${req.body.refid}' and status='${constants.STATUS_ACTIVE}'`;
    query = query.replace(":lastupdated:", ' ');
    await commonService.executeQuery(query, params, db.sequelize);
    let taglist = await commonService.getAllList({
      where: { resourcerefid: req.body.refid, tagid: null, status: constants.STATUS_ACTIVE },
      group: ["lastupdatedby"],
    }, db.TagValues);
    if (taglist && taglist.length > 0) {
      let newTaglist = [];
      for (let tag of taglist) {
        let obj = {
          tenantid: req.body.tenantid,
          //resourcetype: presourcetype,
          tagname: tag.lastupdatedby,
          tagtype: "text",
          status: constants.STATUS_ACTIVE,
          createdby: req.body.username,
          createddt: new Date(),
          lastupdatedby: req.body.username,
          lastupdateddt: new Date(),
        };
        newTaglist.push(obj);
      }
      await commonService.bulkCreate(newTaglist, db.Tags);
      query = query.replace(":lastupdated:", `,lastupdatedby=${req.body.username}`);
      await commonService.executeQuery(query, params, db.sequelize);
      let newTags = await commonService.getAllList(tvParams, db.TagValues);
      customValidation.generateSuccessResponse(newTags, {}, constants.RESPONSE_TYPE_SAVE, res, req);
    } else {
      let newTags = await commonService.getAllList(tvParams, db.TagValues);
      customValidation.generateSuccessResponse(newTags, {}, constants.RESPONSE_TYPE_SAVE, res, req);
    }
  }
  createTag(
    req: Request,
    res: Response,
    ecl2cloud: any,
    logger: AppLogger,
    filename: any
  ): void {
    logger.writeLogToFile(
      "info",
      "Started to create AWS Tags:::::::::::::::::::::"
    );
    logger.writeLogToFile("info", `Initiated by user ${req.body.createdby}`);
    let instancedtl = "";
    let tagdtl = "";
    if (req.body.assets && req.body.assets.length > 0) {
      req.body.assets.forEach((el) => {
        instancedtl += ` ${el.refid}(${el.region}) `;
      });
    }
    if (req.body.tagvalues && req.body.tagvalues.length > 0) {
      req.body.tagvalues.forEach((el) => {
        tagdtl += ` ${el.tagname} : ${el.tagvalue} `;
      });
    }
    logger.writeLogToFile("info", `Updating tags for  ${instancedtl}`);
    logger.writeLogToFile("info", `The tag values are  ${tagdtl}`);
    let response = {};
    try {
      let tagvalues: any = [];
      let index = 0;
      syncTags();
      function syncTags() {
        let object = req.body.assets[index];
        var params = {
          Resources: [object.refid],
          Tags: [],
        };
        req.body.tagvalues.forEach((element) => {
          let tag = {
            Key: element.tagname,
            Value: element.tagvalue,
          };
          params.Tags.push(tag);
        });
        let condition = {
          where: { tnregionid: object.tnregionid },
          include: [
            {
              as: "accountdata",
              model: db.CustomerAccount,
              required: false,
              attributes: ["rolename"],
              where: { status: constants.STATUS_ACTIVE },
            },
          ],
        };
        commonService.getData(condition, db.TenantRegion).then((regionData) => {
          regionData = JSON.parse(JSON.stringify(regionData));
          AwsController.getCrossAccountCredentials(
            ecl2cloud,
            object.region,
            regionData.tenantrefid,
            regionData.accountdata ? regionData.accountdata.rolename : null
          ).then(async (acl) => {
            AWS.config.region = object.region;
            AWS.config.update(acl);
            logger.writeLogToFile(
              "info",
              `Started to update tages for instance ${params.Resources[0]}`
            );
            // Create EC2 service object
            logger.writeLogToFile(
              "info",
              "AWS Tag parameters:::::::::::::::::::::"
            );
            logger.writeLogToFile("info", params);
            var ec2service = new AWS.EC2({
              apiVersion: constants.AWS_EC2_APIVERSION,
            });
            if (req.query.retain) {
              ec2service.deleteTags(
                { Resources: params.Resources },
                (err, data) => {
                  if (err) {
                    if (err.statusCode == 403) {
                      err = new AppError(
                        "You are not authorized to perform this operation"
                      );
                      logger.writeLogToFile(
                        "info",
                        "You are not authorized to perform this operation"
                      );
                    }
                    customValidation.generateAppError(err, response, res, req);
                    logger.writeLogToFile("error", err);
                  } else {
                    createTags();
                  }
                }
              );
            } else {
              createTags();
            }
            function createTags() {
              ec2service.createTags(params, function (err, data) {
                if (err) {
                  logger.writeLogToFile(
                    "error",
                    err["code"] || "Unable to update tag"
                  );
                  if (err.statusCode == 400) {
                    err = new AppError(err["code"] || "Unable to update tag");
                    logger.writeLogToFile(
                      "error",
                      err["code"] || "Unable to update tag"
                    );
                  }
                  if (err.statusCode == 403) {
                    err = new AppError(
                      "You are not authorized to perform this operation"
                    );
                    logger.writeLogToFile(
                      "error",
                      "You are not authorized to perform this operation"
                    );
                  }
                  if (err.code == "InvalidParameterValue") {
                    err = new AppError("Tag key is not valid");
                    logger.writeLogToFile("error", "Tag key is not valid");
                  }
                  customValidation.generateAppError(err, response, res, req);
                } else {
                  let metadata: any = [];
                  //metadata = req.body.tagvalues;
                  var condition = {
                    Filters: [
                      {
                        Name: "resource-id",
                        Values: [],
                      },
                    ],
                  };
                  condition.Filters[0].Values.push(object.refid);
                  ec2service.describeTags(condition, function (err, data) {
                    console.log(err);
                    console.log(data);
                    if (data && data.Tags.length > 0) {
                      metadata = data.Tags;
                      new Controller().buildTagValue(
                        req,
                        res,
                        response,
                        metadata,
                        object,
                        tagvalues,
                        req.body.resourcetype,
                        logger
                      );
                    }
                    logger.writeLogToFile(
                      "info",
                      "***************************************************** Success *****************************************************"
                    );
                    logger.writeLogToFile(
                      "info",
                      `Tag values updated for instance ${params.Resources[0]}`
                    );
                    index = index + 1;
                    if (req.body.assets.length == index) {
                      new Controller().uploadLog(filename, req.body.tenantid);
                      setTimeout(function () {
                        customValidation.generateSuccessResponse(
                          {},
                          response,
                          constants.RESPONSE_TYPE_SAVE,
                          res,
                          req
                        );
                      }, 1000);
                    } else {
                      syncTags();
                    }
                  });
                }
              });
            }
          });
        });
      }
    } catch (e) {
      logger.writeLogToFile("error", e);
      new Controller().uploadLog(filename, req.body.tenantid);
      customValidation.generateAppError(e, response, res, req);
    }
  }
  saveTagValues(
    req: Request,
    res: Response,
    response: any,
    username: any,
    tagvalues: any,
    presourcetype: any,
    object: any,
    logger: AppLogger
  ): void {
    let condition = {
      resourcetype: req.body.resourcetype,
      cloudprovider: constants.CLOUD_AWS,
      resourceid: object.id,
      tnregionid: object.tnregionid,
      status: constants.STATUS_ACTIVE,
    };
    commonService
      .update(condition, { status: constants.DELETE_STATUS }, db.TagValues)
      .then((data) => {
        console.log("---------------------------------------------------------------------------------------------------");
        console.log(tagvalues);
        console.log("---------------------------------------------------------------------------------------------------");
        commonService
          .bulkCreate(tagvalues, db.TagValues)
          .then((data) => {
            let query = `UPDATE tbl_bs_tag_values a 
                set a.tagid = (select c.tagid from tbl_bs_tags c 
                where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                a.resourcerefid=(select c.instancerefid from tbl_tn_instances c 
                    where c.instanceid=:resourceid  LIMIT 1),
                a.createdby=:username,
                a.lastupdatedby=:username
                WHERE a.tagid IS NULL AND a.tenantid=:tenantid AND a.resourcetype=:resourcetype`;
            let params = {
              replacements: {
                tenantid: req.body.tenantid,
                customerid: object.customerid,
                region: object.region,
                username: req.body.createdby,
                resourceid: object.id,
                resourcetype: presourcetype,
              },
            };
            commonService
              .executeQuery(query, params, db.sequelize)
              .then((list) => { })
              .catch((error: Error) => {
                logger.writeLogToFile("error", error);
                console.log(error);
              });
          })
          .catch((error: Error) => {
            logger.writeLogToFile("error", error);
            console.log(error);
          });
      })
      .catch((error: Error) => {
        logger.writeLogToFile("error", error);
        console.log(error);
      });
  }

  buildTagValue(
    req: Request,
    res: Response,
    response: any,
    metadata: any,
    object: any,
    tagvalues: any,
    presourcetype: any,
    logger: AppLogger
  ) {
    let existTags = req.body.tagvalues ? req.body.tagvalues : [];
    tagvalues = [];
    if (metadata && metadata.length > 0) {
      metadata.forEach((element) => {
        let resourceObj = existTags.find((val) => {
          return val.tagvalue == element.Value;
        });
        if (constants.DEFAULT_TAGS.indexOf(element.Key) == -1) {
          let tag = {
            tenantid: req.body.tenantid,
            cloudprovider: constants.CLOUD_AWS,
            resourcetype: presourcetype,
            resourceid: object.id,
            attributerefid: resourceObj ? resourceObj.attributerefid : "",
            tagvalue: element.Value,
            //tagid: element.tagid,
            status: constants.STATUS_ACTIVE,
            tnregionid: object.tnregionid,
            createdby: req.body.createdby,
            createddt: new Date(),
            lastupdatedby: element.Key,
            lastupdateddt: new Date(),
          };
          tagvalues.push(tag);
        }
      });
      new Controller().saveTagValues(
        req,
        res,
        response,
        req.body.createdby,
        tagvalues,
        req.body.resourcetype,
        object,
        logger
      );
    }
  }

  uploadLog(filename, tenantid) {
    console.log("Upload log to S3>>>>>");
    let eventObj = {
      tenantid: tenantid,
      module: "Tag Updates",
      referencetype: "S3",
      cloudprovider: constants.CLOUD_AWS,
      eventtype: "Tag Updates",
      //"severity": "Normal",
      severity: "Medium",
      eventdate: new Date(),
      notes: `<a href="${process.env.BASE_URL}/cloudmatiq/base/wazuh/file/TagSync/${filename}" target="_blank" style="color: rgb(216, 173, 0) !important; font-weight: bold" >Click here to download the file !</a >`,
      createddt: new Date(),
      createdby: "System",
      status: constants.STATUS_ACTIVE,
    };
    db.eventlog.create(eventObj);
    commonService.uploadFiletoS3(
      `${process.cwd()}/logs/${filename}`,
      `TagSync/${filename}`
    );
  }
}

export default new Controller();

import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants, ECLApiURL } from "../../../../../common/constants";
import * as _ from "lodash";
import * as moment from "moment";
import { AppError } from "../../../../../common/appError";
import AppLogger from "../../../../../lib/logger";

export class Controller {
  constructor() {
    //
  }

  metadata(req: Request, res: Response): void {
    let logger = new AppLogger(
      process.cwd() + `/logs/`,
      "ecl2_tag_update" + moment().format("hh_A") + ".log"
    );

    let response = {};
    try {
      let requesturl = "";
      let requestheader = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      let requestparams = {
        metadata: {},
      } as any;
      let requestmethod = "POST";
      let tagvalues = [];
      let assetids = [];
      let index = 0;
      if (
        req.body.resourcetype == constants.RESOURCE_TYPES[0] ||
        req.body.resourcetype == constants.RESOURCE_TYPES[1]
      ) {
        req.body.assets.forEach(async (object) => {
          //setTimeout(function () {
          index = index + 1;
          if (req.body.resourcetype == constants.RESOURCE_TYPES[0]) {
            requesturl = ECLApiURL.METADATA.NOVA_SERVER.replace(
              "{server_id}",
              object.refid
            );

            if (req.body.tagvalues) {
              req.body.tagvalues.forEach((element) => {
                requestparams.metadata[element.tagname] = element.tagvalue;
              });
            }
          }
          if (req.body.resourcetype == constants.RESOURCE_TYPES[1]) {
            requesturl = ECLApiURL.METADATA.NETWORK.replace(
              "{network_id}",
              object.refid
            );
            requestmethod = "PUT";
            requestparams = {
              network: {
                tags: {},
              },
            } as any;
            if (req.body.tagvalues) {
              req.body.tagvalues.forEach((element) => {
                requestparams.network.tags[element.tagname] = element.tagvalue;
              });
            }
          }

          //tagvalues = [];
          assetids.push(object.id);
          logger.writeLogToFile("info", "trying to create ECL2TAGS");
          new Controller().createECL2Tags(
            req,
            res,
            requestmethod,
            requesturl,
            requestheader,
            requestparams,
            response,
            tagvalues,
            index,
            object,
            assetids,
            logger
          );
          // }, 3000)
        });
      } else {
        customValidation.generateAppError(
          new AppError("Tagging feature not available for this asset type"),
          response,
          res,
          req
        );
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  createECL2Tags(
    req: Request,
    res: Response,
    requestmethod: any,
    requesturl: any,
    requestheader: any,
    requestparams: any,
    response: any,
    tagvalues: any,
    index: any,
    object: any,
    assetids: any,
    logger: AppLogger
  ) {
    logger.writeLogToFile("info", "ECL2 Reuqest params::::::::::::::::::::");
    logger.writeLogToFile("info", requestparams);

    commonService
      .callECL2Reqest(
        requestmethod,
        object.region,
        req.body.tenantid,
        requesturl,
        requestheader,
        requestparams,
        object.ecl2tenantid,
        logger
      )
      .then((ecl2data) => {
        if (req.body.assets.length == index) {
          let condition = {
            resourcetype: req.body.resourcetype,
            cloudprovider: constants.CLOUD_ECL,
            resourceid: { $in: assetids },
            tnregionid: req.body.tnregionid,
            status: constants.STATUS_ACTIVE,
          };
          logger.writeLogToFile("info", "trying to create ECL2TAGS");
          commonService
            .update(
              condition,
              { status: constants.DELETE_STATUS },
              db.TagValues
            )
            .then((data) => {
              setTimeout(function () {
                console.log(
                  "Tags updated on ECL2 >>>>>>>>>>>>>>>>>>>>>> Going to sync tags::::::::::::::::::::"
                );
                new Controller().syncTags(
                  req,
                  res,
                  tagvalues,
                  assetids,
                  logger
                );
              }, 100);
            })
            .catch((error: Error) => {
              customValidation.generateAppError(error, response, res, req);
            });
        }
      })
      .catch((error: Error) => {
        customValidation.generateAppError(error, response, res, req);
      });
  }

  syncTags(
    req: Request,
    res: Response,
    tagvalues: any,
    assetids: any,
    logger: AppLogger
  ) {
    console.log(
      ">>>>>>>>>>>>>>>>>>>>>>>>> Trying to sync tags::::::::::::::::"
    );
    logger.writeLogToFile("info", "trying to sync ECL2TAGS");
    let response = {};
    try {
      let index = 0;
      req.body.assets.forEach((object) => {
        let requesturl = "";
        let requestheader = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };
        let requestparams = {} as any;
        let requestmethod = "GET";
        let tquery = ``;
        let metadata: any = {};
        let refid = "";
        if (req.body.resourcetype == constants.RESOURCE_TYPES[0]) {
          requesturl = ECLApiURL.GET.SERVERS.replace(
            "{server_id}",
            object.refid
          );
        }
        if (req.body.resourcetype == constants.RESOURCE_TYPES[1]) {
          requesturl = ECLApiURL.METADATA.NETWORK.replace(
            "{network_id}",
            object.refid
          );
        }
        commonService
          .callECL2Reqest(
            requestmethod,
            object.region,
            req.body.tenantid,
            requesturl,
            requestheader,
            requestparams,
            object.ecl2tenantid
          )
          .then((ecl2data) => {
            if (req.body.resourcetype == constants.RESOURCE_TYPES[0]) {
              metadata = ecl2data.server.metadata;
              refid = ecl2data.server.id;
              tquery = `UPDATE tbl_bs_tag_values a 
                        set a.tagid = (select c.tagid from tbl_bs_tags c 
                        where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                        a.resourceid = (select c.instanceid from tbl_tn_instances c 
                        where c.instanceid=a.createdby  LIMIT 1),
                        a.createdby=:username,
                        a.lastupdatedby=:username
                        WHERE a.tagid IS NULL AND a.resourceid=:id AND a.resourcetype =:resourcetype`;
            }
            if (req.body.resourcetype == constants.RESOURCE_TYPES[1]) {
              metadata = ecl2data.network.tags;
              refid = ecl2data.network.id;
              tquery = `UPDATE tbl_bs_tag_values a 
                                set a.tagid = (select c.tagid from tbl_bs_tags c 
                                where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                                a.resourceid = (select c.networkid from tbl_ecl2_networks c 
                                where c.networkid=a.createdby LIMIT 1),
                                a.createdby=:username,
                                a.lastupdatedby=:username
                                WHERE a.tagid IS NULL  AND a.resourceid=:id AND a.resourcetype =:resourcetype`;
            }
            console.log(
              ">>>>>>>>>>>>>>>>>>>> Sync tags:::::::::::::::::::::::::"
            );
            console.log(metadata);
            logger.writeLogToFile(
              "info",
              ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>SYNC TAGS::::::::::::::::::::"
            );
            logger.writeLogToFile("info", metadata);
            new Controller().buildTagValue(
              req,
              res,
              response,
              metadata,
              tquery,
              object,
              tagvalues,
              req.body.resourcetype,
              refid,
              logger
            );

            index = index + 1;
            if (req.body.assets.length == index) {
              customValidation.generateSuccessResponse(
                {},
                response,
                constants.RESPONSE_TYPE_SAVE,
                res,
                req
              );
            }
          })
          .catch((error: Error) => {
            console.log("Error getting tags from ECL2>>>>>>>>>>>>>>>>>>>>>>>");
            console.log(error);
            customValidation.generateAppError(error, response, res, req);
          });
      });
    } catch (e) {
      console.log("Catch Error getting tags from ECL2>>>>>>>>>>>>>>>>>>>>>>>");
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }

  saveTagValues(
    req: Request,
    res: Response,
    response: any,
    username: any,
    tagvalues: any,
    query: any,
    presourcetype: any,
    object: any,
    logger: AppLogger
  ): void {
    logger.writeLogToFile(
      "info",
      "Going to save following tag values:::::::::::"
    );
    logger.writeLogToFile("info", tagvalues);
    commonService
      .bulkCreate(tagvalues, db.TagValues)
      .then((data) => {
        let params = {
          replacements: {
            tenantid: req.body.tenantid,
            id: object.id,
            region: req.body.region,
            username: username,
            resourcetype: presourcetype,
            status: constants.STATUS_ACTIVE,
          },
        } as any;
        commonService
          .executeQuery(query, params, db.sequelize)
          .then((list) => {
            // To update resourccerefid
            let updatequery = ``;
            if (req.body.resourcetype == constants.RESOURCE_TYPES[0]) {
              updatequery = ` UPDATE tbl_bs_tag_values a 
                    set a.resourcerefid = (select c.instancerefid from tbl_tn_instances c 
                        where c.instanceid=:id  LIMIT 1),
                    a.lastupdatedby=:username
                    WHERE a.resourceid=:id AND a.resourcetype =:resourcetype AND a.status = 'Active'`;
            }
            if (req.body.resourcetype == constants.RESOURCE_TYPES[1]) {
              updatequery = `UPDATE tbl_bs_tag_values a 
                                set a.resourcerefid = (select c.ecl2networkid from tbl_ecl2_networks c 
                                    where c.networkid=:id LIMIT 1),
                                a.lastupdatedby=:username
                                WHERE a.resourceid=:id AND a.resourcetype =:resourcetype AND a.status = 'Active'`;
            }
            commonService
              .executeQuery(updatequery, params, db.sequelize)
              .then((r) => {})
              .catch((error: Error) => {
                console.log(
                  ">>>>>>>>>>>>>>>>>>> Error saving App Tags::::::::::::::"
                );
                console.log(error);
                // customValidation.generateAppError(error, response, res, req);
              });
          })
          .catch((error: Error) => {
            console.log(
              ">>>>>>>>>>>>>>>>>>> Error saving App Tags::::::::::::::"
            );
            console.log(error);
            // customValidation.generateAppError(error, response, res, req);
          });
      })
      .catch((error: Error) => {
        // customValidation.generateAppError(error, response, res, req);
      });
  }

  buildTagValue(
    req: Request,
    res: Response,
    response: any,
    metadata: any,
    tquery: any,
    object: any,
    tagvalues: any,
    presourcetype: any,
    refid: number | string,
    logger: AppLogger
  ) {
    tagvalues = [];
    console.log("Ref Id is ::::::::::::::::::::::::::::: ", refid);
    logger.writeLogToFile("info", "Request body object ", req.body);
    logger.writeLogToFile("info", "Object is ", object);
    let existingTags: { tagid: number; tagname: string; tagvalue: string }[] =
      req.body.tagvalues;
    if (metadata) {
      try {
        for (var key in metadata) {
          if (metadata.hasOwnProperty(key)) {
            if (constants.DEFAULT_TAGS.indexOf(key) == -1) {
              let t = existingTags.find((o) => o["tagname"] == key);
              let tag = {
                tenantid: req.body.tenantid,
                cloudprovider: constants.CLOUD_ECL,
                resourcetype: presourcetype,
                tagid: t != undefined ? t.tagid : null,
                resourceid: object["id"] || null,
                tagvalue: metadata[key],
                status: constants.STATUS_ACTIVE,
                tnregionid: req.body.tnregionid,
                createdby: object.id,
                createddt: new Date(),
                lastupdatedby: key,
                lastupdateddt: new Date(),
              };
              tagvalues.push(tag);
            }
          }
        }
      } catch (error) {
        console.log("Error forming tagvalues::::::::::");
        console.log(error);
      }
      new Controller().saveTagValues(
        req,
        res,
        response,
        req.body.createdby,
        tagvalues,
        tquery,
        req.body.resourcetype,
        object,
        logger
      );
    }
  }
}

export default new Controller();

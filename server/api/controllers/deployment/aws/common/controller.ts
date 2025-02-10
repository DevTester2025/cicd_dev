import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Response } from "express";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import * as _ from "lodash";
import { AppError } from "../../../../../common/appError";
import * as AWS from "aws-sdk";
import { queries } from "../../../../../common/query";
import AppLogger from "../../../../../lib/logger";
import { GetObjectOutput } from "aws-sdk/clients/s3";
import AssetHistoryService from "../../../../services/assethistory.service";
import ssmService from "../../../../services/providers/ssm.service";
export class Controller {
  constructor() {
    //
  }
  getScriptFile(req: any, res: Response) {
    try {
      commonService
        .getS3PresignedURL(
          "Scripts/" + Buffer.from(req.params.key, "base64").toString()
        )
        .then((d: GetObjectOutput) => {
          console.log(d);
          res
            .set("ETag", d.ETag)
            .set("AcceptRanges", d.AcceptRanges)
            .set("Content-Length", d.ContentLength.toString())
            .set(
              "Content-disposition",
              "attachment; filename=" + req.params.key
            )
            .set("Content-Type", d.ContentType)
            .send(d.Body);
        });
    } catch (e) {
      console.log("Err", e);
    }
  }
  syncPricing(req: any, res: Response): void {
    try {
      let parameters = {
        where: {
          tenantid: req.body.tenantid,
          status: constants.STATUS_ACTIVE,
          fieldlabel: { $in: ["CLOUD_DETAILS"] },
        },
      };
      commonService.getAllList(parameters, db.CustomField).then((list) => {
        if (list) {
          let clouddetails = _.find(list, function (data: any) {
            if (data.fieldlabel === "CLOUD_DETAILS") {
              data.fieldvalue = commonService.decrypt(data.fieldvalue);
              return data;
            }
          });
          let awsCredentials = _.find(
            JSON.parse(clouddetails.fieldvalue),
            function (data: any) {
              if (data.cloudprovider === constants.CLOUD_AWS) {
                return data;
              }
            }
          );
          AWS.config.update({
            accessKeyId: awsCredentials.cloudauthkey,
            secretAccessKey: awsCredentials.cloudseckey,
            region: req.body.region,
          });
          let pricing = new AWS.Pricing({ apiVersion: "2017-10-15" });
          let params = {
            Filters: [
              {
                Field: "productFamily",
                Type: "TERM_MATCH",
                Value: "Compute Instance",
              },
            ],
            ServiceCode: "AmazonEC2",
            FormatVersion: "aws_v1",
          } as any;
          getData();
          customValidation.generateSuccessResponse(
            {},
            {},
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
          commonService.update(
            { region: req.body.region },
            { status: constants.DELETE_STATUS },
            db.CostVisual
          );
          function getData(token?) {
            if (token) params.NextToken = token;
            pricing.getProducts(params, function (err, data) {
              if (data) {
                let pricingArray = [] as any;
                if (data.PriceList) {
                  data.PriceList.forEach((instance, i) => {
                    for (let price in (instance as any).terms) {
                      if (
                        getPricingValue((instance as any).terms[price]) &&
                        parseInt(
                          getPricingValue((instance as any).terms[price]).USD
                        )
                      ) {
                        let obj = {
                          cloudprovider: "AWS",
                          region: (instance as any).product.attributes.location,
                          resourcetype: "ASSET_INSTANCE",
                          plantype: (instance as any).product.attributes
                            .instanceType,
                          pricetype: price,
                          unit: "Nos",
                          priceperunit: getPricingValue(
                            (instance as any).terms[price]
                          ).USD,
                          currency: "$",
                          pricingmodel: "Hourly",
                          status: "Active",
                          createdby: "Admin",
                          createddt: new Date(),
                        };
                        pricingArray.push(obj);
                      }
                    }
                    if (i + 1 == data.PriceList.length) {
                      commonService.bulkCreate(pricingArray, db.CostVisual);
                      let query =
                        "update ignore tbl_bs_costvisual a inner join tbl_aws_zones z on  z.displayname = a.region set region = z.awszoneid";
                      commonService.executeQuery(query, params, db.sequelize);
                      if (data.NextToken) {
                        setTimeout(() => {
                          getData(data.NextToken);
                        }, 5000);
                      }
                    }
                  });
                }
              } else {
                customValidation.generateAppError(
                  "Unable to sync...",
                  {},
                  res,
                  req
                );
              }
            });
          }
          function getPricingValue(obj) {
            if (obj) {
              for (let level1 in obj) {
                if (obj[level1] && obj[level1]["priceDimensions"]) {
                  for (let level2 in obj[level1]["priceDimensions"]) {
                    if (
                      obj[level1]["priceDimensions"][level2] &&
                      obj[level1]["priceDimensions"][level2]["pricePerUnit"] &&
                      obj[level1]["priceDimensions"][level2]["unit"] == "Hrs"
                    ) {
                      return obj[level1]["priceDimensions"][level2][
                        "pricePerUnit"
                      ];
                    }
                  }
                }
              }
            }
          }
        } else {
          customValidation.generateAppError("Unable to sync...", {}, res, req);
        }
      });
    } catch (e) {}
  }

  synchronization(req: any, res: Response): void {
    let filename =
      "aws_sync_assets" + commonService.generateRandomNumber(10) + ".log";
    const asstcondition = {
      tenantid: req.body.tenantid,
      cloudprovider: constants.CLOUD_AWS,
    };
    if (req.body.resourcetype)
      asstcondition["resourcetype"] = req.body.resourcetype;
    if (req.body.refid) asstcondition["refid"] = req.body.refid;

    let logger = new AppLogger(process.cwd() + `/logs/`, filename);
    let regionArray = [];
    let regionNames = [];
    let response = {};
    let parameters: any = {
      include: [
        {
          as: "accountdata",
          model: db.CustomerAccount,
          required: false,
          attributes: ["rolename"],
          where: { status: constants.STATUS_ACTIVE },
        },
      ],
      where: {
        tenantid: req.body.tenantid,
        _accountid: req.body._accountid,
        customerid: req.body.customerid,
        tenantrefid: req.body.awsaccountid,
        status: constants.STATUS_ACTIVE,
      },
    };
    if (req.body.regions && req.body.regions.length > 0) {
      for (let region of req.body.regions) {
        regionNames.push(region.awszoneid);
        //create region for customer
        if (!region.tnregionid) {
          regionArray.push({
            tenantid: req.body.tenantid,
            _accountid: req.body._accountid,
            cloudprovider: constants.CLOUD_AWS,
            customerid: req.body.customerid,
            region: region.awszoneid,
            tenantrefid: req.body.awsaccountid,
            lastsyncdt: new Date(),
            status: constants.STATUS_ACTIVE,
            createdby: req.body.createdby,
            createddt: new Date(),
            lastupdatedby: req.body.createdby,
            lastupdateddt: new Date(),
          });
        } else {
          //update the region if exist
          region.status = constants.STATUS_ACTIVE;
          region.lastsyncdt = new Date();
          regionArray.push(region);
        }
      }
    }
    // AssetHistoryService.getAssets(asstcondition)
    //   .then((d) => {
    commonService
      .bulkUpdate(regionArray, ["status", "lastsyncdt"], db.TenantRegion)
      .then((data) => {
        //get all the regions of the customer
        parameters.where.region = { $in: regionNames };
        commonService
          .getAllList(parameters, db.TenantRegion)
          .then((regionData) => {
            getCredentials(JSON.parse(JSON.stringify(regionData)));
          });
      });
    // })
    // .catch((err) => {
    //   console.log(err);
    // });
    //get tenant's AWS credentials
    function getCredentials(regionData) {
      parameters = {
        where: {
          tenantid: req.body.tenantid,
          status: constants.STATUS_ACTIVE,
          fieldlabel: { $in: ["CLOUD_DETAILS"] },
        },
      };
      commonService.getAllList(parameters, db.CustomField).then((list) => {
        if (null == list || list.size === 0) {
          logger.writeLogToFile(
            "error",
            constants.AWS_INVALID_CREDENTIALS.replace("{region}", "")
          );
          customValidation.generateAppError(
            new AppError(
              constants.AWS_INVALID_CREDENTIALS.replace("{region}", "")
            ),
            response,
            res,
            req
          );
          new Controller().uploadLog(filename, req.body.tenantid);
          return false;
        }
        list = JSON.parse(JSON.stringify(list));
        let clouddetails = _.find(list, function (data: any) {
          if (data.fieldlabel === "CLOUD_DETAILS") {
            data.fieldvalue = commonService.decrypt(data.fieldvalue);
            return data;
          }
        });
        if (_.isEmpty(clouddetails) || _.isEmpty(clouddetails.fieldvalue)) {
          logger.writeLogToFile(
            "error",
            constants.AWS_INVALID_CREDENTIALS.replace("{region}", "")
          );
          new Controller().uploadLog(filename, req.body.tenantid);
          customValidation.generateAppError(
            new AppError(
              constants.AWS_INVALID_CREDENTIALS.replace("{region}", "")
            ),
            response,
            res,
            req
          );
        } else {
          let awsCredentials = _.find(
            JSON.parse(clouddetails.fieldvalue),
            function (data: any) {
              if (data.cloudprovider === constants.CLOUD_AWS) {
                return data;
              }
            }
          );
          if (
            !awsCredentials ||
            !awsCredentials.cloudauthkey ||
            !awsCredentials.cloudseckey
          ) {
            logger.writeLogToFile(
              "error",
              constants.AWS_INVALID_CREDENTIALS.replace("{region}", "")
            );
            new Controller().uploadLog(filename, req.body.tenantid);
            customValidation.generateAppError(
              new AppError(
                constants.AWS_INVALID_CREDENTIALS.replace("{region}", "")
              ),
              response,
              res,
              req
            );
          } else {
            logger.writeLogToFile(
              "info",
              "Started to sync the assets ................................." +
                `Provider: ${constants.CLOUD_AWS}, Customer: ${req.body.createdby}, Account ID: ${req.body.awsaccountid} `
            );
            if (req.body.dailyjob == undefined) {
              customValidation.generateSuccessResponse(
                {},
                {},
                constants.RESPONSE_TYPE_SAVE,
                res,
                req
              );
            }
            new Controller().initiateSync(
              req,
              regionData,
              awsCredentials,
              logger,
              filename,
              res
            );
          }
        }
      });
    }
  }
  initiateSync(req, data, credentials, logger, filename, res: Response) {
    let sindex = 0;
    let username = req.body.createdby;
    let assetsData = [];
    function deleteExist(tnregionid, region): Promise<any> {
      return new Promise((resolve, reject) => {
        try {
          let params = {
            replacements: {
              tenantid: req.body.tenantid,
              customerid: req.body.customerid,
              region: region,
              username: username,
              status: constants.DELETE_STATUS,
              cloudprovider: constants.CLOUD_AWS,
              tnregionid: tnregionid,
            },
          } as any;
          Object.keys(queries.AWS_DELETE_DATA).forEach((query, i) => {
            if (!req.body.filters || req.body.filters.includes(query)) {
              db.sequelize.transaction(async (transaction) => {
                params.transaction = transaction;
                db.sequelize
                  .query(queries.AWS_DELETE_DATA[query], params)
                  .then((result) => {
                    if (Object.keys(queries.AWS_DELETE_DATA).length == i + 1) {
                      logger.writeLogToFile(
                        "info",
                        "Existing data of the customer were deletet..................................."
                      );
                      resolve(result);
                    }
                  })
                  .catch((err) => {
                    logger.writeLogToFile("error", err);
                    console.log(err);
                  });
              });
            }
          });
        } catch (e) {
          console.log(e);
          logger.writeLogToFile("error", e);
          resolve("Failed");
        }
      });
    }

    startSync(sindex);
    function startSync(sindex) {
      if (data[sindex]) {
        let currRegion = data[sindex];
        deleteExist(currRegion.tnregionid, currRegion.region).then((succ) => {
          console.log(
            currRegion.accountdata.rolename,
            "----",
            currRegion.tenantrefid,
            "-----",
            currRegion.region
          );
          new Controller()
            .getCrossAccountCredentials(
              credentials,
              currRegion.region,
              currRegion.tenantrefid,
              currRegion.accountdata.rolename
            )
            .then((awscredentials) => {
              AWS.config.region = currRegion.region;
              AWS.config.update(awscredentials);
              let inputObj = {
                region: currRegion.region,
                tnregionid: currRegion.tnregionid,
                tenantid: req.body.tenantid,
                customerid: req.body.customerid,
                username: req.body.createdby,
                accountid: req.body._accountid,
                credentials: awscredentials,
              };
              assetsData = [
                { key: "ASSET_IMAGE", value: new Controller().syncImages },
                { key: "ASSET_VPC", value: new Controller().syncNetwork },
                {
                  key: "ASSET_IG",
                  value: new Controller().syncInternetGateway,
                },
                {
                  key: "ASSET_SECURITYGROUP",
                  value: new Controller().syncSecuirityGroup,
                },
                { key: "ASSET_KEYS", value: new Controller().syncKeyPair },
                { key: "ASSET_VOLUME", value: new Controller().syncVolume },
                {
                  key: "ASSET_INSTANCE",
                  value: new Controller().syncInstances,
                },
                { key: "ASSET_LB1", value: new Controller().syncLBV1 },
                { key: "ASSET_LB2", value: new Controller().syncLBV2 },
                {
                  key: "ASSET_OTHERS",
                  value: new Controller().syncOtherAssets,
                },
                {
                  key: "SSM_AGENT",
                  value: new Controller().syncSSMStatus,
                },
              ];
              getAssets(0, inputObj);
            });
        });
      } else {
        new Controller().uploadLog(filename, req.body.tenantid);
        if (req.body.dailyjob) {
          customValidation.generateSuccessResponse(
            {},
            {},
            constants.RESPONSE_TYPE_SAVE,
            res,
            req
          );
        }
      }
    }
    function getAssets(index, inputObj) {
      let assetFn = assetsData[index];
      if (assetFn) {
        // if (!req.body.filters || req.body.filters.includes(assetFn.key)) {
        assetFn
          .value(inputObj, logger)
          .then((res) => {
            logger.writeLogToFile(
              "info",
              `${assetFn.key} synced from region ${inputObj.region} by ${inputObj.username}`
            );
            index += 1;
            getAssets(index, inputObj);
          })
          .catch((e) => {
            logger.writeLogToFile(
              "error",
              `Error in ${assetFn.key} from region  ${inputObj.region} - ${e}`
            );
            index += 1;
            getAssets(index, inputObj);
          });
        // }
      } else {
        logger.writeLogToFile(
          "info",
          `--------------------- Sync completed  ${inputObj.region} by ${inputObj.username} ---------------------`
        );
        sindex += 1;
        startSync(sindex);
      }
    }
  }

  syncNetwork(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create EC2 service object
      let ec2 = new AWS.EC2({ apiVersion: constants.AWS_EC2_APIVERSION });
      ec2.describeVpcs({}, function (err, data) {
        if (err) {
          reject(err);
          console.log(err, err.stack); // an error occurred
        } else {
          if (data && data.Vpcs.length > 0) {
            let array = [];
            let tagvalues = [];
            data.Vpcs.forEach((element) => {
              let object = {
                tenantid: inputObj.tenantid,
                vpcname: element.VpcId,
                awsvpcid: element.VpcId,
                ipv4cidr: element.CidrBlock,
                notes: "",
                tnregionid: inputObj.tnregionid,
                status: constants.STATUS_ACTIVE,
                createdby: inputObj.username,
                createddt: new Date(),
                lastupdatedby: inputObj.username,
                lastupdateddt: new Date(),
              };
              new Controller().addTagValue(
                inputObj,
                element.Tags,
                element.VpcId,
                tagvalues,
                constants.RESOURCE_TYPES[5],
                inputObj.tnregionid
              );
              array.push(object);
            });

            commonService
              .bulkCreate(array, db.awsvpc)
              .then((data) => {
                let ids = _.map(
                  JSON.parse(JSON.stringify(data)),
                  function (item: any) {
                    return {
                      resourceid: item.vpcid,
                      resourcerefid: item.awsvpcid,
                    };
                  }
                );
                commonService.bulkAssetMapping(
                  ids,
                  inputObj.tenantid,
                  constants.CLOUD_AWS,
                  constants.RESOURCE_TYPES[5],
                  inputObj.customerid,
                  inputObj.tnregionid
                );
                AssetHistoryService.getHistory(
                  inputObj.tenantid,
                  constants.RESOURCE_TYPES[5]
                );

                // For Tags
                // let tquery = `UPDATE tbl_bs_tag_values a
                //       set a.tagid = (select c.tagid from tbl_bs_tags c
                //       where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                //       a.resourceid = (select c.vpcid from tbl_aws_vpc c
                //       where c.awsvpcid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                //       a.resourcerefid=a.createdby,
                //       a.createdby=:username
                //       WHERE a.tagid IS NULL AND a.resourcetype =:resourcetype`;
                let cquery =
                  "UPDATE tbl_bs_tag_values a " +
                  "JOIN tbl_bs_tags c ON c.tagname = a.lastupdatedby AND c.tenantid = :tenantid " +
                  "JOIN tbl_aws_vpc v ON v.awsvpcid = a.createdby AND v.status = :status AND v.tnregionid = :tnregionid " +
                  "SET a.tagid = c.tagid, a.resourceid = v.vpcid, a.resourcerefid = a.createdby, a.createdby = :username " +
                  "WHERE a.tagid IS NULL AND a.resourcetype = :resourcetype";
                new Controller().syncTagValues(
                  inputObj,
                  constants.RESOURCE_TYPES[5],
                  tagvalues,
                  cquery
                );

                ec2.describeSubnets({}, function (err, data) {
                  if (err) {
                    reject(err);
                    console.log(err, err.stack); // an error occurred
                  } else {
                    if (data && data.Subnets.length > 0) {
                      let array = [];
                      let tagvalues = [];
                      data.Subnets.forEach((element) => {
                        let object = {
                          tenantid: inputObj.tenantid,
                          subnetname: element.SubnetId,
                          awssubnetd: element.SubnetId,
                          ipv4cidr: element.CidrBlock,
                          notes: "",
                          tnregionid: inputObj.tnregionid,
                          status: constants.STATUS_ACTIVE,
                          createdby: element.VpcId,
                          createddt: new Date(),
                          lastupdatedby: inputObj.region,
                          lastupdateddt: new Date(),
                        };
                        new Controller().addTagValue(
                          inputObj,
                          element.Tags,
                          element.SubnetId,
                          tagvalues,
                          constants.RESOURCE_TYPES[6],
                          inputObj.tnregionid
                        );

                        array.push(object);
                      });

                      commonService
                        .bulkCreate(array, db.awssubnet)
                        .then((data) => {
                          //Asset Mapping
                          let ids = _.map(
                            JSON.parse(JSON.stringify(data)),
                            function (item: any) {
                              return {
                                resourceid: item.subnetid,
                                resourcerefid: item.awssubnetd,
                              };
                            }
                          );
                          commonService.bulkAssetMapping(
                            ids,
                            inputObj.tenantid,
                            constants.CLOUD_AWS,
                            constants.RESOURCE_TYPES[6],
                            inputObj.customerid,
                            inputObj.tnregionid
                          );
                          AssetHistoryService.getHistory(
                            inputObj.tenantid,
                            constants.RESOURCE_TYPES[6]
                          );

                          let query = `UPDATE tbl_aws_subnet a
                                                  set a.zoneid = (select b.zoneid from tbl_aws_zones b where b.zonename=a.lastupdatedby LIMIT 1 ),
                                                  a.vpcid = (select c.vpcid from tbl_aws_vpc c
                                                  where c.awsvpcid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid ORDER BY 1 DESC LIMIT 1),
                                                  a.createdby=:username,
                                                  a.lastupdatedby=:username
                                                  WHERE a.tnregionid=:tnregionid AND a.status=:status;`;
                          let params = {
                            replacements: {
                              tenantid: inputObj.tenantid,
                              customerid: inputObj.customerid,
                              region: inputObj.region,
                              status: constants.STATUS_ACTIVE,
                              username: inputObj.username,
                              tnregionid: inputObj.tnregionid,
                            },
                          };
                          commonService
                            .executeQuery(query, params, db.sequelize)
                            .catch((error: Error) => {
                              console.log(error);
                            });

                          // For Tags
                          // let tquery = `UPDATE tbl_bs_tag_values a
                          //                             set a.tagid = (select c.tagid from tbl_bs_tags c
                          //                             where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                          //                             a.resourceid = (select c.subnetid from tbl_aws_subnet c
                          //                             where c.awssubnetd=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                          //                             a.resourcerefid=a.createdby,
                          //                             a.createdby=:username
                          //                             WHERE a.tagid IS NULL AND a.resourcetype =:resourcetype`;

                          let cquery = `UPDATE tbl_bs_tag_values a
                          JOIN tbl_bs_tags b ON b.tagname = a.lastupdatedby AND b.tenantid = :tenantid
                          JOIN tbl_aws_subnet c ON c.awssubnetd = a.createdby AND c.status = :status AND c.tnregionid = :tnregionid
                          SET a.tagid = b.tagid, a.resourceid = c.subnetid, a.resourcerefid = a.createdby, a.createdby = :username
                          WHERE a.tagid IS NULL AND a.resourcetype = :resourcetype;`;

                          new Controller().syncTagValues(
                            inputObj,
                            constants.RESOURCE_TYPES[6],
                            tagvalues,
                            cquery
                          );

                          resolve(data);
                        })
                        .catch((error: Error) => {
                          reject(err);
                        });
                    }
                  }
                });
              })
              .catch((error: Error) => {
                reject(err);
              });
          } else {
            resolve(data);
          }
        }
      });
    });
  }
  syncSecuirityGroup(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      let params = {};
      let ec2 = new AWS.EC2({ apiVersion: constants.AWS_EC2_APIVERSION });
      ec2.describeSecurityGroups(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          if (data && data.SecurityGroups.length > 0) {
            let array = [];
            let tagvalues = [];
            let sgrules = [];
            data.SecurityGroups.forEach((element) => {
              // To prepare sgrules array : Inbound
              if (element.IpPermissions && element.IpPermissions.length > 0) {
                element.IpPermissions.forEach((ipelement) => {
                  let obj = {
                    type: "tcp",
                    protocol:
                      ipelement.IpProtocol == "-1"
                        ? "tcp"
                        : ipelement.IpProtocol,
                    portrange: ipelement.FromPort,
                    source: "All",
                    sourcetype: "IP",
                    status: "Active",
                    createdby: "DATASYNC",
                    createddt: new Date(),
                    lastupdatedby: "DATASYNC",
                    lastupdateddt: new Date(),
                    tenantid: inputObj.tenantid,
                    awssecuritygroupid: element.GroupId,
                  } as any;
                  if (ipelement.IpRanges && ipelement.IpRanges.length > 0) {
                    obj.source = ipelement.IpRanges[0].CidrIp;
                    obj.sourcetype = "IP";
                  }
                  if (
                    ipelement.UserIdGroupPairs &&
                    ipelement.UserIdGroupPairs.length > 0
                  ) {
                    obj.source = ipelement.UserIdGroupPairs[0].GroupId;
                    obj.sourcetype = "SG";
                  }
                  sgrules.push(obj);
                });
              }
              let object = {
                tenantid: inputObj.tenantid,
                securitygroupname: element.GroupName,
                awssecuritygroupid: element.GroupId,
                notes: element.Description.substring(0, 100),
                tnregionid: inputObj.tnregionid,
                status: constants.STATUS_ACTIVE,
                createdby: element.VpcId,
                createddt: new Date(),
                lastupdatedby: inputObj.username,
                lastupdateddt: new Date(),
              };
              new Controller().addTagValue(
                inputObj,
                element.Tags,
                element.GroupId,
                tagvalues,
                constants.RESOURCE_TYPES[3],
                inputObj.tnregionid
              );
              array.push(object);
            });

            commonService
              .bulkCreate(array, db.awssg)
              .then((data) => {
                AssetHistoryService.getHistory(
                  inputObj.tenantid,
                  constants.RESOURCE_TYPES[3]
                );
                let ids = [];
                if (sgrules && sgrules.length > 0) {
                  data = JSON.parse(JSON.stringify(data));
                  data.forEach((element, idx) => {
                    ids.push({
                      resourceid: element.securitygroupid,
                      resourcerefid: element.awssecuritygroupid,
                    });
                    _.map(sgrules, function (item) {
                      if (
                        element.awssecuritygroupid == item.awssecuritygroupid
                      ) {
                        item.securitygroupid = element.securitygroupid;
                      }
                    });
                    if (idx + 1 == data.length) {
                      commonService.bulkAssetMapping(
                        ids,
                        inputObj.tenantid,
                        constants.CLOUD_AWS,
                        constants.RESOURCE_TYPES[3],
                        inputObj.customerid,
                        inputObj.tnregionid
                      );
                      commonService
                        .bulkCreate(sgrules, db.awssgrules)
                        .then((rule) => {
                          syncSGtag();
                        });
                    }
                  });
                } else {
                  syncSGtag();
                }
                function syncSGtag() {
                  let query = `UPDATE tbl_aws_securitygroup a
                set a.vpcid = (select c.vpcid from tbl_aws_vpc c
                where c.awsvpcid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid ORDER BY 1 DESC LIMIT 1),
                a.createdby=:username
                WHERE a.tnregionid=:tnregionid AND a.status=:status;`;
                  let params = {
                    replacements: {
                      tenantid: inputObj.tenantid,
                      customerid: inputObj.customerid,
                      region: inputObj.region,
                      status: constants.STATUS_ACTIVE,
                      username: inputObj.username,
                      tnregionid: inputObj.tnregionid,
                    },
                  };
                  commonService
                    .executeQuery(query, params, db.sequelize)
                    .then((list) => {
                      let tquery = `UPDATE tbl_bs_tag_values a
                              set a.tagid = (select c.tagid from tbl_bs_tags c
                              where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                              a.resourceid = (select c.securitygroupid from tbl_aws_securitygroup c
                              where c.awssecuritygroupid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                              a.resourcerefid=a.createdby,
                              a.createdby=:username
                              WHERE a.tagid IS NULL AND a.resourcetype =:resourcetype`;
                      new Controller().syncTagValues(
                        inputObj,
                        constants.RESOURCE_TYPES[3],
                        tagvalues,
                        tquery
                      );
                    })
                    .catch((error: Error) => {
                      console.log(error);
                    });
                  resolve(data);
                }
              })
              .catch((error: Error) => {
                console.log(error);
              });
          } else {
            resolve(data);
          }
        }
      });
    });
  }

  syncKeyPair(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      let params = {};
      let ec2 = new AWS.EC2({ apiVersion: constants.AWS_EC2_APIVERSION });
      ec2.describeKeyPairs(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          if (data && data.KeyPairs.length > 0) {
            let array = [];
            data.KeyPairs.forEach((element) => {
              let object = {
                tenantid: inputObj.tenantid,
                keyname: element.KeyName,
                tnregionid: inputObj.tnregionid,
                status: constants.STATUS_ACTIVE,
                createdby: inputObj.username,
                createddt: new Date(),
              };
              array.push(object);
            });
            new Controller().bulkCreate(array, db.awskeys);
            resolve(data);
          } else {
            reject("No data found");
          }
        }
      });
    });
  }
  syncVolume(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      let params = {};
      let ec2 = new AWS.EC2({ apiVersion: constants.AWS_EC2_APIVERSION });
      ec2.describeVolumes(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          if (data && data.Volumes.length > 0) {
            let array = [];
            let attachments = [];
            data.Volumes.forEach((element) => {
              let object = {
                tenantid: inputObj.tenantid,
                volumetype: element.VolumeType,
                sizeingb: element.Size,
                awsvolumeid: element.VolumeId,
                delontermination: "Y",
                encryptedyn: element.Encrypted ? "Y" : "N",
                tnregionid: inputObj.tnregionid,
                status: constants.STATUS_ACTIVE,
                createdby: inputObj.username,
                createddt: new Date(element.CreateTime),
                lastupdatedby: inputObj.username,
                lastupdateddt: new Date(element.CreateTime),
              };
              if (element.Attachments && element.Attachments.length > 0) {
                element.Attachments.forEach((att) => {
                  let obj = {
                    tenantid: inputObj.tenantid,
                    customerid: inputObj.customerid,
                    tnregionid: inputObj.tnregionid,
                    instancerefid: att.InstanceId,
                    status: constants.STATUS_ACTIVE,
                    createdby: att.VolumeId,
                    createddt: new Date(),
                    lastupdatedby: att.InstanceId,
                    lastupdateddt: new Date(),
                  };
                  attachments.push(obj);
                });
              }
              array.push(object);
            });

            commonService
              .bulkCreate(array, db.awsvolumes)
              .then((data) => {
                resolve(data);
                //customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
                //Asset Mapping
                let ids = _.map(
                  JSON.parse(JSON.stringify(data)),
                  function (item: any) {
                    return {
                      resourceid: item.volumeid,
                      resourcerefid: item.awsvolumeid,
                    };
                  }
                );
                commonService.bulkAssetMapping(
                  ids,
                  inputObj.tenantid,
                  constants.CLOUD_AWS,
                  constants.RESOURCE_TYPES[2],
                  inputObj.customerid,
                  inputObj.tnregionid
                );
                AssetHistoryService.getHistory(
                  inputObj.tenantid,
                  constants.RESOURCE_TYPES[2]
                );
              })
              .catch((error: Error) => {
                reject(error);
              });
            new Controller().bulkCreate(attachments, db.awsvolumeattachment);
          } else {
            reject("No data found");
          }
        }
      });
    });
  }
  syncInstances(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      let params = {};
      let ec2 = new AWS.EC2({ apiVersion: constants.AWS_EC2_APIVERSION });
      ec2.describeInstances(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          if (data && data.Reservations && data.Reservations.length > 0) {
            let array = [];
            let tagvalues = [];
            data.Reservations.forEach((relement) => {
              relement.Instances.forEach((element) => {
                if (element.InstanceId == "i-0e1e024232f83f057") {
                  console.log("Instance with no platform details found");
                  console.log("Object formed.");
                  console.log(element);
                  console.log(
                    element.Platform ? element.Platform.toLowerCase() : null
                  );
                }

                let object = {
                  tenantid: inputObj.tenantid,
                  customerid: inputObj.customerid,
                  cloudprovider: constants.CLOUD_AWS,
                  accountid: inputObj.accountid,
                  instancerefid: element.InstanceId,
                  instancename: element.InstanceId,
                  platform: element.Platform
                    ? element.Platform.toLowerCase()
                    : null,
                  lifecycle:
                    element.Placement.Tenancy == "default"
                      ? "OnDemand"
                      : "Reserved",
                  region: inputObj.region,
                  imagerefid: element.ImageId,
                  instancetyperefid: element.InstanceType,
                  //networkrefid: JSON.stringify(_.map(element.NetworkInterfaces, function (item: any) { return item.VpcId; })),
                  networkrefid: '["' + element.VpcId + '"]',
                  subnetrefid: element.SubnetId,
                  securitygrouprefid:
                    element.SecurityGroups && element.SecurityGroups.length > 0
                      ? element.SecurityGroups[0].GroupId
                      : null,
                  volumerefid:
                    element.BlockDeviceMappings &&
                    element.BlockDeviceMappings[0] &&
                    element.BlockDeviceMappings[0].Ebs
                      ? element.BlockDeviceMappings[0].Ebs.VolumeId
                      : null,
                  keyrefid: element.KeyName,
                  publicipv4: element.PublicIpAddress,
                  privateipv4: element.PrivateIpAddress,
                  publicdns: element.PublicDnsName,
                  monitoringyn: "Y",
                  monitorutilyn: "Y",
                  deletionprotectionyn: "N",
                  lbstatus: "N",
                  emailyn: "N",
                  notes: "",
                  tnregionid: inputObj.tnregionid,
                  status: constants.STATUS_ACTIVE,
                  createdby: inputObj.username,
                  createddt: new Date(element.LaunchTime),
                  lastupdatedby: inputObj.username,
                  lastupdateddt: new Date(element.LaunchTime),
                  checksum: commonService.createchecksum(
                    JSON.stringify(element)
                  ),
                  cloudstatus: element.State.Name,
                  iamrole: element.IamInstanceProfile
                    ? element.IamInstanceProfile.Arn
                    : undefined,
                };
                if (element.Tags && element.Tags.length > 0) {
                  let name = _.find(element.Tags, function (o) {
                    return o.Key == "Name";
                  });
                  if (name) {
                    object.instancename = name.Value;
                  }
                }
                new Controller().addTagValue(
                  inputObj,
                  element.Tags,
                  element.InstanceId,
                  tagvalues,
                  constants.RESOURCE_TYPES[0],
                  inputObj.tnregionid
                );

                array.push(object);
              });
            });
            commonService
              .bulkCreate(array, db.Instances)
              .then(async (listins) => {
                AssetHistoryService.getHistory(
                  inputObj.tenantid,
                  constants.RESOURCE_TYPES[0]
                );
                let ids = _.map(
                  JSON.parse(JSON.stringify(listins)),
                  function (item: any) {
                    return {
                      resourceid: item.instanceid,
                      resourcerefid: item.instancerefid,
                    };
                  }
                );
                commonService.bulkAssetMapping(
                  ids,
                  inputObj.tenantid,
                  constants.CLOUD_AWS,
                  constants.RESOURCE_TYPES[0],
                  inputObj.customerid,
                  inputObj.tnregionid
                );

                let query = `UPDATE tbl_tn_instances a
                        set a.zoneid = (select b.zoneid from tbl_aws_zones b where b.zonename=a.region LIMIT 1 ),
                        a.imageid = (select c.amiid from tbl_aws_ami c
                        where c.awsamiid=a.imagerefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        a.instancetypeid = (select c.instancetypeid from tbl_aws_instancetype c
                        where c.instancetypename=a.instancetyperefid AND c.status=:status LIMIT 1),
                        a.subnetid = (select c.subnetid from tbl_aws_subnet c
                        where c.awssubnetd=a.subnetrefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        a.volumeid = (select c.volumeid from tbl_aws_volumes c
                        where c.awsvolumeid=a.volumerefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        a.securitygroupid = (select c.securitygroupid from tbl_aws_securitygroup c
                        where c.awssecuritygroupid=a.securitygrouprefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        a.keyid = (select c.keyid from tbl_aws_keys c
                        where c.keyname=a.keyrefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1)
                        WHERE a.cloudprovider=:cloudprovider AND a.tnregionid=:tnregionid AND a.status=:status `;
                let params = {
                  replacements: {
                    tenantid: inputObj.tenantid,
                    customerid: inputObj.customerid,
                    region: inputObj.region,
                    username: inputObj.username,
                    status: constants.STATUS_ACTIVE,
                    cloudprovider: constants.CLOUD_AWS,
                    tnregionid: inputObj.tnregionid,
                  },
                };
                commonService
                  .executeQuery(query, params, db.sequelize)
                  .then((list) => {
                    let ilist = JSON.parse(JSON.stringify(listins));
                    resolve(data);
                    _.forEach(ilist, function (element) {
                      let qry = `UPDATE tbl_tn_instances set networkid = (
                        select CONCAT('[',GROUP_CONCAT(vpcid),']') from tbl_aws_vpc
                        where tnregionid=:tnregionid AND status=:status AND awsvpcid  IN (:networkname))
                        WHERE instanceid =:instanceid `;

                      let prms = {
                        replacements: {
                          instanceid: element.instanceid,
                          networkname: JSON.parse(element.networkrefid),
                          customerid: inputObj.customerid,
                          status: constants.STATUS_ACTIVE,
                          tnregionid: inputObj.tnregionid,
                        },
                      };

                      commonService
                        .executeQuery(qry, prms, db.sequelize)
                        .then((list) => {})
                        .catch((error: Error) => {
                          console.log(error);
                        });
                    });

                    // For Tags
                    let tquery = `UPDATE tbl_bs_tag_values a
                            set a.tagid = (select c.tagid from tbl_bs_tags c
                            where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                            a.resourceid = (select c.instanceid from tbl_tn_instances c
                            where c.instancerefid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                            a.resourcerefid=a.createdby,
                            a.createdby=:username
                            WHERE a.tagid IS NULL AND a.resourcetype =:resourcetype`;

                    new Controller().syncTagValues(
                      inputObj,
                      constants.RESOURCE_TYPES[0],
                      tagvalues,
                      tquery
                    );

                    new Controller().syncMissingImages(inputObj);
                  })
                  .catch((error: Error) => {
                    reject(error);
                  });
              })
              .catch((error: Error) => {
                reject(error);
              });
          } else {
            reject("No data found");
          }
        }
      });
    });
  }
  syncLBV2(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      let params = {};
      let ec2 = new AWS.ELBv2({
        apiVersion: constants.AWS_ELB_APIVERSION_V2,
      });
      ec2.describeLoadBalancers(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          if (data && data.LoadBalancers.length > 0) {
            let array = [];
            let i = 1;
            data.LoadBalancers.forEach((element) => {
              let params = {
                LoadBalancerArn: element.LoadBalancerArn,
              };
              ec2.describeTargetGroups(params, function (err, targetgroups) {
                if (err) {
                  reject(err);
                } else if (targetgroups.TargetGroups.length > 0) {
                  let object = {
                    tenantid: inputObj.tenantid,
                    lbname: element.LoadBalancerName,
                    listeners: _.map(
                      targetgroups.TargetGroups,
                      function (item: any) {
                        return item.Port;
                      }
                    ),
                    //listeners: [80],
                    certificatearn: element.LoadBalancerArn, //HTTPS
                    securitypolicy: "ELBSecurityPolicy-2016-08", //HTTPS
                    hcport: parseInt(
                      (targetgroups as any).TargetGroups[0].Port
                    ),
                    hcinterval:
                      targetgroups.TargetGroups[0].HealthCheckIntervalSeconds,
                    hctimeout:
                      targetgroups.TargetGroups[0].HealthCheckTimeoutSeconds,
                    hchealthythreshold:
                      targetgroups.TargetGroups[0].HealthyThresholdCount,
                    hcunhealthythreshold:
                      targetgroups.TargetGroups[0].UnhealthyThresholdCount,
                    tnregionid: inputObj.tnregionid,
                    status: constants.STATUS_ACTIVE,
                    notes: element.SecurityGroups[0],
                    createdby: element.VpcId,
                    createddt: new Date(),
                    lastupdatedby: element.AvailabilityZones[0].SubnetId,
                    lastupdateddt: new Date(),
                  };
                  array.push(object);
                  if (i == data.LoadBalancers.length) {
                    commonService
                      .bulkCreate(array, db.awslb)
                      .then((data) => {
                        resolve(data);
                        //Asset Mapping
                        let ids = _.map(
                          JSON.parse(JSON.stringify(data)),
                          function (item: any) {
                            return {
                              resourceid: item.lbid,
                              resourcerefid: null,
                            };
                          }
                        );
                        commonService.bulkAssetMapping(
                          ids,
                          inputObj.tenantid,
                          constants.CLOUD_AWS,
                          constants.RESOURCE_TYPES[4],
                          inputObj.customerid,
                          inputObj.tnregionid
                        );
                        AssetHistoryService.getHistory(
                          inputObj.tenantid,
                          constants.RESOURCE_TYPES[4]
                        );
                        let query = `UPDATE tbl_aws_loadbalancer a
                                    set a.subnetid = (select c.subnetid from tbl_aws_subnet c
                                    where c.awssubnetd=a.lastupdatedby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                    a.vpcid = (select c.vpcid from tbl_aws_vpc c
                                    where c.awsvpcid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                    a.securitygroupid = (select c.securitygroupid from tbl_aws_securitygroup c
                                    where c.awssecuritygroupid=a.notes AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                    a.createdby=:username,
                                    a.lastupdatedby=:username,
                                    a.notes=''
                                    WHERE a.tnregionid=:tnregionid AND a.status=:status`;
                        let params = {
                          replacements: {
                            tenantid: inputObj.tenantid,
                            customerid: inputObj.customerid,
                            region: inputObj.region,
                            username: inputObj.username,
                            status: constants.STATUS_ACTIVE,
                            cloudprovider: constants.CLOUD_AWS,
                            tnregionid: inputObj.tnregionid,
                          },
                        };
                        commonService
                          .executeQuery(query, params, db.sequelize)
                          .then((list) => {})
                          .catch((error: Error) => {
                            console.log(error);
                          });

                        //For Tags
                        let tagvalues = [];
                        array.forEach((element) => {
                          let params = {
                            LoadBalancerNames: [],
                          };
                          params.LoadBalancerNames.push(element.lbname);
                          ec2.describeTags(params as any, function (err, data) {
                            if (
                              data &&
                              data.TagDescriptions &&
                              data.TagDescriptions.length > 0
                            ) {
                              new Controller().addTagValue(
                                inputObj,
                                data.TagDescriptions[0].Tags,
                                element.lbname,
                                tagvalues,
                                constants.RESOURCE_TYPES[4],
                                inputObj.tnregionid
                              );

                              let tquery = `UPDATE tbl_bs_tag_values a
                                            set a.tagid = (select c.tagid from tbl_bs_tags c
                                            where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                                            a.resourceid = (select c.lbid from tbl_aws_loadbalancer c
                                            where c.lbname=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                                            a.createdby=:username
                                            WHERE a.tagid IS NULL AND a.resourcetype =:resourcetype`;

                              new Controller().syncTagValues(
                                inputObj,
                                constants.RESOURCE_TYPES[4],
                                tagvalues,
                                tquery
                              );
                            }
                          });
                        });
                      })
                      .catch((error: Error) => {
                        reject(error);
                      });
                  } else {
                    i++;
                  }
                } else {
                  resolve(data);
                }
              });
            });
          } else {
            reject("No data found");
          }
        }
      });
    });
  }
  syncLBV1(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      let params = {};
      let lbIndex = 0;
      let ec2 = new AWS.ELB({
        apiVersion: constants.AWS_ELB_APIVERSION_V1,
      });
      ec2.describeLoadBalancers(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          if (data && data.LoadBalancerDescriptions.length > 0) {
            let array = [];
            data.LoadBalancerDescriptions.forEach((element) => {
              let object = {
                tenantid: inputObj.tenantid,
                lbname: element.LoadBalancerName,
                listeners: _.map(
                  element.ListenerDescriptions,
                  function (item: any) {
                    return item.Listener;
                  }
                ),
                certificatearn: "", //HTTPS
                securitypolicy: "ELBSecurityPolicy-2016-08", //HTTPS
                hcport: parseInt(element.HealthCheck.Target.split(":")[1]),
                hcinterval: element.HealthCheck.Interval,
                hctimeout: element.HealthCheck.Timeout,
                hchealthythreshold: element.HealthCheck.HealthyThreshold,
                hcunhealthythreshold: element.HealthCheck.UnhealthyThreshold,
                tnregionid: inputObj.tnregionid,
                status: constants.STATUS_ACTIVE,
                notes:
                  element.SecurityGroups && element.SecurityGroups.length > 0
                    ? element.SecurityGroups[0]
                    : "",
                createdby: element.VPCId,
                createddt: new Date(element.CreatedTime),
                lastupdatedby:
                  element.Subnets && element.Subnets.length > 0
                    ? element.Subnets[0]
                    : "System",
                lastupdateddt: new Date(element.CreatedTime),
              };
              array.push(object);
            });

            commonService
              .bulkCreate(array, db.awslb)
              .then((data) => {
                //Asset Mapping
                let ids = _.map(
                  JSON.parse(JSON.stringify(data)),
                  function (item: any) {
                    return {
                      resourceid: item.lbid,
                      resourcerefid: null,
                    };
                  }
                );
                commonService.bulkAssetMapping(
                  ids,
                  inputObj.tenantid,
                  constants.CLOUD_AWS,
                  constants.RESOURCE_TYPES[4],
                  inputObj.customerid,
                  inputObj.tnregionid
                );
                AssetHistoryService.getHistory(
                  inputObj.tenantid,
                  constants.RESOURCE_TYPES[4]
                );

                let query = `UPDATE tbl_aws_loadbalancer a
                        set a.subnetid = (select c.subnetid from tbl_aws_subnet c
                        where c.awssubnetd=a.lastupdatedby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        a.vpcid = (select c.vpcid from tbl_aws_vpc c
                        where c.awsvpcid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        a.securitygroupid = (select c.securitygroupid from tbl_aws_securitygroup c
                        where c.awssecuritygroupid=a.notes AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        a.createdby=:username,
                        a.lastupdatedby=:username,
                        a.notes=''
                        WHERE a.tnregionid=:tnregionid AND a.status=:status AND a.vpcid is null`;
                let params = {
                  replacements: {
                    tenantid: inputObj.tenantid,
                    customerid: inputObj.customerid,
                    region: inputObj.region,
                    username: inputObj.username,
                    status: constants.STATUS_ACTIVE,
                    cloudprovider: constants.CLOUD_AWS,
                    tnregionid: inputObj.tnregionid,
                  },
                };
                commonService
                  .executeQuery(query, params, db.sequelize)
                  .then((list) => {})
                  .catch((error: Error) => {
                    reject(error);
                  });

                //For Tags
                let tagvalues = [];
                describeTag(lbIndex);
                resolve(data);
                function describeTag(lbIndex) {
                  let element = array[lbIndex];
                  if (element) {
                    let params = {
                      LoadBalancerNames: [element.lbname],
                    };
                    ec2.describeTags(params, function (err, data) {
                      if (
                        data &&
                        data.TagDescriptions &&
                        data.TagDescriptions.length > 0
                      ) {
                        new Controller().addTagValue(
                          inputObj,
                          data.TagDescriptions[0].Tags,
                          element.lbname,
                          tagvalues,
                          constants.RESOURCE_TYPES[4],
                          inputObj.tnregionid
                        );

                        // let tquery = `UPDATE tbl_bs_tag_values a
                        //           set a.tagid = (select c.tagid from tbl_bs_tags c
                        //           where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                        //           a.resourceid = (select c.lbid from tbl_aws_loadbalancer c
                        //           where c.lbname=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                        //           a.createdby=:username
                        //           WHERE a.tagid IS NULL AND a.resourcetype =:resourcetype`;
                        let cquery = `UPDATE tbl_bs_tag_values a
                          JOIN tbl_bs_tags c1 ON c1.tagname = a.lastupdatedby AND c1.tenantid = :tenantid
                          JOIN tbl_aws_loadbalancer c2 ON c2.lbname = a.createdby AND c2.status = :status AND c2.tnregionid = :tnregionid
                          SET a.tagid = c1.tagid, a.resourceid = c2.lbid, a.createdby = :username
                          WHERE a.tagid IS NULL AND a.resourcetype = :resourcetype;`;
                        new Controller().syncTagValues(
                          inputObj,
                          constants.RESOURCE_TYPES[4],
                          tagvalues,
                          cquery
                        );
                        setTimeout(() => {
                          lbIndex += 1;
                          describeTag(lbIndex);
                        }, 2000);
                      }
                    });
                  }
                }
              })
              .catch((error: Error) => {
                reject(error);
              });
          } else {
            reject("No data found");
          }
        }
      });
    });
  }
  syncTagValues(inputObj, resourcetype, tagvalues, query): Promise<any> {
    return new Promise((resolve, reject) => {
      commonService.bulkCreate(tagvalues, db.TagValues).then((data) => {
        let params = {
          replacements: {
            tenantid: inputObj.tenantid,
            customerid: inputObj.customerid,
            region: inputObj.region,
            username: inputObj.username,
            resourcetype: resourcetype,
            status: constants.STATUS_ACTIVE,
            tnregionid: inputObj.tnregionid,
          },
        };
        db.sequelize
          .query(query, params)
          .then((list) => {
            // Create Tags
            let query = `select DISTINCT lastupdatedby  from tbl_bs_tag_values
              where tagid is null AND tenantid=:tenantid AND resourcetype=:resourcetype AND lastupdatedby!=:username`;
            let params = {
              replacements: {
                tenantid: inputObj.tenantid,
                resourcetype: resourcetype,
                username: inputObj.username,
              },
              type: db.sequelize.QueryTypes.SELECT,
            };
            db.sequelize
              .query(query, params)
              .then((tvlist) => {
                let taglist = [];
                if (tvlist && tvlist.length > 0) {
                  _.forEach(JSON.parse(JSON.stringify(tvlist)), function (tag) {
                    let obj = {
                      tenantid: inputObj.tenantid,
                      //resourcetype: presourcetype,
                      tagname: tag.lastupdatedby,
                      tagtype: "text",
                      status: constants.STATUS_ACTIVE,
                      createdby: inputObj.username,
                      createddt: new Date(),
                      lastupdatedby: inputObj.username,
                      lastupdateddt: new Date(),
                    };
                    taglist.push(obj);
                  });

                  commonService
                    .bulkCreate(taglist, db.Tags)
                    .then((data) => {
                      resolve(data);
                      let query = `UPDATE tbl_bs_tag_values a
                                          set a.tagid = (select c.tagid from tbl_bs_tags c
                                          where c.tagname=a.lastupdatedby AND c.tenantid=:tenantid LIMIT 1),
                                          a.createdby=:username,
                                          a.lastupdatedby=:username
                                          WHERE  a.tenantid=:tenantid AND a.resourcetype=:resourcetype`;
                      let params = {
                        replacements: {
                          tenantid: inputObj.tenantid,
                          customerid: inputObj.customerid,
                          region: inputObj.region,
                          username: inputObj.username,
                          resourcetype: resourcetype,
                        },
                      };
                      commonService
                        .executeQuery(query, params, db.sequelize)
                        .then((list) => {})
                        .catch((error: Error) => {
                          reject(error);
                        });
                    })
                    .catch((error: Error) => {
                      reject(error);
                    });
                }
              })
              .catch((error: Error) => {
                reject(error);
              });
          })
          .catch((error: Error) => {
            reject(error);
          });

        // customValidation.generateSuccessResponse({}, response, constants.RESPONSE_TYPE_SAVE, res, req);
      });
    });
  }
  uploadLog(filename, tenantid) {
    let eventObj = {
      tenantid: tenantid,
      module: "Asset Sync",
      referencetype: "S3",
      cloudprovider: constants.CLOUD_AWS,
      eventtype: "Asset Sync",
      //"severity": "Normal",
      severity: "Medium",
      eventdate: new Date(),
      notes: `<a href="${process.env.BASE_URL}/cloudmatiq/base/wazuh/file/${filename}" target="_blank" style="color: rgb(216, 173, 0) !important; font-weight: bold" >Click here to download the file !</a >`,
      createddt: new Date(),
      createdby: "System",
      status: constants.STATUS_ACTIVE,
    };
    db.eventlog.create(eventObj);
    commonService.uploadFiletoS3(
      `${process.cwd()}/logs/${filename}`,
      `Assetsync/${filename}`
    );
  }
  syncOtherAssets(inputObj, logger): Promise<any> {
    return new Promise((resolve, reject) => {
      AWS.config.region = inputObj.region;
      //simple storage service
      let s3 = new AWS.S3({ apiVersion: constants.AWS_S3_APIVERSION });
      s3.listBuckets(function (err, data) {
        if (err) {
          reject(err);
        } else {
          new Controller().createCloudAssets(
            data,
            inputObj,
            inputObj.username,
            "S3",
            "Name",
            "Buckets"
          );
        }
      });
      AWS.config.region = inputObj.region;
      //Elastic container service
      let ECS = new AWS.ECS({ apiVersion: constants.AWS_ECS_APIVERSION });
      ECS.describeClusters(function (err, data) {
        if (err) {
          reject(err);
        } else {
          new Controller().createCloudAssets(
            data,
            inputObj,
            inputObj.username,
            "ECS",
            "clusterName",
            "clusters",
            "ASSET_ECS"
          );
          new Controller().createCloudAssets(
            data,
            inputObj,
            inputObj.username,
            "ECS",
            "arn",
            "failures",
            "ASSET_ECS"
          );
        }
      });

      //Elastic kubernet service
      let EKS = new AWS.EKS({ apiVersion: constants.AWS_EKS_APIVERSION });
      EKS.listClusters(function (err, data) {
        if (err) {
          reject(err);
        } else {
          new Controller().createCloudAssets(
            data,
            inputObj,
            inputObj.username,
            "EKS",
            null,
            "clusters",
            "ASSET_EKS"
          );
        }
      });

      //Storage gateway service

      // let SGS = new AWS.StorageGateway({ apiVersion: constants.AWS_SGS_APIVERSION });
      // SGS.listGateways(function (err, data) {
      //   if (err) {
      //     reject(err);
      //   } else {
      //     console.log(JSON.stringify(data));
      //     new Controller().createCloudAssets(
      //       data,
      //       inputObj,
      //       inputObj.username,
      //       "SGS",
      //       null,
      //       "Gateways",
      //       "ASSET_SGS"
      //     );
      //   }
      // });

      //RDS service

      let rds = new AWS.RDS({ apiVersion: constants.AWS_RDS_APIVERSION });
      rds.describeDBInstances({}, function (err, data) {
        resolve(data);
        if (err) {
          reject(err);
        } else {
          new Controller().createCloudAssets(
            data,
            inputObj,
            inputObj.username,
            "RDS",
            "DBInstanceIdentifier",
            "DBInstances",
            "ASSET_RDS"
          );
        }
      });
    });
  }
  createCloudAssets(
    data,
    inputObj,
    username,
    type,
    assetname,
    key,
    resourcetype?
  ) {
    let assetArray = [];
    for (let bucket of data[key]) {
      let obj = {
        tenantid: inputObj.tenantid,
        tnregionid: inputObj.tnregionid,
        assetname: assetname ? bucket[assetname] : bucket,
        cloudprovider: constants.CLOUD_AWS,
        assettype: type,
        assetdata: bucket,
        status: constants.STATUS_ACTIVE,
        createdby: username,
        createddt: new Date(),
        lastupdatedby: username,
        lastupdateddt: new Date(),
      } as any;
      assetArray.push(obj);
    }
    commonService
      .bulkCreate(assetArray, db.CloudAsset)
      .then((result) => {
        AssetHistoryService.getHistory(inputObj.tenantid, resourcetype);
        console.log(constants.STATUS_SUCCESS);
      })
      .catch((e) => {
        console.log(e);
      });
  }
  addTagValue(
    inputObj,
    metadata: any,
    refid: any,
    tagvalues: any,
    presourcetype: any,
    tnregionid
  ) {
    try {
      if (metadata && metadata.length > 0) {
        metadata.forEach((element) => {
          if (constants.DEFAULT_TAGS.indexOf(element.Key) == -1) {
            let tag = {
              tenantid: inputObj.tenantid,
              cloudprovider: constants.CLOUD_AWS,
              resourcetype: presourcetype,
              tagvalue: element.Value,
              resourcerefid: refid,
              tnregionid: tnregionid,
              status: constants.STATUS_ACTIVE,
              createdby: refid,
              createddt: new Date(),
              lastupdatedby: element.Key,
              lastupdateddt: new Date(),
            };
            tagvalues.push(tag);
          }
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
  syncInternetGateway(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create EC2 service object
      let ec2 = new AWS.EC2({ apiVersion: constants.AWS_EC2_APIVERSION });
      ec2.describeInternetGateways({}, function (err, data) {
        if (err) {
          reject(err);
        } else {
          let internetGwArray = [];
          if (data && data.InternetGateways.length > 0) {
            data.InternetGateways.forEach((element) => {
              let object = {
                tenantid: inputObj.tenantid,
                gatewayname: element.InternetGatewayId,
                awsinternetgatewayid: element.InternetGatewayId,
                customerid: inputObj.customerid,
                notes: "",
                tnregionid: inputObj.tnregionid,
                status: constants.STATUS_ACTIVE,
                createdby:
                  element.Attachments && element.Attachments.length > 0
                    ? element.Attachments[0].VpcId
                    : "System",
                createddt: new Date(),
                lastupdatedby: inputObj.username,
                lastupdateddt: new Date(),
              };
              internetGwArray.push(object);
            });
            commonService
              .bulkCreate(internetGwArray, db.awsinternetgateway)
              .then((results) => {
                //Asset Mapping
                let ids = _.map(
                  JSON.parse(JSON.stringify(results)),
                  function (item: any) {
                    return {
                      resourceid: item.internetgatewayid,
                      resourcerefid: item.awsinternetgatewayid,
                    };
                  }
                );
                commonService.bulkAssetMapping(
                  ids,
                  inputObj.tenantid,
                  constants.CLOUD_AWS,
                  constants.RESOURCE_TYPES[8],
                  inputObj.customerid,
                  inputObj.tnregionid
                );
                AssetHistoryService.getHistory(
                  inputObj.tenantid,
                  constants.RESOURCE_TYPES[8]
                );

                let query = `UPDATE tbl_aws_internetgateways a
                                   set a.vpcid = (select c.vpcid from tbl_aws_vpc c
                                   where c.awsvpcid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid ORDER BY 1 DESC LIMIT 1),
                                   a.createdby=:username,
                                   a.lastupdatedby=:username
                                   WHERE a.tnregionid=:tnregionid AND a.status=:status;`;
                let params = {
                  replacements: {
                    tenantid: inputObj.tenantid,
                    customerid: inputObj.customerid,
                    region: inputObj.region,
                    status: constants.STATUS_ACTIVE,
                    username: inputObj.username,
                    tnregionid: inputObj.tnregionid,
                  },
                };
                commonService
                  .executeQuery(query, params, db.sequelize)
                  .catch((error: Error) => {
                    console.log(error);
                  });
                resolve(data);
              })
              .catch((error: Error) => {
                reject(error);
              });
          } else {
            resolve(data);
          }
        }
      });
    });
  }
  syncMissingImages(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      commonService
        .getAllList(
          {
            where: {
              tenantid: inputObj.tenantid,
              cloudprovider: constants.CLOUD_AWS,
              status: constants.STATUS_ACTIVE,
              tnregionid: inputObj.tnregionid,
              // imageid: { $eq: null },
            },
            group: ["imagerefid"],
          },
          db.Instances
        )
        .then((assets) => {
          if (assets) {
            // Create EC2 service object
            let params = {
              Filters: [
                {
                  Name: "image-id",
                  Values: [],
                },
              ],
            } as any;
            params.Filters[0].Values = _.map(
              JSON.parse(JSON.stringify(assets)),
              "imagerefid"
            );
            let ec2 = new AWS.EC2({
              apiVersion: constants.AWS_EC2_APIVERSION,
            });
            ec2.describeImages(params, function (err, data) {
              if (err) {
                console.log(err, err.stack); // an error occurred
              } else {
                if (data && data.Images.length > 0) {
                  let array = [];
                  data.Images.forEach((element) => {
                    let object = {
                      awsamiid: element.ImageId,
                      tenantid: inputObj.tenantid,
                      aminame: element.Name,
                      platform:
                        element.Platform && element.Platform == "windows"
                          ? "windows"
                          : "linux",
                      notes: element.Description
                        ? element.Description.substring(0, 100)
                        : "",
                      tnregionid: inputObj.tnregionid,
                      status: constants.STATUS_ACTIVE,
                      createdby: inputObj.username,
                      createddt: new Date(),
                    };
                    array.push(object);
                  });

                  // let updatePlatformQuery = `UPDATE tbl_tn_instances a
                  //       set a.platform = (select c.platform from tbl_aws_ami c
                  //       where c.awsamiid=a.imagerefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1)
                  //       WHERE a.cloudprovider=:cloudprovider AND a.tnregionid=:tnregionid AND a.status=:status AND a.imageid IS NOT NULL`;

                  // await commonService.executeQuery(
                  //   updatePlatformQuery,
                  //   {
                  //     replacements: {
                  //       tenantid: inputObj.tenantid,
                  //       customerid: inputObj.customerid,
                  //       region: inputObj.region,
                  //       username: inputObj.username,
                  //       status: constants.STATUS_ACTIVE,
                  //       cloudprovider: constants.CLOUD_AWS,
                  //       tnregionid: inputObj.tnregionid,
                  //     },
                  //   },
                  //   db.sequelize
                  // );

                  commonService
                    .bulkCreate(array, db.awsami)
                    .then((data) => {
                      let query = `UPDATE tbl_tn_instances a
                            set a.imageid = (select c.amiid from tbl_aws_ami c where c.awsamiid=a.imagerefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1), 
                            a.platform = (select c.platform from tbl_aws_ami c where c.awsamiid=a.imagerefid AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1)
                            WHERE a.imageid IS NULL AND a.platform IS NULL AND a.cloudprovider=:cloudprovider AND a.tnregionid=:tnregionid AND a.status=:status`;
                      let params = {
                        replacements: {
                          tenantid: inputObj.tenantid,
                          customerid: inputObj.customerid,
                          region: inputObj.region,
                          username: inputObj.username,
                          status: constants.STATUS_ACTIVE,
                          cloudprovider: constants.CLOUD_AWS,
                          tnregionid: inputObj.tnregionid,
                        },
                      };
                      commonService
                        .executeQuery(query, params, db.sequelize)
                        .catch((error: Error) => {
                          console.log(error);
                        });
                    })
                    .catch((error: Error) => {
                      console.log(error);
                    });
                }
              }
            });
          } else {
            console.log("All images available..");
          }
        })
        .catch((err) => {
          console.log(err);
        });

      let query = `UPDATE tbl_aws_volumeattachments a
                            set  a.volumeid = (select c.volumeid from tbl_aws_volumes c
                            where c.awsvolumeid=a.createdby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                            a.instanceid = (select c.instanceid from tbl_tn_instances c
                            where c.instancerefid=a.lastupdatedby AND c.status=:status AND c.tnregionid=:tnregionid LIMIT 1),
                            createdby=:username,
                            lastupdatedby=:username
                            WHERE a.tnregionid=:tnregionid AND a.status=:status`;
      let params = {
        replacements: {
          tenantid: inputObj.tenantid,
          customerid: inputObj.customerid,
          region: inputObj.region,
          username: inputObj.username,
          status: constants.STATUS_ACTIVE,
          cloudprovider: constants.CLOUD_AWS,
          tnregionid: inputObj.tnregionid,
        },
      };
      commonService
        .executeQuery(query, params, db.sequelize)
        .then((list) => {})
        .catch((error: Error) => {
          console.log(error);
        });
    });
  }
  bulkCreate(data, model) {
    commonService
      .bulkCreate(data, model)
      .then((data) => {
        //customValidation.generateSuccessResponse(data, response, constants.RESPONSE_TYPE_SAVE, res, req);
      })
      .catch((error: Error) => {
        console.log(error);
      });
  }
  syncImages(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // Create EC2 service object
        let params = {
          Filters: [
            {
              Name: "name",
              Values: [
                "ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-20200408",
                "Windows_Server-2012-R2_RTM-English-64Bit-SQL_2016_SP2_Enterprise-2020.05.13",
                "Windows_Server-2016-English-Full-SQL_2019_Standard-2020.05.13",
                "amzn2-ami-hvm-2.0.20200520.1-x86_64-gp2",
                "ubuntu/images/hvm-ssd/ubuntu-xenial-16.04-amd64-server-20200407",
                "Windows_Server-2019-English-Full-Base-2020.08.12",
              ],
            },
          ],
        };

        let ec2 = new AWS.EC2({ apiVersion: constants.AWS_EC2_APIVERSION });
        ec2.describeImages(params, function (err, data) {
          if (err) {
            reject(err);
            console.log(err, err.stack); // an error occurred
          } else {
            if (data && data.Images.length > 0) {
              let array = [];
              data.Images.forEach((element) => {
                let object = {
                  awsamiid: element.ImageId,
                  tenantid: inputObj.tenantid,
                  aminame: element.Name,
                  platform:
                    element.Platform && element.Platform == "windows"
                      ? "windows"
                      : "linux",
                  notes: element.Description.substring(0, 100),
                  tnregionid: inputObj.tnregionid,
                  status: constants.STATUS_ACTIVE,
                  createdby: inputObj.username,
                  createddt: new Date(),
                };
                array.push(object);
              });
              new Controller().bulkCreate(array, db.awsami);
              resolve(array);
            } else {
              resolve(data.Images);
            }
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  syncSSMStatus(inputObj): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        ssmService
          .getManagedNodes(inputObj.credentials, inputObj.region)
          .then((data) => {
            resolve(data);
          })
          .catch((error: Error) => {
            reject(error);
          });
      } catch (e) {
        reject(e);
      }
    });
  }
  getCrossAccountCredentials = (
    awsCredentials: any,
    region: any,
    awsaccountid: any,
    awsiamrole: any
  ) => {
    return new Promise((resolve, reject) => {
      let accesskeys = {
        accessKeyId: awsCredentials.cloudauthkey,
        secretAccessKey: awsCredentials.cloudseckey,
        region: region,
      };
      if (
        awsCredentials.accounttype &&
        awsCredentials.accounttype == "Root Account"
      ) {
        resolve(accesskeys);
      } else {
        AWS.config.update(accesskeys);
        AWS.config.region = region;
        AWS.config.apiVersions = {
          sts: "2011-06-15",
          // other service API versions
        };
        let sts = new AWS.STS({});
        sts.assumeRole(
          {
            RoleArn: "arn:aws:iam::" + awsaccountid + ":role/" + awsiamrole,
            RoleSessionName: "CloudOperationsGlobal-" + new Date().getTime(),
            DurationSeconds: 3600,
          },
          function (err, roledata) {
            if (err) {
              resolve(accesskeys);
            } else {
              resolve({
                accessKeyId: roledata.Credentials.AccessKeyId,
                secretAccessKey: roledata.Credentials.SecretAccessKey,
                sessionToken: roledata.Credentials.SessionToken,
              });
            }
          }
        );
      }
    });
  };

  obtainCrossAccountCredentials = async (
    awsCredentials: any,
    region: any,
    customerid: number
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      commonService
        .executeQuery(
          `SELECT awsaccountid, tenantid, ( select tbl.keyvalue from tbl_bs_lookup tbl where tbl.tenantid = ttc.tenantid and tbl.lookupkey = "AWS_IAM_ROLE" and tbl.status = "Active" limit 1) awsrole, ttc.customerid from tbl_tn_customers ttc where ttc.customerid = ${customerid}`,
          {
            type: db.Sequelize.QueryTypes.SELECT,
          },
          db.sequelize
        )
        .then((data) => {
          console.log(JSON.stringify(data));
          if (
            data &&
            data.length > 0 &&
            data[0] &&
            data[0]["awsaccountid"] &&
            data[0]["awsrole"]
          ) {
            this.getCrossAccountCredentials(
              awsCredentials,
              region,
              data[0]["awsaccountid"],
              data[0]["awsrole"]
            )
              .then((iam) => {
                resolve(iam);
              })
              .catch((err) => {
                reject(new Error("AWS credentials not found."));
              });
          } else {
            reject(new Error("AWS credentials not found."));
          }
        })
        .catch((err) => {
          console.log("Error getting AWS creds>>>>>>>>");
          console.log(err);
          reject(err);
        });
    });
  };

  instanceSync(req, res) {
    let response = {};
    try {
      let params = {};
      let instanceQry = {
        where: {
          instancerefid: req.body.instancerefid,
          status: "Active",
          tenantid: req.body.tenantid,
        },
      };
      let customQry = {
        where: {
          tenantid: req.body.tenantid,
          status: constants.STATUS_ACTIVE,
          fieldlabel: { $in: ["CLOUD_DETAILS"] },
        },
      };
      // Get Credentials from the custom field data
      db.CustomField.findAll(customQry)
        .then((custom) => {
          if (custom) {
            custom = JSON.parse(JSON.stringify(custom));
            let clouddetails: any = _.find(custom, function (data: any) {
              if (data.fieldlabel === "CLOUD_DETAILS") {
                data.fieldvalue = commonService.decrypt(data.fieldvalue);
                return data;
              }
            });
            let awsCredentials = _.find(
              JSON.parse(clouddetails.fieldvalue),
              function (data: any) {
                if (data.cloudprovider === constants.CLOUD_AWS) {
                  return data;
                }
              }
            );
            // Check Instance Exist or not
            db.Instances.findOne(instanceQry)
              .then((instance: any) => {
                if (instance != null) {
                  AWS.config.region = instance["dataValues"].region;
                  console.log(awsCredentials);
                  AWS.config.update(awsCredentials);
                  let ec2 = new AWS.EC2({
                    apiVersion: constants.AWS_EC2_APIVERSION,
                  });
                  ec2.describeInstances(params, function (err, data) {
                    if (err) {
                      console.log(err);
                      customValidation.generateAppError(
                        err,
                        response,
                        res,
                        req
                      );
                    }
                    if (data) {
                      console.log(data);
                    }
                  });
                } else {
                  customValidation.generateErrorMsg(
                    "Instance Details Not Found",
                    res,
                    404,
                    req
                  );
                }
              })
              .catch((err) => {
                console.log(err);
                customValidation.generateAppError(err, response, res, req);
              });
          } else {
            customValidation.generateErrorMsg(
              "Custom Field Details Not Found",
              res,
              404,
              req
            );
          }
        })
        .catch((err) => {
          console.log(err);
          customValidation.generateAppError(err, response, res, req);
        });
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }
}

export default new Controller();

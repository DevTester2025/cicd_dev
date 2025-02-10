import { Transaction, Instance } from "sequelize";
//import { Logger } from "winston";

import db from "../models/model";
import logger from "../../common/logger";
import * as crypto from "crypto";
import * as fs from "fs";
import * as _ from "lodash";
import * as request from "request";
import { AppError } from "../../common/appError";
import {
  constants,
  CITRIXApiURL,
} from "../../common/constants";
import AppLogger from "../../lib/logger";
import { S3 } from "aws-sdk";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";
import { ReleaseHeaderInstance } from "../models/cicd/release/releaseprocessheader.model";
import { json } from "express";
import * as  base32 from 'hi-base32';

let algorithm = "aes-256-ctr";
let password = "CSDM#2020";
class CommonService {
  constructor() {
    // Empty Constructor
  }
  getAllList(condition: any, accessObject: any): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return accessObject
        .findAll(condition)
        .then((data: any) => {
          resolve(data);
        })
        .catch((error: Error) => {
          logger.error(error);
          reject(error);
        });
    });

    return promise;
  }

  getById(condition: any, accessObject: any): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return accessObject
        .findById(condition)
        .then((data: any) => {
          resolve(data);
        })
        .catch((error: Error) => {
          logger.error(error.message);
          reject(error);
        });
    });
    return promise;
  }
  create(data: any, accessObject: any): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return db.sequelize.transaction((t: Transaction) => {
        return accessObject
          .create(data, { transaction: t })
          .then((result: any) => {
            resolve(result);
          })
          .catch((error: Error) => {
            logger.error(error.message);
            t.rollback();
            reject(error);
          });
      });
    });

    return promise;
  }

  update(
    condition: any,
    data: any,
    accessObject: any,
    spreadcondition?
  ): Promise<void> {
    let promise = new Promise<void>((resolve: Function, reject: Function) => {
      return db.sequelize.transaction((t: Transaction) => {
        return accessObject
          .update(
            data,
            { returning: true, plain: true, where: condition },
            { transaction: t }
          )
          .spread((affectedCount, affectedRows) => {
            return accessObject.findOne({
              where: spreadcondition ? spreadcondition : condition,
            });
          })
          .then((results: any) => {
            resolve(results);
          })
          .catch((error: Error) => {
            logger.error(error.message);
            t.rollback();
            reject(error);
          });
      });
    });
    return promise;
  }
  getData(condition: any, accessObject: any): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return db.sequelize.transaction((t: Transaction) => {
        return accessObject
          .findOne(condition, { transaction: t })
          .then((data: any) => {
            resolve(data);
          })
          .catch((error: Error) => {
            logger.error(error.message);
            t.rollback();
            reject(error);
          });
      });
    });
    return promise;
  }

  saveWithAssociation(
    data: any,
    options: any,
    accessObject: any
  ): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return db.sequelize.transaction((t: Transaction) => {
        options.transaction = t;
        return accessObject
          .create(data, options)
          .then((result: any) => {
            resolve(result);
          })
          .catch((error: Error) => {
            logger.error(error.message);
            t.rollback();
            reject(error);
          });
      });
    });
    return promise;
  }

  bulkCreate(array: any, accessObject: any): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return db.sequelize.transaction((t: Transaction) => {
        return accessObject
          .bulkCreate(array, { ignoreDuplicates: true })
          .then((result: any) => {
            resolve(result);
          })
          .catch((error: Error) => {
            logger.error(error.message);
            t.rollback();
            reject(error);
          });
      });
    });
    return promise;
  }

  bulkUpdate(array: any, options: any, accessObject: any): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return db.sequelize.transaction((t: Transaction) => {
        return accessObject
          .bulkCreate(array, { updateOnDuplicate: options, transaction: t })
          .then((result: any) => {
            resolve(result);
          })
          .catch((error: Error) => {
            logger.error(error.message);
            t.rollback();
            reject(error);
          });
      });
    });
    return promise;
  }

  upsert(data: any, accessObject: any): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return db.sequelize.transaction((t: Transaction) => {
        return accessObject
          .upsert(data, { transaction: t })
          .then((data: any) => {
            resolve(data);
          })
          .catch((error: Error) => {
            logger.error(error.message);
            t.rollback();
            reject(error);
          });
      });
    });
    return promise;
  }
  delete(data: any, accessObject: any): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return accessObject
        .destroy({ where: data })
        .then((data: any) => {
          resolve(data);
        })
        .catch((error: Error) => {
          logger.error(error.message);
          reject(error);
        });
    });
    return promise;
  }
  getOrSave(
    condition: any,
    data: any,
    accessObject: any,
    associations?: any
  ): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return db.sequelize.transaction((t: Transaction) => {
        return accessObject
          .findOrCreate({
            where: condition,
            include: associations,
            defaults: data,
            transaction: t,
          })
          .then((data: any) => {
            resolve(data);
          })
          .catch((error: Error) => {
            logger.error(error.message);
            t.rollback();
            reject(error);
          });
      });
    });

    return promise;
  }
  createchecksum(data: string): string {
    return crypto.createHash("md5").update(data).digest("hex");
  }
  validatechecksum(data: string, checksum: string) {
    if (data && checksum) {
      const cs = crypto.createHash("md5").update(data).digest("hex");
      console.log("VALIDATING CHECKSUM >>>>>>>>>>>>>");
      console.log(cs, checksum);
      console.log(cs == checksum);
      return cs == checksum;
    }
    return false;
  }
  encrypt(text: string) {
    let cipher = crypto.createCipher(algorithm, password);
    let crypted = cipher.update(text, "utf8", "hex");
    crypted += cipher.final("hex");
    return crypted;
  }
  decrypt(text: string) {
    let decipher = crypto.createDecipher(algorithm, password);
    let dec = decipher.update(text, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  }
  fileUpload(path, filename) {
    try {
      fs.readFile(path, function (err, data) {
        console.log(err);
        fs.writeFile(filename, data, function (err) {
          if (err) {
            console.error(err);
          } else {
            return filename;
          }
        });
      });
    } catch (e) {
      console.error(e);
    }
  }
  getS3PresignedURL(filename) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      try {
        const s3 = new S3({
          endpoint: process.env.S3ENDPT,
          accessKeyId: process.env.APP_AWS_ACCESS,
          secretAccessKey: process.env.APP_AWS_SECRET,
        });
        s3.getObject(
          {
            Bucket: constants.AWS_BUCKET,
            Key: filename,
          },
          function (err, img) {
            if (err) {
              reject(err);
            } else {
              console.log("Script File readed", img);
              resolve(img);
            }
          }
        );
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }
  readS3File(filename) {
    console.log(filename);
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      try {
        const s3 = new S3({
          endpoint: process.env.S3ENDPT,
          accessKeyId: process.env.APP_AWS_ACCESS,
          secretAccessKey: process.env.APP_AWS_SECRET,
        });
        s3.getObject(
          {
            Bucket: constants.AWS_BUCKET,
            Key: filename,
          },
          function (err, img) {
            if (err) {
              reject(err);
            } else {
              console.log("Script File readed", img);
              resolve(img.Body);
            }
          }
        );
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }
  deleteS3File(filename) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      try {
        const s3 = new S3({
          endpoint: process.env.S3ENDPT,
          accessKeyId: process.env.APP_AWS_ACCESS,
          secretAccessKey: process.env.APP_AWS_SECRET,
        });
        s3.deleteObject(
          {
            Bucket: constants.AWS_BUCKET,
            Key: filename,
          },
          function (err, response) {
            if (err) {
              reject(err);
            } else {
              console.log("File deleted", response);
              resolve(response);
            }
          }
        );
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }
  readFile(filename, input) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      try {
        fs.readFile(filename, "utf8", function (err, data) {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            let obj = JSON.stringify(data);
            resolve(obj);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }
  generateRandomNumber(digit: number) {
    return Math.random().toString().substr(2, digit);
  }

  getCount(condition, accessObject) {
    let promise = new Promise((resolve, reject) => {
      return accessObject
        .count(condition)
        .then((entity) => {
          resolve(entity);
        })
        .catch((error) => {
          reject(error);
        });
    });
    return promise;
  }

  getCountAndList(condition: any, accessObject: any): Promise<any> {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return accessObject
        .findAndCountAll(condition)
        .then((data: any) => {
          resolve(data);
        })
        .catch((error: Error) => {
          logger.error(error);
          reject(error);
        });
    });

    return promise;
  }

  executeQuery(querystring: any, queryparams: any, sequelize: any) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      return sequelize
        .query(querystring, queryparams)
        .then((data: any) => {
          resolve(data);
        })
        .catch((error: Error) => {
          logger.error(error.message);
          reject(error);
        });
    });
    return promise;
  }

  callECL2Reqest(
    pmethod: any,
    pzone: any,
    ptenantid: any,
    requesturl: any,
    requestheader: any,
    requestparams: any,
    ecl2tenantid: any,
    logger?: AppLogger
  ) {
    let appLogger = logger;

    if (!appLogger) {
      appLogger = new AppLogger(null, null);
    }

    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      requesturl = requesturl.replace("{zone}", pzone);
      let ecl2authurl = constants.ECL2_GET_AUTH_TOKEN_URL.replace(
        "{zone}",
        pzone
      );
      appLogger.writeLogToFile(
        "info",
        "Request URL >>>>>>>>>>>>>>>",
        requesturl
      );
      appLogger.writeLogToFile("info", ecl2authurl);

      let parameters = {} as any;
      parameters = {
        where: { tenantid: ptenantid, fieldlabel: { $in: ["CLOUD_DETAILS"] } },
      };
      this.getAllList(parameters, db.CustomField)
        .then((list) => {
          // console.log(list);

          if (null == list || list.size === 0) {
            reject(
              new AppError(
                constants.ECL2_INVALID_CREDENTIALS.replace("{region}", pzone)
              )
            );
          }
          let clouddetails = _.find(list, function (data: any) {
            if (data.fieldlabel === "CLOUD_DETAILS") {
              data.fieldvalue = new CommonService().decrypt(data.fieldvalue);
              return data;
            }
          });

          if (_.isEmpty(clouddetails) || _.isEmpty(clouddetails.fieldvalue)) {
            reject(
              new AppError(
                constants.ECL2_INVALID_CREDENTIALS.replace("{region}", pzone)
              )
            );
          }
          let ecl2cloud = _.find(
            JSON.parse(clouddetails.fieldvalue),
            function (data: any) {
              if (data.cloudprovider === "ECL2") {
                return data;
              }
            }
          );
          if (
            _.isEmpty(ecl2cloud) ||
            _.isEmpty(ecl2cloud.cloudauthkey) ||
            _.isEmpty(ecl2cloud.cloudseckey)
          ) {
            reject(
              new AppError(
                constants.ECL2_INVALID_CREDENTIALS.replace("{region}", pzone)
              )
            );
          } else {
            appLogger.writeLogToFile("info", ecl2cloud);
            try {
              request.post(
                {
                  url: ecl2authurl,
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                  json: {
                    auth: {
                      identity: {
                        methods: ["password"],
                        password: {
                          user: {
                            domain: {
                              id: "default",
                            },
                            name: ecl2cloud.cloudauthkey,
                            password: ecl2cloud.cloudseckey,
                          },
                        },
                      },
                      scope: {
                        project: {
                          id: ecl2tenantid,
                        },
                      },
                    },
                  },
                },
                function (err, httpResponse, body) {
                  if (err) {
                    appLogger.writeLogToFile("error", err);
                    reject(new AppError(err.message));
                  } else {
                    appLogger.writeLogToFile(
                      "info",
                      httpResponse.headers["x-subject-token"]
                    );
                    if (_.isEmpty(httpResponse.headers["x-subject-token"])) {
                      reject(
                        new AppError(
                          constants.ECL2_INVALID_CREDENTIALS.replace(
                            "{region}",
                            pzone
                          )
                        )
                      );
                    } else {
                      requestheader = _.merge(requestheader, {
                        "X-Auth-Token": httpResponse.headers["x-subject-token"],
                      });
                      appLogger.writeLogToFile(
                        "info",
                        "\n-----Request Header-----"
                      );
                      appLogger.writeLogToFile("info", pmethod);
                      appLogger.writeLogToFile("info", requesturl);
                      appLogger.writeLogToFile("info", requestheader);
                      appLogger.writeLogToFile(
                        "info",
                        "\n-----Request Body-----"
                      );
                      appLogger.writeLogToFile(
                        "info",
                        JSON.stringify(requestparams)
                      );
                      request(
                        {
                          method: pmethod,
                          url: requesturl.replace(
                            new RegExp("{tenant_id}", "g"),
                            ecl2tenantid
                          ),
                          headers: requestheader,
                          json: JSON.parse(
                            JSON.stringify(requestparams).replace(
                              new RegExp("{tenant_id}", "g"),
                              ecl2tenantid
                            )
                          ),
                        },
                        function (err, httpResponse, body) {
                          if (err) {
                            appLogger.writeLogToFile(
                              "info",
                              "\n-----Response Error-----"
                            );
                            appLogger.writeLogToFile("info", err);
                            reject(new AppError(err.message));
                          } else {
                            appLogger.writeLogToFile(
                              "info",
                              "\n-----Response Body-----"
                            );
                            appLogger.writeLogToFile(
                              "info",
                              JSON.stringify(body)
                            );
                            if (body === "Authentication required") {
                              reject(
                                new AppError(
                                  constants.ECL2_INVALID_CREDENTIALS.replace(
                                    "{region}",
                                    pzone
                                  )
                                )
                              );
                            }
                            if (_.has(body, "No X-Auth-Token")) {
                              reject(
                                new AppError(
                                  constants.ECL2_INVALID_CREDENTIALS.replace(
                                    "{region}",
                                    pzone
                                  )
                                )
                              );
                            }
                            if (_.has(body, "error")) {
                              reject(
                                new AppError(
                                  body.error === ""
                                    ? "An unknown error has occurred"
                                    : body.error
                                )
                              );
                            }
                            if (_.has(body, "badRequest")) {
                              reject(new AppError(body.badRequest.message));
                            }
                            if (_.has(body, "conflictingRequest")) {
                              reject(
                                new AppError(body.conflictingRequest.message)
                              );
                            }
                            if (_.has(body, "api_error_message")) {
                              reject(new AppError(body.api_error_message));
                            }
                            if (_.has(body, "itemNotFound")) {
                              reject(new AppError(body.itemNotFound.message));
                            } else {
                              resolve(body);
                            }
                          }
                        }
                      );
                    }
                  }
                }
              );
            } catch (e) {
              console.log(e);
            }
          }
        })
        .catch((error: any) => {
          reject(error);
        });
    });
    return promise;
  }

  CitrixCall(
    urlmethod: any,
    requesturl: any,
    requestheader: any,
    requestparams: any,
    ipaddress: any,
    credentials: any
  ) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      let loginurl = CITRIXApiURL.AUTH.LOGIN.replace("{IP_ADDR}", ipaddress);
      let logouturl = CITRIXApiURL.AUTH.LOGOUT.replace("{IP_ADDR}", ipaddress);

      requesturl = requesturl.replace("{IP_ADDR}", ipaddress);
      request.post(
        {
          url: loginurl,
          rejectUnauthorized: false,
          strictSSL: false,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          json: {
            login: {
              username: credentials.adminusername,
              password: credentials.adminpassword,
              timeout: 900,
            },
          },
        },
        function (err, httpResponse, body) {
          if (err) {
            console.log(err);
          } else {
            let cookie = httpResponse.headers["set-cookie"] as any;
            if (!_.isEmpty(body)) {
              requestheader.Cookie = cookie[1];
              request(
                {
                  method: urlmethod,
                  url: requesturl,
                  rejectUnauthorized: false,
                  strictSSL: false,
                  headers: requestheader,
                  json: requestparams,
                },
                function (err, httpResponse, result) {
                  console.log(requestparams);
                  if (err) {
                    reject(err);
                  } else {
                    if (
                      httpResponse.statusCode === 201 ||
                      httpResponse.statusCode === 200
                    ) {
                      request.post(
                        {
                          url: logouturl,
                          rejectUnauthorized: false,
                          strictSSL: false,
                          headers: {
                            Accept: "application/json",
                            "Content-Type":
                              "application/vnd.com.citrix.netscaler.logout+json",
                            Cookie: cookie[1],
                          },
                          json: {
                            logout: {},
                          },
                        },
                        function (err, response, data) {
                          console.log(err);
                          console.log("logout -");
                          resolve({
                            code: httpResponse.statusCode,
                            message: constants.RESPONSE_TYPE_SAVE,
                            status: true,
                          });
                        }
                      );
                    } else {
                      resolve(result);
                    }
                    console.log(httpResponse.statusCode);
                  }
                }
              );
            }
          }
        }
      );
    });
    return promise;
  }

  callVSRX(
    pmethod: any,
    requesturl: any,
    requestheader: any,
    requestparams: any
  ) {
    console.log(requestparams);
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      let parameters = {} as any;
      let ipaddress: any;
      console.log(requestparams.vsrx);
      request(
        {
          method: pmethod,
          url: requesturl,
          rejectUnauthorized: false,
          strictSSL: false,
          auth: {
            username: requestparams.username,
            password: requestparams.password,
          },
          headers: {
            Accept: "application/xml",
            "Content-Type": "application/xml",
          },
          body: requestparams.vsrx,
        },
        function (err, httpResponse, body) {
          console.log(JSON.stringify(body));
          console.log("-error", err);
          if (err) {
            reject(err);
          } else {
            console.log("Responsebody", body);
            console.log("Responsebody", _.includes(body, "<load-success/>"));
            if (_.includes(body, "load-success")) {
              resolve({
                status: true,
                statusCode: 200,
                message: "Saved Successfully",
              });
            } else {
              reject(
                new AppError(
                  _.isEmpty(body) ? "An unknown error has occurred" : body
                )
              );
            }
          }
        }
      );
    });
    return promise;
  }

  bulkAssetMapping(
    ids: any,
    tenantid: any,
    cloudprovider: any,
    resourcetype: any,
    customerid: any,
    tnregionid: any
  ): void {
    try {
      let array = [];
      if (ids && ids.length > 0) {
        ids.forEach((element, i) => {
          let object = {
            tenantid: tenantid,
            cloudprovider: cloudprovider,
            resourcetype: resourcetype,
            resourceid: element.resourceid ? element.resourceid : null,
            resourcerefid: element.resourcerefid ? element.resourcerefid : null,
            customerid: customerid,
            tnregionid: tnregionid,
            status: constants.STATUS_ACTIVE,
            createdby: "ADMIN",
            createddt: new Date(),
          };
          array.push(object);
          if (i == ids.length - 1) {
            new CommonService()
              .bulkCreate(array, db.AssetMapping)
              .then((data) => {})
              .catch((error: Error) => {
                console.log(error);
              });
          }
        });
      } else {
        console.log("No asset mapped...");
      }
    } catch (e) {
      console.log(e);
    }
  }

  formatDate(date, format, utc) {
    var MMMM = [
      "\x00",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    var MMM = [
      "\x01",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    var dddd = [
      "\x02",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function ii(i, len?) {
      var s = i + "";
      len = len || 2;
      while (s.length < len) s = "0" + s;
      return s;
    }

    var y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);

    var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);

    var d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);

    var H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);

    var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);

    var m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);

    var s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);

    var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);

    var T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

    var t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

    var tz = -date.getTimezoneOffset();
    var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
      tz = Math.abs(tz);
      var tzHrs = Math.floor(tz / 60);
      var tzMin = tz % 60;
      K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);

    var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

    format = format.replace(/\\(.)/g, "$1");

    return format;
  }

  // s3 file upload

  uploadFiletoS3(path, filename, region?, bucketname?) {
    console.log("File path>>>>>", path);
    console.log("File name>>>>>", filename);
    let input = {
      endpoint: process.env.S3ENDPT,
      accessKeyId: process.env.APP_AWS_ACCESS,
      secretAccessKey: process.env.APP_AWS_SECRET,
    };
    if (region) {
      input["endpoint"] = `s3.${region}.amazonaws.com`;
    }else{
      region=process.env.APP_AWS_APS_REGION;
      console.log("Region>>>>>", region);   
     }
    const s3 = new S3(input);

    fs.readFile(path, function (err, data) {
      try{
      if (err) {
        console.log("Error while read log file");
      } else {
        const params = {
          Bucket: bucketname ? bucketname : constants.AWS_BUCKET,
          Key: filename,
          Body: data,
        };

        s3.upload(params, function (s3Err, s3Data) {
          if (s3Err) {
            console.error(s3Err);
          } else {
            console.log(s3Data);
            console.log(`File uploaded successfully at ${s3Data.Location}`);
          }
        });
      }
    }catch(err){
      console.error(err);
    }
    });
  }
  uploadLog(filename, tenantid, type, module, reference, severity) {
    let eventObj = {
      tenantid: tenantid,
      module: module,
      referencetype: reference,
      cloudprovider: constants.CLOUD_AWS,
      eventtype: type,
      //"severity": "Normal",
      severity,
      eventdate: new Date(),
      notes: `<a href="${process.env.BASE_URL}/cloudmatiq/base/wazuh/file/${filename}" target="_blank" style="color: rgb(216, 173, 0) !important; font-weight: bold" >Click here to download the file !</a >`,
      createddt: new Date(),
      createdby: "System",
      status: constants.STATUS_ACTIVE,
    };
    db.eventlog.create(eventObj);
    this.uploadFiletoS3(
      `${process.cwd()}/logs/${filename}`,
      `Assetsync/${filename}`
    );
  }
  async getAllMasterList(accessObject: any): Promise<any> {
    try {
      const combinedList = accessObject;
      return combinedList;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
  
  async updateWithAssociation(
    data: any,
    options: any,
    mainModel: any,
    mainId: any
  ): Promise<any> {
    let transaction;
    try {
      transaction = await db.sequelize.transaction();
  
      const mainInstance = await mainModel.findByPk(mainId, { transaction });
      if (!mainInstance) {
        throw new Error('Main object not found');
      }
  
      // Update the main object
      await mainModel.update(data, { where: { id: mainId }, transaction });
        const bulkUpdatePromises = [];
      const bulkCreatePromises = [];
  
      // Process associated objects
      if (options && options.include) {
        for (const includeOption of options.include) {
          const associatedModel = includeOption.model; // Declare associatedModel within the loop
          const associationAlias = includeOption.as;
          const associatedData = data[associationAlias];
  
          if (associatedData && Array.isArray(associatedData)) {
            for (const associatedItem of associatedData) {
              const associatedItemId = associatedItem.id;
              const setupDetails = associatedItem.releasesetupdetailconfig;
  
              if (associatedItemId) {
                // If associated item has an ID, add it to bulk update
                bulkUpdatePromises.push(
                  associatedModel.update(associatedItem, {
                    where: { id: associatedItemId },
                    transaction
                  })
                );
  
                // If setupDetails are provided, add it to bulk update
                if (setupDetails) {
                  bulkUpdatePromises.push(
                    db.ReleaseSetupConfig.update(setupDetails, {
                      where: { releaseconfigdetailid: associatedItemId },
                      transaction
                    })
                  );
                }
              } else {
                // If associated item doesn't have an ID, add it to bulk create
                const createdAssociatedItem = associatedModel.create(associatedItem, { transaction });
                bulkCreatePromises.push(createdAssociatedItem);
  
                // If setupDetails are provided, add it to bulk create
                if (setupDetails) {
                  setupDetails.releaseconfigdetailid = (await createdAssociatedItem).id;
                  const createdSetupConfig = db.ReleaseSetupConfig.create(setupDetails, { transaction });
                  bulkCreatePromises.push(createdSetupConfig);
                }
              }
            }
          }
        }
      }
  
      // Execute bulk update and create operations
      await Promise.all(bulkUpdatePromises);
      await Promise.all(bulkCreatePromises);
  
      // Commit transaction
      await transaction.commit();
  
      return mainInstance;
    } catch (error) {
      // Rollback transaction on error
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }
  
  async updateWithAssociationPipeline(
    data: any,
    options: any,
    mainModel: any,
    mainId: any
  ): Promise<any> {
    let transaction;
    try {
      transaction = await db.sequelize.transaction();
  
      const mainInstance = await mainModel.findByPk(mainId, { transaction });
      if (!mainInstance) {
        throw new Error('Main object not found');
      }
  
      // Update the main object
      await mainModel.update(data, { where: { id: mainId }, transaction });
        const bulkUpdatePromises = [];
      const bulkCreatePromises = [];
  
      // Process associated objects
      if (options && options.include) {
        for (const includeOption of options.include) {
          const associatedModel = includeOption.model; // Declare associatedModel within the loop
          const associationAlias = includeOption.as;
          const associatedData = data[associationAlias];
  
          if (associatedData && Array.isArray(associatedData)) {
            for (const associatedItem of associatedData) {
              const associatedItemId = associatedItem.id;
              const setupDetails = associatedItem.templatedetailconfig;
  
              if (associatedItemId) {
                // If associated item has an ID, add it to bulk update
                bulkUpdatePromises.push(
                  associatedModel.update(associatedItem, {
                    where: { id: associatedItemId },
                    transaction
                  })
                );
  
                // If setupDetails are provided, add it to bulk update
                if (setupDetails) {
                  bulkUpdatePromises.push(
                    db.PipelineTemplateDetailConfiguration.update(setupDetails, {
                      where: { templatedetailid: associatedItemId },
                      transaction
                    })
                  );
                }
              } else {
                // If associated item doesn't have an ID, add it to bulk create
                const createdAssociatedItem = associatedModel.create(associatedItem, { transaction });
                bulkCreatePromises.push(createdAssociatedItem);
  
                // If setupDetails are provided, add it to bulk create
                if (setupDetails) {
                  setupDetails.templatedetailid = (await createdAssociatedItem).id;
                  const createdSetupConfig = db.PipelineTemplateDetailConfiguration.create(setupDetails, { transaction });
                  bulkCreatePromises.push(createdSetupConfig);
                }
              }
            }
          }
        }
      }
  
      // Execute bulk update and create operations
      await Promise.all(bulkUpdatePromises);
      await Promise.all(bulkCreatePromises);
  
      // Commit transaction
      await transaction.commit();
  
      return mainInstance;
    } catch (error) {
      // Rollback transaction on error
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  generateRandomBase32(): string {
    const buffer = crypto.randomBytes(15);
    const base32Secret = base32.encode(buffer).replace(/=/g, "").substring(0, 24);
    return base32Secret;
}
}

export default new CommonService();

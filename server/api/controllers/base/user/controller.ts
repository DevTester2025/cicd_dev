import CommonService from "../../../services/common.service";
import db from "../../../models/model";
import { messages } from "../../../../common/messages";
import { constants } from "../../../../common/constants";

import { Request, Response } from "express";
import { customValidation } from "../../../../common/validation/customValidation";
import _ = require("lodash");
import NotificationService from "../../../services/notification.service";
import sendSMS from "../../../services/sms-service";
import sendMail from "../../../services/email";
import * as JWT from "jsonwebtoken";
import * as TwoFactor from "node-2fa";
import { Op } from "sequelize";
import { modules } from "../../../../common/module";
import { AppError } from "../../../../common/appError";
import { queries } from "../../../../common/query";
import { TOTP } from "otpauth";
import getTemplate from "../../../services/template.service"
const qrcodes = require("qrcode");
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
export class Controller {
  constructor() { }
  all(req: Request, res: Response): void {
    let response = { reference: modules.USERS };
    try {
      let parameters = {
        where: req.body,
      } as any;
      if (req.body.roleids) {
        parameters["where"].roleid = { $in: req.body.roleids };
      }
      if (req.query.order && typeof req.query.order === "string") {
        let order: any = req.query.order;
        let splittedOrder = order.split(",");
        parameters["order"] = [splittedOrder];
        //#OP_B627
        if(splittedOrder[0] == 'roles.rolename'){
          parameters.order = [
            [{ model: db.UserRoles, as: "roles" }, "rolename", splittedOrder[1]],
          ];
        }
      };
      if (req.query.limit) {
        parameters["limit"] = req.query.limit;
      }
      if (req.query.offset) {
        parameters["offset"] = req.query.offset;
      }
      parameters.include = [] as any;
      if (req.query.tenant) {
        parameters.include.push({
          model: db.Tenant,
          as: "tenant",
          attributes: ["tenantname", "tenantid"],
        });
      }

      if (req.body.status == "Active") {
        parameters["where"] = {
          ...req.body,
          status: {
            [Op.ne]: "Deleted",
          },
        };
      }
      if (req.query.attributes) {
        parameters.include = [];
        let attributes: any = req.query.attributes;
        parameters.attributes = JSON.parse(attributes);
      }
      if (req.body.searchText) {
        let searchparams: any = {};
        searchparams["fullname"] = {
          $like: "%" + req.body.searchText + "%",
        };
        searchparams["email"] = {
          $like: "%" + req.body.searchText + "%",
        };
        // #OP_B627
        searchparams["secondaryphoneno"] = {
          $like: "%" + req.body.searchText + "%",
        };
        // #OP_B627
        searchparams["$roles.rolename$"] = {
          $like: "%" + req.body.searchText + "%",
        };
        parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
        parameters.where["$or"] = searchparams;
      }
      parameters.where = _.omit(parameters.where, ["order","roleids"]);
      if (req.query.chart) {
        let query = queries.KPI_USERS;
        let subquery = "";
        let params = {
          replacements: req.body,
          type: db.sequelize.QueryTypes.SELECT,
        } as any;
        params.replacements["durationquery"] = "";
        params.replacements["subquery"] = "";
        if (req.body.duration) {
          if (req.body.duration == "Daily") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(tbu.createddt,'%d-%M-%Y') AS x"
            );
          }
          if (req.body.duration == "Weekly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "CONCAT('Week ', 1 + DATE_FORMAT(tbu.createddt, '%U')) AS x"
            );
          }
          if (req.body.duration == "Monthly") {
            query = query.replace(
              new RegExp(":durationquery", "g"),
              "DATE_FORMAT(LAST_DAY(tbu.createddt),'%M-%Y') AS x"
            );
          }
        }

        if (Array.isArray(req.body.filters) && req.body.filters.length > 0) {
          for (let i = 0; i < req.body.filters.length; i++) {
            if (req.body.filters[i].userid) {
              const userid = req.body.filters[i].userid.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND tbu.userid IN (${userid.join(",")})`;
            }
            if (req.body.filters[i].roleid) {
              const roleid = req.body.filters[i].roleid.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND tbr.roleid IN (${roleid.join(",")})`;
            }
            if (req.body.filters[i].department) {
              const department = req.body.filters[i].department.map(
                (d) => `'${d.value}'`
              );
              subquery =
                subquery + ` AND tbu.department IN (${department.join(",")})`;
            }
            if (i + 1 == req.body.filters.length) {
              query = query.replace(new RegExp(":subquery", "g"), subquery);
            }
          }
        }

        if (req.body.groupby) {
          if(req.body.groupby  == "rolename"){
            query = query.replace(new RegExp(":subquery", "g"), subquery);
            query =
              query +
              ` GROUP BY x, tbr.${req.body.groupby} ORDER BY tbu.createddt ASC`;
          }
          else{
            query =
              query +
              ` GROUP BY x, tbu.${req.body.groupby} ORDER BY tbu.createddt ASC`;
          }
        } else {
          query =
            query +
            ` GROUP BY x ORDER BY tbu.createddt ASC`;

        }

        CommonService.executeQuery(query, params, db.sequelize)
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
            console.log("err", error);
            customValidation.generateAppError(error, response, res, req);
          });
      } else {
        parameters.include = [
          {
            model: db.UserRoles,
            as: "roles",
            attributes: ["rolename"],
            required: false,
          }
        ];
        if (req.query.count) {
          CommonService.getCountAndList(parameters, db.User)
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
        } else if (req.query.isdownload) {
          parameters.where = _.omit(req.body, ["headers", "order"]);
          CommonService.getAllList(parameters, db.User)
              .then((list) => {
                  let template = {
                    content: AssetListTemplate,
                    engine: "handlebars",
                    helpers: CommonHelper,
                    recipe: "html-to-xlsx",
                  };
  
                  let data = { lists: list, headers: req.body.headers };
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
              .catch((error: Error) => {
                  console.log("Error fetching list", error);
                  customValidation.generateAppError(error, response, res, req);
              });
      }else {
          CommonService.getAllList(parameters, db.User)
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
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  byId(req: Request, res: Response): void {
    let response = { reference: modules.USERS };
    try {
      CommonService.getById(req.params.id, db.User)
        .then((data) => {
          data = _.omit(data.dataValues, "password");
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
    let response = { reference: modules.USERS };
    try {
      req.body.password = CommonService.encrypt(req.body.password);
      CommonService.getOrSave(
        { email: req.body.email, status: constants.STATUS_ACTIVE },
        req.body,
        db.User,
        ""
      )
        .then(async(data) => {
          if (data != null && data[1] === false) {
            customValidation.generateErrorMsg(
              messages.USER_EXISTS,
              res,
              201,
              req
            );
          } else if (data != null) {
            customValidation.generateSuccessResponse(
              data,
              response,
              constants.RESPONSE_TYPE_SAVE,
              res,
              req
            );
            try {
              await CommonService.create(
                {
                  resourcetypeid: data["userid"],
                  resourcetype: constants.RESOURCETYPE[5],
                  _tenantid: data["tenantid"],
                  new: constants.HISTORYCOMMENTS[10],
                  affectedattribute: constants.AFFECTEDATTRIBUTES[0],
                  status: constants.STATUS_ACTIVE,
                  createdby: data["createdby"],
                  createddt: new Date(),
                  updatedby: null,
                  updateddt: null,
                },
                db.History
              );
            } catch (error) {
              console.log("Failed to create history", error);
            }
            let condition = {
              module: constants.NOTIFICATION_MODULES[0],
              event: constants.NOTIFICATION_EVENTS[0],
              tenantid: req.body.tenantid,
              status: constants.STATUS_ACTIVE,
            } as any;
            let dateFormat = constants.MOMENT_FORMAT[1];
            let mapObj = {
              "{{user_name}}": data[0].fullname,
              "{{created_by}}": data[0].createdby,
              "{{created_dt}}": CommonService.formatDate(
                new Date(data[0].createddt),
                dateFormat,
                false
              ),
            };
              let resultant_data = JSON.parse(JSON.stringify(data));
              const password_decrypt = CommonService.decrypt(
                resultant_data[0].password
              );
              const replaceValues = {
                "${fullname}" : resultant_data[0].fullname,
                "${password}" : password_decrypt
              }
              const emailContent = await getTemplate(constants.TEMPLATE_REF[0], replaceValues);
              sendMail(
                resultant_data[0].email,
                constants.TEMPLATE_REF[0],
                emailContent,
                data[0],
                constants.TEMPLATE_REF[0],
                null,
                null,
                messages.NOTIFICATION_USER + data[0].fullname
              );
              NotificationService.getNotificationSetup(
                condition,
                mapObj,
                messages.USER_CREATED,
                constants.TEMPLATE_REF[1]
              );
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  update(req: Request, res: Response): void {
    let response = { reference: modules.USERS };
    try {
      CommonService.getData({ userid: req.body.userid }, db.User)
        .then((data) => {
          if (data != null) {
            if (req.body.password) {
              if (CommonService.decrypt(data.password) === req.body.password) {
                req.body.password = data.password;
              } else {
                req.body.password = CommonService.encrypt(req.body.password);
              }
            }
            CommonService.update({ userid: req.body.userid }, req.body, db.User)
              .then(async (data: any) => {
                customValidation.generateSuccessResponse(
                  data,
                  response,
                  constants.RESPONSE_TYPE_UPDATE,
                  res,
                  req
                );
                try {
                  await CommonService.create(
                    {
                      resourcetypeid: data["userid"],
                      resourcetype: constants.RESOURCETYPE[5],
                      _tenantid: data["tenantid"],
                      new: constants.HISTORYCOMMENTS[11],
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
                  console.log("Failed to update history", error);
                }

                let event =
                  req.body.status == constants.DELETE_STATUS
                    ? constants.NOTIFICATION_EVENTS[2]
                    : constants.NOTIFICATION_EVENTS[1];
                let condition = {
                  module: constants.NOTIFICATION_MODULES[0],
                  event: event,
                  tenantid: req.body.tenantid,
                  status: constants.STATUS_ACTIVE,
                } as any;
                let dateFormat = constants.MOMENT_FORMAT[1];
                let mapObj = {
                  "{{user_name}}": data.fullname,
                  "{{updated_by}}": data.lastupdatedby,
                  "{{updated_dt}}": CommonService.formatDate(
                    new Date(data.lastupdateddt),
                    dateFormat,
                    false
                  ),
                  "{{deleted_by}}": data.lastupdatedby,
                  "{{deleted_dt}}": CommonService.formatDate(
                    new Date(data.lastupdateddt),
                    dateFormat,
                    false
                  ),
                };
                NotificationService.getNotificationSetup(
                  condition,
                  mapObj,
                  messages.USER_UPDATED,
                  constants.TEMPLATE_REF[2]
                );
              })
              .catch((error: Error) => {
                customValidation.generateAppError(error, response, res, req);
              });
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
      } catch (e) {
        customValidation.generateAppError(e, response, res, req);
      }

  }
  login(req: Request, res: Response): void {
    let response = { reference: modules.USERS };
    try {
      if (req.body.mode) {
      } else {
        let condition = {
          email: req.body.email,
          password: CommonService.encrypt(req.body.password),
          status: { $ne: "Deleted" },
        };
        let parameters = {
          where: condition,
          include: [
            {
              model: db.Tenant,
              as: "tenant",
              required: false,
              include: [
                {
                  model: db.LookUp,
                  as: "lookup",
                  required: false,
                  where: {
                    status: "Active",
                    lookupkey: {
                      $in: ["TN_INT"],
                    },
                  },
                },
                {
                  model: db.TenantSettings,
                  as: "TenantSettings",
                  required: false,
                  where: {
                    status: "Active",
                  },
                },
                {
                  model: db.TenantLicenses,
                  as: "TenantLicenses",
                  required: false,
                  where: {
                    status: "Active",
                  },
                },
              ],
            },
            {
              model: db.UserRoles,
              as: "roles",
              include: [
                {
                  model: db.RoleAccess,
                  as: "roleaccess",
                  where: {
                    status: "Active",
                  },
                  paranoid: false,
                  required: false,
                  include: [
                    // {
                    //     model: db.ScreenActions, as: 'screenactions'
                    // },
                    {
                      model: db.Screens,
                      as: "screens",
                      where: {
                        status: "Active",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        };
        CommonService.getData(parameters, db.User)
          .then((data: any) => {
            if (data != null) {
              // const cmdb = TwoFactor.generateSecret({
              //   name: "Servicenow Integration",
              //   account: "Esko"
              // });
              data = _.omit(data.dataValues, "password");
              if (data.status == "Active" && data.tenant.status == "Active") {
                let token;
                try {
                  token = JWT.sign(
                    {
                      data: {
                        userid: data.userid,
                        tenantid: data.tenantid,
                        fullname: data.fullname,
                      },
                    },
                    constants.APP_SECRET,
                    {
                      expiresIn: req.body && req.body.remember ? "7d" : "1d",
                    }
                  );
                } catch (error) {
                  console.log("Error generating token");
                  console.log(error);
                }
                const license = data.tenant.TenantLicenses[0];
                const currentDate = new Date();
                const validTillDate = license.valid_till;
                if (currentDate > validTillDate) {
                  customValidation.generateErrorMsg(
                    messages.LICENSE_EXPIRY,
                    res,
                    402,
                    req
                  );
                  return;
                }
                data["token"] = token;
                if (data["totpsecret"] == null) {
                  const totpsecret = CommonService.generateRandomBase32();
                  data["qrsecret"] = totpsecret;
                  let totp = new TOTP({
                    issuer: process.env.APP_ID,
                    label: constants.OTP_LABEL,
                    algorithm: constants.OTP_ALGORITHM,
                    digits: constants.OTP_DIGIT,
                    period: constants.OTP_PERIOD,
                    secret: totpsecret,
                  });
                  const otpauthUrl = totp.toString();
                  qrcodes.toDataURL(otpauthUrl, (err, qrCodeUrl) => {
                    if (err) {
                      console.log(err);
                      return;
                    }
                    data["qrcode"] = qrCodeUrl;
                    customValidation.generateSuccessMsg(
                      messages.LOGIN_SUCCESS,
                      data,
                      res,
                      200,
                      req
                    );
                  });
                } else {
                  customValidation.generateSuccessMsg(
                    messages.LOGIN_SUCCESS,
                    data,
                    res,
                    200,
                    req
                  );
                }

                console.log(
                  "Checking if last login to be updated >>>>>>>>>>>>>>>>>"
                );
                console.log(data.twofactorauthyn);
                console.log(
                  !data.twofactorauthyn || data.twofactorauthyn == "N"
                );

                if (!data.twofactorauthyn || data.twofactorauthyn == "N") {
                  CommonService.update(
                    {
                      email: req.body.email,
                      status: { $ne: "Deleted" },
                    },
                    { totp: req.body.otp, lastlogin: new Date() },
                    db.User
                  );
                }

       
                //Tenant license validation

                // CommonService.update(
                //   { userid: data.userid, status: constants.STATUS_ACTIVE },
                //   { status: constants.DELETE_STATUS },
                //   db.notification
                // ).then((result) => {
                //   let min = Math.ceil(111111);
                //   let max = Math.floor(999999);
                //   let otp = Math.floor(Math.random() * (max - min + 1) + min);
                //   let message = `Hi , Your OTP for login is ${otp}`;
                //   sendSMS(
                //     data.secondaryphoneno,
                //     message,
                //     data,
                //     `Login attempt by ${data.fullname}`,
                //     null,
                //     null,
                //     `OTP sent to ${data.fullname}`,
                //     otp
                //   );
                //   let template = `<html><p>Hi ${data.fullname} , </p><br> <p> Your OTP for login is ${otp}.</p> <br><p><b>Thanks and Regards,</b></p><br><p>CM</p></html>`;
                //   sendMail(
                //     data.email,
                //     "OTP",
                //     template,
                //     data,
                //     "OTP",
                //     null,
                //     null,
                //     "Notification created for user " + data.fullname
                //   );
                // });
              } else {
                customValidation.generateErrorMsg(
                  messages.INVALID_CREDENTIALS,
                  res,
                  200,
                  req
                );
              }
            } else {
              customValidation.generateErrorMsg(
                messages.INVALID_CREDENTIALS,
                res,
                200,
                req
              );
            }
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  verifyOTP(req: Request, res: Response): void {
    let response = { reference: modules.USERS };
    try {
      CommonService.getData(
        {
          where: {
            userid: req.body.userid,
          },
        },
        db.User
      ).then((user) => {
        if (user) {
          const validate = TwoFactor.verifyToken(
            req.body.qrsecret ? req.body.qrsecret : user.dataValues.totpsecret,
            req.body.otp
          );
          if (validate != null && validate.delta == 0) {
            customValidation.generateSuccessMsg(
              messages.LOGIN_SUCCESS,
              {},
              res,
              200,
              req
            );
            CommonService.update(
              { userid: req.body.userid },
              { totpsecret: req.body.qrsecret, lastlogin: new Date() },
              db.User
            );
          } else {
            customValidation.generateErrorMsg(
              messages.INVALID_OTP,
              res,
              200,
              req
            );
          }
        }
      });

      // let condition = {
      //   userid: req.body.userid,
      //   content: req.body.otp,
      //   status: { $ne: "Deleted" },
      // };
      // CommonService.getData({ where: condition }, db.notification)
      //   .then((data: any) => {
      //     if (data != null || req.body.otp == "874567") {
      //       CommonService.update(
      //         { userid: req.body.userid },
      //         { lastlogin: new Date() },
      //         db.User
      //       )
      //         .then((result) => {
      //           customValidation.generateSuccessMsg(
      //             messages.LOGIN_SUCCESS,
      //             {},
      //             res,
      //             200,
      //             req
      //           );
      //         })
      //         .catch((e) => {
      //           customValidation.generateAppError(e, response, res, req);
      //         });
      //     } else {
      //       customValidation.generateErrorMsg(
      //         messages.INVALID_OTP,
      //         res,
      //         200,
      //         req
      //       );
      //     }
      //   })
      //   .catch((error: Error) => {
      //     customValidation.generateAppError(error, response, res, req);
      //   });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  resettotp(req: Request, res: Response): void {
    let response = { reference: modules.USERS };
    try {
      CommonService.update(
        {
          userid: req.body.userid,
        },
        {
          totpsecret: null,
        },
        db.User
      ).then((data) => {
        customValidation.generateSuccessResponse(
          data,
          response,
          constants.RESPONSE_TYPE_UPDATE,
          res,
          req
        );
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  resendOTP(req: Request, res: Response): void {
    let response = { reference: modules.USERS };
    try {
      CommonService.getData(
        { where: { userid: req.body.userid, status: constants.STATUS_ACTIVE } },
        db.User
      ).then((data) => {
        CommonService.update(
          { userid: data.userid, status: constants.STATUS_ACTIVE },
          { status: constants.DELETE_STATUS },
          db.notification
        ).then(async (result) => {
          let min = Math.ceil(111111);
          let max = Math.floor(999999);
          let otp = Math.floor(Math.random() * (max - min + 1) + min);
          let message = `Hi , Your OTP for login is ${otp}`;
          sendSMS(
            data.secondaryphoneno,
            message,
            data,
            `Login attempt by ${data.fullname}`,
            null,
            null,
            `OTP sent to ${data.fullname}`,
            otp
          );
          let replaceValues = {
            "${data.fullname}":data.fullname,
            "${otp}" : otp
          }
          const emailContent = await getTemplate(constants.TEMPLATE_REF[4], replaceValues);
          sendMail(
            data.email,
            constants.TEMPLATE_REF[4],
            emailContent,
            data,
            constants.TEMPLATE_REF[4],
            null,
            null,
            messages.NOTIFICATION_USER + data.fullname
          );
          customValidation.generateSuccessMsg(
            messages.OTP_SUCCESS,
            {},
            res,
            200,
            req
          );
        });
      });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  forgotPassword(req: Request, res: Response): void {
    let response = { reference: modules.USERS };
    try {
      CommonService.getData(
        { where: { email: req.body.email, status: constants.STATUS_ACTIVE } },
        db.User
      ).then(async (data) => {
        if (data) {
          data = JSON.parse(JSON.stringify(data));
          let id = JWT.sign(
            {
              data: data.email,
            },
            constants.RESET_PWD_SECRET,
            { expiresIn: "30m" }
          );
          let msg = `${process.env.WEB_URL}/resetpassword?resetpassword=${id}`;
          const replaceValues = {
            "${data.fullname}" : data.fullname,
            "${msg}" : msg
          }
          const emailContent = await getTemplate(constants.TEMPLATE_REF[3], replaceValues);
          sendMail(
            data.email,
            messages.PASSWORD_RESET,
            emailContent,
            data,
            messages.PASSWORD_RESET,
            null,
            null,
            messages.NOTIFICATION_USER + data.fullname
          );
          customValidation.generateSuccessMsg(
            messages.FORGOT_PASSWORD,
            {},
            res,
            200,
            req
          );
        } else {
          customValidation.generateAppError(
            new Error(messages.USER_NOT_FOUND),
            response,
            res,
            req
          );
        }
      });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }

  resetPassword(req: Request, res: Response): void {
    let response = { reference: modules.USERS };
    try {
      let requestData = req.body;
      let id;
      if (requestData.forgetpassword) {
        JWT.verify(
          requestData.id.toString(),
          constants.RESET_PWD_SECRET,
          (err, decoded) => {
            if (err) {
              throw new AppError("Reset link got expired");
            } else {
              id = decoded.data;
            }
          }
        );
      } else {
        id = requestData.email;
      }

      CommonService.getData(
        {
          where: {
            email: id,
            status: constants.STATUS_ACTIVE,
          },
        },
        db.User
      ).then((data) => {
        if (data) {
          CommonService.update(
            { email: id },
            {
              password: CommonService.encrypt(req.body.comfirmPassword),
            },
            db.User
          )
            .then((result) => {
              customValidation.generateSuccessMsg(
                messages.RESET_PASSWORD,
                {},
                res,
                200,
                req
              );
            })
            .catch((err) => {
              console.log("Error updating password .>>>>>");
              console.log(err);
              customValidation.generateAppError(err, response, res, req);
            });
        }
      });
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }
}
export default new Controller();

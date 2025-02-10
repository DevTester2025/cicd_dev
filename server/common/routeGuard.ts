import { constants } from "./constants";
import * as jwt from "jsonwebtoken";
import { Request, Response } from "express";
import * as TwoFactor from "node-2fa";
import commonService from "../api/services/common.service";
import db from "../api/models/model";
import lokiService from "../api/services/logging/loki.service";

const routeGuard = (req: Request | any, resp: Response, next) => {
  if (req.headers["x-auth-header"]) {
    jwt.verify(
      req.headers["x-auth-header"].toString(),
      constants.APP_SECRET,
      (err, decoded) => {
        if (err) {
          let reply = {
            success: false,
            message: "Not Allowed.",
            data: null,
            err: null,
          };
          resp.status(403).send(reply);
          lokiService.createLog(reply, "WARN");
        } else {
          req.user = decoded;
          req.access_token = req.headers["x-auth-header"].toString();
          next();
        }
      }
    );
  } else if (req.headers["x-auth-token"]) {
    commonService
      .getData(
        {
          where: {
            lookupkey: "TN_INT",
            keyname: constants.LOOKUPKEYS.CM_SNOW_INTEGRATION,
            keyvalue: req.headers["x-auth-token"],
            status: constants.STATUS_ACTIVE,
          },
        },
        db.LookUp
      )
      .then((d) => {
        if (d) {
          next();
        } else {
          let reply = {
            success: false,
            message: "Not Allowed.",
            data: null,
            err: null,
          };
          resp.status(403).send(reply);
          lokiService.createLog(reply, "WARN");
        }
      });
  } else if (req.headers["authorization"]) {
    commonService
      .getData(
        {
          where: {
            lookupkey: "NUTANIX_KEY",
            keyname: constants.LOOKUPKEYS.NUTANIX_KEY,
            keyvalue: req.headers["authorization"],
            status: constants.STATUS_ACTIVE,
          },
        },
        db.LookUp
      )
      .then((d) => {
        if (d) {
          next();
        } else {
          let reply = {
            success: false,
            message: "Invalid token",
            data: null,
            err: null,
          };
          resp.status(403).send(reply);
        }
      });
  } else {
    let reply = {
      success: false,
      message: "Not Allowed.",
      data: null,
      err: null,
    };
    resp.status(403).send(reply);
    lokiService.createLog(reply, "WARN");
  }
};

export default routeGuard;

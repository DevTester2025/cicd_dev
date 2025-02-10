import lokiService from "../api/services/logging/loki.service";
import * as _ from "lodash";
import express = require("express");
import { Request, Response } from "express";
import { constants } from "./constants";
import { modules } from "./module";

const app = express();

app.use(function (req: Request, res: Response, next) {
  try {
    if (req.query.external === "true") {
      const reqformat = {
        assetdetails: [],
      };

      let defaultobj = req.body;
      defaultobj.tenantid = parseInt(process.env.ON_PREM_TENANTID);
      defaultobj.createddt = new Date();
      defaultobj.createdby = "Esko";
      defaultobj.updateddt = new Date();
      defaultobj.updatedby = "Esko";
      defaultobj.status = constants.STATUS_ACTIVE;
      let asstlength = req.body.assetdetails.length;
      if (req.body.assetdetails) {
        _.map(req.body.assetdetails, function (el, i) {
          let record = {};
          record = _.clone(defaultobj);
          record["resourceid"] =
            record["crn"] + "/" + Math.floor(1000000 + Math.random() * 9000000);
          _.map(el.row, async function (o) {
            let obj = _.clone(record);
            obj["fieldkey"] = o.fieldkey;
            obj["fieldtype"] = o.fieldtype;
            obj["fieldvalue"] = o.fieldvalue;
            delete obj["assetdetails"];
            reqformat.assetdetails.push(obj);
          });

          if (Number(i) == Number(asstlength) - 1) {
            req.body = reqformat;
            next();
          }
        });
      }
    } else {
      next();
    }
  } catch (e) {
    lokiService.createLog(
      {
        message: "Error - External CMDB data insert",
        code: constants.STATUES_CODES[2],
        error: e,
        reference: modules.CMDB,
      },
      "ERROR"
    );
  }
});

export default app;

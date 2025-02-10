import lokiService from "../api/services/logging/loki.service";
import * as _ from "lodash";
import express = require("express");
import { Request, Response } from "express";
import { constants } from "./constants";
import { modules } from "./module";
import AssetHistoryService from "../api/services/assethistory.service";

const app = express();

app.use(function (req: Request, res: Response, next) {
    try {
        const asstcondition = {
            tenantid: req.body.tenantid,
            cloudprovider: req.body.provider,
        };
        if (req.body.resourcetype)
            asstcondition["resourcetype"] = req.body.resourcetype;
        if (req.body.refid) asstcondition["refid"] = req.body.refid;

        AssetHistoryService.getAssets(asstcondition).then((result) => {
            next();
        }).catch((e) => {
            lokiService.createLog(
                {
                    message: "Error - getting previous asset history",
                    code: constants.STATUES_CODES[2],
                    error: e,
                    reference: modules.ASSET_SYNC,
                },
                "ERROR"
            );
            next();
        })
    } catch (e) {
        lokiService.createLog(
            {
                message: "Error - getting previous asset history",
                code: constants.STATUES_CODES[2],
                error: e,
                reference: modules.ASSET_SYNC,
            },
            "ERROR"
        );
        next();
    }
});

export default app;

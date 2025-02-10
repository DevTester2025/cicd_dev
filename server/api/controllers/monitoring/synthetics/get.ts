import { Request, Response } from "express";
import {
  SyntheticsClient,
  DescribeCanariesLastRunCommand,
  GetCanaryCommand,
  paginateGetCanaryRuns,
  CanaryLastRun,
} from "@aws-sdk/client-synthetics";

import {
  S3Client,
  ListObjectsCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import db from "../../../models/model";
import { CanaryReport, MSynthetics } from "../interface";

import axios from "axios";
import { sub, isAfter } from "date-fns";
import { CanaryRun } from "aws-sdk/clients/synthetics";
import logger, { ILogModules, ILogOperation } from "../../../../logger";
import _ = require("lodash");
import { customValidation } from "../../../../common/validation/customValidation";
import CommonService from "../../../services/common.service";
import { constants } from "../../../../common/constants";
import { AssetListTemplate } from "../../../../reports/templates";
import { CommonHelper } from "../../../../reports";
import DownloadService from "../../../services/download.service";
export default async function getAll(req: Request, res: Response) {
  try {
    const records = await db.MSynthetics.findAll({
      where: {
        status: "Active",
        tenantid: (req as any).user.data.tenantid,
        region: req.body.region,
      },
    });

    const client = new SyntheticsClient({
      region: req.body.region,
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS,
        secretAccessKey: process.env.APP_AWS_SECRET,
      },
    });

    const getLastRunStatus = async (name: string) => {
      const command = new DescribeCanariesLastRunCommand({
        Names: [name],
      });

      return await client.send(command);
    };

    const lastRunsList = await Promise.all(
      records.map((r) => getLastRunStatus(r.dataValues["name"]))
    );

    const lastRuns = [];

    lastRunsList.forEach((l) => {
      lastRuns.push(...l.CanariesLastRun);
    });

    // if (records && records.length > 0) {
    //   const command = new DescribeCanariesCommand({
    //     Names: records.map((r) => r.dataValues["name"]),
    //   });

    //   canaries = await client.send(command);
    // }

    res.send(
      records.map((r) => {
        const record = JSON.parse(JSON.stringify(r));

        let lastRunStatus = null as null | CanaryLastRun;

        if (lastRuns && lastRuns.length > 0) {
          lastRunStatus = lastRuns.find((s) => s.CanaryName == record["name"]);
        }

        return {
          ...record,
          $lastrun: lastRunStatus,
          lastrunstatus: lastRunStatus
            ? lastRunStatus.LastRun.Status.State
            : null,
        };
      })
    );
  } catch (error) {
    console.log(error);
    res.send("dokie");
  }
}

export async function getAllList(req: Request, res: Response) {
  let response = {} as any;
  try {
    let parameters = {
      where: req.body,
      tenantid: (req as any).user.data.tenantid,
    } as any;
    const client = new SyntheticsClient({
      region: req.body.region,
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS,
        secretAccessKey: process.env.APP_AWS_SECRET,
      },
    });

    const getLastRunStatus = async (name: string) => {
      const command = new DescribeCanariesLastRunCommand({
        Names: [name],
      });

      return await client.send(command);
    };
    if (req.query.order && typeof req.query.order === "string") {
      let order: any = req.query.order;
      let splittedOrder = order.split(",");
      if (splittedOrder[0] != "lastrunstatus") {
        parameters["order"] = [splittedOrder];
      }
    }
    if (req.query.limit) {
      parameters["limit"] = req.query.limit;
    }
    if (req.query.offset) {
      parameters["offset"] = req.query.offset;
    }
    if (req.body.ids) {
      parameters["where"]["id"] = { $in: req.body.ids };
    }
    if (req.body.regions) {
      parameters["where"]["region"] = { $in: req.body.regions };
    }
    parameters.where = _.omit(parameters.where, ["regions"]);
    parameters.include = [] as any;
    if (req.body.searchText) {
      let searchparams: any = {};
      searchparams["type"] = {
        $like: "%" + req.body.searchText + "%",
      };
      // searchparams["region"] = {
      //   $like: "%" + req.body.searchText + "%",
      // };
      searchparams["name"] = {
        $like: "%" + req.body.searchText + "%",
      };
      if (Array.isArray(req.body.headers)) {
        req.body.headers.forEach((element) => {
          if (element.field === "name") {
            searchparams["name"] = {
              $like: "%" + req.body.searchText + "%",
            };
          }
          if (element.field === "meta") {
            searchparams["meta"] = {
              $like: "%" + req.body.searchText + "%",
            };
          }
        });
      }

      parameters.where = _.omit(parameters.where, ["searchText", "headers"]);
      parameters.where["$or"] = searchparams;
    }
    parameters.where = _.omit(parameters.where, ["order"]);
    if (req.query.count) {
      let records: any = await db.MSynthetics.findAndCountAll(parameters);
      let formatttedData = [];
      if (records.count > 0) {
        formatttedData = JSON.parse(JSON.stringify(records));
        const lastRunsList = await Promise.all(
          formatttedData["rows"].map((r) => getLastRunStatus(r["name"]))
        );
        const lastRuns = [];

        lastRunsList.forEach((l: any) => {
          lastRuns.push(...l.CanariesLastRun);
        });
        let rows = [];
        formatttedData["rows"].map((r) => {
          const record = JSON.parse(JSON.stringify(r));

          let lastRunStatus = null as null | CanaryLastRun;

          if (lastRuns && lastRuns.length > 0) {
            lastRunStatus = lastRuns.find(
              (s) => s.CanaryName == record["name"]
            );
          }
          rows.push({
            ...record,
            $lastrun: lastRunStatus,
            lastrunstatus: lastRunStatus
              ? lastRunStatus.LastRun.Status.State
              : null,
          });
          return record;
        });
        formatttedData["rows"] = rows;
        customValidation.generateSuccessResponse(
          formatttedData,
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      } else {
        customValidation.generateSuccessResponse(
          [],
          response,
          constants.RESPONSE_TYPE_LIST,
          res,
          req
        );
      }
    } else if (req.query.isdownload) {
      parameters.where = _.omit(parameters.where, ["headers", "order"]);
      CommonService.getAllList(parameters, db.MSynthetics)
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
          customValidation.generateAppError(error, response, res, req);
        });
    }
    else {
      CommonService.getAllList(parameters, db.MSynthetics)
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
    console.log(e);
    customValidation.generateAppError(e, response, res, req);
  }
}

async function getCanaryRuns(region: string, name: string, start: Date) {
  const client = new SyntheticsClient({
    region: region,
    credentials: {
      accessKeyId: process.env.APP_AWS_ACCESS,
      secretAccessKey: process.env.APP_AWS_SECRET,
    },
  });

  let runs = [] as CanaryRun[];

  const getRunsForDuration = async (
    token?: string
  ): Promise<{ runs: CanaryRun[]; nextToken: string }> => {
    const responses = await paginateGetCanaryRuns(
      {
        client,
        pageSize: 100,
        startingToken: token,
      },
      {
        Name: name,
      }
    ).next();
    const runs = responses.value.CanaryRuns;
    const nextToken = responses.value.NextToken;
    return {
      runs,
      nextToken,
    };
  };

  let continueLoop = true;
  let itterationCount = 0;
  let nextToken;

  while (continueLoop) {
    const response = await getRunsForDuration(nextToken);
    runs.push(...response.runs);
    nextToken = response.nextToken;

    if (response && !response.nextToken) {
      continueLoop = false;
      // console.log("No response stopping execution");
      // console.log(response.nextToken);
    }

    // console.log("-------------------------------------------");
    // console.log("Pushed runs to array. Current length is " + runs.length);
    // console.log(response.nextToken);

    itterationCount += 1;

    // console.log("Comparing dates >>>>>>>>>>>>");
    // console.log(isAfter(new Date(response.nextToken), start));
    // console.log(new Date(response.nextToken), start);

    if (
      response &&
      response.nextToken &&
      !isAfter(new Date(response.nextToken), start)
    ) {
      continueLoop = false;
      // console.log(
      //   "Stopping loop, since the next token exceeds the required time frame."
      // );
      // console.log(response.nextToken);
    }

    if (itterationCount > 100) {
      // console.log("Exceeding test loop limit.");
      continueLoop = false;
    }
  }

  return runs.filter((r) => {
    if (isAfter(r.Timeline.Started, start)) {
      return r;
    }
  });
}

export async function getById(req: Request, res: Response) {
  try {
    const recordDetail = await db.MSynthetics.find({
      where: {
        status: "Active",
        tenantid: (req as any).user.data.tenantid,
        id: req.params.id,
      },
    });
    const record = JSON.parse(JSON.stringify(recordDetail)) as MSynthetics;

    const client = new SyntheticsClient({
      region: record.region,
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS,
        secretAccessKey: process.env.APP_AWS_SECRET,
      },
    });

    const getCanaryDetailCommand = new GetCanaryCommand({
      Name: record["name"],
    });
    // const getCanaryRunsCommand = new GetCanaryRunsCommand({
    //   Name: record["name"],
    // });

    const canaryDetail = await client.send(getCanaryDetailCommand);
    // const canaryRuns = await client.send(getCanaryRunsCommand);

    res.send({
      record: JSON.parse(JSON.stringify(record)),
      $meta: canaryDetail.Canary,
      $runs: await getCanaryRuns(
        record.region,
        record["name"],
        sub(new Date(), {
          hours:
            req.query.start != null ? parseInt(req.query.start as string) : 3,
        })
      ),
    });
  } catch (error) {
    console.log(error);
    res.send("dokie");
  }
}

export async function getRunArtifacts(req: Request, res: Response) {
  try {
    const recordDetail = await db.MSynthetics.find({
      where: {
        status: "Active",
        tenantid: (req as any).user.data.tenantid,
        id: req.params.id,
      },
    });
    const record = JSON.parse(JSON.stringify(recordDetail)) as MSynthetics;

    const client = new S3Client({
      region: record.region,
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS,
        secretAccessKey: process.env.APP_AWS_SECRET,
      },
    });

    const command = new ListObjectsCommand({
      Bucket: process.env.SYNTH_S3_ARTIFACTS + `--${record.region}`,
      Delimiter: "/",
      Prefix: req.body["path"],
    });

    const response = await client.send(command);

    let json_url = null;
    let log_url = null;
    let har_url = null;

    if (!response || !response.Contents) {
      logger.error(null, ILogModules.Synthetics, ILogOperation.Other, {
        notes: "No artifacts found, Contact admin",
        meta: { response, record },
      });
      res.send({ message: "No artifacts found, Contact admin" });
      return;
    }

    const jsonObj = response.Contents.find((c) => c.Key.includes("json"));
    const logObj = response.Contents.find((c) => c.Key.includes("-log"));
    const harObj = response.Contents.find((c) => c.Key.includes("har"));

    if (response.Contents && jsonObj) {
      const fileCommand = new GetObjectCommand({
        Bucket: process.env.SYNTH_S3_ARTIFACTS + `--${record.region}`,
        Key: jsonObj.Key,
      });

      json_url = await getSignedUrl(client, fileCommand, {
        expiresIn: 3600,
      });
    }

    const logFileCommand = new GetObjectCommand({
      Bucket: process.env.SYNTH_S3_ARTIFACTS + `--${record.region}`,
      Key: logObj.Key,
    });

    log_url = await getSignedUrl(client, logFileCommand, {
      expiresIn: 3600,
    });

    if (harObj) {
      const harFileCommand = new GetObjectCommand({
        Bucket: process.env.SYNTH_S3_ARTIFACTS + `--${record.region}`,
        Key: harObj.Key,
      });
      har_url = await getSignedUrl(client, harFileCommand, {
        expiresIn: 3600,
      });
    }

    const jsonReport = (await (await axios.get(json_url)).data) as CanaryReport;

    function generateImageURL(fileName: string) {
      return new Promise(async (resolve, reject) => {
        const imgFileCommand = new GetObjectCommand({
          Bucket: process.env.SYNTH_S3_ARTIFACTS + `--${record.region}`,
          Key: req.body["path"] + fileName,
        });

        const img_url = await getSignedUrl(client, imgFileCommand, {
          expiresIn: 3600,
        });

        resolve({ [fileName]: img_url });
      });
    }

    function bulkGenerateImageURL() {
      return new Promise(async (resolve, reject) => {
        const images = [];
        let urls = [];
        if (jsonReport && jsonReport.customerScript) {
          jsonReport.customerScript.steps.forEach(async (s) => {
            s.screenshots.forEach((img) => {
              images.push(img.fileName);
            });
          });

          urls = await Promise.all(images.map((i) => generateImageURL(i)));
        }

        resolve(urls);
      });
    }

    const image_urls = (await bulkGenerateImageURL()) as Record<
      string,
      string
    >[];
    const image = {};

    image_urls.forEach((i) => {
      for (const key in i) {
        if (Object.prototype.hasOwnProperty.call(i, key)) {
          const value = i[key];
          image[key] = value;
        }
      }
    });

    res.send({
      log: await (await axios.get(log_url)).data,
      json: jsonReport,
      har_url: har_url || "",
      screenshots: image,
    });
  } catch (error) {
    logger.error(null, ILogModules.Synthetics, ILogOperation.Other, {
      notes: "Unable to collect artifacts, Contact admin",
      meta: String(error),
    });
  }
}

export async function getArtifactStreams(req: Request, res: Response) {}

export async function getDetails(req: Request, res: Response) {
  let response = {} as any;
  try {
    let parameters = {
      where: req.body,
      tenantid: (req as any).user.data.tenantid,
    } as any;
    if (req.query.limit) {
      parameters["limit"] = req.query.limit;
    }
    if (req.query.offset) {
      parameters["offset"] = req.query.offset;
    }
    if (req.body.searchText) {
      parameters["where"]["url"] = { $like: "%" + req.body.searchText + "%" };
      delete parameters["where"]["searchText"];
    }
    if(req.query.distinct){
      parameters.attributes = [
        [db.sequelize.fn('DISTINCT', db.sequelize.col('url')), 'url'],
      ];
    }
    const data = await db.MSyntheticsDtl.findAll(parameters);
    customValidation.generateSuccessResponse(
      data,
      response,
      constants.RESPONSE_TYPE_LIST,
      res,
      req
    );
  } catch (e) {
    console.log(e);
    customValidation.generateAppError(e, response, res, req);
  }
}
export async function getMonitoring(req: Request, res: Response) {
  const params = {
    replacements: {
      tenantid: req.query.tenantid
    },
    type: db.sequelize.QueryTypes.SELECT,
  } as any;
  let searchquery = '';
  if(req.body.searchText){
    params['replacements']['searchText'] =  `%${req.body.searchText}%`;
    searchquery = `AND dtl.url LIKE :searchText`
  }
  console.log('Search', (req.body.searchText ? `%${req.body.searchText}%`: ""))
  let queryList = `SELECT
    dtl.url,
    COUNT(hdr.region) AS regions,
    GROUP_CONCAT(hdr.region) AS availableregions
  FROM
    tbl_monitoring_syntheticdtl AS dtl 
  INNER JOIN 
    tbl_monitoring_synthetics hdr ON dtl.syntheticid = hdr.id 
  WHERE 
    hdr.status = "Active" 
    AND hdr.tenantid = :tenantid
    :searchquery
  GROUP BY
    dtl.url;`;

  let queryCount = `SELECT
    COUNT(DISTINCT dtl.url) AS totalCount
  FROM
    tbl_monitoring_syntheticdtl AS dtl 
  INNER JOIN 
    tbl_monitoring_synthetics hdr ON dtl.syntheticid = hdr.id 
  WHERE 
    hdr.status = "Active" 
    AND hdr.tenantid = :tenantid :searchquery;`;
  queryList = queryList.replace(new RegExp(":searchquery", "g"), searchquery);
  queryCount = queryCount.replace(new RegExp(":searchquery", "g"), searchquery);
  try {
    const [list, count] = await Promise.all([
      CommonService.executeQuery(queryList, params, db.sequelize),
      CommonService.executeQuery(queryCount, params, db.sequelize)
    ]);
    customValidation.generateSuccessResponse(
      {
        items: list,
        count: count[0].totalCount
      },
      {},
      constants.RESPONSE_TYPE_LIST,
      res,
      req
    );
  } catch (error) {
    customValidation.generateAppError(error, Response, res, req);
  }
}
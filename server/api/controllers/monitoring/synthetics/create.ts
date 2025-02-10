import { Request, Response } from "express";
import {
  SyntheticsClient,
  StartCanaryCommand,
  CreateCanaryCommand,
  CreateCanaryCommandInput,
} from "@aws-sdk/client-synthetics";

import db from "../../../models/model";
import logger, { ILogModules, ILogOperation } from "../../../../logger";
import commonService from "../../../services/common.service";
import { customValidation } from "../../../../common/validation/customValidation";

const syntheticsModule = ILogModules.Synthetics;

async function startCanary(region: string, name: string) {
  let retries = 0;
  try {
    logger.verbose(null, syntheticsModule, ILogOperation.Create, {
      notes: "Trying to start canary",
      meta: { region, name },
    });
    const client = new SyntheticsClient({
      region,
      credentials: {
        accessKeyId: process.env.APP_AWS_ACCESS,
        secretAccessKey: process.env.APP_AWS_SECRET,
      },
    });
    const startCommand = new StartCanaryCommand({
      Name: name,
    });
    await client.send(startCommand);
  } catch (error) {
    if (retries < 10) {
      setTimeout(() => {
        retries += 1;
        startCanary(region, name);
      }, 10000);
    } else {
      logger.error(null, syntheticsModule, ILogOperation.Create, {
        notes: "Unable to start canary post creation",
        meta: String(error),
      });
    }
  }
}

export default async function create(req: any, res: Response) {
  try {
    // Function to create synthetic canary in a specific region
    async function createSyntheticCanary(region) {
      try {
        const client = new SyntheticsClient({
          region,
          credentials: {
            accessKeyId: process.env.APP_AWS_ACCESS,
            secretAccessKey: process.env.APP_AWS_SECRET,
          },
        });

        let params = {
          ArtifactS3Location:
            `s3://${process.env.SYNTH_S3_ARTIFACTS}--${region}/` + request["name"],
          Code: {
            Handler: "index.handler",
            S3Bucket: process.env.SYNTH_S3_SOURCES + `--${region}`,
            S3Key: "heartbeat.zip",
          },
          ExecutionRoleArn: process.env.SYNTH_IAM_ROLE_ARN,
          Name: request["name"],
          RuntimeVersion: "syn-nodejs-puppeteer-7.0",
          Schedule: {
            Expression: `rate(1 minute)`,
          },
          FailureRetentionPeriodInDays: 30,
          RunConfig: {
            MemoryInMB: request.memoryinmb || 960,
            TimeoutInSeconds: request.timeout || 60,
          },
          SuccessRetentionPeriodInDays: 30,
        };

        if (request.type == "heartbeat") {
          params["Code"]["S3Key"] = "heartbeat.zip";
          params["RunConfig"]["EnvironmentVariables"] = {
            access_urls: request["meta"],
          };
        }
        if (request.type == "api") {
          params["Code"]["S3Key"] = "api.zip";
          params["RunConfig"]["EnvironmentVariables"] = {
            req_objects: Buffer.from(request["meta"]).toString("base64"),
          };
        }
        if (request.filename != '' && request.filename != undefined && request.filename != null) {
          params['Code']['S3Key'] = request.filename;
        }

        if (request.recurring && request.recurring_type == "cron") {
          params["Schedule"]["Expression"] = `cron(${request.cron})`;
        }
        if (request.recurring && request.recurring_type == "frequency") {
          params["Schedule"]["Expression"] = `rate(${request.rate_in_min} ${request.rate_in_min == 1 ? "minute" : "minutes"
            })`.toString();
        }

        logger.verbose(null, syntheticsModule, ILogOperation.Create, {
          notes: "Creating synthetics with params",
          meta: params,
        });
        const command = new CreateCanaryCommand(params);

        await client.send(command);

        await db.MSynthetics.create({ ...request, region }, {
          include: [{ model: db.MSyntheticsDtl, as: "monitoringdtls" }],
        });

        setTimeout(() => {
          startCanary(region, request["name"]);
        }, 10000);
      } catch (error) {
        console.error(`Error creating synthetic canary in ${region}:`, error);
      }
    }
    async function createCanariesInRegions() {
      try {
        let i = 0;
        for (const region of regions) {
          i++;
          if (!customValidation.isEmptyValue(req.files.file)) {
            request.filename = request.scriptname;
            const file = await commonService.uploadFiletoS3(
              req.files.file.path,
              request.filename,
              region,
              process.env.SYNTH_S3_SOURCES + `--${region}`
            );
          }
          setTimeout(async function () {
            await createSyntheticCanary(region);
          }, 5000);

          if (i == regions.length) {
            res.send({
              status: true,
              message: "Canary added",
            });
          }
        }
      } catch (error) {
        console.error('Error creating synthetic canaries:', error);
      }
    }
    let request = {} as any;
    if (!customValidation.isEmptyValue(req.body.formData)) {
      request = JSON.parse(req.body.formData);
    }
    const regions = request.region;
    createCanariesInRegions();
  } catch (error) {
    logger.error(null, syntheticsModule, ILogOperation.Create, {
      notes: "Unable to create canary",
      meta: String(error),
    });
    res.send({
      status: false,
      message: "Unable to create canary.",
    });
  }
}

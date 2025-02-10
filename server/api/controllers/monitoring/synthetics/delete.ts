import { Request, Response } from "express";
import {
  SyntheticsClient,
  DeleteCanaryCommand,
  StopCanaryCommand,
} from "@aws-sdk/client-synthetics";

import db from "../../../models/model";
import { MSynthetics } from "../interface";

export default async function updateCarary(req: Request, res: Response) {
  try {
    const recordDetail = await db.MSynthetics.findOne({
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

    const stopCanaryCommand = new StopCanaryCommand({
      Name: record["name"],
    });

    const canaryStopped = await client.send(stopCanaryCommand);

    await db.MSynthetics.update(
      {
        status: "Stopped",
        lastupdateddt: new Date(),
        lastupdatedby: (req as any).user.data.fullname || "",
      },
      {
        where: {
          status: "Active",
          tenantid: (req as any).user.data.tenantid,
          id: req.params.id,
        },
      }
    );

    setTimeout(() => {
      deleteCarary(
        (req as any).user.data.tenantid,
        parseInt(req.params.id),
        (req as any).user.data.fullname
      );
    }, 10000);

    res.send(canaryStopped.$metadata);
  } catch (error) {
    console.log(error);
    res.status(400).send("Unable to stop canary");
  }
}

async function deleteCarary(
  tenantid: number,
  canaryid: number,
  username: string
) {
  try {
    const recordDetail = await db.MSynthetics.findOne({
      where: {
        status: "Stopped",
        tenantid: tenantid,
        id: canaryid,
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

    const deleteCanaryCommand = new DeleteCanaryCommand({
      Name: record["name"],
      DeleteLambda: true,
    });

    await client.send(deleteCanaryCommand);

    await db.MSynthetics.update(
      {
        status: "Deleted",
        lastupdateddt: new Date(),
        lastupdatedby: username || "",
      },
      {
        where: {
          id: canaryid,
        },
      }
    );
  } catch (error) {
    console.log("Unable to delete canary >>>>>>>>>>>");
    console.log(error);
    setTimeout(() => {
      console.log("Retrying delete canary >>>>>>>>>>>");
      deleteCarary(tenantid, canaryid, username);
    }, 10000);
  }
}

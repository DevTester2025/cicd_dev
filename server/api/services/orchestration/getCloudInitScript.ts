import * as fs from "fs";
import * as path from "path";

import { constants } from "../../../common/constants";

export interface OrchestrationData {
  orchid: number;
  orchname: string;
  orchflow: string;
  params: string;
  scripts: string;
  status: string;
  createddt: Date;
  createdby: string;
  lastupdateddt: Date;
  lastupdatedby: string;
  tenantid: number;
  orchdesc: string;
}

export default function GetCloudInitScript(
  orchData: OrchestrationData,
  options?: { platform: "ECL2" | "AWS" }
): Promise<string> {
  return new Promise((resolve, reject) => {
    let scripts = JSON.parse(orchData.scripts) as {
      exectype: string;
      scriptid: string;
    }[];

    let initScriptObj = scripts.find((o) => o["exectype"] == "boottime");

    if (initScriptObj) {
      let scriptPath =
        process.cwd() + "/public/Scripts/" + initScriptObj["scriptname"];
      // let p = process.cwd() + '/deployment_scripts/tms/0_cloud_init.ps1';
      console.log("script path", scriptPath);
      fs.readFile(scriptPath, "utf8", (err, data) => {
        if (err) {
          reject("Error parsing script.");
        } else {
          let encoded;

          if (options && options.platform == "AWS") {
            encoded = Buffer.from(
              "<powershell>" + data.trim() + "</powershell>"
            ).toString("base64");
            // encoded = Buffer.from(data.trim()).toString("base64");
          } else {
            encoded = Buffer.from(data.trim()).toString("base64");
          }
          resolve(encoded);
        }
      });
    } else {
      reject("No init scripts found");
    }
  });
}

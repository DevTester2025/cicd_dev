import db from "../../../models/model";
import axios from "axios";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    S3Client,
    ListObjectsCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import * as moment from "moment";
interface AWSCloudwatchEvent {
    version: string;
    id: string;
    "detail-type": string;
    source: string;
    account: string;
    time: Date;
    region: string;
    resources: any[];
    detail: Detail;
}

interface Detail {
    "account-id": string;
    "canary-id": string;
    "canary-name": string;
    "canary-run-id": string;
    "artifact-location": string;
    "test-run-status": string;
    "state-reason": string;
    "canary-run-timeline": CanaryRunTimeline;
    message: string;
}

interface CanaryRunTimeline {
    started: number;
    completed: number;
}

interface Synthetics {
    id: number;
    tenantid: number;
    type: string;
    region: string;
    name: string;
    instances: null;
    endpoint: string;
    screenshot: boolean;
    recurring: boolean;
    recurring_type: string;
    cron: null;
    rate_in_min: number;
    ref: null;
    status: string;
    createdby: string;
    createddt: Date;
    lastupdatedby: string;
    lastupdateddt: Date;
}

interface AlertReceivers {
    mode: string;
    receivers: Receiver[];
}
interface Receiver {
    label: string;
    value: number;
}

export default async function handler(data: any) {
    try {
        const detail = await db.MSynthetics.findAll({
            where: {
                name: data.detail["canary-name"]
            }
        });
        const region = data['region'];
        const synth = JSON.parse(JSON.stringify(detail)) as Synthetics[];
        const client = new S3Client({
            region: region,
            credentials: {
                accessKeyId: process.env.APP_AWS_ACCESS,
                secretAccessKey: process.env.APP_AWS_SECRET,
            },
        });

        if (synth.length > 0) {
            const command = new ListObjectsCommand({
                Bucket: process.env.SYNTH_S3_ARTIFACTS + `--${region}`,
                Delimiter: "/",
                Prefix: (data.detail['artifact-location']).replace(process.env.SYNTH_S3_ARTIFACTS + `--${region}` + '/', '') + '/'
            });
            const response = await client.send(command);
            let json_url = null;

            if (!response || !response.Contents) {
                console.log('No artifacts found')
                return;
            }
            const jsonObj = response.Contents.find((c) => c.Key.includes("json"));

            if (response.Contents && jsonObj) {
                const fileCommand = new GetObjectCommand({
                    Bucket: process.env.SYNTH_S3_ARTIFACTS + `--${region}`,
                    Key: jsonObj.Key,
                });

                json_url = await getSignedUrl(client, fileCommand, {
                    expiresIn: 3600,
                });
            }

            const jsonReport = (await (await axios.get(json_url)).data) as any;

            if (jsonReport) {
                let details: any = jsonReport.customerScript.steps;
                let reqData = [];
                details.map((e) => {
                    let diff = (new Date(e['endTime']).getTime() - new Date(e['startTime']).getTime());
                    if (moment(e['startTime']).format('YYYY-MM-DD HH:mm:ss') > moment().startOf('day').format('YYYY-MM-DD HH:mm:ss')) {
                        reqData.push({
                            canaryname: jsonReport['canaryName'],
                            url: e['stepName'],
                            syntheticid: synth[0].id,
                            starttime: e['startTime'],
                            endtime: e['endTime'],
                            responsetime: diff,
                            executionstatus: e['status'],
                            createddt: new Date(),
                            createdby: 'SYSTEM'
                        })
                    }
                });
                if (reqData.length > 0) {
                    const url = process.env.CUSAPI_BASE_URL + '/cloudmatiq/syntheticmetric/create';
                    axios
                        .post(url, reqData)
                        .then((res) => {
                            console.log(' Synthetic Metrics create initiated. >>>>>>>>>>>>>>>>>>', new Date());
                        })
                        .catch((err) => {
                            console.log('ERROR INITIATING RE-SYNC', new Date());
                            console.log(JSON.stringify(err));
                        });
                } else {
                    throw new Error("No synthetic configuration found.");
                    // return false;
                }
            }
        } else {
            console.log('No synthetics found');
            throw new Error("No synthetics found");
            // return false;
        }
    }
    catch (error) {
        console.error("Error handling synthetics alerts.");
        console.error(error);
        throw error;
        // return false;
    }
}



import {
    Node,
    OrchestrationUtils,
    OrchestrationNodeHandlerResponse,
    OrchestrationConfigs,
} from "../../types";
import { constants } from "../../../../../common/constants";
import * as _ from "lodash";
import Store from "../store";
import * as Flow from "../../flow";
import db from "../../../../models/model";
import AWSService from "../../../../services/providers/aws.service";
import * as moment from "moment";
import SSMService from "../../../providers/ssm.service";
export class PatchNodeHandler {
    start(
        node: Node,
        orchConfigs: OrchestrationConfigs,
        orchUtils: OrchestrationUtils,
        orchstore: Store
    ): Promise<OrchestrationNodeHandlerResponse> {
        return new Promise((resolve, reject) => {
            try {
                var startTime = moment();
                let self = this;
                let retries = 0;
                if (
                    node.params.data
                ) {
                    let prevNodes = Flow.GetPreviousNode(
                        orchstore.getOrchestration(),
                        node.params.id
                    );
                    if (prevNodes && prevNodes.length == 1) {
                        let prevNode = prevNodes[0];
                        if (prevNode.name == "SessionNode") {
                            let instanceId = orchConfigs['sys_' + (prevNode.params.label.replace(/ /g, '')).toLowerCase() + '_ssmid'];
                            // if (orchConfigs['sys_' + (prevNode.params.label.replace(/ /g, '')).toLowerCase() + `_provider`] == constants.CLOUDPROVIDERS[3]) {
                            //     instanceId = orchConfigs['sys_' + (prevNode.params.label.replace(/ /g, '')).toLowerCase() + '_ssmid'];
                            orchUtils.logger.writeLogToFile(
                                "info",
                                `Patching will be started on instance ${instanceId}`
                            );
                            // }
                            orchUtils.logger.writeLogToFile(
                                "info",
                                `Patching will be started on instance ${instanceId}`
                            );
                            orchUtils.logger.writeLogToFile(
                                "info",
                                `${JSON.stringify(orchConfigs)}`
                            );
                            if (instanceId) {
                                initiatePatch(instanceId);
                            } else {
                                reject("Unable to find AWS instance id");
                            }
                        } else {
                            orchUtils.logger.writeLogToFile(
                                "info",
                                "Patch Node must have input from session node"
                            );
                            reject("Patch Node must have input from session node.");
                        }
                    } else {
                        orchUtils.logger.writeLogToFile(
                            "info",
                            "Patch Node can't have multiple inputs"
                        );
                        reject("Patch Node can't contain multiple inputs.");
                    }
                } else {
                    orchUtils.logger.writeLogToFile(
                        "info",
                        "No data found for patch node"
                    );
                    reject("No data found for patch node");
                }
                async function initiatePatch(instanceId) {
                    self.patchInstance(instanceId, orchUtils, node).then((data) => {
                        invokeLogs(data.payload, 0);
                    }).catch((e) => {
                        orchUtils.logger.writeLogToFile(
                            "error",
                            `Error in patch node \n ${e}`
                        );
                        if (node.data.retries && retries < node.data.retries) {
                            retries++;
                            orchUtils.logger.writeLogToFile(
                                "info",
                                `Retrying the patch node for ${retries} time`
                            );
                            initiatePatch(instanceId);
                        } else {
                            resolve({
                                continue: true,
                                payload: "Failed"
                            });
                        }
                    });
                }
                async function invokeLogs(input, index) {
                    let patchStatus = ["Failed", "TimedOut", "DeliveryTimedOut", "ExecutionTimedOut", "Incomplete", "NoInstancesInTag", "LimitExceeded"];
                    let curTime = moment();
                    let diffTime = curTime.diff(startTime, 'minutes');
                    let prevNodes = Flow.GetPreviousNode(
                        orchstore.getOrchestration(),
                        node.params.id
                    );
                    let prevNode = prevNodes[0];
                    let instanceId = orchConfigs['sys_' + (prevNode.params.label.replace(/ /g, '')).toLowerCase() + '_ssmid'];
                    orchUtils.logger.writeLogToFile("info", `Region data is ${input.region}`);
                    if (!input.commandObj.data) {
                        if (node.data.retries && retries < node.data.retries) {
                            retries++;
                            initiatePatch(instanceId);
                        } else {
                            resolve({
                                continue: true,
                                payload: "Failed"
                            });
                        }
                        return;
                    }
                    let commandID = input.commandObj.data.Command.CommandId;
                    if (index > 0 && index < 240 && index % 50 == 0) {
                        let accountDtls = {
                            tenantrefid: input.instance.accountdata.accountref,
                            accountdata: { rolename: input.instance.accountdata.rolename },
                            region: input.region
                        };
                        input.awsCredentials = await AWSService.getCredentials(
                            accountDtls,
                            input.instance.tenantid
                        );
                    }
                    if (diffTime >= node.data.timeout && node.data.timeout) {
                        orchUtils.logger.writeLogToFile(
                            "info",
                            "Patch Node cancelled due to time out"
                        );
                        let params = {
                            CommandId: commandID,
                            InstanceIds: [instanceId]
                        };
                        SSMService.cancelPatch(
                            input.awsCredentials,
                            input.region,
                            params
                        )
                            .then((commandObj) => {
                                resolve({
                                    continue: true,
                                    payload: true
                                });
                            });
                    } else {
                        orchUtils.logger.writeLogToFile(
                            "info",
                            "Get patch status from AWS --------------------------------------------------------"
                        );
                        orchUtils.logger.writeLogToFile(
                            "info",
                            JSON.stringify(input)
                        );
                        if (index < 240) {
                            self.getPatchStatus(input.awsCredentials, input.region, commandID).then((resp: any) => {
                                let status = resp.data.CommandInvocations[0].Status;
                                orchUtils.logger.writeLogToFile(
                                    "info",
                                    `Found patch status -------------------------  ${status}`
                                );
                                if (status != "InProgress") {
                                    // orchUtils.logger.writeLogToFile(
                                    //     "info",
                                    //     JSON.stringify(resp)
                                    // );
                                    if (patchStatus.includes(status) && node.data.retries && retries < node.data.retries) {
                                        retries++;
                                        orchUtils.logger.writeLogToFile(
                                            "info",
                                            `Retrying the patch node for ${retries} time`
                                        );
                                        orchUtils.logger.writeLogToFile(
                                            "info",
                                            `No of retries : ${node.data.retries}`
                                        );
                                        self.patchInstance(instanceId, orchUtils, node).then((data) => {
                                            invokeLogs(data.payload, 0);
                                        }).catch((e) => {
                                            reject("Error in patching. " + e);
                                        });
                                    } else {
                                        resolve({
                                            continue: true,
                                            payload: resp
                                        });
                                    }
                                } else {
                                    orchUtils.logger.writeLogToFile(
                                        "info",
                                        `Waiting to get patch update ${index > 1 ? 60 : 300}s`
                                    );
                                    setTimeout(() => {
                                        invokeLogs(input, index + 1);
                                    }, index > 5 ? 60000 : 300000);
                                }
                            }).catch((e) => {
                                orchUtils.logger.writeLogToFile(
                                    "info",
                                    `Waiting to get patch update ${index > 1 ? 60 : 300}s`
                                );
                                setTimeout(() => {
                                    invokeLogs(input, index + 1);
                                }, index > 5 ? 60000 : 300000);
                            });
                        } else {
                            orchUtils.logger.writeLogToFile(
                                "info",
                                `Time out after 240 minutes - Unable to continue patch node`
                            );
                            resolve({
                                continue: true,
                                payload: {}
                            });
                        }
                    }
                }
            } catch (e) {
                reject(e);
            }
        });
    }
    getPatchStatus(awsCredentials, region, id): Promise<OrchestrationNodeHandlerResponse> {
        return new Promise((resolve, reject) => {
            try {
                SSMService.listCommandInvocations(awsCredentials, region, {
                    CommandId: id,
                    Details: true,
                })
                    .then((data) => {
                        resolve(data);
                    })
                    .catch((error: Error) => {
                        reject(error);
                    });
            } catch (e) {
                reject(e);
            }
        });
    }
    async getAccountDetails(instanceId, orchUtils) {
        try {
            if (instanceId == null || instanceId == undefined) {
                orchUtils.logger.writeLogToFile("error", "Instanceid not found.");
            }
            let accountDtls = null;
            let instanceQry = {
                where: {
                    instancerefid: instanceId,
                    status: constants.STATUS_ACTIVE,
                },
                include: [
                    {
                        as: "accountdata",
                        model: db.CustomerAccount,
                        required: false,
                        attributes: ["rolename", "accountref"],
                        where: { status: constants.STATUS_ACTIVE },
                    },
                ],
            };

            const instance = await db.Instances.findOne(instanceQry);
            if (!instance) {
                console.log("Instance not found.");
                orchUtils.logger.writeLogToFile("error", "Unable to find the instance.");
                return accountDtls;
            }

            const instanceData = JSON.parse(JSON.stringify(instance));
            if (!instanceData.accountdata) {
                orchUtils.logger.writeLogToFile("error", "Unable to fetch account details.");
            } else {
                accountDtls = {
                    tenantrefid: instanceData.accountdata.accountref,
                    accountdata: { rolename: instanceData.accountdata.rolename },
                    region: instanceData.region,
                    tenantid: instanceData.tenantid
                };
            }
            return accountDtls;
        } catch (e) {
            console.log("Unable to fetch instance data. " + e);
        }
    }
    patchInstance(
        instanceId,
        orchUtils,
        node
    ): Promise<OrchestrationNodeHandlerResponse> {
        return new Promise((resolve, reject) => {
            try {
                this.getAccountDetails(instanceId, orchUtils).then(
                    (accountDtls: any) => {
                        if (!accountDtls) {
                            orchUtils.logger.writeLogToFile("error", "Account details could not be retrieved.");
                            reject("Account details could not be retrieved.");
                            return;
                        }
                        orchUtils.logger.writeLogToFile(
                            "info",

                            `Node data  ${node.data}`
                        );
                        AWSService.getCredentials(accountDtls, accountDtls.tenantid).then(
                            (awsCredentials: any) => {
                                node.data.scan = node.data.scan ? node.data.scan : "Install";
                                let params = {
                                    DocumentName: "AWS-RunPatchBaseline",
                                    DocumentVersion: "$DEFAULT",
                                    MaxConcurrency: "50",
                                    MaxErrors: "0",
                                    Parameters: {
                                        Operation: [node.data.scan],
                                        SnapshotId: [""],
                                    },
                                    Targets: [
                                        {
                                            Key: "InstanceIds",
                                            Values: [instanceId],
                                        },
                                    ],
                                    TimeoutSeconds: 600,
                                };

                                if (node.data.scan == "Scan") {
                                    params["RebootOption"] = ["NoReboot"];
                                }
                                let logObj = {
                                    region: accountDtls.region,
                                    tenantid: accountDtls.tenantid,
                                    instances: [instanceId],
                                    createddt: new Date(),
                                    createdby: "Orchestrator",
                                    operation: [node.data.scan],
                                    configtype: "PATCHNOW",
                                    accountid: accountDtls.accountid,
                                };
                                SSMService.configPatching(
                                    awsCredentials,
                                    accountDtls.region,
                                    logObj,
                                    params
                                )
                                    .then((commandObj) => {
                                        orchUtils.logger.writeLogToFile(
                                            "info",
                                            "Patch execution completed and the command id is"
                                        );
                                        orchUtils.logger.writeLogToFile(
                                            "info",
                                            JSON.stringify(commandObj.data.Command.CommandId)
                                        );
                                        resolve({
                                            continue: true,
                                            payload: {
                                                commandObj,
                                                awsCredentials,
                                                region: accountDtls.region,
                                                accountDtls,
                                            },
                                        });
                                    })
                                    .catch((error: Error) => {
                                        reject("Error in configuring patch node. " + error);
                                    });
                            }
                        );
                    }
                );
            } catch (e) {
                reject(e);
            }
        });
    }
}
export default new PatchNodeHandler();
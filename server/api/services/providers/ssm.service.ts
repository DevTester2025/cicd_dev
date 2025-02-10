import * as _ from "lodash";
import * as AWS from "@aws-sdk/client-ssm";
import db from "../../models/model";
import LokiService from "../logging/loki.service";
import * as AWSSDK from "aws-sdk";
import { constants } from "../../../common/constants";

export class SSMService {
  constructor() {}
  describeAssociation(credentials, region, params) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.describeAssociation(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data["AssociationDescription"],
          });
        }
      });
    });

    return promise;
  }
  setDefaultBaseline(credentials, region, params) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.registerDefaultPatchBaseline(params, function (err, data) {
        if (err) {
          console.log(err);
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data,
          });
        }
      });
    });

    return promise;
  }
  listMaintenanceWindows(credentials, region, params) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.describeMaintenanceWindows(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data["WindowIdentities"],
          });
        }
      });
    });

    return promise;
  }
  configPBwithMW(credentials, region, body) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      let params = {
        ResourceType: "INSTANCE",
        Targets: [
          {
            Key: "InstanceIds",
            Values: body.instances,
          },
        ],
        WindowId: body.WindowId,
        Name: "PatchingTarget",
        Description: "Created via Patch Manager Configure Patching Wizard",
      };
      ssm.registerTargetWithMaintenanceWindow(params, function (err, data) {
        if (err) {
          new SSMService().createActivityLog(
            "Configure Patching with Manitenance Window",
            body,
            err,
            {
              id: body.WindowId,
              msg: `Failed to configure patching based on window ${body.WindowId}`,
            }
          );
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          let windowTargetId = data.WindowTargetId;
          let taskParam = {
            MaxConcurrency: "50",
            MaxErrors: "0",
            Priority: 1,
            Targets: [
              {
                Key: "WindowTargetIds",
                Values: [windowTargetId],
              },
            ],
            TaskArn: "AWS-RunPatchBaseline",
            TaskInvocationParameters: {
              RunCommand: {
                Parameters: {
                  Operation: body.operation,
                  SnapshotId: ["{{WINDOW_EXECUTION_ID}}"],
                },
                TimeoutSeconds: 600,
              },
            },
            TaskType: "RUN_COMMAND",
            WindowId: body.WindowId,
            Name: "PatchingTask",
            Description: "Created via Patch Manager Configure Patching Wizard",
          };
          ssm.registerTaskWithMaintenanceWindow(
            taskParam,
            function (error, task) {
              if (error) {
                new SSMService().createActivityLog(
                  "Configure Patching with Manitenance Window",
                  body,
                  error,
                  {
                    id: body.WindowId,
                    msg: `Failed to configure patching based on window ${body.WindowId}`,
                  }
                );
                resolve({
                  status: false,
                  error: error.stack,
                });
              } else {
                new SSMService().createActivityLog(
                  "Configure Patching with Manitenance Window",
                  body,
                  { ...task, ...data },
                  {
                    id: body.WindowId,
                    msg: `Successfully Configured Patching with Manitenance Window ${body.WindowId}`,
                  }
                );
                resolve({
                  status: true,
                  data: { ...task, ...data },
                });
              }
            }
          );
        }
      });
    });

    return promise;
  }
  executionList(credentials, region, params) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.describeAssociationExecutions(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data["AssociationExecutions"],
          });
        }
      });
    });

    return promise;
  }
  listCommandInvocations(credentials, region, params) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.listCommandInvocations(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data,
          });
        }
      });
    });

    return promise;
  }
  listComplianceItems(credentials, region, params) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.listComplianceItems(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data["ComplianceItems"],
          });
        }
      });
    });

    return promise;
  }
  listComplianceSummaries(credentials, region, filters?, limit?) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      let params = {
        MaxResults: limit,
        Filters: filters,
      };
      ssm.listComplianceSummaries(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          let result = _.find(data["ComplianceSummaryItems"], {
            ComplianceType: "Patch",
          });
          resolve({
            status: true,
            data: result,
          });
        }
      });
    });

    return promise;
  }
  listCommands(credentials, region, params) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.listCommands(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data["Commands"],
          });
        }
      });
    });

    return promise;
  }
  listAssociations(credentials, region, params) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.listAssociations(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data["Associations"],
          });
        }
      });
    });

    return promise;
  }
  describePatchBaselines(credentials, region, filters?, limit?) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>(
      async (resolve: Function, reject: Function) => {
        let params: any = {
          MaxResults: limit,
        };
        if (filters) {
          params.Filters = filters;
        }
        let config = { client: ssm, pageSize: 100, stopOnSameToken: true };
        try {
          const asyncGen = AWS.paginateDescribePatchBaselines(config, params);
          asyncGen
            .next()
            .then((data) => {
              resolve({
                status: true,
                data: data["value"]["BaselineIdentities"],
              });
            })
            .catch((e) => {
              reject({
                status: false,
                error: e.stack,
                data: null,
              });
            });
        } catch (e) {
          reject({
            status: false,
            error: e.stack,
          });
        }
      }
    );
    return promise;
  }
  complainceReporting(credentials, region, params) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.describeInstancePatchStates(params, function (err, data) {
        if (err) {
          reject({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data["InstancePatchStates"],
          });
        }
      });
    });

    return promise;
  }
  getInstanceProfiles(credentials, region, params) {
    var iam = new AWSSDK.IAM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      iam.listInstanceProfiles({}, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data["InstanceProfiles"],
          });
        }
      });
    });

    return promise;
  }
  updateIAMRole(credentials, region, body) {
    var ec2 = new AWSSDK.EC2({ region: region, credentials: credentials });
    var params = {
      IamInstanceProfile: {
        Name: body.iamrole.InstanceProfileName,
      },
      InstanceId: body.instancerefid,
    };
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ec2.associateIamInstanceProfile(params, function (err, data) {
        if (err) {
          new SSMService().createActivityLog(
            "IAM Role Modification",
            body,
            err,
            {
              id: body.instancerefid,
              msg: `Failed to associate IAM Instance Profile`,
            }
          );
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          new SSMService().createActivityLog(
            "IAM Role Modification",
            body,
            err,
            {
              id: body.instancerefid,
              msg: `IAM Role Modification Success`,
            }
          );
          db.Instances.update(
            { ssmsgentid: data.IamInstanceProfileAssociation.InstanceId },
            { where: { instancerefid: body.instancerefid } }
          );
          resolve({
            status: true,
            data: data,
          });
        }
      });
    });

    return promise;
  }
  getInventory(credentials, region, params?) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.getInventory(params, function (err, data) {
        if (err) {
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          resolve({
            status: true,
            data: data,
          });
        }
      });
    });

    return promise;
  }
  createBaseline(credentials, region, params, body) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.createPatchBaseline(params, function (err, data) {
        if (err) {
          new SSMService().createActivityLog("Baseline Creation", body, err, {
            id: body.pbname,
            msg: `Failed to created baseline ${body.pbname}`,
          });
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          new SSMService().createActivityLog(
            "Baseline Creation",
            body,
            data,

            {
              id: data.BaselineId,
              msg: `${data.BaselineId} Baseline Created successfully`,
            }
          );
          ssm.registerDefaultPatchBaseline(data, function (err, data) {
            if (err) {
              LokiService.createLog(
                {
                  message:
                    "SSMActivity : RegisterDefaultPatchBaseline : Failed",
                  error: err,
                },
                "ERROR"
              );
            } else {
              LokiService.createLog(
                {
                  message:
                    "SSMActivity : RegisterDefaultPatchBaseline : Success",
                  data: data,
                },
                "INFO"
              );
            }
          });
          resolve({
            status: true,
            data: data,
          });
        }
      });
    });

    return promise;
  }
  updateBaseline(credentials, region, params, body) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.updatePatchBaseline(params, function (err, data) {
        if (err) {
          new SSMService().createActivityLog(
            "Baseline Modification",
            body,
            err,
            {
              id: data.BaselineId,
              msg: `Failed to update ${data.BaselineId} Baseline`,
            }
          );
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          new SSMService().createActivityLog(
            "Baseline Modification",
            body,
            data,
            {
              id: data.BaselineId,
              msg: `${data.BaselineId} Baseline updated successfully`,
            }
          );
          resolve({
            status: true,
            data: data,
          });
        }
      });
    });

    return promise;
  }
  createAssociation(credentials, region, params, body) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.createAssociation(params, function (err, data) {
        if (err) {
          new SSMService().createActivityLog("Inventory Setup", body, err, {
            id: body.inventoryname,
            msg: `Failed to Setup Inventory Association For ` + body.instances,
          });
          resolve({
            status: false,
            error: err.stack,
          });
        } else {
          // Record Log
          new SSMService().createActivityLog("Inventory Setup", body, data, {
            id: data.AssociationDescription.AssociationId,
            msg: `${data.AssociationDescription.AssociationId} Association configured successfully`,
          });
          resolve({
            status: true,
            data: data,
          });
        }
      });
    });

    return promise;
  }
  deleteBaseline(credentials, region, body) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.deletePatchBaseline(
        {
          BaselineId: body.baselineid,
        },
        function (err, data) {
          if (err) {
            new SSMService().createActivityLog("Baseline Deletion", body, err, {
              id: body.baselineid,
              msg: `Failed to delete ${body.baselineid} Baseline`,
            });
            resolve({
              status: false,
              error: err.stack,
            });
          } else {
            new SSMService().createActivityLog(
              "Baseline Deletion",
              body,
              data,
              {
                id: body.baselineid,
                msg: `${body.baselineid} Baseline Deleted Successfully`,
              }
            );
            resolve({
              status: true,
              data: data,
            });
          }
        }
      );
    });

    return promise;
  }
  describeInstanceAssociation(credentials, region, body) {
    var ssm = new AWS.SSM({ region: region, credentials: credentials });
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      ssm.describeInstanceAssociationsStatus(
        {
          InstanceId: body.instancerefid,
        },
        function (err, data) {
          if (err) {
            resolve({
              status: false,
              error: err.stack,
            });
          } else {
            resolve({
              status: true,
              data: data["InstanceAssociationStatusInfos"],
            });
          }
        }
      );
    });

    return promise;
  }
  configPatching(credentials, region, body, params) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      try {
        var ssm = new AWS.SSM({ region: region, credentials: credentials });
        ssm.sendCommand(params, function (err, data) {
          if (err) {
            new SSMService().createActivityLog(
              "Patching Configuration",
              body,
              err,
              { msg: "Failed to configure patching" }
            );
            resolve({
              status: false,
              error: err.stack,
            });
          } else {
            resolve({
              status: true,
              data: data,
            });
            new SSMService().createActivityLog(
              "Patching Configuration",
              body,
              data,
              {
                id: data.Command.CommandId,
                msg: "Successfully configured patching, Patch Manager will use Run Command to patch your instances",
              }
            );
          }
        });
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }
  cancelPatch(credentials, region, params) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      try {
        var ssm = new AWS.SSM({ region: region, credentials: credentials });
        ssm.cancelCommand(params, function (err, data) {
          if (err) {
            resolve({
              status: false,
              error: err.stack,
            });
          } else {
            resolve({
              status: true,
              data: data,
            });
          }
        });
      } catch (e) {
        reject(e);
      }
    });
    return promise;
  }

  getManagedNodes(credentials, region, type?) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      callSync(credentials, region);
      async function callSync(credentials, region, token?) {
        var ssm = new AWS.SSM({ region: region, credentials: credentials });
        const baseFilter = {
          InstanceInformationFilterList: [
            {
              key: "PingStatus",
              valueSet: ["Online"],
            },
          ],
          MaxResults: 50,
          NextToken: token,
        };

        if (type) {
          let resourceType;
          if (type === "Hybrid") {
            resourceType = constants.MANAGED_INSTANCE;
          } else if (type === "Self") {
            resourceType = "EC2Instance";
          }

          if (resourceType) {
            baseFilter.InstanceInformationFilterList.push({
              key: "ResourceType",
              valueSet: [resourceType],
            });
          }
        }

        const filter = baseFilter;
        ssm.describeInstanceInformation(filter, async function (err, data) {
          if (err) {
            console.log(err);
            reject({
              status: true,
              err: err.stack,
              message: "Failed to Sync the details",
            });
          } else {
            if (data && data.InstanceInformationList.length > 0) {
              let array = [];
              for (const element of data.InstanceInformationList) {
                array.push(element);

                let condition = {
                  instancerefid: element.SourceId,
                  status: constants.STATUS_ACTIVE,
                } as any;
                let updateObj = {
                  ssmsgentid: element.SourceId,
                  ssmagent: JSON.stringify(
                    _.pick(element, [
                      "AgentVersion",
                      "PlatformType",
                      "PlatformName",
                      "IamRole",
                      "Name",
                      "ActivationId",
                    ])
                  ),
                  ssmagentstatus: element.PingStatus,
                } as any;
                if (element.ResourceType == constants.MANAGED_INSTANCE) {
                  condition = {
                    privateipv4: element.IPAddress,
                    status: constants.STATUS_ACTIVE,
                  };
                  updateObj.ssmagenttype = constants.SSMAGENT_TYPE;
                }
                  await db.Instances.update(
                    updateObj,
                    {
                  where: condition,
                    }
                  );
              }

              if (data.NextToken) {
                await callSync(credentials, region, data.NextToken);
              }
                if(!data.NextToken){
                resolve({
                  status: true,
                  message: "Sync Successfully Completed",
                });
              }
            } else {
              resolve({
                status: false,
                message: "No Managed Nodes found",
              });
            }
          }
          }
        );
      }
    });

    return promise;
  }

  createActivityLog(type, body, result, reference?) {
    try {
      let meta = result;
      if (result["$metadata"].httpStatusCode == 400) {
        meta = _.pick(result, ["__type", "$metadata"]);
      }
      db.SSMActivity.create({
        type: type,
        reference: reference ? reference.id : "",
        meta: JSON.stringify(meta),
        accountid: body.accountid,
        tenantid: body.tenantid,
        region: body.region,
        createddt: new Date(),
        status: "Active",
        notes: reference ? reference.msg : "",
        instances: JSON.stringify(body.instances),
        name: body.inventoryname
          ? body.inventoryname
          : body.pbname
          ? body.pbname
          : "",
        createdby: body.createdby ? body.createdby : "SYSTEM",
      })
        .then((data) => {
          LokiService.createLog(
            {
              message: "SSMActivity : Creation Success   INVENTORY",
              data: data,
            },
            "INFO"
          );
        })
        .catch((e) => {
          LokiService.createLog(
            {
              message: "SSMActivity : Creation Failed   INVENTORY",
              error: e,
            },
            "ERROR"
          );
        });
    } catch (e) {
      LokiService.createLog(
        {
          message: "SSMActivity : Creation Failed   INVENTORY",
          error: e,
        },
        "ERROR"
      );
    }
  }

}
export default new SSMService();

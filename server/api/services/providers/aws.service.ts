import AWS = require("aws-sdk");
import * as _ from "lodash";
import { AppError } from "../../../common/appError";
import { constants } from "../../../common/constants";
import db from "../../models/model";
import commonService from "../common.service";
import LokiService from "../logging/loki.service";

export class AWSService {
  constructor() {}
  // get tenant's AWS credentials
  getCredentials(regionData, tenantid) {
    let parameters = {
      where: {
        tenantid: tenantid,
        status: constants.STATUS_ACTIVE,
        fieldlabel: { $in: ["CLOUD_DETAILS"] },
      },
    };
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      commonService
        .getAllList(parameters, db.CustomField)
        .then((list) => {
          if (null == list || list.size === 0) {
            reject({
              status: false,
              message: constants.AWS_INVALID_CREDENTIALS.replace(
                "{region}",
                ""
              ),
            });
          } else {
            list = JSON.parse(JSON.stringify(list));
            let clouddetails = _.find(list, function (data: any) {
              if (data.fieldlabel === "CLOUD_DETAILS") {
                data.fieldvalue = commonService.decrypt(data.fieldvalue);
                return data;
              }
            });
            if (_.isEmpty(clouddetails) || _.isEmpty(clouddetails.fieldvalue)) {
              reject({
                status: false,
                message: constants.AWS_INVALID_CREDENTIALS.replace(
                  "{region}",
                  ""
                ),
              });
            } else {
              let awsCredentials = _.find(
                JSON.parse(clouddetails.fieldvalue),
                function (data: any) {
                  if (data.cloudprovider === constants.CLOUD_AWS) {
                    return data;
                  }
                }
              );
              if (
                !awsCredentials ||
                !awsCredentials.cloudauthkey ||
                !awsCredentials.cloudseckey
              ) {
                reject({
                  status: false,
                  message: constants.AWS_INVALID_CREDENTIALS.replace(
                    "{region}",
                    ""
                  ),
                });
              } else {
                // switch credentials
                let awsaccountid = regionData.tenantrefid;
                let awsiamrole = regionData.accountdata.rolename;
                let accesskeys = {
                  accessKeyId: awsCredentials.cloudauthkey,
                  secretAccessKey: awsCredentials.cloudseckey,
                  region: regionData.region,
                };
                if (
                  awsCredentials.accounttype &&
                  awsCredentials.accounttype == "Root Account"
                ) {
                  resolve(accesskeys);
                } else {
                  AWS.config.update(accesskeys);
                  AWS.config.region = regionData.region;
                  AWS.config.apiVersions = {
                    sts: "2011-06-15",
                    // other service API versions
                  };
                  let sts = new AWS.STS({});
                  let params = {
                    RoleArn:
                      "arn:aws:iam::" + awsaccountid + ":role/" + awsiamrole,
                    RoleSessionName:
                      "CloudOperationsGlobal-" + new Date().getTime(),
                    DurationSeconds: 3600,
                  };
                  sts.assumeRole(params, function (err, roledata) {
                    if (err) {
                      resolve(accesskeys);
                    } else {
                      resolve({
                        accessKeyId: roledata.Credentials.AccessKeyId,
                        secretAccessKey: roledata.Credentials.SecretAccessKey,
                        sessionToken: roledata.Credentials.SessionToken,
                      });
                    }
                  });
                }
              }
            }
          }
        })
        .catch((e) => {
          reject({
            status: false,
            message: constants.AWS_INVALID_CREDENTIALS.replace("{region}", ""),
          });
        });
    });

    return promise;
  }
  vmAction(action, ec2, instance, body) {
    let promise = new Promise<any>((resolve: Function, reject: Function) => {
      switch (action) {
        case "reboot":
          var params = {
            InstanceIds: [body.instancerefid],
          };
          ec2.rebootInstances(params, function (err, data) {
            if (err) {
              resolve({
                status: false,
                message: "Reboot Failed",
                err: err.stack,
              });
            } else {
              resolve({
                status: true,
                data: data,
                message: "Instance reboot process initiated successfully",
              });
            }
          });
          break;
        case "terminate":
          var params = {
            InstanceIds: [body.instancerefid],
          };
          ec2.terminateInstances(params, function (err, data) {
            if (err) {
              resolve({
                status: false,
                message: "Termination Failed",
                err: err.stack,
              });
            } else {
              resolve({
                status: true,
                data: data,
                message: "Instance shutdown process initiated successfully",
              });
            }
          });
          break;
        case "restoresnapshot":
          let attributes = {
            SnapshotId: body.volume.SnapshotId,
          };
          ec2.restoreSnapshotFromRecycleBin(attributes, function (err, data) {
            if (err) {
              resolve({
                status: false,
                message: "Failed to restore the instance snapshot",
                err: err.stack,
              });
            } else {
              resolve({
                status: true,
                data: data,
                message: "Snapshot restored successfully",
              });
            }
          });
          break;
        case "snapshot":
          let parameters = {
            InstanceSpecification: {
              InstanceId: body.instancerefid,
            },
            Description:
              "Volume(s) copied from the instance " +
              body.instancerefid +
              " (" +
              instance.instancename +
              ")",
            TagSpecifications: [
              {
                ResourceType: "snapshot",
                Tags: [
                  {
                    Key: "Name",
                    Value: instance.instancename,
                  },
                ],
              },
            ],
          };
          ec2.createSnapshots(parameters, function (err, data) {
            if (err) {
              resolve({
                status: false,
                message: "Failed to create the instance snapshots",
                err: err.stack,
              });
            } else {
              resolve({
                status: true,
                data: data,
                message: "Snapshots created successfully",
              });
            }
          });
          break;
        case "stop":
          var params = {
            InstanceIds: [body.instancerefid],
          };
          ec2.stopInstances(params, function (err, data) {
            if (err) {
              resolve({
                status: false,
                message: "Failed to stop the instance",
                err: err.stack,
              });
            } else {
              resolve({
                status: true,
                data: data,
                message: "Instance stop process initiated successfully",
              });
            }
          });
          break;
        case "start":
          var params = {
            InstanceIds: [body.instancerefid],
          };
          ec2.startInstances(params, function (err, data) {
            if (err) {
              resolve({
                status: false,
                message: "Failed to start the instance",
                err: err.stack,
              });
            } else {
              resolve({
                status: true,
                data: data,
                message: "Instance start process initiated successfully",
              });
            }
          });
          break;
        case "resize":
          var rparams = {
            InstanceId: body.instancerefid,
            InstanceType: {
              Value: body.instancetyperefid,
            },
          };
          ec2.modifyInstanceAttribute(rparams, function (err, data) {
            if (err) {
              let reply = {
                status: false,
                message: "Failed to resize the instance",
                notes: `${err.code}`,
                err: err.stack,
              } as any;
              if (err.code == "IncorrectInstanceState") {
                (reply.message = "Please stop the instance and try resize"),
                  (reply.notes = `${err.code} : The instance ${body.instancerefid} is not in the stopped state`);
              }
              resolve(reply);
            } else {
              db.Instances.update(
                { instancetyperefid: body.instancetyperefid },
                {
                  where: {
                    instancerefid: body.instancerefid,
                    status: constants.STATUS_ACTIVE,
                  },
                }
              );
              resolve({
                status: true,
                data: data,
                message:
                  "The instance has been modified from " +
                  body.oldinstancetyperefid +
                  " to " +
                  body.instancetyperefid,
              });
            }
          });
          break;
        case "deletesnapshot":
          var sparams = {
            SnapshotId: body.volume.SnapshotId,
          };
          ec2.deleteSnapshot(sparams, function (err, data) {
            if (err) {
              resolve({
                status: false,
                message: "Failed to remove the Snapshot",
                err: err.stack,
              });
            } else {
              resolve({
                status: true,
                data: {
                  ...data,
                  SnapshotId: body.volume.SnapshotId,
                  VolumeSize: body.volume.VolumeSize,
                },
                message: "Snapshot removed successfully",
              });
            }
          });
          break;
        default:
          resolve({ status: false, message: "Invalid Action" });
      }
    });

    return promise;
  }
}
export default new AWSService();

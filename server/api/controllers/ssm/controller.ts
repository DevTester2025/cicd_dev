import { Request, Response } from "express";
import * as _ from "lodash";
import { modules } from "../../../common/module";
import db from "../../models/model";
import { customValidation } from "../../../common/validation/customValidation";
import { constants } from "../../../common/constants";
import SSMService from "../../services/providers/ssm.service";
import AWSService from "../../services/providers/aws.service";
import AWS = require("aws-sdk");
import { AppError } from "../../../common/appError";
import commonService from "../../services/common.service";
import awsService from "../../services/providers/aws.service";
import sequelize = require("sequelize");
export class Controller {
  constructor() {}
  all(req: Request, res: Response): void {
    const response = { reference: "SSM_INSTANCES" };
    try {
      let parameters = {
        where: req.body,
        include: [],
        order: [["createddt", "desc"]],
      } as any;
      if (_.isUndefined(req.body.status)) {
        parameters["where"]["status"] = { $ne: "Deleted" };
      }
      if (req.query.limit) {
        parameters["limit"] = Number(req.query.limit);
      }
      if (req.query.offset) {
        parameters["offset"] = Number(req.query.offset);
      }
      if (req.query.count) {
        commonService
          .getCountAndList(parameters, db.SSMActivity)
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
      } else {
        commonService
          .getAllList(parameters, db.SSMActivity)
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
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getInstanceProfiles(req: Request, res: Response, next: any) {
    let response = { reference: "SSM_INSTANCEPROFILES" };
    try {
      SSMService.getInstanceProfiles(
        req["awscredentials"],
        req["region"],
        _.pick(req.body, ["region"])
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }
  updateRole(req: Request, res: Response, next: any) {
    let response = { reference: "SSM_Update_IAMRole" };
    try {
      SSMService.updateIAMRole(req["awscredentials"], req["region"], req.body)
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getAccess(req: Request, res: Response, next: any) {
    console.log("Get access -----------------------------------------");
    let response = { reference: "REGIONACCESS" };
    try {
      if (req.body.region != null && req.body.region != undefined) {
        if (req.body.accountid != null && req.body.accountid != undefined) {
          db.TenantRegion.findOne({
            where: {
              region: req.body["region"],
              tenantid: req.body["tenantid"],
              _accountid: req.body["accountid"],
            },
            include: [
              {
                as: "accountdata",
                model: db.CustomerAccount,
                attributes: ["rolename"],
                where: { status: constants.STATUS_ACTIVE },
              },
            ],
          })
            .then((tenantregion: any) => {
              if (tenantregion != null) {
                AWSService.getCredentials(
                  tenantregion["dataValues"],
                  req.body.tenantid
                )
                  .then((awsCredentials: any) => {
                    req["region"] = tenantregion["dataValues"]["region"];
                    req["awscredentials"] = awsCredentials;
                    next();
                  })
                  .catch((e: any) => {
                    console.log(e);
                    customValidation.generateAppError(e, response, res, req);
                  });
              } else {
                customValidation.generateAppError(
                  new AppError("Invalid Region & Account Details"),
                  response,
                  res,
                  req
                );
              }
            })
            .catch((e: any) => {
              console.log(e);
              customValidation.generateAppError(e, response, res, req);
            });
        } else {
          // req["region"] = req["body"]["region"];
          // req["awscredentials"] = {
          //   accessKeyId: process.env.APP_AWS_ACCESS,
          //   secretAccessKey: process.env.APP_AWS_SECRET,
          // };
          // next();
          customValidation.generateCustomResponse(
            { message: "Please select account", data: null, status: false },
            res,
            req
          );
        }
      } else {
        customValidation.generateCustomResponse(
          { message: "Please select region", data: null, status: false },
          res,
          req
        );
      }
    } catch (e) {
      console.log(e);
      customValidation.generateAppError(e, response, res, req);
    }
  }

  inventoryDashboard(req: Request, res: Response): void {
    let response = { reference: modules.IVDASHBOARD };
    try {
      let params = {} as any;
      if (req.body.type == "OS_VERSION") {
        params = {
          MaxResults: req.body.limit,
          Filters: [
            {
              Key: "AWS:InstanceInformation.InstanceStatus",
              Values: ["Terminated"],
              Type: "NotEqual",
            },
          ],
          Aggregators: [
            {
              Expression: "AWS:InstanceInformation.PlatformName",
              Aggregators: [
                {
                  Expression: "AWS:InstanceInformation.PlatformVersion",
                },
              ],
            },
          ],
        };
      }
      if (req.body.type == "SERVER_ROLES") {
        params = {
          MaxResults: req.body.limit,
          Filters: [
            {
              Key: "AWS:InstanceInformation.InstanceStatus",
              Values: ["Terminated"],
              Type: "NotEqual",
            },
          ],
          Aggregators: [
            {
              Expression: "AWS:WindowsRole.DisplayName",
            },
          ],
        };
      }
      if (req.body.type == "SERVICES") {
        params = {
          MaxResults: req.body.limit,
          Filters: [
            {
              Key: "AWS:InstanceInformation.InstanceStatus",
              Values: ["Terminated"],
              Type: "NotEqual",
            },
          ],
          Aggregators: [
            {
              Expression: "AWS:Service.DisplayName",
            },
          ],
        };
      }
      if (req.body.type == "APPLICATION") {
        params = {
          MaxResults: req.body.limit,
          Filters: [
            {
              Key: "AWS:InstanceInformation.InstanceStatus",
              Values: ["Terminated"],
              Type: "NotEqual",
            },
          ],
          Aggregators: [
            {
              Expression: "AWS:Application.Name",
              Aggregators: [
                {
                  Expression: "AWS:Application.Version",
                  Aggregators: [
                    {
                      Expression: "AWS:InstanceInformation.PlatformType",
                    },
                  ],
                },
              ],
            },
          ],
        };
      }
      if (req.body.type == "MANAGED_NODES") {
        params = {
          Filters: [
            {
              Key: "AWS:InstanceInformation.InstanceStatus",
              Values: ["Terminated"],
              Type: "NotEqual",
            },
          ],
          Aggregators: [
            {
              Groups: [
                {
                  Name: "InventoryEnabledORDisabled",
                  Filters: [
                    {
                      Key: "TypeName",
                      Values: [
                        "AWS:AWSComponent",
                        "AWS:Application",
                        "AWS:File",
                        "AWS:InstanceDetailedInformation",
                        "AWS:Network",
                        "AWS:Service",
                        "AWS:WindowsRegistry",
                        "AWS:WindowsRole",
                        "AWS:WindowsUpdate",
                      ],
                      Type: "Exists",
                    },
                  ],
                },
              ],
            },
          ],
        };
      }
      SSMService.getInventory(req["awscredentials"], req["region"], params)
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  pmDashboard(req: Request, res: Response): void {
    let response = { reference: modules.PATCHMANAGER };
    try {
      let filters = [
        {
          Key: "ComplianceType",
          Values: ["Patch"],
          Type: "Equal",
        },
      ];
      let limit = null;
      SSMService.listComplianceSummaries(
        req["awscredentials"],
        req["region"],
        filters,
        limit
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  listofBaselines(req: Request, res: Response): void {
    let response = { reference: "BASELINES_LIST" };
    try {
      let filters = [];
      let limit = req.body.limit;
      if (req.query.os) {
        filters.push({
          Key: "OPERATING_SYSTEM",
          Values: [req.query.os],
        });
      }
      SSMService.describePatchBaselines(
        req["awscredentials"],
        req["region"],
        filters,
        limit
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  listAssociations(req: Request, res: Response): void {
    let response = { reference: "ASSOCIATIONS_LIST" };
    try {
      let params = {} as any;
      if (req.body.type == "INVENTORY") {
        params.AssociationFilterList = [
          {
            key: "PluginName",
            value: "aws:softwareInventory",
          },
        ];
      }
      SSMService.listAssociations(req["awscredentials"], req["region"], params)
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  describeAssStatus(req: Request, res: Response): void {
    let response = { reference: "SSM_DESC_ASS_STATUS" };
    try {
      SSMService.describeInstanceAssociation(
        req["awscredentials"],
        req["region"],
        req.body
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  createInventory(req: Request, res: Response): void {
    let response = { reference: "SSM_CREATEINV" };
    try {
      let params = {
        Name: "AWS-GatherSoftwareInventory",
        AssociationName: req.body.inventoryname,
        Targets: [
          {
            Key: "InstanceIds",
            Values: req.body.instances,
          },
        ],
        ScheduleExpression: req.body.schedule, //"rate(30 minutes)",
        Parameters: {
          applications: [req.body.applicationyn],
          awsComponents: [req.body.awscomponentyn],
          files: [""],
          networkConfig: [req.body.networkconfigyn],
          windowsUpdates: [req.body.windownsupdateyn],
          instanceDetailedInformation: [req.body.instancedtlinfoyn],
          services: [req.body.servicesyn],
          windowsRegistry: [""],
          windowsRoles: [req.body.windowsroleyn],
          customInventory: [req.body.custominventoryyn],
          billingInfo: [req.body.billinginfoyn],
        },
      };
      SSMService.createAssociation(
        req["awscredentials"],
        req["region"],
        params,
        req.body
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  createBaseline(req: Request, res: Response): void {
    let response = { reference: "SSM_CREATEPATCHBASELINE" };
    try {
      let params = {
        Name: req.body.pbname,
        OperatingSystem: req.body.osname,
        Description:
          req.body.description != "" ? req.body.description : undefined,
        ApprovalRules: {
          PatchRules: [
            {
              PatchFilterGroup: {
                PatchFilters: [
                  {
                    Key: "PRODUCT",
                    Values: ["*"],
                  },
                ],
              },
              ApproveAfterDays: 0,
            },
          ],
        },
        Sources: [],
      };
      SSMService.createBaseline(
        req["awscredentials"],
        req["region"],
        params,
        req.body
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  updateBaseline(req: Request, res: Response): void {
    let response = { reference: "SSM_UPDATEPATCHBASELINE" };
    try {
      let params = {
        BaselineId: req.body.baselineid,
        Name: req.body.pbname,
        OperatingSystem: req.body.osname,
        Description: req.body.description,
        ApprovalRules: {
          PatchRules: [
            {
              PatchFilterGroup: {
                PatchFilters: [
                  {
                    Key: "PRODUCT",
                    Values: ["*"],
                  },
                ],
              },
              ApproveAfterDays: 0,
            },
          ],
        },
        Sources: [],
      };
      SSMService.updateBaseline(
        req["awscredentials"],
        req["region"],
        params,
        req.body
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  deleteBaseline(req: Request, res: Response): void {
    let response = { reference: "DELETE_PATCHBASELINE" };
    try {
      SSMService.deleteBaseline(req["awscredentials"], req["region"], req.body)
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  configPB(req: Request, res: Response): void {
    let response = { reference: "SSM_CONFIGPB" };
    try {
      let params = {} as any;
      if (req.body.configtype == "PATCHNOW") {
        params = {
          DocumentName: "AWS-RunPatchBaseline",
          DocumentVersion: "$DEFAULT",
          MaxConcurrency: "50",
          MaxErrors: "0",
          Parameters: {
            Operation: req.body.operation,
            SnapshotId: [""],
          },
          Targets: [
            {
              Key: "InstanceIds",
              Values: req.body.instances,
            },
          ],
          TimeoutSeconds: 600,
        };
        if (_.includes(req.body.operation, "Install")) {
          params["RebootOption"] = "RebootIfNeeded";
        }
        SSMService.configPatching(
          req["awscredentials"],
          req["region"],
          req.body,
          params
        )
          .then((data) => {
            customValidation.generateCustomResponse(data, res, req);
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      } else if (req.body.configtype == "SCHEDULEPATCH") {
        SSMService.configPBwithMW(
          req["awscredentials"],
          req["region"],
          req.body
        )
          .then((data) => {
            customValidation.generateCustomResponse(data, res, req);
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getManagedNodes(req: Request, res: Response): void {
    let response = { reference: "SYNC_INSTANCES_AGENT" };
    try {
      SSMService.getManagedNodes(req["awscredentials"], req["region"],req.body.ssmagenttype)
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  async getComplianceSummary(req: Request, res: Response): Promise<void> {
    let response = { reference: "SSM-LISTCOMMANDS" };
    try {
      let instanceids = await db.Instances.findAll({
        where: {
          status: "Active",
          tenantid: req.body.tenantid,
          ssmagent: { $ne: null },
          instancerefid: {
            [sequelize.Op.in]: sequelize.literal(
              `(SELECT instancerefid FROM tbl_tn_instances WHERE status="Active" AND accountid=${req.body.accountid} AND region='${req.body.region}')`
            ),
          },
        },
        attributes: [
          "ssmagent",
          "ssmagentstatus",
          "instancerefid",
          "instancename",
        ],
      });
      let instances = [];
      if (instanceids.length > 0) {
        _.map(JSON.parse(JSON.stringify(instanceids)), (itm) => {
          instances.push(itm.instancerefid);
        });

        let params = {
          InstanceIds: instances,
        } as any;
        if(req.body.baseline){
          params['BaselineId'] = req.body.baseline
        }
        SSMService.complainceReporting(
          req["awscredentials"],
          req["region"],
          params
        )
          .then((data) => {
            customValidation.generateCustomResponse(data, res, req);
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      } else {
        customValidation.generateCustomResponse([], res, req);
      }
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getComplianceById(req: Request, res: Response): void {
    let response = { reference: "SSM-LISTCOMMANDS" };
    try {
      let params = {
        ResourceTypes: ["ManagedInstance"],
        ResourceIds: [req.params.instancerefid],
      } as any;
      SSMService.listComplianceItems(
        req["awscredentials"],
        req["region"],
        params
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getCommands(req: Request, res: Response): void {
    let response = { reference: "SSM-LISTCOMMANDS" };
    try {
      let params = {
        Filters: [{ key: "ExecutionStage", value: "Complete" }],
      } as any;
      if (req.body.commandtype == "PATCH") {
        params.Filters.push({
          key: "DocumentName",
          value: "AWS-RunPatchBaseline",
        });
      }
      SSMService.listCommands(req["awscredentials"], req["region"], params)
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  getCommandInvocation(req: Request, res: Response): void {
    let response = { reference: "SSM-LISTCOMMANDS" };
    try {
      SSMService.listCommandInvocations(req["awscredentials"], req["region"], {
        CommandId: req.params.commandid,
        Details: true,
      })
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getExecutionList(req: Request, res: Response): void {
    let response = { reference: "SSM-EXECLIST" };
    try {
      SSMService.executionList(req["awscredentials"], req["region"], {
        AssociationId: req.params.associationid,
      })
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  associationById(req: Request, res: Response): void {
    let response = { reference: "SSM-ASSBYID" };
    try {
      SSMService.describeAssociation(req["awscredentials"], req["region"], {
        AssociationId: req.params.associationid,
      })
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  setDefaultBaseline(req: Request, res: Response): void {
    console.log("Check default");
    let response = { reference: "SSM-SETDEFAULTBL" };
    try {
      SSMService.setDefaultBaseline(req["awscredentials"], req["region"], {
        BaselineId: req.body.BaselineId,
      })
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  listMaintenancewindows(req: Request, res: Response): void {
    let response = { reference: "SSM-ASSBYID" };
    try {
      let params = {
        Filters: [{ Key: "Enabled", Values: ["true"] }],
        MaxResults: 50,
      };
      SSMService.listMaintenanceWindows(
        req["awscredentials"],
        req["region"],
        params
      )
        .then((data) => {
          customValidation.generateCustomResponse(data, res, req);
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  async getAllSSMdetails(req: Request, res: Response) {
    let accounts: any = await db.TenantRegion.findAll({
      where: {
        status: constants.STATUS_ACTIVE,
        tenantid: req.body.tenantid,
        cloudprovider: constants.CLOUD_AWS,
      },
      attributes: ["region", "tenantrefid", "tenantid"],
      include: [
        {
          as: "accountdata",
          model: db.CustomerAccount,
          required: true,
          attributes: ["rolename"],
          where: { status: constants.STATUS_ACTIVE },
        },
      ],
    });

    customValidation.generateCustomResponse({}, res, req);

    syncAccount(0);
    function syncAccount(idx) {
      if (accounts[idx]) {
        awsService
          .getCredentials(accounts[idx], accounts[idx].tenantid)
          .then((resp) => {
            SSMService.getManagedNodes(resp, accounts[idx]["region"])
              .then((data) => {
                console.log(data);
                console.log(
                  "-----------------------------------------------------------------------------------------"
                );
                console.log("Sync successful ", idx, accounts[idx].tenantrefid);
                console.log(
                  "-----------------------------------------------------------------------------------------"
                );
                syncAccount(idx + 1);
              })
              .catch((error: Error) => {
                console.log(
                  "-----------------------------------------------------------------------------------------"
                );
                console.log("Error in sync ", idx, accounts[idx].tenantrefid);
                console.log(
                  "-----------------------------------------------------------------------------------------"
                );
                syncAccount(idx + 1);
              });
          })
          .catch((e) => {
            console.log(
              "-----------------------------------------------------------------------------------------"
            );
            console.log(
              "Error in getting cred ",
              idx,
              accounts[idx].tenantrefid
            );
            console.log(
              "-----------------------------------------------------------------------------------------"
            );
            syncAccount(idx + 1);
          });
      }
    }
  }
}
export default new Controller();

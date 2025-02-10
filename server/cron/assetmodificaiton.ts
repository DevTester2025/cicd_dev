import * as AWS from "aws-sdk";
import axios from "axios";

import commonService from "../api/services/common.service";
import { constants } from "../common/constants";
import db from "../api/models/model";
import { APIVersions, ConfigurationOptions } from "aws-sdk/lib/config";
import { ConfigurationServicePlaceholders } from "aws-sdk/lib/config_service_placeholders";
import { ICloudDetails } from "./interface";

interface ITenantRegion {
  tnregionid: number;
  tenantid: number;
  cloudprovider: string;
  customerid: number;
  region: string;
  tenantrefid: string;
  lastsyncdt: Date;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
  customer: Customer;
  accountdata: CustomerAccount;
}

interface Customer {
  customerid: number;
  tenantid: number;
  customername: string;
  customeraddress: string;
  postcode: string;
  phoneno: string;
  secondaryphoneno: string;
  contactperson: string;
  contactemail: string;
  ecl2tenantid: null;
  awsaccountid: string;
  ecl2region: null;
  awsregion: string;
  ecl2contractid: string;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
}

interface ITnInstance {
  networkid: number[];
  instanceid: number;
  tenantid: number;
  customerid: number;
  cloudprovider: string;
  lifecycle: string;
  deploymentid: null;
  rightsizegrpid: null;
  instancerefid: string;
  instancename: string;
  adminusername: null;
  adminpassword: null;
  zoneid: number;
  region: string;
  checksum: string;
  rightsizeyn: null;
  imageid: number;
  imagerefid: string;
  platform: string;
  instancetypeid: number;
  instancetyperefid: string;
  networkrefid: string;
  securitygroupid: number;
  securitygrouprefid: string;
  subnetid: number;
  subnetrefid: string;
  volumeid: number;
  volumerefid: string;
  keyid: number;
  keyrefid: string;
  publicipv4: string;
  cloudstatus: string;
  privateipv4: string;
  publicdns: string;
  monitoringyn: string;
  deletionprotectionyn: string;
  lbstatus: string;
  emailyn: string;
  notes: string;
  tnregionid: number;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
  lastrun: null;
  recommendationid: null;
  costyn: null;
  lastcostsyncdt: null;
}

interface INotificationSetup {
  ntfcsetupid: number;
  tenantid: number;
  module: string;
  event: string;
  ntftype: string;
  template: string;
  receivers: string;
  notes: string;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
}

interface IUser {
  userid: number;
  tenantid: number;
  customerid: number;
  password: string;
  fullname: string;
  email: string;
  phone: string;
  secondaryphoneno: string;
  department: string;
  isapproveryn: string;
  lastlogin: Date;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
  roleid: number;
}

interface CustomerAccount {
  id: number;
  name: string;
  rolename: string;
  tenantid: number;
  cloudprovider: string;
  customerid: number;
  accountref: string;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
}

export default class AWSEC2Watcher {
  private tenantid: number;
  private authReSyncOnChangeDetection: boolean = false;

  private authKey: string;
  private authSecret: string;
  private authAccountType: "Root Account" | string;

  private accountsRegionToSync: ITenantRegion[] = [];
  private existingInstances: ITnInstance[] = [];
  private errorGettingExistingInstance = false;

  private changesInAssets = {} as Record<
    string,
    {
      existing: ITnInstance | null;
      current: AWS.EC2.Instance;
      change: { description: string; type: string }[];
    }
  >;
  private notificationUserMaps = {} as Record<string, number[]>;
  private recipientsList = [] as IUser[];

  constructor(
    tenantid: number,
    options: {
      authReSyncOnChangeDetection?: boolean;
    }
  ) {
    this.tenantid = tenantid;
    if (options.authReSyncOnChangeDetection) {
      this.authReSyncOnChangeDetection = options.authReSyncOnChangeDetection;
    }
  }

  init() {
    this.getSecrets();
    this.getExistingEc2Instances();
  }

  async initiateReSync(data: Record<string, any>) {
    const url = constants.BASE_URL + "/cloudmatiq/aws/common/synchronization";

    console.log("URL TO REQUEST >>>> ", url);

    axios
      .post(url, data)
      .then((res) => {
        console.log("Re-sync initiated. 👍 >>>>>>>>>>>>>>>>>>");
        console.log(res.data);
      })
      .catch((err) => {
        console.log("ERROR INITIATING RE-SYNC");
        console.log(err);
      });
  }

  getExistingEc2Instances() {
    db.Instances.findAll({
      where: {
        tenantid: this.tenantid,
        status: "Active",
      },
    })
      .then((records) => {
        const instances = JSON.parse(JSON.stringify(records)) as ITnInstance[];

        if (instances && instances.length > 0) {
          this.existingInstances = instances;
        }
      })
      .catch((err) => {
        this.errorGettingExistingInstance = true;
        console.log("ERROR getting available instances");
        console.log(err);
        throw err;
      });
  }

  getSecrets() {
    db.CustomField.findAll({
      where: {
        tenantid: this.tenantid,
        status: constants.STATUS_ACTIVE,
        fieldlabel: { $in: ["CLOUD_DETAILS"] },
      },
    })
      .then((records) => {
        const cloudDetails = records ? records[0] : null;
        if (cloudDetails) {
          const cloudLists = JSON.parse(
            commonService.decrypt(cloudDetails.dataValues["fieldvalue"])
          ) as ICloudDetails[];
          const AWSCred = cloudLists.find((o) => o["cloudprovider"] == "AWS");

          if (AWSCred) {
            this.authKey = AWSCred.cloudauthkey;
            this.authSecret = AWSCred.cloudseckey;
            this.authAccountType = AWSCred.accounttype;
            this.getNotificationReceivers();
          } else {
            throw new Error("No credentials found for AWS.");
          }
        } else {
          throw new Error("No credentials found");
        }
      })
      .catch((err) => {
        console.log("Error getting account credentials");
        console.log(err);
        throw err;
      });
  }

  getNotificationReceivers() {
    db.notificationsetup
      .findAll({
        where: {
          module: "Asset",
          event: {
            $in: ["New", "Modified", "Deleted"],
          },
          status: "Active",
        },
      })
      .then((records) => {
        let users = new Set();

        records.forEach((r) => {
          const u = JSON.parse(r.dataValues["receivers"]);
          u.forEach((user: number | string) => {
            users.add(user);
          });
        });

        db.User.findAll({
          where: {
            userid: { $in: Array.from(users) },
            status: "Active",
          },
        })
          .then((usersList) => {
            if (usersList.length > 0) {
              let ntfTypeUserMaps = {} as Record<string, number[]>;

              records.forEach((ntfsetup) => {
                const type = ntfsetup.dataValues["event"];
                const users = JSON.parse(ntfsetup.dataValues["receivers"]);

                if (ntfTypeUserMaps[type]) {
                  ntfTypeUserMaps[type].push(...users);
                } else {
                  ntfTypeUserMaps[type] = users;
                }
              });

              this.notificationUserMaps = ntfTypeUserMaps;
              this.recipientsList = JSON.parse(JSON.stringify(usersList));

              if (Object.keys(this.notificationUserMaps).length > 0) {
                this.getRegionsToCompare();
              } else {
                console.log("No notification receivers.");
              }
            } else {
              console.log("No users identified for notification.");
            }
          })
          .catch((err) => {
            console.log("ERROR GETTING USERS LIST");
            console.log(err);
          });
      })
      .catch((err) => {
        console.log("ERR GETTING NOTIFICATION SETUP SCREEN");
        console.log(err);
      });
  }

  getRegionsToCompare() {
    db.TenantRegion.findAll({
      where: {
        tenantid: this.tenantid,
        cloudprovider: constants.CLOUD_AWS,
        status: constants.STATUS_ACTIVE,
      },
      include: [
        {
          as: "customer",
          model: db.Customer,
          where: { status: constants.STATUS_ACTIVE },
        },
        {
          as: "accountdata",
          model: db.CustomerAccount,
          where: { status: constants.STATUS_ACTIVE },
        },
      ],
    })
      .then((accounts) => {
        let regions = [] as ITenantRegion[];
        accounts.forEach((o) => {
          regions.push(JSON.parse(JSON.stringify(o.dataValues)));
        });

        this.accountsRegionToSync = regions;
        if (this.accountsRegionToSync.length > 0) {
          this.pullEC2FromRegion(0);
        }
      })
      .catch((err) => {
        console.log("Error fetching accounts to sync.");
        console.log(err);
      });
  }

  getAWSCred(
    region: string,
    accountid?: string,
    role?: string
  ): Promise<
    ConfigurationOptions & ConfigurationServicePlaceholders & APIVersions
  > {
    return new Promise((resolve, reject) => {
      const keys = {
        secretAccessKey: this.authSecret,
        accessKeyId: this.authKey,
        region: region,
      };

      if (this.authAccountType == "Root Account") {
        resolve(keys);
      } else {
        AWS.config.update(keys);
        AWS.config.region = region;
        AWS.config.apiVersions = {
          sts: "2011-06-15",
        };
        let sts = new AWS.STS({});
        sts.assumeRole(
          {
            RoleArn: "arn:aws:iam::" + accountid + ":role/" + role,
            RoleSessionName: "CloudOperationsGlobal",
            DurationSeconds: 1800,
          },
          function (err, roledata) {
            if (err) {
              console.log("Error gaining AWS Access ARN");
              console.log(err, err.stack);
              reject("Unable to switch role");
            } else {
              resolve({
                accessKeyId: roledata.Credentials.AccessKeyId,
                secretAccessKey: roledata.Credentials.SecretAccessKey,
                sessionToken: roledata.Credentials.SessionToken,
              });
            }
          }
        );
      }
    });
  }

  async pullEC2FromRegion(index: number) {
    const account = this.accountsRegionToSync[index];

    const AWSConfig =
      this.authAccountType == ""
        ? await this.getAWSCred(account.region)
        : await this.getAWSCred(
            account.region,
            account.accountdata.accountref,
            account.accountdata.rolename
          );

    AWS.config.update(AWSConfig);
    const ec2 = new AWS.EC2({ apiVersion: constants.AWS_EC2_APIVERSION });

    ec2.describeInstances(
      {
        MaxResults: 999,
      },
      (err, records) => {
        if (err) {
          console.log("ERROR DESCRIBING INSTANCES >>>>>>>>>>>>");
          console.log(err);
          throw err;
        } else {
          const instances = [] as AWS.EC2.Instance[];

          records.Reservations.forEach((o) => {
            o.Instances.forEach((i) => {
              instances.push(i);
            });
          });

          let resync = false;

          console.log(
            `Total instances in region ${account.region} is ${instances.length}`
          );

          // To identify new assets.
          const existingInstancesInRegion = this.existingInstances.filter(
            (o) => o["region"] == account.region
          );

          existingInstancesInRegion.forEach((o) => {
            const index = instances.findIndex(
              (j) => j["InstanceId"] == o["instancerefid"]
            );
            if (index == -1) {
              resync = true;
              this.recordChangesInAsset(
                o,
                null,
                `Instance with Ref Id: ${o["instancerefid"]} is removed.`,
                "Deleted"
              );
              instances.splice(index, 1);
            }
          });

          // Check if existing instances are fetched.
          instances.forEach((i) => {
            let r = this.compareAndNotify(i);
            //   To ensure the consecutive loop doesn't change the attribute to false
            if (r == true) {
              resync = true;
            }
          });

          // console.log(`Need to resync for ${account.region} ?`, resync);
          if (resync) {
            this.sendNotification();
            console.log(`Changes are made in region ${account.region}.`);

            if (this.authReSyncOnChangeDetection == true) {
              console.log("Starting re-sync 🔄");
              this.initiateReSync({
                tenantid: parseInt(this.tenantid.toString()),
                zonename: account.region,
                awsaccountid: account.tenantrefid,
                awszoneid: account.region,
                region: account.region,
                status: "Active",
                tnregionid: account.tnregionid,
                createdby: "DATASYNC",
                createddt: new Date(),
                lastupdatedby: "DATASYNC",
                lastupdateddt: new Date(),
                customerid: account.customerid,
              });
            }
          } else {
            console.log(`No changes in region ${account.region}.`);
          }

          if (index < this.accountsRegionToSync.length - 1) {
            if (resync) {
              console.log(
                "Waiting for 30 Seconds to validate assets for next region"
              );
              setTimeout(() => {
                this.pullEC2FromRegion(index + 1);
              }, 30000);
            } else {
              this.pullEC2FromRegion(index + 1);
            }
          } else {
            console.log("--------------------------------------------------");
            console.log("Compared all possible EC2 instances");
            console.log(JSON.stringify(this.changesInAssets));
          }
        }
      }
    );
  }

  compareAndNotify(instance: AWS.EC2.Instance) {
    let resync = false;

    const existingData = this.existingInstances.find(
      (o) => o["instancerefid"] == instance.InstanceId
    );

    if (existingData) {
      if (existingData.instancetyperefid != instance.InstanceType) {
        resync = true;
        this.recordChangesInAsset(
          existingData,
          instance,
          `Instance type changed from ${existingData.instancetyperefid} to ${instance.InstanceType}`,
          "Modified"
        );
      }
      if (instance.State.Name != existingData.cloudstatus) {
        resync = true;
        this.recordChangesInAsset(
          existingData,
          instance,
          `Instance state changed from "${existingData.cloudstatus}" to "${instance.State.Name}". Ref Id:  ${instance.InstanceId}`,
          "Modified"
        );
      }
      if (existingData.volumerefid && existingData.volumerefid.length > 0) {
        const volumePresent = instance.BlockDeviceMappings.find(
          (o) => o["Ebs"]["VolumeId"] == existingData.volumerefid
        );
        if (!volumePresent) {
          resync = true;
          this.recordChangesInAsset(
            existingData,
            instance,
            `Volume removed Ref Id: ${existingData.volumerefid}`,
            "Deleted"
          );
        }
      } else {
        if (instance.BlockDeviceMappings.length > 0) {
          resync = true;
          this.recordChangesInAsset(
            existingData,
            instance,
            `New volumes attached.`,
            "Modified"
          );
        }
      }

      // Checksums are not matching at times. For example after state changed to terminated
      // and even after re-sync newly created checksum are not matching.
      // so, for checking status added cloudstatus column.
      // if (
      //   commonService.validatechecksum(
      //     JSON.stringify(instance),
      //     existingData && existingData.checksum ? existingData.checksum : null
      //   ) == false
      // ) {
      //   resync = true;
      //   this.recordChangesInAsset(
      //     existingData,
      //     instance,
      //     `Instance state changed. Ref Id: ${existingData.instancerefid}`
      //   );
      // }
    } else {
      resync = true;
      this.recordChangesInAsset(
        null,
        instance,
        `New VM Created. Ref Id: ${instance.InstanceId}`,
        "New"
      );
    }

    return resync;
  }

  recordChangesInAsset(
    existing: ITnInstance,
    current: AWS.EC2.Instance,
    change: string,
    changeType: "New" | "Modified" | "Deleted"
  ) {
    const instanceId =
      current && current.InstanceId
        ? current.InstanceId
        : existing && existing.instancerefid
        ? existing.instancerefid
        : null;
    if (this.changesInAssets[instanceId]) {
      this.changesInAssets[instanceId].change.push({
        description: change,
        type: changeType,
      });
    } else {
      this.changesInAssets[instanceId] = {
        existing,
        current,
        change: [
          {
            description: change,
            type: changeType,
          },
        ],
      };
    }
  }

  sendNotification() {
    console.log("Notification to be sent for >>>>");

    let notificationObjectsList = [];

    const modifiedInstancesList = Object.keys(this.changesInAssets);

    console.log(`>>> Total modified VM\'s ${modifiedInstancesList.length}`);

    for (let index = 0; index < modifiedInstancesList.length; index++) {
      const instanceId = modifiedInstancesList[index];
      const instanceChanges = this.changesInAssets[instanceId];

      console.log(
        `>>> Total changes in instance ${instanceChanges.change.length} `
      );

      instanceChanges.change.forEach((change) => {
        const changeType = change.type;
        const recipientsMaps = this.notificationUserMaps[changeType];

        console.log(
          `>>> Total eligible candidates for notification ${recipientsMaps.length} `
        );

        let recipients = [] as IUser[];

        recipientsMaps.forEach((r) => {
          const user = this.recipientsList.find((i) => i["userid"] == r);
          recipients.push(user);
        });

        recipients.forEach((recipient) => {
          notificationObjectsList.push({
            userid: recipient.userid,
            content: change.description,
            tenantid: this.tenantid,
            eventtype: change.type,
            title:
              change.type == "New"
                ? "A New asset created"
                : change.type == "Modified"
                ? "An Asset has been modified"
                : "An asset deleted",
            deliverystatus: "SENT",
            modeofnotification: "Application",
            configuration: "",
            notes: change.description,
            status: "Active",
            createdby: "DATASYNC",
            createddt: new Date(),
            lastupdatedby: "DATASYNC",
            lastupdateddt: new Date(),
            interval: null,
          });
        });
      });
    }

    db.notification
      .bulkCreate(notificationObjectsList)
      .then((added) => {
        console.log("ADDED NOTIFICATION ADDED >>>>");
      })
      .catch((err) => {
        console.log("ERROR ADDING NOTIFICATION");
        console.log(err);
      });

    console.log("Notification object");
    console.log(notificationObjectsList);
  }
}

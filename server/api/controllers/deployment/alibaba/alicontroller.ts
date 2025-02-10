import { Request, Response } from "express";
import db from "../../../models/model";
import * as fs from "fs";
import * as _ from "lodash";
import * as shell from "shelljs";
import CommonService from "../../../services/common.service";
import { customValidation } from "../../../../common/validation/customValidation";
import { constants } from "../../../../common/constants";
import { messages } from "../../../../common/messages";
import { AppError } from "../../../../common/appError";
// import { Tail } from 'tail';

export class ALIController {
  constructor() {
    // Empty constructor
  }
  deploySolution(req: Request, res: Response): void {
    let response = {};

    let fnparam = {
      cwd: process.cwd(),
      pstdout: process.stdout.write,
      pstderr: process.stderr.write,
      request: req,
      response: res,
    } as any;

    try {
      console.log(fnparam.cwd);
      if (
        !_.isEmpty(req.body.solution.tenant) ||
        !_.isEmpty(req.body.solution.tenant.customfield)
      ) {
        let alicloud = _.find(
          JSON.parse(req.body.solution.tenant.customfield[0].fieldvalue),
          function (data: any) {
            if (data.cloudprovider === "Alibaba") {
              return data;
            }
          }
        );
        fnparam.alicloud = alicloud;

        console.log(alicloud);
        if (!_.isEmpty(alicloud)) {
          let C_FOLDER_PATH = fnparam.cwd + constants.DEPLOY_FOLDER_PATH;

          console.log(C_FOLDER_PATH);

          let deployments: any = {};

          deployments.solutionid = req.body.solutionid;
          deployments.tenantid = req.body.tenantid;
          deployments.requestid = req.body.requestid;
          deployments.zoneid = req.body.zoneid;
          deployments.clientid = req.body.clientid;
          deployments.notes = req.body.notes;
          deployments.cloudprovider = constants.CLOUD_ALIBABA;
          deployments.status = constants.STATUS_ACTIVE;
          deployments.createdby = req.body.createdby;
          deployments.createddt = req.body.createddt;
          deployments.lastupdateddt = req.body.lastupdateddt;
          deployments.lastupdatedby = req.body.lastupdatedby;
          deployments.alideployment = _.map(
            req.body.solution.alisolutions,
            function (item) {
              item.instancenumber = CommonService.generateRandomNumber(4);
              let instancename =
                "i_" +
                item.instancenumber +
                "_" +
                item.instancename +
                "_" +
                req.body.customername;
              instancename = instancename
                .substring(0, 50)
                .replace(new RegExp(" ", "g"), "-");
              item.instancename = instancename;
              item.createdby = req.body.createdby;
              item.createddt = req.body.createddt;
              item.status = constants.STATUS_DEPLOYING;
              item.lastupdateddt = req.body.lastupdateddt;
              item.lastupdatedby = req.body.lastupdatedby;
              return item;
            }
          );
          let options = {
            include: [{ model: db.alideployment, as: "alideployment" }],
          };
          CommonService.saveWithAssociation(
            deployments,
            options,
            db.deployments
          )
            .then((deploymentsdata) => {
              let TERRFORM_FILE_PATH =
                C_FOLDER_PATH + deploymentsdata.deploymentid + "/";
              fs.mkdirSync(TERRFORM_FILE_PATH, 0o777);

              let lookupparam = { where: { tenantid: -1 } };
              CommonService.getAllList(lookupparam, db.LookUp)
                .then((lookuplist) => {
                  customValidation.generateSuccessResponse(
                    deploymentsdata,
                    response,
                    constants.RESPONSE_TYPE_LIST,
                    res,
                    req
                  );
                  fnparam.alisolutionobj = req.body.solution.alisolutions;
                  fnparam.lookuplist = lookuplist;
                  fnparam.deploymentsdata = deploymentsdata;
                  fnparam.TERRFORM_FILE_PATH = TERRFORM_FILE_PATH;
                  console.log("------------");

                  let result = new ALIController().buildInputData(fnparam);

                  let deployscript: any = {};
                  deployscript.deploymentid = deploymentsdata.deploymentid;
                  deployscript.scriptcontent = result;
                  deployscript.createdby = req.body.createdby;
                  deployscript.createddt = req.body.createddt;

                  CommonService.create(deployscript, db.DeployedScripts)
                    .then((scriptdata) => {
                      console.log("DeployedScripts Saved ");
                    })
                    .catch((error: Error) => {
                      new ALIController().throwError(
                        error,
                        req,
                        res,
                        response,
                        fnparam.pstdout,
                        fnparam.pstderr,
                        fnparam.cwd
                      );
                    });
                  fs.appendFile(
                    TERRFORM_FILE_PATH + constants.TERRAFORM_IN_FILE_NAME,
                    result,
                    "utf8",
                    function (e) {
                      if (e) {
                        throw e;
                      }

                      new ALIController().exeTerraform(fnparam);
                    }
                  );
                })
                .catch((error: Error) => {
                  new ALIController().throwError(
                    error,
                    req,
                    res,
                    response,
                    fnparam.pstdout,
                    fnparam.pstderr,
                    fnparam.cwd
                  );
                });
            })
            .catch((error: Error) => {
              new ALIController().throwError(
                error,
                req,
                res,
                response,
                fnparam.pstdout,
                fnparam.pstderr,
                fnparam.cwd
              );
            });
        } else {
          customValidation.generateAppError(
            new AppError(
              "Tenant settings(Alibaba Cloud Authentication Key or Secret Key) empty"
            ),
            response,
            res,
            req
          );
        }
      } else {
        customValidation.generateAppError(
          new AppError(
            "Tenant settings(Alibaba Cloud Authentication Key or Secret Key) empty"
          ),
          response,
          res,
          req
        );
      }
    } catch (e) {
      new ALIController().throwError(
        e,
        req,
        res,
        response,
        fnparam.pstdout,
        fnparam.pstderr,
        fnparam.cwd
      );
    }
  }

  buildInputData(fnparam): any {
    let filestring = "";
    let prevsg = [];
    let prevswitch = [];
    let prevvpc = [];
    let prelb = [];
    try {
      let username = _.find(fnparam.lookuplist, function (data: any) {
        if (data.lookupkey === "OS_USERNAME") {
          return data;
        }
      });
      let password = _.find(fnparam.lookuplist, function (data: any) {
        if (data.lookupkey === "OS_PASSWORD") {
          return data;
        }
      });

      filestring = filestring + ' provider "alicloud" { \n';
      filestring =
        filestring +
        ('   access_key = "' + fnparam.alicloud.cloudauthkey + '" \n');
      filestring =
        filestring +
        ('   secret_key = "' + fnparam.alicloud.cloudseckey + '" \n');
      filestring =
        filestring +
        ('   region     = "' + fnparam.request.body.region + '" \n');
      filestring = filestring + " } \n\n";

      for (
        let num: number = 0;
        num < Number(fnparam.alisolutionobj.length);
        num++
      ) {
        // Instance
        filestring =
          filestring +
          (' resource "alicloud_instance" "r_ecs_node_' +
            fnparam.alisolutionobj[num].alisolutionid +
            '" { \n');
        filestring =
          filestring +
          ('    availability_zone = "' +
            fnparam.request.body.zonename +
            '" \n');
        filestring =
          filestring +
          ('    instance_type = "' +
            fnparam.alisolutionobj[num].aliinstancetype.aliinstancetypeid +
            '"\n');
        filestring =
          filestring +
          ('    system_disk_category = "' +
            fnparam.alisolutionobj[num].diskcategory +
            '"\n');
        filestring =
          filestring +
          ('    image_id = "' +
            fnparam.alisolutionobj[num].aliimage.aliimageid +
            '"\n');
        filestring =
          filestring +
          ('    instance_name = "' +
            fnparam.alisolutionobj[num].instancename +
            '"\n');
        filestring =
          filestring +
          ("    internet_max_bandwidth_out = " +
            fnparam.alisolutionobj[num].internetmaxbandwidthout +
            "\n");

        if (
          !customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alisecuritygroup
          ) &&
          !customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alisecuritygroup.alisecuritygroupid
          )
        ) {
          filestring =
            filestring +
            ('    security_groups = ["' +
              fnparam.alisolutionobj[num].alisecuritygroup.alisecuritygroupid +
              '"]\n');
        } else {
          filestring =
            filestring +
            ('    security_groups = ["${alicloud_security_group.securitygroup_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '.*.id}"]\n');
        }

        if (
          !customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alivswitch
          ) &&
          !customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alivswitch.alivswitchid
          )
        ) {
          filestring =
            filestring +
            ('    vswitch_id = "' +
              fnparam.alisolutionobj[num].alivswitch.alivswitchid +
              '"\n');
        } else {
          filestring =
            filestring +
            ('    vswitch_id = "${alicloud_vswitch.vswitch_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '.*.id}"\n');
        }

        filestring = filestring + " }\n\n";

        // Secuirty group
        if (
          (false ===
            prevsg.indexOf(fnparam.alisolutionobj[num].securitygroupid) > -1 &&
            customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alisecuritygroup
            )) ||
          customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alisecuritygroup.alisecuritygroupid
          )
        ) {
          filestring =
            filestring +
            ('resource "alicloud_security_group" "securitygroup_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '" {\n');
          filestring =
            filestring +
            ('    name        = "' +
              fnparam.alisolutionobj[num].alisecuritygroup.securitygroupname +
              '"\n');
          filestring =
            filestring +
            ('    description        = "' +
              fnparam.alisolutionobj[num].alisecuritygroup.description +
              '"\n');

          if (
            !customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivpc
            ) &&
            !customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivpc.alivpcid
            )
          ) {
            filestring =
              filestring +
              ('    vpc_id = "' +
                fnparam.alisolutionobj[num].alivpc.alivpcid +
                '"\n');
          } else {
            filestring =
              filestring +
              ('    vpc_id = "${alicloud_vpc.vpc_' +
                fnparam.alisolutionobj[num].alisolutionid +
                '.*.id}"\n');
          }

          filestring = filestring + " }\n\n";

          // Secuirty group rules
          if (
            !customValidation.isEmptyArray(
              fnparam.alisolutionobj[num].alisecuritygroup.alisgrules
            )
          ) {
            fnparam.alisolutionobj[num].alisecuritygroup.alisgrules.forEach(
              (element) => {
                filestring =
                  filestring +
                  ('resource "alicloud_security_group_rule"' +
                    element.sgrulename +
                    '"_' +
                    fnparam.alisolutionobj[num].alisolutionid +
                    '" {\n');
                if (
                  !customValidation.isEmptyValue(
                    fnparam.alisolutionobj[num].alisecuritygroup
                  ) &&
                  !customValidation.isEmptyValue(
                    fnparam.alisolutionobj[num].alisecuritygroup
                      .alisecuritygroupid
                  )
                ) {
                  filestring =
                    filestring +
                    ('    security_group_id = "' +
                      fnparam.alisolutionobj[num].alisecuritygroup
                        .alisecuritygroupid +
                      '"\n');
                } else {
                  filestring =
                    filestring +
                    ('    security_group_id = "${alicloud_security_group.securitygroup_' +
                      fnparam.alisolutionobj[num].alisolutionid +
                      '.*.id}"\n');
                }
                filestring =
                  filestring +
                  ('    type        = "' + element.direction + '"\n');
                filestring =
                  filestring +
                  ('    ip_protocol = "' + element.ipprotocol + '"\n');
                filestring =
                  filestring +
                  ('    nic_type    = "' + element.nictype + '"\n');
                filestring =
                  filestring + ('    policy      = "' + element.policy + '"\n');
                filestring =
                  filestring +
                  ('    port_range  = "' + element.portrange + '"\n');
                filestring =
                  filestring +
                  ('    priority    = "' + element.priority + '"\n');
                filestring = filestring + '    cidr_ip     = "0.0.0.0/0"\n';

                filestring = filestring + " }\n\n";
              }
            );
          }
        }

        // vSwitch
        if (
          (false ===
            prevswitch.indexOf(fnparam.alisolutionobj[num].vswitchid) > -1 &&
            customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivswitch
            )) ||
          customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alivswitch.alivswitchid
          )
        ) {
          filestring =
            filestring +
            ('resource "alicloud_vswitch" "vswitch_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '" {\n');

          if (
            !customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivpc
            ) &&
            !customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivpc.alivpcid
            )
          ) {
            filestring =
              filestring +
              ('    vpc_id = "' +
                fnparam.alisolutionobj[num].alivpc.alivpcid +
                '"\n');
          } else {
            filestring =
              filestring +
              ('    vpc_id = "${alicloud_vpc.vpc_' +
                fnparam.alisolutionobj[num].alisolutionid +
                '.*.id}"\n');
          }

          filestring =
            filestring +
            ('    cidr_block = "' +
              fnparam.alisolutionobj[num].alivswitch.ipv4cidr +
              '"\n');
          filestring =
            filestring +
            ('    availability_zone = "' +
              fnparam.request.body.zonename +
              '"\n');

          filestring = filestring + " }\n\n";
        }

        // VPC
        if (
          (false === prevvpc.indexOf(fnparam.alisolutionobj[num].vpcid) > -1 &&
            customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivpc
            )) ||
          customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alivpc.alivpcid
          )
        ) {
          filestring =
            filestring +
            ('resource "alicloud_vpc" "vpc_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '" {\n');
          filestring =
            filestring +
            ('    cidr_block = "' +
              fnparam.alisolutionobj[num].alivpc.ipv4cidr +
              '"\n');
          filestring = filestring + " }\n\n";
        }

        // Loadbalancer
        if (
          (false === prelb.indexOf(fnparam.alisolutionobj[num].slbid) > -1 &&
            customValidation.isEmptyValue(fnparam.alisolutionobj[num].alilb)) ||
          customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alilb.alilbid
          )
        ) {
          filestring =
            filestring +
            ('resource "alicloud_slb" "slb_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '" {\n');
          filestring =
            filestring +
            ('    name = "' + fnparam.alisolutionobj[num].alilb.lbname + '"\n');

          if (
            !customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivswitch
            ) &&
            !customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivswitch.alivswitchid
            )
          ) {
            filestring =
              filestring +
              ('    vswitch_id = "' +
                fnparam.alisolutionobj[num].alivswitch.alivswitchid +
                '"\n');
          } else {
            filestring =
              filestring +
              ('    vswitch_id = "${alicloud_vswitch.vswitch_' +
                fnparam.alisolutionobj[num].alisolutionid +
                '.*.id}"\n');
          }
          filestring = filestring + " }\n\n";

          if (
            !customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alilb.alilblistener
            )
          ) {
            filestring =
              filestring +
              ('resource "alicloud_slb_listener" "slb_listener_' +
                fnparam.alisolutionobj[num].alisolutionid +
                '" {\n');
            filestring =
              filestring +
              ('    load_balancer_id = "${alicloud_slb.slb_' +
                fnparam.alisolutionobj[num].alisolutionid +
                '.*.id}"\n');
            filestring =
              filestring +
              ('    backend_port = "' +
                fnparam.alisolutionobj[num].alilb.alilblistener.backendport +
                '"\n');
            filestring =
              filestring +
              ('    frontend_port = "' +
                fnparam.alisolutionobj[num].alilb.alilblistener.frontendport +
                '"\n');
            filestring =
              filestring +
              ('    protocol = "' +
                fnparam.alisolutionobj[num].alilb.alilblistener.protocol +
                '"\n');
            filestring =
              filestring +
              ('    bandwidth = "' +
                fnparam.alisolutionobj[num].alilb.alilblistener.bandwidth +
                '"\n');
            filestring =
              filestring +
              ('    health_check_type = "' +
                fnparam.alisolutionobj[num].alilb.alilblistener
                  .healthchecktype +
                '"\n');
            filestring =
              filestring +
              ('    acl_status = "' +
                fnparam.alisolutionobj[num].alilb.alilblistener.aclstatus +
                '"\n');
            filestring =
              filestring +
              ('    acl_type = "' +
                fnparam.alisolutionobj[num].alilb.alilblistener.acltype +
                '"\n');
            filestring =
              filestring +
              ('    acl_id = "${alicloud_slb_acl.slb_acl_' +
                fnparam.alisolutionobj[num].alisolutionid +
                '.*.id}"\n');
            filestring =
              filestring +
              ('    established_timeout = "' +
                fnparam.alisolutionobj[num].alilb.alilblistener
                  .establishedtimeout +
                '"\n');
            filestring = filestring + " }\n\n";

            filestring =
              filestring +
              ('resource "alicloud_slb_acl" "slb_acl_' +
                fnparam.alisolutionobj[num].alisolutionid +
                '" {\n');
            filestring =
              filestring +
              ('    name = "' +
                fnparam.alisolutionobj[num].alilb.alilblistener.aclname +
                '"\n');
            filestring =
              filestring +
              ('    name = "' +
                fnparam.alisolutionobj[num].alilb.alilblistener.aclipversion +
                '"\n');
            filestring = filestring + " }\n\n";
          }
        }

        filestring =
          filestring +
          ('output "instance_ids_' +
            fnparam.alisolutionobj[num].alisolutionid +
            '"  { \n');
        filestring =
          filestring +
          ('  value = "${join(",", alicloud_instance.r_ecs_node_' +
            fnparam.alisolutionobj[num].alisolutionid +
            '.*.id)}"\n');
        filestring = filestring + " }\n\n";

        filestring =
          filestring +
          ('output "instance_privateip_' +
            fnparam.alisolutionobj[num].alisolutionid +
            '"  { \n');
        filestring =
          filestring +
          ('  value = "${join(",", alicloud_instance.r_ecs_node_' +
            fnparam.alisolutionobj[num].alisolutionid +
            '.*.private_ip)}"\n');
        filestring = filestring + " }\n\n";

        filestring =
          filestring +
          ('output "instance_publicip_' +
            fnparam.alisolutionobj[num].alisolutionid +
            '"  { \n');
        filestring =
          filestring +
          ('  value = "${join(",", alicloud_instance.r_ecs_node_' +
            fnparam.alisolutionobj[num].alisolutionid +
            '.*.public_ip)}"\n');
        filestring = filestring + " }\n\n";

        if (
          (false ===
            prevswitch.indexOf(fnparam.alisolutionobj[num].vswitchid) > -1 &&
            customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivswitch
            )) ||
          customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alivswitch.alivswitchid
          )
        ) {
          filestring =
            filestring +
            ('output "vswitch_id_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '"  { \n');
          filestring =
            filestring +
            ('  value = "${join(",", alicloud_vswitch.vswitch_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '.*.id)}"\n');
          filestring = filestring + " }\n\n";
        }

        if (
          (false === prevvpc.indexOf(fnparam.alisolutionobj[num].vpcid) > -1 &&
            customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivpc
            )) ||
          customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alivpc.alivpcid
          )
        ) {
          filestring =
            filestring +
            ('output "vpc_id_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '"  { \n');
          filestring =
            filestring +
            ('  value = "${join(",", alicloud_vpc.vpc_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '.*.id)}"\n');
          filestring = filestring + " }\n\n";

          filestring =
            filestring +
            ('output "vpc_routerid_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '"  { \n');
          filestring =
            filestring +
            ('  value = "${join(",", alicloud_vpc.vpc_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '.*.router_id)}"\n');
          filestring = filestring + " }\n\n";
        }

        if (
          (false === prelb.indexOf(fnparam.alisolutionobj[num].slbid) > -1 &&
            customValidation.isEmptyValue(fnparam.alisolutionobj[num].alilb)) ||
          customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alilb.alilbid
          )
        ) {
          filestring =
            filestring +
            ('output "slb_id_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '"  { \n');
          filestring =
            filestring +
            ('  value = "${join(",", alicloud_slb.slb_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '.*.id)}"\n');
          filestring = filestring + " }\n\n";

          filestring =
            filestring +
            ('output "slb_ipaddress_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '"  { \n');
          filestring =
            filestring +
            ('  value = "${join(",", alicloud_slb.slb_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '.*.address)}"\n');
          filestring = filestring + " }\n\n";
        }

        if (
          (false ===
            prevsg.indexOf(fnparam.alisolutionobj[num].securitygroupid) > -1 &&
            customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alisecuritygroup
            )) ||
          customValidation.isEmptyValue(
            fnparam.alisolutionobj[num].alisecuritygroup.alisecuritygroupid
          )
        ) {
          filestring =
            filestring +
            ('output "sg_id_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '"  { \n');
          filestring =
            filestring +
            ('  value = "${join(",", alicloud_security_group.securitygroup_' +
              fnparam.alisolutionobj[num].alisolutionid +
              '.*.id)}"\n');
          filestring = filestring + " }\n\n";
        }
        filestring = filestring + " \n\n\n";

        prevswitch[num] = fnparam.alisolutionobj[num].vswitchid;
        prevsg[num] = fnparam.alisolutionobj[num].securitygroupid;
        prevvpc[num] = fnparam.alisolutionobj[num].vpcid;
        prelb[num] = fnparam.alisolutionobj[num].slbid;
      }
      console.log(prevswitch);
      console.log(prevsg);
      console.log(prevvpc);
      console.log(prelb);

      return filestring;
    } catch (e) {
      console.log(e);
      return filestring;
    }
  }
  exeTerraform(fnparam): void {
    let response = {};
    try {
      if (!fs.existsSync(fnparam.TERRFORM_FILE_PATH)) {
        fs.mkdirSync(fnparam.TERRFORM_FILE_PATH);
      }
      let stream = fs.createWriteStream(
        fnparam.TERRFORM_FILE_PATH +
          fnparam.deploymentsdata.deploymentid +
          ".log"
      );
      process.stdout.write = process.stderr.write = stream.write.bind(stream);
      stream.once("open", function (fd) {
        // let tail = new Tail(fnparam.TERRFORM_FILE_PATH + fnparam.deploymentsdata.deploymentid + '.log');
        // tail.watch();
        // tail.on('line', data => {
        //    (global as any).io.emit(fnparam.deploymentsdata.deploymentid, data);
        // });

        console.log(fnparam.TERRFORM_FILE_PATH);
        console.log(fnparam.cwd);
        process.chdir(fnparam.TERRFORM_FILE_PATH);

        shell.exec("terraform --version", function (err, stdout, stderr) {
          if (err) {
            process.chdir(fnparam.cwd);
            process.stdout.write = fnparam.pstdout;
            process.stderr.write = fnparam.pstderr;
          }
          console.log(stdout);
          console.log(stderr);
          shell.exec(
            "terraform init " + fnparam.TERRFORM_FILE_PATH,
            function (err2, stdout2, stderr2) {
              if (err2) {
                process.chdir(fnparam.cwd);
                process.stdout.write = fnparam.pstdout;
                process.stderr.write = fnparam.pstderr;
              }
              console.log(stdout2);
              console.log(stderr2);
              shell.exec(
                "terraform apply -input=false -auto-approve",
                function (err4, stdout4, stderr4) {
                  if (err4) {
                    process.chdir(fnparam.cwd);
                    process.stdout.write = fnparam.pstdout;
                    process.stderr.write = fnparam.pstderr;
                  }
                  console.log(stdout4);
                  console.log(stderr4);
                  // Read output
                  fs.readFile(
                    fnparam.TERRFORM_FILE_PATH +
                      constants.TERRAFORM_OUT_FILE_NAME,
                    function (err, fileData: any) {
                      if (err) {
                        process.chdir(fnparam.cwd);
                        process.stdout.write = fnparam.pstdout;
                        process.stderr.write = fnparam.pstderr;
                      }
                      if (fileData) {
                        let moduleData = _.find(
                          JSON.parse(fileData).modules,
                          function (o: any) {
                            return o;
                          }
                        );
                        console.log("--- output ---");
                        fnparam.moduleData = moduleData;
                        stream.end();
                        process.stdout.write = fnparam.pstdout;
                        process.stderr.write = fnparam.pstderr;
                        process.chdir(fnparam.cwd);
                        if (moduleData) {
                          new ALIController().buildOutputData(fnparam);
                        }
                      } else {
                        console.error("Terraform output file is empty.");
                        let aliarray = [];
                        _.map(
                          fnparam.deploymentsdata.alideployment,
                          function (item) {
                            item.dataValues.status = constants.STATUS_FAILED;
                            aliarray.push(item.dataValues);
                          }
                        );
                        fnparam.aliarray = aliarray;
                        new ALIController().saveOutput(fnparam);
                      }
                    }
                  );
                }
              );
            }
          );
        });
      });
    } catch (e) {
      process.stdout.write = fnparam.pstdout;
      process.stderr.write = fnparam.pstderr;
      process.chdir(fnparam.cwd);
      customValidation.generateAppError(
        e,
        response,
        fnparam.response,
        fnparam.request
      );
    }
  }
  buildOutputData(fnparam): void {
    console.log(fnparam.moduleData.outputs);

    if (
      null != fnparam.moduleData.outputs &&
      false === _.isEmpty(fnparam.moduleData.outputs)
    ) {
      let aliarray = [];
      for (
        let num: number = 0;
        num < Number(fnparam.deploymentsdata.alideployment.length);
        num++
      ) {
        let alideploymentObj = {} as any;
        alideploymentObj =
          fnparam.deploymentsdata.alideployment[num].dataValues;

        alideploymentObj.instanceoutput = JSON.stringify(
          fnparam.moduleData.outputs
        );
        alideploymentObj.status = constants.STATUS_DEPLOYED;
        alideploymentObj.lastupdatedby = fnparam.request.body.lastupdatedby;
        alideploymentObj.lastupdateddt = fnparam.request.body.lastupdateddt;

        aliarray.push(alideploymentObj);

        if (
          aliarray.length ===
          Number(fnparam.deploymentsdata.alideployment.length)
        ) {
          fnparam.aliarray = aliarray;
          new ALIController().saveOutput(fnparam);
        }
      }
    } else {
      console.log("Terraform output is empty");
      let aliarray = [];
      _.map(fnparam.deploymentsdata.alideployment, function (item) {
        item.dataValues.status = constants.STATUS_FAILED;
        aliarray.push(item.dataValues);
      });
      fnparam.aliarray = aliarray;
      new ALIController().saveOutput(fnparam);
    }
  }

  saveOutput(fnparam): void {
    try {
      let options = [
        "instancename",
        "publicipv4",
        "privateipv4",
        "publicdns",
        "instanceoutput",
        "status",
        "lastupdatedby",
        "lastupdateddt",
      ];
      CommonService.bulkUpdate(fnparam.aliarray, options, db.alideployment)
        .then((data) => {
          if (
            fnparam.deploymentsdata.requestid != null &&
            fnparam.deploymentsdata.requestid !== -1 &&
            fnparam.aliarray[0].status !== constants.STATUS_FAILED
          ) {
            try {
              let srvreqObj = {
                progresspercent: 100,
                lastupdatedby: fnparam.request.body.lastupdatedby,
                lastupdateddt: fnparam.request.body.lastupdateddt,
                srstatus: fnparam.aliarray[0].status,
              };
              CommonService.update(
                { srvrequestid: fnparam.deploymentsdata.requestid },
                srvreqObj,
                db.srmsr
              )
                .then((data) => {
                  console.log("Service request updated");
                  let sractions = {
                    actiontype: "Progress",
                    srstatus: constants.STATUS_DEPLOYED,
                    notes: messages.DEPLOYMENT_NOTE,
                    srvrequestid: fnparam.deploymentsdata.requestid,
                    lastupdatedby: fnparam.request.body.lastupdatedby,
                    lastupdateddt: fnparam.request.body.lastupdateddt,
                  };
                  CommonService.create(sractions, db.srmsractions)
                    .then((data) => {
                      console.log("Service Actions added");
                    })
                    .catch((error: Error) => {
                      throw error;
                    });
                })
                .catch((error: Error) => {
                  throw error;
                });
            } catch (e) {
              console.log(e);
            }
          }
          console.log("Terraform data stored in table");
        })
        .catch((error: Error) => {
          throw error;
        });
      if (
        !_.isEmpty(fnparam.moduleData) &&
        !_.isEmpty(fnparam.moduleData.outputs)
      ) {
        for (
          let num: number = 0;
          num < Number(fnparam.alisolutionobj.length);
          num++
        ) {
          // update outputs to the corresponding tables

          if (
            !customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivpc
            ) &&
            customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivpc.alivpcid
            )
          ) {
            let vpccondition = {
              vpcid: fnparam.alisolutionobj[num].alivpc.vpcid,
            };
            let alivpc = fnparam.alisolutionobj[num].alivpc;
            alivpc.awsvpcid = _.get(
              fnparam.moduleData.outputs,
              "vpc_" + fnparam.alisolutionobj[num].alisolutionid
            ).value[0];
            CommonService.update(vpccondition, alivpc, db.alivpc)
              .then((data) => {
                console.log("Alibaba VPC Updated...");
              })
              .catch((error: Error) => {
                console.log(error);
                throw error;
              });
          }

          if (
            !customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivswitch
            ) &&
            customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alivswitch.alivswitchid
            )
          ) {
            let vswitchcondition = {
              switchid: fnparam.alisolutionobj[num].alivswitch.switchid,
            };
            let alivswitch = fnparam.alisolutionobj[num].alivswitch;
            alivswitch.alivswitchid = _.get(
              fnparam.moduleData.outputs,
              "vswitch_" + fnparam.alisolutionobj[num].alisolutionid
            ).value[0];
            CommonService.update(vswitchcondition, alivswitch, db.alivswitch)
              .then((data) => {
                console.log("Alibaba vSwitch Updated...");
              })
              .catch((error: Error) => {
                console.log(error);
                throw error;
              });
          }

          if (
            !customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alisecuritygroup
            ) &&
            customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alisecuritygroup.alisecuritygroupid
            )
          ) {
            let sgcondition = {
              securitygroupid:
                fnparam.alisolutionobj[num].alisecuritygroup.securitygroupid,
            };
            let alisecuritygroup = fnparam.alisolutionobj[num].alisecuritygroup;
            alisecuritygroup.alisecuritygroupid = _.get(
              fnparam.moduleData.outputs,
              "securitygroup_" + fnparam.alisolutionobj[num].alisolutionid
            ).value[0];
            CommonService.update(
              sgcondition,
              alisecuritygroup,
              db.alisecuritygroup
            )
              .then((data) => {
                console.log("Alibaba Securitygroup Updated...");
              })
              .catch((error: Error) => {
                console.log(error);
                throw error;
              });
          }
          if (
            !customValidation.isEmptyValue(fnparam.alisolutionobj[num].alilb) &&
            customValidation.isEmptyValue(
              fnparam.alisolutionobj[num].alilb.alilbid
            )
          ) {
            let slbcondition = { lbid: fnparam.alisolutionobj[num].alilb.lbid };
            let alilb = fnparam.alisolutionobj[num].alilb;
            alilb.alilbid = _.get(
              fnparam.moduleData.outputs,
              "slb_" + fnparam.alisolutionobj[num].alisolutionid
            ).value[0];
            CommonService.update(slbcondition, alilb, db.alilb)
              .then((data) => {
                console.log("Alibaba Loadbalancer Updated...");
              })
              .catch((error: Error) => {
                console.log(error);
                throw error;
              });
          }
        }
      }
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  throwError(
    e: any,
    req: Request,
    res: Response,
    response: any,
    pstdout: any,
    pstderr: any,
    cwd: any
  ): void {
    process.stdout.write = pstdout;
    process.stderr.write = pstderr;
    process.chdir(cwd);
    console.log(e);
    customValidation.generateAppError(e, response, res, req);
  }
}
export default new ALIController();

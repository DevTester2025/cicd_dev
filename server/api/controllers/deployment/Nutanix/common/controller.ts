import commonService from "../../../../services/common.service";
import db from "../../../../models/model";
import { Request, Response } from "express";
import * as _ from "lodash";
import { customValidation } from "../../../../../common/validation/customValidation";
import { constants } from "../../../../../common/constants";
import {
  getclusterid,
  getcustomer,
  processMapping,
} from "../../../../services/nutanix.service";

const models = {
  VIRTUAL_MACHINES: db.vmwarevm,
  CLUSTERS: db.vmclusters,
  DATACENTERS: db.vmwaredc,
  VM_HOSTS: db.vmwarehosts,
};
const tables = {
  VIRTUAL_MACHINES: "tbl_tn_instances",
  CLUSTERS: "tbl_vc_cluster",
  DATACENTERS: "tbl_vc_datacenter",
  VM_HOSTS: "tbl_vc_hosts",
};
const REFERENCE = {
  VIRTUAL_MACHINES: {
    refid: "instancerefid",
    foreignkey: "instanceid",
  },
  CLUSTERS: {
    refid: "clusterrefid",
    foreignkey: "clusterid",
  },
  DATACENTERS: {
    refid: "dcrefid",
    foreignkey: "dcid",
  },
  VM_HOSTS: {
    refid: "hostrefid",
    foreignkey: "hostid",
  },
};
export class Controller {
  constructor() {}
  async bulkCreateDC(req: Request, res: Response): Promise<void> {
    const response = {} as any;

    try {
      const body = await Promise.all(
        req.body.map(async (itm: any) => {
          itm.status = constants.STATUS_ACTIVE;
          itm.createdby = "ESKO";
          itm.lastupdatedby = "ESKO";
          itm.tenantid = process.env.ON_PREM_TENANTID;
          itm.region = constants.REGIONS[0];
          itm._accountid = "67";
          itm.createddt = new Date();
          itm.lastupdateddt = new Date();
          itm.customerid = await getcustomer(
            itm.customername,
            process.env.ON_PREM_TENANTID
          );
          return itm;
        })
      );

      commonService
        .bulkCreate(body, db.vmwaredc)
        .then(() => {
          res.send({
            success: true,
            message: "Saved Successfully",
          });
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
  async bulkCreateHosts(req: Request, res: Response): Promise<void> {
    const response = {} as any;
    try {
      const body = await Promise.all(
        req.body.map(async (itm: any) => {
          itm.status = constants.STATUS_ACTIVE;
          itm.createdby = "ESKO";
          itm.lastupdatedby = "ESKO";
          itm.tenantid = process.env.ON_PREM_TENANTID;
          itm.region = constants.REGIONS[0];
          itm._accountid = "67";
          itm.createddt = new Date();
          itm.lastupdateddt = new Date();
          itm.customerid = await getcustomer(
            itm.customername,
            process.env.ON_PREM_TENANTID
          );
          return itm;
        })
      );
      commonService
        .bulkCreate(body, db.vmwarehosts)
        .then(() => {
          res.send({
            success: true,
            message: "Saved Successfully",
          });
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
  async bulkCreateClusters(req: Request, res: Response): Promise<void> {
    const response = {} as any;

    try {
      const body = await Promise.all(
        req.body.map(async (itm: any) => {
          itm.status = constants.STATUS_ACTIVE;
          itm.createdby = "ESKO";
          itm.lastupdatedby = "ESKO";
          itm.tenantid = process.env.ON_PREM_TENANTID;
          itm.region = constants.REGIONS[0];
          itm._accountid = "67";
          itm.createddt = new Date();
          itm.lastupdateddt = new Date();
          itm.customerid = await getcustomer(
            itm.customername,
            process.env.ON_PREM_TENANTID
          );
          return itm;
        })
      );
      commonService
        .bulkCreate(body, db.vmclusters)
        .then(() => {
          res.send({
            success: true,
            message: "Saved Successfully",
          });
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
  async bulkCreateVM(req: Request, res: Response): Promise<void> {
    const response = {} as any;
    try {
      let tags = [];
      const params = {
        replacements: {
          tenantid: process.env.ON_PREM_TENANTID,
        },
        type: db.sequelize.QueryTypes.SELECT,
      };
      let query = `SELECT
        tagid,tagname
      from 
        tbl_bs_tags tbt where tenantid = :tenantid and status = 'Active' and tagid in ( select t.tagid from tbl_bs_taggroup g, tbl_bs_tag_values t
      where
        t.taggroupid = g.taggroupid
        and g.groupname = 'Alert Notification Group'
        and t.tenantid = :tenantid
        and g.status = 'Active'
      order by
        t.tagorder asc)`;
      const tagslist = await commonService.executeQuery(
        query,
        params,
        db.sequelize
      );
      let hosts = [];
      const body = await Promise.all(
        req.body.map(async (itm: any) => {
          hosts.push(itm.instancename);
          itm.status = constants.STATUS_ACTIVE;
          itm.createdby = "ESKO";
          itm.lastupdatedby = "ESKO";
          itm.tenantid = process.env.ON_PREM_TENANTID;
          itm.region = constants.REGIONS[0];
          itm.accountid = "67";
          itm.cloudprovider = constants.CLOUDPROVIDERS[3];
          itm.createddt = new Date();
          itm.lastupdateddt = new Date();
          itm.customerid = await getcustomer(
            itm.customername,
            process.env.ON_PREM_TENANTID
          );
          itm.clusterid = await getclusterid(
            itm.clustername,
            process.env.ON_PREM_TENANTID,
            itm.region
          );
          itm.tags = itm.tags.map((tag: any) => {
            let actual = _.find(tagslist, { tagname: tag.tagname });
            tags.push({
              tagid: actual ? actual["tagid"] : 0,
              tagvalue: tag.tagvalue,
              resourcerefid: itm.instancerefid,
              resourceid: itm.instanceid,
              createdby: itm.createdby,
              tenantid: itm.tenantid,
              createddt: new Date(),
              lastupdatedt: new Date(),
              cloudprovider: itm.cloudprovider,
              resourcetype: "VIRTUAL_MACHINES",
            });
            return tag;
          });
          return itm;
        })
      );
      if (tags.length == 0) {
        customValidation.generateAppError(
          "Tags not found, Please provide the basic tag details",
          response,
          res,
          req
        );
      } else {
        commonService
          .bulkCreate(body, db.Instances)
          .then(() => {
            commonService
              .bulkCreate(tags, db.TagValues)
              .then((result) => {
                processMapping(
                  {
                    actual: constants.CLOUDPROVIDERS[3],
                    mapping: constants.CLOUDPROVIDERS[1],
                  },
                  hosts
                );
              })
              .catch((error: Error) => {
                console.error(error);
              });
            res.send({
              success: true,
              message: "Saved Successfully",
            });
          })
          .catch((error: Error) => {
            customValidation.generateAppError(error, response, res, req);
          });
      }
    } catch (error) {
      customValidation.generateAppError(error, response, res, req);
    }
  }
  getCluster(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        status: constants.STATUS_ACTIVE,
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;

      condition.$or = [{ clustername: param }, { clusterrefid: param }];

      commonService
        .getData({ where: condition }, db.vmclusters)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  getHost(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        status: constants.STATUS_ACTIVE,
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;

      condition.$or = [{ hostname: param }, { hostrefid: param }];

      commonService
        .getData({ where: condition }, db.vmwarehosts)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  getDc(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        status: constants.STATUS_ACTIVE,
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;

      condition.$or = [{ dcname: param }, { dcrefid: param }];

      commonService
        .getData({ where: condition }, db.vmwaredc)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  getVm(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        status: constants.STATUS_ACTIVE,
        cloudprovider: constants.CLOUDPROVIDERS[3],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;

      condition.$or = [{ instancename: param }, { instancerefid: param }];

      commonService
        .getData({ where: condition }, db.Instances)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  deleteHost(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;

      condition.$or = [{ hostname: param }, { hostrefid: param }];

      commonService
        .update(condition, { status: constants.DELETE_STATUS }, db.vmwarehosts)
        .then((data) => {
          if (null == data || data === undefined) {
            res.send({
              success: false,
              message: "Failed to delete",
            });
          } else {
            res.send({
              success: true,
              message: "Deleted successfully",
            });
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  deleteDc(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;

      condition.$or = [{ dcname: param }, { dcrefid: param }];

      commonService
        .update(condition, { status: constants.DELETE_STATUS }, db.vmwaredc)
        .then((data) => {
          if (null == data || data === undefined) {
            res.send({
              success: false,
              message: "Failed to delete",
            });
          } else {
            res.send({
              success: true,
              message: "Deleted Successfully",
            });
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  deleteCluster(req: Request, res: Response) {
    let response = {} as any;
    try {
      let condition: any = {
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;

      condition.$or = [{ clusterrefid: param }, { clustername: param }];

      commonService
        .update(condition, { status: constants.DELETE_STATUS }, db.vmclusters)
        .then((data) => {
          if (null == data || data === undefined) {
            res.send({
              success: false,
              message: "Failed to delete",
            });
          } else {
            res.send({
              success: true,
              message: "Deleted Successfully",
            });
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  deleteVm(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        cloudprovider: constants.CLOUDPROVIDERS[3],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;

      condition.$or = [{ instancerefid: param }, { instancename: param }];

      commonService
        .update(condition, { status: constants.DELETE_STATUS }, db.Instances)
        .then((data: any) => {
          if (null == data || data === undefined) {
            res.send({
              success: false,
              message: "Failed to delete",
            });
          } else {
            db.sequelize.query(
              'UPDATE tbl_bs_tag_values SET status = "Deleted" WHERE resourcerefid = :resourcerefid and status = "Active" and tenantid = :tenantid',
              {
                replacements: {
                  resourcerefid: data["dataValues"].instancerefid,
                  tenantid: data["dataValues"]["tenantid"],
                },
                type: db.sequelize.QueryTypes.UPDATE,
              }
            );

            res.send({
              success: true,
              message: "Deleted Successfully",
            });
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  getAllHosts(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        status: constants.STATUS_ACTIVE,
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };

      commonService
        .getAllList({ where: condition }, db.vmwarehosts)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getAllDc(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        status: constants.STATUS_ACTIVE,
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };

      commonService
        .getAllList({ where: condition }, db.vmwaredc)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getAllVM(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        status: constants.STATUS_ACTIVE,
        cloudprovider: constants.CLOUDPROVIDERS[3],
        tenantid: process.env.ON_PREM_TENANTID,
      };

      commonService
        .getAllList({ where: condition }, db.Instances)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
  getAllClusters(req: Request, res: Response): void {
    let response = {} as any;
    try {
      let condition: any = {
        status: constants.STATUS_ACTIVE,
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };

      commonService
        .getAllList({ where: condition }, db.vmclusters)
        .then((data) => {
          customValidation.generateSuccessResponse(
            data,
            response,
            constants.RESPONSE_TYPE_LIST,
            res,
            req
          );
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async updateCluster(req: Request, res: Response) {
    let response = {};
    try {
      const { clusterrefid, clustername, drsstate, hastate, customername } =
        req.body;
      let customerid;
      if (customername != null) {
        customerid = await getcustomer(
          customername,
          process.env.ON_PREM_TENANTID
        );
      }
      const condition: any = {
        status: constants.STATUS_ACTIVE,
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;
      condition.$or = [{ clusterrefid: param }, { clustername: param }];
      const updatedData = {
        clusterrefid,
        clustername,
        drsstate,
        hastate,
        customerid,
      };

      commonService
        .update(condition, updatedData, db.vmclusters)

        .then((data) => {
          if (null === data || data === undefined || customerid == null) {
            res.send({
              success: false,
              message: "Failed to update",
            });
          } else {
            res.send({
              success: true,
              message: "Updated successfully",
            });
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async updateDC(req: Request, res: Response) {
    let response = {};
    try {
      const { dcrefid, dcname, customername } = req.body;
      let customerid;
      if (customername != null) {
        customerid = await getcustomer(
          customername,
          process.env.ON_PREM_TENANTID
        );
      }
      const condition: any = {
        status: constants.STATUS_ACTIVE,
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;
      condition.$or = [{ dcname: param }, { dcrefid: param }];
      const updatedData = {
        dcname,
        dcrefid,
        customerid,
      };

      commonService
        .update(condition, updatedData, db.vmwaredc)

        .then((data) => {
          if (null == data || data === undefined || customerid == null) {
            res.send({
              success: false,
              message: "Failed to update",
            });
          } else {
            res.send({
              success: true,
              message: "Updated successfully",
            });
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async updateHost(req: Request, res: Response) {
    let response = {};
    try {
      const { hoststate, hostrefid, hostname, powerstate, customername } =
        req.body;
      let customerid;
      if (customername != null) {
        customerid = await getcustomer(
          customername,
          process.env.ON_PREM_TENANTID
        );
      }
      const condition: any = {
        status: constants.STATUS_ACTIVE,
        region: constants.REGIONS[0],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;
      condition.$or = [{ hostrefid: param }, { hostname: param }];
      const updatedData = {
        hoststate,
        hostrefid,
        hostname,
        powerstate,
        customerid,
      };

      commonService
        .update(condition, updatedData, db.vmwarehosts)

        .then((data) => {
          if (null == data || data === undefined || customerid == null) {
            res.send({
              success: false,
              message: "Failed to update",
            });
          } else {
            res.send({
              success: true,
              message: "Updated successfully",
            });
          }
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }

  async updateVM(req: Request, res: Response) {
    let response = {};
    try {
      const {
        instancerefid,
        instancename,
        platform,
        clustername,
        privateipV4,
        customername,
        ssmsgentid
      } = req.body;
      let clusterid;
      let customerid;

      const region = constants.REGIONS[0];
      if (clustername != null) {
        clusterid = await getclusterid(
          clustername,
          process.env.ON_PREM_TENANTID,
          region
        );
      }
      if (customername != null) {
        customerid = await getcustomer(
          customername,
          process.env.ON_PREM_TENANTID
        );
      }
      const condition: any = {
        status: constants.STATUS_ACTIVE,
        cloudprovider: constants.CLOUDPROVIDERS[3],
        tenantid: process.env.ON_PREM_TENANTID,
      };
      const param = req.params.param;
      condition.$or = [{ instancerefid: param }, { instancename: param }];
      const updatedData = {
        clusterid,
        platform,
        instancerefid,
        instancename,
        privateipV4,
        customerid,
        ssmsgentid
      };

      commonService
        .update(condition, updatedData, db.Instances)
        .then(() => {
          res.send({
            success: true,
            message: "Updated Successfully",
          });
        })
        .catch((error: Error) => {
          customValidation.generateAppError(error, response, res, req);
        });
    } catch (e) {
      customValidation.generateAppError(e, response, res, req);
    }
  }
}

export default new Controller();

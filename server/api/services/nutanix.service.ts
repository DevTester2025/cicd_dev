import { Op } from "sequelize";
import db from "../models/model";
import commonService from "./common.service";
import _ = require("lodash");

export async function getcustomer(
  customername: string,
  tenantid: string
): Promise<string | null> {
  const params = {
    replacements: {
      customername,
      tenantid,
    },
    type: db.sequelize.QueryTypes.SELECT,
  };

  const tquery = `
    SELECT customerid
    FROM tbl_tn_customers ttc
    WHERE (customername = :customername OR customercode = :customername)
    AND status = 'Active'
    AND tenantid = :tenantid
    LIMIT 1
  `;

  try {
    const customerList = await commonService.executeQuery(
      tquery,
      params,
      db.sequelize
    );
    return customerList.length > 0 ? customerList[0].customerid : null;
  } catch (error) {
    console.error("err", error);
    return null;
  }
}

export async function getclusterid(
  clustername: string,
  tenantid: string,
  region: string
) {
  const params = {
    replacements: {
      clustername,
      tenantid,
      region,
    },
    type: db.sequelize.QueryTypes.SELECT,
  };

  const tquery = `
        SELECT clusterid 
        from tbl_vc_cluster tvc
         WHERE clustername = :clustername 
         and  tenantid = :tenantid  
         and region = :region AND 
         status = 'Active' LIMIT 1;
        `;

  try {
    const clusterlist = await commonService.executeQuery(
      tquery,
      params,
      db.sequelize
    );
    return clusterlist.length > 0 ? clusterlist[0].clusterid : null;
  } catch (error) {
    console.error("err", error);
    return null;
  }
}

export async function processMapping(provider, hosts) {
  let instance = await db.Instances.findAll({
    where: {
      cloudprovider: provider.actual,
      status: "Active",
      tenantid: process.env.ON_PREM_TENANTID,
      instancename: {
        [Op.in]: hosts,
      },
    },
  });
  instance = JSON.parse(JSON.stringify(instance));
  updateInst(0);
  async function updateInst(i) {
    let curInst: any = instance[i];
    let updatedVM = [];
    if (i <= hosts.length) {
      if (curInst) {
        let senInst: any = await db.Instances.find({
          where: {
            instancename: curInst.instancename,
            cloudprovider: provider.mapping,
          },
          attributes: ["instancerefid"],
        });
        if (senInst) {
          let query = `select
          om.exprtorchid,
          om.tenantid,
          :currentinstancerefid as instancerefid,
          'Installed' as exptrstatus,
          'Active' as status,
          now() as lastupdateddt ,
          'System' as lastupdatedby,
          now() as createddt ,
          'System' as createdby
        from
          tbl_tn_exptr_orch_mapping om ,
          (
          select
            o.exprtrname
          from
            tbl_tn_exptr_mapping m,
            tbl_tn_exptr_orch_mapping o
          where
            o.cloudprovider = :mapping
            and o.exprtorchid = m.exprtorchid
            and m.tenantid = :tenantid
            and m.instancerefid = :instancerefid
            and m.status = 'Active'
            and m.exptrstatus = 'Installed')f 
        
        where  f.exprtrname = om.exprtrname and om.status = 'Active' and om.cloudprovider = :actual
        
        `;
          let exporters: any = await db.sequelize.query(query, {
            replacements: {
              tenantid: process.env.ON_PREM_TENANTID,
              instancerefid: senInst.dataValues.instancerefid,
              mapping: provider.mapping,
              actual: provider.actual,
              currentinstancerefid: curInst.instancerefid,
            },
            type: db.sequelize.QueryTypes.SELECT,
          });
          console.log(exporters);
          if (exporters.length > 0) {
            db.ExptrMapping.bulkCreate(exporters, {
              ignoreDuplicates: true,
            })
              .then((_ex) => {
                console.log(
                  `${exporters.length} Exporters found for this hostname ${curInst.instancename} and installed`
                );
              })
              .catch((e) => {
                console.log(
                  `Errored ::::: ${exporters.length} Exporters found for this hostname ${curInst.instancename} and installed`
                );
              });
            updateInst(i + 1);
          } else {
            console.log(
              "No exporters found for this hostname",
              curInst.instancename
            );
            updateInst(i + 1);
          }
        } else {
          updateInst(i + 1);
        }
      } else {
        console.log(updatedVM);
      }
    }
  }
}

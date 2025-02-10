export class Queries {
  ASSET_COST = `SELECT
    count(*) count,
    tti.region region,
    tti.instancetyperefid plantype,
    tti.cloudprovider cloudprovider,
    'ASSET_INSTANCE' resourcetype,
    'Instance' type,
    IFNULL(( 
    SELECT
       priceperunit 
    from
       tbl_bs_costvisual tbc 
    where
       tbc.resourcetype = "ASSET_INSTANCE" 
       and tbc.cloudprovider = tti.cloudprovider 
       and tbc.plantype = tti.instancetyperefid 
       and tbc.status = "Active" 
       and tbc.region = tti.region 
    ORDER BY
       tbc.version DESC LIMIT 1), 0) priceperunit 
    from
       tbl_tn_instances tti 
    where
       tenantid = :tenantid 
       and status = "Active" 
    GROUP BY
       tti.region,
       tti.instancetyperefid,
       tti.cloudprovider 
    UNION ALL
    SELECT
       count(*) count,
       tez.region region,
       tev.size plantype,
       'ECL2' cloudprovider,
       'ASSET_VOLUME' resourcetype,
       'Volume' type,
       IFNULL(( 
       SELECT
          priceperunit 
       from
          tbl_bs_costvisual tbc 
       where
          tbc.resourcetype = "ASSET_VOLUME" 
          and tbc.cloudprovider = "ECL2" 
          and tbc.plantype = tev.size 
          and tbc.status = "Active" 
          and tbc.region = tez.region 
       ORDER BY
          tbc.version DESC LIMIT 1), 0) priceperunit 
       from
          tbl_ecl2_volumes tev 
          LEFT JOIN
             tbl_ecl2_zones tez 
             ON tev.zoneid = tez.zoneid 
       where
          tev.tenantid = :tenantid 
          and tev.status = "Active" 
       GROUP BY
          tev.size,
          tez.region 
       UNION ALL
       SELECT
          COUNT(*) count,
          '' region,
          v.sizeingb plantype,
          'AWS' cloudprovider,
          'ASSET_VOLUME' resourcetype,
          'Volume' type,
          IFNULL((
          SELECT
             priceperunit 
          FROM
             tbl_bs_costvisual tbc 
          WHERE
             tbc.resourcetype = 'ASSET_VOLUME' 
             AND tbc.cloudprovider = 'AWS' 
             AND tbc.plantype = v.sizeingb 
             AND tbc.status = 'Active' 
          ORDER BY
             tbc.version DESC LIMIT 1), 0) priceperunit 
          FROM
             tbl_aws_volumes v 
          WHERE
             v.tenantid = 131 
             AND v.status = 'Active' 
          GROUP BY
             v.sizeingb 
          UNION ALL
          SELECT
             COUNT(*) count,
             z.region region,
             l.loadbalancerplan plantype,
             'ECL2' cloudprovider,
             'ASSET_LB' resourcetype,
             'Loadbalancer' type,
             IFNULL((
             SELECT
                priceperunit 
             FROM
                tbl_bs_costvisual tbc 
             WHERE
                tbc.resourcetype = 'ASSET_LB' 
                AND tbc.cloudprovider = 'ECL2' 
                AND tbc.plantype = l.loadbalancerplan 
                AND tbc.status = 'Active' 
                AND tbc.region = z.region 
             ORDER BY
                tbc.version DESC LIMIT 1), 0) priceperunit 
             FROM
                tbl_ecl2_loadbalancers l 
                LEFT JOIN
                   tbl_ecl2_zones z 
                   on z.zoneid = l.zoneid 
             WHERE
                l.tenantid = :tenantid 
                AND l.status = 'Active' 
             GROUP BY
                z.region,
                l.loadbalancerplan 
             UNION ALL
             SELECT
                COUNT(*) count,
                '' region,
                l.securitypolicy plantype,
                'AWS' cloudprovider,
                'ASSET_LB' resourcetype,
                'Loadbalancer' type,
                IFNULL((
                SELECT
                   priceperunit 
                FROM
                   tbl_bs_costvisual tbc 
                WHERE
                   tbc.resourcetype = 'ASSET_LB' 
                   AND tbc.cloudprovider = 'ECL2' 
                   AND tbc.plantype = l.securitypolicy 
                   AND tbc.status = 'Active' 
                ORDER BY
                   tbc.version DESC LIMIT 1), 0) priceperunit 
                FROM
                   tbl_aws_loadbalancer l 
                WHERE
                   l.tenantid = :tenantid 
                   AND l.status = 'Active' 
                GROUP BY
                   l.securitypolicy 
                UNION ALL
                SELECT
                   COUNT(*) count,
                   z.region region,
                   vxp.vsrxplanname plantype,
                   'ECL2' cloudprovider,
                   'ASSET_FIREWALL' resourcetype,
                   'Firewall' type,
                   IFNULL((
                   SELECT
                      priceperunit 
                   FROM
                      tbl_bs_costvisual tbc 
                   WHERE
                      tbc.resourcetype = 'ASSET_FIREWALL' 
                      AND tbc.cloudprovider = 'ECL2' 
                      AND tbc.plantype = vxp.vsrxplanname 
                      AND tbc.status = 'Active' 
                      AND tbc.region = z.region 
                   ORDER BY
                      tbc.version DESC LIMIT 1), 0) priceperunit 
                   FROM
                      tbl_ecl2_vsrx f 
                      LEFT JOIN
                         tbl_ecl2_zones z 
                         ON z.zoneid = f.zoneid 
                      LEFT JOIN
                         tbl_ecl2_vsrxplan vxp 
                         ON vxp.vsrxplanid = f.vsrxplanid 
                   WHERE
                      f.tenantid = :tenantid 
                      AND f.status = 'Active' 
                   GROUP BY
                      z.region,
                      vxp.vsrxplanname`;

  DATACOLS_DAILY = `SELECT 
   IF(i.cloudprovider='AWS',c.awsaccountid,c.ecl2tenantid) AccountID,
   i.instancerefid InstanceID,
   DATE_FORMAT(ad.utildate,'%d-%m-%Y') Timedate,
   MAX(case when ad.utilkey = 'CPU_UTIL' THEN ROUND(ad.value) ELSE 0 END) CPUUtilizationMaximum,
   MIN(case when ad.utilkey = 'CPU_UTIL' THEN ROUND(ad.value)  ELSE 0 END) CPUUtilizationMinimum,
   ROUND(AVG(case when ad.utilkey = 'CPU_UTIL' THEN ad.value  ELSE 0 END),2) CPUUtilizationAverage,
   MAX(case when ad.utilkey = 'NET_RECV' THEN ROUND(ad.value * 1000) ELSE 0 END) NetworkIn,
   MAX(case when ad.utilkey = 'NET_SEND' THEN ROUND(ad.value * 1000)  ELSE 0 END) NetworkOut,
   MAX(case when ad.utilkey = 'MEM_USEPERCENT' THEN ROUND(ad.value,2)  ELSE 0 END) RAMUtilisation,
   MAX(case when ad.utilkey = 'DISK_WRITE' THEN ROUND(ad.value / 1024)  ELSE 0 END) DiskUtilisation,
   MAX(case when ad.utilkey IN ('DISK_WRITE','DISK_READ') THEN ROUND(ad.value / 1024)  ELSE 0 END) DiskTotalGb
   FROM
   tbl_nm_asstutldtl ad
       LEFT JOIN
   tbl_tn_instances i ON ad.instanceid = i.instanceid
     LEFT JOIN 
   tbl_tn_customers c ON i.customerid = c.customerid
   where ad.utildate BETWEEN :fromdate AND :todate
   group by ad.instanceid`;

  AWS_DATACOLLECTION = `SELECT 
   c.awsaccountid accountid,
   i.instancerefid instancerefid,
   DATE_FORMAT(ad.utildate,'%d-%m-%Y') utildate,
   MAX(case when ad.utilkey = 'CPU_UTIL' THEN ROUND(ad.value) ELSE 0 END) cpumax,
   MIN(case when ad.utilkey = 'CPU_UTIL' THEN ROUND(ad.value)  ELSE 0 END) cpumin,
   ROUND(AVG(case when ad.utilkey = 'CPU_UTIL' THEN ad.value  ELSE 0 END),2) cpuavg,
   MAX(case when ad.utilkey = 'NET_RECV' THEN ROUND(ad.value * 1000) ELSE 0 END) netin,
   MAX(case when ad.utilkey = 'NET_SEND' THEN ROUND(ad.value * 1000)  ELSE 0 END) netout,
   MAX(case when ad.utilkey = 'MEM_USEPERCENT' THEN ROUND(ad.value,2)  ELSE 0 END) ramutil,
   MAX(case when ad.utilkey = 'DISK_WRITE' THEN ROUND(ad.value / 1024 )  ELSE 0 END) diskutil,
   MAX(case when ad.utilkey IN ('DISK_WRITE','DISK_READ') THEN ROUND(ad.value / 1024)  ELSE 0 END) disktotal
   FROM
   tbl_nm_asstutldtl ad
       LEFT JOIN
   tbl_tn_instances i ON ad.instanceid = i.instanceid
     LEFT JOIN 
   tbl_tn_customers c ON i.customerid = c.customerid 
   where i.customerid = :customerid AND i.cloudprovider=:cloudprovider AND ad.utildate BETWEEN :fromdate AND :todate
   group by ad.instanceid`;

  ECL2_DATACOLLECTION = `SELECT 
   c.ecl2tenantid accountid,
   i.instancerefid instancerefid,
   DATE_FORMAT(ad.utildate,'%d-%m-%Y') utildate,
   MAX(case when ad.utilkey = 'CPU_UTIL' THEN ROUND(ad.value) ELSE 0 END) cpumax,
   MIN(case when ad.utilkey = 'CPU_UTIL' THEN ROUND(ad.value)  ELSE 0 END) cpumin,
   ROUND(AVG(case when ad.utilkey = 'CPU_UTIL' THEN ad.value  ELSE 0 END),2) cpuavg,
   MAX(case when ad.utilkey = 'NET_RECV' THEN ROUND(ad.value * 1000) ELSE 0 END) netin,
   MAX(case when ad.utilkey = 'NET_SEND' THEN ROUND(ad.value * 1000)  ELSE 0 END) netout,
   MAX(case when ad.utilkey = 'MEM_USEPERCENT' THEN ROUND(ad.value,2)  ELSE 0 END) ramutil,
   MAX(case when ad.utilkey = 'DISK_WRITE' THEN ROUND(ad.value / 1024 )  ELSE 0 END) diskutil,
   MAX(case when ad.utilkey IN ('DISK_WRITE','DISK_READ') THEN ROUND(ad.value / 1024)  ELSE 0 END) disktotal
   FROM
   tbl_nm_asstutldtl ad
       LEFT JOIN
   tbl_tn_instances i ON ad.instanceid = i.instanceid
     LEFT JOIN 
   tbl_tn_customers c ON i.customerid = c.customerid 
   where i.customerid = :customerid AND i.cloudprovider=:cloudprovider AND ad.utildate BETWEEN :fromdate AND :todate
   group by ad.instanceid`;
  ASSET_BILLING = `update tbl_asst_billing b set b.customerid = (select customerid from tbl_tn_instances a where a.instancerefid = b.instancerefid and a.status='Active' group by instancerefid)`;
  DELETE_EXISTING_BILLING = `update tbl_asst_billing set status="Deleted" where month(billingdt)=:month and year(billingdt)=:year;`;
  CUSTOMER_ID_UPDATION = `UPDATE tbl_asst_billing a set a.customerid = (SELECT t.customerid FROM tbl_tn_regions t where t.tenantrefid =a.customername ORDER BY lastsyncdt DESC LIMIT 1) where a.status = 'Active'`;
  MONTHLY_ASSTBILLING = `SELECT 
   ROUND(SUM(ab.billamount),2) actualamount,
   DATE_FORMAT(ab.billingdt, '%b-%Y') monthname
   FROM
   tbl_asst_billing ab
   :instancesubquery:
   :tagsubquery:
   WHERE
   ab.status = 'Active'
   AND ab.billingdt BETWEEN :startdt AND :enddt`;
  MONTHLY_ASSTBILLING_DETAIL = `SELECT 
   ROUND(SUM(ab.billamount)) actualamount,
   CASE
   WHEN ab.resourcetype='VIRTUAL_SERVER' THEN 'Virtual Server'
   WHEN ab.resourcetype='ASSET_VOLUME' THEN 'Storage'
   WHEN ab.resourcetype='ASSET_NETWORK' THEN 'Logical Network'
   WHEN ab.resourcetype='ASSET_DISCOUNT' THEN 'Discount'
   ELSE 'Others'
   END as assettype
   FROM
   tbl_asst_billing ab
   :instancesubquery:
   :tagsubquery:
   WHERE
   ab.status = 'Active'
   AND ab.resourcetype NOT IN ('ASSET_INSTANCE','TOTAL_BILLING_COST')
   AND ab.billingdt BETWEEN :startdt AND :enddt`;
  MONTHLY_AWS_ASSTBILLING_DETAIL = `SELECT 
   ROUND(SUM(ab.billamount),2) actualamount,
   CASE
   WHEN ab.resourcetype='Amazon Elastic Compute Cloud - Compute' THEN 'Amazon Elastic Compute Cloud - Compute'
   WHEN ab.resourcetype='EC2 - Other' THEN 'EC2 - Other'
   WHEN ab.resourcetype='Amazon Relational Database Service' THEN 'Amazon Relational Database Service'
   WHEN ab.resourcetype='Tax' THEN 'Tax'
   WHEN ab.resourcetype='Amazon WorkSpaces' THEN 'Amazon WorkSpaces'
   WHEN ab.resourcetype='Savings Plans for AWS Compute usage' THEN 'Savings Plans for AWS Compute usage'
   WHEN ab.resourcetype='Amazon Elastic Load Balancing' THEN 'Amazon Elastic Load Balancing'
   WHEN ab.resourcetype='Amazon Elasticsearch Service' THEN 'Amazon Elasticsearch Service'
   WHEN ab.resourcetype='Amazon Simple Storage Service' THEN 'Amazon Simple Storage Service'
   WHEN ab.resourcetype='Amazon Elastic File System' THEN 'Amazon Elastic File System'
   WHEN ab.resourcetype='Amazon Virtual Private Cloud' THEN 'Amazon Virtual Private Cloud'
   WHEN ab.resourcetype='AWS Database Migration Service' THEN 'AWS Database Migration Service'
   WHEN ab.resourcetype='Amazon EC2 Container Registry (ECR)' THEN 'Amazon EC2 Container Registry (ECR)'
   WHEN ab.resourcetype='Netgate pfSense Firewall/VPN/Router' THEN 'Netgate pfSense Firewall/VPN/Router'
   WHEN ab.resourcetype='Amazon Simple Queue Service' THEN 'Amazon Simple Queue Service'
   WHEN ab.resourcetype='AWS Key Management Service' THEN 'AWS Key Management Service'
   WHEN ab.resourcetype='Amazon Elastic Container Service for Kubernetes' THEN 'Amazon Elastic Container Service for Kubernetes'
   WHEN ab.resourcetype='Amazon Simple Email Service' THEN 'Amazon Simple Email Service'
   WHEN ab.resourcetype='Amazon Simple Notification Service' THEN 'Amazon Simple Notification Service'
   WHEN ab.resourcetype='AmazonCloudWatch' THEN 'AmazonCloudWatch'
   WHEN ab.resourcetype='Amazon GuardDuty' THEN 'Amazon GuardDuty'
   WHEN ab.resourcetype='Amazon Glacier' THEN 'Amazon Glacier'
   WHEN ab.resourcetype='Amazon DynamoDB' THEN 'Amazon DynamoDB'
   WHEN ab.resourcetype='AWS Secrets Manager' THEN 'AWS Secrets Manager'
   WHEN ab.resourcetype='AWS Lambda' THEN 'AWS Lambda'
   WHEN ab.resourcetype='AWS Glue' THEN 'AWS Glue'
   WHEN ab.resourcetype='AWS Cost Explorer' THEN 'AWS Cost Explorer'
   WHEN ab.resourcetype='AWS Config' THEN 'AWS Config'
   WHEN ab.resourcetype='AWS CloudTrail' THEN 'AWS CloudTrail'
   WHEN ab.resourcetype='Amazon Inspector' THEN 'Amazon Inspector'
   WHEN ab.resourcetype='CloudWatch Events' THEN 'CloudWatch Events'
   WHEN ab.resourcetype='AWS Step Functions' THEN 'AWS Step Functions'
   WHEN ab.resourcetype='AWS Application Migration Service' THEN 'AWS Application Migration Service'
   ELSE ab.resourcetype
   END as assettype
   FROM
   tbl_asst_billing ab
   :instancesubquery:
   :tagsubquery:
   WHERE
   ab.status = 'Active'
   AND ab.cloud_resourceid IS NULL
   AND ab.billingdt BETWEEN :startdt AND :enddt`;
  MONTHLY_ASSETBILLING_DIFF = `select
	(total - billingamt) as 'Others'
from
	(
	select
		round(sum(ab.billamount)) billingamt
	from
		tbl_asst_billing ab
	where
		ab.status = 'Active'
		and ab.resourcetype not in ('ASSET_INSTANCE', 'TOTAL_BILLING_COST')
		and ab.billingdt between :startdt and :enddt
		and ab.cloudprovider = :cloudprovider) as billing ,
	(
	select
		round(sum(ab.billamount)) total
	from
		tbl_asst_billing ab
	where
		ab.status = 'Active'
		and ab.resourcetype in ('TOTAL_BILLING_COST')
		and ab.billingdt between :startdt and :enddt
		and ab.cloudprovider = :cloudprovider) as total`;
  ASSET_COST_CHART = `SELECT
   ROUND(SUM(ab.billamount)) actualamount,
   CASE
   WHEN ab.resourcetype='VIRTUAL_SERVER' THEN 'Virtual Server'
   WHEN ab.resourcetype='ASSET_VOLUME' THEN 'Storage'
   WHEN ab.resourcetype='ASSET_NETWORK' THEN 'Network'
   WHEN ab.resourcetype='ASSET_DISCOUNT' THEN 'Discount'
   WHEN ab.resourcetype='Amazon Elastic Compute Cloud - Compute' THEN 'Virtual Server'
   WHEN ab.resourcetype='AWS Storage Gateway' THEN 'Storage'
   WHEN ab.resourcetype='Amazon Virtual Private Cloud' THEN 'VPC'
   ELSE 'Others'
   END as assettype,
   ab.currency
   FROM
   tbl_asst_billing ab
   WHERE
   ab.status = 'Active' AND ab.cloudprovider = :cloudprovider AND ab.billingdt BETWEEN :startdt AND :enddt
   GROUP BY assettype`;

  UPDATE_BILLING_REFID = `Update tbl_asst_billing tab  set tab.instancerefid  = replace(tab.instancerefid ,'"','');`;
  ASSET_BILLING_UPDATE_CONTACT = `update tbl_asst_dailybilling b set b.customerid = (select customerid from tbl_tn_instances a where a.instancerefid = b.instancerefid and a.status='Active' group by instancerefid)`;
  UPDATE_DAILYBILLING_REFID = `Update tbl_asst_dailybilling tab  set tab.instancerefid  = replace(tab.instancerefid ,'"','');`;
  BUDGETVSBILL = `select
  b.budgetid,b.budgetamount ,
  sum(bi.billamount) billedamount
from
  tbl_asst_budget b
left join tbl_asst_billing bi on
  (bi.customerid = b.customerid
     AND bi.currency = b.currency 
     AND bi.resourceid = b.resourceid 
     AND bi.cloudprovider = b.cloudprovider)
where
  bi.billingdt >= b.startdt and bi.billingdt <= b.enddt
  and bi.cloud_resourceid is NULL group by b.budgetid;`;

  AWS_DELETE_DATA = {
    ASSET_IMAGE: `UPDATE tbl_aws_ami a set a.status=:status where a.tnregionid=:tnregionid AND a.status='Active';`,
    ASSET_VPC: `UPDATE tbl_aws_vpc a set a.status=:status where a.tnregionid=:tnregionid AND a.status='Active';`,
    ASSET_SUBNET: `UPDATE tbl_aws_subnet a set a.status=:status where a.tnregionid=:tnregionid AND a.status='Active';`,
    ASSET_SECURITYGROUP: `UPDATE tbl_aws_securitygroup a left join tbl_aws_sgrules r on r.securitygroupid = a.securitygroupid set a.status=:status, r.status=:status  where a.tnregionid=:tnregionid and a.status='Active' and a.tenantid=:tenantid;`,
    ASSET_VOLUME: `UPDATE tbl_aws_volumes a set a.status=:status where a.tnregionid=:tnregionid AND a.status='Active';`,
    ASSET_VOLUME_ATMT: `UPDATE tbl_aws_volumeattachments a set a.status=:status where a.tnregionid=:tnregionid AND a.status='Active';`,
    ASSET_LB: `UPDATE tbl_aws_loadbalancer a set a.status=:status where a.tnregionid=:tnregionid AND a.status='Active';`,
    ASSET_OTHERS: `UPDATE tbl_tn_cloudassets a set a.status=:status where a.tnregionid=:tnregionid AND a.tenantid=:tenantid AND a.status='Active';`,
    ASSET_IG: `UPDATE tbl_aws_internetgateways a set a.status=:status where a.tenantid=:tenantid AND a.status='Active';`,
    ASSET_INSTANCE: `UPDATE tbl_tn_instances a set a.status=:status where a.cloudprovider=:cloudprovider AND a.tnregionid=:tnregionid AND a.status='Active';`,
    ASSET_KEYS: `UPDATE tbl_aws_keys a set a.status=:status where a.tnregionid=:tnregionid AND a.status='Active';`,
    ASSET_MAPPING: `UPDATE tbl_tn_assetmappings a set a.status=:status where a.tnregionid=:tnregionid AND a.status='Active';`,
    ASSET_TAGS: `UPDATE tbl_bs_tag_values a set a.status=:status where a.cloudprovider=:cloudprovider AND a.tenantid=:tenantid AND a.tnregionid=:tnregionid AND a.status='Active';`,
  };
  VM_DELETE_DATA = {
    ASSET_VM: `update tbl_tn_instances set status = :status where accountid=:_accountid and customerid = :customerid and tenantid = :tenantid and cloudprovider=:cloudprovider;`,
    ASSET_CLUSTER: ` update tbl_vc_cluster  set status = :status where _accountid=:_accountid and customerid = :customerid and tenantid = :tenantid;`,
    ASSET_DC: ` update tbl_vc_datacenter  set status = :status where _accountid=:_accountid and customerid = :customerid and tenantid = :tenantid;`,
    ASSET_HOST: ` update tbl_vc_hosts set status = :status where _accountid=:_accountid and customerid = :customerid and tenantid = :tenantid;`,
    ASSET_MAPPING: ` update tbl_tn_assetmappings  set status = :status where tnregionid =:_accountid and customerid = :customerid and tenantid = :tenantid and cloudprovider = :cloudprovider`,
  };

  // Dashboard

  OPS_COUNT = `SELECT 
  COUNT(id) value, 'system_alert' AS label, severity
FROM
  tbl_bs_eventlog
WHERE
  module = 'Alert Config'
      AND referencetype = 'System'
      AND status = 'Active'
      AND tenantid = :tenantid
      AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery GROUP BY 3
UNION ALL SELECT 
  COUNT(id) value, 'security_alert' AS label, severity
FROM
  tbl_bs_eventlog
WHERE
  module = 'Alert Config'
      AND referencetype = 'Security'
      AND tenantid = :tenantid
      AND status = 'Active'
      AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery GROUP BY 3
UNION ALL SELECT
  COUNT(id) value, 'events' AS label, severity
FROM
  tbl_bs_eventlog
WHERE
  module != 'Alert Config'
      AND tenantid = :tenantid
      AND status = 'Active'
      AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery GROUP BY 3 
UNION ALL SELECT 
  COUNT(id) value, 'tickets' AS label, severity
FROM
  tbl_tn_incidents
WHERE
  tenantid = :tenantid AND status = 'Active'
      AND incidentdate BETWEEN :startdate AND :enddate :tcustomerquery GROUP BY 3
UNION ALL SELECT
COUNT(id) value, 'ssl_alert' AS label, severity
FROM
 tbl_bs_eventlog
 WHERE
 module = 'Alert Config'
   AND referencetype = 'SSL'
   AND status = 'Active'
   AND tenantid = :tenantid
   AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery GROUP BY 3
UNION ALL SELECT
COUNT(id) value, 'synthetics_alert' AS label, severity
FROM
  tbl_bs_eventlog
WHERE
  module = 'Alert Config'
      AND referencetype = 'Synthetics'
      AND status = 'Active'
      AND tenantid = :tenantid
      AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery GROUP BY 3`;

  DATE_OPS_DATA = [
    `SELECT 
  id,
  providerrefid,
  cloudprovider,
  'System Alert' AS label,
  DATE_FORMAT(eventdate, '%d-%b-%Y %H:%i') date,
  notes particulars,
  severity
FROM
  tbl_bs_eventlog
WHERE
  module = 'Alert Config'
      AND referencetype = 'System'
      AND status = 'Active'
      AND tenantid = :tenantid
      AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery :severityquery `,
    `SELECT
   id,
   providerrefid,
   cloudprovider,
  'Security Alert' AS label,
   DATE_FORMAT(eventdate, '%d-%b-%Y %H:%i') date,
  notes particulars,
  severity
FROM
  tbl_bs_eventlog
WHERE
  module = 'Alert Config'
      AND referencetype = 'Security'
      AND tenantid = :tenantid 
      AND status = 'Active'
      AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery :severityquery `,
    `SELECT
  id,
  refid providerrefid,
  reftype cloudprovider,
  'Tickets' AS label,
  DATE_FORMAT(incidentdate, '%d-%b-%Y %H:%i') date,
  title particulars,
  severity
FROM
  tbl_tn_incidents
WHERE
  tenantid = :tenantid 
  AND status = 'Active'
AND incidentdate BETWEEN :startdate AND :enddate :tcustomerquery :severityquery ;`,
    `SELECT
        id,
        providerrefid,
        cloudprovider,
        'Events' AS label,
         DATE_FORMAT(eventdate, '%d-%b-%Y %H:%i') date,
        notes particulars,
        severity
      FROM
        tbl_bs_eventlog
      WHERE
        module != 'Alert Config'
            AND tenantid = :tenantid 
            AND status = 'Active'
            AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery :severityquery `,
    `SELECT 
  id,
  providerrefid,
  cloudprovider,
  'SSL Alert' AS label,
  DATE_FORMAT(eventdate, '%d-%b-%Y %H:%i') date,
  notes particulars,
  severity
FROM
  tbl_bs_eventlog
WHERE
  module = 'Alert Config'
      AND referencetype = 'SSL'
      AND status = 'Active'
      AND tenantid = :tenantid
      AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery :severityquery `,
    `SELECT 
      id,
      providerrefid,
      cloudprovider,
      'Synthetics Alert' AS label,
      DATE_FORMAT(eventdate, '%d-%b-%Y %H:%i') date,
      notes particulars,
      severity
    FROM
      tbl_bs_eventlog
    WHERE
      module = 'Alert Config'
          AND referencetype = 'Synthetics'
          AND status = 'Active'
          AND tenantid = :tenantid
          AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery :severityquery `,
  ];
  //   DATEWISE_OPS_DATA = `SELECT
  //   id,
  //   providerrefid,
  //   cloudprovider,
  //   'System Alert' AS label,
  //   DATE_FORMAT(eventdate, '%d-%b-%Y %H:%i') date,
  //   notes particulars,
  //   severity
  // FROM
  //   tbl_bs_eventlog
  // WHERE
  //   module = 'Alert Config'
  //       AND referencetype = 'System'
  //       AND status = 'Active'
  //       AND tenantid = :tenantid
  //       AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery
  // UNION ALL SELECT
  //    id,
  //    providerrefid,
  //    cloudprovider,
  //   'Security Alert' AS label,
  //    DATE_FORMAT(eventdate, '%d-%b-%Y %H:%i') date,
  //   notes particulars,
  //   severity
  // FROM
  //   tbl_bs_eventlog
  // WHERE
  //   module = 'Alert Config'
  //       AND referencetype = 'Security'
  //       AND tenantid = :tenantid
  //       AND status = 'Active'
  //       AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery
  // UNION ALL SELECT
  //   id,
  //   providerrefid,
  //   cloudprovider,
  //   'Events' AS label,
  //    DATE_FORMAT(eventdate, '%d-%b-%Y %H:%i') date,
  //   notes particulars,
  //   severity
  // FROM
  //   tbl_bs_eventlog
  // WHERE
  //   module != 'Alert Config'
  //       AND tenantid = :tenantid
  //       AND status = 'Active'
  //       AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery
  // UNION ALL SELECT
  //   id,
  //   refid providerrefid,
  //   reftype cloudprovider,
  //   'Tickets' AS label,
  //   DATE_FORMAT(incidentdate, '%d-%b-%Y %H:%i') date,
  //   title particulars,
  //   severity
  // FROM
  //   tbl_tn_incidents
  // WHERE
  //   tenantid = :tenantid
  //       AND incidentdate BETWEEN :startdate AND :enddate :tcustomerquery;`;
  DATEWISE_OPS_COUNT = `SELECT 
COUNT(id) value,
'system_alert' AS label,
DATE_FORMAT(eventdate, '%Y-%b-%d') date
FROM
tbl_bs_eventlog
WHERE
module = 'Alert Config'
    AND referencetype = 'System'
    AND status = 'Active'
    AND tenantid = :tenantid
    AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery
GROUP BY 3 
UNION ALL SELECT 
COUNT(id) value,
'security_alert' AS label,
DATE_FORMAT(eventdate, '%Y-%b-%d') date
FROM
tbl_bs_eventlog
WHERE
module = 'Alert Config'
    AND referencetype = 'Security'
    AND tenantid = :tenantid
    AND status = 'Active'
    AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery
GROUP BY 3 
UNION ALL SELECT 
COUNT(id) value,
'ssl_alert' AS label,
DATE_FORMAT(eventdate, '%Y-%b-%d') date
FROM
tbl_bs_eventlog
WHERE
module = 'Alert Config'
    AND referencetype = 'SSL'
    AND tenantid = :tenantid
    AND status = 'Active'
    AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery
GROUP BY 3
UNION ALL SELECT 
COUNT(id) value,
'synthetics_alert' AS label,
DATE_FORMAT(eventdate, '%Y-%b-%d') date
FROM
tbl_bs_eventlog
WHERE
module = 'Alert Config'
    AND referencetype = 'Synthetics'
    AND tenantid = :tenantid
    AND status = 'Active'
    AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery
GROUP BY 3 
UNION ALL SELECT 
COUNT(id) value,
'events' AS label,
DATE_FORMAT(eventdate, '%Y-%b-%d') date
FROM
tbl_bs_eventlog
WHERE
module != 'Alert Config'
    AND tenantid = :tenantid
    AND status = 'Active'
    AND eventdate BETWEEN :startdate AND :enddate :subquery :ecustomerquery
GROUP BY 3 
UNION ALL SELECT 
COUNT(id) value,
'tickets' AS label,
DATE_FORMAT(incidentdate, '%Y-%b-%d') date
FROM
tbl_tn_incidents
WHERE
tenantid = :tenantid
    AND incidentdate BETWEEN :startdate AND :enddate :tcustomerquery
GROUP BY 3;`;

  KPI_TICKET = `SELECT
:durationquery,
COUNT(*) AS y,
ttc.customerid,
ttc.customername ,
i.severity,
i.category,
i.incidentstatus,
i.publishyn
FROM
tbl_tn_incidents i
left join tbl_tn_customers ttc on
ttc.customerid = i.customerid
WHERE
incidentdate BETWEEN :startdate AND :enddate :subquery`;

  KPI_MONITORING = `SELECT
:durationquery,
COUNT(*) AS y,
ttc.customername,
i.referencetype,
i.severity,
tba.level,
tba.metric
FROM
tbl_bs_eventlog i
left join tbl_tn_customers ttc on
ttc.customerid = i._customer
left join tbl_bs_alertconfigs tba on
tba.id = i.referenceid
WHERE
eventdate BETWEEN :startdate AND :enddate AND i.module = 'Alert Config' :subquery`;

  KPI_ASSETS = `SELECT
  :durationquery,
  COUNT(*) AS y
  :attributes
  FROM
  tbl_tn_instances i
  left join tbl_tn_customers ttc on
  ttc.customerid = i.customerid
  WHERE
  i.createddt BETWEEN :startdate AND :enddate AND i.tenantid=:tenantid AND i.status=:status :subquery`;

  KPI_CMDB = `SELECT
  {durationquery},
  COUNT(*) AS y,
  tad.crn
FROM
  tbl_assets_dtl tad
WHERE
tad.status = 'Active'
AND tad.tenantid = {tenantid}
AND tad.createddt BETWEEN '{startdt}' AND '{enddt}'`;

  CMDB_FIELD_QUERY = [
    // {
    //    fieldtype: "AUTOGEN",
    //    query: `CAST(SUBSTRING_INDEX(tad.fieldvalue, '-', -1) AS INT)`,
    // },
    {
      fieldtype: "DateTime",
      query: `STR_TO_DATE(tad.fieldvalue ,"%d-%c-%Y %H:%i:%s")`,
    },
    {
      fieldtype: "Date",
      query: `STR_TO_DATE(tad.fieldvalue ,"%d/%b/%Y")`,
    },
    {
      fieldtype: "Float",
      query: `(CONVERT(tad.fieldvalue, FLOAT))`,
    },
    {
      fieldtype: "Integer",
      query: `(CONVERT(tad.fieldvalue, INT))`,
    },
    {
      fieldtype: "Text",
      query: `tad.fieldvalue`,
    },
  ];

  TIMELINE_Q = `SELECT
x,
label1,
label2,
y0,
y1
FROM
(
select
   tad.id,
   tad.resourceid AS resourceid,
   MAX(case when tad.fieldkey = "crn:ops:tetrapack/fk:task_a_name" then tad.fieldvalue end) as 'label1',
   MAX(case when tad.fieldkey = "crn:ops:tetrapack/fk:task_b_name" then tad.fieldvalue end) as 'label2',
   {fields}
from
   tbl_assets_dtl tad
where
   tad.status = 'Active'
   and 
   tenantid = {tenantid}
   AND tad.crn IN ('{crn}')
   AND tad.createddt BETWEEN '{startdt}' AND '{enddt}'
GROUP by
   tad.resourceid)a
WHERE
a.x is not NULL {condition}
GROUP BY
a.label1,a.label2,y0,y1
ORDER BY
a.id ASC  
`;

  KPI_CUSTOMER = `SELECT
:durationquery,
COUNT(*) AS y,
tta.cloudprovider,
tta.rolename,
tta.accountref,
tta.customerid,
CONCAT(ttc.customername, ' - ',tta.cloudprovider) as customername
FROM
tbl_tn_customers ttc
left join tbl_tn_accounts tta on
tta.customerid = ttc.customerid AND tta.status = 'Active'
WHERE
ttc.tenantid = :tenantid AND ttc.status = 'Active' AND
ttc.createddt BETWEEN :startdate AND :enddate :subquery`;

  KPI_DATAMANAGEMENT = `SELECT
:durationquery,
COUNT(*) AS y,
fieldtype,
resourcetype,
showbydefault,
identifier,
readonly 
FROM
tbl_assets_hdr
WHERE
tenantid = :tenantid AND status = 'Active' AND
createddt BETWEEN :startdate AND :enddate :subquery`;

  KPI_USERS = `SELECT
:durationquery,
COUNT(*) AS y,
tbr.rolename,
tbu.department 
FROM
tbl_bs_user tbu
left join tbl_bs_role tbr on
	tbr.roleid = tbu.roleid
WHERE
tbu.tenantid = :tenantid AND tbu.status = 'Active' AND
tbu.createddt BETWEEN :startdate AND :enddate :subquery`;

  KPI_SLA = `SELECT
:durationquery,
COUNT(*) AS y,
ttc.customername 
FROM
tbl_tn_slatemplates tts
left join tbl_tn_customers ttc on
ttc.slatemplateid = tts.id
WHERE
tts.tenantid = :tenantid AND tts.status = 'Active' AND
tts.createddt BETWEEN :startdate AND :enddate :subquery`;

  KPI_TAGS = `SELECT
:durationquery,
COUNT(*) AS y,
tbtv.resourcetype AS resource,
tbtv.cloudprovider ,
tbt.tagtype
FROM
tbl_bs_tags tbt
LEFT JOIN tbl_bs_tag_values tbtv on
tbtv.tagid = tbt.tagid
WHERE
tbt.tenantid = :tenantid AND tbt.status = 'Active' AND tbtv.cloudprovider IS NOT NULL AND
tbt.createddt BETWEEN :startdate AND :enddate :subquery`;

KPI_SSL = `SELECT
:durationquery,
COUNT(*) AS y,
tms.url AS urls,
tms2.name AS name,
tms.validity_end
FROM
tbl_monitoring_ssldtl tms
LEFT JOIN tbl_monitoring_sslhdr tms2 on
tms.sslhdrid = tms2.id
WHERE
tms.sslhdrid = tms2.id AND tms.tenantid = :tenantid AND tms.status = 'Active' AND
tms.validity_end BETWEEN :startdate AND :enddate :subquery`;
}
export const queries = new Queries();

// MAX(case when tad.fieldkey = "crn:esko:tetrapack/fk:project_name" then tad.fieldvalue end) as 'x',
// MAX(case when tad.fieldkey = "crn:esko:tetrapack/fk:task_a_completed_on" then STR_TO_DATE(tad.fieldvalue , "%d-%c-%Y %H:%i:%s") end) as 'y0',
// MAX(case when tad.fieldkey = "crn:esko:tetrapack/fk:task_b_started_on" then STR_TO_DATE(tad.fieldvalue , "%d-%c-%Y %H:%i:%s") end) as 'y1'

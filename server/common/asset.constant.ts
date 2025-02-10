export class AssetConstants {
  COLUMNS = {
    ASSET_INSTANCE: [
      {
        field: "instancename",
        header: "Instance Name",
      },
      {
        field: "zone",
        header: "Zone",
      },
      {
        field: "instancetyperefid",
        header: "Instance Type",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
      {
        field: "costs",
        header: "Cost (Monthly)",
      },
      {
        field: "instancerefid",
        header: "Instance Id",
      },
      {
        field: "customer",
        header: "Customer",
      },
      {
        field: "privateipv4",
        header: "Private IP",
      },
      {
        field: "publicipv4",
        header: "Public IP",
      },
      {
        field: "publicdns",
        header: "Public DNS",
      },
      {
        field: "imagerefid",
        header: "Image ID",
      },
      {
        field: "platform",
        header: "Platform",
      },
      {
        field: "vcpu",
        header: "CPU",
      },
      {
        field: "memory",
        header: "Memory",
      },
      {
        field: "securitygrouprefid",
        header: "Security Group Id",
      },
      {
        field: "subnetrefid",
        header: "Subnet Id",
      },
      {
        field: "volumerefid",
        header: "Volume Id",
      },
      {
        field: "networkrefid",
        header: "VPC Id",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "vmstatus",
        header: "Status",
      },
      {
        field: "cloudstatus",
        header: "Cloud Status",
      },
    ],
    ASSET_VPC: [
      {
        field: "vpcname",
        header: "VPC Name",
      },
      {
        field: "awsvpcid",
        header: "VPC Id",
      },
      {
        field: "ipv4cidr",
        header: "IPV4 CIDR",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
    ],
    ASSET_SUBNET: [
      {
        field: "subnetname",
        header: "Subnet Name",
      },
      {
        field: "awssubnetd",
        header: "Subnet Id",
      },
      {
        field: "ipv4cidr",
        header: "IPV4 CIDR",
      },
      {
        field: "awsvpcid",
        header: "VPC Id",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
    ],
    ASSET_SECURITYGROUP: [
      {
        field: "securitygroupname",
        header: "Security Group",
      },
      {
        field: "awssecuritygroupid",
        header: "Security Group Id",
      },
      {
        field: "awsvpcid",
        header: "VPC ID",
      },
      {
        field: "notes",
        header: "Notes",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
    ],
    ASSET_LB: [
      {
        field: "lbname",
        header: "LB Name",
      },
      {
        field: "securitypolicy",
        header: "Security Policy",
      },
      {
        field: "hcinterval",
        header: "Interval",
      },
      {
        field: "hctimeout",
        header: "Timeout",
      },
      {
        field: "hcport",
        header: "Port",
      },
      {
        field: "hchealthythreshold",
        header: "Healthy Threshold",
      },
      {
        field: "hcunhealthythreshold",
        header: "Unhealthy Threshold",
      },
      {
        field: "certificatearn",
        header: "Certificate ACM",
      },
      {
        field: "awssubnetd",
        header: "Subnet Id",
      },
      {
        field: "awssecuritygroupid",
        header: "Security Group Id",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
    ],
    ASSET_IG: [
      {
        field: "gatewayname",
        header: "Gateway Name",
      },
      {
        field: "awsinternetgatewayid",
        header: "AWS Gateway Id",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
    ],
    ASSET_S3: [
      {
        field: "assetname",
        header: "Asset Name",
      },
      {
        field: "region",
        header: "Region",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
    ],
    ASSET_RDS: [
      {
        field: "assetname",
        header: "Asset Name",
      },
      {
        field: "region",
        header: "Region",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
    ],
    ASSET_ECS: [
      {
        field: "assetname",
        header: "Asset Name",
      },
      {
        field: "region",
        header: "Region",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
    ],
    ASSET_VOLUME: [
      {
        field: "awsvolumeid",
        header: "Volume Id",
      },
      {
        field: "sizeingb",
        header: "Size (GB)",
      },
      {
        field: "encryptedyn",
        header: "Encrypted",
      },
      {
        field: "instancename",
        header: "Instance Name",
      },
      {
        field: "instancetyperefid",
        header: "Instance Type",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
    ],
    ASSET_EKS: [
      {
        field: "assetname",
        header: "Asset Name",
      },
      {
        field: "region",
        header: "Region",
      },
      {
        field: "lastupdatedby",
        header: "Updated By",
      },
      {
        field: "lastupdateddt",
        header: "Updated On",
      },
    ],
  };
}
export const assetConstant = new AssetConstants();

"use strict";
import * as path from "path";

// DEP-VAR: Verify before deployment.
let baseUrl = process.env.BASE_URL || "http://localhost:3000";
let scriptUrl = process.env.SCRIPT_URL;
export class Constants {
  BASE_URL: string;
  WEB_URL_UI = process.env.WEB_URL || "http://localhost:4200";

  QUEUE = {
    ORCH_RUN_SCHEDULER: "q-orch-run-scheduler",
    ORCH_RUNNER: "q-orch-runner",
  };

  AWS_S3_CREDENTIALS = {
    AUTH_KEY: process.env.AUTH_KEY,
    SECRET_KEY: process.env.SECRET_KEY,
    ACCOUNTID: "259481850433",
    REGION: "us-east-2",
    IAMROLE: "CloudOperationsGlobalCrossAccountCloudMatiq",
    BUCKET: process.env.S3_BUCKET_STATICS,
  };
  CURRENCY = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    eur: "€",
    usd: "$",
    gbp: "£",
  };
  CURRENCY_SYMBOL = {
    "€": "eur",
    $: "usd",
    "£": "GBP",
  };
  APP_NAME: string = "CloudMatiq - Cloud Based Delivery Manager";

  // Should match with the secret in csdm-cron.
  APP_SECRET: string = "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3";

  // Reset password link secret
  RESET_PWD_SECRET: string = "3SPLqxkOD86";

  CLOUD_ALIBABA: string = "Alibaba";
  CLOUD_AWS: string = "AWS";
  CLOUD_ECL: string = "ECL2";
  CLOUD_SENTIA: string = "Sentia";
  CLOUD_EQUINIX: string = "Equinix";

  TERRAFORM_IN_FILE_NAME: string = "main.tf";
  TERRAFORM_OUT_FILE_NAME: string = "terraform.tfstate";

  RESPONSE_TYPE_SAVE: string = "SAVE";
  RESPONSE_TYPE_UPDATE: string = "UPDATE";
  RESPONSE_TYPE_DELETE: string = "DELETE";
  RESPONSE_TYPE_LIST: string = "LIST";
  RESPONSE_TYPE_CUSTOM: string = "CUSTOM";


  STATUES_CODES: any[] = [203, 201, 500, 200];
  GET_METHOD_TYPE: string = "GET";
  DELETE_STATUS: string = "Deleted";
  STATUS_ACTIVE: string = "Active";
  STATUS_INPROGRESS: string = "In Progress";
  STATUS_InACTIVE: string = "InActive";
  STATUS_DEPLOYING: string = "Deploying";
  STATUS_DEPLOYED: string = "Deployed";
  STATUS_COMPLETED: string = "Completed";
  STATUS_PENDING: string = "Pending";
  STATUS_FAILED: string = "Failed";
  STATUS_SUCCESS: string = "Success";
  STATUS_UNREAD: string = "Unread";
  STATUS_CANCELLED="Cancelled";
  SCHEDULED_MANUAL= "MANUAL";
  SCHEDULED_SCHEDULE="SCHEDULE";
  SCHEDULED_ONCOMMIT="ONCOMMIT";
  RELEASE_STATUS_COMPLETED: string = "COMPLETED";
  RELEASE_STATUS_PENDING: string = "PENDING";
  RELEASE_STATUS_FAILED: string = "FAILED";
  RELEASE_STATUS_CANCELLED="CANCELLED";
  RELEASE_STATUS_INPROGRESS="INPROGRESS";
  GITHUB_STATUS_INPROGRESS="in_progress";
  GITHUB_STATUS_SUCCESS: string = "success";
  GITHUB_STATUS_QUEUED: string = "queued";
  GITHUB_STATUS_FAILED: string = "failure";
  GITHUB_STATUS_CANCELLED="cancelled";
  GITHUB_STATUS_SKIPPED="skipped";
  WORKFLOW_TRIGGER = "Workflow triggered successfully";
  FAILED_TRIGGER = "Failed to trigger the Workflow";
  WORKFLOW_PENDING="Workflow already in pending state";
  WORKFLOW_CANCEL="Workflow cancelled successfully" ;
  WORKFLOW_CANCEL_ERROR="Workflow cancellation fails with an error";
  WORKFLOW_YML = ".yml";
  GITHUB="GITHUB";
  MODULE_CICD="CICD";
  CICD_STATUS_INACTIVE: string = "Inactive";
  ADMIN="Admin"
  RELEASE_SYSTEM="SYSTEM";
  DATE_FORMAT = "YYYY-MM-DD";
  SCHEDULEON_REGEX =/^(?:\*(?:\/\d+)?|[0-5]?\d(?:\/\d+)?) (?:\*(?:\/\d+)?|[01]?\d|2[0-3](?:\/\d+)?) (?:\*(?:\/\d+)?|0?[1-9]|[12]\d|3[01](?:\/\d+)?) (?:\*(?:\/\d+)?|0?[1-9]|1[0-2]|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:\/\d+)?) (?:\*(?:\/\d+)?|[0-6]|(?:SUN|MON|TUE|WED|THU|FRI|SAT)(?:\/\d+)?)$/;
  RELEASE_DELETE="Delete";
  RELEASE_UPDATE="update";
  RELEASE_TEMPLATE="Template";
  RELEASE_SCHEDULED_MANUAL= "MANUAL";
  EVENT_PUSH="push";
  EVENT_SCHEDULE="schedule";
  VARIABLE_PROVIDER ="PROVIDER"
  KEY_TYPE_SECRETS="SECRETS"
  KEY_TYPE_VARIABLES="VARIABLES"
  RESOURCE_DETAILS_ERROR = "An error occurred while fetching resource details"
  JSON_ERROR = "Error parsing JSON"

  COMMIT_MSG = "Add CI/CD workflow" + Date.now();
  YML = "YAML file generated successfully";
  PROVIDER_GITHUB = "GITHUB";
  PROVIDER_GITLAB="GITLAB";
  PROVIDER_BITBUCKET="BITBUCKET";
  CONTAINER_REGISTRY_DOCKERHUB = "DOCKERHUB";
  TESTING_TOOL_SONARQUBE = "SONARQUBE";
  CONTAINER_REGISTRY_AZURE_CR = "AZURE_CR";
  CONTAINER_REGISTRY_GOOGLE_GCR="GOOGLE_GCR";
  CONTAINER_REGISTRY_AWS_ECR="AWS_ECR";
  TESTING_TOOL_SELENIUM="SELENIUM";
  TESTING_TOOL_JMETER="JMETER";
  TESTING_TOOL_JUNIT="JUNIT";
  ENVIRONMENTS_VIRTUAL_MACHINE="VIRTUAL_MACHINE";
  BUILD_BUILD_SCRIPT="BUILD_SCRIPT";
  ENVIRONMENTS_DOCKER="DOCKER";
  ENVIRONMENTS_KUBERNATES="KUBERNATES";
  ENVIRONMENTS_SFTP="SFTP";
  AUTH_PASSWORD="PASSWORD";
  AUTH_KEYBASEDTYPE="KEYBASEDTYPE";
  DASHBOARD_SUCCESS_STATUS = "success";
  DASHBOARD_FAILED_STATUS = "failed";
  BOOLEAN="boolean";
  CICD_ENVIRONMENT="CICD_ENVIRONMENTS";
  CICD_DATE_REGEX="/\bd{4}[/-]d{1,2}[/-]\bd{1,2}$\b/";
  CICD_REGEX="/\bd{4}[/-]d{1,2}[/-]\bd{1,2} (0d|1d|2[0-3]):[0-5]d:[0-5]d$\b/";
  CICD_URL=/(https?:\/\/(?:www\d*\.|(?!www\d*\.))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\d*\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\d*\.|(?!www\d*\.))[a-zA-Z0-9]+\.[^\s]{2,}|www\d*\.[a-zA-Z0-9]+\.[^\s]{2,})/i;
  SERVICE_SCRIPTCONTENT: any= ['Dockerfile', 'sonar-project.properties']
  REFERENCE_TYPE: any[] =[
    "PROVIDER",
    "CONTAINER_REGISTRY",
    "TESTING_TOOL",
    "ENVIRONMENTS"
  ];
  FILTER_DAYS: any[] = [
    7,30,6,12
  ]
  CUSTOMVARIABLE_DEVELOPMENT="DEVELOPMENT";
  CUSTOMVARIABLE_STAGING="STAGING";
  CUSTOMVARIABLE_PRODUCTION="PRODUCTION";
  APPROVAL_WORKFLOW="APPROVAL_WORKFLOW";
  ORCHESTRATION="ORCHESTRATION";
  APPROVED= "Approved";
  DENIED = "Denied";

  //Notification
  NOTIFICATION_MODULES: any[] = [
    "Users",
    "Role",
    "Template",
    "Deployment",
    "Asset",
    "Catalog",
    "Service Request",
    "Budget",
  ];
  NOTIFICATION_EVENTS: any[] = [
    "Created",
    "Role Change",
    "Deleted",
    "Edited",
    "Approved",
    "Rejected",
    "Published",
    "Unpublished",
    "Changed",
    "Data Collection Failure",
    "Resize",
    "Resize - Up",
    "Success",
    "Failed",
    "Over Run",
  ];
  NOTIFICATION_TYPES: any[] = ["Email", "SMS"];
  DEFAULT_NAME = "CM ADMIN";

  STATUS_SRM: any[] = ["Pending", "Completed", "Work In Progress"];

  // Tag - Resource Types
  RESOURCE_TYPES: any[] = [
    "ASSET_INSTANCE",
    "ASSET_NETWORK",
    "ASSET_VOLUME",
    "ASSET_SECURITYGROUP",
    "ASSET_LB",
    "ASSET_VPC",
    "ASSET_SUBNET",
    "ASSET_FIREWALL",
    "ASSET_IG",
    "ASSET_CFG",
    "ASSET_IMAGE",
    "ASSET_S3",
    "ASSET_RDS",
    "ASSET_ECS",
    "ASSET_EKS",
    "VIRTUAL_MACHINES",
    "CLUSTERS",
    "DATACENTERS",
    "VM_HOSTS",
    "ASSET_SGS",
  ];
  DEFALULT_CURRENCY_SYMBOL = "$";
  DEFAULT_TAGS: any[] = ["HA_Enabled", "vmha"];
  PARAM_CONNTYPE = ["WINRM", "WINEXE", "CLOUDBASEINIT"];
  PARAM_AUTHTYPE = ["DOMAIN", "LOCAL"];

  SEQUELIZE_ERROR: string = "SequelizeDatabaseError";
  SEQUELIZE_ER_BAD_FIELD_ERROR: string = "ER_BAD_FIELD_ERROR";
  UNKNOWN_COLUMN: string = "Unknown column in request";
  PERMISSION_DENIED: string =
    "You dont have access to Apps, please contact support";
  TERRFORM_FOLDER_PATH: string = "/home/soundarc/git/csdm-tf/tms/tenants/";
  SCRIPTFILEPATH =
    path.dirname(path.dirname(__dirname)) + "/server/common/uploads/scripts/";
  FILEUPLOADPATH = {
    ARCH_IMG:
      path.dirname(path.dirname(__dirname)) +
      "/public/Images/architectural-images/",
    OLA_IMG:
      path.dirname(path.dirname(__dirname)) + "/public/Images/ola-images/",
    SERVICE_IMG:
      path.dirname(path.dirname(__dirname)) + "/public/Images/service-images/",
    SCRIPT_FILE: path.dirname(path.dirname(__dirname)) + "/public/Scripts/",
    TENANT_LOGO:
      path.dirname(path.dirname(__dirname)) + "/public/Images/tenant-logo/",
    KEYFILEDATA: path.dirname(path.dirname(__dirname)) + "../cicd/setup/environments"

  };
  FILEDWNLOADPATH = {
    ARCH_IMG: baseUrl + "/Images/architectural-images/",
    OLA_IMG: baseUrl + "/Images/ola-images/",
    SERVICE_IMG: baseUrl + "/Images/service-images/",
    SCRIPT_FILE: baseUrl + "/Scripts/",
    TENANT_LOGO: baseUrl + "/Images/tenant-logo/",
  };

  SNOW_AUTH = {
    username: "CM Integration",
    password: process.env.SNOW_PASSWORD,  };

  //AWS SERVICES
  AWS_SERVICE = [
    // "TOTAL_BILLING_COST",
    "Amazon Elastic Compute Cloud - Compute",
    "AmazonCloudWatch",
    "Amazon Virtual Private Cloud",
    "Amazon Simple Storage Service",
    "AWS Backup",
    "AWS Storage Gateway",
    "Amazon Relational Database Service",
    "AWS Directory Service",
    "Amazon CloudFront",
    "AWS Key Management Service",
    "Amazon WorkSpaces",
    "Amazon Simple Email Service",
    "Amazon Simple Notification Service",
    "Amazon Route 53",
    "Amazon EC2 Container Service",
    "Amazon Glacier",
    "Amazon Elastic Container Service for Kubernetes",
  ];

  // Terraform
  COMMAND = "powershell.exe";
  COMMAND_OPTIONS1 = "Set-ExecutionPolicy RemoteSigned -force";
  COMMAND_OPTIONS2 =
    "-version 4 -ExecutionPolicy Bypass -File D:\\SDLTMS11.3\\";
  CONNTYPE = "winrm";

  // Tenant
  PASSWORD = "admin";

  //AWS
  AWS_EC2_APIVERSION = "2016-11-15";
  AWS_ELB_APIVERSION_V1 = "2012-06-01";
  AWS_ELB_APIVERSION_V2 = "2015-12-01";
  AWS_S3_APIVERSION = "2006-03-01";
  AWS_ECS_APIVERSION = "2014-11-13";
  AWS_EKS_APIVERSION = "2017-11-01";
  AWS_SGS_APIVERSION = "2013-06-30";
  AWS_RDS_APIVERSION = "2014-10-31";
  AWS_CE_BILLING = "2017-10-25";

  LOOKUPKEY = ["AWS_IAM_ROLE", "TICKET_CATEGORY"];
  // ECL2 INVALID CREDENTIALS ERROR MESSAGE
  // ECL2_INVALID_CREDENTIALS = 'Please verify the ecl({region}) cloud details in tenant settings';
  ECL2_INVALID_CREDENTIALS =
    "Invalid ecl({region}) Access key,Secret key or ecltenantid";
  AWS_INVALID_CREDENTIALS = "Invalid AWS({region}) Access key or Secret key";
  VMWARE_INVALID_CREDENTIALS = "Unable to get token from remote server {url}";

  // ECL2
  ECL2_GET_AUTH_TOKEN_URL =
    "https://keystone-{zone}-ecl.api.ntt.com/v3/auth/tokens";
  ECL2_CREATE_NETWORK_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/networks";
  ECL2_CREATE_SUBNET_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/subnets";
  ECL2_CREATE_PORT_URL = "https://network-{zone}-ecl.api.ntt.com/v2.0/ports";
  ECL2_CREATE_NOVA_SERVER =
    "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/servers";
  ECL2_START_STOP_SERVER =
    "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/servers/{server_id}/action";
  ECL2_CREATE_VOLUME_URL =
    "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/os-volumes";
  ECL2_CREATE_KEYPAIR_URL =
    "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/os-keypairs";
  ECL2_CREATE_LOADBAL_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/load_balancers";
  ECL2_CREATE_FIREWALL_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/firewalls";
  ECL2_CREATE_INTERNET_GATEWAY_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/internet_gateways";
  ECL2_CREATE_IG_INTERFACE_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/gw_interfaces";
  ECL2_CREATE_IG_GLOBALIP_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/public_ips";
  ECL2_CREATE_IG_STATIC_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/static_routes";

  //ecl2 instance billing
  ECL2_BILLING =
    "https://sss-{zone}-ecl.api.ntt.com/api/v1.0/contracts/{ecl2contract}/billing/{month}";

  ECL2_UPDATE_NETWORK_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/networks/{network_id}";
  ECL2_UPDATE_SUBNET_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/subnets/{subnet_id}";
  ECL2_UPDATE_PORT_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/ports/{port_id}";
  ECL2_UPDATE_VOLUME_URL =
    "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/os-volumes/{volume_id}";
  ECL2_UPDATE_LOADBAL_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/load_balancers/{load_balancer_id}";
  ECL2_UPDATE_NOVA_SERVER =
    "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/servers/{server_id}";
  ECL2_UPDATE_FIREWALL_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/firewalls/{firewall_id}";
  ECL2_UPDATE_INTERNET_GATEWAY_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/internet_gateways/{internet_gateway_id}";
  ECL2_UPDATE_IG_INTERFACE_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/gw_interfaces/{gw_interface_id}";
  ECL2_UPDATE_IG_GLOBALIP_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/public_ips/{public_ip_id}";
  ECL2_UPDATE_IG_STATICIP_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/static_routes/{static_route_id}";

  ECL2_DELETE_SUBNET_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/subnets/{subnet_id}";
  ECL2_DELETE_PORT_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/ports/{port_id}";
  ECL2_DELETE_LOADBAL_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/load_balancers/{load_balancer_id}";
  ECL2_DELETE_NETWORK_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/networks/{network_id}";
  ECL2_DELETE_NOVA_SERVER =
    "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/servers/{server_id}";
  ECL2_DELETE_VOLUME_URL =
    "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/os-volumes/{volume_id}";
  ECL2_DELETE_INTERNET_GATEWAY_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/internet_gateways/{internet_gateway_id}";
  ECL2_DELETE_FIREWALL_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/firewalls/{firewall_id}";
  ECL2_DELETE_IG_INTERFACE_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/gw_interfaces/{gw_interface_id}";
  ECL2_DELETE_IG_GLOBALIP_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/public_ips/{public_ip_id}";
  ECL2_DELETE_IG_STATICIP_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/static_routes/{static_route_id}";

  ECL2_UPDATE_NOVA_SERVER_RESIZE =
    "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/servers/{server_id}/action";

  ECL2_GET_PORT_URL =
    "https://network-{zone}-ecl.api.ntt.com/v2.0/ports/{port_id}";

  ECL2 = {
    CREATE: {
      COMMON_FN_GATEWAY:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/common_function_gateways",
      COMMON_FN_POOL:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/common_function_pools",
      VSRX: "https://virtual-network-appliance-{zone}-ecl.api.ntt.com/v1.0/virtual_network_appliances",
      LB_SYSLOG_SERVER:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/load_balancer_syslog_servers",
      TENANT_CONN_REQUEST:
        "https://provider-connectivity-{zone}-ecl.api.ntt.com/v2.0/tenant_connection_requests",
      TENANT_CONN:
        "https://provider-connectivity-{zone}-ecl.api.ntt.com/v2.0/tenant_connections",
    },
    UPDATE: {
      COMMON_FN_GATEWAY:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/common_function_gateways/{common_function_gateway_id}",
      COMMON_FN_POOL:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/common_function_pools/{common_function_pool_id}",
      VSRX: "https://virtual-network-appliance-{zone}-ecl.api.ntt.com/v1.0/virtual_network_appliances/{virtual_network_appliance_id}",
      FIREWALL_INTERFACE:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/firewall_interfaces/{firewall_interface_id}",
      LB_INTERFACE:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/load_balancer_interfaces/{load_balancer_interface_id}",
      LB_SYSLOG_SERVER:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/load_balancer_syslog_servers/{load_balancer_syslog_server_id}",
      TENANT_CONN_REQUEST:
        "https://provider-connectivity-{zone}-ecl.api.ntt.com/v2.0/tenant_connection_requests/{tenant_connection_request_id}",
      TENANT_CONN_REQ_APPROVAL:
        "https://sss-jp5-ecl.api.ntt.com/api/v1.0/approval-requests/{request_id}",
      TENANT_CONN:
        "https://provider-connectivity-{zone}-ecl.api.ntt.com/v2.0/tenant_connections/{tenant_connection_id}",
    },
    DELETE: {
      COMMON_FN_GATEWAY:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/common_function_gateways/{common_function_gateway_id}",
      COMMON_FN_POOL:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/common_function_pools/{common_function_pool_id}",
      VSRX: "https://virtual-network-appliance-{zone}-ecl.api.ntt.com/v1.0/virtual_network_appliances/{virtual_network_appliance_id}",
      TENANT_CONN_REQUEST:
        "https://provider-connectivity-{zone}-ecl.api.ntt.com/v2.0/tenant_connection_requests/{tenant_connection_request_id}",
      TENANT_CONN:
        "https://provider-connectivity-{zone}-ecl.api.ntt.com/v2.0/tenant_connections/{tenant_connection_id}",
    },
    LIST: {
      IMAGE: "https://glance-{zone}-ecl.api.ntt.com/v2/images?limit=250", // Need to discuss
      LBPLAN: "https://network-{zone}-ecl.api.ntt.com/v2.0/load_balancer_plans",
      FIREWALLPLAN:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/firewall_plans",
      VSRXPLAN:
        "https://virtual-network-appliance-{zone}-ecl.api.ntt.com/v1.0/virtual_network_appliance_plans",
      INETSERVICE:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/internet_services",
      QOSOPTIONS: "https://network-{zone}-ecl.api.ntt.com/v2.0/qos_options",
      COMMON_FN_POOL:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/common_function_pools",
      TENANT_CONN_REQUEST:
        "https://provider-connectivity-{zone}-ecl.api.ntt.com/v2.0/tenant_connection_requests",
      TENANT_CONN:
        "https://provider-connectivity-{zone}-ecl.api.ntt.com/v2.0/tenant_connections",

      NETWORKS: "https://network-{zone}-ecl.api.ntt.com/v2.0/networks",
      NW_SUBNET: "https://network-{zone}-ecl.api.ntt.com/v2.0/subnets",
      NW_PORT: "https://network-{zone}-ecl.api.ntt.com/v2.0/ports",

      INTERNET_GATEWAY:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/internet_gateways",
      IG_PUBLICIPS: "https://network-{zone}-ecl.api.ntt.com/v2.0/public_ips",
      IG_GWINTERFACE:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/gw_interfaces",
      IG_STATICROUTE:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/static_routes",

      VSRX: "https://virtual-network-appliance-{zone}-ecl.api.ntt.com/v1.0/virtual_network_appliances",
      COMMON_FN_GATEWAY:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/common_function_gateways",
      VOLUMES: "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/os-volumes",

      LOAD_BALANCER:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/load_balancers",
      LB_INTERFACE:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/load_balancer_interfaces",
      LB_SYSLOG_SERVER:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/load_balancer_syslog_servers",

      NOVA_SERVER:
        "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/servers/detail",
      OS_KEYPAIR:
        "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/os-keypairs",
    },
    GET: {
      SUBNET: "https://network-{zone}-ecl.api.ntt.com/v2.0/subnets/{subnet_id}",
      VNCCONSOLE:
        "https://virtual-network-appliance-jp5-ecl.api.ntt.com/v1.0/virtual_network_appliances/{console_id}/remote-console",
      SERVERS:
        "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/servers/{server_id}",
      SERVER_CONSOLE:
        "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/servers/{console_id}/action",
      TENANT_CONN_REQUEST:
        "https://provider-connectivity-{zone}-ecl.api.ntt.com/v2.0/tenant_connection_requests/{tenant_connection_request_id}",
      TENANT_CONN:
        "https://provider-connectivity-{zone}-ecl.api.ntt.com/v2.0/tenant_connections/{tenant_connection_id}",
    },
    MANAGMENT: {
      CREATE_TENANT: "https://sss-{zone}-ecl.api.ntt.com/api/v1.0/tenants",
      DELETE_TENANT:
        "https://sss-{zone}-ecl.api.ntt.com/api/v1.0/tenants/{tenant_id}",
      ADD_TENANT_ROLE: "https://sss-{zone}-ecl.api.ntt.com/api/v1.0/roles",
    },
    METADATA: {
      NOVA_SERVER:
        "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/servers/{server_id}/metadata",
      NETWORK:
        "https://network-{zone}-ecl.api.ntt.com/v2.0/networks/{network_id}",
      VOLUMES: "https://nova-{zone}-ecl.api.ntt.com/v2/{tenant_id}/os-volumes",
    },
  };
  // Citrix Netscaler API
  CITRIX = {
    AUTH: {
      LOGIN: "https://{IP_ADDR}/nitro/v1/config/login?warning=yes",
      LOGOUT: "https://{IP_ADDR}/nitro/v1/config/logout",
    },
    FEATURES: {
      CONFIG: "https://{IP_ADDR}/nitro/v1/config/nsfeature?action=enable",
    },
    MODES: {
      CONFIG: "https://{IP_ADDR}/nitro/v1/config/nsmode?action=enable",
    },
    SAVE: {
      CONFIG: "https://{IP_ADDR}/nitro/v1/config/nsconfig?action=save",
    },
    CREATE: {
      LBVSERVER: "https://{IP_ADDR}/nitro/v1/config/lbvserver",
      VMAC: "https://{IP_ADDR}/nitro/v1/config/vrid",
      IP: "https://{IP_ADDR}/nitro/v1/config/nsip",
      LBSERVER: "https://{IP_ADDR}/nitro/v1/config/server",
      SERVICE_GROUP: "https://{IP_ADDR}/nitro/v1/config/servicegroup",
      SG_MEMBER_BINDING:
        "https://{IP_ADDR}/nitro/v1/config/servicegroup_servicegroupmember_binding",
      LBVSERVER_MEMBER_BINDING:
        "https://{IP_ADDR}/nitro/v1/config/lbvserver_servicegroup_binding",
      LB_SG_MONITORS_BINDING:
        "https://{IP_ADDR}/nitro/v1/config/servicegroup_lbmonitor_binding",
    },
  };

  CM = () => {
    return {
      BILLING_SUMMARY: this.BASE_URL + "/cloudmatiq/nm/asst/billing/summary",
      AWS_TAG_UPDATE:
        this.BASE_URL + "/cloudmatiq/aws/common/metadata?retain=true",
    };
  };

  // VSRX API
  VSRX_RPC_URL = "https://{ip}:3443/rpc/";

  // DEPLOY_PATH
  DEPLOY_FOLDER_PATH = "/instances/";

  LOOKUPKEYS = {
    TAG_GROUP_STRUCTURE: "TAG_STRUCTURE",
    CLOUDPROVIDER: "CLOUDPROVIDER",
    WAZUH_CRED: "SM_WAZUH",
    WAZUH_URL: "wazuh-dashboard-url",
    WAZUH_API_URL: "wazuh-api-url",
    WAZUH_USERNAME: "wazuh-username",
    WAZUH_PASSWORD: "wazuh-password",
    EC2_LAMBDA_KEY: "EC2_LAMBDA_KEY",
    CM_SNOW_INTEGRATION: "cm-integration",
    AWS_PARAMS_STORE: "AWS_PARAMS_CONFIG",
    NUTANIX_KEY: "nutanix_auth_key",
    SERVICENOW_EMAIL: "servicenow_email"
  };

  ECL2_PRODUCTS = ["TMS", "GROUPSHARE"];
  EC2_EVENTS_QUEUE = "q-aws-ec2-events";
  APP_ALERTS_CONFIG_QUEUE = "q-alert-config";
  MOMENT_FORMAT = ["d MMM yyyy", "d-MMM-yyyy HH:mm:ss", "MMMyyyy"];
  MAINT_WINDW_TYPES = ["SYNTHETIC_ALERTS", "SYSTEM_ALERT"];

  AWS_BUCKET = process.env.S3_BUCKET_STATICS;

  CLOUDPROVIDERS = ["AWS", "Sentia", "Equinix", "Nutanix"];
  BLUE_PLATFORM = ['windows', 'windows:64'];
  REGIONS = ["eu-central-1"];
  CMDB_OPERATIONTYPE = [
    "cmdb",
    "workpack-execution",
    "workpack-review",
    "workpack-template",
    "workpack-task",
    "workpack-executable",
    "task-executable",
    "workpack-watchlist",
  ];
  WORKPACK_EXECUTIONSTATUS = [
    "Execution Completed",
    "Execution Inprogress",
    "Execution Failed",
    "Execution Rejected",
  ];
  REQUEST_REFERENCE_TYPES: ["Solution","Orchestration","Workpack","CICD"];
  INBOXPATH = {
    VIEW_REQUEST: this.WEB_URL_UI + "/srm/catalog/view/:id?url=inbox",
  }

  MANAGED_INSTANCE = "ManagedInstance";
  MODULE = ["CICD", "Request"];

  SSMAGENT_TYPE = "Hybrid";
  
  OTP_LABEL = "Cloudmatiq";
  OTP_ALGORITHM = "SHA1";
  OTP_DIGIT = 6;
  OTP_PERIOD = 30;

  HISTORYCOMMENTS= ["Pipeline template created", "Pipeline template updated","Release created","Release updated","Orchestration created","Orchestration updated","Tenants created","Tenants updated","Roles created","Roles updated","Users created","Users updated","Environments-Virtual Machine created","Environments-Virtual Machine updated","Variables created","Variables updated","Github created","Github updated","Docker Hub created","Docker Hub updated","Build-Virtual Machine created","Build-Virtual Machine updated","Sonarqube created","Sonarqube updated","Scripts created","Scripts updated","Products Created","Products Updated","Tickets Created","Tickets Updated","Created","Updated","Maintainance window created","Maintainance window updated","SSL created","SSL updated","Solution Template Created","Solution Template Updated", "Parameter Created", "Parameter Updated","Solution Template - Instance Created", "Solution Template - Instance Updated","Solution Template - LoadBalancer Created","Solution Template - LoadBalancer Updated", "Solution Template - Cost Added", "Solution Template - Cost Updated","Customer created","Customer updated"];
  AFFECTEDATTRIBUTES= ["Notes"];
  RESOURCETYPE= ["Pipeline Template","Releases","Orchestration","Tenants","Roles","Users","Environments-Virtual Machine","Variables","Github","Docker Hub","Build-Virtual Machine","Sonarqube","Scripts","Products","Ticket","Alert","Maintainance window","SSL","Solution Template","Parameters","Customer"];
  TEMPLATE_REF = ["Account Created","User Created","User Updated","Forgot password","Resend OTP","Auto Resolve","Request Management"]

  CICD_REFERENCE = ["PROVIDER", "CONTAINER REGISTRY", "BUILDS", "ENVIRONMENTS", "TESTS" , "VARIABLES"]
  CICD_RESOUCE_TYPE = ["Incoming", "Outgoing"]

  constructor(baseurl: string) {
    this.BASE_URL = baseurl;
  }
}
export const constants = new Constants(baseUrl);

export const ECLApiURL = new Constants(baseUrl).ECL2;
export const CITRIXApiURL = new Constants(baseUrl).CITRIX;
export const CMApiURL = new Constants(baseUrl).CM();

export const S3STATICS_FOLDERS = {
  INSTANCES: "Instances",
  ORCHESTRATIONS: "Orchestrations",
};



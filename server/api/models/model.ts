import * as Sequelize from "sequelize";
import { databaseConfig } from "../../common/db";
import logger from "../../common/logger";

// Master Models
import LookUpModel from "./base/lookup.model";
import UserModel from "./base/user.model";
import CustomFieldModel from "./base/customfield.model";
import UserRolesModel from "./base/userrole.model";
import RoleAccessModel from "./base/roleaccess.model";
import ScreenActionsModel from "./base/screenactions.model";
import ScreensModel from "./base/screens.model";
import CloudAssetModel from "./base/cloudassets.model";
import AssetsHdr from "./base/assetshdr.model";
import AssetsDtl from "./base/assetsdtl.model";
import AssetsComment from "./base/assetscomment.model";
import AssetsDocument from "./base/assetsdocument.model";
import AssetsHistory from "./base/assetshistory.model";
import AssetsQuery from './base/assetquery.model';
import TagsModel from "./base/tags.model";
import TagValuesModel from "./base/tagvalues.model";
import TagGroupModel from "./base/taggroup.model";
import CostVisualModel from "./base/costvisual.model";
import OrchestrationModel from "./base/orchestration.model";
import AlertConfigsModel from "./base/alertconfigs.model";
import OrchScheduleModel from "./base/orch_schedule.model";
import OrchScheduleHdrModel from "./base/orch_schedulehdr.model";
import OrchLogsModel from "./base/orch_logs.model";
import OrchestrationLifecycle from "./base/orch_node_lifecycle.model";

import AsstUtlHdrModel from "./nm/asstutlhdr.model";
import AsstUtlDtlModel from "./nm/asstutldtl.model";
import workflowconfig from "./base/workflowconfig.model";
import workflowconfigapprover from "./base/workflowconfigapprover.model";
import RightsizeGroupModel from "./nm/rightsizegroup.model";
import RecommendationModel from "./nm/recommendation.model";
import RecommendSetupModel from "./nm/recommentationsetup.model";
import AssetBudgetModel from "./nm/asstbudget.model";
import AssetBillingModel from "./nm/asstbilling.model";
import AssetDailyBillingModel from "./nm/asstdailybilling.model";
import CommentdocModel from "./base/commentdoc.model";
import LogsModel from "./base/logs.model";

// Tenants Models
import TenantModel from "./tenant/tenant.model";
import ScriptsModel from "./tenant/scripts.model";
import SolutionsModel from "./tenant/solutions.model";
import SlaModel from "./tenant/servicemgmt/sla.model";
import SlaTemplatesModel from "./tenant/servicemgmt/slatemplates.model";
import IncidentslaModel from "./tenant/servicemgmt/incidentsla.model";
import ServiceCreditsModel from "./tenant/servicemgmt/servicecredits.model";
import KpiUptimeModel from "./tenant/servicemgmt/kpiuptime.model";
import KpiTicketsModel from "./tenant/servicemgmt/kpitickets.model";

import NotificationModel from "./base/notification.model";
import SSMActivityModel from "./base/ssm-activity.model";

import CustomerModel from "./tenant/customer.model";
import InstancesModel from "./tenant/instances.model";
import AssetMappingModel from "./tenant/assetmapping.model";
import TenantRegionModel from "./tenant/tenantregion.model";
import CustomerAccountModel from "./tenant/customeraccount.model";
import DeploymentScriptModel from "./tenant/deploymentscript.model";
import NotificationSetupModel from "./tenant/notificationsetup.model";
import TenantSettingsModel from "./tenant/tenantsettings.model";
import TenantLicensesModel from "./tenant/tenantlicenses.model"

import DeploymentsModel from "./deployment/deployments.model";
import ResourceTemplatesModel from "./deployment/resourcetemplates.model";
import DeployedScriptsModel from "./deployment/deployed-scripts.model";
import SolutionCostsModel from "./tenant/solutioncosts.model";
import ExporterMappingModel from './base/monitoring_tab/exportermap.model';
import ExporterOrchModel from './base/monitoring_tab/exportermaporch.model';

// AWS Models
import AWSAMIModel from "./deployment/aws/awsami.model";
import AWSInstTypeModel from "./deployment/aws/awsinsttype.model";
import AWSKeysModel from "./deployment/aws/awskeys.model";
import AWSLBModel from "./deployment/aws/awslb.model";
import AWSSGModel from "./deployment/aws/awssg.model";
import AWSSGRulesModel from "./deployment/aws/awssgrules.model";
import AWSSolutionModel from "./deployment/aws/awssolution.model";
import AWSSubNetModel from "./deployment/aws/awssubnet.model";
import AWSTagModel from "./deployment/aws/awstags.model";
import AWSVolumeModel from "./deployment/aws/awsvolumes.model";
import AWSVolumeAttachmentModel from "./deployment/aws/awsvolumeattachment.model";
import AWSVPCModel from "./deployment/aws/awsvpc.model";
import AWSZonesModel from "./deployment/aws/awszones.model";
import AWSDeploymentsModel from "./deployment/aws/awsdeployments.model";
import AWSCostVisualModel from "./deployment/aws/awscostvisual.model";
import AWSInternetgatewayModel from "./deployment/aws/awsinternetgateway.model";

// SRM Models

import SRMCatalogModel from "./srm/catalog.model";
import SRMCatalogAprvrModel from "./srm/catalogapprvrs.model";
import SRMSRModel from "./srm/sr.model";
import SRMSRActionsModel from "./srm/sractions.model";
import MaintWindowModel from "./srm/maintwindow.model";
import MaintwindowMapModel from "./srm/maintwindowmap.model";
import UpgradeRequestModel from "./srm/upgraderequest.model";
import ScheduleRequestModel from "./srm/schedulerequesthdr.model";
import ScheduleReqDtlModel from "./srm/schedulerequestdtl.model";

import awsdeployedvolumesModel from "./deployment/aws/awsdeployedvolumes.model";

// ECL2
import ECL2FirewallsModel from "./deployment/ecl2/ecl2firewalls.model";
import ECL2InternetgatewaysModel from "./deployment/ecl2/ecl2internetgateways.model";
import ECL2LoadbalancersModel from "./deployment/ecl2/ecl2loadbalancers.model";
import ECL2NetworksModel from "./deployment/ecl2/ecl2networks.model";
import ECL2PortsModel from "./deployment/ecl2/ecl2ports.model";
import ECL2SubnetsModel from "./deployment/ecl2/ecl2subnets.model";
import ECL2SolutionsModel from "./deployment/ecl2/ecl2solutions.model";
import ECL2TagsModel from "./deployment/ecl2/ecl2tags.model";
import ECL2InstancetypeModel from "./deployment/ecl2/ecl2instancetype.model";
import ECL2ImagesModel from "./deployment/ecl2/ecl2images.model";
import ECL2ZonesModel from "./deployment/ecl2/ecl2zones.model";
import ECL2DeploymentsModel from "./deployment/ecl2/ecl2deployments.model";
import ECL2VolumesModel from "./deployment/ecl2/ecl2volumes.model";
import ECL2VolumeAttachmentModel from "./deployment/ecl2/ecl2volumeattachment.model";

import ECL2KeysModel from "./deployment/ecl2/ecl2keys.model";
import ECL2InternetservicesModel from "./deployment/ecl2/ecl2internetservices.model";
import ECL2QosoptionsModel from "./deployment/ecl2/ecl2qosoptions.model";
import ECL2FirewallplansModel from "./deployment/ecl2/ecl2firewallplans.model";
import ECL2IgInterfaceModel from "./deployment/ecl2/ecl2iginterface.model";
import ECL2IgGlobalIpModel from "./deployment/ecl2/ecl2igglobalip.model";
import ECL2IgStaticIpModel from "./deployment/ecl2/ecl2igstaticip.model";
import ECL2CommonFunctionGatewayModel from "./deployment/ecl2/ecl2commonfunctiongateway.model";
import ECL2CommonFunctionPoolModel from "./deployment/ecl2/ecl2commonfunctionpool.model";
import ECL2vSRXModel from "./deployment/ecl2/ecl2vsrx.model";
import ECL2vSRXPlanModel from "./deployment/ecl2/ecl2vsrxplan.model";
import ECL2LBPlanModel from "./deployment/ecl2/ecl2lbplan.model";
import ECL2FirewallInterfaceModel from "./deployment/ecl2/ecl2firewallinterface.model";
import ECL2LBInterfaceModel from "./deployment/ecl2/ecl2lbinterface.model";
import ECL2LBSyslogserverModel from "./deployment/ecl2/ecl2lbsyslogserver.model";
import ECL2vSRXInterfaceModel from "./deployment/ecl2/ecl2vsrxinterface.model";
import ECL2LBSettingsModel from "./deployment/ecl2/ecl2lbsettings.model";
import ECL2TenantconnRequestModel from "./deployment/ecl2/ecl2tenantconnrequest.model";
import ECL2TenantConnectionModel from "./deployment/ecl2/ecl2tenantconnection.model";

// ALIBABA

import ALIDeploymentModel from "./deployment/alibaba/alideployment.model";
import ALIImageModel from "./deployment/alibaba/aliimage.model";
import ALIInstanceTypeModel from "./deployment/alibaba/aliinstancetype.model";
import ALIKeyPairModel from "./deployment/alibaba/alikeypair.model";
import ALILBModel from "./deployment/alibaba/alilb.model";
import ALILBListenerModel from "./deployment/alibaba/alilblistener.model";
import ALISecurityGroupModel from "./deployment/alibaba/alisecuritygroup.model";
import ALISGRulesModel from "./deployment/alibaba/alisgrules.model";
import AliSolutionModel from "./deployment/alibaba/alisolution.model";
import AliTagModel from "./deployment/alibaba/alitag.model";
import AliVolumeModel from "./deployment/alibaba/alivolume.model";
import AliVpcModel from "./deployment/alibaba/alivpc.model";
import AliVswitchModel from "./deployment/alibaba/alivswitch.model";
import AliZonesModel from "./deployment/alibaba/alizones.model";

//VMWare
import VMWareVM from "./deployment/vmware/vmware.model";
import VMWareClusters from "./deployment/vmware/cluster.model";
import VMWareDC from "./deployment/vmware/datacenter.model";
import VMWareHost from "./deployment/vmware/hosts.model";

import AsstUtlDailyModel from "./nm/asstutldaily.model";
import AsstUtlWeeklyModel from "./nm/asstutilweekly.model";
import AsstUtlMonthlyModel from "./nm/asstutilmonthly.model";
import AsstUtlYearlyModel from "./nm/asstutilyearly.model";
import EventLogModel from "./base/eventlog.model";

import DashboardConfigHdr from "./base/dashboardconfig/header.model";
import DashboardConfigDtl from "./base/dashboardconfig/detail.model";
import IncidentsModel from "./base/incidents.model";

import CustomerIncidentSlaModel from "./tenant/customersla/incidentsla.model";
import CustomerServiceCreditModel from "./tenant/customersla/servicecredits.model";
import CustomerAvailSlaModel from "./tenant/customersla/availabilitysla.model";

import KPIReportConfigHdrModel from "./tenant/kpireporting/reportconfighdr.model";
import KPIReportConfigDtlModel from "./tenant/kpireporting/reportconfigdtl.model";
import CustomerKPIModel from "./tenant/customerkpireporting.model";

// Monitoring models
import MonitoringSyntheticsModel from "./monitoring/synthetics.model";
import MonitoringSyntheticsDtlModel from "./monitoring/syntheticdtl.model";

// Workpack Templates
import WorkPackTemplates from './base/template.model';
import WorkPackTemplateTask from './base/templatetask.model';
import ReferenceModelTbl from './base/ReferenceModelTbl.model';
import TNWorkFlowApproverModel from './base/workflow/workflowapprover.model';
import TNWorkFlowActionsModel from './base/workflow/workflowactions.model';
import TNWorkFlowModel from './base/workflow/workflow.model';
import WrkRelationsModel from './base/workflow/wrkflowrelations.model';

import TxnRefModel from './base/txnref.model';

import MonitoringSSLHdr from './monitoring/sslhdr.model';
import MonitoringSSLDtl from './monitoring/ssldtl.model';
import Product from './base/product.model';

//Cicd
import ReleaseConfig from "./cicd/release/releasecofigs.model";
import ReleaseProcessHeader from "./cicd/release/releaseprocessheader.model";
import ReleaseProcessDetail from "./cicd/release/releaseprocessdetail.model";
import PipelineTemplate from "./cicd/pipeline_template/template.model";
import PipelineTemplateDetails from "./cicd/pipeline_template/templatedetail.model";
import PipelineTemplateDetailConfiguration from "./cicd/pipeline_template/templateconfig.model";
import Provider from './cicd/setup/providers.model';
import ContainerRegistry from './cicd/setup/containerregistery.model';
import TestingTool from './cicd/setup/testingtool.model';
import Environments from './cicd/setup/environment.model';
import ProviderRepositories from './cicd/setup/providersreposistry.model';
import customvariable from "./cicd/setup/customvariables.model";
import customvariablesvalues from "./cicd/setup/customvariablesvalues.model";
import ProviderRunners from "./cicd/setup/providersrunner.model";
import ReleaseConfigDetail from "./cicd/release/releaseconfigdetail.model";
import ReleaseSetupConfig from "./cicd/release/releasesetupconfig.model";
import SetupBuild from "./cicd/setup/builds.model";
// ContactPoints
import ContactPoints from './base/contactpoints.model';
import NtfTemplate from "./base/templates.model";
import History from "./base/history.model";
import catalogModel from "./srm/catalog.model";
import WatchList from './base/watchlist.model';
import ResourceMapping from "./base/resourcemapping.model"
let dbConfig = databaseConfig;
if (dbConfig.logging) {
  dbConfig.logging = true;
}
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);
const db = {
  sequelize,
  Sequelize,
  LookUp: LookUpModel(sequelize),
  User: UserModel(sequelize),
  Logs: LogsModel(sequelize),
  UserRoles: UserRolesModel(sequelize),
  RoleAccess: RoleAccessModel(sequelize),
  ScreenActions: ScreenActionsModel(sequelize),
  Screens: ScreensModel(sequelize),
  CustomField: CustomFieldModel(sequelize),
  Tenant: TenantModel(sequelize),
  Customer: CustomerModel(sequelize),
  CustomerAccount: CustomerAccountModel(sequelize),
  CommentsDoc: CommentdocModel(sequelize),
  Scripts: ScriptsModel(sequelize),
  Solutions: SolutionsModel(sequelize),
  Sla: SlaModel(sequelize),
  SlaTemplates: SlaTemplatesModel(sequelize),
  KpiTickets: KpiTicketsModel(sequelize),
  KpiUptime: KpiUptimeModel(sequelize),
  WorkFlowConfig: workflowconfig(sequelize),
  WorkFlowApprover: workflowconfigapprover(sequelize),
  Tags: TagsModel(sequelize),
  TagValues: TagValuesModel(sequelize),
  TagGroup: TagGroupModel(sequelize),
  CloudAsset: CloudAssetModel(sequelize),
  AssetsHdr: AssetsHdr(sequelize),
  AssetsDtl: AssetsDtl(sequelize),
  AssetsComment: AssetsComment(sequelize),
  AssetsDocument: AssetsDocument(sequelize),
  AssetsHistory: AssetsHistory(sequelize),
  AssetsQuery: AssetsQuery(sequelize),
  Instances: InstancesModel(sequelize),
  AssetMapping: AssetMappingModel(sequelize),
  ExptrMapping: ExporterMappingModel(sequelize),
  ExptrOrchestration: ExporterOrchModel(sequelize),
  TenantRegion: TenantRegionModel(sequelize),
  CostVisual: CostVisualModel(sequelize),
  Orchestration: OrchestrationModel(sequelize),
  OrchestrationSchedule: OrchScheduleModel(sequelize),
  OrchestrationScheduleHdr: OrchScheduleHdrModel(sequelize),
  OrchestrationLog: OrchLogsModel(sequelize),
  OrchestrationNodeLifecycle: OrchestrationLifecycle(sequelize),
  AlertConfigs: AlertConfigsModel(sequelize),
  DeploymentScript: DeploymentScriptModel(sequelize),
  SolutionCosts: SolutionCostsModel(sequelize),
  AsstUtlHdr: AsstUtlHdrModel(sequelize),
  AsstUtlDtl: AsstUtlDtlModel(sequelize),
  AsstBudget: AssetBudgetModel(sequelize),
  AsstBilling: AssetBillingModel(sequelize),
  AssetDailyBilling: AssetDailyBillingModel(sequelize),
  Recommendation: RecommendationModel(sequelize),
  RightsizeGroup: RightsizeGroupModel(sequelize),
  RecommendatioSetup: RecommendSetupModel(sequelize),
  AsstUtlDaily: AsstUtlDailyModel(sequelize),
  AsstUtlWeekly: AsstUtlWeeklyModel(sequelize),
  AsstUtlMonthly: AsstUtlMonthlyModel(sequelize),
  AsstUtlYearly: AsstUtlYearlyModel(sequelize),
  awsami: AWSAMIModel(sequelize),
  awsinsttype: AWSInstTypeModel(sequelize),
  awskeys: AWSKeysModel(sequelize),
  awslb: AWSLBModel(sequelize),
  awssg: AWSSGModel(sequelize),
  awssgrules: AWSSGRulesModel(sequelize),
  awssolution: AWSSolutionModel(sequelize),
  awssubnet: AWSSubNetModel(sequelize),
  awstags: AWSTagModel(sequelize),
  awsvpc: AWSVPCModel(sequelize),
  awsvolumes: AWSVolumeModel(sequelize),
  awsvolumeattachment: AWSVolumeAttachmentModel(sequelize),
  awszones: AWSZonesModel(sequelize),
  notification: NotificationModel(sequelize),
  notificationsetup: NotificationSetupModel(sequelize),
  eventlog: EventLogModel(sequelize),
  deployments: DeploymentsModel(sequelize),
  awsdeployments: AWSDeploymentsModel(sequelize),
  awsinternetgateway: AWSInternetgatewayModel(sequelize),

  srmcatalog: SRMCatalogModel(sequelize),
  schedulerequest: ScheduleRequestModel(sequelize),
  schedulerequestdetail: ScheduleReqDtlModel(sequelize),
  srmcatalogaprvr: SRMCatalogAprvrModel(sequelize),
  srmsr: SRMSRModel(sequelize),
  srmsractions: SRMSRActionsModel(sequelize),
  MaintWindow: MaintWindowModel(sequelize),
  MaintwindowMap: MaintwindowMapModel(sequelize),
  UpgradeRequest: UpgradeRequestModel(sequelize),

  awsdeployedvolumes: awsdeployedvolumesModel(sequelize),
  resourcetemplates: ResourceTemplatesModel(sequelize),
  DeployedScripts: DeployedScriptsModel(sequelize),
  awscostvisual: AWSCostVisualModel(sequelize),

  ecl2firewalls: ECL2FirewallsModel(sequelize),
  ecl2internetgateways: ECL2InternetgatewaysModel(sequelize),
  ecl2loadbalancers: ECL2LoadbalancersModel(sequelize),
  ecl2networks: ECL2NetworksModel(sequelize),
  ecl2ports: ECL2PortsModel(sequelize),
  ecl2subnets: ECL2SubnetsModel(sequelize),
  ecl2solutions: ECL2SolutionsModel(sequelize),
  ecl2tags: ECL2TagsModel(sequelize),
  ecl2instancetype: ECL2InstancetypeModel(sequelize),
  ecl2images: ECL2ImagesModel(sequelize),
  ecl2zones: ECL2ZonesModel(sequelize),
  ecl2deployments: ECL2DeploymentsModel(sequelize),
  ecl2volumes: ECL2VolumesModel(sequelize),
  ecl2volumeattachment: ECL2VolumeAttachmentModel(sequelize),
  ecl2keys: ECL2KeysModel(sequelize),
  ecl2internetservices: ECL2InternetservicesModel(sequelize),
  ecl2qosoptions: ECL2QosoptionsModel(sequelize),
  ecl2firewallplans: ECL2FirewallplansModel(sequelize),
  ecl2igglobalip: ECL2IgGlobalIpModel(sequelize),
  ecl2iginterface: ECL2IgInterfaceModel(sequelize),
  ecl2igstaticip: ECL2IgStaticIpModel(sequelize),
  ecl2commonfunctiongateway: ECL2CommonFunctionGatewayModel(sequelize),
  ecl2commonfunctionpool: ECL2CommonFunctionPoolModel(sequelize),
  ecl2vsrx: ECL2vSRXModel(sequelize),
  ecl2vsrxplan: ECL2vSRXPlanModel(sequelize),
  ecl2lbplan: ECL2LBPlanModel(sequelize),
  ecl2firewallinterface: ECL2FirewallInterfaceModel(sequelize),
  ecl2lbinterface: ECL2LBInterfaceModel(sequelize),
  ecl2lbsyslogserver: ECL2LBSyslogserverModel(sequelize),
  ecl2vsrxinterface: ECL2vSRXInterfaceModel(sequelize),
  ecl2lbsettings: ECL2LBSettingsModel(sequelize),
  ecl2tenantconnrequest: ECL2TenantconnRequestModel(sequelize),
  ecl2tenantconnection: ECL2TenantConnectionModel(sequelize),

  alideployment: ALIDeploymentModel(sequelize),
  aliimage: ALIImageModel(sequelize),
  aliinstancetype: ALIInstanceTypeModel(sequelize),
  alikeypairs: ALIKeyPairModel(sequelize),
  alilb: ALILBModel(sequelize),
  alilblistener: ALILBListenerModel(sequelize),
  alisecuritygroup: ALISecurityGroupModel(sequelize),
  alisgrules: ALISGRulesModel(sequelize),
  alisolution: AliSolutionModel(sequelize),
  alitags: AliTagModel(sequelize),
  alivolume: AliVolumeModel(sequelize),
  alivpc: AliVpcModel(sequelize),
  alivswitch: AliVswitchModel(sequelize),
  alizones: AliZonesModel(sequelize),

  //vmware
  vmwarevm: VMWareVM(sequelize),
  vmclusters: VMWareClusters(sequelize),
  vmwaredc: VMWareDC(sequelize),
  vmwarehosts: VMWareHost(sequelize),

  DashboardConfigHdr: DashboardConfigHdr(sequelize),
  DashboardConfigDtl: DashboardConfigDtl(sequelize),
  Incident: IncidentsModel(sequelize),
  ServiceCredits: ServiceCreditsModel(sequelize),
  IncidentSla: IncidentslaModel(sequelize),

  CustomerIncidentSla: CustomerIncidentSlaModel(sequelize),
  CustomerServiceCreditSla: CustomerServiceCreditModel(sequelize),
  CustomerAvailSla: CustomerAvailSlaModel(sequelize),
  KPIReportConfigHdr: KPIReportConfigHdrModel(sequelize),
  KPIReportConfigDtl: KPIReportConfigDtlModel(sequelize),
  CustomerKPI: CustomerKPIModel(sequelize),
  MSynthetics: MonitoringSyntheticsModel(sequelize),
  MSyntheticsDtl: MonitoringSyntheticsDtlModel(sequelize),
  SSMActivity: SSMActivityModel(sequelize),
  WorkPackTemplate: WorkPackTemplates(sequelize),
  WorkPackTemplateTask: WorkPackTemplateTask(sequelize),
  ReferenceModelTbl: ReferenceModelTbl(sequelize),
  TNWorkFlowApprover: TNWorkFlowApproverModel(sequelize),
  TNWorkFlowAction: TNWorkFlowActionsModel(sequelize),
  TNWorkFlow: TNWorkFlowModel(sequelize),
  TNWorkflowRelations: WrkRelationsModel(sequelize),
  TxnRefModel: TxnRefModel(sequelize),
  MonitoringSSLHdr: MonitoringSSLHdr(sequelize),
  MonitoringSSLDtl: MonitoringSSLDtl(sequelize),
  Product: Product(sequelize),
  ReleaseConfig: ReleaseConfig(sequelize),
  ReleaseProcessDetail: ReleaseProcessDetail(sequelize),
  ReleaseProcessHeader: ReleaseProcessHeader(sequelize),
  PipelineTemplate: PipelineTemplate(sequelize),
  PipelineTemplateDetailConfiguration:
    PipelineTemplateDetailConfiguration(sequelize),
  PipelineTemplateDetails: PipelineTemplateDetails(sequelize),
  Provider: Provider(sequelize),
  ContainerRegistry: ContainerRegistry(sequelize),
  TestingTool: TestingTool(sequelize),
  Environments: Environments(sequelize),
  ProviderRepositories:ProviderRepositories(sequelize),
  customVariable: customvariable(sequelize),
  customVariablesValues: customvariablesvalues(sequelize),
  ProviderRunners: ProviderRunners(sequelize),
  ReleaseConfigDetail: ReleaseConfigDetail(sequelize),
  ReleaseSetupConfig: ReleaseSetupConfig(sequelize),
  SetupBuild: SetupBuild(sequelize),
  ContactPoints: ContactPoints(sequelize),
  Templates: NtfTemplate(sequelize),
  History: History(sequelize),
  Catalog: catalogModel(sequelize),
  TenantSettings: TenantSettingsModel(sequelize),
  TenantLicenses: TenantLicensesModel(sequelize),
  WatchList: WatchList(sequelize),
  ResourceMapping: ResourceMapping(sequelize),
};
for (const key in db) {
  if (db.hasOwnProperty(key)) {
    const element = db[key];
    if (db[key].associate) {
      db[key].associate(db);
    }
  }
}
db.CustomField.belongsTo(db.Tenant, { as: "tenant", foreignKey: "tenantid" });
db.CustomField.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.CustomField.belongsTo(db.Solutions, {
  as: "template",
  foreignKey: "templateid",
});
db.CustomField.belongsTo(db.Scripts, { as: "script", foreignKey: "scriptid" });
db.Tenant.hasMany(db.CustomField, { as: "parameters", foreignKey: "tenantid" });
db.Scripts.hasMany(db.CustomField, {
  as: "parameters",
  foreignKey: "scriptid",
});
db.TagValues.belongsTo(db.Tags, { as: "tag", foreignKey: "tagid" });
db.Tags.hasMany(db.TagValues, { as: "tagvalues", foreignKey: "tagid" });
db.TagGroup.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "taggroupid",
});

db.AsstUtlHdr.hasMany(db.AsstUtlDtl, {
  as: "asstutldtl",
  foreignKey: "utilhdrid",
});

db.Instances.belongsTo(db.ecl2zones, { as: "ecl2zones", foreignKey: "zoneid" });
db.Instances.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.Instances.belongsTo(db.ecl2images, {
  as: "image",
  foreignKey: "imagerefid",
  targetKey: "ecl2imageid",
});
db.Instances.belongsTo(db.ecl2instancetype, {
  as: "instance",
  foreignKey: "instancetypeid",
});
db.Instances.belongsTo(db.ecl2volumes, {
  as: "volume",
  foreignKey: "volumeid",
});
db.Instances.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourcerefid",
  sourceKey: "instancerefid",
});
db.Instances.belongsTo(db.awszones, { as: "awszones", foreignKey: "zoneid" });
db.Instances.belongsTo(db.awsinsttype, {
  as: "awsinstance",
  foreignKey: "instancetypeid",
});
db.Instances.belongsTo(db.awsvolumes, {
  as: "awsvolume",
  foreignKey: "volumeid",
});
db.Instances.belongsTo(db.awsami, {
  as: "awsimage",
  foreignKey: "imagerefid",
  targetKey: "awsamiid",
});
db.Instances.belongsTo(db.awssg, {
  as: "awssgs",
  foreignKey: "securitygrouprefid",
  targetKey: "awssecuritygroupid",
});
db.AssetsDtl.hasMany(db.Tags, {
  as: "attached_rsc",
  foreignKey: "resourceid",
  sourceKey: "fieldkey",
});
db.Instances.hasOne(db.AsstUtlDtl, {
  as: "datacollections",
  foreignKey: "instanceid",
});
// db.AsstUtlDtl.belongsTo(db.Instances, { as: 'datacollections', foreignKey: 'instanceid' });
db.Instances.hasMany(db.AsstUtlDaily, {
  as: "dailycollection",
  foreignKey: "instancerefid",
  sourceKey: "instancerefid",
});

db.ecl2images.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "image",
  sourceKey: "imagename",
});
db.ecl2lbplan.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "plantype",
  sourceKey: "lbplanname",
});
db.ecl2vsrxplan.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "plantype",
  sourceKey: "vsrxplanname",
});
db.ecl2qosoptions.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "plantype",
  sourceKey: "qosoptionname",
});
db.ecl2volumes.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "plantype",
  sourceKey: "size",
});
db.Instances.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "plantype",
  sourceKey: "instancetyperefid",
});
db.awsvolumes.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "plantype",
  sourceKey: "sizeingb",
});
db.awsami.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "image",
  sourceKey: "platform",
});
db.awsami.belongsTo(db.TenantRegion, {
  as: "tnregion",
  foreignKey: "tnregionid",
});
db.ecl2instancetype.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "plantype",
  sourceKey: "instancetypename",
});
db.ecl2loadbalancers.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "plantype",
  sourceKey: "loadbalancerplan",
});
db.awsinsttype.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "plantype",
  sourceKey: "instancetypename",
});
db.awslb.hasMany(db.CostVisual, {
  as: "costvisual",
  foreignKey: "plantype",
  sourceKey: "securitypolicy",
});

//Tenant region Joins
db.Instances.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.ecl2loadbalancers.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.ecl2vsrx.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.ecl2networks.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.ecl2volumes.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.ecl2internetgateways.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.ecl2commonfunctiongateway.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.awsvolumes.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.awsvpc.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.awssubnet.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.awssg.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.awslb.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});
db.awsinternetgateway.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
  sourceKey: "tnregionid",
});

//asset mapping
db.Instances.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.ecl2loadbalancers.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.ecl2vsrx.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.ecl2networks.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.ecl2volumes.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.ecl2internetgateways.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.ecl2commonfunctiongateway.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.awsvolumes.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.awsvpc.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.awssubnet.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.awssg.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.awslb.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});
db.awsinternetgateway.hasMany(db.AssetMapping, {
  as: "assetmapping",
  foreignKey: "resourceid",
});

db.AssetMapping.hasMany(db.Instances, {
  as: "instance",
  foreignKey: "instancerefid",
  sourceKey: "resourcerefid",
});
db.AssetMapping.hasMany(db.ecl2loadbalancers, {
  as: "ecl2lb",
  foreignKey: "loadbalancerid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.ecl2vsrx, {
  as: "ecl2vsrx",
  foreignKey: "vsrxid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.ecl2volumes, {
  as: "ecl2volumes",
  foreignKey: "volumeid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.ecl2networks, {
  as: "ecl2networks",
  foreignKey: "networkid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.ecl2internetgateways, {
  as: "ecl2ig",
  foreignKey: "internetgatewayid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.ecl2commonfunctiongateway, {
  as: "ecl2cfg",
  foreignKey: "cfgatewayid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.awsvolumes, {
  as: "awsvolumes",
  foreignKey: "volumeid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.awsvpc, {
  as: "awsvpc",
  foreignKey: "vpcid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.awssubnet, {
  as: "awssubnet",
  foreignKey: "subnetid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.awssg, {
  as: "awssg",
  foreignKey: "securitygroupid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.awslb, {
  as: "awslb",
  foreignKey: "lbid",
  sourceKey: "resourceid",
});
db.AssetMapping.hasMany(db.awsinternetgateway, {
  as: "awsinternetgateway",
  foreignKey: "internetgatewayid",
  sourceKey: "resourceid",
});

db.AssetMapping.belongsTo(db.vmwarevm, {
  as: "virmachines",
  foreignKey: "resourceid",
  targetKey: "vmid",
});
db.AssetMapping.belongsTo(db.vmclusters, {
  as: "clusters",
  foreignKey: "resourceid",
  targetKey: "clusterid",
});
db.AssetMapping.belongsTo(db.vmwaredc, {
  as: "datacenter",
  foreignKey: "resourceid",
  targetKey: "dcid",
});
db.AssetMapping.belongsTo(db.vmwarehosts, {
  as: "hosts",
  foreignKey: "resourceid",
  targetKey: "hostid",
});
db.AssetMapping.belongsTo(db.Customer, {
  as: "customerdetail",
  foreignKey: "customerid",
});
db.vmwarevm.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
  sourceKey: "vmid",
});
db.vmwarevm.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.vmclusters.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.vmwaredc.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.vmwarehosts.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.vmclusters.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
  sourceKey: "clusterid",
});
db.vmwaredc.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
  sourceKey: "dcid",
});
db.vmwarehosts.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
  sourceKey: "hostid",
});

db.awssolution.belongsTo(db.Solutions, {
  as: "solution",
  foreignKey: "solutionid",
});
db.Solutions.hasOne(db.awslb, { as: "awslb", foreignKey: "solutionid" });
// db.Solutions.belongsTo(db.Sla, { as: 'sla', foreignKey: 'slaid' });
db.awslb.belongsTo(db.Solutions, { as: "solution", foreignKey: "solutionid" });
db.awstags.belongsTo(db.Solutions, {
  as: "solution",
  foreignKey: "resourceid",
});

db.srmcatalog.hasMany(db.srmcatalogaprvr, {
  as: "srmcatalogaprvr",
  foreignKey: "catalogid",
});
db.srmcatalogaprvr.belongsTo(db.srmcatalog, {
  as: "srmcatalog",
  foreignKey: "catalogid",
});

db.awssg.hasMany(db.awssgrules, {
  as: "awssgrules",
  foreignKey: "securitygroupid",
});
db.awssgrules.belongsTo(db.awssg, {
  as: "awssg",
  foreignKey: "securitygroupid",
});

db.awsvpc.hasMany(db.TagValues, { as: "tagvalues", foreignKey: "resourceid" });
db.awssubnet.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
});
db.awssg.hasMany(db.TagValues, { as: "tagvalues", foreignKey: "resourceid" });
db.awslb.hasMany(db.TagValues, { as: "tagvalues", foreignKey: "resourceid" });
db.awsvolumes.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
});

// AWS Solutions
db.awssolution.belongsTo(db.Scripts, { as: "script", foreignKey: "scriptid" });
db.awssolution.belongsTo(db.awssg, {
  as: "awssg",
  foreignKey: "securitygroupid",
});
db.awssolution.hasMany(db.awsvolumes, {
  as: "volumes",
  foreignKey: "awssolutionid",
});
db.awssolution.hasMany(db.awstags, { as: "tags", foreignKey: "resourceid" });
db.awssolution.hasMany(db.TagValues, { as: "tagvalues", foreignKey: "refid" });
db.awssolution.belongsTo(db.awslb, { as: "lb", foreignKey: "lbid" });
db.awslb.belongsTo(db.awssubnet, { as: "lbsubnet", foreignKey: "subnetid" });
db.awslb.belongsTo(db.awssg, {
  as: "lbsecuritygroup",
  foreignKey: "securitygroupid",
});
db.awssolution.belongsTo(db.awsami, { as: "awsami", foreignKey: "amiid" });
db.awssolution.belongsTo(db.awsvpc, { as: "awsvpc", foreignKey: "vpcid" });
db.awssolution.belongsTo(db.awsinsttype, {
  as: "awsinsttype",
  foreignKey: "instancetypeid",
});
db.awssolution.belongsTo(db.awssubnet, {
  as: "awssubnet",
  foreignKey: "subnetid",
});
db.awssolution.belongsTo(db.awskeys, { as: "awskeys", foreignKey: "keyid" });
db.awskeys.belongsTo(db.TenantRegion, {
  as: "tnregion",
  foreignKey: "tnregionid",
});

db.awsvolumes.belongsTo(db.awssolution, {
  as: "awssolution",
  foreignKey: "awssolutionid",
});
db.Solutions.hasMany(db.awssolution, {
  as: "awssolutions",
  foreignKey: "solutionid",
});
db.awssubnet.belongsTo(db.awszones, { as: "zone", foreignKey: "zoneid" });
db.awslb.hasMany(db.awssolution, { as: "awssolution", foreignKey: "lbid" });
db.Solutions.hasMany(db.awslb, { as: "lb", foreignKey: "solutionid" });
db.Solutions.belongsTo(db.Customer, { as: "client", foreignKey: "clientid" });
db.awsdeployments.belongsTo(db.awssolution, {
  as: "awssolution",
  foreignKey: "awssolutionid",
});
db.awsdeployments.belongsTo(db.Solutions, {
  as: "solution",
  foreignKey: "solutionid",
});
db.Solutions.hasMany(db.Sla, { as: "slas", foreignKey: "solutionid" });
db.Sla.belongsTo(db.Solutions, { as: "solution", foreignKey: "solutionid" });
db.Solutions.hasOne(db.notification, {
  as: "notifications",
  foreignKey: "solutionid",
});
db.notification.belongsTo(db.Solutions, {
  as: "notifications",
  foreignKey: "solutionid",
});
db.awslb.belongsTo(db.awsvpc, { as: "lbvpc", foreignKey: "vpcid" });
db.Solutions.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
});

// SRM
db.srmsr.belongsTo(db.Customer, { as: "customer", foreignKey: "clientid" });
db.srmcatalogaprvr.belongsTo(db.User, { as: "approver", foreignKey: "userid" });
db.srmsr.belongsTo(db.User, { as: "user", foreignKey: "userid" });
db.srmsr.belongsTo(db.TNWorkFlow,{
  as: 'workflow',
  foreignKey: 'wrkflowid'
})
db.srmsr.belongsTo(db.User, {
  as: 'assignee',
  foreignKey: 'assignedto',
  targetKey: 'userid'
});
db.srmsr.belongsTo(db.User, {
  as: 'reportee',
  foreignKey: 'reporter',
  targetKey: 'userid'
});
db.srmcatalog.belongsTo(db.Solutions, {
  as: "solution",
  foreignKey: "solutionid",
});
db.srmsr.belongsTo(db.srmcatalog, { as: "catalog", foreignKey: "catalogid" });
db.srmcatalog.hasOne(db.srmsr, {
  as: "servicerequest",
  foreignKey: "catalogid",
});
db.srmsr.hasOne(db.ContactPoints, {
  as: "contactdata",
  foreignKey: "refid"
});
db.srmsr.hasMany(db.TNWorkFlowApprover, {
  as: "workflowApprovers",
  foreignKey: "reqid"
});
db.srmcatalog.belongsTo(db.TNWorkFlow, {
  as: "workflow",
  foreignKey: "wrkflowid",
});
db.srmsr.hasMany(db.srmsractions, {
  as: "srmsractions",
  foreignKey: "srvrequestid",
});
db.srmsractions.belongsTo(db.srmsr, {
  as: "servicerequest",
  foreignKey: "srvrequestid",
});

db.srmsractions.belongsTo(db.srmsr, {
  as: "srmsr",
  foreignKey: "srvrequestid",
});
db.srmsractions.belongsTo(db.User, { as: "touser", foreignKey: "touserid" });
db.srmsractions.belongsTo(db.User, {
  as: "fromuser",
  foreignKey: "fromuserid",
});
db.srmcatalog.belongsTo(db.LookUp, { as: "group", foreignKey: "groupname" });
db.srmsr.belongsTo(db.LookUp, { as: "departments", foreignKey: "department" });

//upgrade request
db.UpgradeRequest.belongsTo(db.srmsr, {
  as: "servicerequest",
  foreignKey: "srvrequestid",
});
db.UpgradeRequest.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.UpgradeRequest.belongsTo(db.Instances, {
  as: "instance",
  foreignKey: "resourcerefid",
  targetKey: "instancerefid",
});
db.UpgradeRequest.belongsTo(db.CostVisual, {
  as: "upgradeplan",
  foreignKey: "upgradeplantype",
});
db.UpgradeRequest.belongsTo(db.CostVisual, {
  as: "currentplan",
  foreignKey: "currplantype",
});
db.Instances.hasMany(db.UpgradeRequest, {
  as: "resizedata",
  foreignKey: "resourcerefid",
  sourceKey: "instancerefid",
});
db.UpgradeRequest.belongsTo(db.MaintWindow, {
  as: "maintwindow",
  foreignKey: "maintwindowid",
});
db.srmsr.hasMany(db.UpgradeRequest, {
  as: "resizerequest",
  foreignKey: "srvrequestid",
});
db.UpgradeRequest.belongsTo(db.Tenant, {
  as: "tenant",
  foreignKey: "tenantid",
});

//schedule request
db.schedulerequest.belongsTo(db.srmsr, {
  as: "servicerequest",
  foreignKey: "srvrequestid",
});
db.schedulerequest.belongsTo(db.MaintWindow, {
  as: "maintwindow",
  foreignKey: "maintwindowid",
});
db.schedulerequest.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.schedulerequest.belongsTo(db.Instances, {
  as: "instance",
  foreignKey: "resourcerefid",
  targetKey: "instancerefid",
});
db.schedulerequestdetail.belongsTo(db.CostVisual, {
  as: "upgradeplan",
  foreignKey: "upgradeplantype",
});
db.schedulerequest.hasMany(db.schedulerequestdetail, {
  as: "requestdetails",
  foreignKey: "scheduledreqhdrid",
});
db.srmsr.hasMany(db.schedulerequest, {
  as: "schedulerequest",
  foreignKey: "srvrequestid",
});
db.schedulerequest.belongsTo(db.Tenant, {
  as: "tenant",
  foreignKey: "tenantid",
});

// Deployments
db.deployments.hasMany(db.awsdeployments, {
  as: "awsdeployments",
  foreignKey: "deploymentid",
});
db.deployments.belongsTo(db.Solutions, {
  as: "solution",
  foreignKey: "solutionid",
});
db.deployments.belongsTo(db.awszones, { as: "zone", foreignKey: "zoneid" });
db.deployments.belongsTo(db.Customer, { as: "client", foreignKey: "clientid" });
db.deployments.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
});

db.awsdeployments.belongsTo(db.deployments, {
  as: "deployments",
  foreignKey: "deploymentid",
});
db.deployments.belongsTo(db.TenantRegion, {
  as: "tnregion",
  foreignKey: "tnregionid",
});
db.awsdeployments.belongsTo(db.awsvpc, { as: "awsvpc", foreignKey: "vpcid" });
db.awsdeployments.belongsTo(db.awssg, {
  as: "awssg",
  foreignKey: "securitygroupid",
});
db.awsdeployments.belongsTo(db.awssubnet, {
  as: "awssubnet",
  foreignKey: "subnetid",
});
db.awsdeployments.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
});

db.deployments.hasMany(db.ecl2deployments, {
  as: "ecl2deployments",
  foreignKey: "deploymentid",
});
db.ecl2deployments.belongsTo(db.deployments, {
  as: "deployments",
  foreignKey: "deploymentid",
});
db.ecl2deployments.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
});

// Users
db.User.belongsTo(db.UserRoles, { as: "roles", foreignKey: "roleid" });
db.User.belongsTo(db.Tenant, { as: "tenant", foreignKey: "tenantid" });
db.User.belongsTo(db.Customer, { as: "customer", foreignKey: "customerid" });
// db.ScreenActions.belongsTo(db.Screens, { as: 'screens', foreignKey: 'screenid' });
// db.RoleAccess.belongsTo(db.ScreenActions, { as: 'screenactions', foreignKey: 'actionid' });
// db.UserRoles.belongsTo(db.RoleAccess, { as: 'roles', foreignKey: 'roleid' });
db.Screens.hasMany(db.ScreenActions, {
  as: "screenactions",
  foreignKey: "screenid",
});
db.UserRoles.hasMany(db.RoleAccess, { as: "roleaccess", foreignKey: "roleid" });
db.RoleAccess.belongsTo(db.Screens, { as: "screens", foreignKey: "screenid" });
db.Tenant.hasMany(db.User, { as: "user", foreignKey: "tenantid" });

db.Tenant.hasMany(db.LookUp, { as: "lookup", foreignKey: "tenantid" });

db.Tenant.hasMany(db.LookUp, { as: "providers", foreignKey: "tenantid" });
//cloud assets
db.CloudAsset.belongsTo(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "tnregionid",
});

db.Customer.hasMany(db.TenantRegion, {
  as: "tenantregion",
  foreignKey: "customerid",
});
db.Customer.belongsTo(db.Tenant, { as: "tenant", foreignKey: "tenantid" });
db.TenantRegion.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
//Workflow
db.WorkFlowConfig.hasMany(db.WorkFlowApprover, {
  as: "approvers",
  foreignKey: "aprvalwrkflowid",
});
db.WorkFlowApprover.belongsTo(db.User, { as: "user", foreignKey: "userid" });
// ECL2
db.ecl2networks.hasMany(db.ecl2subnets, {
  as: "ecl2subnets",
  foreignKey: "networkid",
});
db.ecl2networks.hasMany(db.ecl2ports, {
  as: "ecl2ports",
  foreignKey: "networkid",
});
db.ecl2solutions.hasMany(db.ecl2tags, { as: "tags", foreignKey: "resourceid" });
db.ecl2solutions.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "refid",
});
db.Solutions.hasMany(db.ecl2solutions, {
  as: "ecl2solutions",
  foreignKey: "solutionid",
});
db.ecl2solutions.belongsTo(db.ecl2instancetype, {
  as: "ecl2instancetype",
  foreignKey: "flavorid",
});
db.ecl2solutions.belongsTo(db.ecl2images, {
  as: "ecl2images",
  foreignKey: "imageid",
});
db.ecl2solutions.belongsTo(db.ecl2zones, {
  as: "ecl2zones",
  foreignKey: "zoneid",
});
db.ecl2solutions.hasMany(db.ecl2networks, {
  as: "networks",
  foreignKey: "networkid",
});
db.Solutions.hasMany(db.ecl2loadbalancers, {
  as: "ecl2loadbalancers",
  foreignKey: "solutionid",
});
db.ecl2ports.hasMany(db.ecl2tags, { as: "porttags", foreignKey: "resourceid" });
db.ecl2networks.hasMany(db.ecl2tags, {
  as: "ecl2tags",
  foreignKey: "resourceid",
});
db.ecl2networks.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
});
db.ecl2subnets.hasMany(db.ecl2tags, {
  as: "subnettags",
  foreignKey: "resourceid",
});
db.ecl2volumes.belongsTo(db.ecl2zones, {
  as: "ecl2zones",
  foreignKey: "zoneid",
});
db.ecl2volumes.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
});
db.ecl2keys.belongsTo(db.ecl2zones, { as: "ecl2zones", foreignKey: "zoneid" });
db.ecl2networks.belongsTo(db.ecl2zones, {
  as: "ecl2zones",
  foreignKey: "zoneid",
});
db.ecl2solutions.belongsTo(db.Scripts, {
  as: "ecl2script",
  foreignKey: "scriptid",
});
db.Tenant.hasMany(db.CustomField, {
  as: "customfield",
  foreignKey: "tenantid",
});
db.Solutions.belongsTo(db.Tenant, { as: "tenant", foreignKey: "tenantid" });
db.ecl2loadbalancers.belongsTo(db.ecl2zones, {
  as: "ecl2zones",
  foreignKey: "zoneid",
});
db.ecl2loadbalancers.hasMany(db.TagValues, {
  as: "tagvalues",
  foreignKey: "resourceid",
});
db.ecl2solutions.belongsTo(db.ecl2internetgateways, {
  as: "ecl2internetgateways",
  foreignKey: "internetgatewayid",
});
db.ecl2solutions.belongsTo(db.ecl2vsrx, {
  as: "ecl2vsrx",
  foreignKey: "vsrxid",
});
// ECL2 Gateway & Services
db.ecl2internetgateways.belongsTo(db.ecl2internetservices, {
  as: "ecl2internetservices",
  foreignKey: "internetservicesid",
});
db.ecl2internetgateways.belongsTo(db.ecl2zones, {
  as: "ecl2zones",
  foreignKey: "zoneid",
});
db.ecl2firewalls.belongsTo(db.ecl2zones, {
  as: "ecl2zones",
  foreignKey: "zoneid",
});
db.ecl2firewalls.belongsTo(db.ecl2firewallplans, {
  as: "ecl2firewallplans",
  foreignKey: "firewallplanid",
});
db.ecl2internetgateways.hasMany(db.ecl2iginterface, {
  as: "ecl2iginterface",
  foreignKey: "internetgatewayid",
});
db.ecl2internetgateways.hasMany(db.ecl2igglobalip, {
  as: "ecl2igglobalip",
  foreignKey: "internetgatewayid",
});
db.ecl2internetgateways.hasMany(db.ecl2igstaticip, {
  as: "ecl2igstaticip",
  foreignKey: "internetgatewayid",
});
db.ecl2internetgateways.belongsTo(db.ecl2qosoptions, {
  as: "ecl2qosoptions",
  foreignKey: "qosoptionid",
});
db.ecl2firewalls.hasMany(db.ecl2firewallinterface, {
  as: "ecl2firewallinterface",
  foreignKey: "firewallid",
});
db.ecl2firewallinterface.belongsTo(db.ecl2networks, {
  as: "ecl2networks",
  foreignKey: "networkid",
});
db.ecl2iginterface.belongsTo(db.ecl2networks, {
  as: "ecl2networks",
  foreignKey: "networkid",
});

db.ecl2commonfunctiongateway.belongsTo(db.ecl2zones, {
  as: "ecl2zones",
  foreignKey: "zoneid",
});
db.ecl2commonfunctiongateway.belongsTo(db.ecl2commonfunctionpool, {
  as: "ecl2commonfunctionpool",
  foreignKey: "cfpoolid",
});

// ECL2 Load balancers
db.ecl2loadbalancers.hasMany(db.ecl2lbinterface, {
  as: "ecl2lbinterface",
  foreignKey: "loadbalancerid",
});
db.ecl2loadbalancers.hasMany(db.ecl2lbsyslogserver, {
  as: "ecl2lbsyslogserver",
  foreignKey: "loadbalancerid",
});
db.ecl2lbinterface.belongsTo(db.ecl2networks, {
  as: "ecl2networks",
  foreignKey: "networkid",
});
db.ecl2loadbalancers.belongsTo(db.ecl2lbplan, {
  as: "ecl2lbplan",
  foreignKey: "loadbalancerplanid",
});
db.ecl2loadbalancers.belongsTo(db.ecl2zones, {
  as: "lbzones",
  foreignKey: "zoneid",
});
db.ecl2loadbalancers.hasMany(db.ecl2lbsettings, {
  as: "lbsettings",
  foreignKey: "loadbalancerid",
});
db.Solutions.hasMany(db.ecl2lbsettings, {
  as: "ecl2lbsettings",
  foreignKey: "solutionid",
});
db.ecl2loadbalancers.belongsTo(db.ecl2networks, {
  as: "defaultgwnetwork",
  foreignKey: "availablesubnets",
});

// ECL2 VSRX
db.ecl2vsrx.hasMany(db.ecl2vsrxinterface, {
  as: "ecl2vsrxinterface",
  foreignKey: "vsrxid",
});
db.ecl2vsrx.belongsTo(db.ecl2vsrxplan, {
  as: "ecl2vsrxplan",
  foreignKey: "vsrxplanid",
});
db.ecl2vsrxinterface.belongsTo(db.ecl2networks, {
  as: "ecl2networks",
  foreignKey: "networkid",
});
db.ecl2vsrx.belongsTo(db.ecl2zones, { as: "ecl2zones", foreignKey: "zoneid" });
db.ecl2vsrxinterface.belongsTo(db.ecl2vsrx, {
  as: "ecl2vsrx",
  foreignKey: "vsrxid",
});

// ECL2 deployment
db.deployments.belongsTo(db.ecl2zones, {
  as: "ecl2zone",
  foreignKey: "zoneid",
});
db.ecl2deployments.belongsTo(db.ecl2solutions, {
  as: "ecl2solution",
  foreignKey: "ecl2solutionid",
});
db.Solutions.hasMany(db.ecl2loadbalancers, {
  as: "ecl2lb",
  foreignKey: "solutionid",
});
db.ecl2solutions.belongsTo(db.ecl2volumes, {
  as: "volumes",
  foreignKey: "volumeid",
});
db.ecl2solutions.belongsTo(db.Scripts, {
  as: "script",
  foreignKey: "scriptid",
});
db.Solutions.belongsTo(db.ecl2zones, { as: "zone", foreignKey: "zoneid" });

db.ecl2commonfunctiongateway.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.ecl2internetgateways.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.ecl2networks.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.ecl2firewalls.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.ecl2vsrx.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.ecl2loadbalancers.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.ecl2keys.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.ecl2volumes.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.ecl2volumes.hasOne(db.Instances, { as: "instance", foreignKey: "volumeid" });
// Tenant inter conectivity
db.ecl2tenantconnrequest.belongsTo(db.ecl2networks, {
  as: "desnetwork",
  foreignKey: "networkid",
});
db.ecl2tenantconnrequest.belongsTo(db.Customer, {
  as: "descustomer",
  foreignKey: "customerid",
});
db.ecl2tenantconnrequest.belongsTo(db.Customer, {
  as: "sourcecustomer",
  foreignKey: "sourcecustomerid",
});
db.ecl2tenantconnrequest.hasMany(db.ecl2tags, {
  as: "ecl2tags",
  foreignKey: "resourceid",
});
db.ecl2tenantconnection.hasMany(db.ecl2tags, {
  as: "ecl2tags",
  foreignKey: "resourceid",
});
db.ecl2tenantconnection.belongsTo(db.Instances, {
  as: "instance",
  foreignKey: "deviceid",
});

// Alibaba
db.deployments.hasMany(db.alideployment, {
  as: "alideployment",
  foreignKey: "deploymentid",
});
db.alisolution.belongsTo(db.Scripts, { as: "script", foreignKey: "scriptid" });
db.Solutions.hasMany(db.alisolution, {
  as: "alisolution",
  foreignKey: "solutionid",
});
db.Solutions.hasMany(db.alilb, { as: "alilb", foreignKey: "solutionid" });
db.alisolution.belongsTo(db.aliimage, {
  as: "aliimage",
  foreignKey: "imageid",
});
db.alisecuritygroup.hasMany(db.alisgrules, {
  as: "alisgrules",
  foreignKey: "securitygroupid",
});
db.alisolution.hasMany(db.alitags, { as: "alitags", foreignKey: "resourceid" });
db.alisolution.belongsTo(db.aliinstancetype, {
  as: "aliinstancetype",
  foreignKey: "instancetypeid",
});
db.alisolution.belongsTo(db.alivolume, {
  as: "alivolume",
  foreignKey: "volumeid",
});
db.alisolution.belongsTo(db.alivpc, { as: "alivpc", foreignKey: "vpcid" });
db.alisolution.belongsTo(db.alivswitch, {
  as: "alivswitch",
  foreignKey: "vswitchid",
});
db.alisolution.belongsTo(db.alisecuritygroup, {
  as: "alisecuritygroup",
  foreignKey: "securitygroupid",
});
db.alilb.hasOne(db.alilblistener, { as: "alilblistener", foreignKey: "lbid" });
db.alilb.belongsTo(db.alivswitch, {
  as: "alivswitch",
  foreignKey: "vswitchid",
});

// Solution costs
db.SolutionCosts.belongsTo(db.ecl2solutions, {
  as: "ecl2solutions",
  foreignKey: "assetid",
});
db.SolutionCosts.belongsTo(db.ecl2volumes, {
  as: "ecl2volumes",
  foreignKey: "assetid",
});
// db.SolutionCosts.belongsTo(db.ecl2networks, { as: 'ecl2networks', foreignKey: 'assetid' });
db.SolutionCosts.belongsTo(db.ecl2loadbalancers, {
  as: "ecl2loadbalancers",
  foreignKey: "assetid",
});
db.SolutionCosts.belongsTo(db.ecl2vsrx, {
  as: "ecl2vsrx",
  foreignKey: "assetid",
});
db.SolutionCosts.belongsTo(db.awssolution, {
  as: "awssolution",
  foreignKey: "assetid",
});
db.SolutionCosts.belongsTo(db.awsvolumes, {
  as: "awsvolumes",
  foreignKey: "assetid",
});
db.SolutionCosts.belongsTo(db.awslb, { as: "awslb", foreignKey: "assetid" });
db.SolutionCosts.belongsTo(db.awsvpc, { as: "awsvpc", foreignKey: "assetid" });
db.Solutions.hasMany(db.SolutionCosts, {
  as: "costsummary",
  foreignKey: "solutionid",
});
db.SolutionCosts.belongsTo(db.CostVisual, {
  as: "costvisual",
  foreignKey: "costvisualid",
});

db.Recommendation.belongsTo(db.CostVisual, {
  as: "currentplan",
  foreignKey: "plantype",
});
db.Recommendation.belongsTo(db.CostVisual, {
  as: "recommendedplan",
  foreignKey: "recommendedplantype",
});
db.Recommendation.belongsTo(db.CostVisual, {
  as: "recommendedplanone",
  foreignKey: "recommendationone",
});
db.Recommendation.belongsTo(db.CostVisual, {
  as: "recommendedplantwo",
  foreignKey: "recommendationtwo",
});
db.Recommendation.belongsTo(db.CostVisual, {
  as: "recommendedplanthree",
  foreignKey: "recommendationthree",
});

db.Recommendation.belongsTo(db.CostVisual, {
  as: "awscurrentplan",
  foreignKey: "plantype",
});
db.Recommendation.belongsTo(db.CostVisual, {
  as: "awsrecommendedplan",
  foreignKey: "recommendedplantype",
});
db.Recommendation.belongsTo(db.CostVisual, {
  as: "awsrecommendedplanone",
  foreignKey: "recommendationone",
});
db.Recommendation.belongsTo(db.CostVisual, {
  as: "awsrecommendedplantwo",
  foreignKey: "recommendationtwo",
});
db.Recommendation.belongsTo(db.CostVisual, {
  as: "awsrecommendedplanthree",
  foreignKey: "recommendationthree",
});
db.Recommendation.belongsTo(db.ecl2instancetype, {
  as: "ecl2currentplan",
  foreignKey: "plantype",
});
db.Recommendation.belongsTo(db.ecl2instancetype, {
  as: "ecl2recommendedplan",
  foreignKey: "recommendedplantype",
});
db.Recommendation.belongsTo(db.ecl2instancetype, {
  as: "ecl2recommendedplanone",
  foreignKey: "recommendationone",
});
db.Recommendation.belongsTo(db.ecl2instancetype, {
  as: "ecl2recommendedplantwo",
  foreignKey: "recommendationtwo",
});
db.Recommendation.belongsTo(db.ecl2instancetype, {
  as: "ecl2recommendedplanthree",
  foreignKey: "recommendationthree",
});

db.CostVisual.belongsTo(db.awsinsttype, {
  as: "instancetype",
  foreignKey: "plantype",
  targetKey: "instancetypename",
});

db.CostVisual.hasMany(db.Recommendation, {
  as: "recommendation",
  foreignKey: "plantype",
});
db.Instances.hasMany(db.Recommendation, {
  as: "insrecommendation",
  foreignKey: "plantype",
  sourceKey: "instancetypeid",
});

db.ecl2instancetype.hasMany(db.CostVisual, {
  as: "ecl2instancecost",
  foreignKey: "plantype",
  sourceKey: "instancetypename",
});
db.ecl2instancetype.hasMany(db.CostVisual, {
  as: "awsinstancecost",
  foreignKey: "plantype",
  sourceKey: "instancetypename",
});

db.ecl2solutions.belongsTo(db.Orchestration, {
  as: "orchestration",
  foreignKey: "orchid",
});
db.awssolution.belongsTo(db.Orchestration, {
  as: "orchestration",
  foreignKey: "orchid",
});
db.CustomField.belongsTo(db.CustomField, {
  as: "variable",
  foreignKey: "fieldvalue",
  targetKey: "fieldname",
});

db.awsvolumes.hasOne(db.Instances, { as: "instance", foreignKey: "volumeid" });
db.awsvpc.hasMany(db.awssubnet, { as: "subnets", foreignKey: "vpcid" });
db.awsvpc.hasOne(db.awsinternetgateway, { as: "gateway", foreignKey: "vpcid" });
db.awsinternetgateway.belongsTo(db.awsvpc, { as: "vpc", foreignKey: "vpcid" });
db.awssubnet.belongsTo(db.awsvpc, { as: "awsvpc", foreignKey: "vpcid" });
db.awssg.belongsTo(db.awsvpc, { as: "awsvpc", foreignKey: "vpcid" });
db.Instances.hasMany(db.awsvolumeattachment, {
  as: "attachedvolumes",
  foreignKey: "instanceid",
  sourceKey: "instanceid",
});
db.awsvolumeattachment.belongsTo(db.awsvolumes, {
  as: "volume",
  foreignKey: "volumeid",
});
db.Instances.hasMany(db.ecl2volumeattachment, {
  as: "ecl2attachedvolumes",
  foreignKey: "instanceid",
  sourceKey: "instanceid",
});
db.ecl2volumeattachment.belongsTo(db.ecl2volumes, {
  as: "volume",
  foreignKey: "volumeid",
});

db.AsstBudget.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.AsstBilling.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.AsstBilling.belongsTo(db.Instances, {
  as: "instance",
  foreignKey: "cloud_resourceid",
  targetKey: "instancerefid",
});
db.AsstBudget.belongsTo(db.Tags, { as: "tag", foreignKey: "tagid" });

db.AssetDailyBilling.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.AssetDailyBilling.belongsTo(db.Instances, {
  as: "instance",
  foreignKey: "instancerefid",
  targetKey: "instancerefid",
});
db.CustomerAccount.hasMany(db.TenantRegion, {
  as: "regions",
  foreignKey: "_accountid",
  sourceKey: "id",
});
db.CustomerAccount.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.Customer.hasMany(db.CustomerAccount, {
  as: "accounts",
  foreignKey: "customerid",
  sourceKey: "customerid",
});
db.AsstBilling.belongsTo(db.Customer, {
  as: "_customer",
  foreignKey: "customerid",
  targetKey: "customerid",
});
db.AsstBilling.belongsTo(db.CustomerAccount, {
  as: "_account",
  foreignKey: "_accountid",
  targetKey: "id",
});
db.AsstBudget.belongsTo(db.CustomerAccount, {
  as: "account",
  foreignKey: "_accountid",
  targetKey: "id",
});
db.TenantRegion.belongsTo(db.CustomerAccount, {
  as: "accountdata",
  foreignKey: "_accountid",
  targetKey: "id",
});
db.Instances.belongsTo(db.CustomerAccount, {
  as: "accountdata",
  foreignKey: "accountid",
  targetKey: "id"
});
db.AssetsHdr.hasMany(db.AssetsDtl, {
  as: "assetdetail",
  foreignKey: "crn",
});
db.AssetsDtl.belongsTo(db.AssetsHdr, {
  as: "assethdr",
  foreignKey: "fieldkey",
  targetKey: "fieldkey",
});

db.DashboardConfigHdr.hasMany(db.DashboardConfigDtl, {
  as: "dashboardconfigdetails",
  foreignKey: "confighdrid",
});
db.DashboardConfigDtl.belongsTo(db.DashboardConfigHdr, {
  as: "dashboardconfig",
  foreignKey: "confighdrid",
});
db.DashboardConfigDtl.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.DashboardConfigHdr.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.DashboardConfigHdr.belongsTo(db.Tags, {
  as: "tag",
  foreignKey: "tagid",
});
db.DashboardConfigDtl.belongsTo(db.Instances, {
  as: "instances",
  foreignKey: "instancerefid",
  targetKey: "instancerefid",
});
db.TagValues.belongsTo(db.Instances, {
  as: "instances",
  foreignKey: "resourcerefid",
  targetKey: "instancerefid",
});
db.Incident.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.KpiTickets.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.KpiTickets.belongsTo(db.SlaTemplates, {
  as: "sla",
  foreignKey: "slaid",
});
db.KpiTickets.belongsTo(db.Tags, {
  as: "tag",
  foreignKey: "tagid",
});
db.KpiUptime.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "customerid",
});
db.KpiUptime.belongsTo(db.SlaTemplates, {
  as: "sla",
  foreignKey: "slaid",
});
db.KpiUptime.belongsTo(db.Tags, {
  as: "tag",
  foreignKey: "tagid",
});
db.Sla.belongsTo(db.SlaTemplates, {
  as: "slatemplate",
  foreignKey: "slatemplateid",
});
db.IncidentSla.belongsTo(db.Sla, {
  as: "slatemplate",
  foreignKey: "slatemplateid",
});
db.ServiceCredits.belongsTo(db.Sla, {
  as: "slatemplate",
  foreignKey: "slatemplateid",
});
db.SlaTemplates.hasMany(db.Sla, {
  as: "slaparameters",
  foreignKey: "slatemplateid",
});
db.SlaTemplates.hasMany(db.IncidentSla, {
  as: "incidentsla",
  foreignKey: "slatemplateid",
});
db.SlaTemplates.hasMany(db.ServiceCredits, {
  as: "servicecredits",
  foreignKey: "slatemplateid",
});

//alert config
db.AlertConfigs.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "_customer",
});
db.AlertConfigs.belongsTo(db.Instances, {
  as: "instances",
  foreignKey: "_instance",
});
db.AlertConfigs.belongsTo(db.Tags, { as: "tag", foreignKey: "_tag" });
db.AlertConfigs.belongsTo(db.CustomerAccount, {
  as: "account",
  foreignKey: "_account",
});

db.MaintwindowMap.belongsTo(db.MaintWindow, {
  as: "maintwindow",
  foreignKey: "maintwindowid",
});

db.Instances.hasMany(db.eventlog, {
  as: "events",
  foreignKey: "providerrefid",
  sourceKey: "instancerefid",
});

db.CustomerIncidentSla.belongsTo(db.IncidentSla, {
  as: "incidentsla",
  foreignKey: "incidentslaid",
});

db.Customer.hasMany(db.CustomerIncidentSla, {
  as: "customerincidentsla",
  foreignKey: "customerid",
});
db.Customer.hasMany(db.CustomerAvailSla, {
  as: "customeravailabilitysla",
  foreignKey: "customerid",
});
db.Customer.hasMany(db.CustomerServiceCreditSla, {
  as: "customerservicecredits",
  foreignKey: "customerid",
});
db.Customer.belongsTo(db.SlaTemplates, {
  as: "slatemplate",
  foreignKey: "slatemplateid",
});
db.Customer.hasMany(db.MaintwindowMap, {
  as: "maintenancewindowmap",
  foreignKey: "txnid",
});

db.KPIReportConfigHdr.hasMany(db.KPIReportConfigDtl, {
  as: "configdetail",
  foreignKey: "_confighdrid",
});

//schedule header join added 30-10-2023
db.OrchestrationScheduleHdr.hasMany(db.OrchestrationSchedule, {
  as: "schedules",
  foreignKey: "scdlid",
});
db.OrchestrationSchedule.hasOne(db.OrchestrationLog, {
  as: "logs",
  foreignKey: "_orchschedule"
});
db.OrchestrationSchedule.belongsTo(db.OrchestrationScheduleHdr, {
  as: "schedulehdr",
  foreignKey: "scdlid",
});
db.OrchestrationScheduleHdr.belongsTo(db.Orchestration, {
  as: "orchestration",
  foreignKey: "orchid",
});
db.OrchestrationSchedule.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "_customer",
});
db.OrchestrationSchedule.belongsTo(db.CustomerAccount, {
  as: "account",
  foreignKey: "_account",
});
db.OrchestrationSchedule.belongsTo(db.Orchestration, {
  as: "orchestration",
  foreignKey: "_orch",
});
db.OrchestrationSchedule.belongsTo(db.Tags, {
  as: "tag",
  foreignKey: "_tag",
});
db.OrchestrationSchedule.belongsTo(db.MaintWindow, {
  as: "maintwindow",
  foreignKey: "_maintwindow",
});

db.OrchestrationLog.belongsTo(db.Customer, {
  as: "customer",
  foreignKey: "_customer",
});
db.OrchestrationLog.belongsTo(db.CustomerAccount, {
  as: "account",
  foreignKey: "_account",
});
db.OrchestrationLog.belongsTo(db.Instances, {
  as: "instance",
  foreignKey: "_instance",
});
db.OrchestrationLog.belongsTo(db.OrchestrationSchedule, {
  as: "schedule",
  foreignKey: "_orchschedule",
});
db.TagValues.hasMany(db.AssetMapping, {
  as: "assets",
  foreignKey: "resourceid",
  sourceKey: "resourceid",
});
db.CustomerKPI.belongsTo(db.KPIReportConfigHdr, {
  as: "kpiconfighdr",
  foreignKey: "_reportid",
});
db.Instances.belongsTo(db.TenantRegion, {
  as: "instanceregion",
  foreignKey: "tnregionid",
});
db.TNWorkFlow.hasMany(db.TNWorkFlowApprover, {
  as: 'tnapprovers',
  foreignKey: 'wrkflowid'
});
db.TNWorkFlowApprover.belongsTo(db.TNWorkFlow, {
  as: 'tnworkflow',
  foreignKey: 'wrkflowid'
});
db.MonitoringSSLHdr.hasMany(db.MonitoringSSLDtl, {
  as: "monitoringssldtls",
  foreignKey: 'sslhdrid'
})
db.MSynthetics.hasMany(db.MSyntheticsDtl, {
  as: "monitoringdtls",
  foreignKey: 'syntheticid'
})
db.TNWorkFlowAction.belongsTo(db.User, {
  as: "fromuser",
  foreignKey: "fromuserid",
});
db.TNWorkFlowAction.belongsTo(db.User, {
  as: "touser",
  foreignKey: "touserid",
});
db.DashboardConfigHdr.hasMany(db.TagValues, {
  as: "assets",
  foreignKey: "tagid",
  sourceKey: "tagid",
});

db.ReleaseConfig.belongsTo(db.PipelineTemplate, {
  as: "template",
  foreignKey: "templateid",
});
db.ReleaseProcessHeader.belongsTo(db.ReleaseConfig, {
  as: "config",
  foreignKey: "releaseconfigid",
});
db.ReleaseProcessHeader.hasMany(db.ReleaseProcessDetail, {
  as: "processdetail",
  foreignKey: "releaseprocesshdrid",
});
db.TNWorkFlowApprover.belongsTo(db.User, {
  as: "approvers",
  foreignKey: "userid",
});
db.TNWorkFlow.hasMany(db.TNWorkFlowApprover, {
  as: "approvers",
  foreignKey: "wrkflowid",
});

db.PipelineTemplateDetails.hasOne(db.PipelineTemplate, {
  as: "templatedetails",
  foreignKey: "id",
});
db.PipelineTemplateDetails.hasOne(db.PipelineTemplateDetailConfiguration, {
  as: "templatedetailconfig",
  foreignKey: "templatedetailid",
});
db.PipelineTemplate.hasMany(db.PipelineTemplateDetails, {
  as: "pipelinetemplatedetails",
  foreignKey: "templateid", //id
  sourceKey: "id",
});
db.Environments.hasMany(db.Instances,{
  as: "instanceref",
  foreignKey: "instanceid",
  sourceKey: "instancerefid",
});
db.Provider.hasMany(db.ProviderRepositories,{
  as: "providerRepositories",
  foreignKey: "providerid",
});
db.customVariable.hasMany(db.customVariablesValues,{
  as: "customVariablesValues",
  foreignKey: "variableid",
  sourceKey: "id",
});
db.PipelineTemplate.belongsTo(db.ProviderRunners, {
  as: 'Runner',  
  foreignKey: 'runnerid',  
  targetKey: 'id' 
});

db.ReleaseConfigDetail.hasOne(db.ReleaseSetupConfig, {
  as: "releasesetupdetailconfig",
  foreignKey: "releaseconfigdetailid",
});
db.ReleaseConfig.hasMany(db.ReleaseConfigDetail, {
  as: "ConfigDetail",
  foreignKey: "releaseconfighdrid", 
  sourceKey: "id",
});
db.Solutions.belongsTo(db.srmcatalog, { foreignKey: 'solutionid', targetKey: 'referenceid', as: 'catalogdetails' });
db.AlertConfigs.belongsTo(db.Tenant, {
  as: "tenant",
  foreignKey: "tenantid",
});
db.Orchestration.belongsTo(db.Catalog, { foreignKey: 'orchid', targetKey: 'referenceid', as: 'catalog' });
db.Tenant.hasMany(db.TenantSettings, {
  as: "TenantSettings",
  foreignKey: "tenantid",
});
db.ReleaseConfig.belongsTo(db.srmcatalog, { foreignKey: 'id', targetKey: 'referenceid', as: 'catalog' });
db.Tenant.hasMany(db.TenantLicenses, { as: "TenantLicenses", foreignKey: "tenantid" });
db.notificationsetup.belongsTo(db.Templates, {
  as: "templates",
  foreignKey: "templateid",
});
db.PipelineTemplate.hasMany(db.WatchList, { foreignKey: 'refid', sourceKey: "id", as: 'notificationwatchlist' });
db.srmsr.hasMany(db.WatchList, { foreignKey: 'refid', sourceKey: "srvrequestid", as: 'notificationwatchlistSRM' });
db.AssetsDtl.hasMany(db.WatchList, {
  as: "notificationwatchlistWP",
  foreignKey: "refid",
  sourceKey: "resourceid",
});
db.WatchList.belongsTo(db.notificationsetup, {
  foreignKey: 'ntfcsetupid', 
  targetKey: 'ntfcsetupid', 
  as: 'notificationSetup'
});
db.WatchList.belongsTo(db.AssetsDtl, {
  foreignKey: "refid",
  as: "notificationwatchlistWP",
});
db.PipelineTemplate.hasMany(db.AssetsHdr, {
  foreignKey: 'crn',
  sourceKey: 'crn', 
  as: 'pipelineassethdr', 
});

db.Provider.hasMany(db.ResourceMapping, { foreignKey: 'referenceid', sourceKey: "id", as: 'providerCMDB' });
db.ContainerRegistry.hasMany(db.ResourceMapping, { foreignKey: 'referenceid', sourceKey: "id", as: 'containerRegistryCMDB' });
db.SetupBuild.hasMany(db.ResourceMapping, { foreignKey: 'referenceid', sourceKey: "id", as: 'buildsCMDB' });
db.TestingTool.hasMany(db.ResourceMapping, { foreignKey: 'referenceid', sourceKey: "id", as: 'testsCMDB' });
db.Environments.hasMany(db.ResourceMapping, { foreignKey: 'referenceid', sourceKey: "id", as: 'environmentsCMDB' });
db.customVariable.hasMany(db.ResourceMapping, { foreignKey: 'referenceid', sourceKey: "id", as: 'ResourceMapping' });

db.Tenant.hasMany(db.TenantSettings, { as: "tenantsetting", foreignKey: "tenantid" });
export default db;



import { Application } from "express";
import RouteGuard from "./common/routeGuard";

// Base
import assetRecordsRouter from "./api/controllers/base/assetrecords/router";
import assetDocumentsRouter from "./api/controllers/base/assetrecords/assetdocuments/router";
import assetCommentsRouter from "./api/controllers/base/assetrecords/assetcomments/router";
import assetHistoryRouter from "./api/controllers/base/assetrecords/assethistory/router";
import assetQueryRouter from './api/controllers/base/assetrecords/assetquery/router';

import lookupRouter from "./api/controllers/base/lookup/router";
import assetsRouter from "./api/controllers/base/assets/router";
import userRouter from "./api/controllers/base/user/router";
import customFieldRouter from "./api/controllers/base/customfield/router";
import userRolesRouter from "./api/controllers/base/userroles/router";
import roleAccessRouter from "./api/controllers/base/roleaccess/router";
import screenActionsRouter from "./api/controllers/base/screenactions/router";
import screensRouter from "./api/controllers/base/screens/router";
import tagsRouter from "./api/controllers/base/tags/router";
import tagvaluesRouter from "./api/controllers/base/tagvalues/router";
import taggroupRouter from "./api/controllers/base/taggroup/router";
import costvisualRouter from "./api/controllers/base/costvisual/router";
import orchRouter from "./api/controllers/base/orchestration/router";
import orchSyncRouter from "./api/controllers/base/orchestration/router-sync";
import alertConfigsRouter from "./api/controllers/base/alertconfigs/router";
import commentdocRouter from "./api/controllers/base/commentsdoc/router";
import historyRouter from "./api/controllers/base/history/router";

// Tenant
import tenantsRouter from "./api/controllers/tenant/router";
import scriptsRouter from "./api/controllers/tenant/scripts/router";
import solutionsRouter from "./api/controllers/tenant/solutions/router";
import slaRouter from "./api/controllers/tenant/sla/router";
import slatemplatesRouter from "./api/controllers/tenant/slatemplates/router";
import kpiuptimeRouter from "./api/controllers/tenant/kpiuptime/router";
import kpiticketsRouter from "./api/controllers/tenant/kpitickets/router";
import servicecreditsRouter from "./api/controllers/tenant/servicecredits/router";
import customersRouter from "./api/controllers/tenant/customer/router";
import customerAccountsRouter from "./api/controllers/tenant/customer/accounts/router";
import assetmappingRouter from "./api/controllers/tenant/assetmapping/router";
import deploymentscriptRouter from "./api/controllers/tenant/deploymentscript/router";
import solutioncostRouter from "./api/controllers/tenant/solutions/costs/router";
import instancesRouter from "./api/controllers/tenant/instance/router";
import cloudassetRouter from "./api/controllers/base/cloudasset/router";
import tenantsettingsRouter from "./api/controllers/tenant/tenantsettings/router"
import tenantlicensesRouter from "./api/controllers/tenant/tenantlicenses/router"

import templateRouter from "./api/controllers/base/templates/router";

// Deployments
import notificationsRouter from "./api/controllers/base/notifications/router";
import syntheticNtfRouter from "./api/controllers/base/notifications/synth-router";
import notificationsetupRouter from "./api/controllers/base/notificationssetup/router";
import deploymentsRouter from "./api/controllers/deployment/router";
// AWS
import awsamiRouter from "./api/controllers/deployment/aws/ami/router";
import awsinsttypeRouter from "./api/controllers/deployment/aws/insttype/router";
import awskeysRouter from "./api/controllers/deployment/aws/keys/router";
import awslbRouter from "./api/controllers/deployment/aws/lb/router";
import awsvpcRouter from "./api/controllers/deployment/aws/network/vpcrouter";
import awssecgrpRouter from "./api/controllers/deployment/aws/network/sgrouter";
import awssgrulesRouter from "./api/controllers/deployment/aws/network/sgrulesrouter";
import awssubnetRouter from "./api/controllers/deployment/aws/network/subnetrouter";
import awsigwRouter from "./api/controllers/deployment/aws/network/igwrouter";
import awstagsRouter from "./api/controllers/deployment/aws/tags/router";
import awsvolumesRouter from "./api/controllers/deployment/aws/volume/router";
import awszoneRouter from "./api/controllers/deployment/aws/zones/router";
import awssgRouter from "./api/controllers/deployment/aws/network/sgrouter";
import awssolutionRouter from "./api/controllers/deployment/aws/solution/router";
import srmcatalogRouter from "./api/controllers/srm/catalog/router";
import srmsrRouter from "./api/controllers/srm/sr/srrouter";
import srmsractionsRouter from "./api/controllers/srm/sr/sractionsrouter";
import awsdeployedvolumesRouter from "./api/controllers/deployment/aws/deployedvolumes/router";
import awsdepoymentsRouter from "./api/controllers/deployment/aws/deployment/router";
import awscostvisualRouter from "./api/controllers/deployment/aws/costvisual/router";
import awscommonRouter from "./api/controllers/deployment/aws/common/router";

// ECL2
import ecl2firewallsRouter from "./api/controllers/deployment/ecl2/ecl2firewalls/router";
import ecl2internetgatewaysRouter from "./api/controllers/deployment/ecl2/ecl2internetgateways/router";
import ecl2networksRouter from "./api/controllers/deployment/ecl2/ecl2networks/router";
import ecl2portsRouter from "./api/controllers/deployment/ecl2/ecl2ports/router";
import ecl2solutionsRouter from "./api/controllers/deployment/ecl2/ecl2solutions/router";
import ecl2subnetsRouter from "./api/controllers/deployment/ecl2/ecl2subnets/router";
import ecl2tagsRouter from "./api/controllers/deployment/ecl2/ecl2tags/router";
import ecl2loadbalancersRouter from "./api/controllers/deployment/ecl2/ecl2loadbalancers/router";
import ecl2imagesRouter from "./api/controllers/deployment/ecl2/ecl2images/router";
import ecl2instancetypeRouter from "./api/controllers/deployment/ecl2/ecl2instancetype/router";
import ecl2zonesRouter from "./api/controllers/deployment/ecl2/ecl2zones/router";
import ecl2volumesRouter from "./api/controllers/deployment/ecl2/ecl2volumes/router";
import ecl2keysRouter from "./api/controllers/deployment/ecl2/ecl2keys/router";
import ecl2internetservicesRouter from "./api/controllers/deployment/ecl2/ecl2internetservices/router";
import ecl2qosoptionsRouter from "./api/controllers/deployment/ecl2/ecl2qosoptions/router";
import ecl2firewallplansRouter from "./api/controllers/deployment/ecl2/ecl2firewallplans/router";
import ecl2iginterfaceRouter from "./api/controllers/deployment/ecl2/ecl2iginterface/router";
import ecl2igglobalipRouter from "./api/controllers/deployment/ecl2/ecl2igglobalip/router";
import ecl2igstaticipRouter from "./api/controllers/deployment/ecl2/ecl2igstaticip/router";
import ecl2commonfunctiongatewayRouter from "./api/controllers/deployment/ecl2/ecl2commonfunctiongateway/router";
import ecl2commonfunctionpoolRouter from "./api/controllers/deployment/ecl2/ecl2commonfunctionpool/router";
import ecl2vsrxRouter from "./api/controllers/deployment/ecl2/ecl2vsrx/router";
import ecl2vsrxplanRouter from "./api/controllers/deployment/ecl2/ecl2vsrxplan/router";
import ecl2commonRouter from "./api/controllers/deployment/ecl2/common/router";
import ecl2lbplanRouter from "./api/controllers/deployment/ecl2/ecl2lbplan/router";
import ecl2firewallinterfaceRouter from "./api/controllers/deployment/ecl2/ecl2firewallinterface/router";
import ecl2lbinterfaceRouter from "./api/controllers/deployment/ecl2/ecl2lbinterface/router";
import ecl2lbsyslogserverRouter from "./api/controllers/deployment/ecl2/ecl2lbsyslogserver/router";
import ecl2vsrxinterfaceRouter from "./api/controllers/deployment/ecl2/ecl2vsrxinterface/router";
import ecl2lbsettingsRouter from "./api/controllers/deployment/ecl2/ecl2lbsettings/router";
import ecl2tenantconnrequestRouter from "./api/controllers/deployment/ecl2/ecl2tenantconnrequest/router";
import ecl2tenantconnectionRouter from "./api/controllers/deployment/ecl2/ecl2tenantconnection/router";
import wazuhRouter from "./api/controllers/base/wazuh/router";
import ExptrMappingRouter from './api/controllers/tenant/exptrmapping/router';
import ExptrOrchMappingRouter from './api/controllers/tenant/exptrorchmapping/router';
//vmware
import vmccommonroutes from "./api/controllers/deployment/vmware/common/router";

//nutanix
import nutanixroutes from "./api/controllers/deployment/Nutanix/common/router";

import alideploymentRouter from "./api/controllers/deployment/alibaba/alideployment/router";
import aliimageRouter from "./api/controllers/deployment/alibaba/aliimage/router";
import aliinstancetypeRouter from "./api/controllers/deployment/alibaba/aliinstancetype/router";
import alikeypairRouter from "./api/controllers/deployment/alibaba/alikeypair/router";
import alilbRouter from "./api/controllers/deployment/alibaba/alilb/router";
import alilblistenerRouter from "./api/controllers/deployment/alibaba/alilblistener/router";
import alisecuritygroupRouter from "./api/controllers/deployment/alibaba/alisecuritygroup/router";
import alisgrulesRouter from "./api/controllers/deployment/alibaba/alisgrules/router";
import alisolutionRouter from "./api/controllers/deployment/alibaba/alisolution/router";
import alitagRouter from "./api/controllers/deployment/alibaba/alitag/router";
import alivolumeRouter from "./api/controllers/deployment/alibaba/alivolume/router";
import alivpcRouter from "./api/controllers/deployment/alibaba/alivpc/router";
import alivswitchRouter from "./api/controllers/deployment/alibaba/alivswitch/router";
import alizonesRouter from "./api/controllers/deployment/alibaba/alizones/router";

import asstutlRouter from "./api/controllers/nm/asstutl/router";
import asstutlDetailRouter from "./api/controllers/nm/asstutl/detailRouter";
import recommendationRouter from "./api/controllers/nm/recommendation/router";
import rightsizegroupRouter from "./api/controllers/nm/rightsizegroup/router";
import recommendationSetupRouter from "./api/controllers/nm/recommentationsetup/router";
import upgraderequestRouter from "./api/controllers/srm/upgraderequest/router";
import schedulerequestRouter from "./api/controllers/srm/schedulerequest/header/router";
import schedulerequestDetailsRouter from "./api/controllers/srm/schedulerequest/details/router";
import maintwindowRouter from "./api/controllers/srm/maintwindow/router";
import maintwindowMapRouter from "./api/controllers/srm/maintwindow/maintwindowmap/router";
import workflowRouter from "./api/controllers/srm/workflowconfig/router";
import workflowApproverRouter from "./api/controllers/srm/workflowapprover/router";
import asstbudgetRouter from "./api/controllers/nm/asstbudget/router";
import asstbillingRouter from "./api/controllers/nm/asstbilling/router";
import asstdailybillingRouter from "./api/controllers/nm/asstdailybilling/router";
import eventlogRouter from "./api/controllers/base/eventlog/router";
import dashboardRouter from "./api/controllers/tenant/customer/dashboard/router";
import hooksRouter from "./api/controllers/webhooks/router";
import dashboardconfigdtlRouter from "./api/controllers/base/dashboardconfig/detail/router";
import dashboardconfighdrRouter from "./api/controllers/base/dashboardconfig/header/router";
import incidentsRouter from "./api/controllers/base/incidents/router";
import tenantRegionRouter from "./api/controllers/tenant/tnregions/router";
import incidentslaRouter from "./api/controllers/tenant/incidentsla/router";

import MonitoringSummaryRouter from "./api/controllers/base/monitoring/router";

import customerincidentslaRouter from "./api/controllers/tenant/customer/sla/incidentsla/router";
import customeravailabilityslaRouter from "./api/controllers/tenant/customer/sla/availablitysla/router";
import customerservicecreditslaRouter from "./api/controllers/tenant/customer/sla/servicecredits/router";

import kpireportconfighdrRouter from "./api/controllers/tenant/kpireporting/configurehdr/router";
import kpireportconfigdtlRouter from "./api/controllers/tenant/kpireporting/configuredtl/router";

import customerkpiRouter from "./api/controllers/tenant/customer/kpireporting/router";
import ssmRouter from "./api/controllers/ssm/router";
import secretsmanagerRouter from "./api/controllers/base/secretsmanager/router";

// Monitoring routes
import monitoringRoutes from "./api/controllers/monitoring/synthetics/router";
import monitoringSSLRoutes from "./api/controllers/monitoring/ssl/router";

//workpack templates
import tnworkflowRoutes from "./api/controllers/base/workflow/router";
import tnworkflowactionRoutes from "./api/controllers/base/workflow/workflowaction/router";
import tnworkflowapproverRoutes from "./api/controllers/base/workflow/workflowapprover/router";
import tnworkpackRoutes from './api/controllers/base/workpack/router';

//cicd
import workflowRoutes from "./api/controllers/cicd/releases/releaseworkflow/router";
import releaseconfig from "./api/controllers/cicd/releases/releaseconfig/router";
import setupmaster from "./api/controllers/cicd/pipelinetemplate/setupmaster/router"
import pipelinetemplate  from "./api/controllers/cicd/pipelinetemplate/router";
import provider  from "./api/controllers/cicd/setup/provider/router";
import containerregistry from "./api/controllers/cicd/setup/containerregistry/router";
import testtool from "./api/controllers/cicd/setup/testtool/router";
import environments from "./api/controllers/cicd/setup/environments/router";
import dashboard from "./api/controllers/cicd/dashboard/router";
import pipelinestatus from "./api/controllers/cicd/dashboard/pipelinestatus/router";
import pipelinestatusdaily from "./api/controllers/cicd/dashboard/pipelinestatusdaily/router";
import customvariable from "./api/controllers/cicd/setup/customvariable/router";
import build from "./api/controllers/cicd/setup/builds/router";
import nodeproperties from "./api/controllers/cicd/nodeproperties/router";
// contactPoints
import contactpointsRoutes from "./api/controllers/base/contactpoints/router";
import watchListRoutes from "./api/controllers/base/watchlist/router";
import resourcemappingRouter from "./api/controllers/cicd/resourcemapping/router";
export default function routes(app: Application): void {
  app.use("/cloudmatiq/base/assetrecords", RouteGuard, assetRecordsRouter);

  app.use("/cloudmatiq/base/lookup", RouteGuard, lookupRouter);
  app.use("/cloudmatiq/base/assets", RouteGuard, assetsRouter);
  app.use("/cloudmatiq/users", userRouter);
  app.use("/cloudmatiq/parameters", RouteGuard, customFieldRouter);
  app.use("/cloudmatiq/customers", RouteGuard, customersRouter);
  app.use("/cloudmatiq/customer-account", RouteGuard, customerAccountsRouter);
  app.use(
    "/cloudmatiq/tenants/customer/incidentsla",
    RouteGuard,
    customerincidentslaRouter
  );
  app.use(
    "/cloudmatiq/tenants/customer/availabilitysla",
    RouteGuard,
    customeravailabilityslaRouter
  );
  app.use(
    "/cloudmatiq/tenants/customer/servicecredits",
    RouteGuard,
    customerservicecreditslaRouter
  );
  app.use("/cloudmatiq/tenants", RouteGuard, tenantsRouter);
  app.use("/cloudmatiq/scripts", RouteGuard, scriptsRouter);
  app.use("/cloudmatiq/cloudasset", RouteGuard, cloudassetRouter);
  app.use("/cloudmatiq/solutions", RouteGuard, solutionsRouter);
  app.use("/cloudmatiq/tenants/sla", RouteGuard, slaRouter);
  app.use("/cloudmatiq/tenants/slatemplates", RouteGuard, slatemplatesRouter);
  app.use("/cloudmatiq/tenants/kpiuptime", RouteGuard, kpiuptimeRouter);
  app.use("/cloudmatiq/tenants/kpitickets", RouteGuard, kpiticketsRouter);
  app.use("/cloudmatiq/tenants/incidentsla", RouteGuard, incidentslaRouter);
  app.use("/cloudmatiq/tenants/assetmapping", RouteGuard, assetmappingRouter);
  app.use("/cloudmatiq/tenants/exptrmapping", RouteGuard, ExptrMappingRouter);
  app.use("/cloudmatiq/tenants/exptrorchmap", RouteGuard, ExptrOrchMappingRouter);
  app.use("/cloudmatiq/tenants/region", RouteGuard, tenantRegionRouter);
  app.use("/cloudmatiq/notifications", RouteGuard, notificationsRouter);
  app.use("/cloudmatiq/synthetics/updatetxn", RouteGuard, syntheticNtfRouter);
  app.use("/cloudmatiq/notificationsetup", RouteGuard, notificationsetupRouter);
  app.use("/cloudmatiq/deployments", RouteGuard, deploymentsRouter);
  app.use("/cloudmatiq/assets", deploymentsRouter);
  app.use("/cloudmatiq/users/role", RouteGuard, userRolesRouter);
  app.use("/cloudmatiq/role/access", RouteGuard, roleAccessRouter);
  app.use("/cloudmatiq/screens/actions", RouteGuard, screenActionsRouter);
  app.use("/cloudmatiq/screens", RouteGuard, screensRouter);
  app.use("/cloudmatiq/tags", RouteGuard, tagsRouter);
  app.use("/cloudmatiq/tagvalues", RouteGuard, tagvaluesRouter);
  app.use("/cloudmatiq/taggroup", RouteGuard, taggroupRouter);
  app.use("/cloudmatiq/costvisual", RouteGuard, costvisualRouter);
  app.use("/cloudmatiq/deploymentscript", RouteGuard, deploymentscriptRouter);
  app.use("/cloudmatiq/solutions/costs", RouteGuard, solutioncostRouter);
  app.use("/cloudmatiq/instances", RouteGuard, instancesRouter);
  app.use("/cloudmatiq/orchestration", RouteGuard, orchRouter);
  app.use("/cloudmatiq/orch", orchSyncRouter);
  app.use("/cloudmatiq/base/alertconfigs", RouteGuard, alertConfigsRouter);
  app.use("/cloudmatiq/base/wazuh", wazuhRouter);

  //  AWS
  app.use("/cloudmatiq/aws/ami", RouteGuard, awsamiRouter);
  app.use("/cloudmatiq/aws/insttype", RouteGuard, awsinsttypeRouter);
  app.use("/cloudmatiq/aws/key", RouteGuard, awskeysRouter);
  app.use("/cloudmatiq/aws/lb", RouteGuard, awslbRouter);
  app.use("/cloudmatiq/aws/secgrp", RouteGuard, awssecgrpRouter);
  app.use("/cloudmatiq/aws/sgrule", RouteGuard, awssgrulesRouter);
  app.use("/cloudmatiq/aws/sg", RouteGuard, awssgRouter);
  app.use("/cloudmatiq/aws/solution", RouteGuard, awssolutionRouter);
  app.use("/cloudmatiq/aws/sn", RouteGuard, awssubnetRouter);
  app.use("/cloudmatiq/aws/tags", RouteGuard, awstagsRouter);
  app.use("/cloudmatiq/aws/volumes", RouteGuard, awsvolumesRouter);
  app.use("/cloudmatiq/aws/vpc", RouteGuard, awsvpcRouter);
  app.use("/cloudmatiq/aws/zone", RouteGuard, awszoneRouter);
  app.use(
    "/cloudmatiq/aws/deployed/volumesRouteGuard,",
    awsdeployedvolumesRouter
  );
  app.use("/cloudmatiq/aws/deployments", RouteGuard, awsdepoymentsRouter);
  app.use("/cloudmatiq/aws/costvisual", RouteGuard, awscostvisualRouter);
  app.use("/cloudmatiq/aws/common", awscommonRouter);
  app.use("/cloudmatiq/aws/internetgateway", RouteGuard, awsigwRouter);

  // SRM
  app.use("/cloudmatiq/srm/catalog", RouteGuard, srmcatalogRouter);
  app.use("/cloudmatiq/srm/sr", RouteGuard, srmsrRouter);
  app.use("/cloudmatiq/srm/sractions", RouteGuard, srmsractionsRouter);
  app.use("/cloudmatiq/srm/maintwindow", RouteGuard, maintwindowRouter);
  app.use("/cloudmatiq/srm/maintwindowmap", RouteGuard, maintwindowMapRouter);
  app.use("/cloudmatiq/srm/upgraderequest", RouteGuard, upgraderequestRouter);
  app.use("/cloudmatiq/srm/schedulerequest", RouteGuard, schedulerequestRouter);
  app.use(
    "/cloudmatiq/srm/schedulereqdeatil",
    RouteGuard,
    schedulerequestDetailsRouter
  );
  app.use("/cloudmatiq/srm/workflowconfig", RouteGuard, workflowRouter);
  app.use(
    "/cloudmatiq/srm/workflowapprover",
    RouteGuard,
    workflowApproverRouter
  );

  // ECL2
  app.use("/cloudmatiq/ecl2/firewall", RouteGuard, ecl2firewallsRouter);
  app.use("/cloudmatiq/ecl2/gateway", RouteGuard, ecl2internetgatewaysRouter);
  app.use("/cloudmatiq/ecl2/network", RouteGuard, ecl2networksRouter);
  app.use("/cloudmatiq/ecl2/port", RouteGuard, ecl2portsRouter);
  app.use("/cloudmatiq/ecl2/solution", RouteGuard, ecl2solutionsRouter);
  app.use("/cloudmatiq/ecl2/subnet", RouteGuard, ecl2subnetsRouter);
  app.use("/cloudmatiq/ecl2/tags", RouteGuard, ecl2tagsRouter);
  app.use("/cloudmatiq/ecl2/loadbalancer", RouteGuard, ecl2loadbalancersRouter);
  app.use("/cloudmatiq/ecl2/image", RouteGuard, ecl2imagesRouter);
  app.use("/cloudmatiq/ecl2/instancetype", RouteGuard, ecl2instancetypeRouter);
  app.use("/cloudmatiq/ecl2/zone", RouteGuard, ecl2zonesRouter);
  app.use("/cloudmatiq/ecl2/volume", RouteGuard, ecl2volumesRouter);
  app.use("/cloudmatiq/ecl2/key", RouteGuard, ecl2keysRouter);
  app.use("/cloudmatiq/prometheus", dashboardRouter);
  app.use(
    "/cloudmatiq/ecl2/internetservices",
    RouteGuard,
    ecl2internetservicesRouter
  );
  app.use("/cloudmatiq/ecl2/qosoptions", RouteGuard, ecl2qosoptionsRouter);
  app.use(
    "/cloudmatiq/ecl2/firewallplans",
    RouteGuard,
    ecl2firewallplansRouter
  );
  app.use(
    "/cloudmatiq/ecl2/gateway/interface",
    RouteGuard,
    ecl2iginterfaceRouter
  );
  app.use(
    "/cloudmatiq/ecl2/gateway/globalip",
    RouteGuard,
    ecl2igglobalipRouter
  );
  app.use(
    "/cloudmatiq/ecl2/gateway/staticip",
    RouteGuard,
    ecl2igstaticipRouter
  );
  app.use(
    "/cloudmatiq/ecl2/commonfunctiongateway",
    RouteGuard,
    ecl2commonfunctiongatewayRouter
  );
  app.use(
    "/cloudmatiq/ecl2/commonfunctionpool",
    RouteGuard,
    ecl2commonfunctionpoolRouter
  );
  app.use("/cloudmatiq/ecl2/vsrx", RouteGuard, ecl2vsrxRouter);
  app.use("/cloudmatiq/ecl2/vsrxplan", RouteGuard, ecl2vsrxplanRouter);
  app.use("/cloudmatiq/ecl2/common", RouteGuard, ecl2commonRouter);
  app.use("/cloudmatiq/ecl2/lbplan", RouteGuard, ecl2lbplanRouter);
  app.use(
    "/cloudmatiq/ecl2/firewallinterface",
    RouteGuard,
    ecl2firewallinterfaceRouter
  );
  app.use("/cloudmatiq/ecl2/lbinterface", RouteGuard, ecl2lbinterfaceRouter);
  app.use(
    "/cloudmatiq/ecl2/lbsyslogserver",
    RouteGuard,
    ecl2lbsyslogserverRouter
  );
  app.use(
    "/cloudmatiq/ecl2/vsrxinterface",
    RouteGuard,
    ecl2vsrxinterfaceRouter
  );
  app.use("/cloudmatiq/ecl2/lbsettings", RouteGuard, ecl2lbsettingsRouter);
  app.use(
    "/cloudmatiq/ecl2/tenantconnrequest",
    RouteGuard,
    ecl2tenantconnrequestRouter
  );
  app.use(
    "/cloudmatiq/ecl2/tenantconnection",
    RouteGuard,
    ecl2tenantconnectionRouter
  );

  app.use("/cloudmatiq/cloudassets", RouteGuard,nutanixroutes);

  app.use("/cloudmatiq/vmware", vmccommonroutes);

  // ALIBABA
  app.use("/cloudmatiq/ali/deployment", RouteGuard, alideploymentRouter);
  app.use("/cloudmatiq/ali/image", RouteGuard, aliimageRouter);
  app.use("/cloudmatiq/ali/instancetype", RouteGuard, aliinstancetypeRouter);
  app.use("/cloudmatiq/ali/key", RouteGuard, alikeypairRouter);
  app.use("/cloudmatiq/ali/loadbalancer", RouteGuard, alilbRouter);
  app.use("/cloudmatiq/ali/lblistener", RouteGuard, alilblistenerRouter);
  app.use("/cloudmatiq/ali/securitygroup", RouteGuard, alisecuritygroupRouter);
  app.use("/cloudmatiq/ali/sgrule", RouteGuard, alisgrulesRouter);
  app.use("/cloudmatiq/ali/solution", RouteGuard, alisolutionRouter);
  app.use("/cloudmatiq/ali/tag", RouteGuard, alitagRouter);
  app.use("/cloudmatiq/ali/volume", RouteGuard, alivolumeRouter);
  app.use("/cloudmatiq/ali/vpc", RouteGuard, alivpcRouter);
  app.use("/cloudmatiq/ali/vswitch", RouteGuard, alivswitchRouter);
  app.use("/cloudmatiq/ali/zone", RouteGuard, alizonesRouter);

  app.use("/cloudmatiq/nm/asstutl", RouteGuard, asstutlRouter);
  app.use("/cloudmatiq/nm/asstutldetails", asstutlDetailRouter);
  app.use("/cloudmatiq/nm/recommendation", RouteGuard, recommendationRouter);
  app.use(
    "/cloudmatiq/nm/recommendationsetup",
    RouteGuard,
    recommendationSetupRouter
  );

  app.use("/cloudmatiq/nm/asst/budget", RouteGuard, asstbudgetRouter);
  app.use("/cloudmatiq/nm/asst/billing", RouteGuard, asstbillingRouter);
  app.use("/cloudmatiq/nm/asst/daily/billing", asstdailybillingRouter);
  app.use("/cloudmatiq/nm/rightsizegroup", RouteGuard, rightsizegroupRouter);
  app.use("/cloudmatiq/eventlog", eventlogRouter);
  app.use(
    "/cloudmatiq/base/assetrecords/documents",
    RouteGuard,
    assetDocumentsRouter
  );
  app.use(
    "/cloudmatiq/base/assetrecords/comments",
    RouteGuard,
    assetCommentsRouter
  );
  app.use(
    "/cloudmatiq/base/assetrecords/history",
    RouteGuard,
    assetHistoryRouter
  );
  app.use("/cloudmatiq/base/assetrecords/query", RouteGuard, assetQueryRouter);

  app.use("/cloudmatiq/base/dashboardconfigheader", dashboardconfighdrRouter);
  app.use("/cloudmatiq/base/dashboardconfigdetail", dashboardconfigdtlRouter);
  app.use("/cloudmatiq/tenants/servicecredits", servicecreditsRouter);

  app.use("/cloudmatiq/incidents", incidentsRouter);

  app.use("/cloudmatiq/base", hooksRouter);

  app.use("/cloudmatiq/monitoring", MonitoringSummaryRouter);
  app.use("/cloudmatiq/base/commentdoc", RouteGuard, commentdocRouter);

  app.use(
    "/cloudmatiq/tenants/kpi/report/configheader",
    RouteGuard,
    kpireportconfighdrRouter
  );
  app.use(
    "/cloudmatiq/tenants/kpi/report/configdetail",
    RouteGuard,
    kpireportconfigdtlRouter
  );
  app.use("/cloudmatiq/tenants/customer/kpi", RouteGuard, customerkpiRouter);

  // Monitoring
  app.use("/cloudmatiq/monitoring/synthetics", RouteGuard, monitoringRoutes);
  app.use("/cloudmatiq/monitoring/ssl", RouteGuard, monitoringSSLRoutes);
  app.use(
    "/cloudmatiq/tenants/customer/kpi",
    RouteGuard,
    customerkpiRouter
  );
  app.use("/cloudmatiq/ssm", RouteGuard, ssmRouter);
  app.use("/cloudmatiq/secretsmanager", secretsmanagerRouter);
  app.use("/cloudmatiq/tenant/workflow", tnworkflowRoutes);
  app.use("/cloudmatiq/tenant/workflowapprover", tnworkflowapproverRoutes);
  app.use("/cloudmatiq/tenant/workflowactions", tnworkflowactionRoutes);
  app.use("/cloudmatiq/base/workpack", tnworkpackRoutes);
  // app.use("/cloudmatiq/secretsmanager", secretsmanagerRouter);
  // app.use("/cloudmatiq/tenant/workflow", tnworkflowRoutes);
  // app.use("/cloudmatiq/tenant/workflowapprover", tnworkflowapproverRoutes);
  // app.use("/cloudmatiq/tenant/workflowactions", tnworkflowactionRoutes);
  // app.use("/cloudmatiq/base/workpack", tnworkpackRoutes);

  app.use("/cloudmatiq/tenants/tenantsettings", tenantsettingsRouter);
  app.use("/cloudmatiq/tenants/tenantlicenses", tenantlicensesRouter);

  // cicd
  app.use("/cloudmatiq/cicd/releaseworkflow",RouteGuard, workflowRoutes);
  app.use("/cloudmatiq/cicd/releaseconfig", RouteGuard,releaseconfig);
  app.use("/cloudmatiq/cicd/pipelinetemplate/setupmaster", RouteGuard, setupmaster);
  app.use("/cloudmatiq/cicd/pipelinetemplate",RouteGuard, pipelinetemplate);
  app.use("/cloudmatiq/cicd/provider",RouteGuard, provider);
  app.use("/cloudmatiq/cicd/dashboard/count", RouteGuard,dashboard);
  app.use("/cloudmatiq/cicd/containerregistry",RouteGuard, containerregistry);
  app.use("/cloudmatiq/cicd/testtool",RouteGuard, testtool);
  app.use("/cloudmatiq/cicd/environments",RouteGuard, environments);
  app.use("/cloudmatiq/cicd/dashboard/pipelinestatus", RouteGuard,pipelinestatus);
  app.use("/cloudmatiq/cicd/dashboard/pipelinestatusdaily", RouteGuard, pipelinestatusdaily);
  app.use("/cloudmatiq/cicd/customvariable",RouteGuard,customvariable);
  app.use("/cloudmatiq/cicd/build", RouteGuard, build);
  app.use("/cloudmatiq/cicd/resourcemapping",resourcemappingRouter);
  app.use("/cloudmatiq/cicd/pipelinetemplate/nodedetail",RouteGuard,nodeproperties);

  // app.use("/cloudmatiq/secretsmanager", secretsmanagerRouter);
  // app.use("/cloudmatiq/tenant/workflow", tnworkflowRoutes);
  // app.use("/cloudmatiq/tenant/workflowapprover", tnworkflowapproverRoutes);
  // app.use("/cloudmatiq/tenant/workflowactions", tnworkflowactionRoutes);
  // app.use("/cloudmatiq/base/workpack", tnworkpackRoutes);

  // app.use("/cloudmatiq/base/requestmanagement", requestmanagementRoutes );
  // app.use("/cloudmatiq/base/requestmanagementapprover", requestmanagementapproverRoutes );
  app.use("/cloudmatiq/base/contactpoints", contactpointsRoutes)
  app.use("/cloudmatiq/base/history",historyRouter);  
  app.use("/cloudmatiq/base/template",templateRouter)
  app.use("/cloudmatiq/base/watchlist",watchListRoutes)
}

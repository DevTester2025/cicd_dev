export interface IOrchestrationSchedule {
  id: number;
  _orch: number;
  _customer: number;
  _account: number;
  _tenant: number;
  _tag: number;
  _maintwindow: number;
  runtimestamp: string;
  tagvalue: string;
  notes: string;
  totalrun: number;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
  title: string;
  recurring: number;
  repetition: number;
  lastrun: string;
  nextrun: string;
  params: string;
  instances: string;
  trigger: string;
  trigger_meta: string;
}

export interface IOrchestrationLog {
  id: string;
  _tenant: number;
  _customer: number;
  _orchschedule: number;
  _instance: number;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  params?: string;
  lastupdateddt: Date;
}

export interface IInstance {
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
  rightsizeyn: null;
  imageid: null;
  imagerefid: string;
  platform: null;
  instancetypeid: number;
  instancetyperefid: string;
  networkrefid: string;
  securitygroupid: null;
  securitygrouprefid: string;
  subnetid: number;
  subnetrefid: string;
  volumeid: number;
  volumerefid: string;
  keyid: null;
  accountid: number;
  keyrefid: null;
  publicipv4: string;
  privateipv4: string;
  publicdns: string;
  monitoringyn: string;
  deletionprotectionyn: string;
  lbstatus: string;
  emailyn: string;
  notes: string;
  clusterid: null;
  metadata: null;
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
  checksum: string;
  cloudstatus: string;
  promagentstat: null;
  agentid: null;
  wagentstatus: null;
}

export interface IInstanceTag {
  tagvalueid: number;
  tenantid: number;
  cloudprovider: string;
  resourcetype: string;
  resourcerefid: string;
  refid: null;
  tagorder: null;
  resourceid: number;
  taggroupid: null;
  tagid: number;
  tagvalue: string;
  category: null;
  tnregionid: number;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
  tag: ITag;
}

export interface ITag {
  tagid: number;
  tenantid: number;
  resourcetype: null;
  tagname: string;
  tagtype: string;
  regex: null;
  description: null;
  lookupvalues: string;
  required: boolean;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
}

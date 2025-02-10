export interface ICloudDetails {
  cloudprovider: string;
  cloudauthkey: string;
  cloudseckey: string;
  referenceid: string;
  accounttype: "Root Account" | string;
}
export interface ICustomer {
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
  accounts: ICustomerAccount[];
  tenantregion: ITenantRegion[];
  $role: string;
  $_accountid: number;
}

interface ICustomerAccount {
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

interface ITenantRegion {
  tnregionid: number;
  tenantid: number;
  _accountid: number;
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
}

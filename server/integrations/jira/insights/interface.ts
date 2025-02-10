export interface IObjectSchema {
  objectschemas: Objectschema[];
}

export interface Objectschema {
  id: number;
  name: string;
  objectSchemaKey: string;
  status: string;
  created: Date;
  updated: Date;
  objectCount: number;
  objectTypeCount: number;
}

export interface IObjectType {
  id: number;
  name: string;
  type: number;
  icon: Icon;
  position: number;
  created: Date;
  updated: Date;
  objectCount: number;
  parentObjectTypeId: number;
  objectSchemaId: number;
  inherited: boolean;
  abstractObjectType: boolean;
  parentObjectTypeInherited: boolean;
}

export interface Icon {
  id: number;
  name: string;
  url16: string;
  url48: string;
}

export interface IObjectTypeAttribute {
  id: number;
  objectType: IObjectType;
  name: string;
  label: boolean;
  type: number;
  defaultType?: DefaultType;
  typeValueMulti?: string[];
  referenceType?: ReferenceType;
  referenceObjectTypeId?: number;
  referenceObjectType?: IObjectType;
  editable: boolean;
  system: boolean;
  sortable: boolean;
  summable: boolean;
  minimumCardinality: number;
  maximumCardinality: number;
  removable: boolean;
  hidden: boolean;
  includeChildObjectTypes: boolean;
  uniqueAttribute: boolean;
  options: string;
  position: number;
}

export interface DefaultType {
  id: number;
  name: string;
}

export interface IIqlResponse {
  objectEntries: ObjectEntry[];
  objectTypeAttributes: IObjectTypeAttribute[];
  objectTypeId: number;
  objectTypeIsInherited: boolean;
  abstractObjectType: boolean;
  totalFilterCount: number;
  startIndex: number;
  toIndex: number;
  pageObjectSize: number;
  pageNumber: number;
  orderWay: string;
  iql: string;
  iqlSearchResult: boolean;
  conversionPossible: boolean;
  pageSize: number;
}

export interface ObjectAttributeValue {
  value?: string;
  displayValue: string;
  searchValue: string;
  referencedType: boolean;
  status?: Status;
  referencedObject?: ObjectEntry;
}

export interface Attribute {
  id: number;
  objectTypeAttributeId: number;
  objectAttributeValues: ObjectAttributeValue[];
  objectId: number;
}

export interface ObjectEntry {
  id: number;
  label: string;
  objectKey: string;
  avatar: Avatar;
  objectType: ObjectType;
  created: Date;
  updated: Date;
  hasAvatar: boolean;
  timestamp: number;
  attributes?: Attribute[];
  _links: Links;
  name: string;
}

export interface Status {
  id: number;
  name: string;
  category: number;
}

export interface Links {
  self: string;
}

export interface Avatar {
  url16: string;
  url48: string;
  url72: string;
  url144: string;
  url288: string;
  objectId: number;
}

export interface ObjectType {
  id: number;
  name: string;
  type: number;
  icon: Icon;
  position: number;
  created: Date;
  updated: Date;
  objectCount: number;
  parentObjectTypeId: number;
  objectSchemaId: number;
  inherited: boolean;
  abstractObjectType: boolean;
  parentObjectTypeInherited: boolean;
}

export interface Icon {
  id: number;
  name: string;
  url16: string;
  url48: string;
}

export interface ReferenceType {
  id: number;
  name: string;
  color: string;
  url16: string;
  removable: boolean;
}

export interface IAttachment {
  id: number;
  author: string;
  mimeType: string;
  filename: string;
  filesize: string;
  created: Date;
  comment: string;
  commentOutput: string;
  url: string;
}

export interface IObjectComment {
  created: Date;
  updated: Date;
  id: number;
  actor: Actor;
  role: number;
  comment: string;
  commentOutput: string;
  objectId: number;
  canEdit: boolean;
  canDelete: boolean;
}

export interface Actor {
  avatarUrl: string;
  displayName: string;
  name: string;
  key: string;
  renderedLink: string;
  isDeleted: boolean;
}

export interface IObjectHistory {
  actor: Actor;
  id: number;
  affectedAttribute: string;
  oldValue: string;
  newValue: string;
  type: number;
  created: Date;
  objectId: number;
}

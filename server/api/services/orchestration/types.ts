import AppLogger from "../../../lib/logger";

// Related to orchestration flow data
export interface Orchestration {
  version: string;
  diagram: string;
  indicators: any[];
  links: Link[];
  nodes: Node[];
  workflowsettings: Workflowsettings;
}

export interface Link {
  from: string;
  to: string;
  points: Point[];
}

export interface Point {
  x: number;
  y: number;
}

export interface Node {
  name: string;
  params: Params;
  data: Data;
}

export interface Data {
  [key: string]: any;
}

export interface Params {
  id: string;
  label: string;
  x: number;
  y: number;
  data: Data;
}

export interface Workflowsettings {
  name: string;
  description: string;
  logfile: string;
}

// Related to WinRM
export interface WinrmSessionParams {
  host: string;
  port: number;
  path: string;
  auth: string;
  shellId?: string;
  command?: string;
  commandId?: string;
}

// Related to orchestration libs
export interface OrchestrationConfigs {
  sys_ip: string;
  sys_ts_ip: string;
  sys_name: string;
  sys_host_ip: string;
  sys_deploymentid: string;
  [key: string]: string;
}

export interface OrchestrationSettings {
  autocloselogger: boolean;
}
export interface OrchestrationUtils {
  logger: AppLogger;
  onLifeCycleChange?: (data: Record<string, string>) => void;
}

export interface OrchestrationNodeHandlerResponse {
  continue: boolean;
  err?: any;
  payload?: any;
}

export enum OrchestrationMeta {
  STARTTIME = "STARTTIME",
}

export interface IWinRMParams {
  host: string;
  port: number;
  path: string;
  auth: string;
  shellId?: string;
  command?: string;
  commandId?: string;
}

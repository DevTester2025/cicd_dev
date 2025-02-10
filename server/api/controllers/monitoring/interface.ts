export interface MSynthetics {
  id: number;
  tenantid: number;
  type: string;
  name: string;
  instances: null;
  endpoint: string;
  screenshot: boolean;
  recurring: boolean;
  region: string;
  recurring_type: string;
  cron: null;
  rate_in_min: number;
  ref: null;
  status: string;
  createdby: string;
  createddt: Date;
  lastupdatedby: string;
  lastupdateddt: Date;
}
export interface CanaryReport {
  canaryName: string;
  startTime: Date;
  endTime: Date;
  timeSpentInResetInMs: number;
  timeSpentInLaunchInMs: number;
  timeSpentInSetUpInMs: number;
  executionStatus: string;
  executionError: null;
  customerScript: CustomerScript;
  configuration: Configuration;
}

export interface Configuration {
  screenshotConfiguration: ScreenshotConfiguration;
  artifactConfiguration: ArtifactConfiguration;
  reportingConfiguration: ReportingConfiguration;
  loggingConfiguration: LoggingConfiguration;
  executionConfiguration: ExecutionConfiguration;
  stepMetricsConfiguration: StepMetricsConfiguration;
  canaryMetricsConfiguration: { [key: string]: boolean };
  visualMonitoringConfiguration: VisualMonitoringConfiguration;
}

export interface ArtifactConfiguration {
  harFile: boolean;
  stepsReport: boolean;
}

export interface ExecutionConfiguration {
  continueOnStepFailure: boolean;
  continueOnHttpStepFailure: boolean;
}

export interface LoggingConfiguration {
  logRequest: boolean;
  logResponse: boolean;
  logResponseBody: boolean;
  logRequestBody: boolean;
  logRequestHeaders: boolean;
  logResponseHeaders: boolean;
}

export interface ReportingConfiguration {
  includeRequestHeaders: boolean;
  includeResponseHeaders: boolean;
  includeUrlPassword: boolean;
  restrictedHeaders: any[];
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  restrictedUrlParameters: any[];
}

export interface ScreenshotConfiguration {
  screenshotOnStepStart: boolean;
  screenshotOnStepSuccess: boolean;
  screenshotOnStepFailure: boolean;
}

export interface StepMetricsConfiguration {
  stepSuccessMetric: boolean;
  stepDurationMetric: boolean;
}

export interface VisualMonitoringConfiguration {
  visualCompareWithBaseRun: boolean;
  failCanaryRunOnVisualVariance: boolean;
  varianceHighlightHexColor: string;
  visualVarianceThreshold: number;
}

export interface CustomerScript {
  startTime: Date;
  endTime: Date;
  status: string;
  failureReason: null;
  metricsPublished: boolean;
  requests: { [key: string]: number };
  steps: Step[];
  reports: any[];
  nonStepScreenshots: any[];
}

export interface Step {
  stepNum: number;
  stepName: string;
  startTime: Date;
  endTime: Date;
  status: string;
  failureReason: null;
  metricsPublished: boolean;
  sourceUrl: string;
  destinationUrl: string;
  screenshots: Screenshot[];
}

export interface Screenshot {
  fileName: string;
  pageUrl: string;
  error: null;
  visualTestResult: null;
}

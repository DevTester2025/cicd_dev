import * as express from "express";
import monitoringSummaryController from "./summary";
export default express
  .Router()
  .post("/get-summary-metrics", monitoringSummaryController.getMetrics)
  // .post("/get-summary-metrics", monitoringSummaryController.getMetricsDetails);
